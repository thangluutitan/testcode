(function (global) {// eslint-disable-line
    "use strict;"

    // Class ------------------------------------------------
    var Config = {};

    Config.host = (process.env['APP_HOST'] || "localhost");
    Config.port = (process.env['APP_PORT'] || 8081);
    Config.urlPrefix = '/frogchat';
    Config.socketNameSpace = '/frogchat';

    Config.imageDownloadURL = "http://" + Config.host + "/:" + Config.port + Config.urlPrefix + "/media/images/";
    Config.noavatarImg = "http://" + Config.host + ":" + Config.port + Config.urlPrefix + "/img/noavatar.png";

    if (process.env['MONGO_USERNAME'] && process.env['MONGO_PASSWORD']){
        Config.chatDatabaseUrl = "mongodb://" +
            (process.env['MONGO_USERNAME'] || 'staff') + ":" +
            (process.env['MONGO_PASSWORD'] || 'staff') + "@" +
            (process.env['MONGO_HOST'] || 'localhost') + ":" +
            (process.env['MONGO_PORT'] || '27017') +
            "/" + (process.env['MONGO_DBNAME'] || 'frogchat');
    }else{
        Config.chatDatabaseUrl = "mongodb://" +
            (process.env['MONGO_HOST'] || 'localhost') + ":" +
            (process.env['MONGO_PORT'] || '27017') +
            "/" + (process.env['MONGO_DBNAME'] || 'frogv21');
    }


    Config.dbCollectionPrefix = "frog_";

    Config.uploadDir = 'public/uploads/';
    Config.sendAttendanceMessage = false;

    Config.stickerBaseURL = 'http://spika.chat';
    Config.stickerAPI = Config.stickerBaseURL + '/api/v2/stickers/56e005b1695213295419f5df';

    // Exports ----------------------------------------------
    module["exports"] = Config;

})((this || 0).self || global);
