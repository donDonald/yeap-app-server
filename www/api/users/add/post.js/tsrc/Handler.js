'use strict';

describe('www.api.users.add.Post', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_users_add_post_') + name };

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
            const ROUTE = '/api/users/add';
            const METHOD = 'POST';
            router = new Router();
            method = api.lib.routerHelper.createHandler(router, 'www/api/users/add/post.js');
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

        let userVeronika;
        it('Add Veronika', (done)=>{
            userVeronika = new api.model.User({
                uid: api.model.User.makeId(),
                cat: api.model.User.makeCat(),
                displayName: 'Veronika',
                thumbnail: 'Veronika.png',
//              cts: new Date().toString(),
                authProviderName: 'fb',
                authProviderId: 'Veronika',
                authProviderRawString: 'Veronika'
            });
            const req = new Post(
                userVeronika
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);
                assert.equal(7, Object.keys(res.result.value).length);
                const user = new api.model.User(res.result.value);
                assert.equal(userVeronika.uid, user.uid);
                assert.equal(userVeronika.cat, user.cat);
                assert.equal(userVeronika.displayName, user.displayName);
                assert.equal(userVeronika.thumbnail, user.thumbnail);
                assert.equal(userVeronika.authProviderName, user.authProviderName);
                assert.equal(userVeronika.authProviderId, user.authProviderId);
                assert.equal(userVeronika.authProviderRawString, user.authProviderRawString);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Check model', (done)=>{
            model.users.list(undefined, 0, 100, (err, items)=>{
//              console.log('err:', err);
//              console.log('items:', items);
                assert(!err, err);
                assert(items);
                assert.equal(1, items.length);
                assert.equal(userVeronika.uid, items[0].uid);
                done();
            });
        })

        it('FAILURE: Add Veronika 2nd time', (done)=>{
            const req = new Post(
                userVeronika
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(500, res.result.code);
                assert(!res.result.value);
                done();
            })

            router.handle(method.route, req, res, router.next);        
        });

        it('Add 10 users', (done)=>{
            const add = (index, count, cb)=>{
                if (index<count) {
                    const req = new Post(
                        {
                            uid: api.model.User.makeId(),
                            cat: api.model.User.makeCat(),
                            displayName: 'user-'+index,
                            thumbnail: 'user-' + index +'.png',
                            authProviderName: 'fb',
                            authProviderId: 'user-'+index,
                            authProviderRawString: 'user-'+index
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
            model.users.list(undefined, 0, 100, (err, items)=>{
//              console.log('err:', err);
//              console.log('items:', items);
                assert(!err, err);
                assert(items);
                assert.equal(1+10, items.length);
                assert.equal('Veronika', items[0].displayName);
                for (let i=0; i<10; ++i) {
                    assert.equal('user-'+i, items[i+1].displayName);
                }
                done();
            });
        })
    });
});

