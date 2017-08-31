var mongoose = require('mongoose');
var Settings = require("../lib/Settings");
var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");

var UserBlockModel = function () {

};

UserBlockModel.prototype.model = null;

UserBlockModel.prototype.init = function () {

    // Defining a schema
    var userSchema = new mongoose.Schema({
        user_id: {type: String, index: true},
        block_user_id: String,        
        created: Number
    });


    this.model = mongoose.model(Settings.options.dbCollectionPrefix + "user_blocks", userSchema);
    return this.model;

}



UserBlockModel.prototype.findbyUserId = function (userId, callBack) {

    this.model.find({user_id: new RegExp("^" + userId + "$", "g")}, function (err, userBlock) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, userBlock);
        }

    });

}

UserBlockModel.prototype.findbyUserIdAndBlockUserId = function (userId,blockUserId, callBack) {

    this.model.findOne({
            user_id: new RegExp("^" + userId + "$", "g"),
            block_user_id: new RegExp("^" + blockUserId + "$", "g")
        }, function (err, userBlock) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, userBlock);
        }

    });

}

UserBlockModel.prototype.findbyObjectId = function (id, callBack) {
    var isvalid = checkForHexRegExp.test(id)
    if(!isvalid && typeof callBack === 'function')
    {
        callBack(null,[]);
        return;
    }
    var objectId = require('mongodb').ObjectId;
    var o_id = new objectId(id);

    this.model.findOne({_id: o_id}, function (err, userBlocks) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, userBlocks);
        }

    });

}

UserBlockModel.prototype.save = function (newUserBlock, callBack) {

    newUserBlock.save(function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data);
        }

    });


}

UserBlockModel.prototype.remove = function (userId,blockUserId,callBack) {
    //this.model.find({user_id: userId,block_user_id:blockUserId}).remove().exec();
    this.model.find({user_id: userId,block_user_id:blockUserId}).remove(function (err, result){

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, result);
        }

    });

}


module["exports"] = new UserBlockModel();