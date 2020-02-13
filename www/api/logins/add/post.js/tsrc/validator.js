'use strict';

describe('www.api.logins.add.validator', ()=>{

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
        api.model.Login= re('model/Login')(api);
        validator = re('../www/api/logins/add/post.js/validator')(api);

        Router = re('lib/testTools/express/Router')();
        Post = re('lib/testTools/express/Post')();
        Response = re('lib/testTools/express/Response')();
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
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"lid":"Invalid value"},{"did":"Invalid value"},{"uid":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, lid:undefined', (done)=>{
        const req = new Post({
            did: api.model.Deployment.makeId(),
            uid: api.model.User.makeId(),
        });

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"lid":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, did:undefined', (done)=>{
        const req = new Post({
            lid: api.model.Login.makeId(),
            uid: api.model.User.makeId(),
        });

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"did":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, uid:undefined', (done)=>{
        const req = new Post({
            lid: api.model.Login.makeId(),
            did: api.model.Deployment.makeId(),
        });

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"uid":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('SUCCESS', (done)=>{
        const req = new Post({
            lid: api.model.Login.makeId(),
            did: api.model.Deployment.makeId(),
            uid: api.model.User.makeId(),
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

