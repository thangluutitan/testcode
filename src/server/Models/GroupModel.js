var mongoose = require('mongoose');
var Settings = require("../lib/Settings");
var Utils = require("../lib/Utils");

var GroupModel = function () {

};

GroupModel.prototype.model = null;

GroupModel.prototype.init = function () {

    // Defining a schema
    var groupSchema = new mongoose.Schema({
        user_id: {type: String},
        to_user: {type: String},
        name: String,
        description: String,
        group_password: String,
        category_id: {type: Number},
        avatar_file_id: String,
        avatar_thumb_file_id: String,
        is_group: {type: Boolean},
        is_clear: {type: Boolean},
        is_active: {type: Boolean},
        member_count: {type: Number},
        hiddenBy: [],
        created: {type: Number},
        modified: {type: Number}
    });

    this.model = mongoose.model(Settings.options.dbCollectionPrefix + "groups", groupSchema);
    return this.model;

}

GroupModel.prototype.findAll = function ( callBack) {

    if (typeof callBack !== 'function') return;
    var query = this.model.find({});

    query.exec(function (err, data) {

        if (err) return callBack(err, null);
        callBack(null, data);

    });


}

GroupModel.prototype.findGroupbyUserId = function (userId, limit, callBack) {

    if (typeof callBack !== 'function') return;
    var query = this.model.find({user_id: parseInt(userId),is_active: {"$ne": false}}).sort({'name': 'asc'}).limit(limit);

    query.exec(function (err, data) {

        if (err) return callBack(err, null);
        callBack(null, data);

    });


}

GroupModel.prototype.findGroupbyObjectId = function (id, callBack) {
    if (typeof callBack !== 'function') return;
    var isvalid = Utils.CheckvalidGroup(id)

    if(!isvalid )
        return callBack(null,[]);

    var objectId = require('mongodb').ObjectId;
    var o_id = new objectId(id);

    this.model.findOne({_id: o_id,is_active: {"$ne": false}}, function (err, group) {
        if (err) return callBack(err, null);
        callBack(null, group);
    });

}
GroupModel.prototype.findMaxId = function (callBack) {
    if(typeof callBack !== 'function') return;
    var query = this.model.find({}).sort({'id': -1}).limit(1);
    query.exec(function (err, data) {

        if (err) return callBack(err, null);
        callBack(null, data[0]._doc.id);


    });


}

GroupModel.prototype.getGroupsInList = function (arrGroupIds,ignoreStatus, callBack) {
    if(typeof callBack !== 'function') return;
    
    var condition = [{_id: {"$in": arrGroupIds}}];
    
    if(!ignoreStatus) 
        condition.push({is_active: {"$ne": false}});
    var query = this.model.find({$and:condition}).sort({'name': 1}).collation({ locale: 'en_US', caseLevel: true });

    query.exec(function (err, data) {

        if (err) return callBack(err, null);
        callBack(null, data);

    });
}

GroupModel.prototype.findGroupsbyInternalId = function (aryId, callBack) {
    if(typeof callBack !== 'function') return;
    var conditions = [];
    aryId.forEach(function (groupId) {

        conditions.push({
            _id: groupId
        });

    });

    var query = this.model.find({
        $or: conditions
    }).sort({'created': 1});

    query.exec(function (err, data) {

        if (err) return callBack(err, null);
        callBack(null, data);


    });

},

    GroupModel.prototype.findGroups = function (arrGroupIds, callBack) {

        if(typeof callBack !== 'function') return;
        var query = this.model.find({_id: {"$in": arrGroupIds}, is_group: true,is_active: {"$ne": false}}).sort({'name': 1}).collation({ locale: 'en_US', caseLevel: true });

        query.exec(function (err, data) {

            if (err) return callBack(err, null);
            callBack(null, data);

        });


    }

GroupModel.prototype.findbyName = function (name, callBack) {
    if(typeof callBack !== 'function') return;
    var query = this.model.find({
         $and: [
                    {"name": {'$regex': name, $options: 'i'}},
                    {is_group: true},
                    {is_active: { "$ne": false }}
                ]
                  
        }).sort({'name': 1}).collation({ locale: 'en_US', caseLevel: true });



    query.exec(function (err, data) {

        if (err) return callBack(err, null);
        callBack(null, data);


    });

}

GroupModel.prototype.saveGroup = function (newgroup, callBack) {

    newgroup.save(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });


}

GroupModel.prototype.updateGroup = function (group, newgroup, callBack) {
    group.update(newgroup,
        {},
        function (err, data) {
            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, data);
            }

        });

}

//Get group for directMessage if existing
GroupModel.prototype.getDirectMessageConversation = function (uID1, uID2, callBack) {
    if(typeof callBack !== 'function') return;
    this.model.find().or(
        [
            {$and: [{user_id: uID1}, {to_user: uID2}, {is_group: false}]},
            {$and: [{user_id: uID2}, {to_user: uID1}, {is_group: false}]},
        ]).exec(function (err, data) {

            if (err) return callBack(err, null);
            callBack(null, data);
    });
}

//groupId param is ObjectId
GroupModel.prototype.removeGroup = function (groupId) {
    this.model.find({_id: groupId}).remove().exec();

}

//groupId param is string
GroupModel.prototype.remove = function (groupid) {
    var isvalid = Utils.CheckvalidGroup(groupid)
    if(!isvalid)
    {        
        return;
    }
    var objectId = require('mongodb').ObjectId;
    var o_groupId = new objectId(groupid);
    this.model.find({_id: o_groupId}).remove().exec();

}

GroupModel.prototype.MakeGroupInActive = function (groupId, callBack) {
    if(typeof callBack !== 'function') return;
    var isvalid = Utils.CheckvalidGroup(groupId)
    if(!isvalid )
    {
        callBack("Invalid groupId.",null);
        return;
    }

    var objectId = require('mongodb').ObjectId;
    var objGroupId = new objectId(groupId);

    this.model.update(
        {            
            _id: objGroupId            
            
        },//query search for update
        { $set: { is_active: false } },
        { "multi": false } //for multiple documents
        , function (err, data) {

            if (err) return callBack(err, null);
            callBack(null, data)

        });

}

module["exports"] = new GroupModel();