var mongoose = require('mongoose');
var _ = require('lodash');
var Config = require('../Config');

var UserGroupModel = function () {

};

UserGroupModel.prototype.model = null;

UserGroupModel.prototype.init = function (conn) {

    // Defining a schema
    var userGroupSchema = new mongoose.Schema({
        user_id: {type: Number},
        group_id: {type: Number},
        is_admin: {type: Boolean},
        created: {type: Number}
    },{collection: 'user_group'});

    this.model = conn.model(Config.CollectionPrefixV1 + "user_group", userGroupSchema);
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

UserGroupModel.prototype.getLast = function (callBack) {
    var query = this.model.find({}).sort({'id': 'desc'}).limit(1);

    query.exec(function (err, data) {


        if (typeof callBack === 'function') {
            if (err)
                return callBack(err, null);
            else
                callBack(null, data[0]);
        }

    });
}

UserGroupModel.prototype.find = function (lastID, limit, callBack) {

    if (lastID !== 0) {

        var self = this;

        this.model.findOne({id: lastID}, function (err, message) {

            if (err){
                console.error(err);
                callBack(err, message);
                return;
            }

            var query = self.model.find({
                id: {$gt: lastID}
            }).sort({'id': 'asc'}).limit(limit);

            query.exec(function (err, data) {

                if (typeof callBack === 'function') {
                    if (err) return callBack(err, null);
                    callBack(null, data);
                }

            });
        });

    } else {

        var query = this.model.find({}).sort({'id': 'asc'}).limit(limit);

        query.exec(function (err, data) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, data);
            }

        });


    }

}

module["exports"] = new UserGroupModel();