'use strict';

describe('yeap_app_server.Application', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../' + module); }

    let Application, getRoutes;
    before(()=>{
        const api = re('index');
        getRoutes = api.express.getRoutes;
        process.env.APP_ROOT = __dirname + '/app1';
        Application = re('Application');
    });

    after(()=>{
        process.env.APP_ROOT = undefined;
    });

    const openModel = function(api, cb) {
        assert.equal('undefined', typeof api.model, 'model must NOT be part of api');
        const model = {}
        model.list = ['a', 'b', 'c'];
        setImmediate(()=>{cb(undefined, model)});
    }

    const closeModel = function(api, model, cb) {
        setImmediate(cb);
    }

    const OPTS = {
        openModel:openModel,
        closeModel:closeModel
    };

    describe('Close unopen app', ()=>{
        it('#Application.close', (done)=>{
            const app = new Application();
            assert.equal(false, app.isOpen);

            app.close(()=>{
                assert.equal(false, app.isOpen);
                done();
            });
        });
    });

    describe('Prepare databases', ()=>{
        it('Create database', (done)=>{
            const db = require('yeap_db');
            assert(db.postgres.helpers);
            const databases = require('./app1/config/databases');

            let foreach = (index, container, foo, cb)=>{
                if(index < container.length) {
                    foo(container[index], ()=>{
                        foreach(index+1, container, foo, cb);
                    });
                } else {
                    cb();
                }
            }

            const entries = Object.entries(databases);
            foreach(0, entries, (d, complete)=>{
                const dbAlias = d[0];
                const dbProps = d[1];
                assert(dbProps.schema);
                db[dbProps.schema].helpers.create(dbProps, dbProps.database, (err)=>{
                    assert(!err);
                    complete();
                });
            }, done);
        });
    });

    describe('Open app and close it', ()=>{
        let app;
        before(()=>{
            app = new Application(OPTS);
        });

        it('Check g_application', ()=>{
            assert(!global.g_application);
        });

        it('#Application.open', (done)=>{
            assert.equal(false, app.isOpen);
            Application.assertAppIsClosed(app);

            app.open(()=>{
                assert.equal(true, app.isOpen);
                Application.assertAppIsOpen(app);
                done();
            });
        });

        it('Check g_application', ()=>{
            assert(g_application);
            assert(g_application.config);
            assert(g_application.config.databases);
            assert(g_application.config.services);
            assert(g_application.config.services.http);
            assert(g_application.model);
            assert(g_application.services);
            assert(g_application.services.http);
        });

        it('#Verify app.config', ()=>{
            assert.equal(4, Object.keys(app.config).length);

            // Verify db setup 1st database
            assert.equal('object', typeof app.config.databases);
            assert.equal(2, Object.keys(app.config.databases).length);

            assert.equal('object', typeof app.config.databases.db1);
            assert.equal(6, Object.keys(app.config.databases.db1).length);
            assert.equal('postgres', app.config.databases.db1.schema);
            assert.equal('test1234', app.config.databases.db1.user);
            assert.equal('127.0.0.1', app.config.databases.db1.host);
            assert.equal('ut_yeap_app_server_application_db1', app.config.databases.db1.database);
            assert.equal('test1234', app.config.databases.db1.password);
            assert.equal('5432', app.config.databases.db1.port);

            assert.equal('object', typeof app.config.databases.db2);
            assert.equal(6, Object.keys(app.config.databases.db2).length);
            assert.equal('mysql', app.config.databases.db2.schema);
            assert.equal('root', app.config.databases.db2.user);
            assert.equal('127.0.0.1', app.config.databases.db2.host);
            assert.equal('ut_yeap_app_server_application_db2', app.config.databases.db2.database);
            assert.equal('test1234', app.config.databases.db2.password);
            assert.equal('3306', app.config.databases.db2.port);

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
            assert.equal('object', typeof app.config.services);
        });

        it('#Verify logger', ()=>{
            assert.equal('object', typeof app._loggerFs);
        });

        it('#Verify model', ()=>{
            assert.equal('object', typeof app._model);
            assert.equal('object', typeof app._model.list);
        });

        it('Verify http service', ()=>{
            // Verify configuration
            assert.equal('object', typeof app.config.services.http);
            assert.equal(4, Object.keys(app.config.services.http).length);
            assert.equal('3001', app.config.services.http.port);
            assert.equal('tmp.key', app.config.services.http.key);
            assert.equal('tmp.cert', app.config.services.http.cert);
            assert.equal('object', typeof app.config.services.http.session);
            assert.equal('anysecret', app.config.services.http.session.secret);
            assert.equal(24*60*60*1000*14, app.config.services.http.session.age);

            const http = app.services.http;
            assert.equal('object', typeof http);
            assert.equal('function', typeof http._impl);
            assert.equal('object', typeof http._accessController);

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
            assert.equal(true, app.isOpen);
            app.close(()=>{
                assert.equal(false, app.isOpen);
                Application.assertAppIsClosed(app);
                done();
            });
        });

        it('Check g_application', ()=>{
            assert(!g_application);
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
            assert.equal(false, app.isOpen);
            Application.assertAppIsClosed(app);
            app.open(()=>{
                assert.equal(true, app.isOpen);
                Application.assertAppIsOpen(app);
                done();
            });
        });

        it('Verify databases', ()=>{
            assert(app.databases);
            assert(app.databases.connections);
            assert(app.databases.connections.db1);
            assert(app.databases.connections.db2);
        });

        it('#Application.open, 2nd time', (done)=>{
            assert.equal(true, app.isOpen);
            Application.assertAppIsOpen(app);
            app.open((err)=>{
                assert(err);
                assert.equal(true, app.isOpen);
                Application.assertAppIsOpen(app);
                done();
            });
        });

        it('#Application.open, 3rd time', (done)=>{
            assert.equal(true, app.isOpen);
            Application.assertAppIsOpen(app);
            app.open((err)=>{
                assert(err);
                assert.equal(true, app.isOpen);
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
            assert.equal(false, app.isOpen);
            Application.assertAppIsClosed(app);
            app.open(()=>{
                assert.equal(true, app.isOpen);
                Application.assertAppIsOpen(app);
                done();
            });
        });

        it('#Application.close', (done)=>{
            assert.equal(true, app.isOpen);
            app.close((err)=>{
                assert(!err);
                assert.equal(false, app.isOpen);
                Application.assertAppIsClosed(app);
                done();
            });
        });

        it('#Application.open, 2nd time', (done)=>{
            assert.equal(false, app.isOpen);
            Application.assertAppIsClosed(app);
            app.open((err)=>{
                assert(!err);
                assert.equal(true, app.isOpen);
                Application.assertAppIsOpen(app);
                done();
            });
        });

        it('#Application.close', (done)=>{
            assert.equal(true, app.isOpen);
            app.close(()=>{
                assert.equal(false, app.isOpen);
                Application.assertAppIsClosed(app);
                done();
            });
        });

        it('#Application.open, 3rd time', (done)=>{
            assert.equal(false, app.isOpen);
            Application.assertAppIsClosed(app);
            app.open((err)=>{
                assert(!err);
                assert.equal(true, app.isOpen);
                Application.assertAppIsOpen(app);
                done();
            });
        });

        it('#Application.close', (done)=>{
            assert.equal(true, app.isOpen);
            app.close(()=>{
                assert.equal(false, app.isOpen);
                Application.assertAppIsClosed(app);
                done();
            });
        });
    });
});

