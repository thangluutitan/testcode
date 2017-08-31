var async = require('async');
var Utils = require("../lib/Utils");
var DatabaseManager;
var UserBlockModelV1 = require('./ModelsV1/UserBlockModel');
var UserBlockModelV2 = require('./ModelsV2/UserBlockModel');
var UserModelV2 = require('./ModelsV2/UserModel');
var config = require("./Config");
var migrateResult = {};
var currentID = 0;
var pageSize = 5;
var MaxPage = config.MaxPage;
var startTime = 0;
var endTime = 0;
var UserBlocksMigration = {

    run: function (dbm, callback) {
        startTime = new Date();
        DatabaseManager = dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        UserBlockModelV1.model = DatabaseManager.userBlockModelV1;
        UserBlockModelV2.model = DatabaseManager.userBlockModelV2;
        UserModelV2.model = DatabaseManager.userModelV2;

        UserBlockModelV1.getLast(function (err, lastUser) {
            migrateResult.lastItem = lastUser;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at getLast item";

            }else{
                migrateResult.endID = lastUser._doc.id;
                UserBlocksMigration.excute(callback);
            }
        });
    },
    excute: function(callback){
        console.log("migrateBlocks run - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);
        var saveContacts = function (contacts, done) {
            if (!contacts || contacts.length == 0) {
                done(null, contacts);
                return;
            }

            var item = contacts[0];
            contacts.shift();
            var newItem = new DatabaseManager.userBlockModelV2({
                base_id: item._doc.id,
                created: item.created 
            });
            var arrBaseID = [item.user_id,item.block_user_id];
            UserModelV2.findInBaseID(arrBaseID, function (err, users) {
                if (err){
                    done(err,null);
                }else if(users.length==2){
                    if (users[0].base_id === item.user_id){
                        newItem.user_id = users[0].userID;
                        newItem.block_user_id = users[1].userID;
                    }else{
                        newItem.user_id = users[1].userID;
                        newItem.block_user_id  = users[0].userID;
                    }
                    UserBlockModelV2.save(newItem, function (err, result) {

                        if (err) {
                            console.log("Error: " + err);
                            migrateResult.error = err;
                            migrateResult.errorMessage = "Error at save Item";
                            done(err, migrateResult);
                            return;

                        }

                        if (result != null) {
                            //console.log("User created: " + result._id);
                            migrateResult.currentID = newItem._doc.base_id;
                            migrateResult.resultCount++;
                            saveContacts(contacts, done);
                        }

                    });
                }else{
                    console.log("User block ignore by missing - item ID: " + newItem.base_id);
                    saveContacts(contacts, done);
                    //done(true,users);
                }

            });

        }
        async.waterfall([

            function (done) {
                migrateResult.firstItemOfLastPage = currentID;
                UserBlockModelV1.find(currentID, pageSize, function (err, arrayContact) {
                    if (err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at find item";
                        done(err, migrateResult);
                    }

                    done(null, arrayContact);
                });

            },
            function (arrayContact, done) {

                if (arrayContact.length > 0) {

                    saveContacts(arrayContact, function (err, result) {
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
                        UserBlocksMigration.excute(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        UserBlocksMigration.excute(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        endTime = new Date();
                        console.log("UserBlock Migration start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("UserBlock Migration done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                        callback(null, migrateResult);
                    }

                }else{
                    if (typeof callback === 'function'){
                        endTime = new Date();
                        console.log("UserBlock Migration start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("UserBlock Migration done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                        callback(null, migrateResult);
                    }

                }

            }

        });
    }

}

module.exports = UserBlocksMigration;