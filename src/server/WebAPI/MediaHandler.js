var express = require('express');
var router = express.Router();
var _ = require('lodash');
var RequestHandlerBase = require("./RequestHandlerBase");
var Utils = require("../lib/Utils");
var Const = require("../const");
var MessageModel = require("../Models/MessageModel");
var tokenChecker = require('../lib/Auth');

var MediaHandler = function () {
}

_.extend(MediaHandler.prototype, RequestHandlerBase.prototype);

MediaHandler.prototype.attach = function (router) {

    var self = this;
    /**
     * @api {get} /media/list Get media list of group
     * @apiName list
     * @apiGroup Frog-WebAPI
     * @apiDescription Get group media list of group with paging

     * @apiParam {String}  roomID id of group
     * @apiParam {String}  limit number item of page
     * @apiParam {String}  page index of page you want to get
     *
     * @apiSuccess {object} data
     *
     * @apiSuccessExample Success-Response:

     {
 "code": 1,
 "data": [
     {
         "_id": "58db2f3f93faa424142bbd21",
         "user": "58c0df110670d33528198e99",
         "userID": "1",
         "roomID": "58c0e9820670d33528198ec5",
         "message": "",
         "localID": "_AgEHOo0sDkxoZZPg99HGGntk5pwd6uu9",
         "type": 2,
         "attributes": {
             "client": "web"
         },
         "created": 1490759487514,
         "__v": 0,
         "seenBy": [
         ],
         "file": {
             "file": {
                 "id": "58db2f3f93faa424142bbd20",
                 "name": "cat in the glass.jpg",
                 "size": 21193,
                 "mimeType": "image/jpeg"
             }
         }
     },
     {
         "_id": "58db2f3893faa424142bbd1f",
         "user": "58c0df110670d33528198e99",
         "userID": "1",
         "roomID": "58c0e9820670d33528198ec5",
         "message": "",
         "localID": "_zkTSPACxZga9LqoMLyWQGJRXiI6J91o0",
         "type": 2,
         "attributes": {
             "client": "web"
         },
         "created": 1490759480927,
         "__v": 0,
         "seenBy": [
         ],
         "file": {
             "file": {
                 "id": "58db2f3893faa424142bbd1e",
                 "name": "2017-03-20_151717.jpg",
                 "size": 153961,
                 "mimeType": "image/jpeg"
             }
         }
     }
     ]
 }


     */
    router.get('/list/:roomID?/:limit?/:page?', tokenChecker, function (request, response) {
        var params = {};
        params.roomID = request.params.roomID;
        params.limit = parseInt(request.params.limit);
        params.page = parseInt(request.params.page);

        if (Utils.isEmpty(params.roomID)) {

            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify ID of room."));

            return;

        }
        if (_.isNaN(params.limit) || _.isNaN(params.page)) {
            params.limit = Const.numberItemOfPage;
            params.page = 1;
        }

        MessageModel
            .findMediaMessages(params, function (err, data) {
                if (data != undefined && data != null) {
                    self.successResponse(response, Const.responsecodeSucceed, data);
                }

            });

    });

}

new MediaHandler().attach(router);
module["exports"] = router;
