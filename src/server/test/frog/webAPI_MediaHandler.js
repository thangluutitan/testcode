var should = require('should');
var request = require('supertest');
var app = require('../../mainTest');

describe('WEB', function () {

    describe('/media/list/:userID GET', function () {

        it('Get media list works when provide full args - roomID, limit and page', function (done) {

            request(app)
                .get('/frogchat/v1/media/list/58c0e9820670d33528198ec5/5/1')
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

        it('Get media list works when only provide roomID', function (done) {

            request(app)
                .get('/frogchat/v1/media/list/58c0e9820670d33528198ec5')
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


        it('Get media list failt when no provide rooID', function (done) {

            request(app)
                .get('/frogchat/v1/media/list')
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(2001);//Param error

                    done();

                });

        });


    });

});