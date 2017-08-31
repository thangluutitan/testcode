var mongoose = require('mongoose');
var _ = require('lodash');
var UserModel = require('./UserModel');
var Config = require('../Config');
var Const = require('../../const');

var MessageModel = function () {

};

MessageModel.prototype.model = null;

MessageModel.prototype.init = function (conn) {
    //var connV1 = mongoose.createConnection(Config.DatabaseUrlV1);
    // Defining a schema
    var messageSchema = new mongoose.Schema({
        //_id: {type: mongoose.Schema.Types.ObjectId, index: true},
        id:Number,
        from_user_id: {type: Number},
        to_user_id: {type: Number},
        to_group_id: {type: Number, default: 0},
        to_group_name: String,
        body: String,
        message_target_type: String,
        message_type: String,
        emoticon_image_url: String,
        picture_file_id: String,
        picture_thumb_file_id: String,
        valid: Number,
        from_user_name: String,
        to_user_name: String,
        delete_type: Number,
        delete_at: Number,
        delete_flagged_at: Number,
        delete_after_shown: {type: Boolean, default: false},
        blocked: {type: Boolean, default: false},
        read_at: Number,
        report_count: {type: Number, default: 0},
        comment_count: {type: Number, default: 0},
        deleted: Number,
        created: Number,
        modified: Number,
        seenBy:[],
        deletedBy:[],
        roomID:String
    }, {collection: 'message'});
    this.model = conn.model(Config.CollectionPrefixV1 + "message", messageSchema);
    return this.model;
}


MessageModel.prototype.findMessagebyId = function (id, callBack) {

    this.model.findOne({_id: id}, function (err, user) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, user);
        }


    });

}

MessageModel.prototype.findAllMessages = function (roomID, lastMessageID, callBack) {

    var self = this;

    this.model.findOne({_id: lastMessageID}, function (err, message) {

        if (err) callBack(err, null)

        var query = {
            roomID: roomID
        };

        if (message) {
            var lastCreated = message.created;
            query.created = {$gt: lastCreated};
        }

        var query = self.model.find(query).sort({'created': 'desc'});

        query.exec(function (err, data) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, data);
            }

        });


    });

}

MessageModel.prototype.findMessages = function (roomID, lastMessageID, limit, callBack) {

    if (lastMessageID !== "0") {

        var self = this;

        this.model.findOne({_id: lastMessageID}, function (err, message) {

            if (err) return console.error(err);

            var lastCreated = message.created;

            var query = self.model.find({
                roomID: roomID,
                created: {$lt: lastCreated}
            }).sort({'created': 'desc'}).limit(limit);

            query.exec(function (err, data) {

                if (typeof callBack === 'function') {
                    if (err) return callBack(err, null);
                    callBack(null, data);
                }

            });


        });

    } else {

        var query = this.model.find({roomID: roomID}).sort({'created': 'desc'}).limit(limit);

        query.exec(function (err, data) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, data);
            }

        });


    }

}

/// param groupId/userId is ObjectId
/// If userId is string then function will convert to ObjectId
MessageModel.prototype.findUnSeenMessages = function (arrGroups, findUser, callBack) {

    var arrGroupIds = [];
    var arrUserIds = [];
    _.forEach(arrGroups, function (group) {
        arrGroupIds.push(group._id.toString());
        arrUserIds.push(group.to_user);
    });

    var query = this.model.find({
        roomID: {"$in": arrGroupIds},
        type: {"$nin": [Const.messageNewUser]}//remove , Const.messageUserLeave
    }).sort({'created': 'desc'});

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);

            UserModel.getUsersInList(arrUserIds, function (err, users) {
                if (err) return callBack(err, null);
                var result = countUnSeen(data, arrGroups, users, findUser);
                callBack(err, result);
            });
        }

    });


}


