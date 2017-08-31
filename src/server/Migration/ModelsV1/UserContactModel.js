var mongoose = require('mongoose');
var _ = require('lodash');
var Config = require('../Config');


var UserContactModel = function () {

};

UserContactModel.prototype.model = null;

UserContactModel.prototype.init = function (conn) {
    //var connV1 = mongoose.createConnection(Config.DatabaseUrlV1);
    // Defining a schema
    var userContactSchema = new mongoose.Schema({
        user_id: Number,
        contact_user_id: Number,
        is_primary: {type: Boolean},
        is_favorites: {type: Boolean},
        created: Number,
        modified: Number
    },{collection: 'user_contact'});

    this.model = conn.model(Config.CollectionPrefixV1 + "user_contact", userContactSchema);

    return this.model;

}
UserContactModel.prototype.getLast = function (callBack) {
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

UserContactModel.prototype.findbyId = function (id, callBack) {

    this.model.findOne({_id: parseInt(id)}, function (err, group) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, group);
        }

    });

}

UserContactModel.prototype.findByObjectId = function (id, callBack) {


    this.model.findOne({_id: id}, function (err, contact) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, contact);
        }

    });

}

UserContactModel.prototype.findContactsByUserId = function (userId, callBack) {

    var query = this.model.find({user_id: userId}).sort({'created': 'desc'});

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }


    });

}

UserContactModel.prototype.findUserContact = function (userID, contactID, callBack) {

    var query = this.model.find({
        $and: [
            {user_id: userID},
            {contact_user_id: contactID}
        ]
    });

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }


    });

}

UserContactModel.prototype.getUserContactList = function (userId, callBack) {

    this.model.find({user_id: userId}, 'contact_user_id', function (err, data) {

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

UserContactModel.prototype.getUserContacts = function (userId, callBack) {

    this.model.find({user_id: userId}, {contact_user_id: 1, is_favorites: 1}, function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);

            callBack(null, data)
        }
    });


}

UserContactModel.prototype.getFavContactList = function (userId, callBack) {

    this.model.find({
        $and: [
            {user_id: userId},
            {is_favorites: true}
        ]
    }, 'contact_user_id', function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data)
        }
    });


}


UserContactModel.prototype.addcontact = function (newcontact, callBack) {
    newcontact.save(function (err, contact) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, contact);
        }

    });
}

UserContactModel.prototype.update = function (contact, newcontact, callBack) {
    contact.update(newcontact,
        {},
        function (err, result) {
            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, result);
            }

        });
}


UserContactModel.prototype.remove = function (uID, cID, callBack) {

    this.model.remove({
        $and: [
            {user_id: uID},
            {contact_user_id: cID}
        ]
    }, function (err, data) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });

}

UserContactModel.prototype.removeByID = function (ID, callBack) {

    var objectId = require('mongodb').ObjectId;
    var o_groupId = new objectId(ID);
    this.model.remove({_id: o_groupId}, function (err, data) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });

}

UserContactModel.prototype.find = function (lastID, limit, callBack) {

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


module["exports"] = new UserContactModel();