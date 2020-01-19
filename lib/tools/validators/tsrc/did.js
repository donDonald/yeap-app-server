'use strict';

describe('lib.tools.validators.did', function() {

    const assert = require('assert');
    const re = function(module) { return require('../../../../' + module); }
    const Router = re('lib/testTools/express/Router')();
    const Request = re('lib/testTools/express/Request')();
    const Response = re('lib/testTools/express/Response')();

    let api, did;

    before(()=>{
        api = {};
        api.lib = {};
        api.lib.tools = {};
        api.lib.tools.Md5 = re('lib/tools/Md5')(api);
        api.model = {};
        api.model.types = re('model/types')(api);
        api.model.makeId = re('model/makeId')(api);
        api.model.Deployment = re('model/Deployment')(api);
        did = re('lib/tools/validators/did')(api);
    });


    let router, handler=()=>{};
    it('Create router', function() {
        router = new Router();
        router.get('go', did.rules(), did.validate, (req, res, next)=>{ handler(); });
    });

    it('FAILURE, {}', function(done) {
        const req = new Request(
            {
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"did":"Invalid value"}]}}');
            done();
        });

        router.handleRoute('go', req, res, router.next);
    });

    it('FAILURE, {did:1}', function(done) {
        const req = new Request(
            {
                did:1
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"did":"Invalid value"}]}}');
            done();
        });

        router.handleRoute('go', req, res, router.next);
    });

    it('FAILURE, {did:"INSERT ()"}', function(done) {
        const req = new Request(
            {
                did:'INSERT ()'
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"did":"Invalid value"}]}}');
            done();
        });

        router.handleRoute('go', req, res, router.next);
    });

    it('SUCCESS, {did:<real DID>}', function(done) {
        const req = new Request(
            {
                did: api.model.Deployment.makeId()
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(200, res.result.code);
            done();
        });

        handler = ()=>{ res.sendStatus(200); };
        router.handleRoute('go', req, res, router.next);
    });
});
