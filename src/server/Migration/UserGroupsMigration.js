var async = require('async');
var _ = require('lodash');
var Utils = require("../lib/Utils");
var DatabaseManager;
var UserGroupModelV1 = require('./ModelsV1/UserGroupModel');
var UserGroupModelV2 = require('./ModelsV2/UserGroupModel');
var UserModelV2 = require('./ModelsV2/UserModel');
var GroupModelV2 = require('./ModelsV2/GroupModel');
//var FavouriteModelV1 = require('./ModelsV1/Favourites');
var config = require("./Config");
var migrateResult = {};
var currentID = 0;
var pageSize = 5;
var MaxPage = config.MaxPage;
var startTime = 0;
var endTime = 0;
var arrayItem = [];
var arrayDirectMessageGroup = [];
var UserGroupsMigration = {

    run: function (dbm, callback) {
        startTime = new Date();
        DatabaseManager = dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        UserGroupModelV1.model = DatabaseManager.userGroupModelV1;
        UserGroupModelV2.model = DatabaseManager.userGroupModelV2;
        UserModelV2.model = DatabaseManager.userModelV2;
        GroupModelV2.model = DatabaseManager.groupModelV2;
        UserGroupModelV1.getLast(function (err, lastItem) {
            migrateResult.lastItem = lastItem;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at getLast item";

            }else{
                migrateResult.endID = lastItem._doc.id;
                UserGroupsMigration.excute(callback);
            }
        });
    },
    runMigrateUserGroupFromDirectMessage: function (dbm, callback) {
        startTime = new Date();
        DatabaseManager = dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;

        UserGroupModelV2.model = DatabaseManager.userGroupModelV2;
        UserModelV2.model = DatabaseManager.userModelV2;
        GroupModelV2.model = DatabaseManager.groupModelV2;


        GroupModelV2.getLastDirectGroup(function (err, lastItem) {
            migrateResult.lastItem = lastItem;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at getLast item";

            }else{
                migrateResult.endID = lastItem._doc.base_id;
                UserGroupsMigration.excuteForDirectMessage(callback);
            }
        });
    },

    excuteForDirectMessage: function(callback){
        console.log("migrateUserGroups for DirectMessage running ... - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);
        var insertManyItems = function (items, done) {
            if (!items || items.length == 0) {
                done(null, items);
                return;
            }
            UserGroupModelV2.insertMany(items, function (err, result) {
                if (err) {
                    console.log("Error: " + err);
                    migrateResult.error = err;
                    migrateResult.errorMessage = "Error at save Item";
                    done(err, migrateResult);
                    return;

                }

                if (result != null) {
                    done(null,result);
                }

            });
        };

        async.waterfall([

            function (done) {
                migrateResult.firstItemOfLastPage = currentID;
                GroupModelV2.findDirectChatGroups(currentID, pageSize, function (err, arrayItem) {
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
                while(arrayDirectMessageGroup.length > 0) {//clean previous page
                    arrayItem.pop();
                }

                if (arrayItem.length > 0) {

                    _.map(arrayItem,function (item) {//arrayItem is List of DirectMessage Group
                        var newItem1 = new DatabaseManager.userGroupModelV2({
                            base_id: item._doc.base_id,
                            is_admin: false,
                            user_id: item._doc.user_id,
                            group_id: item._doc._id,
                            created: item.created
                        });
                        var newItem2 = new DatabaseManager.userGroupModelV2({
                            base_id: item._doc.base_id,
                            is_admin: false,
                            user_id: item._doc.to_user,
                            group_id: item._doc._id,
                            created: item.created
                        });
                        arrayDirectMessageGroup.push(newItem1);
                        arrayDirectMessageGroup.push(newItem2);
                        migrateResult.currentID = item._doc.base_id;
                    });

                    if (arrayDirectMessageGroup.length >0){
                        insertManyItems(arrayDirectMessageGroup, function (err, result) {
                            if (err)
                                done(err,null);
                            done(null,result);
                        });
                    }else{
                        done(null,{});
                    }
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
                while(arrayDirectMessageGroup.length > 0) {
                    arrayDirectMessageGroup.pop();
                }
                if (migrateResult.currentID < migrateResult.endID){
                    currentID = migrateResult.currentID;
                    if (MaxPage == 0)
                        UserGroupsMigration.excuteForDirectMessage(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        UserGroupsMigration.excuteForDirectMessage(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        callback(null, migrateResult);
                        endTime = new Date();

                        console.log("UserGroupMigration start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("UserGroupMigration done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                    }

                }else{
                    if (typeof callback === 'function')
                        callback(null, migrateResult);

                    endTime = new Date();

                    console.log("UserGroupMigration start at " + Utils.ShowCurrentDateTime(startTime));
                    console.log("UserGroupMigration done at " + Utils.ShowCurrentDateTime(endTime));
                    console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                }

            }

        });

    },

























    excute: function(callback){
        console.log("migrateUserGroups running ... - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);
        var insertManyItems = function (items, done) {
            UserGroupModelV2.insertMany(items, function (err, result) {
                if (err) {
                    console.log("Error: " + err);
                    migrateResult.error = err;
                    migrateResult.errorMessage = "Error at save Item";
                    done(err, migrateResult);
                    return;

                }

                if (result != null) {
                    done(null,result);
                }

            });
        };

        var saveItems = function (items, done) {
            if (!items || items.length == 0) {
                done(null, items);
                return;
            }

            //var arrBaseID = [item.user_id,item.favourite_user_id];
            var arrUserID = [];
            var arrGroupID = [];
            var arrUser = null;
            var arrGroup = null;
            async.waterfall([
                function (done) {

                    _.map(items, function(item) {




                        var  findUserID =  _.find(arrUserID, function(id) { return id ==  item.user_id; });
                        if(findUserID === undefined)
                        {
                            arrUserID.push(item.user_id);
                        }

                        var  findGroupID =  _.find(arrGroupID, function(id) { return id ===  item.group_id; });
                        if(findGroupID === undefined)
                        {
                            arrGroupID.push(item.group_id);
                        }
                    });
                    done(null,{});

                },
                function (output, done) {
                    UserModelV2.getUsersInListBaseID(arrUserID, function (err, users) {
                        if (err) {
                            done(err, null);
                        } else if (users.length >0) {
                            arrUser = users;
                            done(null, {});
                        }else{
                            console.log("Wrong data")
                            done(true,{});
                        }
                    });

                },
                function (output, done) {

                    GroupModelV2.getGroupInListBaseID(arrGroupID, function (err, groups) {
                        if (err) {
                            done(err, null);
                        } else if (groups.length >0) {
                            arrGroup = groups;
                            done(null, {});
                        }else{
                            console.log("Wrong data")
                            done(true,{});
                        }
                    });

                },
                function (output, done) {
                    _.map(items, function(item) {
                        var newItem = new DatabaseManager.userGroupModelV2({
                            base_id: item._doc.id,
                            is_admin: item._doc.is_admin,
                            created: item.created* 1000
                        });
                        var  findUser =  _.find(arrUser, function(o) {
                            return o._doc.base_id ===  item.user_id
                        });
                        if(findUser !== undefined)
                        {
                            newItem.user_id = findUser.userID;
                        }

                        var  findGroup =  _.find(arrGroup, function(o) { return o.base_id ===  item.group_id; });
                        if(findGroup !== undefined)
                        {
                            newItem.group_id = findGroup._doc._id;
                        }
                        arrayItem.push(newItem);
                        migrateResult.currentID = newItem._doc.base_id;
                        migrateResult.resultCount++;
                    });
                    done(null,arrayItem);
                }
            ],function (err, arrItem) {
                if (err)
                    done(err,null);
                if (arrItem.length == items.length){
                    insertManyItems(arrItem, function (err, result) {
                        if (err)
                            done(err,null);
                        done(null,result);
                    });
                }

            });


        };
        async.waterfall([

            function (done) {
                migrateResult.firstItemOfLastPage = currentID;
                UserGroupModelV1.find(currentID, pageSize, function (err, arrayItem) {
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

                console.log("Migrate success page :" + migrateResult.currentPage);
                migrateResult.currentPage++;
                while(arrayItem.length > 0) {
                    arrayItem.pop();
                }
                if (migrateResult.currentID < migrateResult.endID){
                    currentID = migrateResult.currentID;
                    if (MaxPage == 0)
                        UserGroupsMigration.excute(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        UserGroupsMigration.excute(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        callback(null, migrateResult);
                        endTime = new Date();
                        console.log("GroupMigration start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("GroupMigration done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                    }

                }else{
                    if (typeof callback === 'function'){
                        endTime = new Date();
                        console.log("GroupMigration start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("GroupMigration done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                        callback(null, migrateResult);
                    }
                }

            }

        });
    }

}

module.exports = UserGroupsMigration;