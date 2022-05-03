'use strict';

describe('lib.services.Http, Empty service, root route only, no SSL, no access.js, no validator.js', function() {

    const assert = require('assert');
    const re = (module)=>{ return require('../../' + module); }

    let api, helpers, getRoutes;
    before(()=>{
        api = re('index');
        getRoutes = api.lib.express.getRoutes;
        helpers = require('./helpers')(api);
    });

    const loadCertificatesImpl = function(opts) {
        return {};
    }

    const DOMAIN = 'http://localhost:3000';
    const SESSION = undefined;

    let OLD_APP_ROOT;
    before(()=>{
        OLD_APP_ROOT = process.env.APP_ROOT;
        process.env.APP_ROOT = process.env.APP_ROOT + '/lib/services/tsrc/test.Http.empty';
    });

    after(()=>{
        process.env.APP_ROOT = OLD_APP_ROOT;
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
            service = new api.app_server.services.Http();
            loggerFs = helpers.loggerSetup();
            done();
        });
        after((done)=>{
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

            service.start(opts, (err)=>{
                assert(!err);
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
            api.lib.ajax.get(SESSION, DOMAIN, 'notExistingRoute', {}, {}, function(err, session, result) {
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
            api.lib.ajax.get(SESSION, DOMAIN, '', {}, {}, function(err, session, result) {
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
            service = new api.app_server.services.Http();
            loggerFs = helpers.loggerSetup();
            done();
        });
        after((done)=>{
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

            service.start(opts, (err)=>{
                assert(!err);
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
            api.lib.ajax.get(SESSION, DOMAIN, 'notExistingRoute', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert.equal(err, 'Error, status=404');
                assert(!session);
                assert(!result);
                done();
            });
        });

        it('Query, url /', (done)=>{
            api.lib.ajax.get(SESSION, DOMAIN, '', {}, {}, function(err, session, result) {
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

            const opts = {
                api:api,
                config:{
                    port:      3000,
                },
                loadCertificates: loadCertificatesImpl,
                loggerFs: loggerFs
            };

            service.start(opts, (err)=>{
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
            api.lib.ajax.get(SESSION, DOMAIN, 'notExistingRoute', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert.equal(err, 'Error, status=404');
                assert(!session);
                assert(!result);
                done();
            });
        });

        it('Query, url /', (done)=>{
            api.lib.ajax.get(SESSION, DOMAIN, '', {}, {}, function(err, session, result) {
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
            api.lib.ajax.get(SESSION, DOMAIN, '', {}, {}, function(err, session, result) {
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

