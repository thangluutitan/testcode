// Load modules
var config = require('./Migration/Config');
var Migration = require('./Migration/migrate');
var args = [];
var async = require('async');
var Utils = require("./lib/Utils");
var startDate,endDate;
process.argv.forEach(function (val, index) {
    console.log(index + ': ' + val);
    args.push(val);
});
var migrateResult = {};
async.waterfall([
    function (done) {
        startDate=new Date();
        Migration.init(config, function (err, result) {
            if (err)
                return done(err, result);
            else
                done(null, result);
        });

    },
    function (output, done) {

        Migration.migrateUsers(function (err, result) {
            migrateResult.userResult = result;
            if (err)
                return done(err, result)
            done(null, result);
        });

    },
    function (output, done) {

        console.log("Migration Users Success :" + JSON.stringify(output).replace(/\"([^(\")"]+)\":/g, "$1:"));
        Migration.migrateUserContacts(function (err, result) {
            migrateResult.userContact = result;
            if (err)
                return done(err, result)
            done(null, result);
        });

    },
    function (output, done) {

        console.log("Migration UserContacts Success :" + JSON.stringify(output).replace(/\"([^(\")"]+)\":/g, "$1:"));
        Migration.migrateUserFavourites(function (err, result) {
            migrateResult.userFavourite = result;
            if (err)
                return done(err, result)
            done(null, result);
        });

    },
    function (output, done) {

        console.log("Migration UserFavourites Success :" + JSON.stringify(output).replace(/\"([^(\")"]+)\":/g, "$1:"));
        Migration.migrateUserBlocks(function (err, result) {
            migrateResult.userBlock = result;
            if (err)
                return done(err, result)
            done(null, result);
        });

    },
    function (output, done) {

        console.log("Migration UserBlocks Success :" + JSON.stringify(output).replace(/\"([^(\")"]+)\":/g, "$1:"));
        Migration.migrateGroups(function (err, result) {
            migrateResult.userGroup = result;
            if (err)
                return done(err, result)
            done(null, result);
        });

    },
    function (output, done) {

        console.log("Migration Groups Success :" + JSON.stringify(output).replace(/\"([^(\")"]+)\":/g, "$1:"));
        Migration.updateRoomFromGroups(function (err, result) {
            migrateResult.updateGroup = result;
            if (err)
                return done(err, result)
            done(null, result);
        });

    },
    function (output, done) {

        console.log("Update Room From Groups Success :" + JSON.stringify(output).replace(/\"([^(\")"]+)\":/g, "$1:"));
        Migration.migrateUserGroups(function (err, result) {
            migrateResult.userGroup = result;
            if (err)
                done(err, result)
            done(null, result);
        });

    },
    function (output, done) {

        console.log("Migration UserGroupsFromDirectMessage  Success :" + JSON.stringify(output).replace(/\"([^(\")"]+)\":/g, "$1:"));
        Migration.migrateGroupsFromDirectMessage(function (err, result) {
            migrateResult.groupFromDirectMessage = result;
            if (err)
                done(err, result)
            done(null, result);
        });

    },
    function (output, done) {

        console.log("Distinct DirectMessage Success :" + JSON.stringify(output).replace(/\"([^(\")"]+)\":/g, "$1:"));
        Migration.updateRoomFromDirectMessage(function (err, result) {
            migrateResult.updateGroupFromDirectMessage = result;
            if (err)
                done(err, result)
            done(null, result);
        });

    },
    function (output, done) {

        console.log("Migration UserGroups Success :" + JSON.stringify(output).replace(/\"([^(\")"]+)\":/g, "$1:"));
        Migration.migrateUserGroupsFromDirectMessage(function (err, result) {
            migrateResult.userGroupFromDirectMessage = result;
            if (err)
                done(err, result)
            done(null, result);
        });

    },
    function (output, done) {

        console.log("Migration UserGroupsFromDirectMessage Success :" + JSON.stringify(output).replace(/\"([^(\")"]+)\":/g, "$1:"));
        Migration.updateMemberCount(function (err, result) {
            migrateResult.memberCount = result;
            if (err)
                done(err, result)
            done(null, result);
        });

    },
    function (output, done) {

        console.log("Update MemberCount Success :" + JSON.stringify(output).replace(/\"([^(\")"]+)\":/g, "$1:"));
        Migration.migrateMessages(function (err, result) {
            migrateResult.message = result;
            if (err)
                return done(err, result)
            done(null, result);
        });
    },
  function (output, done) {

        console.log("Migration Message Success :" + JSON.stringify(output).replace(/\"([^(\")"]+)\":/g, "$1:"));
        Migration.updateMessages(function (err, result) {
            migrateResult.updateMessage = result;
            if (err)
                return done(err, result)
            done(null, result);
        });
    },
    function (output, done) {

        console.log("Update Messages  Success :" + JSON.stringify(output).replace(/\"([^(\")"]+)\":/g, "$1:"));
        Migration.updateBlockedMessages(function (err, result) {
            migrateResult.updateBlockMessage = result;
            if (err)
                return done(err, result)
            done(null, result);
        });
    }
], function (err, result) {
    endDate=new Date();
    migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endDate,startDate);
    if (err) {
        console.log("err" + err);
    } else {
        console.log("All Migration Success :" + JSON.stringify(migrateResult).replace(/\"([^(\")"]+)\":/g, "$1:"));
        
    }
    console.log("Migration start at " + Utils.ShowCurrentDateTime(startDate));
    console.log("Migration done at " + Utils.ShowCurrentDateTime(endDate));
    console.log("Time spent: " + Utils.ShowDiffDateTime(endDate,startDate));

});


//Migration.migrateGroups(Config);