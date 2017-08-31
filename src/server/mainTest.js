// Load modules
var socket = require('socket.io');
var express = require('express');
var http = require('http');
var init = require('./init.js');

// initialization
var app = express();
var server = http.createServer(app);
var port = init.port;
var io = socket.listen(server);

// Start Spika as stand alone server
var spika = require('./index.js');


init.host = "localhost";
init.port = 8181;
init.urlPrefix = '/frogchat';
init.socketNameSpace = '/frogchat';
init.imageDownloadURL = "http://" + init.host + "/:" + init.port + init.urlPrefix + "/media/images/";
init.noavatarImg = "http://" + init.host + ":" + init.port + init.urlPrefix + "/img/noavatar.png";
init.chatDatabaseUrl = "mongodb://localhost/test";
init.dbCollectionPrefix = "frog_";
//init.uploadDir = '../../public/uploads/';
init.uploadDir = 'public/uploads/';
//Config.sendAttendanceMessage = false;
init.sendAttendanceMessage = true;

new spika(app, io, init);

app.init = init;


server.listen(port, function () {
    console.log('Server listening on port ' + init.port + '!');
});

module.exports = app;