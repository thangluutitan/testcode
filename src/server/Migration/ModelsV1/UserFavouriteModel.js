var mongoose = require('mongoose');
var Config = require('../Config');
var UserFavouriteModel = function () {

};

UserFavouriteModel.prototype.model = null;

UserFavouriteModel.prototype.init = function (conn) {
    //var connV1 = mongoose.createConnection(Config.DatabaseUrlV1);
    // Defining a schema
    var favouriteSchema = new mongoose.Schema({
        user_id:  Number,
        favourite_user_id: Number,
        created: {type: Number}
    },{collection: 'favourites'});

    this.model = conn.model(Config.CollectionPrefixV1 + "favourites", favouriteSchema);
    return this.model;

}
UserFavouriteModel.prototype.getLast = function (callBack) {
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

UserFavouriteModel.prototype.findFavourite = function (userId, userFavID, callBack) {

    var uID = parseInt(userId);
    var favID = parseInt(userFavID);
    var query = this.model.find({user_id: uID, favourite_user_id: favID});

    query.exec(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }
    });
}

UserFavouriteModel.prototype.find = function (lastID, limit, callBack) {

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

module["exports"] = new UserFavouriteModel();