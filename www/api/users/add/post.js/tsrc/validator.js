'use strict';

describe('www.api.users.add.validator', ()=>{

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
        api.model.Login= re('model/Login')(api);
        validator = re('../www/api/users/add/post.js/validator')(api);

        Router = re('lib/testTools/express/Router')(api);
        Response = re('lib/testTools/express/Response')(api);
        Post = re('lib/testTools/express/Post')(api);
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
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"uid":"Invalid value"},{"_error":"Invalid value(s)"},{"displayName":"Invalid value"},{"thumbnail":"Invalid value"},{"authProviderName":"Invalid value"},{"authProviderId":"Invalid value"},{"authProviderRawString":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, uid:undefined', (done)=>{
        const req = new Post({
            cat: api.model.User.makeCat(),
            displayName: 'Jesus',
            thumbnail: 'Jesus.png',
            authProviderName: 'fb',
            authProviderId: 'Jesus',
            authProviderRawString: 'Jesus',
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

    it('FAILURE, cat:undefined', (done)=>{
        const req = new Post({
            uid: api.model.User.makeId(),
            displayName: 'Jesus',
            thumbnail: 'Jesus.png',
            authProviderName: 'fb',
            authProviderId: 'Jesus',
            authProviderRawString: 'Jesus',
        });

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"_error":"Invalid value(s)"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, displayName:undefined', (done)=>{
        const req = new Post({
            uid: api.model.User.makeId(),
            cat: api.model.User.makeCat(),
            thumbnail: 'Jesus.png',
            authProviderName: 'fb',
            authProviderId: 'Jesus',
            authProviderRawString: 'Jesus',
        });

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"displayName":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, thumbnail:undefined', (done)=>{
        const req = new Post({
            uid: api.model.User.makeId(),
            cat: api.model.User.makeCat(),
            displayName: 'Jesus',
            authProviderName: 'fb',
            authProviderId: 'Jesus',
            authProviderRawString: 'Jesus',
        });

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"thumbnail":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, authProviderName:undefined', (done)=>{
        const req = new Post({
            uid: api.model.User.makeId(),
            cat: api.model.User.makeCat(),
            displayName: 'Jesus',
            thumbnail: 'Jesus.png',
            authProviderId: 'Jesus',
            authProviderRawString: 'Jesus',
        });

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"authProviderName":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, authProviderId:undefined', (done)=>{
        const req = new Post({
            uid: api.model.User.makeId(),
            cat: api.model.User.makeCat(),
            displayName: 'Jesus',
            thumbnail: 'Jesus.png',
            authProviderName: 'fb',
            authProviderRawString: 'Jesus',
        });

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"authProviderId":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('FAILURE, authProviderRawString:undefined', (done)=>{
        const req = new Post({
            uid: api.model.User.makeId(),
            cat: api.model.User.makeCat(),
            displayName: 'Jesus',
            thumbnail: 'Jesus.png',
            authProviderName: 'fb',
            authProviderId: 'Jesus',
        });

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(400, res.result.code);
            assert.equal(res.resultStr, '{"code":400,"value":{"errors":[{"authProviderRawString":"Invalid value"}]}}');
            done();
        });

        router.handle('go', req, res, router.next);
    });

    it('SUCCESS', (done)=>{
        const req = new Post({
            uid: api.model.User.makeId(),
            cat: api.model.User.makeCat(),
            displayName: 'Jesus',
            thumbnail: 'Jesus.png',
            authProviderName: 'fb',
            authProviderId: 'Jesus',
            authProviderRawString: 'Jesus',
        });

        const res = new Response();
        res.wait(()=>{
//          console.log('res:', res);
            assert.equal(200, res.result.code);
            done();
        });

        handler = ()=>{ res.sendStatus(200); };
        router.handle('go', req, res, router.next);
    });

    it('SUCCESS, cat:empty', (done)=>{
        const req = new Post({
            uid: api.model.User.makeId(),
            cat: '',
            displayName: 'Jesus',
            thumbnail: 'Jesus.png',
            authProviderName: 'fb',
            authProviderId: 'Jesus',
            authProviderRawString: 'Jesus',
        });

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

