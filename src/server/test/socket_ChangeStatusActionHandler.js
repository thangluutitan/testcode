var should = require('should');
var assert = require('assert');
var mongoose = require('mongoose');
var app = require('../mainTest');
var io = require('socket.io-client');
var expect = require('chai').expect;
var Const = require("../const");

describe('SOCKET', function () {

    var socketURL = "http://localhost:8181/frogchat";
    var connectOptions = {
        transports: ['websocket'],
        'force new connection': true
    };

    describe('login', function () {
        
        it('Change status passes with all parameters provided.', function (done) {

            var responseCount = 0;

            var params = {
                name: "thanh.doan",
                avatarURL: "",
                roomID: "58c5f85defbb8602bc199a33",
                userID: "4",
            };

            var client1 = io.connect(socketURL, connectOptions);

            client1.on('connect', function (data) {

                client1.emit('login', params);

            });

            client1.on('newUser', function (data) {

                responseCount++;
                if (responseCount === 2)
                    done();

            });

            client1.on('newMessage', function (data) {

                responseCount++;

                var param = {
                    userID: "4",
                    status: "Busy"
                };

                client1.emit('changeStatus', param);

            });


            client1.on('statusUpdated', function (data) {

                data.should.have.property('userID');
                data.userID.should.equal("4");
                data.should.have.property('status');

                done();
                client1.disconnect();
            });

        });


        it('Change status failed if userID is not provided or is empty', function (done) {

            var responseCount = 0;

            var params = {
                name: "thanh.doan",
                avatarURL: "",
                roomID: "58c5f85defbb8602bc199a33",
                userID: "4",
            };

            var client1 = io.connect(socketURL, connectOptions);

            client1.on('connect', function (data) {

                client1.emit('login', params);

            });

            client1.on('newUser', function (data) {

                responseCount++;

                if (responseCount === 2)
                    done();

            });


            client1.on('newMessage', function (data) {
                responseCount++;

                var param = {
                    userID: "",
                    status: "Busy"
                };

                client1.emit('changeStatus', param);
            });

            client1.on('socketerror', function (data) {

                data.code.should.equal(Const.resCodeSocketLoginNoUserID);
                expect(responseCount).to.be.equal(2);
                done();
                client1.disconnect();

            });
        });


        it('Change stattus failed if status is not provided or is empty', function (done) {

            var responseCount = 0;

            var params = {
                name: "thanh.doan",
                avatarURL: "",
                roomID: "58c5f85defbb8602bc199a33",
                userID: "4",
            };

            var client1 = io.connect(socketURL, connectOptions);

            client1.on('connect', function (data) {

                client1.emit('login', params);

            });

            client1.on('newUser', function (data) {

                responseCount++;

                if (responseCount === 2)
                    done();

            });


            client1.on('newMessage', function (data) {
                responseCount++;

                var param = {
                    userID: "4",
                    status: ""
                };

                client1.emit('changeStatus', param);
            });

            client1.on('socketerror', function (data) {

                data.code.should.equal(Const.resCodeSocketChangeWithEmptyStatus);
                expect(responseCount).to.be.equal(2);
                done();
                client1.disconnect();

            });

        });//it

        it('Change status fail if userID is provided that does not exist.', function (done) {

            var responseCount = 0;

            var params = {
                name: "thanh.doan",
                avatarURL: "",
                roomID: "58c5f85defbb8602bc199a33",
                userID: "4",
            };

            var client1 = io.connect(socketURL, connectOptions);

            client1.on('connect', function (data) {

                client1.emit('login', params);

            });

            client1.on('newUser', function (data) {

                responseCount++;

                if (responseCount === 2)
                    done();

            });

            client1.on('newMessage', function (data) {

                responseCount++;

                var param = {
                    userID: "4abc",
                    status: "Busy"
                };

                client1.emit('changeStatus', param);

            });


            client1.on('socketerror', function (data) {

                data.code.should.equal(Const.resCodeUserNotExist);
                expect(responseCount).to.be.equal(2);
                done();
                client1.disconnect();

            });

            client1.on('statusUpdated', function (data) {

                expect("As you see").to.be.equal("Do not receive this");

                done();
                client1.disconnect();
            });
        }) 

        ///Change status passes with 4 client sockets-just response to users is online and in contact list
        it('Change status passes with 4 client sockets.', function (done) {

            
            var responseCount = 0;

            var params = {
                name: "thanh.doan",
                avatarURL: "",
                roomID: "frogchat",
                userID: "4",
            };

            var params2 = {
                name: "tai.nguyen",
                avatarURL: "",
                roomID: "frogchat",
                userID: "9",
            };
            
            var params3 = {
                name: "khoa.vu",
                avatarURL: "",
                roomID: "frogchat",
                userID: "3",
            };

            var params4 = {
                name: "Edwin",
                avatarURL: "",
                roomID: "frogchat",
                userID: "7",
            };
            var client1 = io.connect(socketURL, connectOptions);
            var client2 = io.connect(socketURL, connectOptions);
            var client3 = io.connect(socketURL, connectOptions);
            var client4 = io.connect(socketURL, connectOptions);

            client1.on('connect', function (data) {

                client1.emit('login', params);

            });

            client1.on('connect', function (data) {


                client2.emit('login', params2);

            });
            client1.on('connect', function (data) {


                client3.emit('login', params3);

            });
            client1.on('connect', function (data) {

                client4.emit('login', params4);
            });
            client1.on('newUser', function (data) {

                responseCount++;
                process.stdout.write('newUser '+responseCount);
                if (responseCount === 5)
                    done();

            });
            var countmessage=0;
            client1.on('newMessage', function (data) {

                countmessage++;

                var param = {
                    userID: "4",
                    status: "Busy"
                };
                process.stdout.write('newMessage : '+countmessage);
                if(countmessage === 4)                
                {
                    client1.emit('changeStatus', param);
                    process.stdout.write('emit changeStatus  ');
                }
                

            });

            var count=0;
             client1.on('statusUpdated', function (data) {
                count++;
                process.stdout.write('statusUpdated : client1 ');
                                
                
            });
             client2.on('statusUpdated', function (data) {
                count++;
                process.stdout.write('statusUpdated : client2 ');
                             
                
            });

            client3.on('statusUpdated', function (data) {
                count++;
                process.stdout.write('statusUpdated : client3 ');
                                
                
            });

            client4.on('statusUpdated', function (data) {
                count++;
                process.stdout.write('statusUpdated : client4 ');

                if(count === 2)
                {
                    done();
                    client1.disconnect();
                }

                

            });

             setTimeout(function () {
                    done();
                 client1.disconnect();
                 client2.disconnect();
                 client3.disconnect();
                 client4.disconnect();
                }, 9000)

        });


    });//describe login

});//describe socket