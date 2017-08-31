var async = require('async');
var Utils = require("../lib/Utils");
var _ = require('lodash');
var DatabaseManager;
var UserContactModelV1 = require('./ModelsV1/UserContactModel');
var UserContactModelV2 = require('./ModelsV2/UserContactModel');
var UserModelV2 = require('./ModelsV2/UserModel');
//var FavouriteModelV1 = require('./ModelsV1/Favourites');
var config = require("./Config");
var migrateResult = {};
var currentID = 0;
var pageSize = 5;
var MaxPage = config.MaxPage;
var startTime = 0;
var endTime = 0;
var UserContactsMigration = {

    run: function (dbm, callback) {
        startTime = new Date();
        DatabaseManager = dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        migrateResult.ignoreCount = 0;
        migrateResult.ignoreItems = [];
        UserContactModelV1.model = DatabaseManager.userContactModelV1;
        UserContactModelV2.model = DatabaseManager.userContactModelV2;
        UserModelV2.model = DatabaseManager.userModelV2;

        UserContactModelV1.getLast(function (err, lastUser) {
            migrateResult.lastItem = lastUser;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at getLast item";

            }else{
                migrateResult.endID = lastUser._doc.id;
                UserContactsMigration.excute(callback);
            }
        });
    },
    excute: function(callback){
        console.log("migrateUsers run - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);
        var saveContacts = function (contacts, done) {
            if (!contacts || contacts.length == 0) {
                done(null, contacts);
                return;
            }

            //var contact = contacts[0];
            //contacts.shift();

            var arrBaseID = [];

            _.map(contacts,function (contact) {
                var  findUserID =  _.find(arrBaseID, function(id) { return id ==  contact._doc.id; });
                if(findUserID === undefined)
                {
                    arrBaseID.push(contact._doc.id);
                }
                arrBaseID.push(contact._doc.id);
                var  findContactUserID =  _.find(arrBaseID, function(id) { return id ==  contact._doc.contact_user_id; });
                if(findContactUserID === undefined)
                {
                    arrBaseID.push(contact._doc.contact_user_id);
                }
            });


            async.waterfall([
                function (done) {
                    UserModelV2.findInBaseID(arrBaseID, function (err, users) {
                        if (err){
                            done(err,null);
                        }else {
                            done(null,users)
                        }
                    });
                },
                function (results,done) {
                    var arrItem = [];
                    _.map(contacts,function (contact) {
                        let newItem = new DatabaseManager.userContactModelV2({
                            base_id: contact._doc.id,
                            is_primary: contact.is_primary,
                            created: contact.created* 1000
                        });

                        var  findUser =  _.find(results, function(user) { return user.base_id ==  contact._doc.user_id; });
                        if(findUser !== undefined){
                            newItem.user_id = findUser._doc.userID;

                        }

                        var  findContacUserID =  _.find(results, function(user) { return user.base_id ==  contact._doc.contact_user_id; });
                        if(findContacUserID !== undefined){
                            newItem.contact_user_id = findContacUserID._doc.userID;

                        }
                        migrateResult.currentID = newItem._doc.base_id;

                        if(newItem.user_id !== newItem.contact_user_id){
                            migrateResult.resultCount++;
                            arrItem.push(newItem);
                        }else{
                            migrateResult.ignoreCount++;
                            migrateResult.ignoreItems.push(contact);
                        }
                    });
                    UserContactModelV2.insertMany(arrItem,function (err,results) {
                        if (err) {
                            console.log("err" + err);
                            done(err, results);
                        } else {
                            done(null,results);
                        }
                    });

                }], function (err, results) {
                if (err) {
                    console.log("err" + err);
                    if (typeof callback === 'function')
                        callback(err, results);
                } else {

                    console.log("Migrate success page :" + migrateResult.currentPage);
                    migrateResult.currentPage++;
                    if (migrateResult.currentID < migrateResult.endID){
                        currentID = migrateResult.currentID;
                        if (MaxPage == 0)
                            UserContactsMigration.excute(callback);
                        else if (migrateResult.currentPage <= MaxPage)
                            UserContactsMigration.excute(callback);
                        else{
                            migrateResult.message = "Done by hit maxpage limit in test-mode";
                            endTime = new Date();
                            console.log("UserContactsMigration start at " + Utils.ShowCurrentDateTime(startTime));
                            console.log("UserContactsMigration done at " + Utils.ShowCurrentDateTime(endTime));
                            console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                            migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                            callback(null, migrateResult);
                        }

                    }else{
                        if (typeof callback === 'function'){
                            endTime = new Date();
                            console.log("UserContactsMigration start at " + Utils.ShowCurrentDateTime(startTime));
                            console.log("UserContactsMigration done at " + Utils.ShowCurrentDateTime(endTime));
                            console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                            console.log("Ignore count: " + migrateResult.ignoreCount);
                            migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                            callback(null, migrateResult);
                        }
                    }

                }


            });
        }
        async.waterfall([

            function (done) {
                migrateResult.firstItemOfLastPage = currentID;
                UserContactModelV1.find(currentID, pageSize, function (err, arrayContact) {
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
                        UserContactsMigration.excute(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        UserContactsMigration.excute(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        endTime = new Date();
                        console.log("UserMigration start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("UserMigration done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        callback(null, migrateResult);
                    }

                }else{
                    if (typeof callback === 'function'){
                        endTime = new Date();
                        console.log("UserMigration start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("UserMigration done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        callback(null, migrateResult);
                    }

                }

            }

        });
    }

}

module.exports = UserContactsMigration;