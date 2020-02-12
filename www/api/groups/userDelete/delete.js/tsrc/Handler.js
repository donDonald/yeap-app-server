'use strict';

describe('www.api.groups.userDelete.Delete', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_groups_userdelete_delete_') + name };

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
        api.model.helpers.query= re('model/helpers/query');
        api.model.factory = re('model/factory')(api);

        masterDbProps = api.lib.db.tools.masterDbProps;
        dbProps = JSON.parse(JSON.stringify(masterDbProps));

        Router = re('lib/testTools/express/Router')(api);
        Response = re('lib/testTools/express/Response')(api);
        Delete = re('lib/testTools/express/Delete')(api);
    });

    let model, router, method={};
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
            const ROUTE = '/api/groups/userDelete';
            const METHOD = 'DELETE';
            router = new Router();
            method = api.lib.routerHelper.createHandler(router, 'www/api/groups/userDelete/delete.js');
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

        it('Delete not existing user from not existing group', (done)=>{
            const req = new Delete(
                {
                    gid: 'notexisting',
                    uid: api.model.User.makeId()
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

        let userPablo;
        it('Add Pablo', (done)=>{
            model.users.add(
                {
                    uid:                   api.model.User.makeId(),
                    displayName:           'Pablo',
                    thumbnail:             'Pablo.png',
                    authProviderName:      'google',
                    authProviderId:        'Pablo',
                    authProviderRawString: '{Pablo}'
                },
                (err, user)=>{
                    assert(!err);
                    assert(user);
                    userPablo = user;
                    done();
                }
            );
        });

        it('Delete Pablo from not existing group', (done)=>{
            const req = new Delete(
                {
                    gid: 'notexisting',
                    uid: userPablo.uid
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

        let groupSuper;
        it('Add Super group', (done)=>{
            model.groups.add(
                {
                    gid: 'Super'
                },
                (err, group)=>{
//                  console.log('err:', err);
//                  console.log('group:', group);
                    assert(!err, err);
                    assert(group);
                    groupSuper = group;
                    done();
                }
            );
        });

        let groupDuper;
        it('Add Duper group', (done)=>{
            model.groups.add(
                {
                    gid: 'Duper'
                },
                (err, group)=>{
//                  console.log('err:', err);
//                  console.log('group:', group);
                    assert(!err, err);
                    assert(group);
                    groupDuper = group;
                    done();
                }
            );
        });

        it('Add Pablo to Super group', (done)=>{
            model.groups.userAdd(groupSuper.gid, userPablo.uid, (err)=>{
//              console.log('err:', err);
//              console.log('groups:', groups);
                assert(!err, err);
                done();
            });
        });

        it('Add Pablo to Duper group', (done)=>{
            model.groups.userAdd(groupDuper.gid, userPablo.uid, (err, groups)=>{
//              console.log('err:', err);
//              console.log('groups:', groups);
                assert(!err, err);
                done();
            });
        });

        it('Collect groups by Pablo', (done)=>{
            model.groups.collectGroupsByUser(userPablo.uid, (err, groups)=>{
//              console.log('err:', err);
//              console.log('groups:', groups);
                assert(!err, err);
                assert(groups);
                assert.equal(2, Object.keys(groups).length);
                assert(groups.Super);
                assert(groups.Duper);
                done();
            });
        });

        it('Delete Pablo from Super group', (done)=>{
            const req = new Delete(
                {
                    gid: groupSuper.gid,
                    uid: userPablo.uid
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

        it('Collect groups by Pablo', (done)=>{
            model.groups.collectGroupsByUser(userPablo.uid, (err, groups)=>{
//              console.log('err:', err);
//              console.log('groups:', groups);
                assert(!err, err);
                assert(groups);
                assert.equal(1, Object.keys(groups).length);
                assert(groups.Duper);
                done();
            });
        });

        it('Delete Pablo from Duper group', (done)=>{
            const req = new Delete(
                {
                    gid: groupDuper.gid,
                    uid: userPablo.uid
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

        it('Collect groups by Pablo', (done)=>{
            model.groups.collectGroupsByUser(userPablo.uid, (err, groups)=>{
//              console.log('err:', err);
//              console.log('groups:', groups);
                assert(!err, err);
                assert(groups);
                assert.equal(0, Object.keys(groups).length);
                done();
            });
        });
    });
});

