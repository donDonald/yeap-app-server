'use strict';

describe('www.api.logins.find.Get', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_logins_find_get_') + name };

    let api, masterDbProps, dbProps;
    let Router, Response, Get;

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
        Get = re('lib/testTools/express/Get')(api);
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

    const addSome = (model, index, count, logins, cb)=>{
        if (index<count) {
            addUserAndDeployment(model, 'name-'+index, (pair)=>{
                let v = index < 10 ? 'login-0' + index : 'login-' + index;
                const lid = 'aaaaaaaaaaaaaaaaaaaaaaaa' + v;
                model.logins.add(
                    {
                        lid: lid,
                        did: pair.did,
                        uid: pair.uid
                    },
                    (err, res)=>{
                        assert(!err);
                        assert(res);
                        logins.push(res);
                        addSome(model, index+1, count, logins, cb);
                    }
                );
            });
        } else {
            cb();
        }
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
            const ROUTE = '/api/logins/find';
            const METHOD = 'GET';
            router = new Router();
            method = api.lib.routerHelper.createHandler(router, 'www/api/logins/find/get.js');
            assert.equal(method.route, ROUTE);
            assert.equal(method.method, METHOD);

            Get = Get.bind(undefined, (req)=>{
                req.app = {
                    zzz: {
                        model:model
                    }
                };
            });
        });
    });

    describe('Main cases', (done)=>{
        it('Find NOT existing login', (done)=>{
            const req = new Get(
                {
                    key:   'lid',
                    value: api.model.Login.makeId()
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                const logins = res.result.value;
                assert.equal(0, logins.length);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        const logins = [];
        it('Add 100 logins', (done)=>{
            addSome(model, 0, 100, logins, done);
        });

        it('Find by LID **', (done)=>{
            const req = new Get(
                {
                    key:   'lid',
                    value: '**'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const items = res.result.value;
                assert.equal(100, items.length);
                items.forEach((l, index)=>{
                    assert.equal(l.lid, logins[index].lid);
                    assert.equal(l.did, logins[index].did);
                    assert.equal(l.uid, logins[index].uid);
                });
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Find by LID 1st login', (done)=>{
            const req = new Get(
                {
                    key:   'lid',
                    value: logins[0].lid
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const items = res.result.value;
                assert.equal(1, items.length);
                assert.equal(items[0].lid, logins[0].lid);
                assert.equal(items[0].did, logins[0].did);
                assert.equal(items[0].uid, logins[0].uid);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Find by DID last(99th) login', (done)=>{
            const req = new Get(
                {
                    key:   'did',
                    value: logins[99].did
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const items = res.result.value;
                assert.equal(1, items.length);
                assert.equal(items[0].lid, logins[99].lid);
                assert.equal(items[0].did, logins[99].did);
                assert.equal(items[0].uid, logins[99].uid);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Find by UID 50th login', (done)=>{
            const req = new Get(
                {
                    key:   'uid',
                    value: logins[50].uid
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const items = res.result.value;
                assert.equal(1, items.length);
                assert.equal(items[0].lid, logins[50].lid);
                assert.equal(items[0].did, logins[50].did);
                assert.equal(items[0].uid, logins[50].uid);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });


    });
});

