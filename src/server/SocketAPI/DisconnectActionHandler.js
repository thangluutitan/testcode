var _ = require('lodash');
var UsersManager = require("../lib/UsersManagerRedis");
var DatabaseManager = require("../lib/DatabaseManager");
var Utils = require("../lib/Utils");
var Const = require("../const");
var SocketHandlerBase = require("./SocketHandlerBase");
var UserModel = require("../Models/UserModel");
var Settings = require("../lib/Settings");
var UserContactModel = require("../Models/UserContactModel");
var async = require('async');

var DisconnectActionHandler = function () {

}

_.extend(DisconnectActionHandler.prototype, SocketHandlerBase.prototype);

DisconnectActionHandler.prototype.attach = function (io, socket) {


    socket.on('disconnect', function () {
        var roomID,user,onlineUsers;
         async.waterfall([
            function (done) {
                    UsersManager.getRoomBySocketID(socket.id,function(err,result){
                        if (err) {
                            done(err,null);
                        }
                        roomID = result;
                        done(null,roomID);                                       
                    });
                   
            },
            function (roomID,done) {
                UsersManager.getUserBySocketID(socket.id,function(err,result){
                        if (err) {
                            done(err,null);
                        }
                        user = result;
                        done(null,user);                                       
                });
            },
            function (roomID,done) {
                UsersManager.getUsers(Const.GlobalRoomID,function(err,result){
                        if (err) {
                            done(err,null);
                        }
                        onlineUsers = result;
                        done(null,onlineUsers);                                       
                });
            }], function (err, result) {
                
                  console.log('Disconected: ' + roomID + user);
                    if (roomID === Const.GlobalRoomID) //exit app
                    {
                        UserModel.findUserbyId(user.userID, function (err, resUser) {
                            var newuser = new DatabaseManager.userModel({
                                _id: resUser._id
                            });

                            newuser.online_status = Const.UserStatusEnum.OffLine;
                            newuser.modified = new Date();
                            UserModel.updateUser(resUser, newuser, function (err, result) {
                                if (err) throw err;
                                
                                UserContactModel.findContactsByUserId(user.userID, function (err, contacts) {
                                    _.forEach(contacts, function (contact) {
                                        var findUser = _.find(onlineUsers, function (o) {
                                            return o.userID === contact.contact_user_id;
                                        });
                                        if (findUser !== undefined) {
                                            var param = {"userID": user.userID, "status": Const.UserStatusEnum.OffLine};
                                            io.of(Settings.options.socketNameSpace).to(findUser.socketID).emit('statusUpdated', param);
                                        }

                                    });

                                });
                                UserModel.findUserbySchoolExclude(resUser.school_code, resUser.userID, function (err, contacts) {
                                    _.forEach(contacts, function (contact) {
                                        var findUser = _.find(onlineUsers, function (o) {
                                            return o.userID === contact.userID;
                                        });
                                        if (findUser !== undefined) {
                                            var param = {"userID": user.userID, "status": Const.UserStatusEnum.OffLine};
                                            console.log("emit offline event :");
                                            io.of(Settings.options.socketNameSpace).to(findUser.socketID).emit('statusUpdated', param);
                                        }

                                    });

                                });
                            });

                        });
                        return;
                    }

                    if (!_.isNull(user)) {
                        UsersManager.removeUser(roomID, user.userID,socket.id);
                        socket.leave(roomID);

                        io.of(Settings.options.socketNameSpace).in(roomID).emit('userLeft', user);

                        if (Settings.options.sendAttendanceMessage) {

                            //save as message
                            UserModel.findUserbyId(user.userID, function (err, user) {

                                // save to database
                                var newMessage = new DatabaseManager.messageModel({
                                    user: user._id,
                                    userID: user.userID,
                                    roomID: roomID,
                                    message: '',
                                    type: Const.messageUserLeave,
                                    created: Utils.now()
                                });

                                newMessage.save(function (err, message) {
                                    if (err) throw err;
                                    var messageObj = message.toObject();
                                    messageObj.user = user.toObject();

                                    io.of(Settings.options.socketNameSpace).in(roomID).emit('newMessage', messageObj);

                                });

                            });

                        }

                    } else {
                        return;
                    }
            });
        
    });

}


module["exports"] = new DisconnectActionHandler();