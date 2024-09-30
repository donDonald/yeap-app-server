'use strict';

describe('yeap_app_server.services.Http, Complex service, some routes are here, access.js and  validator.js are here', ()=>{

    const assert = require('assert');
    const metavm = require('metavm');
    const re = (module)=>{ return require('../../' + module); }

    let api, helpers, getRoutes, ajax;
    before(()=>{
        api = re('index');
        const dev_tools = require('yeap_dev_tools');
        getRoutes = dev_tools.express.getRoutes;
        ajax = dev_tools.ajax;
        process.env.YEAP_APP_SERVER_ROOT = __dirname + '/test.Http.complex';
        helpers = require('./helpers')(api);
    });

    after(()=>{
        process.env.YEAP_APP_SERVER_ROOT = undefined;
    });

    const loadCertificatesImpl = (opts) => {
        return {};
    }

    const MODEL = {};
    MODEL.news = {
        a:{title:'aaa'},
        b:{title:'bbb'},
        c:{title:'ccc'},
    };
    const DOMAIN = 'http://localhost:3000';
    const SESSION = undefined;

    const HTTP_404 =
`<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>404</title>
    <head>

    <body>
        <title>The requested URL /notExistingRoute is not found</title>
    <body>
</html>
`;

    const application = {
        open: function(stuff, cb) {
            assert(!this.sandbox);
            const SANDBOX = { ...metavm.COMMON_CONTEXT, process, require, module, assert };
            let sandbox;

            if(!cb) {
                cb = stuff;
                stuff = undefined;
            }

            if(stuff) {
                sandbox = { ...SANDBOX, api, ...stuff };
            } else {
                sandbox = { ...SANDBOX, api };
            }
            sandbox.g_application = this;
            sandbox.global = sandbox;
            this.sandbox = metavm.createContext(sandbox);

            this.errorHole = new api.app_server.ErrorHole();
            this.errorHole.open({}, (err)=>{
                assert(!err);
                cb();
            });
        },

        close: function(cb) {
            this.sandbox = undefined;
            setImmediate(cb)
        },

        get model() {
            return this.sandbox.model;
        },

        require: function(path) {
            assert(path);
            assert(this.sandbox);
            const fullPath = api.env.makePath(path);
            let src = api.fs.readFileSync(fullPath).toString();
            return this.runScript(src);
        },

        runScript: function(src) {
            assert(this.sandbox);
            const result = metavm.createScript('script', src, {context:this.sandbox});
            return result.exports;
        }
    };




    describe('Stop not-yet-started service', ()=>{
        before((done)=>{
            application.open({model:MODEL}, (err)=>{
                assert(!err, err);
                done();
            });
        });
        after((done)=>{
            application.close((err)=>{
                assert(!err, err);
                done();
            });
        });

        it('#Http.stop', (done)=>{
            const service = new api.app_server.services.Http(application);
            assert.equal(false, service.isStarted);
            api.app_server.services.Http.assertIsStopped(service);

            service.stop((err)=>{
                assert(!err)
                assert.equal(false, service.isStarted);
                api.app_server.services.Http.assertIsStopped(service);
                done();
            });
        });
    });




    describe('Start and stop', ()=>{
        let service, loggerFs;
        before((done)=>{
            application.open({model:MODEL}, (err)=>{
                assert(!err, err);
                service = new api.app_server.services.Http(application);
                loggerFs = helpers.loggerSetup(process.env.YEAP_APP_SERVER_ROOT);
                done();
            });
        });
        after((done)=>{
            application.close((err)=>{
                assert(!err, err);
                helpers.loggerTeardown(service, done);
            });
        });

        it('#Http.start', (done)=>{
            assert.equal(false, service.isStarted);
            api.app_server.services.Http.assertIsStopped(service);

            const opts = {
                api:api,
                config:{
                    port:      3000,
                },
                loadCertificates: loadCertificatesImpl,
                loggerFs: loggerFs,
                model:MODEL
            };

            service.load(opts, (err)=>{
                service.start((err)=>{
                    assert(!err, err);
                    assert.equal(true, service.isStarted);
                    api.app_server.services.Http.assertIsStarted(service);
                    done();
                });
            });
        });

        it('Verify service', ()=>{
            // Verify configuration
            assert.equal(1, Object.keys(service.config).length);
            assert.equal('3000', service.config.port);

            // Verify model
            assert(service.model);

            // Verify details
            assert.equal('function', typeof service._impl);
            assert.equal('object', typeof service._accessController);
            assert.equal('object', typeof service._httpServer);

            // Verify routes
            const routes = getRoutes(service._impl);
            //console.log(routes);

            const ROUTES = [ [ 'GET', '/' ], ['GET', '/news'], ['POST', '/news/add'], ['DELETE', '/news/delete'] ];
            assert.equal(4, routes.length);
            assert.equal(ROUTES.length, routes.length);

            routes.forEach((r, index)=>{
                assert.equal(2, r.length);
                assert.equal(ROUTES[index][0], r[0]);
                assert.equal(ROUTES[index][1], r[1]);
            });
        });

        it('Query not existing url, url: /notExistingRoute', (done)=>{
            ajax.text.get(SESSION, DOMAIN, 'notExistingRoute', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:'); console.log(result);
                assert.equal(err, 404);
                assert(!session);
                assert.equal(result, HTTP_404);
                done();
            });
        });

        it('Query, url: /', (done)=>{
            ajax.text.get(SESSION, DOMAIN, '', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert(!err, err);
                assert(!session);
                assert.equal('Home page', result);
                done();
            });
        });

        it('Query, url: /news', (done)=>{
            ajax.json.get(SESSION, DOMAIN, 'news', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert(!err, err);
                assert(!session);
                assert(result);

                const news = result;
                //console.log(news);
                assert.equal(3, Object.keys(news).length);
                assert.equal('aaa', news.a.title);
                assert.equal('bbb', news.b.title);
                assert.equal('ccc', news.c.title);
                done();
            });
        });

        it('Query, url: /news?id=a', (done)=>{
            ajax.json.get(SESSION, DOMAIN, 'news?id=a', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert(!err, err);
                assert(!session);
                assert(result);

                const news = result;
                assert.equal(1, Object.keys(news).length);
                assert.equal('aaa', news.title);
                done();
            });
        });

        it('Query, url: /news?id=b', (done)=>{
            ajax.json.get(SESSION, DOMAIN, 'news?id=b', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert(!err, err);
                assert(!session);
                assert(result);

                const news = result;
                assert.equal(1, Object.keys(news).length);
                assert.equal('bbb', news.title);
                done();
            });
        });

        it('Query, url: /news?id=c', (done)=>{
            ajax.json.get(SESSION, DOMAIN, 'news?id=c', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert(!err, err);
                assert(!session);
                assert(result);

                const news = result;
                assert.equal(1, Object.keys(news).length);
                assert.equal('ccc', news.title);
                done();
            });
        });

        it('Query not existing param, url: /news?id=cccccc', (done)=>{
            ajax.json.get(SESSION, DOMAIN, 'news?id=cccccc', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert(!err, err);
                assert(!session);
                assert(!result);
                done();
            });
        });

        it('Query invalid params, url: /news?id=', (done)=>{
            ajax.json.get(SESSION, DOMAIN, 'news?id=', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert.equal(400, err);
                assert(!session);
                assert(!result);
                done();
            });
        });

        it('Query, add incorrect element, url: /news/add', (done)=>{
            assert(!MODEL.news.d);
            ajax.json.post(SESSION, DOMAIN, 'news/add', {}, {id:'d'}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert.equal(400, err);
                assert(!session);
                assert(!result);

                assert(!MODEL.news.d);
                done();
            });
        });

        it('Query, add element, url: /news/add', (done)=>{
            assert(!MODEL.news.d);
            ajax.json.post(SESSION, DOMAIN, 'news/add', {}, {id:'d', title:'ddd'}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert(!err, err);
                assert(!session);
                assert(result);

                const d = result;
                assert(MODEL.news.d);
                assert.equal('ddd', MODEL.news.d.title);

                assert.equal(d.toString(), MODEL.news.d.toString());
                done();
            });
        });

        it('Query, delete element, url: /news/delete', (done)=>{
            assert(MODEL.news.d);
            ajax.json.delete(SESSION, DOMAIN, 'news/delete', {}, {id:'d'}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert.equal(401, err);
                assert(!session);
                assert.equal('Unauthorized', result);
                done();
            });
        });

        it('#Http.stop', (done)=>{
            assert.equal(true, service.isStarted);
            api.app_server.services.Http.assertIsStarted(service);

            service.stop((err)=>{
                assert(!err, err);
                assert.equal(false, service.isStarted);
                api.app_server.services.Http.assertIsStopped(service);
                done();
            });
        });
    });

});

