'use strict';

describe('www.api.logins.add.Post', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_logins_add_post_') + name };

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
        api.model.User = re('model/User')(api);
        api.model.Users = re('model/Users')(api);
        api.model.Deployment = re('model/Deployment')(api);
        api.model.Deployments = re('model/Deployments')(api);
        api.model.Login = re('model/Login')(api);
        api.model.Logins = re('model/Logins')(api);
        api.model.Group = re('model/Group')(api);
        api.model.Groups = re('model/Groups')(api);
        api.model.helpers = {};
        api.model.helpers.add = re('model/helpers/add');
        api.model.helpers.delete = re('model/helpers/delete');
        api.model.helpers.count = re('model/helpers/count');
        api.model.helpers.query = re('model/helpers/query');
        api.model.factory = re('model/factory')(api);

        masterDbProps = api.lib.db.tools.masterDbProps;
        dbProps = JSON.parse(JSON.stringify(masterDbProps));

        Router = re('lib/testTools/express/Router')(api);
        Response = re('lib/testTools/express/Response')(api);
        Post = re('lib/testTools/express/Post')(api);
    });

    const addUser = function(users, name, cb) {
        users.add(
            {
                uid:                   api.model.User.makeId(),
                displayName:           name,
                thumbnail:             name + '.png',
                authProviderName:      'google',
                authProviderId:        name,
                authProviderRawString: name
            },
            (err, user)=>{
//              console.log('err:', err);
//              console.log('user:', user);
                assert(!err, err);
                assert(user);
                cb(user.uid);
            }
        );
    }

    const addDeployment = function(deployments, cb) {
        deployments.add(
            {
                did: api.model.Deployment.makeId(),
            },
            (err, deployment)=>{
//              console.log('err:', err);
//              console.log('deployment:', deployment);
                assert(!err, err);
                assert(deployment);
                cb(deployment.did);
            }
        );
    }

    const addUserAndDeployment = function(model, name, cb) {
        addUser(model.users, name, (uid)=>{
            addDeployment(model.deployments, (did)=>{
                cb({did:did, uid:uid});
            });
        });
    }

    let model, router, method;
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

        it('Create method', ()=>{
            const ROUTE = '/api/logins/add';
            const METHOD = 'POST';
            router = new Router();
            method = api.lib.routerHelper.createHandler(router, 'www/api/logins/add/post.js');
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

    describe('Main cases', (done)=>{
        it('FAILURE, Add login for NOT existin DID and UID', (done)=>{
            const req = new Post(
                {
                    lid: api.model.Login.makeId(),
                    did: api.model.Deployment.makeId(),
                    uid: api.model.User.makeId(),
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(500, res.result.code);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        let pair1, login1;
        it('Add user and deployment', (done)=>{
            addUserAndDeployment(model, 'Santa', (res)=>{
                assert(res.uid);
                assert(res.did);
                pair1 = res;
                done();
            });
        });

        it('Add login for existin DID and UID', (done)=>{
            const req = new Post(
                {
                    lid: api.model.Login.makeId(),
                    did: pair1.did,
                    uid: pair1.uid
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);

                assert(res.result.value);
                assert.equal(3, Object.keys(res.result.value).length);

                login1 = res.result.value;
                assert(login1.lid);
                assert.equal(login1.uid, pair1.uid);
                assert.equal(login1.did, pair1.did);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Check model', (done)=>{
            model.logins.list(undefined, 0, 100, (err, items)=>{
//              console.log('err:', err);
//              console.log('items:', items);
                assert(!err, err);
                assert(items);
                assert.equal(1, items.length);
                assert.equal(items[0].lid, login1.lid);
                assert.equal(items[0].did, login1.did);
                assert.equal(items[0].uid, login1.uid);
                done();
            });
        })

        it('FAILURE, Login 2nd time', (done)=>{
            const req = new Post(
                login1
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(500, res.result.code);
                assert(!res.result.value);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Add 10 logins', (done)=>{
            const add = (index, count, cb)=>{
                if (index<count) {
                    addUserAndDeployment(model, 'name-'+index, (pair)=>{
                        const req = new Post(
                            {
                                lid: api.model.Login.makeId(),
                                did: pair.did,
                                uid: pair.uid
                            }
                        );

                        const res = new Response();
                        res.wait(()=>{
//                          console.log('res:', res);
                            assert.equal(200, res.result.code);
                            add(index+1, count, cb);
                        });

                        router.handle(method.route, req, res, router.next);        
                    });
                } else {
                    cb();
                }
            };

            add(0, 10, done);
        });

        it('Check model', (done)=>{
            model.logins.list(undefined, 0, 100, (err, items)=>{
//              console.log('err:', err);
//              console.log('items:', items);
                assert(!err, err);
                assert(items);
                assert.equal(1+10, items.length);
                items.forEach((l)=>{
                    assert(l.lid);
                    assert(l.did);
                    assert(l.uid);
                });
                done();
            });
        })
    });
});

