'use strict';

describe('lib.validators.list', function() {

    const assert = require('assert');
    const re = function(module) { return require('../../../' + module); }
    const Router = re('lib/testTools/express/Router')();
    let Get = re('lib/testTools/express/Get')();
    Get = Get.bind(undefined, (req)=>{});
    const Response = re('lib/testTools/express/Response')();

    let api, list;

    before(()=>{
        api = {};
        list = re('lib/validators/list')(api);
    });


    let router, handler=()=>{};
    it('Create router', function() {
        router = new Router();
        router.get('go', list.rules(), list.validate, (req, res, next)=>{ handler(); });
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
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"position":"Invalid value"},{"count":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, {position:0}', function(done) {
        const req = new Get(
            {
                position: 0,
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"count":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, {count:100}', function(done) {
        const req = new Get(
            {
                count:100
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"position":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, {position:-1, count:1000}', function(done) {
        const req = new Get(
            {
                position: -1,
                count: 1000,
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"position":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, {position:0, count:0}', function(done) {
        const req = new Get(
            {
                position: 0,
                count: 0,
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"count":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, {position:0, count:1001}', function(done) {
        const req = new Get(
            {
                position: 0,
                count: 1001,
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"count":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('SUCCESS, {position:0, count:100}', function(done) {
        const req = new Get(
            {
                position: 0,
                count: 100,
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

    it('SUCCESS, {position:100, count:1000}', function(done) {
        const req = new Get(
            {
                position: 100,
                count: 1000,
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

