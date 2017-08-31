var should = require('should');
var request = require('supertest');
var app = require('../../mainTest');
var expect = require('chai').expect;
var Utils = require("../../lib/Utils");
var _ = require('lodash');
var token1 = "LMWHmvFobSh5rVyxXCH8VZYD";

describe('WEB', function () {

    //all API
    describe('/user/all GET', function () {

        it('Get user list works.', function (done) {

            request(app)
                .get('/frogchat/v1/user/all')
                .set('access-token', token1)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);
                    res.body.should.have.property('data');

                    done();

                });

        });

        //check user list is empty
        it('assume have no data to return.', function (done) {

            request(app)
                .get('/frogchat/v1/user/all')
                .set('access-token', token1)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);
                    res.body.should.have.property('data');
                    expect(_.size(res.body.data)).to.be.equal(0);
                    done();

                });

        });
        //wrong api    
        it('Fails when wrong api name.', function (done) {

            request(app)
                .get('/frogchat/v1/user/alls')
                .set('access-token', token1)
                .expect(404)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });


    });

    //search API
    describe('/user/search GET', function () {

        it('The search api works and have data return.', function (done) {

            request(app)
                .get('/frogchat/v1/user/search/8/thinh.tran')
                .set('access-token', token1)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);
                    res.body.should.have.property('data');
                    expect(Utils.isEmpty(res.body.data)).to.be.equal(false);
                    done();

                });

        });

        it('The search api works and have no data return.', function (done) {

            request(app)
                .get('/frogchat/v1/user/search/1/Thanh')
                .set('access-token', token1)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);
                    res.body.should.have.property('data');
                    expect(_.size(res.body.data)).to.be.equal(0);
                    done();

                });

        });

        it('Should be error when pass wrong api.', function (done) {

            request(app)
                .get('/frogchat/v1/user/searches/1/Thanh')
                .set('access-token', token1)
                .expect(404)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });

    });//

    //profile API
    describe('/user/profile GET', function () {

        it('The profile api (first user parameter) works and have data return.', function (done) {

            request(app)
                .get('/frogchat/v1/user/profile/1/2/true')
                .set('access-token', token1)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);
                    res.body.should.have.property('data');
                    expect(Utils.isEmpty(res.body.data)).to.be.equal(false);
                    done();

                });

        });

        it('The profile api (first user parameter) works and have no data return.', function (done) {

            request(app)
                .get('/frogchat/v1/user/profile/100/101/true')
                .set('access-token', token1)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);
                    res.body.should.have.property('data');
                    expect(Utils.isEmpty(res.body.data)).to.be.equal(true);
                    done();

                });

        });

        it('The profile api (second user parameter) works and have data return.', function (done) {

            request(app)
                .get('/frogchat/v1/user/profile/1/2/false')
                .set('access-token', token1)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);
                    res.body.should.have.property('data');
                    expect(Utils.isEmpty(res.body.data)).to.be.equal(false);
                    done();

                });

        });

        it('The profile api (second user parameter) works and have no data return.', function (done) {

            request(app)
                .get('/frogchat/v1/user/profile/100/101/false')
                .set('access-token', token1)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);
                    res.body.should.have.property('data');
                    expect(Utils.isEmpty(res.body.data)).to.be.equal(true);
                    done();

                });

        });

        it('Should be error when pass wrong api.', function (done) {

            request(app)
                .get('/frogchat/v1/user/profiles/1/2/true')
                .set('access-token', token1)
                .expect(404)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });
    });//


    //Update user profile API
    describe('/user/updateprofile POST', function () {

        it('The update profile api works.', function (done) {
            var body = {
                userid: "3",
                avatar_file_id: "ABC",
                avatar_thumb_file_id: "ABC",
                online_status: "online"

            };
            request(app)
                .post('/frogchat/v1/user/updateprofile')
                .send(body)
                .expect('Content-Type', /json/)
                .set('access-token', token1)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);
                    res.body.should.have.property('data');
                    expect(res.body.data.ok).to.be.equal(1);
                    done();

                });

        });

        it('Occur <Invalid User Id.> when pass invalid user Id .', function (done) {
            var body = {
                userid: "113abc",
                avatar_file_id: "",
                avatar_thumb_file_id: " ",
                online_status: "online"

            };
            request(app)
                .post('/frogchat/v1/user/updateprofile')
                .send(body)
                .expect('Content-Type', /json/)
                .set('access-token', token1)
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(2001);
                    res.body.should.have.property('message');
                    expect(res.body.message).to.be.equal("Invalid User Id.");
                    done();

                });

        });

        it('Occur internal error when pass the empty user Id .', function (done) {
            var body = {
                userid: "",
                avatar_file_id: "",
                avatar_thumb_file_id: " ",
                online_status: "online"

            };
            request(app)
                .post('/frogchat/v1/user/updateprofile')
                .send(body)
                .expect('Content-Type', /json/)
                .set('access-token', token1)
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });


        it('Should be error when pass wrong api.', function (done) {

            var body = {
                userid: "3",
                avatar_file_id: "",
                avatar_thumb_file_id: " ",
                online_status: "online"

            };
            request(app)
                .post('/frogchat/v1/user/updateprofile123')
                .send(body)                
                .set('access-token', token1)
                .expect(404)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });
    });//
});