MessageModel.prototype.findMediaMessages = function (param, callBack) {
    //roomID limit page 
    var offset = 0;
    if (param.page > 1) {
        offset = (param.page - 1) * param.limit;
    }
    var query = this.model.find({
        $and: [
            {roomID: param.roomID},
            {file: {$ne: null}},
            {
                $or: [
                    {"file.file.mimeType": "image/jpeg"},
                    {"file.file.mimeType": "image/png"},
                    {"file.file.mimeType": "image/gif"},
                    {"file.file.mimeType": "video/mpeg"},
                    {"file.file.mimeType": "video/mp4"},
                    {"file.file.mimeType": "video/avi"},
                    {"file.file.mimeType": "audio/mp3"},
                    {"file.file.mimeType": "audio/wav"},
                    {"file.file.mimeType": "audio/mpeg"},
                    {"file.file.mimeType": "application/ogg"}
                ]
            }
        ]
    }).skip(offset)
        .limit(param.limit)
        .sort({'created': 'desc'});

    query.exec(function (err, result) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, result);
        }

    });


}

var countUnSeen = function (messages, groups, users, findUser) {

    groups
        .map(function (doc) {

            delete doc._doc.__v;
            if (!doc._doc.is_group) {
                if (users !== null) {
                    users.map(function (user) {
                        if (findUser.userID === doc.to_user) {
                            doc.name = findUser.name;
                        }
                        else {
                            if (user.userID === doc.to_user) {
                                doc._doc.name = user.name;
                            }
                        }

                    });
                }
            }
            //Count unseen and append last meassage
            doc._doc.unseen = 0;
            doc._doc.lastmessage = null;
            var tmpMessage = null;

            var result = _(messages)
                .groupBy('roomID')
                .map(function (items, itemId) {
                    if (doc._id.toString() === itemId) {

                        var count = items.filter(function (message) {
                            return isUnSeenMessage(message.seenBy, findUser._id) && message.userID != findUser.userID;
                        }).length;

                        return tmpMessage = {
                            unseen: count,
                            lastmessage: items[0]
                        };

                    }
                }).value();

            if (tmpMessage != null) {
                doc._doc.unseen = tmpMessage.unseen;
                doc._doc.lastmessage = tmpMessage.lastmessage;
                UserModel.findUserbyId(tmpMessage.lastmessage.userID, function (err, result) {
                    if (result != undefined)
                        doc._doc.lastmessage._doc.userName = result.name;
                });
                doc._doc.last_activity_date = tmpMessage.lastmessage.created;
            }
            else {
                doc._doc.last_activity_date = doc.created;
            }


        });
    return groups;

}


var isUnSeenMessage = function (seenby, messageObjId) {
    var count = seenby.filter(function (value) {
        return value.user.toString() == messageObjId.toString();
    }).length;
    return count <= 0;
}

MessageModel.prototype.FindMediaOfIndivialConservation = function (roomId, callBack) {
    var query = this.model.find({
        $and: [
            {'roomID': roomId},
            {'type': Const.messageTypeFile},
            {"file.file.mimeType": {"$regex": "^audio|^video|^image"}}
        ]
    });

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });
}

MessageModel.prototype.populateMessages = function (messages, callBack) {

    if (!_.isArray(messages)) {

        messages = [messages];

    }

    // collect ids
    var ids = [];

    messages.forEach(function (row) {

        // get users for seeny too
        _.forEach(row.seenBy, function (row2) {
            ids.push(row2.user);
        });

        ids.push(row.user);

    });

    if (ids.length > 0) {

        UserModel.findUsersbyInternalId(ids, function (err, userResult) {

            var resultAry = [];

            _.forEach(messages, function (messageElement, messageIndex, messagesEntity) {

                var obj = messageElement.toObject();
                _.forEach(userResult, function (userElement, userIndex) {

                    // replace user to userObj
                    if (messageElement.user.toString() == userElement._id.toString()) {
                        obj.user = userElement.toObject();
                    }

                });

                var seenByAry = [];

                // replace seenby.user to userObj
                _.forEach(messageElement.seenBy, function (seenByRow) {
                    _.forEach(userResult, function (userElement, userIndex) {
                        // replace user to userObj
                        if (seenByRow.user.toString() == userElement._id.toString()) {

                            seenByAry.push({
                                user: userElement,
                                at: seenByRow.at
                            });

                        }

                    });

                });

                obj.seenBy = seenByAry;

                resultAry.push(obj);

            });


            callBack(err, resultAry);

        });

    } else {
        callBack(null, messages);
    }

}

