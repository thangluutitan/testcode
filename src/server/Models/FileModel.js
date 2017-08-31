var mongoose = require('mongoose');
var Settings = require("../lib/Settings");

var FileModel = function () {

};

FileModel.prototype.model = null;

FileModel.prototype.init = function () {

    // Defining a schema
    var fileSchema = new mongoose.Schema({
        name: String,
        mimeType: String,
        size: Number,
        folder_name:String,
        created: Number
    });

    this.model = mongoose.model(Settings.options.dbCollectionPrefix + "files", fileSchema);
    return this.model;
}

module["exports"] = new FileModel();