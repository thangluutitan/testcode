var mongoose = require('mongoose');
var Config = require('../Config');


var MessageStatusModel = function () {

};

MessageStatusModel.prototype.model = null;

MessageStatusModel.prototype.init = function (conn) {    
    // Defining a schema
    var messageSchema = new mongoose.Schema({
        
        user_id: {type: Number},        
        message_id: Number        
    }, {collection: 'message_status'});
    this.model = conn.model(Config.CollectionPrefixV1 + "message_status", messageSchema);
    return this.model;
}


MessageStatusModel.prototype.findbyMessageId = function (id, callBack) {

    this.model.find({message_id: id}, function (err, messages) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, messages);
        }


    });

}

MessageStatusModel.prototype.getInList = function (arrMessageId, callBack) {

    this.model.find({message_id: {"$in":arrMessageId}}, function (err, data) {

        if (typeof callBack === 'function') {
            if (err) return callBack(err, null);
            callBack(null, data)
        }
    });


}


module["exports"] = new MessageStatusModel();