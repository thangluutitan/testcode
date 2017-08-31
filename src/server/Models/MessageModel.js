var mongoose = require('mongoose');
var _ = require('lodash');
var async = require('async');
var Const = require('../const.js');
var Util = require('../lib/Utils');
var UserModel = require('./UserModel');
var Settings = require("../lib/Settings");

var MessageModel = function () {

};

MessageModel.prototype.model = null;

MessageModel.prototype.init = function () {

    // Defining a schema
    var messageSchema = new mongoose.Schema({
        user: {type: mongoose.Schema.Types.ObjectId, index: true},
        localID: {type: String, index: true},
        userID: {type: String, index: true},
        roomID: {type: String, index: true},
        type: Number,
        message: String,
        image: String,
        file: {
            file: {
                id: mongoose.Schema.Types.ObjectId,
                name: String,
                size: Number,
                mimeType: String
            },
            thumb: {
                id: mongoose.Schema.Types.ObjectId,
                name: String,
                size: Number,
                mimeType: String
            }
        },
        seenBy: [],
        deletedBy: [],
        blockedBy: [],
        location: {
            lat: Number,
            lng: Number
        },
        deleted: Number,
        created: Number,
        attributes: {}
    });

    // add instance methods
    messageSchema.methods.addSeenBy = function (user, callBack) {

        var seenBy = this.seenBy;
        var self = this;

        var listOfUsers = [];

        _.forEach(seenBy, function (seenObj) {

            listOfUsers.push(seenObj.user);

        });

        if (_.indexOf(listOfUsers, user._id) == -1) {

            seenBy.push({user: user._id, at: Util.now()});

            this.update({
                seenBy: seenBy
            }, {}, function (err, userResult) {

                if (callBack)
                    callBack(err, self);

            });


        }

    }


    this.model = mongoose.model(Settings.options.dbCollectionPrefix + "messages", messageSchema);
    return this.model;

}

MessageModel.prototype.findMessagebyId = function (id, callBack) {

    this.model.findOne({_id: id}, function (err, user) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, user);
        }


    });

}

MessageModel.prototype.findMessagesByRoomID = function (roomID, callBack) {

    var query = this.model.find({roomID: roomID}).sort({'created': 'desc'});

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });

}

MessageModel.prototype.findAllMessages = function (roomID, lastMessageID, userID, left_time, callBack) {

    var self = this;

    this.model.findOne({_id: lastMessageID}, function (err, message) {

        if (err) callBack(err, null)

        var query = {
            roomID: roomID,
            deleted: null,
            "deletedBy.userID": {"$nin": [userID]},
            "blockedBy.userID": {"$nin": [userID]}
        };

        if (message) {
            var lastCreated = message.created;
            if (left_time > 0 && lastCreated > left_time)
                lastCreated = left_time;
            query.created = {$gt: lastCreated};
        }
        else if (left_time > 0) {
            query.created = {$gt: left_time};
        }

        query = self.model.find(query).sort({'created': 'desc'});

        query.exec(function (err, data) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, data);
            }

        });


    });

}

MessageModel.prototype.findMessages = function (roomID, lastMessageID, userID, limit, callBack) {

    if (lastMessageID !== "0") {

        var self = this;

        this.model.findOne({_id: lastMessageID}, function (err, message) {

            if (err) return console.error(err);

            var lastCreated = message.created;

            var query = self.model.find({
                roomID: roomID,
                deleted: null,
                "deletedBy.userID": {"$nin": [userID]},
                "blockedBy.userID": {"$nin": [userID]},
                created: {$lt: lastCreated}
            }).sort({'created': 'desc'}).limit(limit);

            query.exec(function (err, data) {

                if (typeof callBack === 'function') {
                    if (err) return callBack(err, null);
                    callBack(null, data);
                }

            });


        });

    } else {

        var query = this.model.find({
            roomID: roomID,
            deleted: null,
            "deletedBy.userID": {"$nin": [userID]},
            "blockedBy.userID": {"$nin": [userID]}
        }).sort({'created': 'desc'}).limit(limit);

        query.exec(function (err, data) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, data);
            }

        });


    }

}

