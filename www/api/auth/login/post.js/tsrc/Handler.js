'use strict';

describe('www.api.auth.login.Post', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_auth_login_post_') + name };

    let api, masterDbProps, dbProps;
    let Router, Response, Post;

    before(()=>{
        api = {};
        api.fs = require('fs');
        api.lib = {};
        api.lib.env = re('lib/env')(api);
        api.lib.re = re('lib/re')(api);
        api.lib.db = {};
        api.lib.db.tools = re('lib/db/tools');
        api.lib.db.DbPool = re('lib/db/DbPool')(api);
        api.lib.Md5 = re('lib/Md5')(api);
        api.lib.makeId = re('lib/makeId')(api);
        api.lib.types = re('lib/types')(api);
        api.lib.routerHelper = re('lib/routerHelper')(api);
        api.model = {};
        api.model.types = re('model/types')(api);
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

    before((done)=>{
        dbProps.database = createDbName('1');
        api.lib.db.tools.create(
            masterDbProps,
            dbProps.database,
            (err)=>{
                assert(!err, err);
                done();
            }
        );
    });

    after((done)=>{
        api.lib.db.DbPool.close(0, model, done);
    });

    let model, router, dids = {}, method;
    describe('Setup', ()=>{

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

        it('Create method', ()=>{
            const ROUTE = '/api/auth/login';
            const METHOD = 'POST';
            router = new Router();
            method = api.lib.routerHelper.createHandler(router, 'www/api/auth/login/post.js');
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
        it('Login, DID - not exists, CAT - not exists', (done)=>{
            const req = new Post({
                did: api.model.Deployment.makeId(),
                cat: api.model.User.makeCat()
            });

            const res = new Response();
            res.wait(()=>{
                assert.equal(401, res.result.code);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Login, DID - exists, CAT - not exists', (done)=>{
            const req = new Post({
                did: dids.did1.did,
                cat: api.model.User.makeCat()
            });

            const res = new Response();
            res.wait(()=>{
                assert.equal(401, res.result.code);
                done();
            });

            router.handle(method.route, req, res, router.next);        
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

                const rUser = res.result.value.user;
                assert.equal(rUser.uid, user.uid);
                assert.equal(rUser.displayName, user.displayName);
                assert.equal(rUser.thumbnail, user.thumbnail);
                assert(rUser.groups);

                model.logins.isIn(deployment.did, user.uid, (err, result)=>{
                    assert(!err, err);
                    assert(result);
                    assert.equal(true, result.loggedin);

                    model.deployments.findByDid(deployment.did, (err, d)=>{
//                      console.log('deployment:', d);
                        assert(!err, err);
                        assert(d);

                        model.users.query({where:{cat:userPablo.cat}}, (err, users)=>{
//                          console.log('user:', user);
                            assert(!err, err);
                            const user = users[Object.keys(users)[0]];
                            assert(user);
                            assert.equal(user.uid, userPablo.uid);
                            assert.equal(user.cat, userPablo.cat);
                            done();
                        });
                    });
                });
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Count logins', (done)=>{
            model.logins.count((err, count)=>{
                assert(!err);
                assert.equal(1, count);
                done();
            });
        });

        it('did1: Login Pablo again', (done)=>{
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

                const rUser = res.result.value.user;
                assert.equal(rUser.uid, user.uid);
                assert.equal(rUser.displayName, user.displayName);
                assert.equal(rUser.thumbnail, user.thumbnail);
                assert(rUser.groups);

                model.logins.isIn(deployment.did, user.uid, (err, result)=>{
                    assert(!err, err);
                    assert(result);
                    assert.equal(true, result.loggedin);

                    model.deployments.findByDid(deployment.did, (err, d)=>{
//                      console.log('deployment:', d);
                        assert(!err, err);
                        assert(d);

                        model.users.query({where:{cat:user.cat}}, (err, u)=>{
//                          console.log('user:', user);
                            assert(!err, err);
                            assert(u);
                            u = u[Object.keys(u)[0]];
                            assert.equal(u.uid, user.uid);
                            assert.equal(u.cat, user.cat);
                            done();
                        });
                    });
                });
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Count logins', (done)=>{
            model.logins.count((err, count)=>{
                assert(!err);
                assert.equal(1, count);
                done();
            });
        });

        let userNatalia;
        it('Add Natalia', (done)=>{
            model.users.add(
                {
                    uid:                  api.model.User.makeId(),
                    cat:                  api.model.User.makeCat(),
                    displayName:          'Natalia',
                    thumbnail:            'Natalia.png',
                    authProviderName:     'google',
                    authProviderId:       'Natalia',
                    authProviderRawString:'{google raw profile is here}'
                },
                (err, user)=>{
//                  console.log('user:', user);
                    assert(!err, err);
                    userNatalia = user;
                    assert(userNatalia);
                    done();
                }
            );
        });

        it('did1: Login Natalia', (done)=>{
            const user = userNatalia;
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

                const rUser = res.result.value.user;
                assert.equal(rUser.uid, user.uid);
                assert.equal(rUser.displayName, user.displayName);
                assert.equal(rUser.thumbnail, user.thumbnail);
                assert(rUser.groups);

                model.logins.isIn(deployment.did, user.uid, (err, result)=>{
                    assert(!err, err);
                    assert(result);
                    assert.equal(true, result.loggedin);

                    model.deployments.findByDid(deployment.did, (err, d)=>{
//                      console.log('deployment:', d);
                        assert(!err, err);
                        assert(d);

                        model.users.query({where:{cat:user.cat}}, (err, u)=>{
//                          console.log('user:', user);
                            assert(!err, err);
                            assert(u);
                            u = u[Object.keys(u)[0]];
                            assert.equal(u.uid, user.uid);
                            assert.equal(u.cat, user.cat);
                            done();
                        });
                    });
                });
            });

            router.handle(method.route, req, res, router.next);
        });

        it('Count logins', (done)=>{
            model.logins.count((err, count)=>{
                assert(!err);
                assert.equal(2, count);
                done();
            });
        });

        it('did2: Login Natalia', (done)=>{
            const user = userNatalia;
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

                const rUser = res.result.value.user;
                assert.equal(rUser.uid, user.uid);
                assert.equal(rUser.displayName, user.displayName);
                assert.equal(rUser.thumbnail, user.thumbnail);
                assert(rUser.groups);

                model.logins.isIn(deployment.did, user.uid, (err, result)=>{
                    assert(!err, err);
                    assert(result);
                    assert.equal(true, result.loggedin);

                    model.deployments.findByDid(deployment.did, (err, d)=>{
//                      console.log('deployment:', d);
                        assert(!err, err);
                        assert(d);

                        model.users.query({where:{cat:user.cat}}, (err, u)=>{
//                          console.log('user:', user);
                            assert(!err, err);
                            assert(u);
                            u = u[Object.keys(u)[0]];
                            assert.equal(u.uid, user.uid);
                            assert.equal(u.cat, user.cat);
                            done();
                        });
                    });
                });
            });

            router.handle(method.route, req, res, router.next);
        });

        it('Count logins', (done)=>{
            model.logins.count((err, count)=>{
                assert(!err);
                assert.equal(3, count);
                done();
            });
        });
    });

});

