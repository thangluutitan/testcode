var express = require('express');
var router = express.Router();
var _ = require('lodash');
var RequestHandlerBase = require("./RequestHandlerBase");
var Const = require("../const");
var JoinLogic = require("../Logics/Join");

var JoinHandler = function () {
}

_.extend(JoinHandler.prototype, RequestHandlerBase.prototype);

JoinHandler.prototype.attach = function (router) {

    var self = this;

    /**
     * @api {post} /user/join Get api token
     * @apiName Join
     * @apiGroup WebAPI
     * @apiDescription Join to the room specified in request, and get token for the room.

     * @apiParam {name} Users Name
     * @apiParam {avatarURL} URL of avatar image
     * @apiParam {roomID} Room Name to join
     * @apiParam {userID} User's Unique ID
     *
     * @apiSuccess {String} Token
     * @apiSuccess {String} User Model of loginned user
     *
     * @apiSuccessExample Success-Response:

     {
         code: 1,
         data: {
             token: 'FPzdinKSETyXrx0zoxZVYoVt',
             user: {
                 _id: '564b128a94b8f880877eb47f',
                 userID: 'test',
                 name: 'test',
                 avatarURL: 'test',
                 token: 'zJd0rlkS6OWk4mBUDTL5Eg5U',
                 created: 1447760522576,
                 __v: 0
             }
         }
     }

     */
    router.post('/', function (request, response) {

        JoinLogic
            .execute(request.body, function (result) {

                self.successResponse(response, Const.responsecodeSucceed, {
                    token: result.token,
                    user: result.user
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

new JoinHandler().attach(router);
module["exports"] = router;
