var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
var Settings = require("../lib/Settings");

var WebAPIHandler = {

    init: function (app, express) {

        app.use(Settings.options.urlPrefix, express.static(__dirname + '/../../../public'));
        //Add support online document
        app.use(Settings.options.urlPrefix + "/doc", express.static(__dirname + '/../../../public/doc/API'));
        //make it parse any content header as json
        app.use(bodyParser.urlencoded({ extended: true}));
        app.use(bodyParser.json());

        router.use("/user/login", require('./LoginHandler'));
        router.use("/user/join", require('./JoinHandler'));
        router.use("/temp", require('./TempHandler'));
        router.use("/message/list", require('./MessageListHandler'));
        router.use("/message/latest", require('./LatestMessageListHandler').router);
        router.use("/user/list", require('./UserListHandler'));
        router.use("/user", require('./UserHandler'));
        router.use("/group", require('./GroupListHandler'));
        router.use("/message/sendFile", require('./SendFileAsMessageHandler'));
        router.use("/file/upload", require('./FileUploadHandler'));
        router.use("/file/download", require('./FileDownloadHandler'));
        router.use("/test", require('./TestHandler'));
        router.use("/stickers", require('./StickerListHandler'));
        router.use("/contact", require('./UserContactHandler'));
        router.use("/media", require('./MediaHandler'));
        router.use("/nsmi", require('./nsmi'));
        router.use("/notification", require('./NotificationHandler'));

        WebAPIHandler.router = router;
        app.use(Settings.options.urlPrefix + "/v1", router);

    }
}

module["exports"] = WebAPIHandler;