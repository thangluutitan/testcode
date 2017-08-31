var _ = require('lodash');
var SocketHandlerBase = require("./SocketHandlerBase");

var TempHandler = function () {

}

_.extend(TempHandler.prototype, SocketHandlerBase.prototype);

TempHandler.prototype.attach = function (io, socket) {

    socket.on('temp', function () {


    });

}


module["exports"] = new TempHandler();