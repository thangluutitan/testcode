var should = require('should');
var assert = require('assert');
var mongoose = require('mongoose');
var app = require('../mainTest');
var io = require('socket.io-client');

describe('SOCKET', function () {
    var socketURL = "http://localhost:8081/frogchat";
    var connectOptions = {
        transports: ['websocket'],
        'force new connection': true
    };

    describe('sendMessage', function () {

        it('Send message works.', function (done) {

            var counter = 0;

            var loginParams = {
                name: "khoa.vu",
                avatarURL: "test",
                roomID: "58f073218b4cea66a2bffba4",
                userID: "1",
            };

            var sendMessageParams = {
                roomID: "58f073218b4cea66a2bffba4",
                userID: "1",
                type: 1,
                message: "test"
            };

            var messageID = '';

            var client1 = io.connect(socketURL, connectOptions);

            client1.on('connect', function (data) {

                client1.emit('login', loginParams);

            });

            client1.on('newUser', function (param) {

                client1.emit('sendMessage', sendMessageParams);

            });

            client1.on('newMessage', function (param) {

                counter++;

                if (counter == 2) {
                    param.should.have.property('_id');
                    client1.disconnect();
                    done();
                }

            });

        });


    });

});