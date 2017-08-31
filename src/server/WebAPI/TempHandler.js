var express = require('express');
var router = express.Router();
var _ = require('lodash');
var RequestHandlerBase = require("./RequestHandlerBase");
var Const = require("../const");
var TempHandler = function () {
}

_.extend(TempHandler.prototype, RequestHandlerBase.prototype);

TempHandler.prototype.attach = function (router) {

    var self = this;

    //Login data (requires body-parser)
    router.get('', function (request, response) {

        self.successResponse(response, Const.responsecodeSucceed, {
            param1: 1,
            param2: 2
        });

    });

}

new TempHandler().attach(router);
module["exports"] = router;
