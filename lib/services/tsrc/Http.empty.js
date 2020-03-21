'use strict';

describe('lib.services.Http, Empty service, root route only, no SSL, no access.js, no validator.js', function() {

    const assert = require('assert');
    const re = (module)=>{ return require('../../' + module); }

    let api, Http;
    before(()=>{
        api = {};
        api.fs = require('fs');
        api.lib = re('exports')(api);
        Http = re('services/Http')(api);
    });

    const loggerSetup = ()=>{
        const loggerCfg = {
            writeIntervalMs: 5000, // 5 secs
            writeBufferBytes: 128 * 1024, // Buffer size 128kb
            streams: ['system', 'fatal', 'error', 'warn', 'info', 'debug', 'access']
        };
        loggerCfg.path = api.lib.env.makePath('logs');
        const loggerFs = new api.lib.LoggerFs(loggerCfg);
        loggerFs.open();
        return loggerFs;
    }

    const loggerTeardown = (service, cb)=>{
        api.lib.log.setNext();
        const loggerFs = service.loggerFs;
        assert(loggerFs);
        assert.equal('object', typeof loggerFs);
        loggerFs.close((err)=>{
            assert(!err)
            cb();
        });
    }

    const loadCertificatesImpl = function(opts) {
        return {};
    }

    const httpGet = (url, cb)=>{
        assert(url);
        assert(cb);

        const http = require('http');
        http.get(url, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', (err) => {
                cb(undefined, data);
            });

        }).on("error", (err) => {
            cb(err.message);
        });
    }



    let OLD_APP_ROOT;
    before(()=>{
        OLD_APP_ROOT = process.env.APP_ROOT;
        process.env.APP_ROOT = process.env.APP_ROOT + '/src/lib/services/tsrc/test.Http.empty';
    });

    after(()=>{
        process.env.APP_ROOT = OLD_APP_ROOT;
    });



    describe('Stop not-yet-started service', ()=>{
        it('#Http.stop', (done)=>{
            const service = new Http();
            assert.equal(false, service.isStarted());
            Http.assertIsStopped(service);

            service.stop((err)=>{
                assert(!err)
                assert.equal(false, service.isStarted());
                Http.assertIsStopped(service);
                done();
            });
        });
    });



    describe('Start and stop', ()=>{
        let service, loggerFs;
        before((done)=>{
            service = new Http();
            loggerFs = loggerSetup();
            done();
        });
        after((done)=>{
            loggerTeardown(service, done);
        });

        it('#Http.start', (done)=>{
            assert.equal(false, service.isStarted());
            Http.assertIsStopped(service);

            const opts = {
                api:api,
                config:{
                    port:      3001,
                },
                loadCertificates: loadCertificatesImpl,
                loggerFs: loggerFs
            };

            service.start(opts, (err)=>{
                assert(!err);
                assert.equal(true, service.isStarted());
                Http.assertIsStarted(service);
                done();
            });
        });

        it('Verify service', ()=>{
            // Verify configuration
            assert.equal(1, Object.keys(service.config).length);
            assert.equal('3001', service.config.port);

            assert.equal('function', typeof service._impl);
            assert.equal('object', typeof service._accessController);

            const getRoutes = re('testTools/express/getRoutes')(1);
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

        it('Query /notExistingRoute', (done)=>{
            httpGet('http://localhost:3001/notExistingRoute', (err, data)=>{
                assert(!err);
                assert.equal('Can\'t find requested url:/notExistingRoute', data);
                done();
            });
        });

        it('Query /', (done)=>{
            httpGet('http://localhost:3001/', (err, data)=>{
                assert(!err);
                //console.log(data);
                assert.equal('Root page', data);
                done();
            });
        });

        it('#Http.stop', (done)=>{
            assert.equal(true, service.isStarted());
            Http.assertIsStarted(service);

            service.stop((err)=>{
                assert(!err);
                assert.equal(false, service.isStarted());
                Http.assertIsStopped(service);
                done();
            });
        });
    });



    describe('Start twise and stop twise', ()=>{
        let service, loggerFs;
        before((done)=>{
            service = new Http();
            loggerFs = loggerSetup();
            done();
        });
        after((done)=>{
            loggerTeardown(service, done);
        });

        it('#Http.start, 1st time', (done)=>{
            assert.equal(false, service.isStarted());
            Http.assertIsStopped(service);

            const opts = {
                api:api,
                config:{
                    port:      3001,
                },
                loadCertificates: loadCertificatesImpl,
                loggerFs: loggerFs
            };

            service.start(opts, (err)=>{
                assert(!err);
                assert.equal(true, service.isStarted());
                Http.assertIsStarted(service);
                done();
            });
        });

        it('Verify service', ()=>{
            // Verify configuration
            assert.equal(1, Object.keys(service.config).length);
            assert.equal('3001', service.config.port);

            assert.equal('function', typeof service._impl);
            assert.equal('object', typeof service._accessController);

            const getRoutes = re('testTools/express/getRoutes')(1);
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

        it('Query /notExistingRoute', (done)=>{
            httpGet('http://localhost:3001/notExistingRoute', (err, data)=>{
                assert(!err);
                assert.equal('Can\'t find requested url:/notExistingRoute', data);
                done();
            });
        });

        it('Query /', (done)=>{
            httpGet('http://localhost:3001/', (err, data)=>{
                assert(!err);
                //console.log(data);
                assert.equal('Root page', data);
                done();
            });
        });

        it('#Http.start, 2nd time', (done)=>{
            assert.equal(true, service.isStarted());
            Http.assertIsStarted(service);

            const opts = {
                api:api,
                config:{
                    port:      3001,
                },
                loadCertificates: loadCertificatesImpl,
                loggerFs: loggerFs
            };

            service.start(opts, (err)=>{
                assert(err);
                assert.equal('Service is already started', err);
                assert.equal(true, service.isStarted());
                Http.assertIsStarted(service);
                done();
            });
        });

        it('Verify service', ()=>{
            // Verify configuration
            assert.equal(1, Object.keys(service.config).length);
            assert.equal('3001', service.config.port);

            assert.equal('function', typeof service._impl);
            assert.equal('object', typeof service._accessController);

            const getRoutes = re('testTools/express/getRoutes')(1);
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

        it('Query /notExistingRoute', (done)=>{
            httpGet('http://localhost:3001/notExistingRoute', (err, data)=>{
                assert(!err);
                assert.equal('Can\'t find requested url:/notExistingRoute', data);
                done();
            });
        });

        it('Query /', (done)=>{
            httpGet('http://localhost:3001/', (err, data)=>{
                assert(!err);
                //console.log(data);
                assert.equal('Root page', data);
                done();
            });
        });

        it('#Http.stop, 1st time', (done)=>{
            assert.equal(true, service.isStarted());
            Http.assertIsStarted(service);

            service.stop((err)=>{
                assert(!err);
                assert.equal(false, service.isStarted());
                Http.assertIsStopped(service);
                done();
            });
        });

        it('Query /', (done)=>{
            httpGet('http://localhost:3001/', (err, data)=>{
                assert.equal('connect ECONNREFUSED 127.0.0.1:3001', err);
                assert(!data)
                done();
            });
        });

        it('#Http.stop, 2nd time', (done)=>{
            assert.equal(false, service.isStarted());
            Http.assertIsStopped(service);

            service.stop((err)=>{
                assert(!err);
                assert.equal(false, service.isStarted());
                Http.assertIsStopped(service);
                done();
            });
        });
    });

});

