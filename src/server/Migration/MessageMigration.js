var async = require('async');
var _ = require('lodash');
//var mongoose = require('mongoose');

var MessageModelV1 = require('./ModelsV1/MessageModel');
var MessageModelV2 = require('./ModelsV2/MessageModel');
var MessageStatusModelV1 = require('./ModelsV1/MessageStatusModel');
var GroupModelV2 = require('./ModelsV2/GroupModel');
var UserModelV2 = require('./ModelsV2/UserModel');
var UserGroupModelV2 = require('./ModelsV2/UserGroupModel');
var config = require("./Config");
var Utils = require("../lib/Utils");
var Const = require("../const");

var migrateResult = {};
var currentID = 0;
var pageSize = 1000;
var MaxPage = config.MaxPage;
var startTime = 0;
var endTime = 0;
var DatabaseManager ;


var MessageMigration = {

    run: function (dbm,callback) {
        DatabaseManager = dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        startTime = new Date();

        MessageModelV1.model = DatabaseManager.messageModelV1;
        MessageModelV2.model = DatabaseManager.messageModelV2;
        GroupModelV2.model = DatabaseManager.groupModelV2;

        MessageModelV1.getLast(function (err, lastMessage) {
            migrateResult.lastItem = lastMessage;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at get last item";

            }else{
                migrateResult.endID = lastMessage._doc.id;
                MessageMigration.excute(callback);
            }
        });

    },
    runUpdate: function (dbm,callback) {
        DatabaseManager = dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        startTime = new Date();

        MessageModelV1.model = DatabaseManager.messageModelV1;
        MessageModelV2.model = DatabaseManager.messageModelV2;
        GroupModelV2.model = DatabaseManager.groupModelV2;
        MessageStatusModelV1.model = DatabaseManager.messageStatusModelV1;
        UserModelV2.model = DatabaseManager.userModelV2;
        UserGroupModelV2.model = DatabaseManager.userGroupModelV2;

        MessageModelV2.getLast(function (err, lastMessage) {
            migrateResult.lastItem = lastMessage;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at get last item";

            }else{
                migrateResult.endID = lastMessage._doc.base_id;
                MessageMigration.excuteUpdate(callback);
            }
        });



    },

    runUpdateLocalID: function (dbm,callback) {
        DatabaseManager = dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        startTime = new Date();

        MessageModelV1.model = DatabaseManager.messageModelV1;
        MessageModelV2.model = DatabaseManager.messageModelV2;
        GroupModelV2.model = DatabaseManager.groupModelV2;
        MessageStatusModelV1.model = DatabaseManager.messageStatusModelV1;
        UserModelV2.model = DatabaseManager.userModelV2;
        UserGroupModelV2.model = DatabaseManager.userGroupModelV2;

        MessageModelV2.getLast(function (err, lastMessage) {
            migrateResult.lastItem = lastMessage;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at get last item";

            }else{
                migrateResult.endID = lastMessage._doc.base_id;
                MessageMigration.excuteUpdateLocalID(callback);
            }
        });

    },
    excute: function(callback){
        console.log("migrateMessage run - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);

        var saveMessages = function (messages, done) {
            if (!messages || messages.length == 0) {
                done(null, messages);
                return;
            }

            var arrayItems=[];
            _.map(messages, function(message){
                MessageMigration.prepareData(message);
                var newMessage = new DatabaseManager.messageModelV2({
                    base_id : message._doc.id,
                    user: null,
                    localID: message._doc.localID,
                    userID: message.from_user_id,
                    roomID: message.roomID,
                    type: message.type,
                    message: message.body,
                    image: null,
                    file:message._doc.file,
                    seenBy: message.seenBy,
                    location: message.location,
                    deleted: message.deleted,
                    created: message.created * 1000,
                    attributes: {}
                });

                arrayItems.push(newMessage);
                migrateResult.currentID = newMessage._doc.base_id;

                migrateResult.resultCount++;
            });



            MessageModelV2.insertMany(arrayItems,  function (err, result) {
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




        }

        async.waterfall([

            function (done) {
                migrateResult.firstItemOfLastPage = currentID;

                MessageModelV1.findMultiMessages(currentID, pageSize, function (err, arrayMessage) {
                    if (err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at find item.";
                        done(err, migrateResult);
                    }


                    done(null, arrayMessage);

                });

            },
            function (filterMessages, done) {

                if (filterMessages.length > 0) {

                    saveMessages(filterMessages, function (err, result) {
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
                        MessageMigration.excute(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        MessageMigration.excute(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        callback(null, migrateResult);
                    }

                }else{

                    endTime = new Date();

                    console.log("MessageMigration start at " + Utils.ShowCurrentDateTime(startTime));
                    console.log("MessageMigration done at " + Utils.ShowCurrentDateTime(endTime));
                    if (typeof callback === 'function')
                        callback(null, migrateResult);
                }

            }

        });
    },
    excuteUpdate: function(callback){
        console.log("Update message run - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);



        var arrayItems=[];
        var saveMessages = function (messages, done) {
            if (!messages || messages.length == 0) {
                done(null, messages);
                return;
            }


            var arrUserID=[];
            var arrGroupID=[];
            var arrMessageID=[];
            var arrRoomID=[];

            var arrUser=[];
            var arrGroup=[];
            var arrMessageStatus =[];
            var objectId = require('mongodb').ObjectId;

            async.waterfall([
                function (done) {

                    _.map(messages, function(item) {

                        var  findMessageID =  _.find(arrMessageID, function(id) { return id ==  item.base_id; });
                        if(findMessageID === undefined)
                        {
                            arrMessageID.push(item.base_id);
                        }

                        var roomID = item._doc.roomID



                        var  findRoom =  _.find(arrRoomID, function(id) { return id ==  roomID; });
                        if(findRoom === undefined)
                        {
                            arrRoomID.push(roomID);
                        }
                    });

                    _.forEach(arrRoomID, function (r) {
                        var objGroupId = new objectId(r);
                        arrGroupID.push(objGroupId);
                    });
                    done(null,{});

                },
                function (output,done) {
                    MessageStatusModelV1.getInList(arrMessageID, function (err, results)  {
                        if(results.length > 0) arrMessageStatus = results;
                        done(null,{});
                    });
                },
                function (output,done) {
                    UserGroupModelV2.getGroupInList(arrGroupID, function (err, user_groups)  {
                        if (user_groups !== null || user_groups.length > 0) {
                            arrGroup = user_groups;
                            _.forEach(user_groups, function (user_group) {

                                var  findUserID =  _.find(arrUserID, function(id) { return id ==  user_group.user_id; });
                                if(findUserID === undefined)
                                {
                                    arrUserID.push(user_group.user_id);
                                }

                            });

                            done(null,{});
                        }
                    });
                },
                function (output, done) {
                    UserModelV2.getUsersInList(arrUserID,function(err,users){
                        if (users !== null || users.length > 0) {
                            arrUser = users;
                        }
                        done(err,{});
                    });
                },
                function (output, done) {
                    _.map(messages, function(item) {


                        var  findMsgs =  arrMessageStatus.filter( function(o) {
                            if( o.message_id ===  item._doc.base_id) return o;
                        });

                        var findGroups = arrGroup.filter( function(o){
                            if( o.group_id.toString() ===  item._doc.roomID) return o;
                        });


                        _.map(findGroups, function (g) {
                            var  findUser =  _.find(arrUser, function(o) { return o.userID ===  g.user_id; });
                            item._doc.seenBy.push({user: findUser._id, at: Utils.now()});

                            if(findMsgs.length > 0)
                            {
                                var  find =  _.find(findMsgs, function(o) { return o.user_id ===  findUser.base_id });
                                if(find === undefined)
                                {
                                    item._doc.deletedBy.push({user: findUser._id,userID:findUser.userID, at: Utils.now()});

                                }

                            }else{
                                item._doc.deletedBy.push({user: findUser._id,userID:findUser.userID, at: Utils.now()});
                            }


                        });

                        var  sendUser =  _.find(arrUser, function(o) { return o.base_id.toString() ===  item._doc.userID; });
                        if(sendUser !== undefined)
                        {
                            item._doc.userID = sendUser.userID;
                            item._doc.user = sendUser._id;
                        }
                        arrayItems.push(item);
                        migrateResult.currentID = item._doc.base_id;
                        migrateResult.resultCount++;

                    });
                    done(null,arrayItems);
                }
            ], function (err, result) {
                var bulk = MessageModelV2.model.collection.initializeOrderedBulkOp(),
                    counter = 0;

                result.forEach(function(item) {
                    bulk.find({ _id: item._doc._id }).updateOne({
                        $set: { seenBy: item._doc.seenBy,deletedBy: item._doc.deletedBy,
                            userID:item._doc.userID,user:item._doc.user
                        }//,deletedBy: item._doc.deletedBy
                    });

                    counter++;
                    if (counter % result.length == 0) {
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

                MessageModelV2.findMultiMessages(currentID, pageSize, function (err, arrayMessage) {
                    if (err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at find item.";
                        done(err, migrateResult);
                    }



                    done(null, arrayMessage);

                });

            },
            function (filterMessages, done) {

                if (filterMessages.length > 0) {

                    saveMessages(filterMessages, function (err, result) {
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
                        MessageMigration.excuteUpdate(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        MessageMigration.excuteUpdate(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        endTime = new Date();
                        console.log("************************************************* ");
                        console.log("Message update start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("Message update done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                        callback(null, migrateResult);
                    }

                }else{
                    endTime = new Date();
                    console.log("************************************************* ");
                    console.log("Message update start at " + Utils.ShowCurrentDateTime(startTime));
                    console.log("Message update done at " + Utils.ShowCurrentDateTime(endTime));
                    console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                    migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                    if (typeof callback === 'function')
                        callback(null, migrateResult);
                }

            }

        });
    },

    excuteUpdateLocalID: function(callback){
        console.log("migrateDirectMessage run - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);


        var saveMessages = function (messages, done) {
            if (!messages || messages.length == 0) {
                done(null, messages);
                return;
            }

            var bulk = MessageModelV2.model.collection.initializeOrderedBulkOp(),
                counter = 0;

            messages.forEach(function(item) {
                var localID = Utils.randomString(32,"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_") + item._doc.created;
                bulk.find({ _id: item._doc._id }).updateOne({$set: { localID: localID}});

                counter++;
                if (counter % messages.length == 0) {
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


        }

        async.waterfall([

            function (done) {
                migrateResult.firstItemOfLastPage = currentID;

                MessageModelV2.findMultiMessages(currentID, pageSize, function (err, arrayMessage) {
                    if (err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at find item.";
                        done(err, migrateResult);
                    }



                    done(null, arrayMessage);

                });

            },
            function (filterMessages, done) {

                if (filterMessages.length > 0) {

                    saveMessages(filterMessages, function (err, result) {
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

                console.log("Update LocalID success page :" + migrateResult.currentPage);
                migrateResult.currentPage++;
                if (migrateResult.currentID < migrateResult.endID){
                    currentID = migrateResult.currentID;
                    if (MaxPage == 0)
                        MessageMigration.excuteUpdateLocalID(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        MessageMigration.excuteUpdateLocalID(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        endTime = new Date();
                        console.log("************************************************* ");
                        console.log("Message update localID start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("Message update localID done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                        callback(null, migrateResult);
                    }

                }else{
                    endTime = new Date();
                    console.log("************************************************* ");
                    console.log("Message update localID start at " + Utils.ShowCurrentDateTime(startTime));
                    console.log("Message update localID done at " + Utils.ShowCurrentDateTime(endTime));
                    console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                    migrateResult.timeSpent = "Time spent: " + Utils.ShowDiffDateTime(endTime,startTime);
                    if (typeof callback === 'function')
                        callback(null, migrateResult);
                }

            }

        });
    },

    prepareData: function (message) {
        //localID
        message._doc.localID = Utils.randomString(32,"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_") + message.created;
        //message type
        if(message.message_type === "text")
        {
            message.type = Const.messageTypeText;
        }
        if(message.message_type === "image")
        {
            message.type = Const.messageTypeFile;
        }

        if (!Utils.isEmpty(message.picture_file_id)) {
            message._doc.file = {};
            message._doc.file.file = {

                id: null,
                name: message.picture_file_id,
                size: 0,
                mimeType: "image/jpeg"
            };
        }

        if (!Utils.isEmpty(message.picture_thumb_file_id)) {
            message._doc.file.thumb = {
                id: null,
                name: message.picture_thumb_file_id,
                size: 0,
                mimeType: "image/jpeg"
            };

        }

        if (!Utils.isEmpty(message.longitude)) {
            message._doc.location.lng = message.longitude
        }

        if (!Utils.isEmpty(message.latitude)) {
            message._doc.location.lat = message.latitude
        }
    },





    runUpdateBlockMessage: function (dbm,callback) {
        DatabaseManager = dbm;
        currentID = 0;
        pageSize = config.PageSize;
        migrateResult.currentID = currentID;
        migrateResult.pageSize = pageSize;
        migrateResult.resultCount = 0;
        migrateResult.currentPage = 1;
        startTime = new Date();

        MessageModelV1.model = DatabaseManager.messageModelV1;
        MessageModelV2.model = DatabaseManager.messageModelV2;
        UserModelV2.model = DatabaseManager.userModelV2;
        UserGroupModelV2.model = DatabaseManager.userGroupModelV2;

        MessageModelV1.getLastBlockMessage(function (err, lastMessage) {
            migrateResult.lastItem = lastMessage;
            if (err) {
                console.log("Error: " + err);
                migrateResult.error = err;
                migrateResult.errorMessage = "Error at get last item";

            }else{
                migrateResult.endID = lastMessage._doc.id;
                MessageMigration.excuteUpdateBlockMessage(callback);
            }
        });



    },
    excuteUpdateBlockMessage: function(callback){
        console.log("migrateDirectMessage run - page : " + migrateResult.currentPage + " || firstItemOfPage: " + currentID);


        var updateBlockMessage = function (users, messagesV1, done) {//items is array of Message V2
            if (!users || users.length == 0 || !messagesV1 || messagesV1.length == 0) {
                done(null, {});
                return;
            }

            var bulk = MessageModelV2.model.collection.initializeOrderedBulkOp();
            var counter = 0;

            messagesV1.forEach(function(item) {


                let user = _.find(users, function (o) {

                    //console.log("oID: "+o._id.toString() + " == "+item._doc._id.toString() +"(itemID)" );
                    return o._doc.base_id === item._doc.to_user_id;

                });
                let blockedUser = [];

                blockedUser.push({userID: user._doc.userID, at: Utils.now()});

                bulk.find({ base_id : item._doc.id }).updateOne({
                    $set: {
                        blockedBy: blockedUser
                    }//,deletedBy: item._doc.deletedBy
                });

                counter++;
                migrateResult.currentID = item._doc.id;
                if (counter % messagesV1.length == 0) {
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
                            migrateResult.resultCount +=messagesV1.length;
                            console.log("Item updated: " + migrateResult.resultCount);
                            done(null, result);
                            return;
                        }


                    });
                }
            });
        };

        var arrMessageV1 = [];
        async.waterfall([

            function (done) {
                migrateResult.firstItemOfLastPage = currentID;

                MessageModelV1.findBlockedMessages(currentID, pageSize, function (err, arrayMessage) {
                    if (err) {
                        console.log("Error: " + err);
                        migrateResult.error = err;
                        migrateResult.errorMessage = "Error at find item.";
                        done(err, migrateResult);
                    }
                    var arrUserBaseID = [];
                    arrMessageV1 = arrayMessage;
                    _.map(arrayMessage,function (message) {
                        let from_user_id = _.find(arrUserBaseID, function (o) {
                            return o === message.from_user_id;
                        });

                        if(from_user_id === undefined)
                        {
                            arrUserBaseID.push(message._doc.from_user_id);
                        }

                        let to_user_id = _.find(arrUserBaseID, function (o) {
                            return o === message.to_user_id;
                        });

                        if(to_user_id === undefined)
                        {
                            arrUserBaseID.push(message._doc.to_user_id);
                        }

                    });
                    done(null, arrUserBaseID);

                });

            },
            function (listBaseID, done) {

                if (listBaseID.length > 0) {

                    UserModelV2.getUsersInListBaseID(listBaseID, function (err, result) {
                        if (err) {
                            console.log("Error: " + err);
                            migrateResult.error = err;
                            migrateResult.errorMessage = "Error at find item.";
                            done(err, migrateResult);
                        }
                        done(null, result);

                    });

                }
            },
            function (userList, done) {
                if (userList.length > 0 && arrMessageV1.length > 0) {

                    updateBlockMessage(userList, arrMessageV1, function (err, result) {
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
            }
        ], function (err, result) {

            if (err) {
                console.log("err" + err);
                if (typeof callback === 'function')
                    callback(err, result);
            } else {

                console.log("Update Block Message success page :" + migrateResult.currentPage);
                migrateResult.currentPage++;
                if (migrateResult.currentID < migrateResult.endID){
                    currentID = migrateResult.currentID;
                    if (MaxPage == 0)
                        MessageMigration.excuteUpdate(callback);
                    else if (migrateResult.currentPage <= MaxPage)
                        MessageMigration.excuteUpdate(callback);
                    else{
                        migrateResult.message = "Done by hit maxpage limit in test-mode";
                        endTime = new Date();
                        console.log("************************************************* ");
                        console.log("Update block message start at " + Utils.ShowCurrentDateTime(startTime));
                        console.log("Update block message  done at " + Utils.ShowCurrentDateTime(endTime));
                        console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                        callback(null, migrateResult);
                    }

                }else{
                    endTime = new Date();
                    console.log("************************************************* ");
                    console.log("Update block message start at " + Utils.ShowCurrentDateTime(startTime));
                    console.log("Update block message  done at " + Utils.ShowCurrentDateTime(endTime));
                    console.log("Time spent: " + Utils.ShowDiffDateTime(endTime,startTime));
                    if (typeof callback === 'function')
                        callback(null, migrateResult);
                }

            }

        });
    },

}

module.exports = MessageMigration;
