var UsersMigration = require("./UsersMigration");
var DirectMessageMigration = require("./DirectMessageMigration");
var GroupMigration = require("./GroupMigration");
var migrateResult = {};
var DatabaseManager = require('./DatabaseManager');
var UserContactMigration = require("./UserContactsMigration");
var UserGroupMigration = require("./UserGroupsMigration");
var UserFavouriteMigration = require("./UserFavouritesMigration");
var UserBlockMigration = require("./UserBlocksMigration");
var MessageMigration = require("./MessageMigration");

var Migration = {
    init: function (config, callback) {
        DatabaseManager.init(config, function (err, result) {
            DatabaseManager = result;
            callback(null, {});
        });

        migrateResult.pageSize = 10;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
    },
    migrateGroups: function (callback) {
        console.log("migrateGroups run");
        GroupMigration.run(DatabaseManager, callback);
        //callback(null,{});
    },
    updateRoomFromGroups: function (callback) {
        console.log("migrate Groups run");
        GroupMigration.runUpdate(DatabaseManager, callback);
        //callback(null,{});
    },
    updateMemberCount: function (callback) {
        console.log("update MemberCount run");
        GroupMigration.runUpdateMemberCount(DatabaseManager, callback);
        //callback(null,{});
    },
    migrateMessages: function (callback) {
        console.log("migrate MessageMigration run");
        MessageMigration.run(DatabaseManager, callback);
        //callback(null, {});
    },
    updateMessages: function (callback) {
        console.log("update Messages run");
        MessageMigration.runUpdate(DatabaseManager, callback);
        //callback(null, {});
    },
    updateBlockedMessages: function (callback) {
        console.log("update BlockedMessages run");
        MessageMigration.runUpdateBlockMessage(DatabaseManager, callback);
        //callback(null, {});
    },
    migrateGroupsFromDirectMessage: function (callback) {
        console.log("migrate GroupsFromDirectMessage run");
        DirectMessageMigration.run(DatabaseManager, callback);
        //callback(null,{});
    },
    migrateDistinctDirectMessage: function (callback) {
        console.log("migrate GroupsFromDirectMessage run");
        DirectMessageMigration.runDistinct(DatabaseManager,callback);
        //callback(null, {});
    },
    updateRoomFromDirectMessage: function (callback) {
        console.log("update GroupsFromDirectMessage run");
        DirectMessageMigration.runUpdateRoom(DatabaseManager, callback);
        //callback(null,{});
    },
    migrateUsers: function (callback) {
        console.log("migrate Users run");
        UsersMigration.run(DatabaseManager, callback);
        //callback(null, migrateResult);
    },

    migrateUserGroups: function (callback) {
        console.log("migrate UserGroups run");
        UserGroupMigration.run(DatabaseManager, callback);
        //callback(null, migrateResult);
    },

    migrateUserContacts: function (callback) {
        console.log("migrateUserContacts run");
        UserContactMigration.run(DatabaseManager, callback);
        //callback(null, migrateResult);
    },
    migrateUserFavourites: function (callback) {
        console.log("migrateUserFavourites run");
        UserFavouriteMigration.run(DatabaseManager, callback);
        //callback(null, migrateResult);
    },
    migrateUserBlocks: function (callback) {
        console.log("migrate UserBlock run");
        UserBlockMigration.run(DatabaseManager, callback);
        //callback(null, migrateResult);
    },
    migrateUserGroupsFromDirectMessage: function (callback) {
        console.log("migrate UserGroupsFromDirectMessage run");
        UserGroupMigration.runMigrateUserGroupFromDirectMessage(DatabaseManager, callback);
        //callback(null, migrateResult);
    },

}
module.exports = Migration;