'use strict';

describe('www.api.users.find.Get', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_users_find_get_') + name };

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
            const ROUTE = '/api/users/find';
            const METHOD = 'GET';
            router = new Router();
            method = api.lib.routerHelper.createHandler(router, 'www/api/users/find/get.js');
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
        it('Find NOT existing user', (done)=>{
            const req = new Get(
                {
                    key:   'uid',
                    value: api.model.User.makeId()
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                const users = res.result.value;
                assert.equal(0, users.length);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        let userRosa;
        it('Add Rosa', (done)=>{
            model.users.add(
                {
                    uid:                   api.model.User.makeId(),
                    displayName:           'Rosa',
                    thumbnail:             'Rosa.png',
                    authProviderName:      'google',
                    authProviderId:        'Rosa',
                    authProviderRawString: '{google raw profile is here}'
                },
                (err, user)=>{
                    assert(!err);
                    assert(user);
                    userRosa = user;
                    done();
                }
            );
        });

        it('Find Rosa by uid', (done)=>{
            const req = new Get(
                {
                    key:   'uid',
                    value: userRosa.uid
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                const users = res.result.value;
                assert.equal(1, users.length);
                assert.equal(userRosa.uid, users[0].uid);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Add 10 users', (done)=>{
            const opts = [
                {displayName:'user-0', authProviderName:'google'},
                {displayName:'user-1', authProviderName:'google'},
                {displayName:'user-2', authProviderName:'google'},
                {displayName:'someuser-0', authProviderName:'google'},
                {displayName:'someuser-1', authProviderName:'google'},
                {displayName:'someuser-2', authProviderName:'google'},
                {displayName:'root', authProviderName:'google'},
                {displayName:'notroot', authProviderName:'google'},
                {displayName:'rootasroot', authProviderName:'facebook'},
                {displayName:'wtf', authProviderName:'facebook'},
            ];
            const add = (index, array, cb)=>{
                if (index<array.length) {
                    model.users.add(
                        {
                            uid:                   api.model.User.makeId(),
                            displayName:           array[index].displayName,
                            thumbnail:             array[index].displayName+'.png',
                            authProviderName:      array[index].authProviderName,
                            authProviderId:        array[index].displayName,
                            authProviderRawString: '{google raw profile is here}'
                        },
                        (err, user)=>{
                            assert(!err);
                            assert(user);
                            add(index+1, array, cb);
                        }
                    );
                } else {
                    cb();
                }
            };

            add(0, opts, done);
        });

        it('Find user-** by displayName', (done)=>{
            const req = new Get(
                {
                    key:   'displayName',
                    value: 'user-**'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                const users = res.result.value;
                assert.equal(3, users.length);
                assert.equal('user-0', res.result.value[0].displayName);
                assert.equal('user-1', res.result.value[1].displayName);
                assert.equal('user-2', res.result.value[2].displayName);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Find **user-** by displayName', (done)=>{
            const req = new Get(
                {
                    key:   'displayName',
                    value: '**user-**'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                const users = res.result.value;
                assert.equal(6, users.length);
                assert.equal('user-0', users[0].displayName);
                assert.equal('user-1', users[1].displayName);
                assert.equal('user-2', users[2].displayName);
                assert.equal('someuser-0', users[3].displayName);
                assert.equal('someuser-1', users[4].displayName);
                assert.equal('someuser-2', users[5].displayName);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Find root**r** by displayName', (done)=>{
            const req = new Get(
                {
                    key:   'displayName',
                    value: 'root**r**'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                const users = res.result.value;
                assert.equal(1, users.length);
                assert.equal('rootasroot', users[0].displayName);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Find by authProviderName google', (done)=>{
            const req = new Get(
                {
                    key:   'authProviderName',
                    value: 'google'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                const users = res.result.value;
                assert.equal(11-2, users.length);
                assert.equal('Rosa', users[0].displayName);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Find by authProviderName facebook', (done)=>{
            const req = new Get(
                {
                    key:   'authProviderName',
                    value: 'facebook'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                const users = res.result.value;
                assert.equal(2, users.length);
                assert.equal('rootasroot', users[0].displayName);
                assert.equal('wtf', users[1].displayName);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });
    });
});

