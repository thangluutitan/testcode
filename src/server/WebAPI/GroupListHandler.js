var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var _ = require('lodash');

var RequestHandlerBase = require("./RequestHandlerBase");
var UsersManager = require("../lib/UsersManagerRedis");
var DatabaseManager = require("../lib/DatabaseManager");
var Utils = require("../lib/Utils");
var Const = require("../const");
var async = require('async');
var GroupModel = require("../Models/GroupModel");
var UserGroupModel = require("../Models/UserGroupModel");
var MessageModel = require("../Models/MessageModel");
var UserModel = require("../Models/UserModel");
var UserBlockModel = require("../Models/UserBlockModel");
var tokenChecker = require('../lib/Auth');
var Settings = require("../lib/Settings");


var GroupListHandler = function () {
}

_.extend(GroupListHandler.prototype, RequestHandlerBase.prototype);

GroupListHandler.prototype.attach = function (router) {

    var self = this;
    /**
     * @api {get} /group/list Get group list
     * @apiName list
     * @apiGroup Frog-WebAPI
     * @apiDescription Get group list by user

     * @apiParam {Number}  userid id of user belongs to groups
     *
     * @apiSuccess {object} data
     *
     * @apiSuccessExample Success-Response:

     {
     code:1,
     data:[
     {
         _id:58c0be0294c2051cc0f1fe12,
         user_id:3,
         to_user:5,
         name:ABC,
         description:All ABC members,
         group_password:,
         avatar_file_id:,
         avatar_thumb_file_id:,
         created:1474714048,
         modified:1474714048,
         __v:0,
         is_group:false,
         category_id:1
     },
     {
         _id:58c0c52a558c1502e0aeebf7,
         user_id:3,
         to_user:null,
         name:CNN,
         description:All CNN members,
         group_password:,
         avatar_file_id:,
         avatar_thumb_file_id:,
         created:1474714048,
         modified:1474714048,
         __v:0,
         is_group:true,
         category_id:1
         }]
     }

     */
    router.get('/list/:userID', tokenChecker, function (request, response) {
        var userID = request.params.userID;

        if (Utils.isEmpty(userID)) {

            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify user id."));

            return;

        }

        // let updateDirectMessageGroup = function(arrayGroup, index, userobj){
        // arrayGroup[index].name = userobj.name;
        // arrayGroup[index].avatar_thumb_file_id = userobj.avatar_thumb_file_id;
        // arrayGroup[index].avatar_file_id = userobj.avatar_file_id; }

        let populateDirectMessage = function (err, arrayGroup) {
            if (err)
                self.errorResponse(response, Const.httpCodeSeverError);

            //Get list of directMessage
            let directMessageGroup = [];
            for (var i = 0; i < arrayGroup.length; i++) {
                if (arrayGroup[i].is_group === false) {
                    let objGroup = arrayGroup[i].toObject();
                    let userIDToUpdate = (userID === objGroup.to_user)
                        ? objGroup.user_id
                        : objGroup.to_user;
                    objGroup.user = userIDToUpdate;
                    objGroup.index = i;
                    directMessageGroup.push(objGroup);

                }
            }

            if (directMessageGroup.length > 0) {
                let currentGroup = directMessageGroup.pop();
                let updateFunc = function (objGroup) {
                    UserModel
                        .findUserbyId(objGroup.user, function (err, userobj) {
                            if (err)
                                self.errorResponse(response, Const.httpCodeSeverError);
                            arrayGroup[objGroup.index].name = userobj.name;
                            arrayGroup[objGroup.index].avatar_thumb_file_id = userobj.avatar_thumb_file_id;
                            arrayGroup[objGroup.index].avatar_file_id = userobj.avatar_file_id;

                            if (directMessageGroup.length > 0) {
                                currentGroup = directMessageGroup.pop();
                                updateFunc(currentGroup);
                            } else {
                                self.successResponse(response, Const.responsecodeSucceed, arrayGroup);
                            }

                        });
                }
                updateFunc(currentGroup);
            } else {
                self.successResponse(response, Const.responsecodeSucceed, arrayGroup);
            }

        };

        UserGroupModel.getGroupList(userID, function (err, data) {
            if (data !== undefined && data !== null) {
                var arrGroupIds = [];

                _.forEach(data, function (dataObj) {
                    arrGroupIds.push(dataObj.group_id);
                });
                GroupModel
                    .getGroupsInList(arrGroupIds, false, function (err, result) {
                        if (err)
                            self.errorResponse(response, Const.httpCodeSeverError);

                        _.forEach(result, function (item) {
                            item._doc.has_left = false;
                            var findItem = _.find(data, function (o) {
                                return o.group_id.toString() == item._id.toString()
                            });
                            if (findItem != null && findItem.has_left != null)
                                item._doc.has_left = findItem.has_left;

                        });
                        //Populate for direct message
                        populateDirectMessage(err, result);
                    });
            }

        });

    });

    /**
     * @api {get} /group/grouplist Get group list
     * @apiName list
     * @apiGroup Frog-WebAPI
     * @apiDescription Get group list by user and count all members

     * @apiParam {Number}  userid id of user belongs to groups
     *
     * @apiSuccess {object} data
     *
     * @apiSuccessExample Success-Response:

     {
     code:1,
     data:[
     {
         _id:58c0be0294c2051cc0f1fe12,
         user_id:3,
         to_user:5,
         name:ABC,
         description:All ABC members,
         group_password:,
         avatar_file_id:,
         avatar_thumb_file_id:,
         created:1474714048,
         modified:1474714048,
         member_count=5,
         __v:0,
         is_group:false,
         category_id:1
     },
     {
         _id:58c0c52a558c1502e0aeebf7,
         user_id:3,
         to_user:null,
         name:CNN,
         description:All CNN members,
         group_password:,
         avatar_file_id:,
         avatar_thumb_file_id:,
         created:1474714048,
         modified:1474714048,
         member_count=3
         __v:0,
         is_group:true,
         category_id:1
         }]
     }

     */

    router.get('/grouplist/:userID', tokenChecker, function (request, response) {
        var userID = request.params.userID;

        if (Utils.isEmpty(userID)) {

            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify user id."));

            return;

        }


        UserGroupModel.getGroupList(userID, function (err, data) {
            if (data !== undefined && data !== null) {
                var arrGroupIds = [];

                _.forEach(data, function (dataObj) {
                    arrGroupIds.push(dataObj.group_id);
                });
                GroupModel
                    .findGroups(arrGroupIds, function (err, result) {
                        if (err)
                            self.errorResponse(response, Const.httpCodeSeverError);
                        UserGroupModel.getGroupsAndCountMembers(arrGroupIds, function (err, groupCounts) {
                            if (err)
                                self.errorResponse(response, Const.httpCodeSeverError);

                            result.map(function (group) {
                                group._doc.has_left = false;
                                var findItem = _.find(data, function (o) {
                                    return o.group_id.toString() == group._id.toString()
                                });
                                if (findItem != null && findItem.has_left != null)
                                    group._doc.has_left = findItem.has_left;

                                var findGC = _.find(groupCounts, function (gc) {
                                    return gc._id.toString() == group._id.toString()
                                });
                                if (findGC != null && findGC.membercount != null)
                                    group._doc.member_count = findGC.membercount;

                            });
                            self.successResponse(response, Const.responsecodeSucceed, result);
                        });


                    });
            }

        });

    });

    /**
     * @api {get} /group/search search group
     * @apiName search
     * @apiGroup Frog-WebAPI
     * @apiDescription Get group list by name

     * @apiParam {String}  key the key to search
     *
     * @apiSuccess {object} data
     *
     * @apiSuccessExample Success-Response:

     {
     code:1,
     data:[
     {
         _id:58c0be0294c2051cc0f1fe12,
         user_id:3,
         to_user:5,
         name:ABC,
         description:All ABC members,
         group_password:,
         avatar_file_id:,
         avatar_thumb_file_id:,
         created:1474714048,
         modified:1474714048,
         member_count=4,
         __v:0,
         is_group:false,
         category_id:1
     },
     {
         _id:58c0c52a558c1502e0aeebf7,
         user_id:3,
         to_user:null,
         name:ABC & CNN,
         description:All CNN members,
         group_password:,
         avatar_file_id:,
         avatar_thumb_file_id:,
         created:1474714048,
         modified:1474714048,
         member_count=5
         __v:0,
         is_group:true,
         category_id:1
         }]
     }

     */
    router.get('/search/:key', tokenChecker, function (request, response) {

        var key = request.params.key;
        if (Utils.isEmpty(key)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("key is require."));
            return;
        }


        GroupModel.findbyName(key, function (err, result) {
            if (err) {
                self.errorResponse(response, Const.httpCodeSeverError);
            } else {
                self.successResponse(response, Const.responsecodeSucceed, result);
            }
        })


    });

    //-------------------------------------------------
    /**
     * @api {get} /group/unseenmessages Get group list with count unseen messages and last message
     * @apiName unseenmessages
     * @apiGroup Frog-WebAPI
     * @apiDescription Get group list with count unseen messages and last message

     * @apiParam {Number}  userid id of user belongs to groups
     *
     * @apiSuccess {object} data
     *
     * @apiSuccessExample Success-Response:

     {
         code:1,
         data:{
             group:{
                 _id:58c0be0294c2051cc0f1fe12,
                 user_id:3,
                 to_user:5,
                 name:ABC,
                 description:All ABC members,
                 group_password:,
                 avatar_file_id:,
                 avatar_thumb_file_id:,
                 created:1474714048,
                 modified:1474714048,
                 __v:0,
                 is_group:false,
                 category_id:1
             },
             lastmessage:{
                 _id:58c0c52a558c1502e0aeebf7,
                 user_id:3,
                 to_user:null,
                 name:CNN,
                 description:All CNN members,
                 group_password:,
                 avatar_file_id:,
                 avatar_thumb_file_id:,
                 created:1474714048,
                 modified:1474714048,
                 __v:0,
                 is_group:true,
                 category_id:1
             },
             unseen: 2
         }
     }

     */
    router.get('/unseenmessages/:userId', tokenChecker, function (request, response) {
        var userId = request.params.userId;

        if (Utils.isEmpty(userId)) {

            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify user id."));

            return;

        }
        let populateDirectMessage = function (err, arrayGroup) {
            if (err)
                self.errorResponse(response, Const.httpCodeSeverError);

            //Get list of directMessage
            let directMessageGroup = [];
            for (var i = 0; i < arrayGroup.length; i++) {
                if (arrayGroup[i].is_group === false) {
                    let objGroup = arrayGroup[i].toObject();
                    let userIDToUpdate = userId === objGroup.to_user
                        ? objGroup.user_id
                        : objGroup.to_user;
                    objGroup.user = userIDToUpdate;
                    objGroup.index = i;
                    if (userId != objGroup.user_id) {
                        arrayGroup[i].to_user = objGroup.user_id;
                        arrayGroup[i].user_id = userId;

                    }
                    directMessageGroup.push(objGroup);
                }
            }

            if (directMessageGroup.length > 0) {
                let currentGroup = directMessageGroup.pop();
                let updateFunc = function (objGroup) {
                    UserModel
                        .findUserbyId(objGroup.user, function (err, userobj) {
                            if (err)
                                self.errorResponse(response, Const.httpCodeSeverError);
                            arrayGroup[objGroup.index].name = userobj.name;
                            arrayGroup[objGroup.index].avatar_thumb_file_id = userobj.avatar_thumb_file_id;
                            arrayGroup[objGroup.index].avatar_file_id = userobj.avatar_file_id;

                            if (directMessageGroup.length > 0) {
                                currentGroup = directMessageGroup.pop();
                                updateFunc(currentGroup);
                            } else {
                                self.successResponse(response, Const.responsecodeSucceed, arrayGroup);
                            }

                        });
                }
                updateFunc(currentGroup);
            } else {
                self.successResponse(response, Const.responsecodeSucceed, arrayGroup);
            }

        };
        var blockList = [];
        var user_groups = {};
        async.waterfall([
            function (done) {
                UserBlockModel
                    .findbyUserId(userId, function (err, blockUsers) {
                        if (err) {
                            return done(err, null);
                        }

                        blockUsers.map(function (blockUser) {
                            var findUser = _.find(blockList, function (id) {
                                return id === blockUser._doc.block_user_id;
                            });
                            if (findUser === undefined) {
                                blockList.push(blockUser._doc.block_user_id);
                            }
                        });

                        done(null, blockUsers);
                    });
            },
            function (blockUsers, done) {

                UserGroupModel
                    .getGroupList(userId, function (err, result) {
                        user_groups = result;
                        done(err, result);
                    });
            },
            function (fstOutput, done) {
                if (!_.isUndefined(fstOutput)) {
                    var arrGroupIds = [];

                    _.forEach(fstOutput, function (item) {
                        arrGroupIds.push(item.group_id);
                    });
                    GroupModel
                        .getGroupsInList(arrGroupIds, true, function (err, result) {
                            _.forEach(result, function (item) {
                                item._doc.has_left = false;
                                var findItem = _.find(fstOutput, function (o) {
                                    return o.group_id.toString() == item._id.toString()
                                });
                                if (findItem != null && findItem.has_left != null)
                                    item._doc.has_left = findItem.has_left;

                            });
                            done(err, result);
                        });
                }
            },
            function (sndOutput, done) {
                if (sndOutput.length > 0) {
                    UserModel
                        .findUserbyId(userId, function (err, user) {
                            if (err)
                                return done(err, null);
                            MessageModel
                                .findUnSeenMessages(sndOutput, user, blockList, user_groups, function (err, result) {
                                    done(err, result);
                                });
                        });

                } else {
                    done(null, {});
                }

            }
        ], function (err, result) {
            if (err) {
                self.errorResponse(response, Const.httpCodeSeverError);
            } else {
                populateDirectMessage(err, result);
            }

        });

    }); //end post or get

    /**
     * @api {get} /group/statuslist Get status of all users in group
     * @apiName statuslist
     * @apiGroup Frog-WebAPI
     * @apiDescription Get status of all users in group

     * @apiParam {String}  groupid id of group chat
     *
     * @apiSuccess {object} data
     *
     * @apiSuccessExample Success-Response:

     {
     code:1,
     data:[
     {
         _id : 58b53cf3e0bf5e204c9cf1c8,
         userID : 1,
         name : thang.luu,
         about : ,
         email : thang.luu@titancorpvn.com,
         password : ,
         school_code : FROGCHAT,
         user_type : 2,
         class_group : ,
         online_status : offline,
         realStatus:offline,
         max_contact_count : 10000,
         max_favorite_count : 10000,
         chatting_with : null,
         web_token : null,
         token_timestamp : 1423284519,
         deviceid : ,
         last_login : 1423284519,
         birthday : 0,
         gender : ,
         avatar_file_id : ,
         avatar_thumb_file_id : ,
         ios_push_token : ,
         android_push_token : ,
         created : NumberLong(1421393873),
         modified : NumberLong(1421998987)
     },
     {
          _id : 58b53cf3e0bf5e204c9cf1c9,
         userID : 2,
         name : hien.pham,
         about : ,
         email : hien.pham@titancorpvn.com,
         password : ,
         school_code : FROGCHAT,
         user_type : 2,
         class_group : null,
         online_status : offline,
         realStatus:online,
         max_contact_count : 10000,
         max_favorite_count : 10000,
         chatting_with : 0,
         web_token : null,
         token_timestamp : 1484281053,
         deviceid : 861841030758598,
         last_login : 1484281053,
         birthday : 0,
         gender : ,
         avatar_file_id : Z5J4uJMq96Kqs71Dm0O61475828722,
         avatar_thumb_file_id : UnJRZKsa9tFNqEw8emhu1475828722,
         ios_push_token : ,
         android_push_token : APA91bGIGG7Ve9IsdU9V-w5LQFUA5HWIba8bywZaBCPgyYk_oYcmkedJtUVKTrOmqwuwXS_O3kJHEEXYVeapOwXft_rk95ZBRMhYni1pZ87_mmooMpaFpI9ykJYR3t8igjZV4WeRpI_P,
         created : NumberLong(1429694776),
         modified : NumberLong(1484294330)
         }]
     }

     */

    router.get('/statuslist/:groupId', tokenChecker, function (request, response) {

        var groupId = request.params.groupId;

        if (Utils.isEmpty(groupId)) {

            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify group id."));

            return;

        }

        var isvalid = Utils.CheckvalidGroup(groupId)
        if (!isvalid) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Invalid groupId."));

            return;

        }
        var onlineUsers;

        async.waterfall([
            function (done) {
                UsersManager.getUsers(groupId, function (err, result) {
                    if (err) {
                        done(err, null);
                    }
                    onlineUsers = result;
                    done(null, onlineUsers);
                });
            },
            function (onlineUsers, done) {

                UserGroupModel
                    .findbyGroupId(groupId, function (err, result) {
                        if (err)
                            return done(err, null);

                        var users = [];
                        result.map(function (item) {
                            users.push(item.user_id);
                        });
                        done(err, users);

                    });
            },
            function (fstOutput, done) {
                if (!_.isUndefined(fstOutput) && fstOutput.length > 0) {
                    UserModel
                        .getUsersInList(fstOutput, function (err, result) {
                            done(err, result);
                        });
                } else {
                    done(null, {});
                }
            },
            function (sndOutput, done) {
                if (sndOutput.length > 0) {
                    try {
                        sndOutput
                            .map(function (user) {
                                delete user._doc.token;
                                user._doc.realStatus = Const.UserStatusEnum.OffLine;
                                onlineUsers.map(function (onlineUser) {
                                    if (onlineUser.userID === user.userID) {
                                        user._doc.realStatus = Const.UserStatusEnum.OnLine;
                                        return;
                                    }
                                });
                            });
                    } catch (err) {
                        done(err, sndOutput);
                    } finally {
                        done(null, sndOutput);
                    }

                } else {
                    done(null, {});
                }

            }
        ], function (err, result) {
            if (err) {
                self.errorResponse(response, Const.httpCodeSeverError);
            } else {
                self.successResponse(response, Const.responsecodeSucceed, result);
            }
        });

    });

    /**
     * @api {post} /group/promote Get status of all users in group
     * @apiName promote
     * @apiGroup Frog-WebAPI
     * @apiDescription Promote user list to admin

     * @apiParam {String}  groupid id of group chat
     * @apiParam {Array}  users List of userID in the group [userID1,userID2,...] promote to admin
     *
     * @apiSuccess {object} data
     *
     * @apiSuccessExample Success-Response:
     *
     *
     {
         "code": 1,
         "data": {
             "n": 3,
             "nModified": 2,
             "ok": 1
         }
     }

     *
     * */
    router.post('/promote', tokenChecker, function (request, response) {
        if (_.isUndefined(request.body)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify request body."));
            return;
        }

        if (!request.body.users || request.body.users.length <= 0) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("atleast have one user id."));
            return;
        }

        if (!request.body.group_id || request.body.group_id.length == 0) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("atleast have one user id."));
            return;
        }


        var groupId = request.body.group_id;
        var users = request.body.users;

        UserGroupModel.promoteAdmin(groupId, users, function (err, result) {
            if (err) {
                self.errorResponse(response, Const.httpCodeSeverError);
                return;
            }
            self.successResponse(response, Const.responsecodeSucceed, result);

        });


    });


    /**
     * @api {get} /group/groupProfile Get status of all users in group
     * @apiName groupProfile
     * @apiGroup Frog-WebAPI
     * @apiDescription Get groupProfile infomation (Deatial of group with user in group)

     * @apiParam {String}  groupid id of group chat
     *
     * @apiSuccess {object} data
     *
     * @apiSuccessExample Success-Response:

     {
    "code": 1,
    "data": {
        "_id": "58c0e9820670d33528198ec7",
        "avatar_file_id": "",
        "avatar_thumb_file_id": "",
        "description": "All QA members from FrogChat",
        "group_password": "",
        "name": "QA FrogChat",
        "user_id": "1",
        "modified": 1474726193,
        "created": 1474726193,
        "is_group": true,
        "category_id": 1,
        "users": [
            {
                "_id": "58c0df110670d33528198e9a",
                "avatar_file_id": "58f9e0259929ca30e6cda9d0",
                "avatar_thumb_file_id": "58f9e0259929ca30e6cda9d1",
                "email": "hien.pham@titancorpvn.com",
                "name": "hien.pham",
                "school_code": "FROGCHAT",
                "user_type": "2",
                "userID": "2",
                "online_status": "online"
            },
            {
                "_id": "58c0df110670d33528198e9b",
                "avatar_file_id": "",
                "avatar_thumb_file_id": "",
                "email": "khoa.vu@titancorpvn.com",
                "name": "khoa.vu",
                "school_code": "FROGCHAT",
                "user_type": "2",
                "userID": "3",
                "online_status": "online"
            }
        ]
    }
 }


     */

    router.get('/groupProfile/:groupId', tokenChecker, function (request, response) {

        var groupId = request.params.groupId;
        var adminID = "";
        if (Utils.isEmpty(groupId)) {

            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify group id."));

            return;

        }

        var isvalid = Utils.CheckvalidGroup(groupId)
        if (!isvalid) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Invalid groupId."));

            return;

        }
        var groupProfile = {};
        var adminList = [];
        async.waterfall([
            function (done) {

                GroupModel.findGroupbyObjectId(groupId, function (err, group) {
                    if (err)
                        return done(err, null);
                    else {
                        groupProfile = group.toObject();
                        done(null, group);
                    }
                });


            },
            function (group, done) {
                UserGroupModel
                    .findbyGroupId(groupId, function (err, result) {
                        if (err)
                            return done(err, null);

                        var users = [];
                        result.map(function (item) {
                            users.push(item.user_id);
                            if (item._doc.is_admin)
                                adminList.push(item.user_id);
                        });

                        done(err, users);

                    });

            },
            function (users, done) {
                if (users.length > 0) {
                    UserModel
                        .getUsersInList(users, function (err, result) {
                            if (err)
                                return done(err, null);
                            else if (result.length > 0) {

                                groupProfile.users = result;

                                while (adminList.length > 0) {
                                    adminID = adminList.pop();
                                    var adminIndex = result.findIndex(function (u) {
                                        return u.userID == adminID;
                                    });
                                    if (adminID && adminIndex > -1)
                                        groupProfile.users[adminIndex]._doc.is_admin = true;
                                }


                                done(null, groupProfile);
                            } else {
                                groupProfile.users = [];
                                done(null, groupProfile);
                            }

                        });


                } else {
                    done(null, {});
                }

            }
        ], function (err, result) {
            if (err) {
                self.errorResponse(response, Const.httpCodeSeverError);
            } else {
                self.successResponse(response, Const.responsecodeSucceed, result);
            }
        });

    });

    /**
     * @api {post} /group/add ADD group
     * @apiName add
     * @apiGroup Frog-WebAPI
     * @apiDescription add new group chat and direct chat.

     * @apiParam {Array}  users List of userID in the group [userID1,userID2,...]
     * @apiParam {Number} to_user pass null for group chat and specific userid for direct chat
     * @apiParam {Boolean} is_group true for group chat or false for direct chat
     * @apiParam {String} name Name of the group
     * @apiParam {String} description Group description
     * @apiParam {String} group_password Group password , if empty it is public group else private group
     * @apiParam {Number} category_id Group category
     * @apiParam {String} avatar_file_id Group avatar file id
     * @apiParam {String} avatar_thumb_file_id Group avatar thumb file id
     * @apiParam {Number} created group create date ,can be empty
     * @apiSuccess {Boolean} true


     * @apiSuccessExample Success-Response:

     {
         code: 1,
         data: {{true}}
     }

     */
    router.post('/add', tokenChecker, function (request, response) {
        if (_.isUndefined(request.body)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify request body."));
            return;
        }

        if (!request.body.users || request.body.users.length <= 0) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("atleast have one user id."));
            return;
        }

        if (!request.body.is_group && Utils.isEmpty(request.body.to_user)) {

            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("The to_user parameter is require for direct chat."));

            return;
        }

        var isGroup = request.body.is_group;
        var userId = request.body.users[0];
        var userCount = request.body.users.length;
        var toUser = request.body.to_user;
        var storedGroup = {};
        // check existance Check for direct Message

        var doneWithExisting = false;
        var returnData = null;
        var directGroupName = "";
        async.waterfall([
            function (done) {

                //check for directMessage existing
                if (isGroup === false) {

                    UserModel
                        .findUserbyId(request.body.to_user, function (err, userobj) {
                            if (err) {
                                self.errorResponse(response, Const.httpCodeSeverError);
                                return;
                            }

                            directGroupName = userobj.name;

                            GroupModel.getDirectMessageConversation(userId, toUser, function (err, data) {
                                if (data.length > 0) {
                                    doneWithExisting = true;
                                    returnData = data;
                                    done(true);
                                } else {
                                    doneWithExisting = false;
                                    done(null);
                                }

                            });

                        });

                } else {
                    done(null);
                }
            },
            function (done) {

                //add group
                var newgroup = new DatabaseManager.groupModel({
                    user_id: userId,
                    to_user: isGroup
                        ? null
                        : request.body.to_user,
                    name: isGroup
                        ? request.body.name
                        : directGroupName,
                    description: request.body.description,
                    group_password: request.body.group_password,
                    category_id: request.body.category_id,
                    avatar_file_id: request.body.avatar_file_id,
                    avatar_thumb_file_id: request.body.avatar_thumb_file_id,
                    is_group: request.body.is_group,
                    is_active: true,
                    member_count: userCount,
                    created: request.body.created,
                    modified: request.body.modified
                });

                GroupModel.saveGroup(newgroup, function (err, result) {
                    if (err)
                        self.errorResponse(response, Const.httpCodeSeverError);
                    if (result != null) {
                        storedGroup = result;
                        done(err, result);
                    }

                });
            },
            function (result, done) {
                var Transaction = require('mongoose-transaction')(mongoose);
                var transaction = new Transaction();

                request
                    .body
                    .users
                    .forEach(function (userId, index) {
                        var userGroup = new DatabaseManager.userGroupModel({
                            user_id: userId,
                            group_id: result._id,
                            has_left: false,
                            created: request.body.created
                        });

                        userGroup.is_admin = index == 0 ? true : false;

                        transaction.insert(Settings.options.dbCollectionPrefix + "user_groups", userGroup);

                    });

                transaction.run(function (err, docs) {
                    done(err, result, docs);
                });
            }
        ], function (err, result) {
            if (err && !doneWithExisting) {
                GroupModel
                    .prototype
                    .removeGroup(storedGroup._id);
                self.errorResponse(response, Const.httpCodeSeverError);
            } else {

                if (doneWithExisting) {
                    UserModel
                        .findUserbyId(toUser, function (err, userobj) {
                            if (err)
                                self.errorResponse(response, Const.httpCodeSeverError);

                            returnData[0].name = userobj.name;
                            returnData[0].to_user = toUser;
                            returnData[0].user_id = userId;
                            returnData[0].avatar_thumb_file_id = userobj.avatar_thumb_file_id;
                            returnData[0].avatar_file_id = userobj.avatar_file_id;
                            returnData[0]._doc.isBlock = false;
                            //Check block user
                            UserBlockModel.findbyUserIdAndBlockUserId(toUser, userId, function (err, blockUser) {
                                if (err)
                                    self.errorResponse(response, Const.httpCodeSeverError);
                                if (blockUser !== null) {
                                    returnData[0]._doc.isBlock = true;
                                }
                                self.successResponse(response, Const.responsecodeSucceed, returnData[0]);
                            });

                        });
                } else {
                    if (request.body.is_group) {
                        var param = {
                            "userID": userId,
                            "message": "Global message",
                            "type": Const.messageCreateNewGroup
                        };
                        if (storedGroup !== undefined) {
                            param.roomID = storedGroup._id.toString();
                            param.groupName = storedGroup.name;
                            param.avatar_file_id = storedGroup.avatar_file_id;
                            param.avatar_thumb_file_id = storedGroup.avatar_thumb_file_id;
                            param.is_group = storedGroup.is_group;
                        }
                        //Send create group message to the group.
                        if (typeof global.sendMessage === 'function') {
                            global.sendMessage(userId, param, function (message) {
                                //Process if error in future. push to queue ..
                            });
                        }
                    }


                    self.successResponse(response, Const.responsecodeSucceed, result);
                }

            }

        });

    });

    /**
     * @api {post} /group/update Update group
     * @apiName update
     * @apiGroup Frog-WebAPI
     * @apiDescription update a group chat.

     * @apiParam {Array}  id ID of group (group._id or othertable.group_id)
     * @apiParam {String} name Name of the group
     * @apiParam {String} description Group description
     * @apiParam {String} group_password Group password , if empty it is public group else private group
     * @apiParam {Number} category_id Group category
     * @apiParam {String} avatar_file_id Group avatar file id
     * @apiParam {String} avatar_thumb_file_id Group avatar thumb file id
     * @apiSuccess {Boolean} true


     * @apiSuccessExample Success-Response:

     {
         code: 1,
         data: {{true}}
     }

     */
    router.post('/update', tokenChecker, function (request, response) {

        if (Utils.isEmpty(request.body.id)) {

            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify group id."));
            return;
        }

        var newgroup = new DatabaseManager.groupModel({_id: request.body.id});

        if (Utils.isEmpty(request.body.user_id)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify user id."));
            return;
        }
        newgroup.user_id = request.body.user_id;
        if (request.body.name) {
            newgroup.name = request.body.name;
        }
        if (request.body.description || request.body.description === "") {
            newgroup.description = request.body.description;
        }
        if (request.body.group_password || request.body.group_password === "") {
            newgroup.group_password = request.body.group_password;
        }
        if (request.body.category_id) {
            newgroup.category_id = request.body.category_id;
        }
        if (request.body.avatar_file_id || request.body.avatar_file_id === "") {
            newgroup.avatar_file_id = request.body.avatar_file_id;
        }
        if (request.body.avatar_thumb_file_id || request.body.avatar_thumb_file_id === "") {
            newgroup.avatar_thumb_file_id = request.body.avatar_thumb_file_id;
        }
        if (request.body.is_group) {
            newgroup.is_group = request.body.is_group;
        }
        if (request.body.user_id) {
            newgroup.user_id = request.body.user_id;
        }

        if (request.body.member_count) {
            newgroup.member_count = request.body.member_count;
        }
        newgroup.modified = new Date();


        // check existance
        var param = {"userID": request.body.user_id, "message": "Global message"};
        var updateGroup = function (group, newgroup) {
            GroupModel.updateGroup(group, newgroup, function (err, result) {
                if (err)
                    throw err;
                if (result !== null) {
                    param.type = Const.messageUpdateGroup;
                    param.roomID = request.body.id;
                    param.groupName = newgroup.name;
                    param.avatar_file_id = newgroup.avatar_file_id;
                    param.avatar_thumb_file_id = newgroup.avatar_thumb_file_id;
                    param.is_group = newgroup.is_group;
                    //Send create group message to the group.
                    if (typeof global.sendMessage === 'function') {
                        global.sendMessage(request.body.user_id, param, function (message) {
                            //Process if error in future. push to queue ..
                        });

                    }
                    self.successResponse(response, Const.responsecodeSucceed, result);
                }
                return;

            });
        }
        GroupModel.findGroupbyObjectId(newgroup.id, function (err, group) {
            if (group === null) {
                self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("The group is not exist"));
            } else {
                newgroup.created = group.created;


                //Update GroupMembers
                var userIds = request.body.userIds;

                if (Utils.isEmpty(userIds) || !_.isArray(userIds)) {
                    GroupModel.updateGroup(group, newgroup, function (err, result) {
                            if (err)
                                throw err;
                            if (result !== null) {
                                param.type = Const.messageUpdateGroup;
                                param.roomID = request.body.id;
                                param.groupName = newgroup.name;
                                param.avatar_file_id = newgroup.avatar_file_id;
                                param.avatar_thumb_file_id = newgroup.avatar_thumb_file_id;
                                param.is_group = newgroup.is_group;
                                //Send create group message to the group.
                                if (typeof global.sendMessage === 'function') {
                                    global.sendMessage(request.body.user_id, param, function (message) {
                                        //Process if error in future. push to queue ..
                                    });

                                }
                                self.successResponse(response, Const.responsecodeSucceed, result);
                            }
                            return;


                        }
                    );
                } else {
                    var addArray = [];
                    var removeArray = [];
                    var groupId = request.body.id;
                    UserGroupModel.findbyGroupId(groupId, function (err, userGroups) {
                        _.each(userGroups, function (usergroup) {
                            var findUserGroup = _.find(userIds, function (o) {
                                return o === usergroup._doc.user_id;
                            });
                            if (findUserGroup === undefined) {
                                removeArray.push(usergroup._doc.user_id);
                            }
                        });

                        _.each(userIds, function (userID) {
                            var findUserGroup = _.find(userGroups, function (o) {
                                return o._doc.user_id === userID;
                            });
                            if (findUserGroup === undefined) {
                                addArray.push(userID);
                            }
                        });

                        if (!Utils.isEmpty(userIds) && _.isArray(userIds)) {
                            newgroup.member_count = userIds.length;
                        }

                        //Remove users from group
                        if (removeArray.length > 0) {
                            UserGroupModel.removeMany(groupId, removeArray, function (err, result) {
                                if (err) {
                                    self.errorResponse(response, Const.httpCodeSeverError);
                                } else if (addArray.length > 0) {
                                    var arrItems = [];
                                    _.each(addArray, function (item) {
                                        var userGroup = new DatabaseManager.userGroupModel({
                                            user_id: item,
                                            group_id: groupId,
                                            created: Utils.now()

                                        });
                                        arrItems.push(userGroup);
                                    });
                                    //Insert new users to group
                                    UserGroupModel.insertMany(arrItems, function (err, result) {
                                        if (err) {
                                            self.errorResponse(response, Const.httpCodeSeverError);
                                        } else {
                                            result.message = "update users effected";
                                            updateGroup(group, newgroup);
                                        }
                                        return;
                                    })

                                } else {
                                    updateGroup(group, newgroup);
                                }
                            });
                        } else if (addArray.length > 0) {
                            var arrItems = [];
                            _.each(addArray, function (item) {
                                var userGroup = new DatabaseManager.userGroupModel({
                                    user_id: item,
                                    group_id: groupId,
                                    created: Utils.now()

                                });
                                arrItems.push(userGroup);
                            });
                            //Insert new users to group
                            UserGroupModel.insertMany(arrItems, function (err, result) {
                                if (err) {
                                    self.errorResponse(response, Const.httpCodeSeverError);
                                } else {
                                    result.message = "update users effected";
                                    updateGroup(group, newgroup);
                                }
                            });

                        } else {
                            updateGroup(group, newgroup);
                        }

                    });
                }
            }
        });

    }); //end post

    //-------------------------------
    /**
     * @api {post} /group/leave Leave group
     * @apiName leave
     * @apiGroup Frog-WebAPI
     * @apiDescription user leave from group chat and direct chat.

     * @apiParam {String}  groupid require.Ex:"58ae3fc9b65234277c4bb453"
     * @apiParam {Number} userid require
     *
     * @apiSuccess {Number} code
     *
     * @apiSuccessExample Success-Response:

     {
         code: 1

     }
     */
    router.post('/leave', tokenChecker, function (request, response) {

        var userid = request.body.userid;
        var groupid = request.body.groupid;

        if (Utils.isEmpty(userid)) {

            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify user id."));

            return;

        }
        if (Utils.isEmpty(groupid)) {

            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify group id."));
            return;

        }

        var isvalid = Utils.CheckvalidGroup(groupid)
        if (!isvalid) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Invalid groupId."));
            return;

        }
        var param = {};

        async
            .waterfall([
                function (done) {
                    GroupModel.findGroupbyObjectId(groupid, function (err, result) {
                        if (result === null) {
                            return done(Utils.localizeString("The groupId does not exist or inactive."), null);
                        }
                        param = {
                            "roomID": groupid,
                            "groupName": result.name,
                            "avatar_file_id": result.avatar_file_id,
                            "avatar_thumb_file_id": result.avatar_thumb_file_id,
                            "is_group": result.is_group,
                            "userID": userid,
                            "message": "Global message",
                            "type": Const.messageUserLeave
                        };
                        done(null, param);
                    });
                },
                function (param, done) {
                    //add group
                    UserGroupModel
                        .processLeave(groupid, userid, true, function (err) {
                            done(err, true);

                        });
                },
                function (fstOutput, done) {
                    var newgroup = new DatabaseManager.groupModel({_id: groupid});

                    GroupModel.findGroupbyObjectId(newgroup.id, function (err, group) {

                        newgroup.modified = new Date();
                        if (group._doc.member_count != null) {
                            newgroup._doc.member_count = group.member_count - 1;
                        }
                        GroupModel.updateGroup(group, newgroup, function (err, result) {
                                if (err)
                                    return done(err, null);

                                done(err, result);
                            }
                        );

                    });
                },
                function (sndOutput, done) {
                    UserGroupModel.findUsersInGroup(groupid, function (err, result) {
                        if (err)
                            return done(Utils.localizeString(err), null);

                        if (result.length <= 0) {
                            GroupModel.MakeGroupInActive(groupid, function (err, res) {
                                if (err) {
                                    return done(Utils.localizeString(err), null);
                                }
                                else {
                                    done(null, res);
                                }
                            });
                        }
                        else {
                            done(null, {});
                        }
                    });

                }

            ], function (err, result) {
                if (err) {
                    self.errorResponse(response, Const.httpCodeSeverError, err);
                } else {
                    //Send left group message to the group.
                    if (typeof global.sendMessage === 'function') {
                        global.sendMessage(userid, param, function (err, user) {
                            //Process if error in future. push to queue ..
                        });
                    }

                    UsersManager.removeUserOutOfRoom(groupid, userid);
                    self.successResponse(response, Const.responsecodeSucceed, result);
                }

            });

    }); //end post

    ///---------------------------------
    /**
     * @api {post} /group/adduser Add user in group
     * @apiName adduser
     * @apiGroup Frog-WebAPI
     * @apiDescription support group admin add user to group chat.

     * @apiParam {String} groupId require.Ex:"58ae3fc9b65234277c4bb453"
     * @apiParam {String} userId require
     *
     * @apiSuccess {Number} code
     *
     * @apiSuccessExample Success-Response:

     {
         code: 1

     }
     */

    router.post('/adduser', tokenChecker, function (request, response) {
        var userId = request.body.userId;
        var groupId = request.body.groupId;

        if (Utils.isEmpty(request.body)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify request body."));
            return;
        }

        if (Utils.isEmpty(userId)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("userId is require."));
            return;
        }

        if (Utils.isEmpty(groupId)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("groupId is require."));
            return;
        }

        var isvalid = Utils.CheckvalidGroup(groupId)
        if (!isvalid) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Invalid groupId."));

            return;

        }

        var objGroupId = new mongoose.mongo.ObjectId(groupId);


        async
            .waterfall([
                function (done) {
                    UserModel.findUserbyId(userId, function (err, user) {
                        if (err) {
                            return done(Utils.localizeString("Invalid userId."), null);
                        }
                        done(null, user);
                    });
                },
                function (user, done) {
                    UserGroupModel.findbyUserIdAndGroupId(userId, objGroupId, function (err, result) {
                        if (err) {
                            return done(Utils.localizeString(err), null);
                        }
                        done(null, result);
                    });
                },
                function (userGroups, done) {
                    if (!_.isUndefined(userGroups) && userGroups.length > 0) {//update
                        UserGroupModel.processLeave(groupId, userId, false, function (err) {
                            done(err, true);
                        });

                    } else {
                        var userGroup = new DatabaseManager.userGroupModel({
                            user_id: userId,
                            group_id: objGroupId,
                            has_left: false,
                            created: Utils.now()

                        });
                        UserGroupModel.save(userGroup, function (err, result) {
                            if (err)
                                return done(Utils.localizeString(err), null);

                            done(null, result);
                        });
                    }
                }
            ], function (err, final) {
                if (err) {
                    self.errorResponse(response, Const.httpCodeSeverError, err);
                } else {
                    var newgroup = new DatabaseManager.groupModel({_id: groupId});

                    GroupModel.findGroupbyObjectId(newgroup.id, function (err, group) {

                        newgroup.modified = Utils.now();
                        if (group.member_count != null)
                            newgroup.member_count = group.member_count + 1;
                        if (group.is_active != null)
                            newgroup.is_active = true;

                        GroupModel.updateGroup(group, newgroup, function (err, result) {
                            if (err) {
                                self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Invalid groupId."));
                                return;
                            }
                            var param = {
                                "roomID": groupId,
                                "groupName": group.name,
                                "avatar_file_id": group.avatar_file_id,
                                "avatar_thumb_file_id": group.avatar_thumb_file_id,
                                "is_group": result.is_group,
                                "userID": userId,
                                "message": "Global message",
                                "type": Const.messageUserJoinGroup
                            };
                            //Send join group message to the group.
                            if (typeof global.sendMessage === 'function') {
                                global.sendMessage(userId, param, function (message) {
                                    //Process if error in future. push to queue ..
                                });
                            }

                            if (null != result);
                            self.successResponse(response, Const.responsecodeSucceed, result);

                        });


                    });

                }

            });

    }); //end post

    ///---------------------------------
    /**
     * @api {post} /group/removeuser Remove user in group
     * @apiName removeuser
     * @apiGroup Frog-WebAPI
     * @apiDescription support group admin remove user from group chat.

     * @apiParam {String} groupid require.Ex:"58ae3fc9b65234277c4bb453"
     * @apiParam {String} userid require
     *
     * @apiSuccess {Number} code
     *
     * @apiSuccessExample Success-Response:

     {
         code: 1

     }
     */

    router.post('/removeuser', tokenChecker, function (request, response) {
        var userId = request.body.userId;
        var groupId = request.body.groupId;

        if (Utils.isEmpty(request.body)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify request body."));
            return;
        }

        if (Utils.isEmpty(userId)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("userId is require."));
            return;
        }

        if (Utils.isEmpty(groupId)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("groupId is require."));
            return;
        }

        var isvalid = Utils.CheckvalidGroup(groupId)
        if (!isvalid) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Invalid groupId."));

            return;

        }

        UserGroupModel
            .remove(userId, groupId, function (err) {
                if (err) {
                    self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString(err));
                } else {
                    self.successResponse(response, Const.responsecodeSucceed);
                }
            });

    }); //end post
    /**
     * @api {post} /group/updategroupmember Update members for group
     * @apiName updategroupmember
     * @apiGroup Frog-WebAPI
     * @apiDescription update members of group chat.
     * @apiParam {String} groupId require.Ex:"58ae3fc9b65234277c4bb453"
     * @apiParam {Array} userIds require. Ex ["user1@mail.com","user2@yes.my"]
     *
     * @apiSuccess {Number} code

     * @apiSuccessExample Success-Response:
     {
         code: 1,
         "data":{
            "n": 2,
            "ok": 1
         }
     }
     */
    router.post('/updategroupmember', tokenChecker, function (request, response) {

        var userIds = request.body.userIds;
        var groupId = request.body.groupId;
        if (Utils.isEmpty(request.body)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify request body."));
            return;
        }

        if (Utils.isEmpty(userIds) || !_.isArray(userIds)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Array userIds is require"));
            return;
        }

        if (Utils.isEmpty(groupId)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("groupId is require."));
            return;
        }
        var addArray = [];
        var removeArray = [];
        UserGroupModel.findbyGroupId(groupId, function (err, userGroups) {
            _.each(userGroups, function (usergroup) {
                var findUserGroup = _.find(userIds, function (o) {
                    return o === usergroup._doc.user_id;
                });
                if (findUserGroup === undefined) {
                    if (!usergroup._doc.is_admin) {
                        removeArray.push(usergroup._doc.user_id);
                    }
                }
            });

            _.each(userIds, function (userID) {
                var findUserGroup = _.find(userGroups, function (o) {
                    return o._doc.user_id === userID;
                });
                if (findUserGroup === undefined) {
                    addArray.push(userID);
                }
            });

            //Remove users from group
            if (removeArray.length > 0) {
                UserGroupModel.removeMany(groupId, removeArray, function (err, result) {
                    if (err) {
                        self.errorResponse(response, Const.httpCodeSeverError);
                    } else if (addArray.length > 0) {
                        var arrItems = [];
                        _.each(addArray, function (item) {
                            var userGroup = new DatabaseManager.userGroupModel({
                                user_id: item,
                                group_id: groupId,
                                created: Utils.now()

                            });
                            arrItems.push(userGroup);
                        });
                        //Insert new users to group
                        UserGroupModel.insertMany(arrItems, function (err, result) {
                            if (err) {
                                self.errorResponse(response, Const.httpCodeSeverError);
                            } else {
                                result.message = "update users effected";
                                self.successResponse(response, Const.responsecodeSucceed, result);
                            }
                            return;

                        })

                    } else {
                        result.message = "Remove user effected";
                        self.successResponse(response, Const.responsecodeSucceed, result);

                    }
                });
            } else if (addArray.length > 0) {
                var arrItems = [];
                _.each(addArray, function (item) {
                    var userGroup = new DatabaseManager.userGroupModel({
                        user_id: item,
                        group_id: groupId,
                        created: Utils.now()

                    });
                    arrItems.push(userGroup);
                });
                //Insert new users to group
                UserGroupModel.insertMany(arrItems, function (err, result) {
                    if (err) {
                        self.errorResponse(response, Const.httpCodeSeverError);
                    } else {
                        result.message = "update users effected";
                        self.successResponse(response, Const.responsecodeSucceed, result);
                    }
                    return;

                })

            } else {
                response.json({code: Const.responsecodeSucceed, data: [], message: "Nothing to update"});
            }

        });
    }); //end post

    /**
     * @api {get} /group/updategroupmembercount Update member_count for group
     * @apiName updategroupmember
     * @apiGroup Frog-WebAPI
     * @apiDescription update number of user of group chat.

     * @apiSuccess {Boolean} true

     * @apiSuccessExample Success-Response:
     {
         code: 1,
         data: Successfully update.
     }
     */
    router.get('/updategroupmembercount', tokenChecker, function (request, response) {
        var result = false;

        GroupModel.findAll(function (err, groups) {
            groups.map(function (group) {

                UserGroupModel.findbyGroupId(group._id, function (err, userGroups) {

                    var newgroup = new DatabaseManager.groupModel({_id: group._id});
                    newgroup.member_count = userGroups.length;
                    if (group.to_user != undefined && userGroups.length > 0) {
                        newgroup.is_group = false;
                    }
                    GroupModel.updateGroup(group, newgroup, function (err, result) {
                        if (err)
                            throw err;
                    });
                });
            });

            result = true;
        });

        if (result) {
            self.errorResponse(response, Const.httpCodeSeverError);
        } else {
            self.successResponse(response, Const.responsecodeSucceed, "Successfully update.");
        }


    }); //end post

    /**
     * @api {post} /group/hideGroups Hide groups
     * @apiName hideGroups
     * @apiGroup Frog-WebAPI
     * @apiDescription Hide groups that were not work for a long time

     * @apiParam {String}  userId id of user
     * @apiParam {Array}  groupIds List [groupID1,groupID2,...] that user want to hide
     *
     * @apiSuccess {object} data
     *
     * @apiSuccessExample Success-Response:
     *
     *
     {
         "code": 1,
         "data": {
             nInserted:0
            nMatched:2
            nModified:2
            nRemoved:0
            nUpserted:0
            ok:1
         }
     }
     *
     * */
    router.post('/hideGroups', tokenChecker, function (request, response) {
        if (_.isUndefined(request.body)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify request body."));
            return;
        }

        if (!request.body.groupIds || request.body.groupIds.length <= 0) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("atleast have one group id."));
            return;
        }

        if (Utils.isEmpty(request.body.userId)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify user id."));
            return;
        }


        var groupIds = request.body.groupIds;
        var userId = request.body.userId;
        var objectId = require('mongodb').ObjectId;
        var arrGroupIds = [];

        _.forEach(groupIds, function (groupId) {
            var isvalid = Utils.CheckvalidGroup(groupId)
            if (isvalid) {
                arrGroupIds.push(new objectId(groupId));
            }
        });

        GroupModel.getGroupsInList(arrGroupIds, false, function (err, results) {
            if (err) {
                self.errorResponse(response, Const.httpCodeSeverError);
                return;
            }

            var bulk = GroupModel.model.collection.initializeOrderedBulkOp(),
                counter = 0;

            results.forEach(function (item) {
                var hiddenBy = [];
                if (item.hiddenBy !== undefined && item.hiddenBy.length > 0) {
                    var lstUsers = [];
                    _.forEach(item.hiddenBy, function (obj) {

                        lstUsers.push(obj.userID);

                    });
                    hiddenBy = item.hiddenBy;
                    if (_.indexOf(lstUsers, userId) == -1) {

                        hiddenBy.push({userID: userId, at: Utils.now()});
                    }

                }
                else {
                    hiddenBy = [{userID: userId, at: Utils.now()}];
                }

                bulk.find({_id: item._doc._id}).updateOne({$set: {hiddenBy: hiddenBy}});
                counter++;
                if (counter % results.length == 0) {
                    bulk.execute(function (err, result) {
                        if (err) {
                            self.errorResponse(response, Const.httpCodeSeverError);
                            return;
                        }
                        else {
                            self.successResponse(response, Const.responsecodeSucceed, result);
                            console.log(result);
                            return;
                        }

                    });
                }

            });

        });


    });


}

new GroupListHandler().attach(router);
module["exports"] = router;
