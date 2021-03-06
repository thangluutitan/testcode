var mongoose = require('mongoose');
var Config = require('../Config');
var GroupModel = function () {

};

GroupModel.prototype.model = null;

GroupModel.prototype.init = function (conn) {

    // Defining a schema
    var groupSchema = new mongoose.Schema({
        user_id: {type: String},
        to_user: {type: String},
        name: String,
        description: String,
        group_password: String,
        base_id : {type: Number, default: 0},
        category_id: {type: Number, default: 1},
        avatar_file_id: String,
        avatar_thumb_file_id: String,
        is_group: {type: Boolean, default: true},
        member_count: {type: Number, default: 0},
        created: {type: Number, default: Date.now},
        modified: {type: Number, default: Date.now}
    });

    this.model = conn.model(Config.CollectionPrefixV2 + "groups", groupSchema);
    return this.model;

}

GroupModel.prototype.findAll = function (callBack) {


    var query = this.model.find({});

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });


}

GroupModel.prototype.findGroupbyUserId = function (userId, limit, callBack) {


    var query = this.model.find({user_id: parseInt(userId)}).sort({'name': 'asc'}).limit(limit);

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });


}
GroupModel.prototype.findbyBaseId = function (id, callBack) {

    this.model.findOne({base_id: id}, function (err, group) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, group);
        }

    });

}
GroupModel.prototype.getGroupInListBaseID = function (arrUserid, callBack) {

    var query = this.model.find({'base_id': {"$in": arrUserid}});
    query.exec(function (err, data) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }
    });

}
GroupModel.prototype.findGroupbyObjectId = function (id, callBack) {
    var objectId = require('mongodb').ObjectId;
    var o_id = new objectId(id);

    this.model.findOne({_id: o_id}, function (err, group) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, group);
        }

    });

}
GroupModel.prototype.findMaxId = function (callBack) {


    var query = this.model.find({}).sort({'id': -1}).limit(1);
    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data[0]._doc.id);
        }

    });


}

GroupModel.prototype.getGroupsInList = function (arrGroupIds, callBack) {

    var query = this.model.find({_id: {"$in": arrGroupIds}}).sort({'name': 1}).collation({
        locale: 'en_US',
        caseLevel: true
    });

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }


    });
}

GroupModel.prototype.findGroupsbyInternalId = function (aryId, callBack) {

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

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });

},

    GroupModel.prototype.findGroups = function (arrGroupIds, callBack) {


        var query = this.model.find({
            _id: {"$in": arrGroupIds},
            is_group: true
        }).sort({'name': 1}).collation({locale: 'en_US', caseLevel: true});

        query.exec(function (err, data) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, data);
            }

        });


    }

GroupModel.prototype.findbyName = function (name, callBack) {

    var query = this.model.find({
        $and: [
            {"name": {'$regex': name, $options: 'i'}},
            {is_group: true}
        ]

    }).sort({'name': 1}).collation({locale: 'en_US', caseLevel: true});


    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

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

    var query = this.model.find().or(
        [
            {$and: [{user_id: uID1}, {to_user: uID2}, {is_group: false}]},
            {$and: [{user_id: uID2}, {to_user: uID1}, {is_group: false}]},
        ]).exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }
    });
}

//groupId param is ObjectId
GroupModel.prototype.removeGroup = function (groupId) {
    this.model.find({_id: groupId}).remove().exec();

}

//groupId param is string
GroupModel.prototype.remove = function (groupid) {
    var objectId = require('mongodb').ObjectId;
    var o_groupId = new objectId(groupid);
    this.model.find({_id: o_groupId}).remove().exec();

}

GroupModel.prototype.findByUserIdAndTouser = function (userId, toUser, callBack) {

    var query = this.model.findOne({user_id: userId,to_user: toUser}).exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }
    });
}
GroupModel.prototype.insertMany = function (arrayItem, callBack) {
    this.model.insertMany(arrayItem ,{},function (err,result) {
        if (err)
            return callBack(err)
        callBack(null,result);

    })
}

GroupModel.prototype.getLastDirectGroup = function (callBack) {
    var query = this.model.find({is_group:false}).sort({'base_id': 'desc'}).limit(1);

    query.exec(function (err, data) {


        if (typeof callBack === 'function') {
            if (err)
                return callBack(err, null);
            else
                callBack(null, data[0]);
        }

    });
}

GroupModel.prototype.getLast = function (callBack) {
    var query = this.model.find({is_group:true}).sort({'base_id': 'desc'}).limit(1);

    query.exec(function (err, data) {


        if (typeof callBack === 'function') {
            if (err)
                return callBack(err, null);
            else
                callBack(null, data[0]);
        }

    });
}

GroupModel.prototype.findDirectChatGroups = function (lastID, limit, callBack) {

    if (lastID !== 0) {

        var self = this;

        // this.model.findOne({id: lastID}, function (err, message) {

            // if (err){
            //     console.error(err);
            //     callBack(err, message);
            //     return;
            // }

            var query = self.model.find({
                is_group:false,
                base_id: {$gt: lastID}
            }).sort({'base_id': 'asc'}).limit(limit);

            query.exec(function (err, data) {

                if (typeof callBack === 'function') {
                    if (err) return callBack(err, null);
                    callBack(null, data);
                }

            });
        // });

    } else {

         query = this.model.find({is_group:false}).sort({'base_id': 'asc'}).limit(limit);

        query.exec(function (err, data) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, data);
            }

        });


    }

}
GroupModel.prototype.findGroups = function (lastID, limit, callBack) {

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
GroupModel.prototype.findOnlyGroups = function (lastID, limit, callBack) {

    if (lastID !== 0) {

        var self = this;

        this.model.findOne({id: lastID}, function (err, message) {

            if (err){
                console.error(err);
                callBack(err, message);
                return;
            }

            var query = self.model.find({
                is_group:true,
                base_id: {$gt: lastID}
            }).sort({'base_id': 'asc'}).limit(limit);

            query.exec(function (err, data) {

                if (typeof callBack === 'function') {
                    if (err) return callBack(err, null);
                    callBack(null, data);
                }

            });
        });

    } else {

        var query = this.model.find({is_group:true}).sort({'base_id': 'asc'}).limit(limit);

        query.exec(function (err, data) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, data);
            }

        });


    }

}

module["exports"] = new GroupModel();
