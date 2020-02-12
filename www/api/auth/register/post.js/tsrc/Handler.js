'use strict';

describe('www.api.auth.register.Post', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_auth_register_post_') + name };

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

    let model, router, method, bogusAuthProvider;
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
        });

        it('Create bogus auth provider', ()=>{
            // Setup passport mw for request
            api.auth = {};
            api.auth.UserHandler = re('auth/UserHandler')(api);
            const Provider = re('auth/bogus/ProviderToken')(api);
            bogusAuthProvider = new Provider(model.users);
            const passport = re('/auth/setup')(api, model.users);
            router.use(passport.initialize());
            router.use(passport.session());
        });

        it('Create method', ()=>{
            const ROUTE = '/api/auth/register';
            const METHOD = 'POST';
            method = api.lib.routerHelper.createHandler(router, 'www/api/auth/register/post.js');
            assert.equal(method.route, ROUTE);
            assert.equal(method.method, METHOD);

            Post = Post.bind(undefined, (req)=>{
                req.app = {
                    zzz: {
                        model:model
                    }
                };
            });
        });
    });

    describe('DID is empty, i.e. fist run on deployment', (done)=>{

        it('register with incorrect auth provider', (done)=>{
            const req = new Post(
                {
                    did: '',
                    ap: 'incorrectap',
                    access_token: '{"id":"id1", "displayName":"name1", "thumbnail":"thumbnail.png"}'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res.result);
                assert.equal(500, res.result.code);
                assert(!res.result.value)
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Check model', (done)=>{
            model.deployments.count((err, count)=>{
                assert(!err, err);
                assert.equal(0, count);
                done();
            });
        });

        let deployments = {};
        it('did1: register 1st time', (done)=>{
            const req = new Post(
                {
                    did: '',
                    ap: bogusAuthProvider.name,
                    access_token: '{"id":"id1", "displayName":"name1", "thumbnail":"thumbnail.png"}'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res.result);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                const result = res.result.value;
                assert.equal(2, Object.keys(result).length);
                assert.equal(true, api.model.types.Did.test(result.did));
                assert.equal(true, api.model.types.Did.test(result.did));
                assert.equal(true, api.model.types.Cat.test(result.cat));
                deployments['did1'] = result;
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Check model', (done)=>{
            model.deployments.count((err, count)=>{
                assert(!err, err);
                assert.equal(1, count);

                const deployment = deployments.did1;
                model.deployments.findByDid(deployment.did, (err, d)=>{
//                  console.log('deployments:', d);
                    assert(!err, err);
                    assert(d);
                    d = d[Object.keys(d)[0]];
                    assert.equal(deployment.did, d.did);

                    model.users.count((err, count)=>{
                        assert(!err, err);
                        assert.equal(1, count);

                        model.users.query({where:{cat:deployment.cat}}, (err, u)=>{
//                          console.log('users:', u);
                            assert(!err, err);
                            assert(u);
                            u = u[Object.keys(u)[0]];
                            assert.equal(deployment.cat, u.cat);

                            model.logins.count((err, count)=>{
                                assert(!err, err);
                                assert.equal(0, count);
                                done();
                            });
                        });
                    });

                });

            });
        });

        it('did1: register 2nd time', (done)=>{
            const deployment = deployments.did1;
            const req = new Post(
                {
                    did: deployment.did,
                    ap: bogusAuthProvider.name,
                    access_token: '{"id":"id1", "displayName":"name1", "thumbnail":"thumbnail.png"}'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res.result);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                const result = res.result.value;
                assert.equal(2, Object.keys(result).length);
                assert.equal(true, api.model.types.Did.test(result.did));
                assert.equal(true, api.model.types.Cat.test(result.cat));
                deployments['did1'] = result;
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Check model', (done)=>{
            model.deployments.count((err, count)=>{
                assert(!err, err);
                assert.equal(1, count);

                const deployment = deployments.did1;
                model.deployments.findByDid(deployment.did, (err, d)=>{
//                  console.log('deployments:', d);
                    assert(!err, err);
                    assert(d);
                    d = d[Object.keys(d)[0]];
                    assert.equal(deployment.did, d.did);

                    model.users.count((err, count)=>{
                        assert(!err, err);
                        assert.equal(1, count);

                        model.users.query({where:{cat:deployment.cat}}, (err, u)=>{
//                          console.log('users:', u);
                            assert(!err, err);
                            assert(u);
                            u = u[Object.keys(u)[0]];
                            assert.equal(deployment.cat, u.cat);

                            model.logins.count((err, count)=>{
                                assert(!err, err);
                                assert.equal(0, count);
                                done();
                            });
                        });
                    });

                });

            });
        });

        it('did2: register 1st time', (done)=>{
            const req = new Post(
                {
                    did: '',
                    ap: bogusAuthProvider.name,
                    access_token: '{"id":"id2", "displayName":"name2", "thumbnail":"thumbnail.png"}'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res.result);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                const result = res.result.value;
                assert.equal(2, Object.keys(result).length);
                assert.equal(true, api.model.types.Did.test(result.did));
                assert.equal(true, api.model.types.Cat.test(result.cat));
                deployments['did2'] = result;
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Check model', (done)=>{
            model.deployments.count((err, count)=>{
                assert(!err, err);
                assert.equal(2, count);

                const deployment = deployments.did2;
                model.deployments.findByDid(deployment.did, (err, d)=>{
//                  console.log('deployments:', d);
                    assert(!err, err);
                    assert(d);
                    d = d[Object.keys(d)[0]];
                    assert.equal(deployment.did, d.did);

                    model.users.count((err, count)=>{
                        assert(!err, err);
                        assert.equal(2, count);

                        model.users.query({where:{cat:deployment.cat}}, (err, u)=>{
//                          console.log('users:', u);
                            assert(!err, err);
                            assert(u);
                            u = u[Object.keys(u)[0]];
                            assert.equal(deployment.cat, u.cat);

                            model.logins.count((err, count)=>{
                                assert(!err, err);
                                assert.equal(0, count);
                                done();
                            });
                        });
                    });

                });

            });
        });

        it('register 100 users', (done)=>{
            const registerUser = (index, count, cb)=>{
                if (index < count) {

                    const accessToken = `{"id":"${'id'+(index+100)}", "displayName":"${'name'+(index+100)}", "thumbnail":"thumbnail.png"}`
                    const req = new Post(
                        {
                            did: '',
                            ap: bogusAuthProvider.name,
                            access_token: accessToken
                        }
                    );

                    const res = new Response();
                    res.wait(()=>{
//                      console.log('res:', res.result);
                        assert.equal(200, res.result.code);
                        assert(res.result.value);
                        const result = res.result.value;
                        assert.equal(2, Object.keys(result).length);
                        assert.equal(true, api.model.types.Did.test(result.did));
                        assert.equal(true, api.model.types.Cat.test(result.cat));
                        deployments['did2'] = result;
                        registerUser(index+1, count, cb);
                    });

                    router.handle(method.route, req, res, router.next);
                } else {
                    cb();
                }
            
            }

            registerUser(0, 100, done);
        });

        it('Check model', (done)=>{
            model.deployments.count((err, count)=>{
                assert(!err, err);
                assert.equal(2+100, count);

                model.users.count((err, count)=>{
                    assert(!err, err);
                    assert.equal(2+100, count);

                    model.logins.count((err, count)=>{
                        assert(!err, err);
                        assert.equal(0, count);
                        done();
                    });
                });
            });
        });
    });

});

