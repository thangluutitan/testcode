var _ = require('lodash');
var Observer = require("node-observer");

var UsersManager = require("../lib/UsersManagerRedis");
var Utils = require("../lib/Utils");
var Const = require("../const");
var SocketHandlerBase = require("./SocketHandlerBase");
var UserModel = require("../Models/UserModel");
var Settings = require("../lib/Settings");

var JoinActionHandler = function () {

}

_.extend(JoinActionHandler.prototype, SocketHandlerBase.prototype);

JoinActionHandler.prototype.attach = function (io, socket) {

    //var self = this;

    /**
     * @api {socket} "join" join to the room
     * @apiName Joint to room
     * @apiGroup Socket
     * @apiDescription Joint to room
     * @apiParam {string} roomID Room ID
     *
     */
    socket.on('join', function (param) {

        if (Utils.isEmpty(param.userID)) {
            socket.emit('socketerror', {code: Const.resCodeSocketLoginNoUserID});
            return;
        }

        if (Utils.isEmpty(param.roomID)) {
            socket.emit('socketerror', {code: Const.resCodeSocketLoginNoRoomID});
            return;
        }

        socket.join(param.roomID);
        io.of(Settings.options.socketNameSpace).in(param.roomID).emit('newUser', param);
        Observer.send(this, Const.notificationNewUser, param);
        UserModel.findUserbyId(param.userID, function (err, user) {

            if (_.isEmpty(user)) {

                return;
            }
            UsersManager.addUser(param.userID, user.name, user.avatarURL, param.roomID, user.token);
            UsersManager.pairSocketIDandUserID(param.userID, socket.id,param.roomID);
        });


    });

}


module["exports"] = new JoinActionHandler();