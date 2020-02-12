'use strict';

describe('www.api.logins.delete.Delete', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_logins_delete_delete_') + name };

    let api, masterDbProps, dbProps;
    let Router, Response, Delete;

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
        Delete = re('lib/testTools/express/Delete')(api);
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

    const addSome = (model, index, count, cb)=>{
        if (index<count) {
            addUserAndDeployment(model, 'name-'+index, (pair)=>{

                model.logins.add(
                    {
                        lid: api.model.Login.makeId(),
                        did: pair.did,
                        uid: pair.uid
                    },
                    (err, res)=>{
                        assert(!err);
                        assert(res);
                        addSome(model, index+1, count, cb);
                    }
                );
            });
        } else {
            cb();
        }
    };

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
            const ROUTE = '/api/logins/delete';
            const METHOD = 'DELETE';
            router = new Router();
            method = api.lib.routerHelper.createHandler(router, 'www/api/logins/delete/delete.js');
            assert.equal(method.route, ROUTE);
            assert.equal(method.method, METHOD);

            Delete = Delete.bind(undefined, (req)=>{
                req.app = {
                    zzz: {
                        model:model
                    }
                };
            });
        });
    });

    describe('Main cases', (done)=>{
        it('Delete NOT existing login', (done)=>{
            const lid = api.model.Login.makeId();
            const req = new Delete(
                {
                    lid: lid
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(!res.result.value);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Add 10 logins', (done)=>{
            addSome(model, 0, 10, done);
        });

        let logins;
        it('Check model', (done)=>{
            model.logins.list(undefined, 0, 100, (err, items)=>{
//              console.log('err:', err);
//              console.log('items:', items);
                assert(!err, err);
                assert(items);
                assert.equal(10, items.length);
                items.forEach((l)=>{
                    assert(l.lid);
                    assert(l.did);
                    assert(l.uid);
                });
                logins = items;
                done();
            });
        })

        it('Delete 1st login', (done)=>{
            const req = new Delete(
                {
                    lid: logins[0].lid
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(!res.result.value);
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
                assert.equal(9, items.length);
                items.forEach((l)=>{
                    assert(l.lid);
                    assert(l.did);
                    assert(l.uid);
                });
                done();
            });
        });

        it('Delete all logins', (done)=>{
            const deleteElement = (index, count, cb)=>{
                if (index<count) {
                    const req = new Delete(
                        {
                            lid: logins[index].lid
                        }
                    );

                    const res = new Response();
                    res.wait(()=>{
//                      console.log('res:', res);
                        assert.equal(200, res.result.code);
                        assert(!res.result.value);
                        deleteElement(index+1, count, cb);
                    });

                    router.handle(method.route, req, res, router.next);        
                } else {
                    cb();
                }
            }

            deleteElement(1, 10, done);
        });

        it('Check model', (done)=>{
            model.logins.list(undefined, 0, 100, (err, items)=>{
//              console.log('err:', err);
//              console.log('items:', items);
                assert(!err, err);
                assert(items);
                assert.equal(0, items.length);
                done();
            });
        });
    });
});

