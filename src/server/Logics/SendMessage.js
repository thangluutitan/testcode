var DatabaseManager = require("../lib/DatabaseManager");
var Utils = require("../lib/Utils");
var Const = require("../const");
var async = require('async');
var UserModel = require("../Models/UserModel");
var MessageModel = require("../Models/MessageModel");
var Settings = require("../lib/Settings");
var Observer = require("node-observer");
var PushNotificationHandler = require("../WebAPI/PushNotificationHandler");
var GroupModel = require("../Models/GroupModel");
var SocketAPIHandler = require('../SocketAPI/SocketAPIHandler');
var UserBlockModel = require("../Models/UserBlockModel");
var UserContactModel = require("../Models/UserContactModel");
var NotificationUtils = require("../lib/NotificationUtils");
var SendMessage = {
    execute: function (userID, param, onSucess, onError) {

        //save to DB
        var currentUser;
        var isBlock = false;
        var objMessage = {};

        async
            .waterfall([
                function (done) {
                    UserModel.findUserbyId(userID, function (err, user) {

                        currentUser = user;
                        objMessage = {
                            user: user._id,
                            userID: userID,
                            roomID: param.roomID,
                            message: param.message,
                            localID: param.localID,
                            type: param.type,
                            file: null,
                            attributes: param.attributes,
                            created: Utils.now()
                        };

                        if (!Utils.isEmpty(param.file)) {

                            objMessage.file = {
                                file: {
                                    id: param.file.file.id,
                                    name: param.file.file.name,
                                    size: param.file.file.size,
                                    mimeType: param.file.file.mimeType
                                }
                            };

                            if (!Utils.isEmpty(param.file.thumb)) {

                                objMessage.file.thumb = {
                                    id: param.file.thumb.id,
                                    name: param.file.thumb.name,
                                    size: param.file.thumb.size,
                                    mimeType: param.file.thumb.mimeType
                                };

                            }

                        }


                        if (!Utils.isEmpty(param.location)) {
                            objMessage.location = param.location;
                        }

                        if (Utils.isEmpty(param.localID)) {
                            objMessage.localID = Utils.randomString(32, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_") + Utils.now();
                        } else {
                            objMessage.localID = param.localID;
                        }

                        if (param.type) {
                            switch (param.type) {
                                case Const.messageUserLeave:
                                    objMessage.message = user.name + " " + Const.leftGroupMessage;
                                    param.message = objMessage.message;
                                    break;
                                case Const.messageUserJoinGroup:
                                    objMessage.message = user.name + " " + Const.joinGroupMessage;
                                    param.message = objMessage.message;
                                    break;
                                case Const.messageCreateNewGroup:
                                    objMessage.message = user.name + " " + Const.createdGroupMessage + " " + param.groupName;
                                    param.message = objMessage.message;
                                    break;
                                case Const.messageUpdateGroup:
                                    objMessage.message = user.name + " " + Const.updatedGroupMessage;
                                    param.message = objMessage.message;
                                    break;
                                case Const.messageTypeText :
                                    param.message = user.name + ": " + objMessage.message;
                                    break;
                                case Const.messageTypeFile :
                                    param.message = user.name + ": " + Const.sentFileMessage;
                                    break;
                                case Const.messageTypeLocation:
                                    param.message = user.name + ": " + Const.sentLocationMessage;
                                    break;
                                case Const.messageTypeContact:
                                    param.message = user.name + ": " + Const.sentContactMessage;
                                    break;
                                case Const.messageTypeSticker :
                                    param.message = user.name + ": " + Const.sentStickerMessage;
                                    break;
                                default:
                                    break;

                            }
                        }

                        done(null, param);
                    });
                },
                function (param, done) {
                    GroupModel.findGroupbyObjectId(param.roomID, function (err, result) {
                        if (result !== null ) {
                            param.is_group = result.is_group;
                            param.to_user = result.to_user;

                            var updateGroup = result;
                            updateGroup.hiddenBy = [];
                            GroupModel.updateGroup(result, updateGroup, function (err,res) {
                                if (err) {
                                    if (onError)
                                        return onError(err);
                                }
                                if (result.is_group) {
                                    param.groupName = result.name;
                                    param.avatar_file_id = result.avatar_file_id;
                                    param.avatar_thumb_file_id = result.avatar_thumb_file_id;
                                    done(null, param);
                                } else {
                                    var toUser = userID == result.to_user ? result.user_id : result.to_user;
                                    UserContactModel.findUserContact(toUser, userID, function (err, userContact) {
                                        if (err) {
                                            if (onError)
                                                return onError(err);
                                        }

                                        if (userContact[0] == null) {
                                            param.groupName = currentUser.email;
                                        }
                                        else {
                                            param.groupName = currentUser.name;
                                        }
                                        param.avatar_file_id = currentUser.avatar_file_id;
                                        param.avatar_thumb_file_id = currentUser.avatar_thumb_file_id;
                                        UserBlockModel.findbyUserIdAndBlockUserId(toUser, userID, function (err, blockUser) {
                                            if (err) {
                                                if (onError)
                                                    return onError(err);
                                            }
                                            if (blockUser !== null) {
                                                isBlock = true;
                                                objMessage.blockedBy = [];
                                                objMessage.blockedBy.push({userID: blockUser.user_id, at: Utils.now()});
                                            }
                                            done(null, param);
                                        });
                                    });

                                }
                            })//update

                        }


                    });
                }
            ], function (err, result) {
                // save to database
                var newMessage = new DatabaseManager.messageModel(objMessage);
                newMessage.save(function (err, message) {

                    if (err) {
                        if (onError)
                            return onError(err);
                    }

                    MessageModel.populateMessages(message, function (err, data) {

                        var messageObj = data[0];
                        messageObj.localID = data[0].localID;
                        messageObj.deleted = 0;
                        if (!Utils.isEmpty(param.localID))
                            messageObj.localID = param.localID;
                        SocketAPIHandler.io.of(Settings.options.socketNameSpace).in(param.roomID).emit('newMessage', data[0]);
                        Observer.send(this, Const.notificationSendMessage, data[0]);

                        if (onSucess)
                            onSucess(message);

                        if (isBlock) return;

                        var addNotficationParams ={
                            from_user_id : userID,
                            group_id : param.roomID,
                            message : param.message,
                            target_type: param.is_group ? "group_posts": "direct_messages"

                        }

                        NotificationUtils.addNotification(addNotficationParams,function (err, results) {
                            if(err) {
                                console.log("Error addNotification");
                            }else{
                                console.log("addNotification success");
                                var pushNotification = new PushNotificationHandler(param);
                                pushNotification.SendGroupBundle();
                            }
                        })



                    });

                });

            });


    }
}

module["exports"] = SendMessage;