MessageModel.prototype.findActiveMessages = function (roomID, userID, lastMessageID, limit, left_time, callBack) {

    if (lastMessageID !== "0") {

        var self = this;

        this.model.findOne({_id: lastMessageID}, function (err, message) {

            if (err) return console.error(err);

            var lastCreated = 0;
            if (message) {
                lastCreated = message.created;
                if (left_time > 0 && lastCreated > left_time)
                    lastCreated = left_time;
            }
            else if (left_time > 0) {
                lastCreated = left_time;
            }
            var conditions = [
                {roomID: roomID},
                {created: {$lt: lastCreated}},
                {deleted: null},
                {"deletedBy.userID": {"$nin": [userID]}},
                {"blockedBy.userID": {"$nin": [userID]}}
            ];
            var query = self.model.find({
                $and: conditions
            }).sort({'created': 'desc'}).limit(limit);

            query.exec(function (err, data) {

                if (typeof callBack === 'function') {
                    if (err) return callBack(err, null);
                    callBack(null, data);
                }

            });


        });

    } else {
        var conditions = [
            {roomID: roomID},
            {deleted: null},
            {"deletedBy.userID": {"$nin": [userID]}},
            {"blockedBy.userID": {"$nin": [userID]}}
        ];
        if (left_time > 0) conditions.push({created: {$lt: left_time}});
        var query = this.model.find({
            $and: conditions
        }).sort({'created': 'desc'}).limit(limit);

        query.exec(function (err, data) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, data);
            }

        });


    }

}

/// param groupId/userId is ObjectId
/// If userId is string then function will convert to ObjectId
MessageModel.prototype.findUnSeenMessages = function (arrGroups, findUser, arrBlockUsers, user_groups, callBack) {

    var arrGroupIds = [];
    var arrUserIds = [];
    var filterArrGroups = [];

    _.forEach(arrGroups, function (group) {
        var lstUsers = [];
        _.forEach(group.hiddenBy, function (obj) {
            lstUsers.push(obj.userID);
        });
        if (_.indexOf(lstUsers, findUser.userID) == -1) {
            filterArrGroups.push(group);
        }

    });

    arrGroups = filterArrGroups;
    _.forEach(arrGroups, function (group) {

        arrGroupIds.push(group._id.toString());
        arrUserIds.push(group.to_user);


    });

    var query = this.model.find({
        roomID: {"$in": arrGroupIds},
        deleted: null,
        "deletedBy.userID": {"$nin": [findUser.userID]},
        "blockedBy.userID": {"$nin": [findUser.userID]},//Do not get messages from blocked user
        type: {"$nin": [Const.messageNewUser]}//remove , Const.messageUserLeave
    }).sort({'created': 'desc'});

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);

            UserModel.getUsersInList(arrUserIds, function (err, users) {
                if (err) return callBack(err, null);
                countUnSeen(data, arrGroups, users, findUser, user_groups, function (err, result) {
                    if (err) return callBack(err, null);
                    callBack(err, result);
                });

            });
        }

    });


}


MessageModel.prototype.findMediaMessages = function (param, callBack) {
    //roomID limit page 
    var offset = 0;
    if (param.page > 1) {
        offset = (param.page - 1) * param.limit;
    }
    var query = this.model.find({
        $and: [
            {roomID: param.roomID},
            {file: {$ne: null}},
            {
                $or: [
                    {"file.file.mimeType": "image/jpeg"},
                    {"file.file.mimeType": "image/png"},
                    {"file.file.mimeType": "image/gif"},
                    {"file.file.mimeType": "video/mpeg"},
                    {"file.file.mimeType": "video/mp4"},
                    {"file.file.mimeType": "video/avi"},
                    {"file.file.mimeType": "audio/mp3"},
                    {"file.file.mimeType": "audio/wav"},
                    {"file.file.mimeType": "audio/mpeg"},
                    {"file.file.mimeType": "application/ogg"}
                ]
            }
        ]
    }).skip(offset)
        .limit(param.limit)
        .sort({'created': 'desc'});

    query.exec(function (err, result) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, result);
        }

    });


}

