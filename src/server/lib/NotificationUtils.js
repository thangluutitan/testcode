var Utils = require("../lib/Utils");
var Const = require("../const");
var _ = require('lodash');
var UserModel = require("../Models/UserModel");
var GroupModel = require("../Models/GroupModel");
var UserGroupModel = require("../Models/UserGroupModel");
var NotificationModel = require("../Models/NotificationModel");
var DatabaseManager = require("../lib/DatabaseManager");
var Observer = require("node-observer");
var FCM = require('fcm-node');
var async = require('async');

var NotificationUtils = function () {

};


NotificationUtils.prototype.addNotification = function (params, callBack) {

    if (!params.from_user_id || params.from_user_id.length <= 0) {
        return callBack(true,[]);
    }

    if (!params.group_id || params.group_id.length == 0) {
        return callBack(true,{"errorMessage":"missing or wrong params"});
    }

    if (!params.message || params.message.length == 0) {
        return callBack(true,{"errorMessage":"missing or wrong params"});
    }
    var message = params.message;
    var target_type = "";
    if (params.target_type === "direct_messages" || params.target_type === "group_posts") {
        target_type = params.target_type;
    }else{
        return callBack(true,{"errorMessage":"missing or wrong params"});
    }


    var groupId = params.group_id;
    var from_user_id = params.from_user_id;

    async.waterfall([
        function (next) {
            //Get all user from group_id exclude from_user_id
            UserGroupModel.findbyGroupIdExcludeUser(groupId, from_user_id, function (err, result) {
                if (err) {
                    next(err,result)
                }
                next(null,result)

            });

        },
        function (users, next) {
            var notifyItems = [];
            _.each(users,function (user) {
                let newNotify = new DatabaseManager.notificationModel();
                newNotify.from_user_id = from_user_id;
                newNotify.user_id = user._doc.user_id;
                newNotify.to_group_id = groupId;
                newNotify.target_type = target_type;
                newNotify.message = message;
                newNotify.user_image_url = "";
                newNotify.created = Utils.now();
                notifyItems.push(newNotify);
            })
            next(null,notifyItems);
        },
        function (arrNotify, next) {
            if (_.isArray(arrNotify) && arrNotify.length > 0) {
                NotificationModel.insertMany(arrNotify, function (err, result) {
                    if(err){
                        next(err,null);
                    }else{
                        next(null, result);
                    }
                });
            } else {
                next(null, arrNotify);
            }
        }
    ],function (err, finalResult) {
        if(err){
            return callBack(true,{"errorMessage":"Error while add notification"});
        }

        callBack(null, finalResult);
    });

}

NotificationUtils.prototype.removeNotification = function (params, callBack) {
    if (!params.user_id || params.user_id.length <= 0) {
        return callBack(true,[]);
    }

    if (!params.group_id || params.group_id.length == 0) {
        return callBack(true,{"errorMessage":"missing or wrong params"});
    }

    NotificationModel.removeMany(params.group_id, params.user_id,function (err, result) {

        if (typeof callBack !== 'function') return;
        if (err){
            callBack(err,result);
        }else{
            callBack(null,result);
        }
    })
}



