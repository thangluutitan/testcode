var mongoose = require('mongoose');
var _ = require('lodash');
var Settings = require("../lib/Settings");
var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");

var UserContactModel = function () {

};

UserContactModel.prototype.model = null;

UserContactModel.prototype.init = function () {

    // Defining a schema
    var userContactSchema = new mongoose.Schema({
        user_id: String,
        contact_user_id: String,
        is_primary: Boolean,
        is_favorites: Boolean,
        created: Number,
        modified: Number
    });

    this.model = mongoose.model(Settings.options.dbCollectionPrefix + "user_contacts", userContactSchema);
    return this.model;
}


UserContactModel.prototype.insertMany = function (arrayUserContact, callBack) {
    this.model.insertMany(arrayUserContact ,{},function (err,result) {
        if (err)
            return callBack(err)
        callBack(null,result);

    })
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

    this.model.find({user_id: userId}, {contact_user_id:1,is_favorites:1,is_primary:1}, function (err, data) {

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
    var isvalid = checkForHexRegExp.test(ID)
    if(!isvalid && typeof callBack === 'function')
    {
        callBack("Invalid _id.",null);
        return;
    }
    var objectId = require('mongodb').ObjectId;
    var o_id = new objectId(ID);
    this.model.remove({_id: o_id}, function (err, data) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });

}


module["exports"] = new UserContactModel();