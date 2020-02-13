'use strict';

describe('www.api.deployments.add.Post', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_deployments_add_post_') + name };

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
            const ROUTE = '/api/deployments/add';
            const METHOD = 'POST';
            router = new Router();
            method = api.lib.routerHelper.createHandler(router, 'www/api/deployments/add/post.js');
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
        
        let did1;
        it('Add deployment1', (done)=>{
            did1 = api.model.Deployment.makeId();
            const req = new Post(
                {
                    did: did1
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                assert.equal(1, Object.keys(res.result.value).length);
                assert.equal(did1, res.result.value.did);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Check model', (done)=>{
            model.deployments.list(undefined, 0, 100, (err, items)=>{
//              console.log('err:', err);
//              console.log('items:', items);
                assert(!err, err);
                assert(items);
                assert.equal(1, items.length);
                assert.equal(did1, items[0].did);
                done();
            });
        });

        it('FAILURE, Add deployment1 2nd time', (done)=>{
            const req = new Post(
                {
                    did: did1
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

        it('Add 10 deployments', (done)=>{
            const add = (index, count, cb)=>{
                if (index<count) {
                    const req = new Post(
                        {
                            did:api.model.Deployment.makeId()
                        }
                    );

                    const res = new Response();
                    res.wait(()=>{
//                      console.log('res:', res);
                        assert.equal(200, res.result.code);
                        add(index+1, count, cb);
                    });

                    router.handle(method.route, req, res, router.next);        
                } else {
                    cb();
                }
            };

            add(0, 10, done);
        });

        it('Check model', (done)=>{
            model.deployments.list(undefined, 0, 100, (err, items)=>{
//              console.log('err:', err);
//              console.log('items:', items);
                assert(!err, err);
                assert(items);
                assert.equal(1+10, items.length);
                items.forEach((k)=>{
                    assert.equal(true, api.model.types.Did.test(k.did));
                });
                done();
            });
        })
    });
});
