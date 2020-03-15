'use strict';

describe('www.api.groups.find.Get', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../../../src/' + module); }
    const createDbName=(name)=>{ return re('lib/db/tools').createDbName('www_api_groups_find_get_') + name };

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
        api.model.helpers.query= re('model/helpers/query');
        api.model.factory = re('model/factory')(api);

        masterDbProps = api.lib.db.tools.masterDbProps;
        dbProps = JSON.parse(JSON.stringify(masterDbProps));

        Router = re('lib/testTools/express/Router')(api);
        Response = re('lib/testTools/express/Response')(api);
        Get = re('lib/testTools/express/Get')(api);
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

    let model, router, method = {};
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
            const ROUTE = '/api/groups/find';
            const METHOD = 'GET';
            router = new Router();
            method = api.lib.routerHelper.createHandler(router, 'www/api/groups/find/get.js');
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
        it('Find NOT existing group yes', (done)=>{
            const req = new Get(
                {
                    key:   'gid',
                    value: 'yes'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const groups = res.result.value;
                assert.equal(0, groups.length);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Add group yes', (done)=>{
            model.groups.add(
                {
                    gid: 'yes'
                },
                (err, group)=>{
                    assert(!err);
                    assert(group);
                    done();
                }
            );
        });

        it('Find yes', (done)=>{
            const req = new Get(
                {
                    key:   'gid',
                    value: 'yes'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const groups = res.result.value;
                assert.equal(1, groups.length);
                assert.equal('yes', groups[0].gid);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Add 10 groups', (done)=>{
            const gids = [
                'group-0',
                'group-1',
                'group-2',
                'somegroup-0',
                'somegroup-1',
                'somegroup-2',
                'root',
                'notroot',
                'rootasroot',
                'wtf'
            ];
            const add = (index, array, cb)=>{
                if (index<array.length) {
                    model.groups.add(
                        {
                            gid: array[index] 
                        },
                        (err, group)=>{
                            assert(!err);
                            assert(group);
                            add(index+1, array, cb);
                        }
                    );
                } else {
                    cb();
                }
            };

            add(0, gids, done);
        });

        it('Find group-**', (done)=>{
            const req = new Get(
                {
                    key:   'gid',
                    value: 'group-**'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const groups = res.result.value;
                assert.equal(3, groups.length);
                assert.equal('group-0', groups[0].gid);
                assert.equal('group-1', groups[1].gid);
                assert.equal('group-2', groups[2].gid);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Find **group-**', (done)=>{
            const req = new Get(
                {
                    key:   'gid',
                    value: '**group-**'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const groups = res.result.value;
                assert.equal(6, groups.length);
                assert.equal('group-0', groups[0].gid);
                assert.equal('group-1', groups[1].gid);
                assert.equal('group-2', groups[2].gid);
                assert.equal('somegroup-0', groups[3].gid);
                assert.equal('somegroup-1', groups[4].gid);
                assert.equal('somegroup-2', groups[5].gid);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });

        it('Find root**r** yes', (done)=>{
            const req = new Get(
                {
                    key:   'gid',
                    value: 'root**r**'
                }
            );

            const res = new Response();
            res.wait(()=>{
//              console.log('res:', res);
                assert.equal(200, res.result.code);
                assert(res.result.value);

                const groups = res.result.value;
                assert.equal(1, groups.length);
                assert.equal('rootasroot', groups[0].gid);
                done();
            });

            router.handle(method.route, req, res, router.next);        
        });
    });
});

