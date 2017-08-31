var express = require('express');
var router = express.Router();
var _ = require('lodash');
var RequestHandlerBase = require("./RequestHandlerBase");
var PushNotificationHandler = require("../WebAPI/PushNotificationHandler");
var Const = require("../const");
var TestHandler = function () {
}
var Utils = require("../lib/Utils");
var SendMessageLogic = require('../Logics/SendMessage');
var BridgeManager = require('../lib/BridgeManager');

_.extend(TestHandler.prototype, RequestHandlerBase.prototype);

TestHandler.prototype.attach = function (route) {

    var self = this;

    route.get('/hello', function (request, response) {

        response.send('Hello');

    });
    route.post('/push', function (request, response) {

        var param = request.body;
        var pushNotification= new PushNotificationHandler(param);
        pushNotification.SendGroup(function(err,result){
            self.successResponse(response, Const.responsecodeSucceed, result);
        });

    });

    route.post('/pushbundle', function (request, response) {

        var param = request.body;
        var pushNotification= new PushNotificationHandler(param);
        pushNotification.SendGroupBundle(function(err,result){
            self.successResponse(response, Const.responsecodeSucceed, result);
        });

    });

    route.post('/sendMessge', function (request, response) {

        var param = request.body;
        if (Utils.isEmpty(param.roomID)) {
            return self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Param missing or error"));
        }


        if (Utils.isEmpty(param.userID)) {
            return self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Param missing or error"));
        }

        if (Utils.isEmpty(param.type)) {
            return self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Param missing or error"));
        }

        if (param.type == Const.messageTypeText && Utils.isEmpty(param.message)) {
            return self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Param missing or error"));
        }

        if (param.type == Const.messageTypeLocation && (
            Utils.isEmpty(param.location) ||
            Utils.isEmpty(param.location.lat) ||
            Utils.isEmpty(param.location.lng))) {

            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Param missing or error"));

            return;

        }

        BridgeManager.hook('sendMessage', param, function (result) {

            if (result == null || result.canSend) {

                var userID = param.userID;

                SendMessageLogic.execute(userID, param, function (result) {
                    self.successResponse(response, Const.responsecodeSucceed, result);
                }, function (err, code) {

                    if (err) {
                        self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("SendMessageLogic error"));
                    } else {
                        self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("SendMessageLogic error code"+code));
                    }

                });
            }

        });

    });

}

new TestHandler().attach(router);
module["exports"] = router;
