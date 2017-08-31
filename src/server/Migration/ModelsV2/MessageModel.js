var mongoose = require('mongoose');
var _ = require('lodash');
var Const = require('../../const.js');
var Util = require('../../lib/Utils');
var UserModel = require('./UserModel');
var Config = require('../Config');
var MessageModel = function () {

};

MessageModel.prototype.model = null;

MessageModel.prototype.init = function (conn) {

    // Defining a schema
    var messageSchema = new mongoose.Schema({
        //_id: {type: mongoose.Schema.Types.ObjectId, index: true},
        base_id: {type: Number, default: 0},
        user: {type: mongoose.Schema.Types.ObjectId, index: true},
        localID: {type: String, index: true},
        userID: {type: String, index: true},
        roomID: {type: String, index: true},
        type: Number,
        message: String,
        image: String,
        file: {
            file: {
                id: mongoose.Schema.Types.ObjectId,
                name: String,
                size: Number,
                mimeType: String
            },
            thumb: {
                id: mongoose.Schema.Types.ObjectId,
                name: String,
                size: Number,
                mimeType: String
            }
        },
        seenBy: [],
        deletedBy: [],
        location: {
            lat: Number,
            lng: Number
        },
        deleted: Number,
        created: Number,
        attributes: {}
    });

    // add instance methods
    messageSchema.methods.addSeenBy = function (user, callBack) {

        var seenBy = this.seenBy;
        var self = this;

        var listOfUsers = [];

        _.forEach(seenBy, function (seenObj) {

            listOfUsers.push(seenObj.user);

        });

        if (_.indexOf(listOfUsers, user._id) == -1) {

            seenBy.push({user: user._id, at: Util.now()});

            this.update({
                seenBy: seenBy
            }, {}, function (err, userResult) {

                if (callBack)
                    callBack(err, self);

            });


        }

    }

    this.model = conn.model(Config.CollectionPrefixV2 + "messages", messageSchema);
    return this.model;

}

MessageModel.prototype.getLast = function (callBack) {
    var query = this.model.find({}).sort({'base_id': 'desc'}).limit(1);

    query.exec(function (err, data) {


        if (typeof callBack === 'function') {
            if (err)
                return callBack(err, null);
            else
                callBack(null, data[0]);
        }

    });
}

MessageModel.prototype.findbyBaseId = function (id, callBack) {

    this.model.findOne({base_id: id}, function (err, group) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, group);
        }

    });

}
MessageModel.prototype.findMultiMessages = function (lastID, limit, callBack) {
    if (lastID !== 0) {

        var self = this;

        this.model.findOne({base_id: lastID}, function (err, message) {

            if (err) {
                console.error(err);
                callBack(err, message);
                return;
            }

            var query = self.model.find({
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

        var query = this.model.find({}).sort({'base_id': 'asc'}).limit(limit);

        query.exec(function (err, data) {

            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, data);
            }

        });


    }

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
MessageModel.prototype.saveMessage = function (newMessage, callBack) {

    newMessage.save(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });


}
MessageModel.prototype.insertMany = function (arrayItem, callBack) {
    this.model.insertMany(arrayItem, {}, function (err, result) {
        if (err)
            return callBack(err)
        callBack(null, result);

    })
}

MessageModel.prototype.updateMany = function (arrayItem, callBack) {

    var bulk = this.model.initializeOrderedBulkOp(),
        counter = 0;

    arrayItem.forEach(function (item) {
        bulk.find({_id: item._doc._id}).updateOne({
            $set: {seenBy: item._doc.seenBy, deletedBy: item._doc.deletedBy}//,deletedBy: item._doc.deletedBy
        });

        counter++;
        if (counter % arrayItem.length == 0) {
            bulk.execute(function (err, result) {
                if (err)
                    return callBack(err)
                callBack(null, result);

            });
        }


    });
}

MessageModel.prototype.getInListBaseID = function (baseIDs, callBack) {

    var query = this.model.find({base_id: {"$in": baseIDs}}).sort({'created': 'desc'});

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }


    });
}

module["exports"] = new MessageModel();