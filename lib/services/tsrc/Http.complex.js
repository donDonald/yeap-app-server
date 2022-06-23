'use strict';

describe('lib.services.Http, Complex service, some routes are here, access.js and  validator.js are here', function() {

    const assert = require('assert');
    const re = (module)=>{ return require('../../' + module); }

    let api, helpers, getRoutes;
    before(()=>{
        api = re('index');
        getRoutes = api.express.getRoutes;
        helpers = require('./helpers')(api);
    });

    const loadCertificatesImpl = function(opts) {
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

    before(()=>{
        process.env.APP_ROOT = __dirname + '/test.Http.complex';
    });

    after(()=>{
        process.env.APP_ROOT = undefined;
    });



    describe('Stop not-yet-started service', ()=>{
        it('#Http.stop', (done)=>{
            const service = new api.app_server.services.Http();
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
            assert(!global.g_application);
            global.g_application = {
                model:MODEL
            };
            service = new api.app_server.services.Http();
            loggerFs = helpers.loggerSetup();
            done();
        });
        after((done)=>{
            global.g_application = undefined;
            helpers.loggerTeardown(service, done);
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

            service.start(opts, (err)=>{
                assert(!err, err);
                assert.equal(true, service.isStarted);
                api.app_server.services.Http.assertIsStarted(service);
                done();
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
            api.ajax.get(SESSION, DOMAIN, '/notExistingRoute', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert.equal(err, 'Error, status=404');
                assert(!session);
                assert(!result);
                done();
            });
        });

        it('Query, url: /', (done)=>{
            api.ajax.get(SESSION, DOMAIN, '', {}, {}, function(err, session, result) {
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
            api.ajax.json.get(SESSION, DOMAIN, 'news', {}, {}, function(err, session, result) {
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
            api.ajax.json.get(SESSION, DOMAIN, 'news?id=a', {}, {}, function(err, session, result) {
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
            api.ajax.json.get(SESSION, DOMAIN, 'news?id=b', {}, {}, function(err, session, result) {
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
            api.ajax.json.get(SESSION, DOMAIN, 'news?id=c', {}, {}, function(err, session, result) {
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
            api.ajax.json.get(SESSION, DOMAIN, 'news?id=cccccc', {}, {}, function(err, session, result) {
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
            api.ajax.json.get(SESSION, DOMAIN, 'news?id=', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert.equal('Error, status=400', err);
                assert(!session);
                assert(!result);
                done();
            });
        });

        it('Query, add incorrect element, url: /news/add', (done)=>{
            assert(!MODEL.news.d);
            api.ajax.json.post(SESSION, DOMAIN, 'news/add', {}, {id:'d'}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert(err);
                assert(!session);
                assert(!result);

                assert(!MODEL.news.d);
                done();
            });
        });

        it('Query, add element, url: /news/add', (done)=>{
            assert(!MODEL.news.d);
            api.ajax.json.post(SESSION, DOMAIN, 'news/add', {}, {id:'d', title:'ddd'}, function(err, session, result) {
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
            api.ajax.json.delete(SESSION, DOMAIN, 'news/delete', {}, {id:'d'}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert.equal('Error, status=401', err);
                assert(!session);
                assert(!result);
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

