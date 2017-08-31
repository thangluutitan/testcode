var _ = require('lodash');
var async = require('async');
var GroupModel = require("../Models/GroupModel");
var UserGroupModel = require("../Models/UserGroupModel");
var MessageModel = require("../Models/MessageModel");
var UserContactModel = require("../Models/UserContactModel");

var UserUtils = function () {

};


UserUtils.prototype.countSharedGroup = function (myId, userId, callBack) {
    var userids = [myId, userId];
    var objectId = require('mongodb').ObjectId;

    UserGroupModel.getInList(userids, function (err, result) {

        var groupids = [];
        _(result)
            .groupBy('group_id')
            .map(function (items, id) {
                var o_id = new objectId(id);
                groupids.push(o_id);
                return items;
            }).value();

        GroupModel.findGroups(groupids, function (err, group) {

            if (typeof callBack === 'function') {
                if (err) throw err;
                callBack(group.length);
            }
        });

    });


}

UserUtils.prototype.countSharedMedia = function (myId, userId, callBack) {
    async.waterfall([
            function (done) {
                GroupModel.getDirectMessageConversation(myId, userId, function (err, result) {
                    if (err) done(err, null);
                    done(null, result);
                });
            },
            function (groups, done) {
                if (groups.length > 0) {
                    MessageModel.FindMediaOfIndivialConservation(groups[0]._id.toString(), function (err, result) {
                        if (err) done(err, null);
                        var count = result.filter(function (value) {
                            return !_.isUndefined(value);
                        }).length;

                        done(null, count);
                    });
                }
                else {
                    done(null, 0);
                }

            }

        ],
        function (err, result) {
            if (typeof callBack === 'function') {
                if (err) throw err;
                callBack(result);
            }
        });
}

UserUtils.prototype.countSharedContact = function (myId, userId, callBack) {
    
    UserContactModel.getUserContactList(myId, function (err, myContacts) {
        if (err) throw err;
        UserContactModel.getUserContactList(userId, function (err, otherContacts) {

             if (typeof callBack === 'function') {
                if (err) throw err;
                var result = _.intersection(myContacts,otherContacts);
                callBack(result.length);
            }
            
        });
    });
                            
        
}


module["exports"] = new UserUtils();