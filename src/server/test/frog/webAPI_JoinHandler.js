'use strict';
var should = require('should');
var request = require('supertest');
var app = require('../../mainTest');
var logintoken = null;
var Const = require("../../const");

describe('WEB', function () {

    before(function (done) {
        var body = {
            name: "test",
            avatarURL: "test",
            roomID: "test",
            userID: "test",
            token: logintoken
        };

        request(app)
            .post('/frogchat/v1/user/login')
            .send(body)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {

                if (err) {
                    throw err;
                }

                res.body.should.have.property('code');
                res.body.code.should.equal(1);
                res.body.should.have.property('data');
                res.body.data.should.have.property('user');
                res.body.data.user.should.have.property('token');

                logintoken = res.body.data.token;

                done();

            });

    });
    describe('/user/join POST', function () {

        it('Join passes when provide roomID and token', function (done) {

            var body = {
                roomID: "test",
                token: logintoken
            };

            request(app)
                .post('/frogchat/v1/user/join')
                .send(body)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }


                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);
                    res.body.should.have.property('data');
                    res.body.data.should.have.property('user');
                    res.body.data.user.should.have.property('token');

                    var token1 = res.body.data.token;
                    done();

                });

        });

        it('Join failes when roomID is not given.', function (done) {

            var body = {
                roomID: "",
                token: logintoken
            };

            request(app)
                .post('/frogchat/v1/user/join')
                .send(body)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(Const.resCodeJoinNoRoomID);

                    done();

                });

        });

        it('Join failes when token is not given.', function (done) {

            var body = {
                roomID: "test"
            };

            request(app)
                .post('/frogchat/v1/user/join')
                .send(body)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }
                    
                    res.body.code.should.equal(Const.resCodeJoinNoToken);
                    done();

                });

        });

    });

});