var countUnSeen = function (messages, groups, users, findUser, user_groups, callBack) {
    var filterMessages = [];
    async.waterfall([
            function (done) {
                var arrUserIDInLastMessages = [];
                _(messages)
                    .groupBy('roomID')
                    .map(function (items) {
                        var tmpUser = _.find(arrUserIDInLastMessages, function (id) {
                            return id === items[0].userID
                        });

                        if (tmpUser === undefined) {
                            arrUserIDInLastMessages.push(new RegExp("^" + items[0].userID + "$", "g"));
                        }
                        var tmpUG = _.find(user_groups, function (o) {
                            return o.group_id.toString() === items[0].roomID && o.has_left != null && o.has_left == true
                        });

                        if (tmpUG != null) {
                            var msgs = items.filter(function (message) {
                                return message.created >= tmpUG.left_time;
                            });
                            msgs.map(function (m) {
                                filterMessages.push(m);
                            })

                        }
                        return items[0];
                    }).value();
                done(null, arrUserIDInLastMessages);
            },
            function (arrUserIDs, done) {
                UserModel.getUsersInList(arrUserIDs, function (err, lastMessageUsers) {
                    if (err) return done(err, null);
                    messages = messages.filter(function (el) {
                        return filterMessages.indexOf(el) < 0;
                    });
                    done(null, lastMessageUsers);
                });
            },
            function (lastMessageUsers, done) {

                groups
                    .map(function (doc) {

                        delete doc._doc.__v;
                        if (!doc._doc.is_group) {
                            if (users !== null) {
                                users.map(function (user) {
                                    if (findUser.userID === doc.to_user) {
                                        doc.name = findUser.name;
                                    }
                                    else {
                                        if (user.userID === doc.to_user) {
                                            doc._doc.name = user.name;
                                        }
                                    }

                                });
                            }
                        }
                        //Count unseen and append last meassage
                        doc._doc.unseen = 0;
                        doc._doc.lastmessage = null;
                        var tmpMessage = null;

                        _(messages)
                            .groupBy('roomID')
                            .map(function (items, itemId) {
                                if (doc._id.toString() === itemId) {

                                    var count = items.filter(function (message) {
                                        return isUnSeenMessage(message.seenBy, findUser._id) && message.userID != findUser.userID;
                                    }).length;

                                    return tmpMessage = {
                                        unseen: count,
                                        lastmessage: items[0]
                                    };

                                }
                            }).value();

                        if (tmpMessage != null) {
                            doc._doc.unseen = tmpMessage.unseen;
                            doc._doc.lastmessage = tmpMessage.lastmessage;

                            var tmpUser = _.find(lastMessageUsers, function (o) {
                                return o._doc.userID === tmpMessage.lastmessage.userID
                            });
                            if (tmpUser !== undefined) {
                                doc._doc.lastmessage._doc.userName = tmpUser.name;
                            }
                            doc._doc.last_activity_date = tmpMessage.lastmessage.created;
                        }
                        else {
                            doc._doc.last_activity_date = doc.created;
                        }


                    });
                done(null, groups);
            }],
        function (err, result) {
            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(err, result);
            }

        });


}


var isUnSeenMessage = function (seenby, messageObjId) {
    var count = seenby.filter(function (value) {
        return value.user.toString() == messageObjId.toString();
    }).length;
    return count <= 0;
}

MessageModel.prototype.FindMediaOfIndivialConservation = function (roomId, callBack) {
    var query = this.model.find({
        $and: [
            {'roomID': roomId},
            {'type': Const.messageTypeFile},
            {"file.file.mimeType": {"$regex": "^audio|^video|^image"}}
        ]
    });

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });
}

MessageModel.prototype.populateMessages = function (messages, callBack) {

    if (!_.isArray(messages)) {

        messages = [messages];

    }

    // collect ids
    var ids = [];

    messages.forEach(function (row) {

        // get users for seeny too
        _.forEach(row.seenBy, function (row2) {
            ids.push(row2.user);
        });

        ids.push(row.user);

    });

    if (ids.length > 0) {

        UserModel.findUsersbyInternalId(ids, function (err, userResult) {

            var resultAry = [];
            _.forEach(messages, function (messageElement, messageIndex, messagesEntity) {

                var obj = messageElement.toObject();
                _.forEach(userResult, function (userElement, userIndex) {
                    // replace user to userObj
                    if (messageElement.user.toString() == userElement._id.toString()) {
                        obj.user = userElement.toObject();
                    }

                });

                var seenByAry = [];
                // replace seenby.user to userObj
                _.forEach(messageElement.seenBy, function (seenByRow) {
                    _.forEach(userResult, function (userElement, userIndex) {
                        // replace user to userObj
                        if (seenByRow.user.toString() == userElement._id.toString()) {
                            seenByAry.push({
                                user: userElement,
                                at: seenByRow.at
                            });
                        }
                    });
                });
                obj.seenBy = seenByAry;
                resultAry.push(obj);
            });
            callBack(err, resultAry);
        });

    } else {
        callBack(null, messages);
    }

}


module["exports"] = new MessageModel();