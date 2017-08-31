var _ = require('lodash');
var async = require('async');
var redis = require('redis');

var redisConfig = {
    host: process.env['REDIS_HOST'] || '127.0.0.1',
    port: process.env['REDIS_PORT'] || '6379'

}

if (process.env['REDIS_PASSWORD']) {
    redisConfig.password = process.env['REDIS_PASSWORD'];
}

var client = redis.createClient(redisConfig);

client.on('connect', function () {
    console.log('Got the connection.');
});

client.on('error', function (err) {
    console.log('error event - ' + client.host + ':' + client.port + ' - ' + err);
});

var RedisUtils = {
    rooms: {},
    client: client,
    addUser: function (id, name, avatarURL, roomID, token) {

        client.sadd('Rooms', roomID, redis.print);
        client.sadd([roomID, id], redis.print);
        client.hmset(['user:' + id, 'userID', id, 'name', name, 'avatarURL', avatarURL, 'roomID', roomID, 'token', token, 'socketID', ''], redis.print);

    },
    userJoin: function (id, name, avatarURL, roomID, token) {

        client.sadd('Rooms', roomID, redis.print);
        client.hmset(['user:' + id, 'userID', id, 'name', name, 'avatarURL', avatarURL, 'roomID', roomID, 'token', token, 'socketID', ''], redis.print);

    },
    removeUser: function (roomID, userID, socketID) {
        var multi = client.multi();
        multi.del('user:' + userID);
        multi.srem(roomID, userID);
        multi.del(socketID);
        multi.exec(function (err, replies) {
            console.error(replies);
        });
        client.exists(roomID, function (err, result) {
            if (!result)
                client.srem('Rooms', roomID);
        })
        console.log('done');
    },
    removeUserOutOfRoom: function (roomID, userID) {

        client.srem(roomID, userID);
        console.log('done');
    },
    getUsers: function (roomID, callBack) {
        var usersAry = [];

        client.smembers(roomID, function (err, replies) {
            if (err) {
                return console.error('error response - ' + err);
            }

            var multi = client.multi();
            _.forEach(replies, function (userId) {

                multi.hgetall('user:' + userId);


            });
            // drains multi queue and runs atomically
            multi.exec(function (err, replies) {

                _.forEach(replies, function (reply) {
                    usersAry.push(reply);
                });

                if (typeof callBack === 'function') {
                    if (err) return callBack(err, null);
                    callBack(null, usersAry);
                }

            });

        });

    },
    getRoomByUserID: function (userID, callBack) {
        var roomsAry = [];
        client.smembers('Rooms', function (err, replies) {
            if (err) {
                return console.error('error response - ' + err);
            }
            var counter = 0;
            _.forEach(replies, function (roomId) {

                client.sismember(roomId, userID, function (err, reply) {
                    if (err) throw err;
                    if (reply)
                        roomsAry.push(roomId);
                    counter++;
                    if (counter % replies.length == 0) {
                        if (typeof callBack === 'function') {
                            if (err) return callBack(err, null);
                            callBack(null, roomsAry);
                        }
                    }
                });


            });


        });


    },
    pairSocketIDandUserID: function (userID, socketID, roomId) {

        client.hset('user:' + userID, 'socketID', socketID);
        client.set(socketID, userID);


    },
    getUserBySocketID: function (socketID, callBack) {
        var userResult = null;
        async.waterfall([
            function (done) {
                client.get(socketID, function (err, userID) {
                    if (err) {
                        return console.error('error response - ' + err);
                    }
                    done(null, userID);
                });

            },
            function (userID, done) {
                if (userID == null)
                    return done(null, userResult);

                client.hgetall('user:' + userID, function (err, reply) {
                    if (err) {
                        return console.error('error response - ' + err);
                    }
                    userResult = reply;
                    done(null, userResult);

                });

            }], function (err, result) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, result);

            }
        });
    },
    getRoomBySocketID: function (socketID, callBack) {

        var roomResult = null;
        async.waterfall([
            function (done) {
                client.get(socketID, function (err, userID) {
                    if (err) {
                        return console.error('error response - ' + err);
                    }
                    done(null, userID);
                });

            },
            function (userID, done) {
                if (userID == null)
                    return done(null, roomResult);

                client.smembers('Rooms', function (err, replies) {
                    if (err) {
                        return console.error('error response - ' + err);
                    }
                    var counter = 0;
                    _.forEach(replies, function (roomId) {

                        client.sismember(roomId, userID, function (err, reply) {
                            if (err) throw err;
                            if (reply) {
                                roomResult = roomId;
                                return done(null, roomResult);
                            }

                            counter++;
                            if (counter % replies.length == 0) {
                                done(null, roomResult);
                            }
                        });


                    });


                });
            }
        ], function (err, result) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, result);

            }
        });


    }


}

module["exports"] = RedisUtils;