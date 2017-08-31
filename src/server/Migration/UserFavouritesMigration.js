var async = require('async');
var DatabaseManager;
var Utils = require("../lib/Utils");
var UserFavouriteModelV1 = require('./ModelsV1/UserFavouriteModel');
var UserFavouriteModelV2 = require('./ModelsV2/UserFavouriteModel');
var UserModelV2 = require('./ModelsV2/UserModel');
//var FavouriteModelV1 = require('./ModelsV1/Favourites');
var config = require("./Config");
var migrateResult = {};
var currentID = 0;
var pageSize = 5;
var MaxPage = config.MaxPage;
var startTime = 0;
var endTime = 0;
var UserFavouritesMigration = {

    run: function (dbm, callback) {
        startTime = new Date();
        DatabaseManager = dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        UserFavouriteModelV1.model = DatabaseManager.userFavouriteModelV1;
        UserFavouriteModelV2.model = DatabaseManager.userFavouriteModelV2;
        UserModelV2.model = DatabaseManager.userModelV2;

        UserFavouriteModelV1.getLast(function (err, lastUser) {
            migrateResult.lastItem = lastUser;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at getLast item";

            }else{
                migrateResult.endID = lastUser._doc.id;
                UserFavouritesMigration.excute(callback);
            }
        });
    },
    excute: function(callback){
        console.log("migrate Favourites running ... - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);
        var saveItems = function (items, done) {
            if (!items || items.length == 0) {
                done(null, items);
                return;
            }

            var item = items[0];
            items.shift();
            var newItem = new DatabaseManager.userFavouriteModelV2({
                base_id: item._doc.id,
                created: item.created* 1000
            });
            var arrBaseID = [item.user_id,item.favourite_user_id];
            UserModelV2.findInBaseID(arrBaseID, function (err, users) {
                if (err){
                    done(err,null);
                }else if(users.length==2){
                    if (users[0].base_id === item.user_id){
                        newItem.user_id = users[0].userID;
                        newItem.favourite_user_id = users[1].userID;
                    }else{
                        newItem.user_id = users[1].userID;
                        newItem.favourite_user_id  = users[0].userID;
                    }
                    UserFavouriteModelV2.save(newItem, function (err, result) {

                        if (err) {
                            console.log("Error: " + err);
                            migrateResult.error = err;
                            migrateResult.errorMessage = "Error at save Item";
                            done(err, migrateResult);
                            return;

                        }

                        if (result != null) {
                            //console.log("Favourite created: " + result._id);
                            migrateResult.currentID = newItem._doc.base_id;
                            migrateResult.resultCount++;
                            saveItems(items, done);
                        }

                    });
                }else{
                    console.log("Wrong data item ID :" + item.user_id);
                    saveItems(items, done);
                    //done(true,users);
                }

            });

        }
        async.waterfall([

            function (done) {
                migrateResult.firstItemOfLastPage = currentID;
                UserFavouriteModelV1.find(currentID, pageSize, function (err, arrayItem) {
                    if (err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at find item";
                        done(err, migrateResult);
                    }

                    done(null, arrayItem);
                });

            },
            function (arrayItem, done) {

                if (arrayItem.length > 0) {

                    saveItems(arrayItem, function (err, result) {
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

                console.log("Migrate UserFavourite success page :" + migrateResult.currentPage);
                migrateResult.currentPage++;
                if (migrateResult.currentID < migrateResult.endID){
                    currentID = migrateResult.currentID;
                    if (MaxPage == 0)
                        UserFavouritesMigration.excute(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        UserFavouritesMigration.excute(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        endTime = new Date();
                        console.log("UserFavourite Migration start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("UserFavourite Migration done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                        callback(null, migrateResult);
                    }

                }else{
                    if (typeof callback === 'function'){
                        endTime = new Date();
                        console.log("UserFavourite Migration start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("UserFavourite Migration done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                        callback(null, migrateResult);
                    }

                }

            }

        });
    }

}

module.exports = UserFavouritesMigration;