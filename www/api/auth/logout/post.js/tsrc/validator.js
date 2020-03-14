'use strict';

describe('www.api.auth.logout.validator', function() {

    const assert = require('assert');
    const re = function(module) { return require('../../../../../../src/' + module); }

    let api, validator;
    let Router, Response, Post;

    before(()=>{
        api = {};
        api.lib = {};
        api.lib.Md5 = re('lib/Md5')(api);
        api.lib.makeId = re('lib/makeId')(api);
        api.lib.types = re('lib/types')(api);
        api.model = {};
        api.model.types = re('model/types')(api);
        api.model.User = re('model/User')(api);
        api.model.Deployment = re('model/Deployment')(api);

        Router = re('lib/testTools/express/Router')(api);
        Response = re('lib/testTools/express/Response')(api);
        Post = re('lib/testTools/express/Post')(api);

        validator = re('../www/api/auth/logout/post.js/validator')(api);
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
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"did":"Invalid value"},{"uid":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, did:undefined', (done)=>{
        const req = new Post({
            uid: api.model.User.makeId()
        });

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"did":"Invalid value"}]}}');
            assert.equal(400, res.result.code);
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, did:invalid', (done)=>{
        const req = new Post({
            did: 'invalid',
            uid: api.model.User.makeId()
        });

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"did":"Invalid value"}]}}');
            assert.equal(400, res.result.code);
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, uid:undefined', (done)=>{
        const req = new Post({
            did: api.model.Deployment.makeId()
        });

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"uid":"Invalid value"}]}}');
            assert.equal(400, res.result.code);
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, uid:invalid', (done)=>{
        const req = new Post({
            did: api.model.Deployment.makeId(),
            uid: 'invalid'
        });

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"uid":"Invalid value"}]}}');
            assert.equal(400, res.result.code);
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('SUCCESS', (done)=>{
        const req = new Post({
            did: api.model.Deployment.makeId(),
            uid: api.model.User.makeId()
        });

        const res = new Response();
        res.wait(()=>{
            assert.equal(200, res.result.code);
            done();
        });

        handler = ()=>{ res.sendStatus(200); };
        router.handle('go', req, res, router.next);
    });
});

