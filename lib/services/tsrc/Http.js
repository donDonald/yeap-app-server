'use strict';

describe('lib.services.Http', function() {

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



/*
    describe('No SSL, no routes', ()=>{
        let OLD_APP_ROOT;
        before(()=>{
            OLD_APP_ROOT = process.env.APP_ROOT;
            process.env.APP_ROOT = process.env.APP_ROOT + '/src/lib/services/tsrc/test1-no-routes';
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
                assert.equal(0, routes.length);
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



    describe('No SSL, some routes, no access.js, no validator.js', ()=>{
        let OLD_APP_ROOT;
        before(()=>{
            OLD_APP_ROOT = process.env.APP_ROOT;
            process.env.APP_ROOT = process.env.APP_ROOT + '/src/lib/services/tsrc/test2-some-routes';
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

            it('Query /users', (done)=>{
                httpGet('http://localhost:3001/users', (err, data)=>{
                    assert(!err);
                    //console.log(data);
                    const users = JSON.parse(data);
                    //console.log(users);
                    assert.equal(3, Object.keys(users).length)

                    assert(users.userA);
                    assert(users.userB);
                    assert(users.userC);
                    done();
                });
            });

            it('Query /users/userA', (done)=>{
                httpGet('http://localhost:3001/users/userA', (err, data)=>{
                    assert(!err);
                    //console.log(data);
                    const user = JSON.parse(data);
                    //console.log(user);
                    assert.equal(2, Object.keys(user).length)

                    assert.equal(user.alias, 'Pedro');
                    assert.equal(user.age, 46);
                    done();
                });
            });

            it('Query /users/userB', (done)=>{
                httpGet('http://localhost:3001/users/userB', (err, data)=>{
                    assert(!err);
                    //console.log(data);
                    const user = JSON.parse(data);
                    //console.log(user);
                    assert.equal(2, Object.keys(user).length)

                    assert.equal(user.alias, 'Mike');
                    assert.equal(user.age, 35);
                    done();
                });
            });

            it('Query /users/userC', (done)=>{
                httpGet('http://localhost:3001/users/userC', (err, data)=>{
                    assert(!err);
                    //console.log(data);
                    const user = JSON.parse(data);
                    //console.log(user);
                    assert.equal(2, Object.keys(user).length)

                    assert.equal(user.alias, 'Nata');
                    assert.equal(user.age, 24);
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

                const ROUTES = [ [ 'GET', '/' ], [ 'GET', '/users' ], [ 'GET', '/users/userA' ], [ 'GET', '/users/userB' ], [ 'GET', '/users/userC' ] ];
                assert.equal(5, routes.length);
                assert.equal(ROUTES.length, routes.length);

                routes.forEach((r, index)=>{
                    assert.equal(2, r.length);
                    assert.equal(ROUTES[index][0], r[0]);
                    assert.equal(ROUTES[index][1], r[1]);
                });
            });

            it('Query /users/userB', (done)=>{
                httpGet('http://localhost:3001/users/userB', (err, data)=>{
                    assert(!err);
                    //console.log(data);
                    const user = JSON.parse(data);
                    //console.log(user);
                    assert.equal(2, Object.keys(user).length)

                    assert.equal(user.alias, 'Mike');
                    assert.equal(user.age, 35);
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

            it('Query /users/userC', (done)=>{
                httpGet('http://localhost:3001/users/userC', (err, data)=>{
                    assert(!err);
                    //console.log(data);
                    const user = JSON.parse(data);
                    //console.log(user);
                    assert.equal(2, Object.keys(user).length)

                    assert.equal(user.alias, 'Nata');
                    assert.equal(user.age, 24);
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
*/



    describe('No SSL, some routes, access.js & validator.js are here', ()=>{
        let OLD_APP_ROOT;
        before(()=>{
            OLD_APP_ROOT = process.env.APP_ROOT;
            process.env.APP_ROOT = process.env.APP_ROOT + '/src/lib/services/tsrc/test3-some-routes-access-validators';
        });

        after(()=>{
            process.env.APP_ROOT = OLD_APP_ROOT;
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

    });

});

