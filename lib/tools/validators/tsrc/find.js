'use strict';

describe('lib.tools.validators.find', function() {

    const assert = require('assert');
    const re = function(module) { return require('../../../../' + module); }
    const Router = re('lib/testTools/express/Router')();
    const Get = re('lib/testTools/express/Get')();
    const Response = re('lib/testTools/express/Response')();

    let api, find;

    before(()=>{
        api = {};
        api.model = {};
        api.model.types = re('model/types')(api);
        find = re('lib/tools/validators/find')(api);
    });

    let router, handler=()=>{};
    it('Create router', function() {
        router = new Router();
        router.get('go', find.rules(), find.validate, (req, res, next)=>{ handler(); });
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
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"key":"Invalid value"},{"value":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, {key:"gid"}', function(done) {
        const req = new Get(
            {
                key: 'gid',
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"value":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, {value:"somegid"}', function(done) {
        const req = new Get(
            {
                value:"somegid"
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"key":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, {key:"uid", value:"insert (name) into"}', function(done) {
        const req = new Get(
            {
                key: 'uid',
                value: 'insert (name) into',
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"value":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('SUCCESS, {key:"did", value:"somedid"}', function(done) {
        const req = new Get(
            {
                key: 'did',
                value: 'somedid',
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

