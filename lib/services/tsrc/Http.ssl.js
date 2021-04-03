'use strict';

describe('lib.services.Http, testing SSL', function() {

    const assert = require('assert');
    const re = (module)=>{ return require('../../' + module); }

    let api, Http, helpers;
    before(()=>{
        api = {};
        api.fs = require('fs');
        api.zlib = require('zlib');
        api.stream = require('stream');
        api.path = require('path');
        api.https = require('https');
        api.lib = re('exports')(api);
        Http = re('services/Http')(api);
        helpers = require('./helpers')(api);
    });

    const loadConfig = function() {
        console.log('loadConfig()');
        const path = api.path.join('config', 'application.js');
        const config = api.lib.re(path);
        assert(config.services.http);
        return config.services.http;
    }

    const loadCertificatesImpl = function(config) {
        console.log('loadCertificatesImpl(), config:', config);
        if (config && config.key && config.cert) {
            const certFile = api.lib.env.makePath(config.cert);
            const keyFile  = api.lib.env.makePath(config.key);
            console.log('loadCertificatesImpl, cert file:' + certFile);
            console.log('loadCertificatesImpl, key file:' + keyFile);

            try {
                const key = api.fs.readFileSync(keyFile);
                const cert = api.fs.readFileSync(certFile);
                console.log('Certificate is loaded');
                return { key, cert };
            } catch (e) {
                console.log('Certificate is not found');
                return undefined;
            }
        } else {
            console.log('Certificate is not given, no SSL');
            return undefined;
        }
    }

    const MODEL = {};
    MODEL.orders = {
        '1':{client:'Pablo'},
        '2':{client:'Nata'},
        '3':{client:'Vera'},
        '4':{client:'Pedro'},
        '5':{client:'Pussy'},
    };
    const DOMAIN = 'https://localhost:3001';
    const SESSION = undefined;

    const enableSelfSignedCertificate = ()=>{
        // Uncaught AssertionError [ERR_ASSERTION]: Error: self signed certificate
        // https://stackoverflow.com/questions/20433287/node-js-request-cert-has-expired#answer-29397100
        // const request = require('request').defaults({strictSSL: false}); disabling strictSSL is not secure, any https is volnurable in this case
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    const disableSelfSignedCertificate = ()=>{
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    }

    let OLD_APP_ROOT;
    before(()=>{
        OLD_APP_ROOT = process.env.APP_ROOT;
        process.env.APP_ROOT = process.env.APP_ROOT + '/lib/services/tsrc/test.Http.ssl';
        enableSelfSignedCertificate();
    });

    after(()=>{
        process.env.APP_ROOT = OLD_APP_ROOT;
        disableSelfSignedCertificate();
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
            loggerFs = helpers.loggerSetup();
            done();
        });
        after((done)=>{
            helpers.loggerTeardown(service, done);
        });

        it('#Http.start', (done)=>{
            assert.equal(false, service.isStarted());
            Http.assertIsStopped(service);

            const opts = {
                api:api,
                config: loadConfig(),
                loadCertificates: loadCertificatesImpl,
                loggerFs: loggerFs,
                model:MODEL
            };

            service.start(opts, (err)=>{
                assert(!err, err);
                assert.equal(true, service.isStarted());
                Http.assertIsStarted(service);
                done();
            });
        });

        it('Verify service', ()=>{
            // Verify configuration
            assert.equal(4, Object.keys(service.config).length);
            assert.equal('3001', service.config.port);
            assert.equal('config/ssl/test.key', service.config.key);
            assert.equal('config/ssl/test.cert', service.config.cert);
            assert.equal(2, Object.keys(service.config.session).length);
            assert.equal('noway', service.config.session.secret);
            assert.equal(24*60*60*1000, service.config.session.age);

            // Verify model
            assert(service.model);

            // Verify details
            assert.equal('function', typeof service._impl);
            assert.equal('object', typeof service._impl.zzz);
            assert.equal('object', typeof service._accessController);
            assert.equal('object', typeof service._httpServer);

            // Verify routes
            const getRoutes = re('testTools/express/getRoutes')(1);
            const routes = getRoutes(service._impl);
            //console.log(routes);

            const ROUTES = [ [ 'GET', '/' ], ['GET', '/orders'] ];
            assert.equal(2, routes.length);
            assert.equal(ROUTES.length, routes.length);

            routes.forEach((r, index)=>{
                assert.equal(2, r.length);
                assert.equal(ROUTES[index][0], r[0]);
                assert.equal(ROUTES[index][1], r[1]);
            });
        });

        it('Query, url: /', (done)=>{
            api.lib.ajax.get(SESSION, DOMAIN, '', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert(!err, err);
                assert(!session);
                assert.equal('Home page', result);
                done();
            });
        });

        it('Query, url: /orders', (done)=>{
            api.lib.ajax.json.get(SESSION, DOMAIN, 'orders', {}, {}, function(err, session, result) {
                //console.log('err:', err);
                //console.log('session:', session);
                //console.log('result:', result);
                assert(!err, err);
                assert(!session);
                assert(result);

                assert.equal(5, Object.keys(result).length);
                assert.equal('Pablo', result['1'].client);
                assert.equal('Nata', result['2'].client);
                assert.equal('Vera', result['3'].client);
                assert.equal('Pedro', result['4'].client);
                assert.equal('Pussy', result['5'].client);
                done();
            });
        });

        it('#Http.stop', (done)=>{
            assert.equal(true, service.isStarted());
            Http.assertIsStarted(service);

            service.stop((err)=>{
                assert(!err, err);
                assert.equal(false, service.isStarted());
                Http.assertIsStopped(service);
                done();
            });
        });
    });

});