MessageModel.prototype.getLastDirectMessage = function (callBack) {
    var query = this.model.find({message_target_type: "user"}).sort({'id': 'desc'}).limit(1);

    query.exec(function (err, data) {


        if (typeof callBack === 'function') {
            if (err)
                return callBack(err, null);
            else
                callBack(null, data[0]);
        }

    });
}

MessageModel.prototype.getLastBlockMessage = function (callBack) {
    var query = this.model.find({$and:[
        {message_target_type: "user"},
        {blocked: 1},
    ]}).sort({'id': 'desc'}).limit(1);

    query.exec(function (err, data) {


        if (typeof callBack === 'function') {
            if (err)
                return callBack(err, null);
            else
                callBack(null, data[0]);
        }

    });
}

MessageModel.prototype.findBlockedMessages = function (lastID, limit, callBack) {
    if (lastID !== 0) {

        var self = this;

        this.model.findOne({id: lastID}, function (err, message) {

            if (err){
                console.error(err);
                callBack(err, message);
                return;
            }

            var query = self.model.find({
                message_target_type: "user",
                blocked: 1,
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

        var query = this.model.find({message_target_type: "user", blocked: 1}).sort({'id': 'asc'}).limit(limit);

        query.exec(function (err, data) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, data);
            }

        });


    }

}

MessageModel.prototype.findDirectMessages = function (lastID, limit, callBack) {
        if (lastID !== 0) {

            var self = this;

            this.model.findOne({id: lastID}, function (err, message) {

                if (err){
                    console.error(err);
                    callBack(err, message);
                    return;
                }

                var query = self.model.find({
                    message_target_type: "user",
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

            var query = this.model.find({message_target_type: "user"}).sort({'id': 'asc'}).limit(limit);

            query.exec(function (err, data) {

                if (typeof callBack === 'function') {
                    if (err) return callBack(err, null);
                    callBack(null, data);
                }

            });


        }
        
}
MessageModel.prototype.getLast = function (callBack) {
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


MessageModel.prototype.findMultiMessages = function (lastID, limit, callBack) {
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

MessageModel.prototype.findby_to_group_id = function (id, callBack) {

    this.model.findOne({to_group_id: id}, function (err, user) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, user);
        }


    });

}
MessageModel.prototype.updateRoomID = function (groupid,roomID, callBack) {
    
this.model.update({to_group_id:groupid},{roomID:roomID}, {multi:true}, function (err, result) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, result);
        }


    });

}
MessageModel.prototype.updateRoomIDDirectMessageConversation = function (uID1, uID2,roomID, callBack) {

    this.model.update({$or:[
            {$and: [{from_user_id: uID1}, {to_user_id: uID2}]},
            {$and: [{from_user_id: uID2}, {to_user_id: uID1}]},
                            ]
        },
    {roomID:roomID}, {multi:true}, function (err, result) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, result);
        }


    });

    
}

MessageModel.prototype.getDirectMessages = function (uID1, uID2, callBack) {

    var query = this.model.find().or(
        [
            {$and: [{from_user_id: uID1}, {to_user_id: uID2}, {message_target_type: 'user'}]},
            {$and: [{from_user_id: uID2}, {to_user_id: uID1}, {message_target_type: 'user'}]},
        ]).exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }
    });
}


module["exports"] = new MessageModel();