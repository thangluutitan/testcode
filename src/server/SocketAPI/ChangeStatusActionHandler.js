var _ = require('lodash');
var Observer = require("node-observer");
var DatabaseManager = require("../lib/DatabaseManager");
var Utils = require("../lib/Utils");
var Const = require("../const");
var SocketHandlerBase = require("./SocketHandlerBase");
var UserModel = require("../Models/UserModel");
var Settings = require("../lib/Settings");
var UserContactModel = require("../Models/UserContactModel");
var UsersManager = require("../lib/UsersManagerRedis");

var ChangeStatusActionHandler = function () {

}

_.extend(ChangeStatusActionHandler.prototype, SocketHandlerBase.prototype);

ChangeStatusActionHandler.prototype.attach = function (io, socket) {

    //var self = this;

    /**
     * @api {socket} "changestatus" User change status
     * @apiName changestatus
     * @apiGroup Socket
     * @apiDescription User change status
     * @apiParam {string} userID User ID
     * @apiParam {string} status new status
     *
     */


    socket.on('changeStatus', function (param) {
        var emitGroup = "friends";
        
        if (Utils.isEmpty(param.userID)) {
            socket.emit('socketerror', {code: Const.resCodeSocketLoginNoUserID});
            return;
        }

        if (Utils.isEmpty(param.status)) {
            socket.emit('socketerror', {code: Const.resCodeSocketChangeWithEmptyStatus});
            return;
        }


        //find and update new status
        UserModel.findUserbyId(param.userID, function (err, user) {

            if (_.isEmpty(user)) {
                socket.emit('socketerror', {code: Const.resCodeUserNotExist});
                return;

            }

            var newuser = new DatabaseManager.userModel({
                _id: user._id
            });

            newuser.online_status = param.status;
            newuser.modified = new Date();
            UserModel.updateUser(user, newuser, function (err, result) {
                if (err) {
                    socket.emit('socketerror', {code: Const.resCodeSocketUnknownError});
                    return;
                }

                UsersManager.getUsers(Const.GlobalRoomID,function(err,onlineUsers){
                    UserContactModel.findContactsByUserId(param.userID, function (err, contacts) {                    
                        _.forEach(contacts, function (contact) {
                                var  user =  _.find(onlineUsers, function(o) { return o.userID ==  contact.contact_user_id; });
                                if(user !== undefined)
                                {
                                    var sk = io.of(Settings.options.socketNameSpace).sockets[user.socketID];
                                    if(sk !== undefined)
                                        sk.join(emitGroup);                                                               
                                }
                                
                        });

                        io.of(Settings.options.socketNameSpace).in(emitGroup).emit('statusUpdated', param);
                        Observer.send(this, Const.notificationStatusChanges, param);
                    }); 
                });
                  

            });

        });

    });

}


module["exports"] = new ChangeStatusActionHandler();