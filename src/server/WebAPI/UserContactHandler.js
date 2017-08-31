var express = require('express');
var router = express.Router();
var _ = require('lodash');
var RequestHandlerBase = require("./RequestHandlerBase");
var DatabaseManager = require("../lib/DatabaseManager");
var Utils = require("../lib/Utils");
var Const = require("../const");
var async = require('async');
var tokenChecker = require('../lib/Auth');
var UserContactModel = require("../Models/UserContactModel");
var UserFavouriteModel = require("../Models/UserFavouriteModel");
var UserModel = require("../Models/UserModel");

var UserContactHandler = function () {
}

_.extend(UserContactHandler.prototype, RequestHandlerBase.prototype);

UserContactHandler.prototype.attach = function (router) {

    var self = this;

    /**
     * @api {get} /contact/list/:userID  Get contact list of user
     * @apiName Get Contact List
     * @apiGroup Frog-WebAPI
     * @apiDescription Get contact list of user

     * @apiParam {Number} userID ID of user
     *
     *
     * @apiSuccessExample Success-Response:
     {
       "code": 1,
       "data": [
         {
           "userID": "1",
           "name": "thang.luu",
           "avatarURL": "xxxxx",
           "roomID": "test",
           "user_type": "2",
           "school_code": "FROGCHAT",
           "is_favorites":true,
           "user_contact_objectId":"58d496bbb94b3e0494644f8c"
           ...
         },
         {
           "userID": "2",
           "name": "hien.pham",
           "avatar_file_id": "xxxxx",
           "roomID": "test",
           "user_type": "2",
           "school_code": "FROGCHAT",
           ...
         },
       ]
     }
     */
    router.get('/list/:userID/:schoolCode', tokenChecker, function (request, response) {

        var userID = request.params.userID;
        var school_code = request.params.schoolCode;
        if (Utils.isEmpty(userID)) {

            self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("Please specify user id."), false);
            return;

        }

        var finalContactList = [];
        var userIdList = [];
        async.waterfall([
            function (done) {
                if (Utils.isEmpty(school_code)){
                    done(null,[]);
                }else{
                    UserModel.findUserbySchoolExclude(school_code, userID,function (err, users) {
                        if (err)
                            done(err,[]);
                        else
                            done(null,users);
                    })
                }

            },
            function (users, done) {
                if(users !=null && users.length>0){
                    _.forEach(users, function (user) {
                        user._doc.is_primary = true;
                        finalContactList.push(user);
                        userIdList.push(user.userID);
                    });
                }
                UserContactModel.getUserContacts(userID, function (err, data) {
                    if (err)
                        done(err,[]);
                    done(null,data);

                });
            },
            function (data,done){
                var lstUserContactId = [];
                if (data !== undefined && data !== null) {
                    _.forEach(data, function (dataObj) {
                        lstUserContactId.push(dataObj.contact_user_id);
                        userIdList.push(dataObj.contact_user_id);
                    });
                    UserModel
                        .getUsersInList(lstUserContactId, function (err, result) {
                            if (err)
                                done(err,[]);

                            _.forEach(result, function (user) {
                                var objTemp = _.find(data, function (o) {
                                    return o.contact_user_id === user.userID;
                                });
                                if (objTemp !== null) {
                                    user._doc.user_contact_objectId = objTemp._id.toString();
                                    user._doc.is_primary = objTemp.is_primary;
                                    //user._doc.is_favorites = objTemp.is_favorites;
                                }
                                finalContactList.push(user);

                            });

                            done(null,finalContactList);
                        });
                }
            },
            function (data,done){
                UserFavouriteModel.getFavouriteStatus(userID, userIdList, function (err, result) {
                    if (err)
                        done(err,[]);
                    //Update favourite status
                    _.forEach(finalContactList, function (user,index) {
                        var objTemp = _.find(result, function (o) {
                            return o.favourite_user_id === user.userID;
                        });
                        if (!_.isUndefined(objTemp) &&  objTemp!== null) {
                            finalContactList[index]._doc.is_favorites = true;
                            finalContactList[index]._doc.user_favourite_objectId = objTemp._id.toString();
                        }

                    });
                    done(null,finalContactList);

                });
            }
        ], function (err, result) {

            if (err) {
                self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("Error while get Contact"), false);
                return;
            }
            else {
                var sortedResult = _.orderBy(result, [
                    user => user
                        .name
                        .toLowerCase()
                ], ['asc']);
                self.successResponse(response, Const.responsecodeSucceed, sortedResult);
            }
        });

    });

    /**
     * @api {get} /contact/favourites/:userID  Get favourites contact list of user
     * @apiName Get favourites contact list
     * @apiGroup Frog-WebAPI
     * @apiDescription Get favourites contact list of user

     * @apiParam {Number} userID ID of user
     *
     *
     * @apiSuccessExample Success-Response:
     {
       "code": 1,
       "data": [
         {
           "userID": "1",
           "name": "thang.luu",
           "avatarURL": "xxxxx",
           "roomID": "test",
           "user_type": "2",
           "school_code": "FROGCHAT",
           "user_contact_objectId"="58d496bbb94b3e0494644f9c",
           ...
         },
         {
           "userID": "2",
           "name": "hien.pham",
           "avatar_file_id": "xxxxx",
           "roomID": "test",
           "user_type": "2",
           "school_code": "FROGCHAT",
           "user_contact_objectId"="58d496bbb94b3e0494644fa0",
           ...
         },
       ]
     }
     */
    router.get('/favourites/:userID', tokenChecker, function (request, response) {

        var userID = request.params.userID;

        if (Utils.isEmpty(userID)) {

            self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("Please specify user id."), false);

            return;

        }

        UserFavouriteModel
            .getUserFavourites(userID, function (err, data) {
                if (data !== undefined && data !== null) {
                    var lstUserContactId = [];

                    _.forEach(data, function (dataObj) {
                        lstUserContactId.push(dataObj.favourite_user_id);
                    });

                    UserModel
                        .getUsersInList(lstUserContactId, function (err, result) {
                            if (err)
                                throw err;
                            _.forEach(result, function (user) {
                                var objTemp = _.find(data, function (o) {
                                    return o.favourite_user_id === user.userID;
                                });
                                if (objTemp !== null) {
                                    user._doc.user_favourite_objectId = objTemp._id.toString();
                                }

                            });
                            self.successResponse(response, Const.responsecodeSucceed, Utils.stripPrivacyParamsFromArray(result));
                        });
                }

            });
    });

    /**
     * @api {post} /contact/add  Add contact for user
     * @apiName Add user contact
     * @apiGroup Frog-WebAPI
     * @apiDescription Get contact list of user

     * @apiParam {Number} user_id ID of user
     * @apiParam {Number} contact_user_id ID of user
     *
     *
     * @apiSuccessExample Success-Response:
     {
       "code": 1,
       "data": [
         {
           "userID": "1",
           "name": "thang.luu",
           "avatarURL": "xxxxx",
           "roomID": "test",
           "user_type": "2",
           "school_code": "FROGCHAT",
           ...
         },
         {
           "userID": "2",
           "name": "hien.pham",
           "avatar_file_id": "xxxxx",
           "roomID": "test",
           "user_type": "2",
           "school_code": "FROGCHAT",
           ...
         },
       ]
     }
     */
    router.post('/add', tokenChecker, function (request, response) {

        if (_.isUndefined(request.body)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("Please specify request body."));
            return;
        }

        var user_id = request.body.user_id;
        var contact_user_id = request.body.contact_user_id;
        var errorStatus = 0;

        if (Utils.isEmpty(user_id) || Utils.isEmpty(contact_user_id)) {

            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("user_id & contact_user_id is required"));

            return;

        }

        async
            .waterfall([
                function (done) {
                    UserModel
                        .getUsersInList([
                            user_id, contact_user_id
                        ], function (err, result) {
                            if (result.length === 2)
                                done(null);
                            else {
                                errorStatus = 1;
                                done(true);
                            }
                        });
                },
                function (done) {
                    var newcontact = new DatabaseManager.userContactModel({
                        user_id: request.body.user_id,
                        contact_user_id: request.body.contact_user_id
                    });
                    UserContactModel.findUserContact(user_id, contact_user_id, function (err, contact) {
                        if (contact === null || contact.length === 0) {
                            UserContactModel
                                .addcontact(newcontact, function (err, result) {
                                    if (err) {
                                        errorStatus = 3
                                        done(true);
                                    }

                                    done(null, newcontact);

                                });
                        } else {
                            errorStatus = 2;
                            done(true);
                        }
                    });
                }

            ], function (err, result) {
                if (!err) {
                    self.successResponse(response, Const.responsecodeSucceed, result);
                    return;
                }

                if (errorStatus == 1) {
                    self.successResponse(response, Const.resCodeUserNotExist, result);

                    return;

                }
                if (errorStatus == 2) {
                    self.successResponse(response, Const.resCodeContactExisting, result);
                    return;
                }
                if (errorStatus == 3) {
                    self.successResponse(response, Const.responsecodeParamError, result);
                    return;
                }

            });

    });

    /**
     * @api {post} /contact/remove Remove contact of user
     * @apiName Remove contact
     * @apiGroup Frog-WebAPI
     * @apiDescription Remove contact of user

     * @apiParam {Number} user_id ID of current user
     * @apiParam {Number} contact_user_id id of user who you want to add to contact of current user
     *
     *
     * @apiSuccessExample Success-Response:
     {
       "code": 1,
       "data": {
             "n": 1,
             "ok": 1
        }
     }
     */
    router.post('/remove', tokenChecker, function (request, response) {

        var uID = request.body.user_id;
        var cID = request.body.contact_user_id;

        if (Utils.isEmpty(uID) || Utils.isEmpty(cID)) {
            self.errorResponse(response, Const.responsecodeParamError, Utils.localizeString("user_id & contact_user_id is require."));

            return;
        }

        UserContactModel.remove(uID, cID, function (err, data) {
            if (err) {
                self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("user_id & contact_user_id is required"));
                return;
            } else {
                UserFavouriteModel.findUserFavourite(uID, cID, function (err, favItem) {
                    if (err)
                        self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("Error while find user favourite"));
                    else {
                        if (favItem != null && favItem.length > 0) {//favourite item exist

                            UserFavouriteModel.remove(uID, cID, function (err, result) {
                                if (err)
                                    self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("Error while remove favourite"));
                                self.successResponse(response, Const.responsecodeSucceed, data);
                            });

                        } else {
                            self.successResponse(response, Const.responsecodeSucceed, data);
                        }
                    }
                    //self.successResponse(response, Const.responsecodeSucceed, data);
                });
            }

        });
    });

    /**
     * @api {post} /contact/removeByID Remove contact of user by user_contact ID
     * @apiName Remove contact by user_contact ID
     * @apiGroup Frog-WebAPI
     * @apiDescription Remove contact of user by user_contact ID

     * @apiParam {String} id UserContact ID (_id return by API)
     *
     *
     * @apiSuccessExample Success-Response:
     {
       "code": 1,
       "data": {
             "n": 1,
             "ok": 1
        }
     }
     */
    router.post('/removeByID', tokenChecker, function (request, response) {

        var ID = request.body.id;

        if (Utils.isEmpty(ID)) {
            self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("id is required"));
            return;
        }

        UserContactModel
            .removeByID(ID, function (err, data) {
                if (err) {
                    self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("Error while removing"));
                    return;
                } else {
                    self.successResponse(response, Const.responsecodeSucceed, data);
                }

            });
    });

    /**
     * @api {post} /contact/update Update contact of user by user_contact ID
     * @apiName Update contact
     * @apiGroup Frog-WebAPI
     * @apiDescription Update contact of user

     * @apiParam {String} id UserContact ID (_id return by API)
     * @apiParam {bool} is_favorites is_favorites need to update
     *
     *
     * @apiSuccessExample Success-Response:
     {
       "code": 1,
       "data": {
             "n": 1,
             "ok": 1
        }
     }
     */
    router.post('/update', tokenChecker, function (request, response) {

        var ID = request.body.id;

        if (Utils.isEmpty(ID)) {
            self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("id is required"));
            return;
        }

        var objectId = require('mongodb').ObjectId;
        var o_id = new objectId(ID);
        var newUserContact = new DatabaseManager.userContactModel({_id: o_id});

        if (request.body.is_favorites) {
            newUserContact.is_favorites = request.body.is_favorites;
        } else {
            newUserContact.is_favorites = false;
        }

        //newUserContact.modified = new Date();

        UserContactModel.findByObjectId(newUserContact._id, function (err, contact) {
            if (contact === null) {
                self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("UserContact not existing"));
            } else {

                UserFavouriteModel.findUserFavourite(contact.user_id, contact.contact_user_id, function (err, favItem) {
                    if (err)
                        self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("Error while find user favourite"));
                    else {
                        if (favItem != null && favItem.length > 0) {//favourite item exist
                            if (newUserContact.is_favorites === false) {//delete favourite item
                                UserFavouriteModel.remove(contact.user_id, contact.contact_user_id, function (err, result) {
                                    if (err)
                                        self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("Error while remove favourite"));
                                    self.successResponse(response, Const.responsecodeSucceed, result);
                                });
                            } else {
                                self.successResponse(response, Const.responsecodeSucceed, newUserContact);
                            }
                        } else {

                            var newUserFavourite = new DatabaseManager.userFavouriteModel({
                                user_id: contact.user_id,
                                favourite_user_id: contact.contact_user_id
                                //created : new Date()
                            });
                            newUserFavourite.created = Date.now();
                            UserFavouriteModel.addFavourite(newUserFavourite, function (err, result) {
                                if (err)
                                    self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("Error while add favourite"));

                                self.successResponse(response, Const.responsecodeSucceed, newUserContact);
                            });
                        }
                    }
                });
            }
        })
    });

    router.post('/addFavourite', tokenChecker, function (request, response) {
        var userID = request.body.user_id; //contactid
        var favUserID = request.body.favourite_user_id;

        if (Utils.isEmpty(userID) || Utils.isEmpty(favUserID)) {
            self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("user_id , favourite_user_id is required"));
            return;
        }
        UserFavouriteModel.findUserFavourite(userID, favUserID, function (err, favItem) {
            if (err)
                self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("Error while find user favourite"));
            else {
                if (favItem != null && favItem.length > 0) {
                    self.successResponse(response, Const.responsecodeSucceed, favItem[0]);
                } else {
                    var newUserFavourite = new DatabaseManager.userFavouriteModel({
                        user_id: userID,
                        favourite_user_id: favUserID
                        //created : new Date()
                    });
                    newUserFavourite.created = Date.now();
                    UserFavouriteModel.addFavourite(newUserFavourite, function (err, result) {
                        self.successResponse(response, Const.responsecodeSucceed, result);
                    });
                }
            }
        });

    });

    router.post('/removeFavourite', tokenChecker, function (request, response) {
        var id = request.body.id; //favourite objectid

        if (Utils.isEmpty(id)) {
            self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("id is required"));
            return;
        }
        UserFavouriteModel.removeByID(id, function (err, result) {
            if (err)
                self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("Error while remove favourite"));
            self.successResponse(response, Const.responsecodeSucceed, result);

        });

    });

    router.get('/testfav/:userID', tokenChecker, function (request, response) {
        var userID = request.params.userID; //favourite objectid

        if (Utils.isEmpty(userID)) {
            self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("id is required"));
            return;
        }
        UserModel.findUserbySchoolExclude("FROGCHAT",userID,function (err,result) {
            self.successResponse(response, Const.responsecodeSucceed, result);
        })

    });
}

new UserContactHandler().attach(router);
module["exports"] = router;
