var express = require('express');
var router = express.Router();
var _ = require('lodash');
var RequestHandlerBase = require("./RequestHandlerBase");
var DatabaseManager = require("../lib/DatabaseManager");
var Utils = require("../lib/Utils");
var Const = require("../const");
var fs = require('fs-extra');
var Settings = require("../lib/Settings");
var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");

var FileDownloadHandler = function () {
}

_.extend(FileDownloadHandler.prototype, RequestHandlerBase.prototype);

FileDownloadHandler.prototype.attach = function (router) {

    var self = this;

    /**
     * @api {get} /file/download/:fileID Download file by fileId
     * @apiName Download File
     * @apiGroup WebAPI
     *
     * @apiParam {fileID} fileID File ID
     *
     * @apiSuccess {Binary} ResponseBody  Entity of file
     */
    router.get('/:fileID', function (request, response) {

        var fileID = request.params.fileID;
        var isvalid = checkForHexRegExp.test(fileID)
        if(!isvalid) //File migrate from V1
        {
            var filePath = Settings.options.uploadDir + fileID;
            var filename = "V1-Image"
            var mimetype = "image/jpeg";
            //Check for image from V1
            fs.exists(filePath, function (exists){
                if (exists) {
                    let stats = fs.statSync(filePath);
                    const fileSizeInBytes = stats.size;
                    response.setHeader('Content-disposition', 'filename=' + filename);
                    response.setHeader('Content-type', mimetype);
                    response.setHeader('Content-Length', fileSizeInBytes);
                    let filestream = fs.createReadStream(filePath);
                    filestream.pipe(response);
                }else{
                    let noImagePath = Settings.options.uploadDir + "noavatar.png";
                    const stats = fs.statSync(Settings.options.uploadDir + "noavatar.png");
                    const fileSizeInBytes = stats.size
                    response.setHeader('Content-disposition', 'filename=' + filename);
                    response.setHeader('Content-type', mimetype);
                    response.setHeader('Content-Length', fileSizeInBytes);
                    let filestream = fs.createReadStream(noImagePath);
                    filestream.pipe(response);
                    //
                }
            });
            return;

        }
        DatabaseManager
            .fileModel
            .findOne({
                _id: fileID
            }, function (err, file) {
                if (err) {
                    self.errorResponse(response, Const.httpCodeSucceed, Const.responsecodeParamError, Utils.localizeString("Download Failed"), false);
                } else {
                    let fileSizeInBytes ;
                    if (file == null){

                        filePath = Settings.options.uploadDir + "noavatar.png";
                        let stats = fs.statSync(filePath);
                        fileSizeInBytes = stats.size;
                        filename = "No Image"
                        mimetype = "image/jpeg";
                    }else{
                        filePath = Settings.options.uploadDir;
                        if(!Utils.isEmpty(file.folder_name))
                            filePath = filePath + file.folder_name + "/" + fileID;
                        else                        
                            filePath = filePath + fileID;
                        
                         var fileExt;
                        if(file.name.indexOf(".") > -1)
                            fileExt = file.name.split('.').pop();

                        if(fileExt !== undefined)
                            filePath = filePath + "." + fileExt;

                        filename = file.name
                        mimetype = file.mimeType;
                        fileSizeInBytes = file.size;
                    }

                    fs.exists(filePath, function (exists) {

                        if (!exists) {

                            self.errorResponse(response, Const.httpCodeFileNotFound, 0, Utils.localizeString("Download Failed"), false);

                        } else {

                            response.setHeader('Content-disposition', 'filename=' + filename);
                            response.setHeader('Content-type', mimetype);
                            response.setHeader('Content-Length', fileSizeInBytes);

                            var filestream = fs.createReadStream(filePath);
                            filestream.pipe(response);

                        }

                    });

                }

            });

    });

}

new FileDownloadHandler().attach(router);
module["exports"] = router;
