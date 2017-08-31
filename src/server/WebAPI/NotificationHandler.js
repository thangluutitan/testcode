var express = require('express');
var router = express.Router();
var _ = require('lodash');
var RequestHandlerBase = require("./RequestHandlerBase");
var Utils = require("../lib/Utils");
var NotificationUtils = require("../lib/NotificationUtils");
var async = require('async');
var Const = require("../const");
var NotificationModel = require("../Models/NotificationModel");
var UserModel = require("../Models/UserModel");
var tokenChecker = require('../lib/Auth');

var NotificationHandler = function () {
}

_.extend(NotificationHandler.prototype, RequestHandlerBase.prototype);

NotificationHandler.prototype.attach = function (router) {

    var self = this;
    /**
     * @api {get} /list Get notification list of user
     * @apiName list
     * @apiGroup Frog-WebAPI
     * @apiDescription Get notification of user

     * @apiParam {String}  userID id of user
     *
     * @apiSuccess {object} data
     *
     * @apiSuccessExample Success-Response:

     {
 "code": 1,
 "data": [
     {
         "_id": "58db2f3f93faa424142bbd21",
         "user_id": "frogchatstaffahmad@portaldev.ytlcomms.my",
         "from_user_id": "frogchatstaffdavid@portaldev.ytlcomms.my",
         "to_group_id": "0",
         "message": "this is test message",
         "target_type": "direct_messages",
         "user_image_url": "",
         "created": 1490759480927,
         "modified": 1490759480927
     },
     {
         "_id": "58db2f3f93faa424142bbd21",
         "user_id": "frogchatstaffahmad@portaldev.ytlcomms.my",
         "from_user_id": "frogchatstaffdavid@portaldev.ytlcomms.my",
         "to_group_id": "58c0e9820670d33528198ec5",
         "message": "this is test message",
         "target_type": "group_posts",
         "user_image_url": "",
         "created": 1490759480927,
         "modified": 1490759480927
     }
     ]
 }


     */
    router.get('/list/:userID?', tokenChecker, function (request, response) {
        var userID = request.params.userID;

        if (Utils.isEmpty(userID)) {
            
            

            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify ID of user."));

            return;

        }

        var arrUser = ['frogchatstaffthanh@portaldev.ytlcomms.my','frogchatstaffedwin@portaldev.ytlcomms.my'];
        var payloadData = { };
        async.waterfall([function (next) {

            var arrUserId = [];
            NotificationModel
                .findByUserInList(arrUser, function (err, data) {
                    var groupsByUserID = _.groupBy(data,function (noti) {
                        return noti._doc.user_id;
                    })
                    Object.keys(groupsByUserID).map(function (key) {
                        payloadData[key] = {};
                        let groupsByGroup = _.groupBy(groupsByUserID[key],function (noti) {
                            return noti._doc.to_group_id;
                        })
                        payloadData[key].message_count = groupsByUserID[key].length;
                        payloadData[key].conversation_count = Object.keys(groupsByGroup).length;
                        payloadData[key].items = groupsByUserID[key];
                        var endIndex = payloadData[key].message_count ? payloadData[key].message_count : 0;
                        if (endIndex>7) {
                            endIndex = 7;
                        }
                        payloadData[key].endIndex = endIndex;

                        for (var i = 0; i < endIndex; i++){
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
                    next(null,arrUserId);
                    //build inbox message
                });

        },function (arrUser, next) {


            UserModel.getUsersInList(arrUser,function (err,users) {
                if (err){
                    next(err,null)
                }else if (_.isArray(users) && users.length >0){

                    Object.keys(payloadData).map(function (key) {
                        payloadData[key].inboxs = [];
                        for (var i = 0; i < payloadData[key].endIndex; i++){
                            let inboxItem = {};
                            inboxItem.user_id = payloadData[key].items[i]._doc.user_id;
                            inboxItem.from_user_id = payloadData[key].items[i]._doc.from_user_id;
                            inboxItem.message = payloadData[key].items[i]._doc.message
                            var findUser = _.find(users, function (u) {
                                return u._doc.userID === inboxItem.user_id;
                            });
                            if (findUser !== undefined) {
                                inboxItem.user_name = findUser._doc.name;
                            }

                            findUser = _.find(users, function (u) {
                                return u._doc.userID === inboxItem.from_user_id;
                            });
                            if (findUser !== undefined) {
                                inboxItem.from_user_name = findUser._doc.name;
                            }

                            inboxItem.boldLength = inboxItem.user_name.length + 1 + inboxItem.from_user_name.length -1;//3
                            inboxItem.normalLength = payloadData[key].items[i]._doc.message.length + 2;
                            inboxItem.startNormalIndex = inboxItem.boldLength + 1;
                            inboxItem.message = inboxItem.user_name + "@" + inboxItem.from_user_name + ": " + inboxItem.message;
                            payloadData[key].inboxs.push(inboxItem);
                        }
                        delete  payloadData[key].items;
                    })



                    next(null,payloadData)
                }else {
                    next(err,null)
                }
            });

        }],function (err,finalResult) {
            if(err || Utils.isEmpty(finalResult)){
                self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Error from server"));
            }else{
                self.successResponse(response, Const.responsecodeSucceed, payloadData);
            }

        });



    });

    /**
     * @api {post} /add Post add notification to all member in group
     * @apiName promote
     * @apiGroup Frog-WebAPI
     * @apiDescription Add notification to all member in group

     * @apiParam {String}  groupid id of group chat
     * @apiParam {String}  from_user_id id of user who send message to group
     * @apiParam {String}  target_type direct_messages or group_posts
     * @apiParam {String}  message direct_messages or group_posts
     *
     * @apiSuccess {object} data
     *
     * @apiSuccessExample Success-Response:
     *
     *
     {
      "code": 1,
      "data": [
        {
          "_id": "59954274c5e4082714871dc0",
          "from_user_id": "frogchatstaffahmad@portaldev.ytlcomms.my",
          "user_id": "frogchatstaffthanh@portaldev.ytlcomms.my",
          "to_group_id": "598acc0791d5f917ac501a39",
          "target_type": "group_posts",
          "message": "test message",
          "user_image_url": "",
          "created": 1502954100497
        },
        {
          "_id": "59954274c5e4082714871dc1",
          "from_user_id": "frogchatstaffahmad@portaldev.ytlcomms.my",
          "user_id": "frogchatstaffedwin@portaldev.ytlcomms.my",
          "to_group_id": "598acc0791d5f917ac501a39",
          "target_type": "group_posts",
          "message": "test message",
          "user_image_url": "",
          "created": 1502954100499
        }
      ]
    }

     *
     * */
    router.post('/add', tokenChecker, function (request, response) {

        if (_.isUndefined(request.body)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify request body."));
            return;
        }



        var notiParams = request.body;
        NotificationUtils.addNotification(notiParams,function (err,results) {
            if (err){
                self.errorResponse(response, Const.responsecodeParamError, results);
            }else{
                self.successResponse(response, Const.responsecodeSucceed, results);
            }
        })

    });


    /**
     * @api {post} /remove Post remove notification for user in group
     * @apiName promote
     * @apiGroup Frog-WebAPI
     * @apiDescription remove notification for user in group

     * @apiParam {String}  group_id id of group chat (null if direct_message)
     * @apiParam {String}  user_id id of user who send message to group
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
    router.post('/remove', tokenChecker, function (request, response) {

        if (_.isUndefined(request.body)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify request body."));
            return;
        }

        var notiParams = request.body;
        NotificationUtils.removeNotification(notiParams,function (err,results) {
            if (err){
                self.errorResponse(response, Const.responsecodeParamError, results);
            }else{
                self.successResponse(response, Const.responsecodeSucceed, results);
            }
        })
    })

}


new NotificationHandler().attach(router);
module["exports"] = router;
