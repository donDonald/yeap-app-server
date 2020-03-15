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
            assert.equal('object', typeof app.config.application);
            assert.equal('3001', app.config.application.port);

            // Verify db setup 
            assert.equal('object', typeof app.config.databases);
            assert.equal('postgres', app.config.databases.db1.user);
            assert.equal('127.0.0.1', app.config.databases.db1.host);
            assert.equal('stuff', app.config.databases.db1.database);
            assert.equal('somepwd', app.config.databases.db1.password);
            assert.equal('5432', app.config.databases.db1.port);

            // Verify logger setup
            assert.equal('object', typeof app.config.log);
            assert.equal(app.config.log.writeIntervalMs, 5000);
            assert.equal(app.config.log.writeBufferBytes, 128 * 1024);
            const STREAMS = ['system', 'fatal', 'error', 'warn', 'info', 'debug', 'access'];
            assert.equal(STREAMS.length, app.config.log.streams.length);
            assert.equal(STREAMS.length, 7);
            app.config.log.streams.forEach((s)=>{
                assert.notEqual(-1, STREAMS.indexOf(s));
            });

            // Verify session setup
            assert.equal('app1secret', app.config.session.secret);
            assert.equal(24*60*60*1000, app.config.session.age);
        });

        it('#Verify logger', ()=>{
            assert.equal('object', typeof app._loggerFs);
        });

        it('#Verify model', ()=>{
            assert.equal('object', typeof app._api.model);
            assert.equal('object', typeof app._api.model.list);
        });

        it('#Verify routes', ()=>{
            assert.equal('function', typeof app._impl);
            assert.equal('object', typeof app._accessController);

            const getRoutes = re('testTools/express/getRoutes')(1);
            const routes = getRoutes(app._impl);
            console.log(routes);

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

