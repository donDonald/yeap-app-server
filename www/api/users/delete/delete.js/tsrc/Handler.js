'use strict';

describe('www.api.users.delete.Delete', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_users_delete_delete_') + name };

    let api, masterDbProps, dbProps;
    let Router, Response, Delete;

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
        Delete = re('lib/testTools/express/Delete')(api);
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

    let model, router, method;
    describe('Setup', ()=>{

        it('Create model', (done)=>{
            api.model.factory.createModel(dbProps, (err, m)=>{
                assert(!err, err);
                assert(m);
                model = m;
                done();
            });
        });

        it('Create method', ()=>{
            const ROUTE = '/api/users/delete';
            const METHOD = 'DELETE';
            router = new Router();
            method = api.lib.routerHelper.createHandler(router, 'www/api/users/delete/delete.js');
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
        it('Delete NOT existing user', (done)=>{
         
            const uid = api.model.User.makeId();
            const req = new Delete(
                {
                    uid: uid
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

        it('Add 10 users', (done)=>{
            const add = (index, count, cb)=>{
                if (index<count) {
                    model.users.add(
                        {
                            uid:                   api.model.User.makeId(),
                            displayName:           'user-'+index,
                            thumbnail:             'user-'+index+'.png',
                            authProviderName:      'google',
                            authProviderId:        'user-'+index,
                            authProviderRawString: '{google raw profile is here}'
                        },
                        (err, user)=>{
                            assert(!err);
                            assert(user);
                            add(index+1, count, cb);
                        }
                    );
                } else {
                    cb();
                }
            };

            add(0, 10, done);
        });

        let users;
        it('Check model', (done)=>{
            model.users.list(undefined, 0, 100, (err, items)=>{
//              console.log('err:', err);
//              console.log('items:', items);
                assert(!err, err);
                assert(items);
                users = items;
                assert.equal(10, items.length);
                users.forEach((u, index)=>{
                    assert.equal('user-'+index, u.displayName);
                });
                done();
            });
        })

        it('Delete 1st user', (done)=>{
            const req = new Delete(
                {
                    uid: users[0].uid
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
            model.users.list(undefined, 0, 100, (err, items)=>{
//              console.log('err:', err);
//              console.log('list:', items);
                assert(!err, err);
                assert(items);

                assert.equal(10-1, items.length);
                items.forEach((u, index)=>{
                    assert.equal('user-'+(index+1), u.displayName);
                });
                done();
            });
        });

        it('Delete all users', (done)=>{
            const deleteElement = (index, count, cb)=>{
                if (index<count) {
                    const req = new Delete(
                        {
                            uid: users[index].uid
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
            model.users.list(undefined, 0, 100, (err, items)=>{
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

