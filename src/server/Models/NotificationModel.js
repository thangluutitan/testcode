var mongoose = require('mongoose');
var Settings = require("../lib/Settings");
var NotificationModel = function () {

};

NotificationModel.prototype.model = null;

NotificationModel.prototype.init = function () {

    // Defining a schema
    var notifySchema = new mongoose.Schema({
        user_id: {type: String, index: true},
        from_user_id: String,
        to_group_id: String,
        target_type: String,
        message: String,
        user_image_url: String,
        count: Number,
        created: Number,
        modified: Number
    });


    this.model = mongoose.model(Settings.options.dbCollectionPrefix + "notifications", notifySchema);
    return this.model;

}


NotificationModel.prototype.getInList = function (arrId, callBack) {

    var query = this.model.find({'_id': {"$in": arrId}}).sort({'name': 'asc'});

    query.exec(function (err, data) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }
    });


}


NotificationModel.prototype.update = function (item, newItem, callBack) {
    item.update(newItem,
        {},
        function (err, result) {
            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, result);
            }

        });

}

NotificationModel.prototype.save = function (newUser, callBack) {

    newUser.save(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });
}


NotificationModel.prototype.findByUserID = function (userID, callBack) {


    var query = this.model.find({"user_id": {'$regex': userID, $options: 'i'}}).sort({'created': 1});
    query.exec(function (err, results) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, results);
        }
    });

}

NotificationModel.prototype.findByUserInList = function (userIds, callBack) {


    var query = this.model.find({user_id: {'$in': userIds}}).sort({'user_id':1,'created': 1});
    query.exec(function (err, results) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, results);
        }
    });

}


NotificationModel.prototype.removeByUserID = function (uID, callBack) {

    this.model.remove({
        "user_id": {'$regex': uID, $options: 'i'}
    }, function (err, data) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });
}

NotificationModel.prototype.insertMany = function (arrayItem, callBack) {
    this.model.insertMany(arrayItem, {}, function (err, result) {
        if (err)
            return callBack(err)
        callBack(null, result);

    })
}

NotificationModel.prototype.removeMany = function (groupId, userId, callBack) {

    this.model.remove({
        $and: [
            {to_group_id: groupId},
            {user_id: userId}
        ]
    }, function (err, result) {
        if (err)
            callBack(err, {});
        else
            callBack(null, result)
    });
}

module["exports"] = new NotificationModel();