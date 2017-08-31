var mongoose = require('mongoose');
var Const = require("../../const");
var Config = require('../Config');
var UserModel = function () {

};

UserModel.prototype.model = null;

UserModel.prototype.init = function (conn) {

    // Defining a schema
    var userSchema = new mongoose.Schema({
        userID: {type: String, index: true},
        base_id : {type: Number},
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
        is_admin: {type: Boolean},
        token: String,
        created: Number
    });


    this.model = conn.model(Config.CollectionPrefixV2 + "users", userSchema);
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
        {
            name: 1,
            avatar_file_id: 1,
            avatar_thumb_file_id: 1,
            online_status: 1,
            vle: 1,
            user_type: 1,
            school_code: 1,
            email: 1
        },
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
            {
                $or: [{"name": {'$regex': key, $options: 'i'}}, {
                    "vle": {
                        '$regex': key,
                        $options: 'i'
                    }
                }, {"email": {'$regex': key, $options: 'i'}}]
            }
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

UserModel.prototype.save = function (newUser, callBack) {

    newUser.save(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });
}
UserModel.prototype.insertMany = function (arrayItem, callBack) {
    this.model.insertMany(arrayItem ,{},function (err,result) {
        if (err)
            return callBack(err)
        callBack(null,result);

    })
}

UserModel.prototype.findInBaseID = function (arrayID, callBack) {

    this.model.find({'base_id': {"$in": arrayID}}, function (err, users) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, users);
        }

    });

}

UserModel.prototype.findByBaseID = function (baseID, callBack) {

    this.model.findOne({'base_id': baseID}, function (err, item) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, item);
        }

    });

}

UserModel.prototype.getUsersInListBaseID = function (arrUserid, callBack) {

    var query = this.model.find({'base_id': {"$in": arrUserid}});
    query.exec(function (err, data) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }
    });

}
UserModel.prototype.insertMany = function (arrayItem, callBack) {
    this.model.insertMany(arrayItem ,{},function (err,result) {
        if (err)
            return callBack(err)
        callBack(null,result);

    })
}

module["exports"] = new UserModel();