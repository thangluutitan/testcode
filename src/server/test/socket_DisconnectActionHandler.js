var should = require('should');
var assert = require('assert');
var mongoose = require('mongoose');
var app = require('../mainTest');
var io = require('socket.io-client');

describe('SOCKET', function () {

    var socketURL = "http://localhost:8181/frogchat";
    var connectOptions = {
        transports: ['websocket'],
        'force new connection': true
    };

    describe('disconnect', function () {

        it('Disconnect works', function (done) {

            var responseCount = 0;

            var params1 = {
                name: "test",
                avatarURL: "test",
                roomID: "test",
                userID: "test"
            };

            var params2 = {
                name: "test",
                avatarURL: "test",
                roomID: "test",
                userID: "test2"
            };

            var client1 = io.connect(socketURL, connectOptions);
            var client2 = null;

            client1.on('connect', function (data) {

                client1.emit('login', params1);

            });

            client1.on('newUser', function (param) {

                if (client2 == null) {

                    client2 = io.connect(socketURL, connectOptions);

                    client2.on('connect', function (data) {

                        client2.emit('login', params2);

                    });

                    client2.on('newUser', function (param) {

                        client1.disconnect();

                    });

                    client2.on('userLeft', function (param) {

                        param.should.have.property('userID');
                        client2.disconnect();

                        done();


                    });

                }

            });

        });

        it('Disconnect works when exit app.', function (done) {

            
            var responseCount = 0;

            var param1 = {
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
            
            var params5 = {
                name: "thanh.doan",
                avatarURL: "",
                roomID: "58c215034a96bd233838ea34",
                userID: "4",
            };

            var client1 = io.connect(socketURL, connectOptions);
            var client2 = io.connect(socketURL, connectOptions);
            var client3 = io.connect(socketURL, connectOptions);
            var client4 = io.connect(socketURL, connectOptions);
            var client5 = io.connect(socketURL, connectOptions);

            client1.on('connect', function (data) {

                client1.emit('login', param1);

            });

            client2.on('connect', function (data) {


                client2.emit('login', params2);

            });

            client3.on('connect', function (data) {


                client3.emit('login', params3);

            });
            
            client4.on('connect', function (data) {

                client4.emit('login', params4);
            });

            client5.on('connect', function (data) {
                //login room chat
                client5.emit('login', params5);
            });

            client1.on('newUser', function (data) {

                process.stdout.write('client1 reveive newUser event \n');

            });
            
            client1.on('newMessage', function (data) {

                process.stdout.write('client1 reveive newMessage event \n');                               

            });

            client2.on('newUser', function (data) {

                process.stdout.write('client2 reveive newUser event \n');

            });
            
            client2.on('newMessage', function (data) {

                process.stdout.write('client2 reveive newMessage event \n');                               

            });

            client3.on('newUser', function (data) {

                process.stdout.write('client3 reveive newUser event \n');

            });
            
            client3.on('newMessage', function (data) {

                process.stdout.write('client3 reveive newMessage event \n');                               

            });

            client4.on('newUser', function (data) {

                process.stdout.write('client4 reveive newUser event \n');

            });
            
            client4.on('newMessage', function (data) {

                process.stdout.write('client4 reveive newMessage event \n');                               

            });



            client5.on('newUser', function (data) {

                process.stdout.write('client5 reveive newUser event \n');

            });
            
            client5.on('newMessage', function (data) {

                process.stdout.write('client5 reveive newMessage event \n');  
                client1.disconnect();

            });

            var count=0;
             client1.on('statusUpdated', function (data) {
                count++;
                process.stdout.write('statusUpdated : client1 \n');
                
            });

             client2.on('statusUpdated', function (data) {                
                 count++;
                process.stdout.write('statusUpdated : client2 \n');

            });

            client3.on('statusUpdated', function (data) {                
                count++;
                process.stdout.write('statusUpdated : client3 \n');
                
            });

            client4.on('statusUpdated', function (data) {                
                count++;
                data.should.have.property('userID');
                data.userID.should.equal("4");
                data.should.have.property('status');
                process.stdout.write('statusUpdated : client4 \n');
              
                if(count === 2)
                {
                    done();                    
                }

                

            });

             setTimeout(function () {
                    done();
                    
                 client2.disconnect();
                 client3.disconnect();
                 client4.disconnect();
                 client5.disconnect();
                
                }, 5000)

        });


    });

});