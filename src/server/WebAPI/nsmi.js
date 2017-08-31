var express = require('express');
var router = express.Router();
var _ = require('lodash');

var RequestHandlerBase = require("./RequestHandlerBase");
var DatabaseManager = require("../lib/DatabaseManager");
var Utils = require("../lib/Utils");
var Const = require("../const");
var async = require('async');
var tokenChecker = require('../lib/Auth');
var UserModel = require("../Models/UserModel");
var debug = require('debug')('frogchat:nsmi');
var UserHandler = function () {
}

_.extend(UserHandler.prototype, RequestHandlerBase.prototype);

UserHandler.prototype.attach = function (router) {

    var self = this;

    /**
     * @api {post} nsmi/createUser  Add new user to frogchat
     * @apiName Create new user
     * @apiGroup Frog-NSMI
     * @apiDescription Create new user profile

     * @apiParam {String} name User name
     * @apiParam {String} email email of user
     * @apiParam {String} school_code School Code
     * @apiParam {String} user_type User Type
     * @apiParam {String} class_group Class Group
     * @apiParam {String} user_type User Type
     * @apiParam {String} etime ETime
     * @apiParam {String} signature Signature data from NSMI
     *
     *
     * @apiSuccessExample Success-Response:
     {
        "message": "Message from server",
        "error": "errCode"
     }*/

    router.post('/createUser', function (request, response) {
        debug('NSMI createUser called with request body %j', request.body);
        var avatar_file_id = request.body.avatar_file_id;
        var avatar_thumb_file_id = request.body.avatar_thumb_file_id;
        var name = request.body.name;
        var email = request.body.email;
        var school_code = request.body.school_code;
        var user_type = request.body.user_type;
        var signature = request.body.signature;
        var class_group = request.body.class_group;
        var etime = parseInt(request.body.etime);

        debug("Checking parameters");
        if (_.isUndefined(school_code) || _.isUndefined(name) || _.isUndefined(email) || _.isUndefined(etime)
            || _.isUndefined(user_type) || _.isUndefined(signature) || _.isUndefined(class_group)) {
            response.status(400);
            return response.json({"message": "Invalid API parameters.", "error": "SIGCHECK0002"});
        }


        if (Utils.isEmpty(etime)) {
            response.status(400);
            return response.json({"message": "Please provide etime.", "error": "SIGCHECK0003"});
        }

        if (Utils.isEmpty(name)) {
            response.status(400);
            return response.json({"message": "Please provide name.", "error": "NCU0001"});
        }
        if (Utils.isEmpty(email)) {
            response.status(400);
            return response.json({"message": "Please provide email.", "error": "NCU0002"});
        }

        if (Utils.isEmpty(user_type)) {
            response.status(400);
            return response.json({"message": "Please provide user type.", "error": "NCU0003"});
        }

        if (Utils.isEmpty(signature)) {
            response.status(400);
            return response.json({"message": "API signature is missing.", "error": "SIGCHECK0001"});
        }

        if (!Utils.checkSignature([email,etime], signature)) {
            response.status(401);
            return response.json({"message": "Invalid API signature", "error": "SIGCHECK0004"});
        }

        var userID = email;

        if (Utils.isEmpty(avatar_file_id)) {
            avatar_file_id = "";
        }
        if (Utils.isEmpty(avatar_thumb_file_id)) {
            avatar_thumb_file_id = "";
        }
        if (Utils.isEmpty(school_code)) {
            school_code = "";
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
                        response.status(200);
                        response.json({"message": "unable to create user!", "error": "PDOCU0001"});
                    } else {
                        //Generate preloaded contact here
                        //Get All User from School and Add to Contact of the user
                        UserModel.findUserbySchoolExclude(school_code, userID, function (err, users) {

                            if (err == null) {
                                self.nsmiSuccessResponse(response, "user account created successfully!");
                            } else {
                                self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Error while search user" + err));
                            }
                        });

                    }

                });

            } else {
                response.status(200);
                response.json({"message": "User existing!", "error": "PDOCU0001"});
            }

        });

    });
    /**
     * @api {post} nsmi/updateUser  Update user profile
     * @apiName Update user profile
     * @apiGroup Frog-NSMI
     * @apiDescription Update user profile

     * @apiParam {String} name User name
     * @apiParam {String} email email of user
     * @apiParam {String} school_code School Code
     * @apiParam {String} user_type User Type
     * @apiParam {String} class_group Class Group
     * @apiParam {String} user_type User Type
     * @apiParam {String} etime ETime
     * @apiParam {String} signature Signature data from NSMI
     *
     *
     * @apiSuccessExample Success-Response:
     {
        "message": "Message from server",
        "error": "errCode"
     }*/
    router.post('/updateUser', tokenChecker, function (request, response) {
        var avatar_file_id = request.body.avatar_file_id;
        var avatar_thumb_file_id = request.body.avatar_thumb_file_id;
        var name = request.body.name;
        var email = request.body.email;
        var school_code = request.body.school_code;
        var user_type = request.body.user_type;
        var signature = request.body.signature;
        var class_group = request.body.class_group;
        var etime = request.body.etime;

        if (_.isUndefined(school_code) || _.isUndefined.isEmpty(name) || _.isUndefined.isEmpty(email) || _.isUndefined(etime)
            || _.isUndefined(user_type) || _.isUndefined(signature) || _.isUndefined(class_group)) {
            response.status(400);
            return response.json({"message": "Invalid API parameters.", "error": "SIGCHECK0002"});
        }

        if (Utils.isEmpty(etime)) {
            response.status(400);
            return response.json({"message": "Please provide etime.", "error": "SIGCHECK0003"});
        }

        if (Utils.isEmpty(name)) {
            response.status(400);
            return response.json({"message": "Please provide name.", "error": "NCU0001"});
        }
        if (Utils.isEmpty(email)) {
            response.status(400);
            return response.json({"message": "Please provide email.", "error": "NCU0002"});
        }

        if (Utils.isEmpty(user_type)) {
            response.status(400);
            return response.json({"message": "Please provide user type.", "error": "NCU0003"});
        }

        if (!Utils.isEmpty(signature)) {
            response.status(400);
            return response.json({"message": "API signature is missing.", "error": "SIGCHECK0001"});
        }

        if (!Utils.checkSignature([email,etime], signature)) {
            response.status(400);
            return response.json({"message": "Invalid API signature", "error": "SIGCHECK0004"});
        }


        var userID = email;

        if (Utils.isEmpty(school_code)) {
            school_code = "";
        }

        async
            .waterfall([
                function (done) {
                    UserModel
                        .findUserbyId(userID, function (err, user) {
                            if (err)
                                done(err, null);
                            if (user === null) {
                                response.status(200);
                                return response.json({"message": "user not found!", "error": "PDOUU0001"});
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

                    newuser.modified = new Date();
                    newuser.name = name;
                    newuser.email = email;
                    newuser.school_code = school_code;
                    newuser.user_type = user_type;
                    newuser.class_group = class_group;
                    newuser.class_group = class_group;

                    UserModel.updateUser(user, newuser, function (err, user) {
                        if (err)
                            done(err, null);

                        done(null, user);
                    });
                }
            ], function (err, result) {
                if (err) {
                    response.status(200);
                    return response.json({"message": "unable to update user!", "error": "PDOUU0002"});
                } else {
                    response.status(200);
                    return response.json({"message": "user account updated sucessfully", "error": "0"});
                }
            });

    });


    /**
     * @api {post} nsmi/deleteUser Remove user
     * @apiName Delete user
     * @apiGroup Frog-NSMI
     * @apiDescription Delete user from frogchat server

     * @apiParam {String} email Email of user
     * @apiParam {String} etime Etime
     * @apiParam {String} signature Signature data from NSMI
     *
     *
     * @apiSuccessExample Success-Response:
     {
        "message": "Message from server",
        "error": "errCode"
     }
     */
    router.post('/deleteUser', function (request, response) {

        var email = request.body.email;
        var signature = request.body.signature;
        var etime = request.body.etime;

        if (_.isUndefined(email) || _.isUndefined(etime) || _.isUndefined(signature)) {
            response.status(400);
            return response.json({"message": "Invalid API parameters.", "error": "SIGCHECK0002"});
        }


        if (Utils.isEmpty(etime)) {
            response.status(400);
            return response.json({"message": "Please provide etime.", "error": "SIGCHECK0003"});
        }


        if (Utils.isEmpty(email)) {
            response.status(400);
            return response.json({"message": "Please provide email.", "error": "NCU0002"});
        }

        if (!Utils.checkSignature([email,etime], signature)) {
            response.status(403);
            return response.json({"message": "API signature is missing.", "error": "SIGCHECK0001"});
        }

        var userID = email;


        async
            .waterfall([
                function (done) {
                    UserModel
                        .findUserbyId(userID, function (err, user) {
                            if (err)
                                done(err, null);
                            if (user === null) {
                                response.status(200);
                                return response.json({"message": "user not found!", "error": "PDOUU0001"});
                            }
                            done(null, user);
                        });
                },
                function (user, done) {

                    UserModel
                        .remove(userID, function (err, data) {
                            if (err) {
                                done(err, data);
                            } else {
                                done(null, data);
                            }

                        });
                }
            ], function (err, result) {
                if (err) {
                    response.status(200);
                    return response.json({"message": "unable to remove user!", "error": "PDOUU0002"});
                } else {
                    response.status(200);
                    return response.json({"message": "user account deleted sucessfully", "error": "0"});
                }
            });

    });


    /**
     * @api {post} nsmi/changeEmail Change email of user
     * @apiName Change email
     * @apiGroup Frog-NSMI
     * @apiDescription Change email of user

     * @apiParam {String} old_email old email of user
     * @apiParam {String} email new email to update
     * @apiParam {String} etime Etime
     * @apiParam {String} signature Signature data from NSMI
     *
     *
     * @apiSuccessExample Success-Response:
     {
        "message": "Message from server",
        "error": "errCode"
     }
     */
    router.post('/changeEmail', function (request, response) {

        var email = request.body.email;
        var old_email = request.body.old_email;
        var signature = request.body.signature;
        var etime = request.body.etime;


        if (_.isUndefined(email) || _.isUndefined(etime) || _.isUndefined(signature) || _.isUndefined(old_email)) {
            response.status(400);
            return response.json({"message": "Invalid API parameters.", "error": "SIGCHECK0002"});
        }

        if (signature !== Const.signature) {
            response.status(403);
            return response.json({"message": "API signature is missing.", "error": "SIGCHECK0001"});
        }

        if (Utils.isEmpty(etime)) {
            response.status(400);
            return response.json({"message": "Please provide etime.", "error": "SIGCHECK0003"});
        }

        if (Utils.isEmpty(old_email)) {
            response.status(400);
            return response.json({"message": "Please provide old email.", "error": "NCU0002"});
        }


        if (Utils.isEmpty(email)) {
            response.status(400);
            return response.json({"message": "Please provide email.", "error": "NCU0002"});
        }


        var userID = email;


        async
            .waterfall([
                function (done) {
                    UserModel
                        .findUserbyId(old_email, function (err, user) {
                            if (err)
                                done(err, null);
                            if (user === null) {
                                response.status(200);
                                return response.json({"message": "user not found!", "error": "PDOUU0001"});
                            }
                            done(null, user);
                        });
                },
                function (user, done) {

                    var newuser = new DatabaseManager.userModel({_id: user._id});
                    newuser.modified = new Date();
                    user.userID = userID;
                    user.email = userID;
                    UserModel.updateUser(user, newuser, function (err, user) {
                        if (err) {
                            done(err, user);
                        } else {
                            done(null, user);
                        }
                    });
                }
            ], function (err, result) {
                if (err) {
                    response.status(200);
                    return response.json({"message": "unable to remove user!", "error": "PDOUU0002"});
                } else {
                    response.status(200);
                    return response.json({"message": "user account deleted sucessfully", "error": "0"});
                }
            });

    });

}

new UserHandler().attach(router);
module["exports"] = router;