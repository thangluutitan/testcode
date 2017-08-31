var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

var DatabaseManager = {

    messageModel: null,
    userModel: null,
    fileModel: null,
    groupModel: null,
    userGroupModel: null,
    userContactModel: null,
    userBlockModel: null,
    userFavouriteModel: null,
    notificationModel: null,

    init: function (options) {

        var self = this;

        // Connection to our chat database
        console.log("Connecting mongoDB " + options.chatDatabaseUrl);

        try {

            if (!mongoose.connection.readyState) {

                mongoose.connect(options.chatDatabaseUrl,
                    {
                        useMongoClient: true
                    }, function (err) {

                    if (err) {

                        console.log("Failed to connect MongoDB!");
                        console.error(err);

                    } else {

                        // Defining a schema
                        self.setupSchema();

                    }
                });

            } else {
                // Defining a schema
                self.setupSchema();
            }


        } catch (ex) {

            console.log("Failed to connect MongoDB!");

            throw ex;

        }

    },

    setupSchema: function () {

        this.messageModel = require('../Models/MessageModel').init();
        this.userModel = require('../Models/UserModel').init();
        this.fileModel = require('../Models/FileModel').init();
        this.groupModel = require('../Models/GroupModel').init();
        this.userGroupModel = require('../Models/UserGroupModel').init();
        this.userContactModel = require('../Models/UserContactModel').init();
        this.userBlockModel = require('../Models/UserBlockModel').init();
        this.userFavouriteModel = require('../Models/UserFavouriteModel').init();
        this.notificationModel = require('../Models/NotificationModel').init();
    }
}

module["exports"] = DatabaseManager;