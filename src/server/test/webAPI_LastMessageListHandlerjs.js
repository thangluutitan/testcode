var should = require('should');
var request = require('supertest');
var app = require('../mainTest');
var token1 = "";

describe('WEB', function () {

    beforeEach(function () {

    });

    describe('/message/list/latest GET', function () {

        it('Get message list works', function (done) {

            request(app)
                .get('/frogchat/v1/message/latest/test/0')
                .expect(200)
                .set('access-token', token1)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(1000006);

                    done();

                });

        });


    });

});