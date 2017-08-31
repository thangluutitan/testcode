var mongoose = require('mongoose');
var Config = require('../Config');
var FileModel = function () {

};

FileModel.prototype.model = null;

FileModel.prototype.init = function (conn) {

    // Defining a schema
    var fileSchema = new mongoose.Schema({
        name: String,
        mimeType: String,
        size: Number,
        created: Number
    });

    this.model = conn.model(Config.CollectionPrefixV2 + "files", fileSchema);
    return this.model;
}

module["exports"] = new FileModel();