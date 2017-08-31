var should = require('should');
var request = require('supertest');
var app = require('../../mainTest');
var expect = require('chai').expect;
var token1 = "kuRVVpHxbT2v3tJoQzLbJWHP";//LMWHmvFobSh5rVyxXCH8VZYD";
describe('WEB', function () {


    //list API
    describe('/group/list/:userID GET', function () {

        it('Get group list by user works.', function (done) {

            request(app)
                .get('/frogchat/v1/group/list/3')
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
        it('Get group list with invalid userID - works.', function (done) {

            request(app)
                .get('/frogchat/v1/group/list/10001s')
                .set('access-token', token1)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);
                    res.body.should.have.property('data');
                    expect(res.body.data.length).to.be.equal(0);
                    done();

                });

        });

        //wrong api
        it('Get group list with wrong api - works.', function (done) {

            request(app)
                .get('/frogchat/v1/group/lists/3')
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

    //unseenmessages API
    describe('/group/unseenmessages/:userId GET', function () {
        
        it('Get group unseenmessages by user works.', function (done) {

            request(app)
                .get('/frogchat/v1/group/unseenmessages/3')
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
        it('Get group unseenmessages with invalid userID - works.', function (done) {

            request(app)
                .get('/frogchat/v1/group/unseenmessages/10001s')
                .set('access-token', token1)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);
                    res.body.should.have.property('data');
                    expect(res.body.data.length).to.be.equal(undefined);
                    done();

                });

        });

        //wrong api
        it('Get group unseenmessages with wrong api - works.', function (done) {

            request(app)
                .get('/frogchat/v1/group/unseenmessages1/3')
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


    //statuslist API
    describe('/group/statuslist/:groupId GET', function () {
        
        it('Get group status - works.', function (done) {

            request(app)
                .get('/frogchat/v1/group/statuslist/58c215034a96bd233838ea34')
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
        it('Get group status with non exist groupID - works.', function (done) {

            request(app)
                .get('/frogchat/v1/group/statuslist/58c215034a96bd233838ea35')
                .set('access-token', token1)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);
                    res.body.should.have.property('data');
                    expect(res.body.data.length).to.be.equal(undefined);
                    done();

                });

        });

        //check invalid
        it('Get group status with Invalid groupID(over 24 char hex string) - works.', function (done) {

            request(app)
                .get('/frogchat/v1/group/statuslist/58c215034a96bd233838ea34123')
                .set('access-token', token1)
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });
        //wrong api
        it('Get group status with wrong api - works.', function (done) {

            request(app)
                .get('/frogchat/v1/group/status/58c215034a96bd233838ea34')
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

//Add Group
    describe('/group/add POST', function () {

        it('add group passes when all parameters is given.', function (done) {

            var body = {
                users: [3, 4],
                to_user: null,
                name: "TCS",
                description: "All TCS members",
                group_password: "",
                avatar_file_id: "",
                avatar_thumb_file_id: "",
                created: 1474714048,
                modified: 1474714048,
                is_group: true,
                category_id: 1
            };

            request(app)
                .post('/frogchat/v1/group/add')
                .set('access-token', token1)
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

        it('Should error when do not pass any userId.', function (done) {

            var body = {
                users: [],
                to_user: null,
                name: "TCS",
                description: "All TCS members",
                group_password: "",
                avatar_file_id: "",
                avatar_thumb_file_id: "",
                created: 1474714048,
                modified: 1474714048,
                is_group: true,
                category_id: 1
            };

            request(app)
                .post('/frogchat/v1/group/add')
                .set('access-token', token1)
                .send(body)
                .expect('Content-Type', /json/)
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });

        it('The to_user parameter is require for direct chat.', function (done) {

            var body = {
                users: [],
                to_user: null,
                name: "TCS",
                description: "All TCS members",
                group_password: "",
                avatar_file_id: "",
                avatar_thumb_file_id: "",
                created: 1474714048,
                modified: 1474714048,
                is_group: false,
                category_id: 1
            };

            request(app)
                .post('/frogchat/v1/group/add')
                .set('access-token', token1)
                .send(body)
                .expect('Content-Type', /json/)
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });

    });//add

    //Leave Group
    describe('/group/leave POST', function () {

        it('leave group sucess when all parameters is given.', function (done) {

            var body = {
                userid: "3",
                groupid: "58cf7e5b05e30d2d7438ae0a"

            };

            request(app)
                .post('/frogchat/v1/group/leave')
                .set('access-token', token1)
                .send(body)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }


                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);


                    done();

                });

        });

        it('Should error when do not pass any userid.', function (done) {

            var body = {
                userid: "",
                groupid: "58cf7e5b05e30d2d7438ae0a"

            };

            request(app)
                .post('/frogchat/v1/group/leave')
                .set('access-token', token1)
                .send(body)
                .expect('Content-Type', /json/)
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });

        it('Should error when do not pass any groupid.', function (done) {

            var body = {
                userid: "3",
                groupid: ""

            };

            request(app)
                .post('/frogchat/v1/group/leave')
                .set('access-token', token1)
                .send(body)
                .expect('Content-Type', /json/)
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });

    });//leave

    //Add user in Group
    describe('/group/adduser POST', function () {

        it('Add user in group success when all parameters is given.', function (done) {

            var body = {
                userId: "5",
                groupId: "58cf7e5b05e30d2d7438ae0a"

            };

            request(app)
                .post('/frogchat/v1/group/adduser')
                .set('access-token', token1)
                .send(body)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }


                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);


                    done();

                });

        });

        it('Should error when do not pass any userId.', function (done) {

            var body = {
                userId: "",
                groupId: "58cf7e5b05e30d2d7438ae0a"

            };

            request(app)
                .post('/frogchat/v1/group/adduser')
                .set('access-token', token1)
                .send(body)
                .expect('Content-Type', /json/)
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });

        it('Should error when do not pass any groupid.', function (done) {

            var body = {
                userid: "5",
                groupid: ""

            };

            request(app)
                .post('/frogchat/v1/group/adduser')
                .set('access-token', token1)
                .send(body)
                .expect('Content-Type', /json/)
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });

    });//adduser

    //Remove user in Group
    describe('/group/removeuser POST', function () {

        it('Remove user in group success when all parameters is given.', function (done) {

            var body = {
                userId: "5",
                groupId: "58cf7e5b05e30d2d7438ae0a"

            };

            request(app)
                .post('/frogchat/v1/group/removeuser')
                .set('access-token', token1)
                .send(body)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }


                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);


                    done();

                });

        });

        it('Should error when do not pass any userId.', function (done) {

            var body = {
                userId: "",
                groupId: "58cf7e5b05e30d2d7438ae0a"

            };

            request(app)
                .post('/frogchat/v1/group/removeuser')
                .set('access-token', token1)
                .send(body)
                .expect('Content-Type', /json/)
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });

        it('Should error when do not pass any groupid.', function (done) {

            var body = {
                userid: "5",
                groupid: ""

            };

            request(app)
                .post('/frogchat/v1/group/removeuser')
                .set('access-token', token1)
                .send(body)
                .expect('Content-Type', /json/)
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });

    });//removeuser

    //Search Group
    describe('/group/search GET', function () {

        it('Search group success when the parameter is given.', function (done) {
            
            request(app)
                .get('/frogchat/v1/group/search/new')
                .set('access-token', token1)                
                
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }


                    res.body.should.have.property('code');
                    res.body.code.should.equal(1);
                    res.body.should.have.property('data');
                    
                    //expect(res.body.data.length).to.be.gt(0);
                    done();

                });

        });

        it('No data return when the parameter value is given that does not exist.', function (done) {
                    
                    request(app)
                        .get('/frogchat/v1/group/search/invaliddata')
                        .set('access-token', token1)                
                        
                        .expect(200)
                        .end(function (err, res) {

                            if (err) {
                                throw err;
                            }


                            res.body.should.have.property('code');
                            res.body.code.should.equal(1);
                            res.body.should.have.property('data');
                            //process.stdout.write("length " + res.body.data.length); 
                            expect(res.body.data.length).to.be.equals(0);
                            done();

                        });

                });

        it('Should error when do not pass any group name to search.', function (done) {
            
             request(app)
                .get('/frogchat/v1/group/search')
                .set('access-token', token1)                
                
                .expect(404)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }
                    
                    done();

                });

        });

        it('Should error when call wrong API name.', function (done) {

            request(app)
                .get('/frogchat/v1/group/searchAPI')
                .set('access-token', token1)                
                
                .expect(404)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }
                    
                    done();

                });

        });

    });//search group

    //hideGroups
    describe('/group/hideGroups POST', function () {

        it('hide groups sucess when all parameters is given.', function (done) {

            var body = {
                
                groupIds:["58c0e9820670d33528198ec5","58c0e9820670d33528198ec6"],
                userId:"1"

            };

            request(app)
                .post('/frogchat/v1/group/hideGroups')
                .set('access-token', token1)
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
                    res.body.data.should.property('ok');
                    res.body.data.ok.should.equal(1);

                    done();

                });

        });

        it('Should error when do not pass any userid.', function (done) {

            var body = {
                groupIds:["58c0e9820670d33528198ec5","58c0e9820670d33528198ec6"],
                userId:""

            };

            request(app)
                .post('/frogchat/v1/group/hideGroups')
                .set('access-token', token1)
                .send(body)
                .expect('Content-Type', /json/)
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });

        it('Should error when do not pass any groupid.', function (done) {

            var body = {
                userid: "1",
                groupid: []

            };

            request(app)
                .post('/frogchat/v1/group/hideGroups')
                .set('access-token', token1)
                .send(body)
                .expect('Content-Type', /json/)
                .expect(500)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });

        it('Should error when call wrong API.', function (done) {

            var body = {
                groupIds:["58c0e9820670d33528198ec5","58c0e9820670d33528198ec6"],
                userId:"1"

            };

            request(app)
                .post('/frogchat/v1/group/hideGroup')
                .set('access-token', token1)
                .send(body)                
                .expect(404)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    done();

                });

        });


    });//hideGroups

});