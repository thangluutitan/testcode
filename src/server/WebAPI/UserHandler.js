var express = require('express');
var router = express.Router();
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var RequestHandlerBase = require("./RequestHandlerBase");
var DatabaseManager = require("../lib/DatabaseManager");
var Utils = require("../lib/Utils");
var Const = require("../const");
var async = require('async');
var tokenChecker = require('../lib/Auth');
var UserModel = require("../Models/UserModel");
var UserContactModel = require("../Models/UserContactModel");
var UserFavouriteModel = require("../Models/UserFavouriteModel");
var UserBlockModel = require("../Models/UserBlockModel");
var UserUtils = require("../lib/UserUtils");


var UserHandler = function () {
}

_.extend(UserHandler.prototype, RequestHandlerBase.prototype);

UserHandler.prototype.attach = function (router) {

    var self = this;

    /**
     * @api {get} /user/all  get all users
     * @apiName all
     * @apiGroup Frog-WebAPI
     * @apiDescription get all users

     * @apiSuccessExample Success-Response:
     {
       "code": 1,
       "data": [
         {
          _id : 58b53cf3e0bf5e204c9cf1cc,
           userID : 7,
           name : Edwin Chong,
           about : ,
           email : edwin.chong@frogasia.com,
           password : ,
           school_code : FROGCHAT,
           user_type : 2,
           class_group : null,
           online_status : online,
           max_contact_count : 20,
           max_favorite_count : 0,
           chatting_with : 0,
           token : wVZCAkCcdrbxQE9QCQmPeokmZLO2Xo7tj66UqI6E,
           web_token : LRgTAyr9XCWAAT8FMfnvhOM91RDpZMdKDuDe24nZ,
           token_timestamp : 1474727862,
           deviceid : 866504021092337,
           last_login : 1474727862,
           birthday : 0,
           gender : ,
           avatar_file_id : wPb3EWMnxoySkejKwiq21474710199,
           avatar_thumb_file_id : LDk34DGHbXGnr3xCuc7g1474710199,
           ios_push_token : ,
           android_push_token : ,
           created : NumberLong(0),
           modified : NumberLong(1474727371)
         },
         {
          _id : 58b53cf3e0bf5e204c9cf1ca,
           userID : 7,
           name : thanh.doan,
           about : ,
           email : thanh.doan@frogasia.com,
           password : ,
           school_code : FROGCHAT,
           user_type : 2,
           class_group : null,
           online_status : online,
           max_contact_count : 20,
           max_favorite_count : 0,
           chatting_with : 0,
           token : wVZCAkCcdrbxQE9QCQmPeokmZLO2Xo7tj66UqI6E,
           web_token : LRgTAyr9XCWAAT8FMfnvhOM91RDpZMdKDuDe24nZ,
           token_timestamp : 1474727862,
           deviceid : 866504021092337,
           last_login : 1474727862,
           birthday : 0,
           gender : ,
           avatar_file_id : wPb3EWMnxoySkejKwiq21474710199,
           avatar_thumb_file_id : LDk34DGHbXGnr3xCuc7g1474710199,
           ios_push_token : ,
           android_push_token : ,
           created : NumberLong(0),
           modified : NumberLong(1474727371)
         }]

     }
     */
    router.get('/all', tokenChecker, function (request, response) {
        UserModel
            .findAll(function (err, result) {
                if (err) {
                    self.errorResponse(response, Const.httpCodeSeverError);
                } else {
                    result.map(v => delete v._doc.token);
                    self.successResponse(response, Const.responsecodeSucceed, result);
                }
            })

    });

    /**
     * @api {get} /user/search  Search user by name or vle
     * @apiName search
     * @apiGroup Frog-WebAPI
     * @apiDescription Search user by name or vle

     * @apiParam {String} userId UserId
     * @apiParam {String} key User's name or vle is YesID
     *
     *
     * @apiSuccessExample Success-Response:
     {
       "code": 1,
       "data":
         {
          _id : 58b53cf3e0bf5e204c9cf1cc,
           userID : 7,
           name : Edwin Chong,
           about : ,
           email : edwin.chong@frogasia.com,
           password : ,
           school_code : FROGCHAT,
           user_type : 2,
           class_group : null,
           online_status : online,
           max_contact_count : 20,
           max_favorite_count : 0,
           chatting_with : 0,
           token : wVZCAkCcdrbxQE9QCQmPeokmZLO2Xo7tj66UqI6E,
           web_token : LRgTAyr9XCWAAT8FMfnvhOM91RDpZMdKDuDe24nZ,
           token_timestamp : 1474727862,
           deviceid : 866504021092337,
           last_login : 1474727862,
           birthday : 0,
           gender : ,
           avatar_file_id : wPb3EWMnxoySkejKwiq21474710199,
           avatar_thumb_file_id : LDk34DGHbXGnr3xCuc7g1474710199,
           ios_push_token : ,
           android_push_token : ,
           created : NumberLong(0),
           modified : NumberLong(1474727371)
         }

     }
     */

    router.get('/search/:userId/:key', tokenChecker, function (request, response) {
        var userId = request.params.userId;
        var key = request.params.key;
        if (Utils.isEmpty(key)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("key is require."));
            return;
        }

        UserContactModel
            .getUserContactList(userId, function (err, data) {
                if (data != null && data.length > 0) {
                    data.push(userId);
                }
                else {
                    data = [userId];
                }

                UserModel
                    .findUsersbykey(key, data, function (err, result) {
                        if (err) {
                            self.errorResponse(response, Const.httpCodeSeverError);
                        } else {
                            result.map(v => delete v._doc.token);
                            self.successResponse(response, Const.responsecodeSucceed, result);
                        }
                    })

            });

    });

    /**
     * @api {get} /user/profile  Get user profile
     * @apiName profile
     * @apiGroup Frog-WebAPI
     * @apiDescription Get user profile

     * @apiParam {String} myId UserId
     * @apiParam {String} userId UserId
     * @apiParam {String} isMyself isMyself
     *
     *
     * @apiSuccessExample Success-Response:
     {
       "code": 1,
       "data":
         {
          _id : 58b53cf3e0bf5e204c9cf1cc,
           name : Edwin Chong,
           online_status : online,
           avatar_file_id : wPb3EWMnxoySkejKwiq21474710199,
           avatar_thumb_file_id : LDk34DGHbXGnr3xCuc7g1474710199,
           vle : Edwin.Chong@Yes.My

         }

     }
     */
    router.get('/profile/:myId/:userId/:isMyself', tokenChecker, function (request, response) {
        var myId = request.params.myId;
        var userId = request.params.userId;
        var isMyself = request.params.isMyself;

        if (Utils.isEmpty(myId)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("myId is require."));
            return;
        }

        if (Utils.isEmpty(userId)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("userId is require."));
            return;
        }
        var tmpObj = {};
        if (isMyself === "true") {

            async
                .waterfall([
                    function (done) {
                        UserUtils
                            .countSharedMedia(myId, userId, function (result) {
                                tmpObj.sharedMedia = result;
                                done(null, tmpObj);
                            });
                    },
                    function (tmpObj, done) {
                        UserUtils
                            .countSharedContact(myId, userId, function (result) {
                                tmpObj.sharedContact = result;
                                done(null, tmpObj);
                            });
                    },
                    function (tmpObj, done) {
                        UserModel
                            .findProfilebyId(myId, function (err, user) {
                                if (err)
                                    done(err, null);
                                if (user !== null)
                                    user._doc.sharedMedia = tmpObj.sharedMedia;
                                user._doc.sharedContact = tmpObj.sharedContact;
                                done(null, user);
                            });
                    }
                ], function (err, result) {
                    if (err) {
                        self.errorResponse(response, Const.httpCodeSeverError);
                    } else {
                        self.successResponse(response, Const.responsecodeSucceed, result);
                    }
                });
        } else {
            async
                .waterfall([
                    function (done) {
                        UserUtils
                            .countSharedMedia(myId, userId, function (result) {
                                tmpObj.sharedMedia = result;
                                done(null, tmpObj);
                            });
                    },
                    function (tmpObj, done) {
                        UserUtils
                            .countSharedGroup(myId, userId, function (result) {
                                tmpObj.sharedGroup = result;
                                done(null, tmpObj);
                            });
                    },
                    function (tmpObj, done) {
                        UserUtils
                            .countSharedContact(myId, userId, function (result) {
                                tmpObj.sharedContact = result;
                                done(null, tmpObj);
                            });
                    },
                    function (tmpObj, done) {
                        UserContactModel
                            .findUserContact(myId, userId, function (err, result) {
                                if (err) done(err, null);
                                if (result !== undefined && result.length > 0) {
                                    tmpObj.is_primary = result[0].is_primary;
                                    tmpObj.user_contact_objectId = result[0]._id.toString();
                                }
                                done(null, tmpObj);
                            });
                    },
                    function (tmpObj, done) {
                        UserFavouriteModel
                            .findUserFavourite(myId, userId, function (err, result) {
                                if (err) done(err, null);
                                if (result !== undefined && result.length > 0) {
                                    tmpObj.is_favorites = true;
                                    tmpObj.user_favourite_objectId = result[0]._id.toString();
                                } else {
                                    tmpObj.is_favorites = false;
                                }
                                done(null, tmpObj);
                            });
                    },
                    function (tmpObj, done) {
                        tmpObj.isBlock = false;
                        UserBlockModel.findbyUserIdAndBlockUserId(myId, userId, function (err, blockUser) {
                            if (err)
                                self.errorResponse(response, Const.httpCodeSeverError);
                            if (blockUser !== null) {
                                tmpObj.isBlock = true;
                            }
                            done(null, tmpObj);
                        });

                    },
                    function (tmpObj, done) {
                        UserModel
                            .findProfilebyId(userId, function (err, user) {
                                if (err)
                                    done(err, null);
                                if (user !== null) {
                                    user._doc.sharedMedia = tmpObj.sharedMedia;
                                    user._doc.sharedGroup = tmpObj.sharedGroup;
                                    user._doc.sharedContact = tmpObj.sharedContact;
                                    user._doc.is_favorites = tmpObj.is_favorites;
                                    user._doc.is_primary = tmpObj.is_primary;
                                    user._doc.user_contact_objectId = tmpObj.user_contact_objectId;
                                    user._doc.user_favourite_objectId = tmpObj.user_favourite_objectId;
                                    user._doc.isBlock = tmpObj.isBlock;
                                }
                                done(null, user);
                            });
                    }
                ], function (err, result) {
                    if (err) {
                        self.errorResponse(response, Const.httpCodeSeverError);
                    } else {
                        self.successResponse(response, Const.responsecodeSucceed, result);
                    }
                });
        }

    });

    /**
     * @api {post} /user/updateprofile  Update user profile
     * @apiName updateprofile
     * @apiGroup Frog-WebAPI
     * @apiDescription Update user profile

     * @apiParam {String} userid User Id
     * @apiParam {String} avatar_file_id avatar file name
     * @apiParam {String} avatar_thumb_file_id avatar thumb file name
     * @apiParam {String} online_status User status
     *
     *
     * @apiSuccessExample Success-Response:
     {
       "code": 1,
       "data":
         {
           n : 1,
           nModified : 1,
           ok : 1
         }

     }*/
    router.post('/updateprofile', tokenChecker, function (request, response) {
        var userid = request.body.userid;
        var avatar_file_id = request.body.avatar_file_id;
        var avatar_thumb_file_id = request.body.avatar_thumb_file_id;
        var online_status = request.body.online_status;

        if (Utils.isEmpty(userid)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify User Id."));
            return;
        }

        async
            .waterfall([
                function (done) {
                    UserModel
                        .findUserbyId(userid, function (err, user) {
                            if (err)
                                done(err, null);
                            if (user === null) {
                                self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Invalid User Id."));
                                return;
                            }
                            done(null, user);
                        });
                },
                function (user, done) {

                    var newuser = new DatabaseManager.userModel({_id: user._id});

                    if (!_.isUndefined(avatar_file_id))
                        newuser.avatar_file_id = avatar_file_id;
                    if (!_.isUndefined(avatar_thumb_file_id))
                        newuser.avatar_thumb_file_id = avatar_thumb_file_id;
                    if (!Utils.isEmpty(online_status))
                        newuser.online_status = online_status;
                    newuser.modified = new Date();

                    UserModel.updateUser(user, newuser, function (err, user) {
                        if (err)
                            done(err, null);

                        done(null, user);
                    });
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
     * @api {post} /user/registernotification  Update notification token
     * @apiName registernotification
     * @apiGroup Frog-WebAPI
     * @apiDescription Update push notification registration token by user

     * @apiParam {String} userid User Id.
     * @apiParam {String} android_push_token Devide registration token for Android
     * @apiParam {String} ios_push_token Devide registration token for iOS
     *
     *
     * @apiSuccessExample Success-Response:
     {
       "code": 1,
       "data":
         {
           n : 1,
           nModified : 1,
           ok : 1
         }

     }*/
    router.post('/registernotification', tokenChecker, function (request, response) {
        var userid = request.body.userid;
        var android_push_token = request.body.android_push_token;
        var ios_push_token = request.body.ios_push_token;

        if (Utils.isEmpty(userid)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify User Id."));
            return;
        }

        async
            .waterfall([
                function (done) {
                    UserModel
                        .ClearAndroidPushNotification(android_push_token, function (err, user) {
                            if (err)
                                done(err, null);

                            done(null, true);
                        });
                },
                function (result, done) {
                    UserModel
                        .findUserbyId(userid, function (err, user) {
                            if (err)
                                done(err, null);
                            if (user === null) {
                                self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Invalid User Id."));
                                return;
                            }
                            done(null, user);
                        });
                },
                function (user, done) {

                    var newuser = new DatabaseManager.userModel({_id: user._id});

                    if (!Utils.isEmpty(android_push_token))
                        newuser.android_push_token = android_push_token;

                    if (!Utils.isEmpty(ios_push_token))
                        newuser.ios_push_token = ios_push_token;

                    newuser.is_admin = user.is_admin;
                    newuser.online_status = user.online_status;
                    newuser.modified = new Date();

                    UserModel.updateUser(user, newuser, function (err, user) {
                        if (err)
                            done(err, null);

                        done(null, user);
                    });
                }
            ], function (err, result) {
                if (err) {
                    self.errorResponse(response, Const.httpCodeSeverError);
                } else {
                    self.successResponse(response, Const.responsecodeSucceed, result);
                }
            });

    });

    router.get('/findbyschool/:school_code', tokenChecker, function (request, response) {

        var school_code = request.params.school_code;

        UserModel.findUserbySchool(school_code, function (err, users) {
            if (err == null) {
                self.successResponse(response, Const.responsecodeSucceed, users);
            } else {
                self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Error while search user" + err));
            }
        });

    });

    router.post('/add', tokenChecker, function (request, response) {
        var userID = request.body.userID;
        var avatar_file_id = request.body.avatar_file_id;
        var avatar_thumb_file_id = request.body.avatar_thumb_file_id;
        var name = request.body.name;
        var email = request.body.email;
        var school_code = request.body.school_code;
        var user_type = request.body.user_type;
        if (Utils.isEmpty(userID) || Utils.isEmpty(name) || Utils.isEmpty(email)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please input required field (userid, name, email)"));
            return;
        }
        if (Utils.isEmpty(avatar_file_id)) {
            avatar_file_id = "";
        }
        if (Utils.isEmpty(avatar_thumb_file_id)) {
            avatar_thumb_file_id = "";
        }
        if (Utils.isEmpty(school_code)) {
            school_code = "ytlschool02-iot-web01";
        }
        if (Utils.isEmpty(user_type)) {
            user_type = "2";
        }
        if (Utils.isEmpty(avatar_thumb_file_id)) {
            avatar_thumb_file_id = "";
        }
        var token = Utils.randomString(24);
        UserModel.findUserbyId(userID, function (err, user) {

            if (user == null) {

                // save to database
                var newUser = new DatabaseManager.userModel({
                    userID: userID,
                    name: name,
                    avatar_file_id: avatar_file_id,
                    avatar_thumb_file_id: avatar_thumb_file_id,
                    token: token,
                    online_status: "offline",
                    email: email,
                    school_code: school_code,
                    user_type: user_type,
                    tokenGeneratedAt: Utils.now(),
                    created: Utils.now()
                });

                newUser.save(function (err, user) {

                    if (err) {
                        self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Error while add user" + err));

                    } else {
                        //Generate preloaded contact here
                        //Get All User from School and Add to Contact of the user
                        UserModel.findUserbySchoolExclude(school_code, userID, function (err, users) {

                            if (err == null) {
                                var userContacts = [];//contact for the user
                                for (var i = 0; i < users.length; i++) {
                                    var selfContact = {};
                                    var targetContact = {};
                                    targetContact.user_id = users[i].userID;
                                    targetContact.contact_user_id = userID;
                                    targetContact.is_primary = true;
                                    targetContact.is_favorites = false;
                                    targetContact.created = Utils.now();
                                    userContacts.push(targetContact);

                                    selfContact.user_id = userID;
                                    selfContact.contact_user_id = users[i].userID;
                                    selfContact.is_primary = true;
                                    selfContact.is_favorites = false;
                                    selfContact.created = Utils.now();

                                    userContacts.push(selfContact);

                                }

                                //Add the user to contact of all
                                if (userContacts.length > 0) {
                                    UserContactModel.insertMany(userContacts, function (err, result) {
                                        if (err) {
                                            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Error while search user" + err));
                                            return;
                                        }
                                        self.successResponse(response, Const.responsecodeSucceed, result);
                                    });
                                } else {
                                    self.successResponse(response, Const.responsecodeSucceed, user);
                                }

                            } else {
                                self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Error while search user" + err));
                            }
                        });

                    }

                });

            } else {
                user.update({
                    userID: userID,
                    name: name,
                    avatar_file_id: avatar_file_id,
                    avatar_thumb_file_id: avatar_thumb_file_id,
                    token: token,
                    online_status: "offline",
                    email: email,
                    school_code: school_code,
                    user_type: user_type
                }, {}, function (err, userResult) {
                    //Update contact list
                    self.successResponse(response, Const.responsecodeSucceed, user);
                    return;
                });

            }

        });

    });


    /**
     * @api {post} /user/blockUser  block user
     * @apiName blockUser
     * @apiGroup Frog-WebAPI
     * @apiDescription block user in contacts,just for direct message

     * @apiParam {String} user_id User Id
     * @apiParam {String} block_user_id
     *
     *
     * @apiSuccessExample Success-Response:
     {
       "code": 1,
       "data":
         {
           _id:"5951d57129116e1bd4fcef96"
            user_id:"4",
            block_user_id:"1",
            created:1498535281766
         }

     }*/
    router.post('/blockUser', tokenChecker, function (request, response) {
        var user_id = request.body.user_id;
        var block_user_id = request.body.block_user_id;


        if (Utils.isEmpty(user_id)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify user Id."));
            return;
        }

        if (Utils.isEmpty(block_user_id)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify block user Id."));
            return;
        }
        async
            .waterfall([
                function (done) {
                    UserModel
                        .findUserbyId(user_id, function (err, user) {
                            if (err)
                                done(err, null);
                            if (user === null) {
                                self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Invalid user Id."));
                                return;
                            }
                            done(null, user);
                        });
                },
                function (user, done) {
                    UserModel
                        .findUserbyId(block_user_id, function (err, blockUser) {
                            if (err)
                                done(err, null);
                            if (blockUser === null) {
                                self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Invalid block user Id."));
                                return;
                            }
                            done(null, blockUser);
                        });
                },
                function (blockUser, done) {
                    UserBlockModel.findbyUserIdAndBlockUserId(user_id, block_user_id, function (err, blockUser) {
                        if (err)
                            done(err, null);
                        if (blockUser === null) {
                            var newUserBlock = new DatabaseManager.userBlockModel({
                                user_id: user_id,
                                block_user_id: block_user_id,
                                created: Utils.now()
                            });

                            UserBlockModel.save(newUserBlock, function (err, result) {
                                if (err)
                                    self.errorResponse(response, Const.httpCodeSeverError);
                                if (result !== null) {
                                    done(err, result);
                                }

                            });
                        }
                        else {
                            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("This user had already blocked."));
                            return;
                        }


                    });


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
     * @api {post} /user/unBlockUser  unblock user
     * @apiName blockUser
     * @apiGroup Frog-WebAPI
     * @apiDescription unblock user,just for direct message

     * @apiParam {String} user_id User Id
     * @apiParam {String} block_user_id
     *
     *
     * @apiSuccessExample Success-Response:
     {
       code: 1,
       data:{
           n:1,
           ok:1
       }
       
     }*/
    router.post('/unBlockUser', tokenChecker, function (request, response) {
        var user_id = request.body.user_id;
        var block_user_id = request.body.block_user_id;


        if (Utils.isEmpty(user_id)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify user Id."));
            return;
        }

        if (Utils.isEmpty(block_user_id)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify block user Id."));
            return;
        }
        async
            .waterfall([
                function (done) {
                    UserModel
                        .findUserbyId(user_id, function (err, user) {
                            if (err)
                                done(err, null);
                            if (user === null) {
                                self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Invalid user Id."));
                                return;
                            }
                            done(null, user);
                        });
                },
                function (user, done) {
                    UserModel
                        .findUserbyId(block_user_id, function (err, blockUser) {
                            if (err)
                                done(err, null);
                            if (blockUser === null) {
                                self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Invalid block user Id."));
                                return;
                            }
                            done(null, blockUser);
                        });
                }
            ], function (err, result) {
                UserBlockModel
                    .remove(user_id, block_user_id, function (err, res) {
                        if (err) {
                            self.errorResponse(response, Const.httpCodeSeverError, Utils.localizeString(err));
                        } else {
                            self.successResponse(response, Const.responsecodeSucceed, res);
                        }
                    });

            });

    });

    /**
     * @api {get} /user/blockList  get user blocked list
     * @apiName blockList
     * @apiGroup Frog-WebAPI
     * @apiDescription get all users that were blocked by User

     * @apiSuccessExample Success-Response:
     {
       "code": 1,
       "data": [
         {
          _id : 58b53cf3e0bf5e204c9cf1cc,
           userID : 7,
           name : Edwin Chong,
           about : ,
           email : edwin.chong@frogasia.com,
           password : ,
           school_code : FROGCHAT,
           user_type : 2,
           class_group : null,
           online_status : online,
           max_contact_count : 20,
           max_favorite_count : 0,
           chatting_with : 0,
           token : wVZCAkCcdrbxQE9QCQmPeokmZLO2Xo7tj66UqI6E,
           web_token : LRgTAyr9XCWAAT8FMfnvhOM91RDpZMdKDuDe24nZ,
           token_timestamp : 1474727862,
           deviceid : 866504021092337,
           last_login : 1474727862,
           birthday : 0,
           gender : ,
           avatar_file_id : wPb3EWMnxoySkejKwiq21474710199,
           avatar_thumb_file_id : LDk34DGHbXGnr3xCuc7g1474710199,
           ios_push_token : ,
           android_push_token : ,
           created : NumberLong(0),
           modified : NumberLong(1474727371)
         },
         {
          _id : 58b53cf3e0bf5e204c9cf1ca,
           userID : 7,
           name : thanh.doan,
           about : ,
           email : thanh.doan@frogasia.com,
           password : ,
           school_code : FROGCHAT,
           user_type : 2,
           class_group : null,
           online_status : online,
           max_contact_count : 20,
           max_favorite_count : 0,
           chatting_with : 0,
           token : wVZCAkCcdrbxQE9QCQmPeokmZLO2Xo7tj66UqI6E,
           web_token : LRgTAyr9XCWAAT8FMfnvhOM91RDpZMdKDuDe24nZ,
           token_timestamp : 1474727862,
           deviceid : 866504021092337,
           last_login : 1474727862,
           birthday : 0,
           gender : ,
           avatar_file_id : wPb3EWMnxoySkejKwiq21474710199,
           avatar_thumb_file_id : LDk34DGHbXGnr3xCuc7g1474710199,
           ios_push_token : ,
           android_push_token : ,
           created : NumberLong(0),
           modified : NumberLong(1474727371)
         }]

     }
     */

    router.get('/blockList/:user_id', tokenChecker, function (request, response) {
        var user_id = request.params.user_id;


        if (Utils.isEmpty(user_id)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify user Id."));
            return;
        }


        async
            .waterfall([
                function (done) {
                    UserModel
                        .findUserbyId(user_id, function (err, user) {
                            if (err)
                                done(err, null);
                            if (user === null) {
                                self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Invalid user Id."));
                                return;
                            }
                            done(null, user);
                        });
                },
                function (user, done) {
                    UserBlockModel
                        .findbyUserId(user_id, function (err, blockUsers) {
                            if (err)
                                done(err, null);

                            done(null, blockUsers);
                        });
                }
            ], function (err, blockUsers) {
                if (blockUsers !== null && blockUsers.length > 0) {
                    var arrUserid = [];
                    blockUsers.map(function (blockUser) {
                        if (blockUser !== null) {
                            if (_.indexOf(arrUserid, blockUser.block_user_id) == -1) {
                                arrUserid.push(blockUser.block_user_id);
                            }
                        }

                    });
                    UserModel.getUsersInList(arrUserid, function (err, res) {
                        if (err) {
                            self.errorResponse(response, Const.httpCodeSeverError, Utils.localizeString(err));
                        } else {
                            self.successResponse(response, Const.responsecodeSucceed, Utils.stripPrivacyParamsFromArray(res));
                        }
                    });
                }
                else {
                    self.successResponse(response, Const.responsecodeSucceed, []);
                }


            });

    });


    router.get('/getToken/:user_id', function (request, response) {//get userToken for test api
        var userID = request.params.user_id;
        if (Utils.isEmpty(userID)) {
            response.status(400);
            response.json({errorMessage: "Please provide user_id"});

        }
        UserModel.findUserbyId(userID, function (err, user) {

            if (user == null) {
                response.status(400);
                response.json({errorMessage: "User not exist"});
                return;
            } else {

                var token = user.token;
                var profile = {
                    userID: userID,
                    name: user.name
                };
                //check valid token and check for expired token
                var decoded;
                try {
                    decoded = jwt.verify(token, Const.jwtSecret);
                } catch (err) {//expired
                    //regenerate token
                    token = jwt.sign(profile, Const.jwtSecret, {expiresIn: Const.jwtExpire});
                    user.token = token;

                    user.update({
                        token: token, //update token for user if expire
                        tokenGeneratedAt: Utils.now()
                    }, {}, function (err, userResult) {

                        if (err) {
                            response.status(400);
                            response.json({"errorMessage": "Can't update user token"});

                        } else {
                            response.status(200);
                            response.json({"user_id": userID, "token": user.token});
                            return;
                        }
                    });
                }

                if (decoded != null) {
                    response.status(200);
                    response.json({"user_id": userID, "token": user.token});
                }


            }
        });

    });

}

new UserHandler().attach(router);
module["exports"] = router;