var async = require('async');
var Utils = require("../lib/Utils");
var DatabaseManager ;//= require('./DatabaseManager');
var _ = require('lodash');
var UserModelV1 = require('./ModelsV1/UserModel');
var UserModelV2 = require('./ModelsV2/UserModel');
var config = require("./Config");
var migrateResult = {};
var currentID = 0;
var pageSize = 5;
var MaxPage = config.MaxPage;
var startTime = 0;
var endTime = 0;

var UsersMigration = {

    run: function (dbm, callback) {
        DatabaseManager = dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        //UserModelV2 = DatabaseManager.userModelV2;
        UserModelV1.model = DatabaseManager.userModelV1;
        UserModelV2.model = DatabaseManager.userModelV2;
        startTime = new Date();
        UserModelV1.getLast(function (err, lastUser) {
            migrateResult.lastItem = lastUser;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at getLast item";

            }else{
                migrateResult.endID = lastUser._doc.id;
                UsersMigration.excute(callback);
            }
        });
    },
    excute: function(callback){
        console.log("migrateUsers run - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);
        var saveUsers = function (users, done) {
            if (!users || users.length == 0) {
                done(null, users);
                return;
            }
            var arrNewUser = [];

            _.map(users,function (user) {
                let newuser = new DatabaseManager.userModelV2({
                    userID : user.email,
                    base_id: user._doc.id,

                    name: user.name,
                    email: user.email,
                    school_code: user.school_code?user.school_code:"",
                    school_url: user.school_url?user.school_url:"",
                    user_type: user.user_type,
                    online_status : "offline",
                    vle_token: user.token?user.token:"",
                    avatar_file_id: user.avatar_file_id,
                    avatar_thumb_file_id : user.avatar_thumb_file_id,
                    token: user.token?user.token:"",

                    created: user.created* 1000,
                    modified: user.modified* 1000
                });
                migrateResult.currentID = newuser._doc.base_id;
                migrateResult.resultCount++;
                arrNewUser.push(newuser);

            });




            UserModelV2.insertMany(arrNewUser, function (err, result) {

                if (err) {
                    console.log("Error: " + err);
                    migrateResult.error = err;
                    migrateResult.errorMessage = "Error at save Item";
                    done(err, migrateResult);
                    return;

                }

                if (result != null) {
                    //console.log("User created: " + result._id);
                    done(null, result);
                }

            });

        }
        async.waterfall([

            function (done) {
                migrateResult.firstItemOfLastPage = currentID;

                UserModelV1.find(currentID, pageSize, function (err, arrayUser) {
                    if (err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at find item";
                        done(err, migrateResult);
                    }

                    done(null, arrayUser);
                });

            },
            function (arrayUser, done) {

                if (arrayUser.length > 0) {

                    saveUsers(arrayUser, function (err, result) {
                        if (err) {
                            console.log("Error: " + err);
                            migrateResult.error = err;
                            migrateResult.result = result;
                            migrateResult.errorMessage = "Error at save Item";
                            done(err, migrateResult);
                        } else {
                            console.log("Item inserted count: " + migrateResult.resultCount);
                            done(null, migrateResult);
                        }
                    });
                }
            },
        ], function (err, result) {

            if (err) {
                console.log("err" + err);
                if (typeof callback === 'function')
                    callback(err, result);
            } else {

                console.log("Migrate success page :" + migrateResult.currentPage);
                migrateResult.currentPage++;
                if (migrateResult.currentID < migrateResult.endID){
                    currentID = migrateResult.currentID;
                    if (MaxPage == 0)
                        UsersMigration.excute(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        UsersMigration.excute(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        endTime = new Date();
                        console.log("UserMigration start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("UserMigration done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                        callback(null, migrateResult);
                    }

                }else{
                    if (typeof callback === 'function'){
                        endTime = new Date();
                        console.log("UserMigration start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("UserMigration done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                        callback(null, migrateResult);
                    }

                }

            }

        });
    }

}

module.exports = UsersMigration;