var async = require('async');
var _ = require('lodash');
var DatabaseManager ;//= require('./DatabaseManagerV2');
var GroupModelV1 = require('./ModelsV1/GroupModel');
var GroupModelV2 = require('./ModelsV2/GroupModel');
var MessageModelV1 = require('./ModelsV1/MessageModel');
var UserModelV2 = require('./ModelsV2/UserModel');
var UserGroupModelV2 = require('./ModelsV2/UserGroupModel');
var config = require("./Config");
var Utils = require("../lib/Utils");
var migrateResult = {};
var currentID = 0;
var pageSize = 50;
var MaxPage = config.MaxPage;
var startTime = 0;
var endTime = 0;

var GroupMigration = {

    run: function (dbm, callback) {
        DatabaseManager = dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        startTime = new Date();

        GroupModelV1.model = DatabaseManager.groupModelV1;
        GroupModelV2.model = DatabaseManager.groupModelV2;
        MessageModelV1.model = DatabaseManager.messageModelV1;
        UserModelV2.model = DatabaseManager.userModelV2;

        GroupModelV1.getLast(function (err, lastMessage) {
            migrateResult.lastItem = lastMessage;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at get last item";

            }else{
                migrateResult.endID = lastMessage._doc.id;
                GroupMigration.excute(callback);
            }
        });

    },
    runUpdate: function (dbm, callback) {
        DatabaseManager = dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        startTime = new Date();

        GroupModelV1.model = DatabaseManager.groupModelV1;
        GroupModelV2.model = DatabaseManager.groupModelV2;
        MessageModelV1.model = DatabaseManager.messageModelV1;
        UserModelV2.model = DatabaseManager.userModelV2;

        GroupModelV2.getLast(function (err, lastMessage) {
            migrateResult.lastItem = lastMessage;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at get last item";

            }else{
                migrateResult.endID = lastMessage._doc.base_id;
                GroupMigration.excuteUpdate(callback);
            }
        });

    },
    excute: function(callback){
        console.log("migrateGroup run - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);
        var saveGroups = function (groups, done) {
            if (!groups || groups.length == 0) {
                done(null, groups);
                return;
            }

            var arrayItems = [];
            var arrUserID = [];

            var arrUser=[];
            async.waterfall([
                function (done) {

                    _.map(groups, function(item) {

                        var  findUserID =  _.find(arrUserID, function(id) { return id ==  item.user_id; });
                        if(findUserID === undefined)
                        {
                            arrUserID.push(item.user_id);
                        }


                    });

                    done(null,{});

                },
                function (output,done) {
                    UserModelV2.getUsersInListBaseID(arrUserID, function (err, results)  {
                        if(results.length > 0) arrUser = results;
                        done(null,{});
                    });
                },
                function (output, done) {
                    _.map(groups, function(group) {

                        var  findUser =  _.find(arrUser, function(o) { return o.base_id.toString() ===  group.user_id; });
                        var newgroup = new DatabaseManager.groupModelV2({
                            user_id: findUser !== undefined? findUser.userID:null,
                            to_user: "",
                            base_id: group._doc.id,
                            name: group.name,
                            description: group.description,
                            group_password: group.group_password,
                            category_id: group.category_id,
                            avatar_file_id: group.avatar_file_id,
                            avatar_thumb_file_id: group.avatar_thumb_file_id,
                            is_group: true,
                            member_count: 0,
                            created: group.created * 1000,
                            modified: group.modified * 1000
                        });

                        arrayItems.push(newgroup);
                        migrateResult.currentID = newgroup._doc.base_id;
                        migrateResult.resultCount++;

                    });
                    done(null,arrayItems);
                }
            ], function (err, arrayItems) {

                GroupModelV2.insertMany(arrayItems,  function (err, result) {
                    if(err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at save item";
                        done(err, migrateResult);
                        return;
                    }
                    else
                    {
                        console.log("Messages created: " + migrateResult.resultCount);
                        done(null, migrateResult);
                    }
                });

            });


        }

        async.waterfall([

            function (done) {
                migrateResult.firstItemOfLastPage = currentID;

                GroupModelV1.findGroups(currentID, pageSize, function (err, arrayGroup) {
                    if (err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at find item.";
                        done(err, migrateResult);
                    }

                    done(null, arrayGroup);
                });

            },
            function (arrayGroup, done) {

                if (arrayGroup.length > 0) {

                    saveGroups(arrayGroup, function (err, result) {
                        if (err) {
                            console.log("Error: " + err);
                            migrateResult.error = err;
                            migrateResult.result = result;
                            migrateResult.errorMessage = "Error at save item.";
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
                        GroupMigration.excute(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        GroupMigration.excute(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        callback(null, migrateResult);
                    }

                }else{
                    endTime = new Date();

                    console.log("GroupMigration start at " + Utils.ShowCurrentDateTime(startTime));
                    console.log("GroupMigration done at " + Utils.ShowCurrentDateTime(endTime));
                    if (typeof callback === 'function')
                        callback(null, migrateResult);
                }

            }

        });
    },
    excuteUpdate: function(callback){
        console.log("UpdateGroup run - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);
        var updateMessages = function (groups, done) {
            if (!groups || groups.length == 0) {
                done(null, groups);
                return;
            }

            var counter=0;
            groups.forEach(function(item) {


                MessageModelV1.model.update({to_group_id: item.base_id},{$set:{roomID:item._doc._id.toString()}}, {multi:true} ,function(err,result){
                    if (err)
                    {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at save item";
                        done(err, migrateResult);
                        return;
                    }
                    else
                    {
                        counter++;
                        migrateResult.currentID = item._doc.base_id;
                        migrateResult.resultCount++;
                        if (counter % groups.length == 0) {
                            done(null, result);

                        }

                    }

                });

            });


        }

        async.waterfall([

            function (done) {
                migrateResult.firstItemOfLastPage = currentID;

                GroupModelV2.findOnlyGroups(currentID, pageSize, function (err, arrayGroup) {
                    if (err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at find item.";
                        done(err, migrateResult);
                    }

                    done(null, arrayGroup);
                });

            },
            function (arrayGroup, done) {

                if (arrayGroup.length > 0) {

                    updateMessages(arrayGroup, function (err, result) {
                        if (err) {
                            console.log("Error: " + err);
                            migrateResult.error = err;
                            migrateResult.result = result;
                            migrateResult.errorMessage = "Error at update item.";
                            done(err, migrateResult);
                        } else {
                            console.log("Item updated count: " + migrateResult.resultCount);
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
                        GroupMigration.excuteUpdate(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        GroupMigration.excuteUpdate(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        callback(null, migrateResult);
                    }

                }else{
                    endTime = new Date();

                    console.log("Group Update start at " + Utils.ShowCurrentDateTime(startTime));
                    console.log("Group Update done at " + Utils.ShowCurrentDateTime(endTime));
                    if (typeof callback === 'function')
                        callback(null, migrateResult);
                }

            }

        });
    },
    runUpdateMemberCount: function (dbm, callback) {
        DatabaseManager = dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        startTime = new Date();

        GroupModelV2.model = DatabaseManager.groupModelV2;
        UserGroupModelV2.model = DatabaseManager.userGroupModelV2;

        GroupModelV2.getLast(function (err, lastItem) {
            migrateResult.lastItem = lastItem;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at get last item";

            }else{
                migrateResult.endID = lastItem._doc.base_id;
                GroupMigration.excuteUpdateMemberCount(callback);
            }
        });

    },
    excuteUpdateMemberCount: function(callback){
        var saveItems = function (items, membersCount, done) {//items is array of Group
            if (!items || items.length == 0) {
                done(null, items);
                return;
            }

            var bulk = GroupModelV2.model.collection.initializeOrderedBulkOp();
            var counter = 0;

            items.forEach(function(item) {


                let itemMemberCount = _.find(membersCount, function (o) {

                    //console.log("oID: "+o._id.toString() + " == "+item._doc._id.toString() +"(itemID)" );
                    return o._id.toString() === item._doc._id.toString();

                });

                bulk.find({ _id: item._doc._id }).updateOne({
                    $set: {
                        member_count: itemMemberCount.membercount
                    }//,deletedBy: item._doc.deletedBy
                });

                counter++;
                migrateResult.currentID = item._doc.base_id;
                if (counter % items.length == 0) {
                    bulk.execute(function(err, result) {
                        if (err)
                        {
                            console.log("Error: " + err);
                            migrateResult.error = err;
                            migrateResult.errorMessage = "Error at save item";
                            done(err, migrateResult);
                            return;
                        }
                        else
                        {
                            migrateResult.resultCount +=items.length;
                            console.log("Item updated: " + migrateResult.resultCount);
                            done(null, result);
                            return;
                        }


                    });
                }
            });
        };


        var arrGroupID = [];
        var arrayGroup = null;
        async.waterfall([
            function (done) {
                GroupModelV2.findOnlyGroups(currentID, pageSize, function (err, results) {
                    if (err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at find item.";
                        done(err, migrateResult);
                    }
                    arrayGroup = results;
                    done(null, arrayGroup);
                });
            },

            function (groups, done) {
                _.map(groups,function (group) {
                    arrGroupID.push(group._doc._id);
                });
                migrateResult.firstItemOfLastPage = currentID;
                UserGroupModelV2.getGroupsAndCountMembers(arrGroupID, function (err, results) {
                    if (err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at find item";
                        done(err, migrateResult);
                    }
                    done(null, results);
                });

            },
            function (groupsWithMemberCount, done) {

                if (groupsWithMemberCount.length > 0) {

                    saveItems(arrayGroup, groupsWithMemberCount, function (err, result) {
                        if (err) {
                            console.log("Error: " + err);
                            migrateResult.error = err;
                            migrateResult.result = result;
                            migrateResult.errorMessage = "Error at save Item";
                            done(err, migrateResult);
                        } else {
                            console.log("Item updated count: " + migrateResult.resultCount);
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
                        GroupMigration.excuteUpdateMemberCount(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        GroupMigration.excuteUpdateMemberCount(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        console.log("GroupMigration start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("GroupMigration done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                        callback(null, migrateResult);
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

module.exports = GroupMigration;
