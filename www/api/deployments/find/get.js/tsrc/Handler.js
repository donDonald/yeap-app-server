'use strict';

describe('www.api.deployments.find.Get', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_deployments_find_get_') + name };

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
            const ROUTE = '/api/deployments/find';
            const METHOD = 'GET';
            router = new Router();
            method = api.lib.routerHelper.createHandler(router, 'www/api/deployments/find/get.js');
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
        it('Find NOT existing deployment', (done)=>{
            const req = new Get(
                {
                    key:   'did',
                    value: 'somedid'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const deployments = res.result.value;
                assert.equal(0, deployments.length);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        let deployment1;
        it('Add deployment1', (done)=>{
            model.deployments.add(
                {
                    did: api.model.Deployment.makeId()
                },
                (err, deployment)=>{
                    assert(!err);
                    assert(deployment);
                    deployment1 = deployment;
                    done();
                }
            );
        });

        it('Find deployment1', (done)=>{
            const req = new Get(
                {
                    key:   'did',
                    value: deployment1.did 
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const deployments = res.result.value;
                assert.equal(1, deployments.length);
                assert.equal(deployment1.did, deployments[0].did);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Add 10 deployments', (done)=>{
            const add = (index, count, cb)=>{
                if (index<count) {
                    model.deployments.add(
                        {
                            did: api.model.Deployment.makeId()
                        },
                        (err, deployment)=>{
                            assert(!err);
                            assert(deployment);
                            add(index+1, count, cb);
                        }
                    );
                } else {
                    cb();
                }
            };

            add(0, 10, done);
        });

        it('Find **(all) deployments', (done)=>{
            const req = new Get(
                {
                    key:   'did',
                    value: '**'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const deployments = res.result.value;
                assert.equal(11, deployments.length);
                deployments.forEach((d)=>{
                    assert(api.model.types.Did.test(d.did));
                });
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });
    });
});

