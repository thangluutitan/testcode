var express = require('express');
var router = express.Router();
var _ = require('lodash');
var RequestHandlerBase = require("./RequestHandlerBase");
var Utils = require("../lib/Utils");
var Const = require("../const");
var async = require('async');
var MessageModel = require("../Models/MessageModel");
var tokenChecker = require('../lib/Auth');
var UserModel = require("../Models/UserModel");
var UserGroupModel = require("../Models/UserGroupModel");
var mongoose = require('mongoose');
var Settings = require("../lib/Settings");
var NotificationUtils = require("../lib/NotificationUtils");

var MessageListHandler = function () {
}

_.extend(MessageListHandler.prototype, RequestHandlerBase.prototype);

MessageListHandler.prototype.attach = function (router) {

    var self = this;

    /**
     * @api {get} /message/list/:roomID/:lastMessageID Get messages sent to room
     * @apiName Get messages of the room
     * @apiGroup WebAPI
     * @apiDescription Get last 50 message from the room

     * @apiParam {String} RoomID ID of room
     * @apiParam {String} lastMessageID MessageID of last message already shown. To get last 50 message put this param 0
     * @apiParam {String} userID ID of user
     *
     * @apiSuccess {String} Token
     * @apiSuccess {String} User Model of loginned user
     *
     * @apiSuccessExample Success-Response:
     {
     
     {
         "code": 1,
         "data": [
             {
                 "__v": 0,
                 "_id": "55d2d194caf997b543836fc8",
                 "created": 1439879572232,
                 "message": "",
                 "roomID": "test",
                 "type": 1001,
                 "user": {
                     "userID": "test",
                     "name": "test",
                     "avatarURL": "http://45.55.81.215:80/img/noavatar.png",
                     "token": "UI6yHxeyZnXOZ1EgT6g5ftwD",
                     "created": 1439878817506,
                     "_id": "55d2cea1caf997b543836fb2",
                     "__v": 0
                 },
                 "userID": "test",
                 "seenBy": [
                     {
                         "user": {
                             "userID": "test2",
                             "name": "test2",
                             "avatarURL": "http://45.55.81.215:80/img/noavatar.png",
                             "token": "YMsHeg3KEQIhtvt46W5fgnaf",
                             "created": 1439878824411,
                             "_id": "55d2cea8caf997b543836fb6",
                             "__v": 0
                         },
                         "at": 1439879572353
                     },
                     {
                         "user": {
                             "userID": "test3",
                             "name": "tset3",
                             "avatarURL": "http://45.55.81.215:80/img/noavatar.png",
                             "token": "TahnOaC6JzldCh6gAmJs3jMC",
                             "created": 1439878820142,
                             "_id": "55d2cea4caf997b543836fb4",
                             "__v": 0
                         },
                         "at": 1439879572361
                     }
                 ]
             },
             ...
         ]
     }
     
         */

    router.get('/:roomID/:lastMessageID/:userID', tokenChecker, function (request, response) {

        var roomID = request.params.roomID;
        var lastMessageID = request.params.lastMessageID;
        var userID = request.params.userID;

        if (Utils.isEmpty(roomID)) {

            self.successResponse(response, Const.resCodeMessageListNoRoomID);

            return;

        }

        async
            .waterfall([

                function (done) {

                    MessageModel
                        .findMessages(roomID, lastMessageID, userID, Const.pagingLimit, function (err, data) {

                            done(err, data);

                        });

                },
                function (messages, done) {

                    MessageModel
                        .populateMessages(messages, function (err, data) {

                            done(err, data);

                        });

                }
            ], function (err, data) {

                if (err) {

                    self.errorResponse(response, Const.httpCodeSeverError);

                } else {

                    self.successResponse(response, Const.responsecodeSucceed, {messages: data});

                }

            });

    });

    /**
     * @api {get} /message/list/activeMessages/:roomID/:lastMessageID Get messages sent to room does not deleted by user
     * @apiName Get messages of the room
     * @apiGroup WebAPI
     * @apiDescription Get last 50 message from the room

     * @apiParam {String} RoomID ID of room
     * @apiParam {String} lastMessageID MessageID of last message already shown. To get last 50 message put this param 0
     *
     * @apiSuccess {String} Token
     * @apiSuccess {String} User Model of loginned user
     *
     * @apiSuccessExample Success-Response:
     {
     
     {
         "code": 1,
         "data": [
             {
                 "__v": 0,
                 "_id": "55d2d194caf997b543836fc8",
                 "created": 1439879572232,
                 "message": "",
                 "roomID": "test",
                 "type": 1001,
                 "user": {
                     "userID": "test",
                     "name": "test",
                     "avatarURL": "http://45.55.81.215:80/img/noavatar.png",
                     "token": "UI6yHxeyZnXOZ1EgT6g5ftwD",
                     "created": 1439878817506,
                     "_id": "55d2cea1caf997b543836fb2",
                     "__v": 0
                 },
                 "userID": "test",
                 "seenBy": [
                     {
                         "user": {
                             "userID": "test2",
                             "name": "test2",
                             "avatarURL": "http://45.55.81.215:80/img/noavatar.png",
                             "token": "YMsHeg3KEQIhtvt46W5fgnaf",
                             "created": 1439878824411,
                             "_id": "55d2cea8caf997b543836fb6",
                             "__v": 0
                         },
                         "at": 1439879572353
                     },
                     {
                         "user": {
                             "userID": "test3",
                             "name": "tset3",
                             "avatarURL": "http://45.55.81.215:80/img/noavatar.png",
                             "token": "TahnOaC6JzldCh6gAmJs3jMC",
                             "created": 1439878820142,
                             "_id": "55d2cea4caf997b543836fb4",
                             "__v": 0
                         },
                         "at": 1439879572361
                     }
                 ]
             },
             ...
         ]
     }
     
         */
    router.get('/activeMessages/:roomID/:userID/:lastMessageID', tokenChecker, function (request, response) {

        var roomID = request.params.roomID;
        var userID = request.params.userID;
        var lastMessageID = request.params.lastMessageID;

        if (Utils.isEmpty(roomID)) {

            self.successResponse(response, Const.resCodeMessageListNoRoomID);

            return;

        }

        async
            .waterfall([
                function (done) {

                    UserGroupModel.findbyUserIdAndGroupId(userID, roomID, function (err, res) {
                        if (err)
                            return done(err, null);
                        var left_time = 0;
                        if (res != null && res.length > 0) {
                            if (res[0].has_left == true && res[0].left_time != null)
                                left_time = res[0].left_time;
                        }
                        done(null, left_time);
                    })
                },
                function (left_time, done) {

                    MessageModel
                        .findActiveMessages(roomID, userID, lastMessageID, Const.pagingLimit, left_time, function (err, data) {

                            done(err, data);

                        });

                },
                function (messages, done) {

                    MessageModel
                        .populateMessages(messages, function (err, data) {

                            done(err, data);

                        });

                }
            ], function (err, data) {

                if (err) {

                    self.errorResponse(response, Const.httpCodeSeverError);

                } else {

                    var notiParams = {
                        user_id:userID,
                        group_id:roomID
                    };
                    NotificationUtils.removeNotification(notiParams,function (err,results) {
                        if (err){
                            console.log("remove notification error");
                            self.successResponse(response, Const.responsecodeSucceed, {messages: data,isNeedUpdate:false});
                        }else{
                            if (results && results.result.n>0 && results.result.ok == 1){//remove success and number item removed > 0
                                console.log("repush new notification to the user : " + userID);
                                notiParams.userID = userID;
                                notiParams.roomID= roomID;
                                notiParams.avatar_file_id = "";
                                notiParams.avatar_thumb_file_id  = "";
                                notiParams.type  = Const.messageTypeText;
                                notiParams.title = Const.pushNotificationTitle;
                                notiParams.isNeedUpdate = "1";
                                self.successResponse(response, Const.responsecodeSucceed, {messages: data,isNeedUpdate:true});
                                NotificationUtils.ReSendGroupBundle(notiParams,function (err, results) {
                                    if(err){
                                        console.log("push notification error")
                                    }else{
                                        console.log("push notification success :" + JSON.stringify(results))
                                    }
                                })

                            }else{
                                self.successResponse(response, Const.responsecodeSucceed, {messages: data,isNeedUpdate:false});
                            }

                        }
                    })

                }

            });

    });


    /**
     * @api {post} /message/list/clearMessage Post clear all messages in group by specific User
     * @apiName clearMessage
     * @apiGroup Frog-WebAPI
     * @apiDescription clear all messages in group by specific User

     * @apiParam {String}  userID id of user group chat who want to clear all chats
     * @apiParam {String}  groupID id of group chat
     *
     * @apiSuccess {object} data
     *
     * @apiSuccessExample Success-Response:
     *
     *
     {
         "code": 1,
         "data": {
             "n": 3,
             "nModified": 2,
             "ok": 1
         }
     }

     *
     * */
    router.post('/clearMessage', tokenChecker, function (request, response) {
        if (_.isUndefined(request.body)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify request body."));
            return;
        }

        if (Utils.isEmpty(request.body.userID)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify user id."));
            return;
        }

        if (Utils.isEmpty(request.body.groupID)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify group id."));
            return;
        }


        var groupId = request.body.groupID;
        var userId = request.body.userID;

        var Transaction = require('mongoose-transaction')(mongoose);
        var transaction = new Transaction();

        UserModel.findUserbyId(userId, function (err, user) {
            if (user === null || user === undefined) {
                self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("This user does not exist."));
                return;
            }
            UserGroupModel.findbyUserIdAndGroupId(userId, groupId, function (err, userGroups) {
                if (userGroups === null || userGroups.length <= 0) {
                    self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("This user does not belong to this group."));
                    return;
                }

                MessageModel.findMessagesByRoomID(groupId, function (err, messages) {
                    if (err) {
                        self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString(err));
                        return;
                    }


                    _.forEach(messages, function (message) {
                        var listOfUsers = [];

                        _.forEach(message.deletedBy, function (deletedObj) {
                            if (deletedObj !== null && deletedObj.user !== null)
                                listOfUsers.push(deletedObj.user.toString());

                        });

                        if (_.indexOf(listOfUsers, user._id.toString()) == -1) {

                            var arrDeletedBy = [];
                            if (message.deletedBy !== null && Array.isArray(message.deletedBy)) {
                                arrDeletedBy = message.deletedBy;
                            }

                            arrDeletedBy.push({user: user._id, userID: user.userID, at: Utils.now()});

                            transaction.update(Settings.options.dbCollectionPrefix + "messages", message._id, {deletedBy: arrDeletedBy});

                        }

                    });

                    transaction.update(Settings.options.dbCollectionPrefix + "groups", userGroups[0].group_id, {is_clear: true});
                    transaction.run(function (err, docs) {
                        if (err)
                            self.errorResponse(response, Const.httpCodeSeverError);
                        else
                            self.successResponse(response, Const.responsecodeSucceed, {
                                "nModified": docs.length,
                                "ok": 1
                            });
                    });

                });

            });
        });
    });
}

new MessageListHandler().attach(router);
module["exports"] = router;
