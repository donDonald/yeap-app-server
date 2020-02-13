'use strict';

describe('www.api.auth.register.validator', function() {

    const assert = require('assert');
    const re = function(module) { return require('../../../../../../src/' + module); }

    let api, validator;
    let Router, Response, Post;

    before(()=>{
        api = {};
        api.lib = {};
        api.lib.Md5 = re('lib/Md5')(api);
        api.model = {};
        api.model.types = re('model/types')(api);
        api.model.makeId = re('model/makeId')(api);
        api.model.User = re('model/User')(api);
        api.model.Deployment = re('model/Deployment')(api);

        Router = re('lib/testTools/express/Router')(api);
        Response = re('lib/testTools/express/Response')(api);
        Post = re('lib/testTools/express/Post')(api);

        validator = re('../www/api/auth/register/post.js/validator')(api);
    });

    let router, handler=()=>{};
    it('Create router', function() {
        router = new Router();
        router.post('go', validator.rules(), validator.validate, (req, res, next)=>{ handler(); });

        Post = Post.bind(undefined, (req)=>{
            req.app = {
                zzz: {
                    model:{}
                }
            };
        });
    });

    it('FAILURE, {}', function(done) {
        const req = new Post(
            {
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"_error":"Invalid value(s)"},{"ap":"Invalid value"},{"access_token":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, did:undefined', (done)=>{
        const req = new Post(
            {
                ap: 'valid-ap',
                access_token: 'valid-accesstoken'
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"_error":"Invalid value(s)"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, did:invalid', (done)=>{
        const req = new Post(
            {
                did: 'invalid',
                ap: 'valid-ap',
                access_token: 'valid-accesstoken'
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"_error":"Invalid value(s)"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, ap:undefined', (done)=>{
        const req = new Post(
            {
                did: api.model.Deployment.makeId(),
                access_token: 'valid-accesstoken'
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"ap":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, ap:invalid', (done)=>{
        const req = new Post(
            {
                did: api.model.Deployment.makeId(),
                ap: '',
                access_token: 'valid-accesstoken'
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"ap":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, access_token:undefined', (done)=>{
        const req = new Post(
            {
                did: api.model.Deployment.makeId(),
                ap: 'valid',
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"access_token":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, access_token:invalid', (done)=>{
        const req = new Post(
            {
                did: api.model.Deployment.makeId(),
                ap: 'valid',
                access_token: ''
            }
        );

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"access_token":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('SUCCESS, did:empty', (done)=>{
        const req = new Post(
            {
                did: '',
                ap: 'valid',
                access_token: 'valid access token'
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

    it('SUCCESS, did:valid', (done)=>{
        const req = new Post(
            {
                did: api.model.Deployment.makeId(),
                ap: 'valid',
                access_token: 'valid access token'
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