NotificationUtils.prototype.GetPayLoadBundleData = function (ids, callback) {
    var payloadData = {};
    var arrGroupId = [];
    var arrUserId = [];
    async.waterfall([function (next) {

        NotificationModel
            .findByUserInList(ids, function (err, data) {
                var groupsByUserID = _.groupBy(data, function (noti) {
                    return noti._doc.user_id;
                })
                Object.keys(groupsByUserID).map(function (key) {
                    payloadData[key] = {};
                    let groupsByGroup = _.groupBy(groupsByUserID[key], function (noti) {
                        return noti._doc.to_group_id;
                    })
                    payloadData[key].message_count = groupsByUserID[key].length;
                    payloadData[key].conversation_count = Object.keys(groupsByGroup).length;

                    Object.keys(groupsByGroup).map(function (group) {
                        arrGroupId.push(group);
                    })
                    // if (payloadData[key].conversation_count === 1){
                    //     payloadData[key].lastMessge =
                    // }
                    payloadData[key].items = groupsByUserID[key];
                    var endIndex = payloadData[key].message_count ? payloadData[key].message_count : 0;
                    if (endIndex > 7) {
                        endIndex = 7;
                    }
                    payloadData[key].endIndex = endIndex;

                    for (var i = 0; i < endIndex; i++) {
                        var findUser = _.find(arrUserId, function (o) {
                            return o === payloadData[key].items[i]._doc.user_id;
                        });
                        if (findUser === undefined) {
                            arrUserId.push(payloadData[key].items[i]._doc.user_id);
                        }

                        findUser = _.find(arrUserId, function (o) {
                            return o === payloadData[key].items[i]._doc.from_user_id;
                        });
                        if (findUser === undefined) {
                            arrUserId.push(payloadData[key].items[i]._doc.from_user_id);
                        }


                    }

                    return groupsByUserID[key];
                });
                next(null, arrUserId);
                //build inbox message
            });

    }, function (arrUser, next) {
        GroupModel.findGroups(arrGroupId,function (err, groups) {
            if (err) {
                next(err, null)
            } else if (_.isArray(groups) && groups.length > 0) {
                next(null,groups);
            }
        });

    }, function (arrGroup, next) {


        UserModel.getUsersInList(arrUserId, function (err, users) {
            if (err) {
                next(err, null)
            } else if (_.isArray(users) && users.length > 0) {

                Object.keys(payloadData).map(function (key) {
                    payloadData[key].inboxs = [];

                    if (payloadData[key].conversation_count == 1) {
                        payloadData[key].lastMessage = payloadData[key].items[payloadData[key].message_count - 1]._doc.message;
                    }
                    for (var i = 0; i < payloadData[key].endIndex; i++) {
                        let inboxItem = {};
                        inboxItem.user_id = payloadData[key].items[i]._doc.user_id;
                        inboxItem.from_user_id = payloadData[key].items[i]._doc.from_user_id;
                        inboxItem.message = payloadData[key].items[i]._doc.message;
                        inboxItem.target_type = payloadData[key].items[i]._doc.target_type;
                        inboxItem.to_group_id = payloadData[key].items[i]._doc.to_group_id;
                        var findUser = _.find(users, function (u) {
                            return u._doc.userID === inboxItem.user_id;
                        });
                        if (findUser !== undefined) {
                            inboxItem.user_name = Utils.Ellipsize( findUser._doc.name,Const.ellipsize,"..");
                        }

                        findUser = _.find(users, function (u) {
                            return u._doc.userID === inboxItem.from_user_id;
                        });
                        if (findUser !== undefined) {
                            inboxItem.from_user_name = Utils.Ellipsize( findUser._doc.name,Const.ellipsize ,"..");
                        }

                        var findGroup = _.find(arrGroup, function (group) {
                            return group._id.toString() === inboxItem.to_group_id;
                        });

                        if (findGroup !== undefined) {
                            inboxItem.groupName = Utils.Ellipsize( findGroup._doc.name,Const.ellipsize,"..");
                        }

                        inboxItem.boldLength = inboxItem.user_name.length + 3 + inboxItem.from_user_name.length;
                        //arrGroup
                        if (inboxItem.target_type == "group_posts"){
                            inboxItem.message = inboxItem.from_user_name + " @ " + inboxItem.groupName + ": " + inboxItem.message;
                            inboxItem.boldLength = inboxItem.from_user_name.length + 3 + inboxItem.groupName.length;
                        }else{
                            inboxItem.message = inboxItem.from_user_name + ": " + inboxItem.message;
                            inboxItem.boldLength = inboxItem.from_user_name.length + 1;
                        }

                        payloadData[key].inboxs.push(inboxItem);
                    }
                    delete  payloadData[key].items;
                })


                next(null, payloadData)
            } else {
                next(err, null)
            }
        });

    }], function (err, finalResult) {
        if (err || Utils.isEmpty(finalResult)) {
            callback(err, finalResult);
        } else {
            callback(null, payloadData);
        }

    });

}

