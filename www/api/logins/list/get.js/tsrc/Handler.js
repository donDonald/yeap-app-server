'use strict';

describe('www.api.logins.list.Get', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_logins_list_get_') + name };

    let api, masterDbProps, dbProps;
    let Router, Response, Get

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
                        addSome(model, index+1, count, logins,  cb);
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
            const ROUTE = '/api/logins/list';
            const METHOD = 'GET';
            router = new Router();
            method = api.lib.routerHelper.createHandler(router, 'www/api/logins/list/get.js');
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
        it('List empty logins', (done)=>{
            const req = new Get(
                {
                    position: 0,
                    count: 10
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const totalCount = res.result.value.totalCount;
                assert.equal(0, totalCount);

                const logins = res.result.value.logins;
                assert.equal(0, logins.length);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Add 100 logins', (done)=>{
            const logins = [];
            addSome(model, 0, 100, logins, done);
        });

        it('List 1000 logins strating 0', (done)=>{
            const req = new Get(
                {
                    position: 0,
                    count: 1000
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const totalCount = res.result.value.totalCount;
                assert.equal(100, totalCount);

                const logins = res.result.value.logins;
                assert.equal(100, logins.length);

                assert.equal('aaaaaaaaaaaaaaaaaaaaaaaalogin-00', logins[0].lid);
                assert.equal('aaaaaaaaaaaaaaaaaaaaaaaalogin-99', logins[99].lid);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('List 10 logins strating 0', (done)=>{
            const req = new Get(
                {
                    position: 0,
                    count: 10
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const totalCount = res.result.value.totalCount;
                assert.equal(100, totalCount);

                const logins = res.result.value.logins;
                assert.equal(10, logins.length);
                assert.equal('aaaaaaaaaaaaaaaaaaaaaaaalogin-00', logins[0].lid);
                assert.equal('aaaaaaaaaaaaaaaaaaaaaaaalogin-09', logins[9].lid);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('List 100 logins strating 90', (done)=>{
            const req = new Get(
                {
                    position: 90,
                    count: 100
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const totalCount = res.result.value.totalCount;
                assert.equal(100, totalCount);

                const logins = res.result.value.logins;

                assert.equal(10, logins.length);
                assert.equal('aaaaaaaaaaaaaaaaaaaaaaaalogin-90', logins[0].lid);
                assert.equal('aaaaaaaaaaaaaaaaaaaaaaaalogin-99', logins[9].lid);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });
    });
});

