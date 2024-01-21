'use strict';

describe('yeap_app_server.services.Http, Empty service, root route only, no SSL, no access.js, no validator.js', ()=>{

    const assert = require('assert');
    const metavm = require('metavm');
    const re = (module)=>{ return require('../../' + module); }

    let api, helpers, getRoutes, ajax;
    before(()=>{
        api = re('index');
        const dev_tools = require('yeap_dev_tools');
        getRoutes = dev_tools.express.getRoutes;
        ajax = dev_tools.ajax;
        process.env.YEAP_APP_SERVER_ROOT = __dirname + '/test.Http.empty';
        helpers = require('./helpers')(api);
    });

    after(()=>{
        process.env.YEAP_APP_SERVER_ROOT = undefined;
    });

    const loadCertificatesImpl = (opts) => {
        return {};
    }

    const DOMAIN = 'http://localhost:3000';
    const SESSION = undefined;

    const application = {
        create: function(stuff) {
            assert(!this.sandbox);
            const SANDBOX = { ...metavm.COMMON_CONTEXT, process, require, module, assert };
            let sandbox;
            if(stuff) {
                sandbox = { ...SANDBOX, api, ...stuff };
            } else {
                sandbox = { ...SANDBOX, api };
            }
            sandbox.g_application = this;
            sandbox.global = sandbox;
            this.sandbox = metavm.createContext(sandbox);
        },

        get model() {
            return this.sandbox.model;
        },

        destroy: function() {
            this.sandbox = undefined;
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
        before(()=>{
            application.create();
        });
        after(()=>{
            application.destroy();
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
            application.create();
            service = new api.app_server.services.Http(application);
            loggerFs = helpers.loggerSetup(process.env.YEAP_APP_SERVER_ROOT);
            done();
        });
        after((done)=>{
            application.destroy();
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
                loggerFs: loggerFs
            };

            service.load(opts, (err)=>{
                assert(!err);
                service.start((err)=>{
                    assert(!err);
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
            assert(!service.model);

            // Verify details
            assert.equal('function', typeof service._impl);
            assert.equal('object', typeof service._accessController);
            assert.equal('object', typeof service._httpServer);

            // Verify routes
            const routes = getRoutes(service._impl);
            //console.log(routes);

            const ROUTES = [ [ 'GET', '/' ] ];
            assert.equal(1, routes.length);
            assert.equal(ROUTES.length, routes.length);

            routes.forEach((r, index)=>{
                assert.equal(2, r.length);
                assert.equal(ROUTES[index][0], r[0]);
                assert.equal(ROUTES[index][1], r[1]);
            });
        });

        it('Query, url: /notExistingRoute', (done)=>{
            ajax.text.get(SESSION, DOMAIN, 'notExistingRoute', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert.equal(err, 404);
                assert(!session);
                assert.equal(result, "Can't find requested url:/notExistingRoute");
                done();
            });
        });

        it('Query, url: /', (done)=>{
            ajax.text.get(SESSION, DOMAIN, '', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert(!err);
                assert(!session);
                assert.equal('Root page', result);
                done();
            });
        });

        it('#Http.stop', (done)=>{
            assert.equal(true, service.isStarted);
            api.app_server.services.Http.assertIsStarted(service);

            service.stop((err)=>{
                assert(!err);
                assert.equal(false, service.isStarted);
                api.app_server.services.Http.assertIsStopped(service);
                done();
            });
        });
    });




    describe('Start twise and stop twise', ()=>{
        let service, loggerFs;
        before((done)=>{
            application.create();
            service = new api.app_server.services.Http(application);
            loggerFs = helpers.loggerSetup(process.env.YEAP_APP_SERVER_ROOT);
            done();
        });
        after((done)=>{
            application.destroy();
            helpers.loggerTeardown(service, done);
        });

        it('#Http.start, 1st time', (done)=>{
            assert.equal(false, service.isStarted);
            api.app_server.services.Http.assertIsStopped(service);

            const opts = {
                api:api,
                config:{
                    port:      3000,
                },
                loadCertificates: loadCertificatesImpl,
                loggerFs: loggerFs
            };

            service.load(opts, (err)=>{
                service.start((err)=>{
                    assert(!err);
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
            assert(!service.model);

            // Verify details
            assert.equal('function', typeof service._impl);
            assert.equal('object', typeof service._accessController);
            assert.equal('object', typeof service._httpServer);

            // Verify routes
            const routes = getRoutes(service._impl);
            //console.log(routes);

            const ROUTES = [ [ 'GET', '/' ] ];
            assert.equal(1, routes.length);
            assert.equal(ROUTES.length, routes.length);

            routes.forEach((r, index)=>{
                assert.equal(2, r.length);
                assert.equal(ROUTES[index][0], r[0]);
                assert.equal(ROUTES[index][1], r[1]);
            });
        });

        it('Query, url: /notExistingRoute', (done)=>{
            ajax.text.get(SESSION, DOMAIN, 'notExistingRoute', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert.equal(err, 404);
                assert(!session);
                assert.equal(result, "Can't find requested url:/notExistingRoute");
                done();
            });
        });

        it('Query, url /', (done)=>{
            ajax.text.get(SESSION, DOMAIN, '', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert(!err);
                assert(!session);
                assert.equal('Root page', result);
                done();
            });
        });

        it('#Http.start, 2nd time', (done)=>{
            assert.equal(true, service.isStarted);
            api.app_server.services.Http.assertIsStarted(service);

            service.start((err)=>{
                assert(err);
                assert.equal('Service is already started', err);
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
            assert(!service.model);

            // Verify details
            assert.equal('function', typeof service._impl);
            assert.equal('object', typeof service._accessController);
            assert.equal('object', typeof service._httpServer);

            // Verify routes
            const routes = getRoutes(service._impl);
            //console.log(routes);

            const ROUTES = [ [ 'GET', '/' ] ];
            assert.equal(1, routes.length);
            assert.equal(ROUTES.length, routes.length);

            routes.forEach((r, index)=>{
                assert.equal(2, r.length);
                assert.equal(ROUTES[index][0], r[0]);
                assert.equal(ROUTES[index][1], r[1]);
            });
        });

        it('Query, url: /notExistingRoute', (done)=>{
            ajax.text.get(SESSION, DOMAIN, 'notExistingRoute', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert.equal(err, 404);
                assert(!session);
                assert.equal(result, "Can't find requested url:/notExistingRoute");
                done();
            });
        });

        it('Query, url /', (done)=>{
            ajax.text.get(SESSION, DOMAIN, '', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert(!err);
                assert(!session);
                assert.equal('Root page', result);
                done();
            });
        });

        it('#Http.stop, 1st time', (done)=>{
            assert.equal(true, service.isStarted);
            api.app_server.services.Http.assertIsStarted(service);

            service.stop((err)=>{
                assert(!err);
                assert.equal(false, service.isStarted);
                api.app_server.services.Http.assertIsStopped(service);
                done();
            });
        });

        it('Query, url /', (done)=>{
            ajax.text.get(SESSION, DOMAIN, '', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert.equal('Error: connect ECONNREFUSED 127.0.0.1:3000', err);
                assert(!session);
                assert(!result);
                done();
            });
        });

        it('#Http.stop, 2nd time', (done)=>{
            assert.equal(false, service.isStarted);
            api.app_server.services.Http.assertIsStopped(service);

            service.stop((err)=>{
                assert(!err);
                assert.equal(false, service.isStarted);
                api.app_server.services.Http.assertIsStopped(service);
                done();
            });
        });
    });

});

