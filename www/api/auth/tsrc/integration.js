'use strict';

describe('www.api.integration', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_auth_integration_') + name };

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
        api.lib.tools     = {};
        api.lib.routerHelper = re('lib/routerHelper')(api);
        api.model = {};
        api.model.types = re('model/types')(api);
        api.model.makeId = re('model/makeId')(api);
        api.model.helpers = {};
        api.model.helpers.add = re('model/helpers/add');
        api.model.helpers.delete = re('model/helpers/delete');
        api.model.helpers.count = re('model/helpers/count');
        api.model.helpers.query = re('model/helpers/query');
        api.model.User = re('model/User')(api);
        api.model.Users = re('model/Users')(api);
        api.model.Deployment = re('model/Deployment')(api);
        api.model.Deployments = re('model/Deployments')(api);
        api.model.Login = re('model/Login')(api);
        api.model.Logins = re('model/Logins')(api);
        api.model.Group = re('model/Group')(api);
        api.model.Groups = re('model/Groups')(api);
        api.model.factory = re('model/factory')(api);

        masterDbProps = api.lib.db.tools.masterDbProps;
        dbProps = JSON.parse(JSON.stringify(masterDbProps));

        Router = re('lib/testTools/express/Router')(api);
        Response = re('lib/testTools/express/Response')(api);
        Post = re('lib/testTools/express/Post')(api);
    });

    let model, router, loginMethod, logoutMethod, registerMethod, bogusAuthProvider;
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

        it('Create router', ()=>{
            router = new Router();

            Post = Post.bind(undefined, (req)=>{
                req.app = {
                    zzz: {
                        model:model
                    }
                };
            });
        });

        it('Create bogus auth provider', ()=>{
            // Setup passport mw for request
            api.auth = {};
            api.auth.UserHandler = re('auth/UserHandler')(api);
            const Provider = re('auth/bogus/ProviderToken')(api);
            bogusAuthProvider = new Provider(model.users);
            const passport = re('/auth/setup')(api, model.users);
            router.use(passport.initialize());
            router.use(passport.session());
        });

        it('Create login.Get', ()=>{
            loginMethod = api.lib.routerHelper.createHandler(router, 'www/api/auth/login/post.js');
        });

        it('Create logout.Get', ()=>{
            logoutMethod = api.lib.routerHelper.createHandler(router, 'www/api/auth/logout/post.js');
        });

        it('Create register.Get', ()=>{
            registerMethod = api.lib.routerHelper.createHandler(router, 'www/api/auth/register/post.js');
        });
    });

    let deployments = {};
    const Deployment = function() {
        this.did = '';
        this.cat = '';
        this.users = {};
        this.addUser = function(alias, user) {
            this.users[alias] = user;
        }
        this.peekUser = function(alias) {
            return this.users[alias];
        }
        this.dropUser = function(alias) {
            delete this.users[alias];
        }
    }

    let tokens = {};
    tokens.uid1 = '{"id":"id1", "displayName":"name1", "thumbnail":"thumbnail.png"}';
    tokens.uid2 = '{"id":"id2", "displayName":"name2", "thumbnail":"thumbnail.png"}';
    tokens.uid3 = '{"id":"id3", "displayName":"name3", "thumbnail":"thumbnail.png"}';

    describe('did1,uid1: login->(failure)->register->(succes)->login->(success)->logout->(success)->login->(success)', (done)=>{

        let didAlias, uidAlias;
        it('did1: login not registered DID and CAT', (done)=>{
            didAlias = 'did1';
            uidAlias = 'uid1';
            deployments[didAlias] = new Deployment();
            const deployment = deployments[didAlias];

            const req = new Post({
                did: deployment.did,
                cat: deployment.cat
            });

            const res = new Response();
            res.wait(()=>{
//              console.log('res.result:', res.result);
                assert.equal(401, res.result.code);
//              console.log('deployments:', deployments);
                done();
            });

            router.handle(loginMethod.route, req, res, router.next);
        });

        it('did1: register', (done)=>{
            const deployment = deployments[didAlias];

            const req = new Post(
                {
                    did: deployment.did,
                    ap: bogusAuthProvider.name,
                    access_token: tokens[uidAlias]
                }
            );

            const res = new Response();
            res.wait(()=>{
                assert.equal(200, res.result.code);
                const result = res.result.value;
//              console.log('result:', result);
                assert.equal(true, api.model.types.Did.test(result.did));
                assert.equal(true, api.model.types.Cat.test(result.cat));
                deployment.did = result.did;
                deployment.cat = result.cat;
//              console.log('deployments:', deployments);
                done();
            });

            router.handle(registerMethod.route, req, res, router.next);
        });

        it('did1: login registered user', (done)=>{
            const deployment = deployments[didAlias];

            const req = new Post({
                did: deployment.did,
                cat: deployment.cat
            });

            const res = new Response();
            res.wait(()=>{
//              console.log('res.result:', res.result);
                assert.equal(200, res.result.code);

                assert(res.result.value);
                assert(res.result.value.user);
                const user = res.result.value.user;
                deployment.addUser(uidAlias, user);
//              console.log('deployments:', deployments);
                done();
            });

            router.handle(loginMethod.route, req, res, router.next);
        });

        it('Check model', (done)=>{
            model.deployments.count((err, count)=>{
                assert(!err, err);
                assert.equal(1, count);

                model.users.count((err, count)=>{
                    assert(!err, err);
                    assert.equal(1, count);

                    model.logins.count((err, count)=>{
                        assert(!err, err);
                        assert.equal(1, count);
                        done();
                    });
                });
            });
        });

        it('did1: logout', (done)=>{
            const deployment = deployments[didAlias];
            const user = deployment.peekUser(uidAlias);

            const req = new Post({
                did: deployment.did,
                uid: user.uid
            });

            const res = new Response();
            res.wait(()=>{
//              console.log('res.result:', res.result);
                assert.equal(200, res.result.code);
                deployment.dropUser(uidAlias);
//              console.log('deployments:', deployments);
                done();
            });

            router.handle(logoutMethod.route, req, res, router.next);
        });

        it('Check model', (done)=>{
            model.deployments.count((err, count)=>{
                assert(!err, err);
                assert.equal(1, count);

                model.users.count((err, count)=>{
                    assert(!err, err);
                    assert.equal(1, count);

                    model.logins.count((err, count)=>{
                        assert(!err, err);
                        assert.equal(0, count);
                        done();
                    });
                });
            });
        });

        it('did1: login registered user', (done)=>{
            const deployment = deployments[didAlias];

            const req = new Post({
                did: deployment.did,
                cat: deployment.cat
            });

            const res = new Response();
            res.wait(()=>{
//              console.log('res.result:', res.result);
                assert.equal(200, res.result.code);

                assert(res.result.value.user);
                const user = res.result.value.user;
                deployment.addUser(uidAlias, user);
//              console.log('deployments:', deployments);
                done();
            });

            router.handle(loginMethod.route, req, res, router.next);
        });
    });

    describe('did2,uid2: register->(succes)->login->(success)', (done)=>{

        let didAlias, uidAlias;
        it('did2: register', (done)=>{
            didAlias = 'did2';
            uidAlias = 'uid2';
            deployments[didAlias] = new Deployment();
            const deployment = deployments[didAlias];

            const req = new Post(
                {
                    did: deployment.did,
                    ap: bogusAuthProvider.name,
                    access_token: tokens[uidAlias]
                }
            );

            const res = new Response();
            res.wait(()=>{
                assert.equal(200, res.result.code);
                const result = res.result.value;
//              console.log('result:', result);
                assert.equal(true, api.model.types.Did.test(result.did));
                assert.equal(true, api.model.types.Cat.test(result.cat));
                deployment.did = result.did;
                deployment.cat = result.cat;
//              console.log('deployments:', deployments);
                done();
            });

            router.handle(registerMethod.route, req, res, router.next);
        });

        it('did2: login registered user', (done)=>{
            const deployment = deployments[didAlias];

            const req = new Post({
                did: deployment.did,
                cat: deployment.cat
            });

            const res = new Response();
            res.wait(()=>{
//              console.log('res.result:', res.result);
                assert.equal(200, res.result.code);

                assert(res.result.value.user);
                const user = res.result.value.user;
                deployment.addUser(uidAlias, user);
//              console.log('deployments:', deployments);
                done();
            });

            router.handle(loginMethod.route, req, res, router.next);
        });

        it('Check model', (done)=>{
            model.deployments.count((err, count)=>{
                assert(!err, err);
                assert.equal(2, count);

                model.users.count((err, count)=>{
                    assert(!err, err);
                    assert.equal(2, count);

                    model.logins.count((err, count)=>{
                        assert(!err, err);
                        assert.equal(2, count);
                        done();
                    });
                });
            });
        });
    });

    describe('did2,uid3: register->(succes)->login->(success)', (done)=>{

        let didAlias, uidAlias;
        it('did2: register', (done)=>{
            didAlias = 'did2';
            uidAlias = 'uid3';
            const deployment = deployments[didAlias];

            const req = new Post(
                {
                    did: deployment.did,
                    ap: bogusAuthProvider.name,
                    access_token: tokens[uidAlias]
                }
            );

            const res = new Response();
            res.wait(()=>{
                assert.equal(200, res.result.code);
                const result = res.result.value;
//              console.log('result:', result);
                assert.equal(true, api.model.types.Did.test(result.did));
                assert.equal(true, api.model.types.Cat.test(result.cat));
                deployment.did = result.did;
                deployment.cat = result.cat;
//              console.log('deployments:', deployments);
                done();
            });

            router.handle(registerMethod.route, req, res, router.next);
        });

        it('did2: login registered user', (done)=>{
            const deployment = deployments[didAlias];

            const req = new Post({
                did: deployment.did,
                cat: deployment.cat
            });

            const res = new Response();
            res.wait(()=>{
//              console.log('res.result:', res.result);
                assert.equal(200, res.result.code);

                assert(res.result.value);
                assert(res.result.value.user);
                const user = res.result.value.user;
                deployment.addUser(uidAlias, user);
//              console.log('deployments:', deployments);
                done();
            });

            router.handle(loginMethod.route, req, res, router.next);
        });

        it('Check model', (done)=>{
            model.deployments.count((err, count)=>{
                assert(!err, err);
                assert.equal(2, count);

                model.users.count((err, count)=>{
                    assert(!err, err);
                    assert.equal(3, count);

                    model.logins.count((err, count)=>{
                        assert(!err, err);
                        assert.equal(3, count);
                        done();
                    });
                });
            });
        });
    });

});

