'use strict';

describe('lib.Application', function() {

    const assert = require('assert');
    const re = (module)=>{ return require('../' + module); }

    let Application, OLD_APP_ROOT;
    before(()=>{
        OLD_APP_ROOT = process.env.APP_ROOT;
        process.env.APP_ROOT = process.env.APP_ROOT + '/src/lib/tsrc/app1';
        Application = re('Application');
    });

    after(()=>{
        process.env.APP_ROOT = OLD_APP_ROOT;
    });

    const openModel = function(api, cb) {
        assert.equal('undefined', typeof api.model);
        api.model = {}
        api.model.list = ['a', 'b', 'c'];
        setImmediate(cb);
    }

    const OPTS = {
        openModel:openModel
    };

    describe('Close unopen app', ()=>{
        it('#Application.close', (done)=>{
            const app = new Application();
            assert.equal(false, app.isOpen());

            app.close(()=>{
                assert.equal(false, app.isOpen());
                done();
            });
        });
    });

    describe('Open app and close it', ()=>{

        let app;
        before(()=>{
            app = new Application(OPTS);
        });

        it('#Application.open', (done)=>{
            assert.equal(false, app.isOpen());
            Application.assertAppIsClosed(app);

            app.open(()=>{
                assert.equal(true, app.isOpen());
                Application.assertAppIsOpen(app);
                done();
            });
        });

        it('#Verify app.config', ()=>{
            assert.equal(4, Object.keys(app.config).length);

            // Verify db setup 
            assert.equal('object', typeof app.config.databases);
            assert.equal(1, Object.keys(app.config.databases).length);
            assert.equal('object', typeof app.config.databases.db1);
            assert.equal(5, Object.keys(app.config.databases.db1).length);
            assert.equal('postgres', app.config.databases.db1.user);
            assert.equal('127.0.0.1', app.config.databases.db1.host);
            assert.equal('stuff', app.config.databases.db1.database);
            assert.equal('somepwd', app.config.databases.db1.password);
            assert.equal('5432', app.config.databases.db1.port);

            // Verify logger setup
            assert.equal('object', typeof app.config.log);
            assert.equal(3+2, Object.keys(app.config.log).length);
            assert.equal(app.config.log.writeIntervalMs, 5000);
            assert.equal(app.config.log.writeBufferBytes, 128 * 1024);
            const STREAMS = ['system', 'fatal', 'error', 'warn', 'info', 'debug', 'access'];
            assert.equal(STREAMS.length, app.config.log.streams.length);
            assert.equal(STREAMS.length, 7);
            app.config.log.streams.forEach((s)=>{
                assert.notEqual(-1, STREAMS.indexOf(s));
            });
            assert.equal('string', typeof app.config.log.path);
            assert.equal('access', app.config.log.type);

            // Verify module
            assert.equal('object', typeof app.config.module.setup);
            assert.equal(2, Object.keys(app.config.module.setup).length);
            assert.equal('module1', app.config.module.setup.name);
            assert.equal(1000, app.config.module.setup.timeout);
             
            // Verify submodule
            assert.equal('object', typeof app.config.module.submodule);
            assert.equal('object', typeof app.config.module.submodule.setup);
            assert.equal(3, Object.keys(app.config.module.submodule.setup).length);
            assert.equal('module2', app.config.module.submodule.setup.name);
            assert.equal('somesrc', app.config.module.submodule.setup.src);
            assert.equal('somedst', app.config.module.submodule.setup.dst);

            // Verify services are here
            assert.equal('object', typeof app.config.application.services);
        });

        it('#Verify logger', ()=>{
            assert.equal('object', typeof app._loggerFs);
        });

        it('#Verify model', ()=>{
            assert.equal('object', typeof app._api.model);
            assert.equal('object', typeof app._api.model.list);
        });

        it('Verify http service', ()=>{
            // Verify configuration
            assert.equal('object', typeof app.config.application.services.http);
            assert.equal(4, Object.keys(app.config.application.services.http).length);
            assert.equal('3001', app.config.application.services.http.port);
            assert.equal('tmp.key', app.config.application.services.http.key);
            assert.equal('tmp.cert', app.config.application.services.http.cert);
            assert.equal('object', typeof app.config.application.services.http.session);
            assert.equal('anysecret', app.config.application.services.http.session.secret);
            assert.equal(24*60*60*1000*14, app.config.application.services.http.session.age);

            const http = app._services.http;
            assert.equal('object', typeof http);
            assert.equal('function', typeof http._impl);
            assert.equal('object', typeof http._accessController);

            const getRoutes = re('testTools/express/getRoutes')(1);
            const routes = getRoutes(http._impl);
            //console.log(routes);

            const ROUTES = [ [ 'GET', '/' ], [ 'GET', '/hello' ], [ 'GET', '/news' ] ];
            assert.equal(3, routes.length);
            assert.equal(ROUTES.length, routes.length);

            routes.forEach((r, index)=>{
                assert.equal(2, r.length);
                assert.equal(ROUTES[index][0], r[0]);
                assert.equal(ROUTES[index][1], r[1]);
            });
        });

        it('#Application.close', (done)=>{
            assert.equal(true, app.isOpen());
            app.close(()=>{
                assert.equal(false, app.isOpen());
                Application.assertAppIsClosed(app);
                done();
            });
        });
    });

    describe('Open app for many times', ()=>{

        let app;
        before(()=>{
            app = new Application(OPTS);
        });

        after((done)=>{
            app.close(done);
        });

        it('#Application.open, 1st time', (done)=>{
            assert.equal(false, app.isOpen());
            Application.assertAppIsClosed(app);
            app.open(()=>{
                assert.equal(true, app.isOpen());
                Application.assertAppIsOpen(app);
                done();
            });
        });

        it('#Application.open, 2nd time', (done)=>{
            assert.equal(true, app.isOpen());
            Application.assertAppIsOpen(app);
            app.open((err)=>{
                assert(err);
                assert.equal(true, app.isOpen());
                Application.assertAppIsOpen(app);
                done();
            });
        });

        it('#Application.open, 3rd time', (done)=>{
            assert.equal(true, app.isOpen());
            Application.assertAppIsOpen(app);
            app.open((err)=>{
                assert(err);
                assert.equal(true, app.isOpen());
                Application.assertAppIsOpen(app);
                done();
            });
        });
    });

    describe('Open/close app for many times', ()=>{

        let app;
        before(()=>{
            app = new Application(OPTS);
        });

        after((done)=>{
            app.close(done);
        });

        it('#Application.open, 1st time', (done)=>{
            assert.equal(false, app.isOpen());
            Application.assertAppIsClosed(app);
            app.open(()=>{
                assert.equal(true, app.isOpen());
                Application.assertAppIsOpen(app);
                done();
            });
        });

        it('#Application.close', (done)=>{
            assert.equal(true, app.isOpen());
            app.close((err)=>{
                assert(!err);
                assert.equal(false, app.isOpen());
                Application.assertAppIsClosed(app);
                done();
            });
        });

        it('#Application.open, 2nd time', (done)=>{
            assert.equal(false, app.isOpen());
            Application.assertAppIsClosed(app);
            app.open((err)=>{
                assert(!err);
                assert.equal(true, app.isOpen());
                Application.assertAppIsOpen(app);
                done();
            });
        });

        it('#Application.close', (done)=>{
            assert.equal(true, app.isOpen());
            app.close(()=>{
                assert.equal(false, app.isOpen());
                Application.assertAppIsClosed(app);
                done();
            });
        });

        it('#Application.open, 3rd time', (done)=>{
            assert.equal(false, app.isOpen());
            Application.assertAppIsClosed(app);
            app.open((err)=>{
                assert(!err);
                assert.equal(true, app.isOpen());
                Application.assertAppIsOpen(app);
                done();
            });
        });

        it('#Application.close', (done)=>{
            assert.equal(true, app.isOpen());
            app.close(()=>{
                assert.equal(false, app.isOpen());
                Application.assertAppIsClosed(app);
                done();
            });
        });
    });
});

