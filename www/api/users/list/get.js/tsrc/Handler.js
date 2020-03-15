'use strict';

describe('www.api.users.list.Get', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_users_list_get_') + name };

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
            const ROUTE = '/api/users/list';
            const METHOD = 'GET';
            router = new Router();
            method = api.lib.routerHelper.createHandler(router, 'www/api/users/list/get.js');
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
        it('List empty users', (done)=>{
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

                const users = res.result.value.users;
                assert.equal(0, users.length);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Add 100 users', (done)=>{
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

            add(0, 100, done);
        });

        it('List 1000 users strating 0', (done)=>{
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

                const users = res.result.value.users;
                assert.equal(100, users.length);

                assert.equal('user-0', users[0].displayName);
                assert.equal('user-99', users[99].displayName);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('List 10 users strating 0', (done)=>{
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

                const users = res.result.value.users;
                assert.equal(10, users.length);
                assert.equal('user-0', users[0].displayName);
                assert.equal('user-9', users[9].displayName);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('List 100 users strating 90', (done)=>{
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

                const users = res.result.value.users;

                assert.equal(10, users.length);
                assert.equal('user-90', users[0].displayName);
                assert.equal('user-99', users[9].displayName);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });
    });
});

