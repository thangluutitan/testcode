var express = require('express');
var router = express.Router();
var _ = require('lodash');
var RequestHandlerBase = require("./RequestHandlerBase");
var DatabaseManager = require("../lib/DatabaseManager");
var Utils = require("../lib/Utils");
var Const = require("../const");
var async = require('async');
var formidable = require('formidable');
var fs = require('fs-extra');
var Settings = require("../lib/Settings");

var FileUploadHandler = function () {
}

_.extend(FileUploadHandler.prototype, RequestHandlerBase.prototype);

FileUploadHandler.prototype.attach = function (router) {

    var self = this;

    /**
     * @api {post} /file/upload  Upload File
     * @apiName Upload File
     * @apiGroup WebAPI
     * @apiDescription Upload file and get file id by response

     * @apiParam {File} file urlencoded multy part field name
     * @apiParam {String} school_code is folder name
     *
     * @apiSuccess {String} Token
     * @apiSuccess {String} User Model of loginned user
     *
     * @apiSuccessExample Success-Response:
     {
         "code": 1,
         "data": {
             "file": {
                 "id": "55cdeba8a2d0956d24b421df",
                 "name": "Procijena.xlsx",
                 "size": 493966,
                 "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
             }
         }
     }
     */
    router.post('', function (request, response) {

        var form = new formidable.IncomingForm();
        
        async.waterfall([

            function (done) {

                fs
                    .exists(Settings.options.uploadDir, function (exists) {

                        if (exists) {
                            done(null, {});
                        } else {
                            console.log('Please check path of upload dir');
                            done("Upload dir doesnt exist", {});
                        }
                    });

            },
            function (result, done) {

                form
                    .parse(request, function (err, fields, files) {

                        if (!files.file) {

                            self.successResponse(response, Const.resCodeFileUploadNoFile);
                            return;

                        } else {
                            var uploadObj = {};
                            uploadObj.file = files.file;
                            uploadObj.school_code = fields.school_code;
                            done(err, uploadObj);
                            //done(err, files.file);

                        }

                    });

            },

            function (feedData, done) {

                //var tempPath = file.path;
                var fileName = feedData.file.name;

                // save to database
                var newFile = new DatabaseManager.fileModel({
                    name: fileName,
                    mimeType: feedData.file.type,
                    size: feedData.file.size,
                    folder_name:feedData.school_code,
                    created: Utils.now()
                });
				
				console.log("\n\newFile:"+JSON.stringify(newFile));

                newFile.save(function (err, fileModel) {

                    done(err, {
                        file: feedData.file,
                        school_code:feedData.school_code,
                        fileModel: fileModel
                    });

                });

            },

            function (result, done) {
                
                var destPath = Settings.options.uploadDir;
                var tempPath = result.file.path;
                //var fileName = result.file.name;
                if (!Utils.isEmpty(result.school_code)) {
                    destPath = destPath + result.school_code;
                }
                if (!fs.existsSync(destPath)){
                    fs.mkdirSync(destPath);
                }
                
                destPath = destPath + "/" + result.fileModel._id;
                var fileExt;
                if(result.file.name.indexOf(".") > -1)
                    fileExt = result.file.name.split('.').pop();

                if(fileExt !== undefined)
                    destPath = destPath + "." + fileExt;
				result.fileExt = fileExt;
                fs.copy(tempPath, destPath , function (err) {

                    if (err) {

                        done(err, null);

                    } else {

                        done(err, result);

                    }

                });

            },

            function (result, done) {

                var file = result.file;
                if (file.type.indexOf("jpeg") > -1 || file.type.indexOf("gif") > -1 || file.type.indexOf("png") > -1) {
                    var easyimg = require('easyimage');
                    var tempThumbFileName = result.fileModel.id + "_thumb.jpg"; // force to be jpg
                    var destPathTmp = Settings.options.uploadDir + tempThumbFileName;
					
                    easyimg
                        .thumbnail({src: file.path, dst: destPathTmp, width: 256, height: 256})
                        .then(function (image) {

                            // save to database
                            var thumbObj = new DatabaseManager.fileModel({
                                name: "thumb_" + result.file.name,
                                mimeType: "image/jpeg",
                                size: image.size,
								folder_name:result.school_code,
                                created: Utils.now()
                            });
							

                            thumbObj.save(function (err, thumbModel) {
								var thumbFileName = thumbModel._id;
								if (!Utils.isEmpty(result.fileExt))
									thumbFileName = thumbFileName + "." + result.fileExt;
								
								//var destPath = Settings.options.uploadDir + thumbFileName;
								
								var destPath;
								if (!Utils.isEmpty(result.school_code)) {
									destPath = Settings.options.uploadDir + result.school_code + "/" + thumbFileName;
								}
								else
								{
									destPath = Settings.options.uploadDir + thumbFileName;
								}

                                // rename
                                fs.rename(destPathTmp, destPath, function (err) {

                                    if (err) {
                                        done(err)
                                    }
                                    result.thumbModel = thumbModel;

                                    done(err, result);

                                });

                            });

                        }, function (err) {
                            // ignore thubmnail error
                            console.log(err);
                            done(null, result);
                        });

                } else {

                    done(null, result);

                }

            }
        ], function (err, result) {

            if (err) {

                self.errorResponse(response, Const.httpCodeSeverError);

            } else {

                var responseJson = {
                    file: {
                        id: result.fileModel.id,
                        name: result.file.name,
                        size: result.file.size,
                        mimeType: result.file.type
                    }
                };

                if (!_.isUndefined(result.thumbModel)) {
                    responseJson.thumb = {
                        id: result.thumbModel.id,
                        name: result.thumbModel.name,
                        size: result.thumbModel.size,
                        mimeType: result.thumbModel.mimeType
                    };
                }

                self.successResponse(response, Const.responsecodeSucceed, responseJson);
            }

        });

    });

}
new FileUploadHandler().attach(router);
module["exports"] = router;
