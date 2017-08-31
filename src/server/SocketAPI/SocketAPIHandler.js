var Settings = require("../lib/Settings");
var jwt = require('jsonwebtoken');
var Utils = require("../lib/Utils");
var Const = require("../const");
var SocketAPIHandler = {

    io: null,
    nsp: null,
    init: function (io) {

        this.io = io;
        this.nsp = io.of(Settings.options.socketNameSpace);
        this.nsp.on('connection', function (socket) {

            if (Utils.isEmpty(socket.handshake.query.token)) {
                socket.emit('socketerror', {code: Const.resCodeTokenError});
                console.log("Token is required - Invalid socket connection");
                socket.disconnect('unauthorized');
                return;
            }

            try {
                jwt.verify(socket.handshake.query.token, Const.jwtSecret);
            } catch (err) {//expired
                console.log("Token expired - Login again to get new token");
                socket.emit('socketerror', {
                    code: Const.resCodeTokenError,
                    data: {message: "Token expired - Login again to get new token"}
                });
                socket.disconnect('unauthorized');
                return;
            }
            //Authenticated
            console.log("Token :" + socket.handshake.query.token);


            require('./DisconnectActionHandler').attach(io, socket);
            require('./LoginActionHandler').attach(io, socket);
            require('./JoinActionHandler').attach(io, socket);
            require('./SendMessageActionHandler').attach(io, socket);
            require('./SendTypingActionHandler').attach(io, socket);
            require('./OpenMessageActionHandler').attach(io, socket);
            require('./DeleteMessageActionHandler').attach(io, socket);
            require('./ChangeStatusActionHandler').attach(io, socket);
        });

    }

};

module["exports"] = SocketAPIHandler;