var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
var DatabaseManager = {

    messageModelV1: null,
    userModelV1: null,
    groupModelV1: null,
    userGroupModelV1: null,
    userContactModelV1: null,
    userFavouriteModelV1: null,
    userBlockModelV1: null,

    messageModelV2: null,
    userModelV2: null,
    fileModelV2: null,
    groupModelV2: null,
    userGroupModelV2: null,
    userContactModelV2: null,
    userFavouriteModelV2: null,
    userBlockModelV2: null,

    ConnectionV1: null,
    ConnectionV2: null,

    init: function (options, callback) {

        var self = this;

        // Connection to our chat database
        console.log("Connecting mongoDB " + options.DatabaseUrlV1);

        try {

            console.log("Connecting mongoDB V1" + options.DatabaseUrlV1);
            console.log("Connecting mongoDB V2" + options.DatabaseUrlV2);
            DatabaseManager.ConnectionV1 = mongoose.createConnection(options.DatabaseUrlV1);
            console.log("Connecting mongoDB V2" + options.DatabaseUrlV2);

            DatabaseManager.ConnectionV1.on('error', function (err, result) {
                console.log("Failed to connect V1!");
            });


            DatabaseManager.ConnectionV1.on('disconnected', function () {
                console.log("DB V1 disconnected!");
            });


            DatabaseManager.ConnectionV1.on('connected', function () {
                console.log("DB V1 connected!");
                DatabaseManager.ConnectionV2 = mongoose.createConnection(options.DatabaseUrlV2);
                DatabaseManager.ConnectionV2.on('connected', function () {
                    console.log("DB V2 connected!");
                    self.setupSchema();
                    callback(null,DatabaseManager);
                });
                DatabaseManager.ConnectionV2.on('error', function (err, result) {
                    console.log("Failed to connect V2!");
                });
                DatabaseManager.ConnectionV2.on('disconnected', function () {
                    console.log("DB V2 disconnected!");
                });

            });




        } catch (ex) {

            console.log("Failed to connect MongoDB!");

            throw ex;

        }

    },

    setupSchema: function () {

        this.messageModelV1 = require('./ModelsV1/MessageModel').init(this.ConnectionV1);
        this.messageStatusModelV1 = require('./ModelsV1/MessageStatusModel').init(this.ConnectionV1);
        this.userModelV1 = require('./ModelsV1/UserModel').init(this.ConnectionV1);
        this.groupModelV1 = require('./ModelsV1/GroupModel').init(this.ConnectionV1);
        this.userGroupModelV1 = require('./ModelsV1/UserGroupModel').init(this.ConnectionV1);
        this.userContactModelV1 = require('./ModelsV1/UserContactModel').init(this.ConnectionV1);
        this.userFavouriteModelV1 = require('./ModelsV1/UserFavouriteModel').init(this.ConnectionV1);
        this.userBlockModelV1 = require('./ModelsV1/UserBlockModel').init(this.ConnectionV1);

        this.messageModelV2 = require('./ModelsV2/MessageModel').init(this.ConnectionV2);
        this.userModelV2 = require('./ModelsV2/UserModel').init(this.ConnectionV2);
        this.groupModelV2 = require('./ModelsV2/GroupModel').init(this.ConnectionV2);
        this.userGroupModelV2 = require('./ModelsV2/UserGroupModel').init(this.ConnectionV2);
        this.userContactModelV2 = require('./ModelsV2/UserContactModel').init(this.ConnectionV2);
        this.userFavouriteModelV2 = require('./ModelsV2/UserFavouriteModel').init(this.ConnectionV2);
        this.userBlockModelV2 = require('./ModelsV2/UserBlockModel').init(this.ConnectionV2);

    }
}

module["exports"] = DatabaseManager;