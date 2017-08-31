var mongoose = require('mongoose');
var Settings = require("../lib/Settings");
var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");

var UserFavouriteModel = function () {

};

UserFavouriteModel.prototype.model = null;

UserFavouriteModel.prototype.init = function () {

    // Defining a schema
    var userFavouriteSchema = new mongoose.Schema({
        user_id: String,
        favourite_user_id: String,
        created: Number,
        modified: Number
    });

    this.model = mongoose.model(Settings.options.dbCollectionPrefix + "user_favourites", userFavouriteSchema);
    return this.model;
}


UserFavouriteModel.prototype.insertMany = function (arrayFavourite, callBack) {
    this.model.insertMany(arrayFavourite ,{},function (err,result) {
        if (err)
            return callBack(err)
        callBack(null,result);

    })
}


UserFavouriteModel.prototype.findContactsByUserId = function (userId, callBack) {

    var query = this.model.find({user_id: userId}).sort({'created': 'desc'});

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }


    });

}

UserFavouriteModel.prototype.findUserFavourite = function (userID, favID, callBack) {

    var query = this.model.find({
        $and: [
            {user_id: userID},
            {favourite_user_id: favID}
        ]
    });

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }


    });

}


UserFavouriteModel.prototype.getUserFavourites = function (userId, callBack) {

    this.model.find({user_id: userId}, function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            
            callBack(null, data)
        }
    });


}

UserFavouriteModel.prototype.getFavouriteStatus = function (userId, arrUser, callBack) {

    this.model.find(
            {$and: [
                {user_id: userId},
                {favourite_user_id: {"$in": arrUser}}
            ]}, function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);

            callBack(null, data)
        }
    });


}



UserFavouriteModel.prototype.addFavourite = function (newFavourite, callBack) {
    newFavourite.save(function (err, result) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, result);
        }

    });
}

UserFavouriteModel.prototype.update = function (favourite, newFavourite, callBack) {
    favourite.update(newFavourite,
        {},
        function (err, result) {
            if (typeof callBack === 'function') {
                if (err) return callBack(err, null);
                callBack(null, result);
            }

        });
}


UserFavouriteModel.prototype.remove = function (uID, fID, callBack) {

    this.model.remove({
        $and: [
            {user_id: uID},
            {favourite_user_id: fID}
        ]
    }, function (err, data) {
        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });

}

UserFavouriteModel.prototype.removeByID = function (ID, callBack) {
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


module["exports"] = new UserFavouriteModel();