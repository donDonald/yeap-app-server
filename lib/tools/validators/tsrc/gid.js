'use strict';

describe('lib.tools.validators.gid', function() {

    const assert = require('assert');
    const re = function(module) { return require('../../../../' + module); }
    const Router = re('lib/testTools/express/Router')();
    let Get = re('lib/testTools/express/Get')();
    Get = Get.bind(undefined, (req)=>{});
    const Response = re('lib/testTools/express/Response')();

    let api, gid;

    before(()=>{
        api = {};
        api.lib = {};
        api.lib.Md5 = re('lib/Md5')(api);
        api.model = {};
        api.model.types = re('model/types')(api);
        api.model.makeId = re('model/makeId')(api);
        api.model.Group = re('model/Group')(api);
        gid = re('lib/tools/validators/gid')(api);
    });


    let router, handler=()=>{};
    it('Create router', function() {
        router = new Router();
        router.get('go', gid.rules(), gid.validate, (req, res, next)=>{ handler(); });
    });

    it('FAILURE, {}', function(done) {
        const req = new Get(
            {
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"gid":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, {gid:1}', function(done) {
        const req = new Get(
            {
                gid:1
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"gid":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, {gid:"INSERT ()"}', function(done) {
        const req = new Get(
            {
                gid:'INSERT ()'
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"gid":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('SUCCESS, {gid:<real DID>}', function(done) {
        const req = new Get(
            {
                gid: api.model.Group.makeId()
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(200, res.result.code);
            done();
        });

        handler = ()=>{ res.sendStatus(200); };
        router.handle('go', req, res, router.next);
    });
});

