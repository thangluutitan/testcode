var should = require('should');
var request = require('supertest');
var app = require('../../mainTest');

describe('WEB', function () {

    describe('/contact/list/:userID GET', function () {

        it('Get contact list works.', function (done) {

            request(app)
                .get('/frogchat/v1/contact/list/2')
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

        it('Get favourite list works.', function (done) {

            request(app)
                .get('/frogchat/v1/contact/favourites/1')
                .expect(200)
                //.set('access-token', "token1")
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


        it('Fails when user id is not provided.', function (done) {

            request(app)
                .get('/frogchat/v1/contact/list/')
                .expect(404)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });

        it('Remove Contact of User', function (done) {

            var body = {
                "user_id": 2,
                "contact_user_id": 45
            }

            request(app)
                .post('/frogchat/v1/contact/remove')
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

                    done();

                });

        });

        it('Remove Contact by ID', function (done) {

            var body = {
                "id": "58d09e65a3301236e88f6a18"
            }

            request(app)
                .post('/frogchat/v1/contact/removeByID')
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

                    done();

                });

        });

        it('Update Contact', function (done) {

            var body = {
                "id": "58d0adc7048a6e2fd866d9c0",
                "is_favorites": true
            }

            request(app)
                .post('/frogchat/v1/contact/update')
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

                    done();

                });

        });

        it('Add Contact to User', function (done) {

            var body = {
                "user_id": 2,
                "contact_user_id": 45
            }

            request(app)
                .post('/frogchat/v1/contact/add')
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

                    done();

                });

        });

        it('Add Existing Contact to User', function (done) {

            var body = {
                "user_id": 2,
                "contact_user_id": 40
            }

            request(app)
                .post('/frogchat/v1/contact/add')
                .send(body)
                .expect('Content-Type', /json/)
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }


                    res.body.should.have.property('code');
                    res.body.code.should.equal(2001);
                    //res.body.should.have.property('data');

                    done();

                });

        });


    });

});