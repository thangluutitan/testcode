var mongoose = require('mongoose');
var Settings = require("../lib/Settings");
var Utils = require("../lib/Utils");

var UserGroupModel = function () {

};

UserGroupModel.prototype.model = null;

UserGroupModel.prototype.init = function () {

    // Defining a schema
    var userGroupSchema = new mongoose.Schema({
        user_id: {type: String},
        group_id: {type: mongoose.Schema.Types.ObjectId},
        is_admin: Boolean,
        has_left: Boolean,
        left_time: Number,
        created: Number
    });

    this.model = mongoose.model(Settings.options.dbCollectionPrefix + "user_groups", userGroupSchema);
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

    var isvalid = Utils.CheckvalidGroup(groupId)
    if (!isvalid && typeof callBack === 'function') {
        callBack(null, []);
        return;
    }

    var objectId = require('mongodb').ObjectId;
    var objGroupId = new objectId(groupId);
    var query = this.model.find({group_id: objGroupId, has_left: {"$ne": true}}).sort({'created': 'asc'});

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });


}

UserGroupModel.prototype.getGroupList = function (userId, callBack) {

    this.model.find({user_id: userId}, function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);

            callBack(null, data)
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

    var isvalid = Utils.CheckvalidGroup(groupId)
    if (!isvalid && typeof callBack === 'function') {
        callBack("Invalid groupId.", null);
        return;
    }

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

UserGroupModel.prototype.remove = function (userid, groupId, callBack) {
    if (typeof callBack !== 'function') return;
    var isvalid = Utils.CheckvalidGroup(groupId)
    if (!isvalid) {
        callBack("Invalid groupId.");
        return;
    }
    var objectId = require('mongodb').ObjectId;
    var objGroupId = new objectId(groupId);

    this.model.remove({group_id: objGroupId, user_id: userid}, function (err) {
        if (err)
            return callBack(err);

    });

}

UserGroupModel.prototype.processLeave = function (groupId, userId, hasleft, callBack) {
    if (typeof callBack !== 'function') return;
    var isvalid = Utils.CheckvalidGroup(groupId)
    if (!isvalid) {
        callBack("Invalid groupId.", null);
        return;
    }

    var objectId = require('mongodb').ObjectId;
    var objGroupId = new objectId(groupId);

    this.model.update(
        {
            $and: [
                {group_id: objGroupId},
                {user_id: userId}
            ]
        },//query search for update
        {$set: {has_left: hasleft, left_time: hasleft ? Utils.now() : 0}},
        {"multi": true} //for multiple documents
        , function (err, data) {

            if (err) return callBack(err, null);
            callBack(null, data)
        });

}

UserGroupModel.prototype.findUsersInGroup = function (groupId, callBack) {
    if (typeof callBack !== 'function') return;
    var isvalid = Utils.CheckvalidGroup(groupId)
    if (!isvalid) {
        callBack(null, []);
        return;
    }

    var objectId = require('mongodb').ObjectId;
    var objGroupId = new objectId(groupId);
    var query = this.model.find(
        {
            $and: [
                {group_id: objGroupId},
                {has_left: {"$ne": true}}
            ]

        }).sort({'created': 'asc'});

    query.exec(function (err, data) {

        if (err) return callBack(err, null);
        callBack(null, data);

    });


}

UserGroupModel.prototype.findbyGroupIdExcludeUser = function (groupId, uId, callBack) {

    var isvalid = Utils.CheckvalidGroup(groupId)
    if(!isvalid)
    {
        if (typeof callBack !== 'function') return;
        callBack(null,[]);
        return;
    }

    var objectId = require('mongodb').ObjectId;
    var objGroupId = new objectId(groupId);
    var query = this.model.find(
        {
            $and: [
                { group_id: objGroupId },
                { user_id: {"$ne": uId} },
                { has_left:  { "$ne": true } }
            ]

        }).sort({ 'created': 'asc' });

    query.exec(function (err, data) {

        if (typeof callBack !== 'function') return;
        if (err) return callBack(err, null);
        callBack(null, data);

    });


}

UserGroupModel.prototype.insertMany = function (arrayItem, callBack) {
    this.model.insertMany(arrayItem, {}, function (err, result) {

        if (typeof callBack !== 'function') return;
        if (err) {
            return callBack(err, {})
        }else{
            callBack(null, result);
        }


    })
}

UserGroupModel.prototype.removeMany = function (groupId, userIds, callBack) {
    var isvalid = Utils.CheckvalidGroup(groupId)
    if (!isvalid && typeof callBack === 'function') {
        callBack("Invalid groupId.");
        return;
    }
    var objectId = require('mongodb').ObjectId;
    var objGroupId = new objectId(groupId);

    this.model.remove({
        $and: [
            {'group_id': objGroupId},
            {user_id: {'$in': userIds}}
        ]
    }, function (err, result) {
        if (typeof callBack !== 'function') return;

        if (err )
            return callBack(err,{})
        else
            callBack(null, result);
    });
}


module["exports"] = new UserGroupModel();