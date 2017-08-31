var mongoose = require('mongoose');
var Settings = require("../lib/Settings");
var Const = require("../const");

var UserModel = function () {

};

UserModel.prototype.model = null;

UserModel.prototype.init = function () {

    // Defining a schema
    var userSchema = new mongoose.Schema({
        userID: {type: String, index: true},
        name: String,
        //Frog custom fields
        email: String,
        school_code: String,
        school_url: String,
        user_type: String,
        vle_token: String,

        avatar_file_id: String,
        avatar_thumb_file_id: String,
        modified: Number,
        online_status: {type: String, default: Const.UserStatusEnum.OffLine},

        //End custom 
        avatarURL: String,
        is_admin: Boolean,
        token: String,
        android_push_token:String,
        ios_push_token:String,
        created: Number
    });


    this.model = mongoose.model(Settings.options.dbCollectionPrefix + "users", userSchema);
    return this.model;

}



UserModel.prototype.findUserbyId = function (id, callBack) {

    this.model.findOne({userID: new RegExp("^" + id + "$", "g")}, function (err, user) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, user);
        }

    });

}

UserModel.prototype.findProfilebyId = function (userid, callBack) {

    this.model.findOne({userID: new RegExp("^" + userid + "$", "g")},
        {name: 1, avatar_file_id: 1, avatar_thumb_file_id: 1, userID:1, online_status: 1, vle: 1, user_type: 1, school_code: 1,email:1},
        function (err, user) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, user);
            }

        });

}

UserModel.prototype.findUserbyToken = function (token, callBack) {

    this.model.findOne({token: token}).exec(
        function (err, user) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, user);
            }

        });

}

UserModel.prototype.getUsersInList = function (arrUserid, callBack) {

    var query = this.model.find({'userID': {"$in": arrUserid}}).sort({'name': 'asc'});

    query.exec(function (err, data) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }
    });


}


UserModel.prototype.findUsersbyInternalId = function (aryId, callBack) {

    var conditions = [];
    aryId.forEach(function (userId) {

        conditions.push({
            _id: userId
        });

    });

    var query = this.model.find({
        $or: conditions
    }).sort({'created': 1});

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });

},

    UserModel.prototype.findAll = function (callBack) {

        this.model.find({}, function (err, users) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, users);
            }

        });

    }

UserModel.prototype.findUsersbykey = function (key, ids, callBack) {
    var query = this.model.find({

        $and: [
            {'userID': {"$nin": ids}},
            {$or: [{"name": {'$regex': key, $options: 'i'}}, {"vle": {'$regex': key, $options: 'i'}}, {"email": {'$regex': key, $options: 'i'}}]}
        ]
    }).sort({'created': 1});

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });

}

UserModel.prototype.updateUser = function (user, newuser, callBack) {
    user.update(newuser,
        {},
        function (err, result) {
            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, result);
            }

        });

}

UserModel.prototype.ClearAndroidPushNotification = function (token,  callBack) {
    this.model.updateMany({android_push_token:token},
        {$set: {android_push_token:''}},
        function (err, result) {
            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, result);
            }

        });

}

UserModel.prototype.findUserbySchool = function (school_code, callBack) {

    this.model.find({"school_code": {'$regex': school_code, $options: 'i'}}, function (err, users) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, users);
        }

    });

}



UserModel.prototype.findUserbySchoolExclude = function (school_code, userID, callBack) {

    this.model.find({
            $and: [
                {"school_code": {'$regex': school_code, $options: 'i'}},
                {"userID": {"$ne": userID}}
            ]
        },
        function (err, users) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, users);
        }

    });

}

UserModel.prototype.remove = function (uID, callBack) {

    this.model.remove({"userID": {'$regex': uID, $options: 'i'}
    }, function (err, data) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });
}


module["exports"] = new UserModel();