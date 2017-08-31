var async = require('async');
var _ = require('lodash');
var DatabaseManager;
var MessageModelV1 = require('./ModelsV1/MessageModel');
var GroupModelV2 = require('./ModelsV2/GroupModel');
var UserModelV2 = require('./ModelsV2/UserModel');
var config = require("./Config");
var Utils = require("../lib/Utils");
var migrateResult = {};
var currentID = 0;
var pageSize = 50;
var MaxPage = config.MaxPage;
var startTime = 0;
var endTime = 0;
var arrInsertedItems=[];
var DirectMessageMigration = {

    run: function (dbm,callback) {
        DatabaseManager=dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        startTime = new Date();
        arrInsertedItems=[];
        MessageModelV1.model = DatabaseManager.messageModelV1;
        GroupModelV2.model = DatabaseManager.groupModelV2;
        UserModelV2.model = DatabaseManager.userModelV2;

        MessageModelV1.getLastDirectMessage(function (err, lastMessage) {
            migrateResult.lastItem = lastMessage;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at get last item";

            }else{
                migrateResult.endID = lastMessage._doc.id;
                DirectMessageMigration.excute(callback);
            }
        });

    },
     runDistinct: function (dbm,callback) {
        DatabaseManager=dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        startTime = new Date();

        MessageModelV1.model = DatabaseManager.messageModelV1;
        GroupModelV2.model = DatabaseManager.groupModelV2;
        UserModelV2.model = DatabaseManager.userModelV2;

        GroupModelV2.getLastDirectGroup(function (err, lastGroup) {
            migrateResult.lastItem = lastGroup;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at get last item";

            }else{
                migrateResult.endID = lastGroup._doc.base_id;
                DirectMessageMigration.excuteDistinct(callback);
            }
        });

    },
     runUpdateRoom: function (dbm,callback) {
        DatabaseManager=dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        startTime = new Date();

        MessageModelV1.model = DatabaseManager.messageModelV1;
        GroupModelV2.model = DatabaseManager.groupModelV2;
        UserModelV2.model = DatabaseManager.userModelV2;

        GroupModelV2.getLastDirectGroup(function (err, lastGroup) {
            migrateResult.lastItem = lastGroup;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at get last item";

            }else{
                migrateResult.endID = lastGroup._doc.base_id;
                DirectMessageMigration.excuteUpdateRoom(callback);
            }
        });

    },
    excute: function(callback){
        console.log("migrate GroupFromDirectMessage run - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);
        var saveGroups = function (messages, done) {
            if (!messages || messages.length == 0) {
                done(null, messages);
                return;
            }

            var arrayItems = [];
            var arrUserID = [];

            var arrUser=[];
            async.waterfall([
                  function (done) {

                    _.map(messages, function(item) {

                        var  fromUserID =  _.find(arrUserID, function(id) { return id ==  item.from_user_id; });
                        if(fromUserID === undefined)
                        {
                            arrUserID.push(item.from_user_id);
                        }

                        var  toUserID =  _.find(arrUserID, function(id) { return id ==  item.to_user_id; });
                        if(toUserID === undefined)
                        {
                            arrUserID.push(item.to_user_id);
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
                    _.map(messages, function(message) {

                        var  findItem =  _.find(arrInsertedItems, function(o) { 
                             return ((o.from_user_id ==  message.from_user_id && o.to_user_id ==  message.to_user_id) || 
                              (o.from_user_id ==  message.to_user_id && o.to_user_id ==  message.from_user_id))
                            });
                                    
                        if(findItem === undefined)
                        {
                            arrInsertedItems.push({from_user_id:message.from_user_id,to_user_id:message.to_user_id});
                        
                            var  fromUserID =  _.find(arrUser, function(o) { return o.base_id ==  message.from_user_id; });
                            var  toUserID =  _.find(arrUser, function(o) { return o.base_id ==  message.to_user_id; });

                            var newgroup = new DatabaseManager.groupModelV2({
                                user_id: fromUserID !== undefined? fromUserID.userID:null,
                                to_user: toUserID !== undefined? toUserID.userID:null,
                                base_id: message._doc.id,
                                name: message.to_user_name,
                                description: "",
                                group_password: "",
                                category_id: "",
                                avatar_file_id: "",
                                avatar_thumb_file_id: "",
                                is_group: false,
                                member_count: 2,
                                created: message.created * 1000,
                                modified: message.modified * 1000
                            });

                            //console.log(arrInsertedItems.length);
                            arrayItems.push(newgroup);
                            migrateResult.currentID = newgroup._doc.base_id;    
                            migrateResult.resultCount++;
                        }
                        else
                        {
                            migrateResult.currentID = message._doc.id;
                        }

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
                MessageModelV1.findDirectMessages(currentID, pageSize, function (err, arrayMessage) {
                    if (err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at find item.";
                        done(err, migrateResult);
                    }

                    var messages = _.groupBy(arrayMessage, function(value){
                        return value.from_user_id + '#' + value.to_user_id;
                    });

                    var filterMessages = _.map(messages, function(group){
                        return group[0];
                    });
                    done(null, filterMessages);
                });

            },
            function (filterMessages, done) {

                  if (filterMessages.length > 0) {

                    saveGroups(filterMessages, function (err, result) {
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
                        DirectMessageMigration.excute(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        DirectMessageMigration.excute(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        callback(null, migrateResult);
                    }

                }else{
                    endTime = new Date();

                    console.log("Direct Message Migration start at " + Utils.ShowCurrentDateTime(startTime));
                    console.log("Direct Message Migration done at " + Utils.ShowCurrentDateTime(endTime));
                    if (typeof callback === 'function')
                        callback(null, migrateResult);
                }

            }

        });
    },
    excuteDistinct: function(callback){
        console.log("migrateDirectMessage run - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);
        var arrayItems = [];
        var getGroups = function (items, done) {
            if (!items || items.length == 0) {
                done(null, items);
                return;
            }
            var item = items[0];
            items.shift();
            var base_id=item.base_id;
            GroupModelV2.getDirectMessageConversation(item.from_user_id,item.to_user_id, function (err, results)  {
                if(err) {
                    console.log("Error: " + err);
                    migrateResult.error = err;
                    migrateResult.errorMessage = "Error at get item";
                    done(err, migrateResult);
                    return;
                }

                if(results.length > 1)
                {
                    var i=0;
                      _.map(results, function(g) {
                            i +=1;
                            if(i>1)
                            {
                                var  fromGroup =  _.find(arrayItems, function(id) { return id ==  g._doc._id; });
                                if(fromGroup === undefined)
                                {
                                    arrayItems.push(g);
                                    migrateResult.currentID = g._doc.base_id;
                                    migrateResult.resultCount++;
                                    console.log("distinct: " +migrateResult.resultCount);

                                }
                            }

                        });
                        getGroups(items,done);
                }
                else
                {
                    migrateResult.currentID = base_id;
                    console.log("No distinct: "+ base_id +":" + item.from_user_id+" - "+ item.to_user_id);
                    getGroups(items,done);
                }

            });
        },
        removeGroups = function (items, done) {
            if (!items || items.length == 0) {
                done(null, items);
                return;
            }



            async.waterfall([
                  function (done) {
                    var arrayCoupleUsers = [];
                    _.map(items, function(item) {
                        arrayCoupleUsers.push({from_user_id:item.user_id,to_user_id:item.to_user,base_id:item.base_id});
                    });

                    done(null,arrayCoupleUsers);

                },
                function (arrayCoupleUsers,done) {
                    if (arrayCoupleUsers.length > 0) {

                        getGroups(arrayCoupleUsers, function (err, result) {
                            if (err) {
                                console.log("Error: " + err);
                                migrateResult.error = err;
                                migrateResult.result = result;
                                migrateResult.errorMessage = "Error at get distinct item.";
                                done(err, migrateResult);
                            } else {
                                console.log("Item distinct items count: " + migrateResult.resultCount);
                                done(null, migrateResult);
                            }
                        });

                    }
                }
            ], function (err, result) {
                
                if(arrayItems.length <= 0) done(null, migrateResult);
                 var bulk = GroupModelV2.model.collection.initializeOrderedBulkOp(),
                        counter = 0;

                    arrayItems.forEach(function(item) {
                        
                        bulk.find({ _id: item._doc._id }).remove();
                        counter++;
                        if (counter % arrayItems.length == 0) {
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
                                    console.log("Messages updated: " + migrateResult.resultCount);
                                    done(null, result);
                                    return;
                                }


                            });
                        }



                    });

            });




        }

        async.waterfall([

            function (done) {
                migrateResult.firstItemOfLastPage = currentID;
                GroupModelV2.findDirectChatGroups(currentID, pageSize, function (err, arrayGroup) {
                    if (err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at find item.";
                        done(err, migrateResult);
                    }

                    var groups = _.groupBy(arrayGroup, function(value){
                        return value.user_id + '#' + value.to_user;
                    });

                    var filterGroups = _.map(groups, function(group){
                        return group[0];
                    });
                    done(null, filterGroups);
                });

            },
            function (filterGroups, done) {

                  if (filterGroups.length > 0) {

                    removeGroups(filterGroups, function (err, result) {
                        if (err) {
                            console.log("Error: " + err);
                            migrateResult.error = err;
                            migrateResult.result = result;
                            migrateResult.errorMessage = "Error at remove item.";
                            done(err, migrateResult);
                        } else {
                            console.log("Item removed count: " + migrateResult.resultCount);
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
                        DirectMessageMigration.excuteDistinct(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        DirectMessageMigration.excuteDistinct(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        endTime = new Date();
                        console.log("Direct Message Migration start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("Direct Message Migration done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        callback(null, migrateResult);
                    }

                }else{
                    endTime = new Date();
                    console.log("Direct Message Migration start at " + Utils.ShowCurrentDateTime(startTime));
                    console.log("Direct Message Migration done at " + Utils.ShowCurrentDateTime(endTime));
                    console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                    if (typeof callback === 'function')
                        callback(null, migrateResult);
                }

            }

        });
    },
    excuteUpdateRoom: function(callback){
        console.log("update GroupFromDirectMessage run - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);
        var arrayItems = [];
        var arrUserID = [];

        var arrUser=[];
        
        var updateMessages = function (groups, done) {
            if (!groups || groups.length == 0) {
                done(null, groups);
                return;
            }

            
            
            async.waterfall([
                  function (done) {

                    _.map(groups, function(item) {

                        var  findUserID =  _.find(arrUserID, function(id) { return id ==  item.user_id; });
                        if(findUserID === undefined)
                        {
                            arrUserID.push(item.user_id);
                        }

                        var  toUserID =  _.find(arrUserID, function(id) { return id ==  item.to_user; });
                        if(toUserID === undefined)
                        {
                            arrUserID.push(item.to_user);
                        }

                    });

                    done(null,{});

                },
                function (output,done) {
                    UserModelV2.getUsersInList(arrUserID, function (err, results)  {
                        if(results.length > 0) arrUser = results;
                        done(null,{});
                    });
                },
                function (output, done) {
                    
                    groups.map(function(group){
                        var  fromUserID =  _.find(arrUser, function(o) { return o.userID ==  group.user_id; });
                        var  toUserID =  _.find(arrUser, function(o) { return o.userID ==  group.to_user; });
                        
                        var user_id = fromUserID !== undefined? fromUserID.base_id:null;
                        var to_user = toUserID !== undefined? toUserID.base_id:null;

                        arrayItems.push({roomID:group._doc._id.toString(),from_user_id:user_id,to_user_id:to_user});
                        migrateResult.currentID = group._doc.base_id;
                        migrateResult.resultCount++;
                    });
                    done(null,arrayItems)
                }
                
            ], function (err, arrayItems) {
                  
                    var counter=0;
                    arrayItems.forEach(function(item) {
                       
                        MessageModelV1.model.update({$or:[
                                {$and: [{from_user_id: item.from_user_id}, {to_user_id: item.to_user_id}]},
                                {$and: [{from_user_id: item.to_user_id}, {to_user_id: item.from_user_id}]},
                                                ]
                            },
                        {roomID:item.roomID}, {multi:true}, function (err, result) {
                            
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
                                    if (counter % arrayItems.length == 0) {
                                        done(null, result);                                                    
                                    }
                                }

                        });
                    });
                      
                    
            });




        }

        async.waterfall([

            function (done) {
                migrateResult.firstItemOfLastPage = currentID;
                GroupModelV2.findDirectChatGroups(currentID, pageSize, function (err, arrayGroup) {
                    if (err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at find item.";
                        done(err, migrateResult);
                    }
                    
                    done(null, arrayGroup);
                });

            },
            function (filtergroups, done) {

                  if (filtergroups.length > 0) {

                    updateMessages(filtergroups, function (err, result) {
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
                        DirectMessageMigration.excuteUpdateRoom(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        DirectMessageMigration.excuteUpdateRoom(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        endTime = new Date();
                        console.log("Direct Message Migration start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("Direct Message Migration done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                        callback(null, migrateResult);
                    }

                }else{
                    endTime = new Date();
                    console.log("Direct Message Migration start at " + Utils.ShowCurrentDateTime(startTime));
                    console.log("Direct Message Migration done at " + Utils.ShowCurrentDateTime(endTime));
                    console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                    migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                    if (typeof callback === 'function')
                        callback(null, migrateResult);
                }

            }

        });
    }
}

module.exports = DirectMessageMigration;
