var mongoose = require('mongoose');
var _ = require('lodash');
var Config = require('../Config');
var UserBlockModel = function () {

};

UserBlockModel.prototype.model = null;

UserBlockModel.prototype.init = function (conn) {

    // Defining a schema
    var UserBlockSchema = new mongoose.Schema({
        user_id: String,
        base_id : Number,
        block_user_id: String,
        created: Number
    });

    this.model = conn.model(Config.CollectionPrefixV2 + "user_blocks", UserBlockSchema);

    return this.model;

}

UserBlockModel.prototype.save = function (newItem, callBack) {

    newItem.save(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });
}
UserBlockModel.prototype.findbyId = function (id, callBack) {

    this.model.findOne({_id: parseInt(id)}, function (err, group) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, group);
        }

    });

}

UserBlockModel.prototype.findByObjectId = function (id, callBack) {


    this.model.findOne({_id: id}, function (err, contact) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, contact);
        }

    });

}



UserBlockModel.prototype.findUserBlock = function (uID, bID, callBack) {

    var query = this.model.find({
        $and: [
            {user_id: uID},
            {contact_user_id: bID}
        ]
    });

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }


    });

}

UserBlockModel.prototype.getUserBlockList = function (userId, callBack) {

    this.model.find({user_id: userId}, 'block_user_id', function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            var lst = [];

            _.forEach(data, function (dataObj) {
                lst.push(dataObj.contact_user_id);
            });
            callBack(null, lst)
        }
    });


}

UserBlockModel.prototype.getUserBlocks = function (userId, callBack) {

    this.model.find({user_id: userId}, {block_user_id: 1}, function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);

            callBack(null, data)
        }
    });


}


UserBlockModel.prototype.addUserBlock = function (newItem, callBack) {
    newItem.save(function (err, contact) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, contact);
        }

    });
}

UserBlockModel.prototype.update = function (item, newItem, callBack) {
    item.update(newItem,
        {},
        function (err, result) {
            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, result);
            }

        });
}



UserBlockModel.prototype.remove = function (uID, bID, callBack) {

    this.model.remove({
        $and: [
            {user_id: uID},
            {block_user_id: bID}
        ]
    }, function (err, data) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });

}

UserBlockModel.prototype.removeByID = function (ID, callBack) {

    var objectId = require('mongodb').ObjectId;
    var o_groupId = new objectId(ID);
    this.model.remove({_id: o_groupId}, function (err, data) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });

}


module["exports"] = new UserBlockModel();