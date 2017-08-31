var mongoose = require('mongoose');
var _ = require('lodash');
var Config = require('../Config');
var UserGroupModel = function () {

};

UserGroupModel.prototype.model = null;

UserGroupModel.prototype.init = function (conn) {

    // Defining a schema
    var userGroupSchema = new mongoose.Schema({
        base_id: {type: Number},
        user_id: {type: String},
        group_id: {type: mongoose.Schema.Types.ObjectId},
        is_admin: {type: Boolean, default: false},
        created: {type: Number}
    });

    this.model = conn.model(Config.CollectionPrefixV2 + "user_groups", userGroupSchema);
    return this.model;

}

UserGroupModel.prototype.findbyUserIdAndGroupId = function (userId, groupId, callBack) {


    var query = this.model.find({user_id: userId, group_id: groupId}).sort({'created': 'asc'});

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });


}

UserGroupModel.prototype.findbyGroupId = function (groupId, callBack) {
    var objectId = require('mongodb').ObjectId;
    var objGroupId = new objectId(groupId);

    var query = this.model.find({group_id: objGroupId}).sort({'created': 'asc'});

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });


}
UserGroupModel.prototype.getGroupInList = function (arrGroupId, callBack) {

    this.model.find({group_id: {"$in":arrGroupId}}, function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data)
        }
    });


}

UserGroupModel.prototype.getGroupList = function (userId, callBack) {

    this.model.find({user_id: userId}, 'group_id', function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            var lst = [];

            _.forEach(data, function (dataObj) {
                lst.push(dataObj.group_id);
            });
            callBack(null, lst)
        }
    });


}

UserGroupModel.prototype.getGroupsAndCountMembers = function (groupIds, callBack) {

    var query = this.model.aggregate([
        {$match: {group_id: {$in: groupIds}}},
        {$group: {_id: "$group_id", userSet: {$addToSet: "$user_id"}}},
        {$project: {"group_id": 1, membercount: {$size: "$userSet"}}}
    ]);

    query.exec(function (err, data) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }
    });

}

UserGroupModel.prototype.promoteAdmin = function (groupId, userIds, callBack) {

    var objectId = require('mongodb').ObjectId;
    var objGroupId = new objectId(groupId);

    this.model.update(
        {
            $and: [
                {group_id: objGroupId},
                {user_id: {"$in": userIds}}
            ]
        },//query search for update
        {$set: {is_admin: true}},
        {"multi": true} //for multiple documents
        , function (err, data) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);

                callBack(null, data)
            }
        });

}

UserGroupModel.prototype.getInList = function (userIds, callBack) {

    var query = this.model.find({user_id: {"$in": userIds}}).sort({'created': 'desc'});

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }


    });
}

UserGroupModel.prototype.save = function (newUserGroup, callBack) {

    newUserGroup.save(function (err, result) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, result);
        }

    });


}

UserGroupModel.prototype.update = function (userGroup, newUserGroup, callBack) {
    userGroup.update({
            user_id: newUserGroup.user_id,
            group_id: newUserGroup.group_id,
            created: newUserGroup.created
        },
        {},
        function (err, result) {
            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, result);
            }

        });
}

UserGroupModel.prototype.remove = function (userid, groupId, callback) {

    var objectId = require('mongodb').ObjectId;
    var objGroupId = new objectId(groupId);

    this.model.remove({group_id: objGroupId, user_id: userid}, function (err) {
        if (callback)
            return callback(err);

    });

}

UserGroupModel.prototype.insertMany = function (arrayItem, callBack) {
    this.model.insertMany(arrayItem ,{},function (err,result) {
        if (err)
            return callBack(err)
        callBack(null,result);

    })
}

module["exports"] = new UserGroupModel();