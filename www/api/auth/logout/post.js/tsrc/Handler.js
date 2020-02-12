'use strict';

describe('www.api.auth.logout.Post', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_auth_logout_post_') + name };

    let api, masterDbProps, dbProps;
    let Router, Response, Post;

    before(()=>{
        api = {};
        api.fs = require('fs');
        api.lib = {};
        api.lib.env = re('lib/env');
        api.lib.re = re('lib/re')(api);
        api.lib.db = {};
        api.lib.db.tools = re('lib/db/tools');
        api.lib.db.DbPool = re('lib/db/DbPool')(api);
        api.lib.Md5 = re('lib/Md5')(api);
        api.lib.routerHelper = re('lib/routerHelper')(api);
        api.model = {};
        api.model.types = re('model/types')(api);
        api.model.makeId = re('model/makeId')(api);
        api.model.helpers = {};
        api.model.helpers.add = re('model/helpers/add');
        api.model.helpers.delete = re('model/helpers/delete');
        api.model.helpers.count = re('model/helpers/count');
        api.model.helpers.query = re('model/helpers/query');
        api.model.User = re('model/User')(api);
        api.model.Users = re('model/Users')(api);
        api.model.Deployment = re('model/Deployment')(api);
        api.model.Deployments = re('model/Deployments')(api);
        api.model.Login = re('model/Login')(api);
        api.model.Logins = re('model/Logins')(api);
        api.model.Group = re('model/Group')(api);
        api.model.Groups = re('model/Groups')(api);
        api.model.factory = re('model/factory')(api);

        masterDbProps = api.lib.db.tools.masterDbProps;
        dbProps = JSON.parse(JSON.stringify(masterDbProps));

        Router = re('lib/testTools/express/Router')(api);
        Response = re('lib/testTools/express/Response')(api);
        Post = re('lib/testTools/express/Post')(api);
    });

    let model, router, dids = {}, loginMethod, logoutMethod;
    describe('Setup', ()=>{

        const dbName = createDbName('1');
        it('Create db ' + dbName, (done)=>{
            dbProps.database = dbName;
            api.lib.db.tools.create(
                masterDbProps,
                dbProps.database,
                (err)=>{
                    assert(!err, err);
                    done();
                }
            );
        });

        it('Create model', (done)=>{
            api.model.factory.createModel(dbProps, (err, m)=>{
                assert(!err, err);
                assert(m);
                model = m;
                done();
            });
        });

        it('Create router', ()=>{
            router = new Router();

            Post = Post.bind(undefined, (req)=>{
                req.app = {
                    zzz: {
                        model:model
                    }
                };
            });
        });

        it('Create login method', ()=>{
            const ROUTE = '/api/auth/login';
            const METHOD = 'POST';
            const method = api.lib.routerHelper.createHandler(router, 'www/api/auth/login/post.js');
            assert.equal(method.route, ROUTE);
            assert.equal(method.method, METHOD);
            loginMethod = method;
        });

        it('Create logout method', ()=>{
            const ROUTE = '/api/auth/logout';
            const METHOD = 'POST';
            const method = api.lib.routerHelper.createHandler(router, 'www/api/auth/logout/post.js');
            assert.equal(method.route, ROUTE);
            assert.equal(method.method, METHOD);
            logoutMethod = method;
        });

        it('Add 2 deployments: did1, did2', (done)=>{
            const add = (index, count, cb)=>{
                if (index<count) {
                    model.deployments.add(
                        {
                            did: api.model.Deployment.makeId(),
                        },
                        (err, d)=>{
                            assert(!err, err);
                            dids['did'+(index+1)] = d;
                            add(index+1, count, cb);
                        }
                    );
                } else {
                    cb();
                }
            }

            add(0, 2, done);
        });
    });

    describe('Main cases', (done)=>{
        it('Logout, DID - not exists, UID - not exists', (done)=>{
            const req = new Post({
                did: api.model.Deployment.makeId(),
                uid: api.model.User.makeId()
            });

            const res = new Response();
            res.wait(()=>{
                assert.equal(200, res.result.code);
                done();
            });

            router.handle(logoutMethod.route, req, res, router.next);        
        });

        it('Logout, DID - exists, UID - not exists', (done)=>{
            const req = new Post({
                did: dids.did1.did,
                uid: api.model.User.makeId()
            });

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res.result);
                assert.equal(200, res.result.code);
                assert(!res.result.value);
                done();
            });

            router.handle(logoutMethod.route, req, res, router.next);        
        });

        let userPablo;
        it('Add Pablo', (done)=>{
            model.users.add(
                {
                    uid:                  api.model.User.makeId(),
                    cat:                  api.model.User.makeCat(),
                    displayName:          'Pablo',
                    thumbnail:            'Pablo.png',
                    authProviderName:     'google',
                    authProviderId:       'Pablo',
                    authProviderRawString:'{google raw profile is here}'
                },
                (err, user)=>{
//                  console.log('user:', user);
                    assert(!err, err);
                    userPablo = user;
                    assert(userPablo);
                    done();
                }
            );
        });

        it('did1: Logout Pablo, user hasn\'t logged in yet', (done)=>{
            const user = userPablo;
            const deployment = dids.did1;
            const req = new Post({
                did: deployment.did,
                uid: user.uid
            });

            const res = new Response();
            res.wait(()=>{
                assert.equal(200, res.result.code);
                assert(!res.result.value);

                model.logins.isIn(deployment.did, user.uid, (err, result)=>{
                    assert(!err, err);
                    assert(result);
                    assert.equal(false, result.loggedin);
                    done();
                });
            });

            router.handle(logoutMethod.route, req, res, router.next);        
        });

        it('Count logins', (done)=>{
            model.logins.count((err, count)=>{
                assert(!err);
                assert.equal(0, count);
                done();
            });
        });

        it('did1: Login Pablo', (done)=>{
            const user = userPablo;
            const deployment = dids.did1;
            const req = new Post({
                did: deployment.did,
                cat: user.cat
            });

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res.result);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                assert(res.result.value.user);

                model.logins.isIn(deployment.did, user.uid, (err, result)=>{
                    assert(!err, err);
                    assert(result);
                    assert.equal(true, result.loggedin);
                    done();
                });
            });

            router.handle(loginMethod.route, req, res, router.next);        
        });

        it('Count logins', (done)=>{
            model.logins.count((err, count)=>{
                assert(!err);
                assert.equal(1, count);
                done();
            });
        });

        it('did2: Login Pablo', (done)=>{
            const user = userPablo;
            const deployment = dids.did2;
            const req = new Post({
                did: deployment.did,
                cat: user.cat
            });

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res.result);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                assert(res.result.value.user);

                model.logins.isIn(deployment.did, user.uid, (err, result)=>{
                    assert(!err, err);
                    assert(result);
                    assert.equal(true, result.loggedin);
                    done();
                });
            });

            router.handle(loginMethod.route, req, res, router.next);        
        });

        it('Count logins', (done)=>{
            model.logins.count((err, count)=>{
                assert(!err);
                assert.equal(2, count);
                done();
            });
        });

        it('did1: Logout Pablo', (done)=>{
            const user = userPablo;
            const deployment = dids.did1;
            const req = new Post({
                did: deployment.did,
                uid: user.uid
            });

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res.result);
                assert.equal(200, res.result.code);
                assert(!res.result.value);

                model.logins.isIn(deployment.did, user.uid, (err, result)=>{
                    assert(!err, err);
                    assert(result);
                    assert.equal(false, result.loggedin);
                    done();
                });
            });

            router.handle(logoutMethod.route, req, res, router.next);        
        });

        it('Count logins', (done)=>{
            model.logins.count((err, count)=>{
                assert(!err);
                assert.equal(1, count);
                done();
            });
        });

        it('did2: Logout Pablo', (done)=>{
            const user = userPablo;
            const deployment = dids.did2;
            const req = new Post({
                did: deployment.did,
                uid: user.uid
            });

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res.result);
                assert.equal(200, res.result.code);
                assert(!res.result.value);

                model.logins.isIn(deployment.did, user.uid, (err, result)=>{
                    assert(!err, err);
                    assert(result);
                    assert.equal(false, result.loggedin);
                    done();
                });
            });

            router.handle(logoutMethod.route, req, res, router.next);        
        });

        it('Count logins', (done)=>{
            model.logins.count((err, count)=>{
                assert(!err);
                assert.equal(0, count);
                done();
            });
        });
    });
});