NotificationUtils.prototype.GetUserInfo = function (userID, callBack) {
    var arrUserIds = [userID];
    var arrayUser = [];


    UserModel.getUsersInList(arrUserIds, function (err, users) {
        if (err) throw err;
        users.map(function (user) {
            if (!Utils.isEmpty(user.android_push_token))
                arrayUser.push(user);
        });
        if (callBack)
            callBack(arrayUser);
    });

}

NotificationUtils.prototype.ReSendGroupBundle = function (param,callback) {
    this.paramInfo = param;
    var fcmCli = new FCM(Const.fcm_server_api_key);
    //required param fields :  userID, roomID, message

    var payloadGroup = {
        registration_ids: [],
        data: {
            userid: this.paramInfo.userID,
            isNeedUpdate: this.paramInfo.isNeedUpdate,
            roomID: this.paramInfo.roomID,
            groupName: this.paramInfo.groupName,
            avatar_file_id: this.paramInfo.avatar_file_id,
            avatar_thumb_file_id: this.paramInfo.avatar_thumb_file_id,
            is_group: this.paramInfo.is_group,
            message: this.paramInfo.message,
            to_user: this.paramInfo.to_user,
            type: this.paramInfo.type,
            title: this.paramInfo.groupName,
            body: this.paramInfo.message,
            sound: "default", badge: "1",
            inboxs: "",
            message_count: 0,
            conversation_count: 0

        },
        priority: 'high',
        content_available: true
        // comment for future : when has notification attribute in payload -> FCM only recive message when app open not on background or closed
        //notification: { title: this.paramInfo.groupName, body: this.paramInfo.message, sound : "default", badge: "1" }
    }

    var self = this;
    this.GetUserInfo(param.userID,  function (users) {
        if (Utils.isEmpty(users) || !_.isArray(users)) {
            if (callback) {
                return callback(null, {});
            }
        }
        var arrUserId = [];
        _.each(users, function (user) {
            arrUserId.push(user._doc.userID)
        })

        self.GetPayLoadBundleData(arrUserId,function (err,payloadData) {
            if (err || Utils.isEmpty(payloadData)){
                return callback(err, payloadData);
            }
            var userHasNotification = [];
            _.each(users, function (user) {
                if (payloadData[user._doc.userID]){
                    userHasNotification.push(user);
                }
            })
            if (userHasNotification.length>0) {
                _.each(userHasNotification, function (user, index) {
                    let payloadUser = payloadGroup;
                    payloadUser.data.title = Const.pushNotificationTitle;
                    payloadUser.registration_ids.push(user._doc.android_push_token);
                    payloadUser.data.message_count = payloadData[user._doc.userID].message_count;
                    payloadUser.data.conversation_count = payloadData[user._doc.userID].conversation_count;
                    if (payloadUser.data.conversation_count == 1) {
                        payloadUser.data.message = payloadData[user._doc.userID].lastMessage;
                        payloadUser.data.body = payloadData[user._doc.userID].lastMessage;
                    }

                    payloadUser.data.inboxs = JSON.stringify(payloadData[user._doc.userID].inboxs);
                    fcmCli.send(payloadUser, function (err, res) {
                        if (err)
                            return console.log("Send notification error: " + err.toString());
                        //console.log("Send success "+ res.toString());
                        Observer.send(this, Const.pushNotificationSendMessage, res);
                        if (callback && index == userHasNotification.length - 1) {
                            return callback(null, res);
                        } else {
                            return;
                        }
                    });
                })
            }else{
                if (typeof callBack !== 'function')
                    return callback(null, {message: "Nothing to push notification"});
            }

        })
    });
}


module["exports"] = new NotificationUtils();