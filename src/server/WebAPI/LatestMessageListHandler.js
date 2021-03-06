var express = require('express');
var router = express.Router();
var _ = require('lodash');
var RequestHandlerBase = require("./RequestHandlerBase");
var Utils = require("../lib/Utils");
var Const = require("../const");
var async = require('async');
var MessageModel = require("../Models/MessageModel");
var tokenChecker = require('../lib/Auth');
var UserGroupModel = require("../Models/UserGroupModel");
var LatestMessageListHandler = function () {
}

_.extend(LatestMessageListHandler.prototype, RequestHandlerBase.prototype);

LatestMessageListHandler.prototype.attach = function (router) {

    var self = this;

    /**
     * @api {get} /message/latest/:roomID/:lastMessageID Get all latest messages
     * @apiName Get all latest messages of the room
     * @apiGroup WebAPI
     * @apiDescription Get all latest message from the room

     * @apiParam {String} RoomID ID of room
     * @apiParam {String} lastMessageID MessageID of last message already shown. To get last 50 message put this param 0
     * @apiParam {String} userID userID is the ID of user
     *
     * @apiSuccess {String} Token
     * @apiSuccess {String} User Model of loginned user
     *
     * @apiSuccessExample Success-Response:
     {
         "code": 1,
         "data": {
             "messages": [
                 {
                     "_id": "564d7c613e84a5407599ce8b",
                     "user": {
                         "_id": "564b1f0c6d8463e192831fe4",
                         "userID": "5638c0a71b659fc060941d87",
                         "name": "KenYasue",
                         "avatarURL": "/spika/img/noavatar.png",
                         "token": "j4vSCqcIednY5y4g3wmMJuk6",
                         "created": 1447763724451,
                         "__v": 0
                     },
                     "userID": "5638c0a71b659fc060941d87",
                     "roomID": "564d7c593e84a5407599ce80",
                     "message": "10",
                     "localID": "_NNq1fIRx938rNcISLd8MGYW063RcA94X",
                     "type": 1,
                     "created": 1447918689029,
                     "__v": 0,
                     "seenBy": []
                 },
                 {
                     "_id": "564d7c5e3e84a5407599ce8a",
                     "user": {
                         "_id": "564b1f0c6d8463e192831fe4",
                         "userID": "5638c0a71b659fc060941d87",
                         "name": "KenYasue",
                         "avatarURL": "/spika/img/noavatar.png",
                         "token": "j4vSCqcIednY5y4g3wmMJuk6",
                         "created": 1447763724451,
                         "__v": 0
                     },
                     "userID": "5638c0a71b659fc060941d87",
                     "roomID": "564d7c593e84a5407599ce80",
                     "message": "98",
                     "localID": "_d9mEiYGCrGLRubjIfaHAAWtPUtO1eMBl",
                     "type": 1,
                     "created": 1447918686869,
                     "__v": 0,
                     "seenBy": []
                 }
             ]
         }
     }
     */

    router.get('/:roomID/:lastMessageID/:userID', tokenChecker, function (request, response) {

        self
            .logic(request.params, function (result) {

                self.successResponse(response, Const.responsecodeSucceed, {
                    token: result.token,
                    messages: result.messages
                });

            }, function (err, code) {

                if (err) {

                    self.errorResponse(response, Const.httpCodeSeverError);

                } else {

                    self.successResponse(response, code);

                }

            });

    });

}

LatestMessageListHandler.prototype.logic = function (params, onSuccess, onError) {

    var roomID = params.roomID;
    var lastMessageID = params.lastMessageID;
    var userID = params.userID;

    if (Utils.isEmpty(lastMessageID)) {

        if (onError)
            onError(null, Const.resCodeMessageListNoLastMessageID);

        return;

    }

    if (Utils.isEmpty(roomID)) {

        if (onError)
            onError(null, Const.resCodeMessageListNoRoomID);

        return;

    }

    if (lastMessageID == 0) {

        if (onError)
            onError(null, Const.resCodeMessageListNoLastMessageID);

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
                    .findAllMessages(roomID, lastMessageID, userID, left_time, function (err, data) {

                        done(err, data);

                    });

            },
            function (messages, done) {

                MessageModel
                    .populateMessages(messages, function (err, data) {

                        done(err, data);

                    });

            }
        ], function (err, result) {

            if (err) {

                onError(err, null);

            } else {

                var responseJson = {
                    messages: result
                }

                onSuccess(responseJson);

            }

        });

}

var handler = new LatestMessageListHandler();
handler.attach(router);

module["exports"] = {
    handler: handler,
    router: router
};
