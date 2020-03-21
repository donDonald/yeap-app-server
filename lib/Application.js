'use strict';

const assert = require('assert'),
      re = (module)=>{ return require('./' + module); },
      Impl = require('express');



const Application = function(opts) {
    if (opts) {
        this.openModel = opts.openModel;
        this.closeModel = opts.closeModel;
    }

    this.log = function() {
        return this._api.lib.log.ctx('Application');
    }
}



Application.prototype.isOpen = function() {
    return (typeof this._api !== 'undefined');
}



Application.prototype.open = function(cb) {
    if (this.isOpen()) {
        const api = this._api;
        const err = 'Application is already open';
        this.log().ctx('setup').error(err);
        setImmediate(()=>{cb(err)});
        return;
    }

    const load = (index, steps, cb)=>{
        if (index < steps.length) {
            const s = steps[index];
            s.call(undefined, (err)=>{
                if (err) {
                    cb(err);
                } else {
                    load(index+1, steps, cb);
                }
            });
        } else {
            cb();
        }
    }

    const steps = [
        (cb)=>{ this._loadLib(cb) },
        (cb)=>{ this._loadPlaces(cb) },
        (cb)=>{ this._openLogger(cb) },
        (cb)=>{ this._createImpl(cb) },
        (cb)=>{ this._openModel(cb) },
        (cb)=>{ this._loadRoutes(cb) },
        (cb)=>{ this._startServices(cb) },
    ];

    load(0, steps, (err)=>{
        const api = this._api;
        if (err) {
            this.log().ctx('setup').error('Opening application has failed:' + err);
            cb(err);
            return;
        }

        // Double check
        assert.equal('object', typeof this._api);
        assert.equal('object', typeof this.config);
        assert.equal('object', typeof this._loggerFs);
        assert.equal('function', typeof this._impl);
        assert.equal('object', typeof this._accessController);
        assert.equal('object', typeof this._services);

        this.log().ctx('setup').info('Opening application is complete');
        cb(err);
    });
}



Application.prototype.close = function(cb) {
    if (!this.isOpen()) {
        if (cb) setImmediate(cb);
        return;
    }

    const api = this._api;
    this.log().ctx('teardown').info('Closing...');

    const close = (index, steps, cb)=>{
        if (index < steps.length) {
            const s = steps[index];
            s.call(undefined, (err)=>{
                if (err) {
                    cb(err);
                } else {
                    close(index+1, steps, cb);
                }
            });
        } else {
            cb();
        }
    }

    const steps = [
        (cb)=>{ this._stopServices(cb) },
        (cb)=>{ this._unloadRoutes(cb) },
        (cb)=>{ this._closeModel(cb) },
        (cb)=>{ this._destroyImpl(cb) },
        (cb)=>{ this._closeLogger(cb) },
    ];

    close(0, steps, (err)=>{
        this.log().ctx('teardown').info('Closing is complete');
        this._api = undefined;
        this.config = undefined;

        // Double check
        assert.equal('undefined', typeof this._api);
        assert.equal('undefined', typeof this.config);
        assert.equal('undefined', typeof this._loggerFs);
        assert.equal('undefined', typeof this._impl);
        assert.equal('undefined', typeof this._accessController);
        assert.equal('undefined', typeof this._services);

        if (cb) {
            cb(err);
        }
    });
}



Application.STATIC_APIS = ['fs', 'path', 'https'];
Application.prototype._loadLib = function(cb) {
    this._api = {};
    const api = this._api;

    assert.equal('undefined', typeof api.lib);

    Application.STATIC_APIS.forEach((name)=>{
        api[name] = require(name);
    });

    api.lib = re('exports')(api);

console.log('RRRRRRRRRRRRR.1');
    this.log().ctx('setup').ctx('lib').info('Loading libraries...');
console.log('RRRRRRRRRRRRR.2');
    this.log().ctx('setup').ctx('lib').info('Loading libraries is complete');
    setImmediate(cb);
}



Application.PLACES = ['config'];
Application.prototype._loadPlaces = function(cb) {
    const api = this._api;
    this.log().ctx('setup').ctx('places').info('Loading places...');

    const loadFiles = (index, files, place, cb)=>{
        if (index < files.length) {
            const file = files[index];

            let relPath='';
            place.forEach((p)=>{
                relPath = api.path.join(relPath, p);
            });
            relPath = api.path.join(relPath, file);

            const path = api.lib.env.makePath(relPath);
            const stat = api.fs.lstatSync(path);
            if (stat.isDirectory()) {
                api.fs.readdir(path, (err, files2) => {
                    if (err) {
                        cb(`Failing loading dir:${path}, error:${err}`);
                    } else {
                        const newPlace = JSON.parse(JSON.stringify(place));
                        newPlace.push(file);
                        loadFiles(0, files2, newPlace, (err)=>{
                            if (err) {
                                cb(err);
                            } else {
                                loadFiles(index+1, files, place, cb);
                            }
                        });
                    }
                });
            } else if (stat.isFile() && path.endsWith('.js')) {
                this.log().ctx('setup').ctx('places').debug('loadFiles, path:' + path);

                let config = this;
                place.forEach((p)=>{
                    config[p] = config[p] || {};
                    config = config[p];
                });
                const name = file.substring(0, file.length-3);
                config[name] = api.lib.re(relPath);

                setImmediate(()=>{ loadFiles(index+1, files, place, cb); });
            } else {
                setImmediate(()=>{ loadFiles(index+1, files, place, cb); });
            }
        } else {
            cb();
        }
    }

    const loadPlaces = (index, places, cb)=>{
        if (index < places.length) {
            const place = places[index];
            const path = api.lib.env.makePath(place);
            this.log().ctx('setup').ctx('places').debug('loadPlaces, path:' + path);
            api.fs.readdir(path, (err, files) => {
                if (err) {
                    cb(`Failing loading place:${path}, error:${err}`);
                } else {
                    loadFiles(0, files, [place], (err)=>{
                        if (err) {
                            this.log().ctx('setup').ctx('places').error('Loading files has failed:' + err);
                        } else {
                            this.log().ctx('setup').ctx('places').info('Loading files is complete');
                        }
                        cb(err);
                    });
                }
            });
        } else {
            cb();
        }
    }

    loadPlaces(0, Application.PLACES, (err)=>{
        if (err) {
            this.log().ctx('setup').ctx('places').error('Loading places has failed:' + err);
            this.close((err)=>{
                cb(err);
            });
            return;
        }

        this.log().ctx('setup').ctx('places').info('Loading places is complete');
        cb(err);
    });
}



Application.prototype._openLogger = function(cb) {
    const api = this._api;
    this.log().ctx('setup').ctx('logger').info('Opening logger...');

    assert.equal('undefined', typeof this._loggerFs);
    this.config.log.path = api.lib.env.makePath('logs');
    this._loggerFs = new api.lib.LoggerFs(this.config.log);
    this._loggerFs.open();

    // Chaining lib.Logger and lib.LoggerFs
    api.lib.log.setNext(this._loggerFs._writeRaw.bind(this._loggerFs));

    this.log().ctx('setup').ctx('logger').info('Opening logger is complete');
    setImmediate(cb);
}



Application.prototype._closeLogger = function(cb) {
    const api = this._api;
    this.log().ctx('teardown').ctx('logger').info('Closing logger...');

    // Unchaining lib.Logger and lib.LoggerFs
    api.lib.log.setNext();

    const loggerFs = this._loggerFs;
    this._loggerFs = undefined;
    assert.equal('object', typeof loggerFs);
    loggerFs.close((err)=>{
        if (err) {
            this.log().ctx('teardown').ctx('logger').error(`Closing logger has failed, error:${err}`);
        } else {
            this.log().ctx('teardown').ctx('logger').info('Closing logger is complete');
        }
        cb(err);
    });
}



Application.prototype._createImpl = function(cb) {
    const api = this._api;
    this.log().ctx('setup').ctx('impl').info('Creating app impl(express)...');

    assert.equal('undefined', typeof this._impl);
    this._impl = Impl();

    // Setup view engine
    this._impl.set('views', api.lib.env.makePath('views'));
    this._impl.set('view engine', 'ejs');

    // Setup request logger MW
    assert(this._loggerFs.access, 'No access stream is specified');
    const logger  = this._loggerFs.access.bind(this._loggerFs);
    const requestLogger = api.lib.re('src/lib/requestLogger')(logger);
    this._impl.use(requestLogger);

    // Initialize cookie MW
    if (this.config.session && this.config.session.secret) {
        this.log().ctx('setup').ctx('impl').info('Session secret is set, initializing session MW...');
        this.log().ctx('setup').ctx('impl').info('session key:' + this.config.session.secret);
        this.log().ctx('setup').ctx('impl').info('session age:' + this.config.session.age);
        assert(this.config.session.age, 'Cookie is enabled but age is not set');
        const cookieSession = require('cookie-session');
        this._impl.use(cookieSession({
            keys: [this.config.session.secret],
            maxAge: this.config.session.age,
        }));
        this.log().ctx('setup').ctx('impl').info('Session secret is set, initializing session MW is complete');
    }

    // Initialize passport MW
    const passport = require('passport');
    this._impl.use(passport.initialize());
    this._impl.use(passport.session());

    // Setup body parser to support POST
    const bodyParser = require('body-parser');
    this._impl.use(bodyParser.json()); // support json encoded bodies
    this._impl.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

    this.log().ctx('setup').ctx('impl').info('Creating app impl(express) is complete');
    setImmediate(cb);
}



Application.prototype._destroyImpl = function(cb) {
    const api = this._api;
    this.log().ctx('teardown').ctx('impl').info('Destroying app impl(express)...');

    assert.equal('function', typeof this._impl);
    const impl = this._impl;
    this._impl = undefined;

    this.log().ctx('teardown').ctx('impl').info('Destroying app impl(express)...');
    setImmediate(cb);
}



Application.prototype._openModel = function(cb) {
    const api = this._api;
    this.log().ctx('setup').ctx('model').info('Opening model...');

    if (this.openModel) {
        this.openModel(api, (err)=>{
            if (err) {
                this.log().ctx('setup').ctx('model').error(`Opening model has failed, error:${err}`);
            } else {
                this.log().ctx('setup').ctx('model').info('Opening model is complete');
            }
            cb(err);
        });
    } else {
        this.log().ctx('setup').ctx('model').info('Opening model is complete, no model is set');
        setImmediate(cb);
    }
}



Application.prototype._closeModel = function(cb) {
    const api = this._api;
    this.log().ctx('teardown').ctx('model').info('Closing model...');

    if (this.closeModel) {
        this.closeModel(api, (err)=>{
            if (err) {
                this.log().ctx('teardown').ctx('model').error(`Closing model has failed, error:${err}`);
            } else {
                this.log().ctx('teardown').ctx('model').info('Closing model is complete');
            }
            cb(err);
        });
    } else {
        this.log().ctx('teardown').ctx('model').info('Closing model is complete, no model is set');
        setImmediate(cb);
    }
}



Application.prototype._loadRoutes = function(cb) {
    const api = this._api;
    this.log().ctx('setup').ctx('routes').info('Loading routes...');

    // Setup static routes
    this._impl.use(Impl.static('static'));

    // Setup access controller
    assert.equal('undefined', typeof this._accessController);
    this._accessController = new api.lib.AccessController();
    const failure = (req, res)=>{
        api.lib.log.error('auth failure');
    //  console.trace();
        res.sendStatus(401);
    }

    const router = require('express').Router();
    const accessController = this._accessController;

    api.lib.routerHelper.loadRoutes(router, 'www', accessController, failure);
    this._impl.use(router);

    this.log().ctx('setup').ctx('routes').info('Loading routes is complete');
    setImmediate(cb);
}



Application.prototype._unloadRoutes = function(cb) {
    const api = this._api;
    this.log().ctx('teardown').ctx('routes').info('Unloading routes...');

    const accessController = this._accessController;
    if (accessController) {
        this._accessController = undefined;
    }

    this.log().ctx('teardown').ctx('routes').info('Unloading routes is complete');
    setImmediate(cb);
}

///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
const Http = function() {
    this.name = 'http';
    this.description = 'http(s) server';

    this.log = function() {
        return this.api.lib.log.ctx('services').ctx(this.name);
    }

    this.isStarted= function() {
        return typeof this._httpServer !== 'undefined';
    }

    this.start = function(opts, cb) {
        assert(opts);
        assert(opts.api);
        this.api = opts.api;
        const api = this.api;
        this.log().ctx('setup').info(`Starting ...`);

        assert(opts.config);
        this.config = opts.config;

        assert(opts.impl);
        this.impl = opts.impl;

        assert(opts.loadCertificates);
        this.loadCertificates = opts.loadCertificates;
        assert(cb);

        assert.equal(false, this.isStarted());

        const {key, cert} = this.loadCertificates(this.config);
        if (key && cert) {
            // SSL is here
            this._httpServer = api.https.createServer({
                key: key,
                cert: cert
            }, this.impl)
            .listen(this.config.port, ()=>{
                this.log().ctx('setup').info(`Start listening port ${this.config.port}`);
                assert.equal('object', typeof this._httpServer);
                cb();
            });
        } else {
            // No SSL
            this._httpServer = this.impl.listen(this.config.port, ()=>{
                this.log().ctx('setup').info(`Start listening port ${this.config.port}`);
                assert.equal('object', typeof this._httpServer);
                cb();
            });
        }
    }

    this.stop = function(cb) {
        const api = this.api;
        this.log().ctx('teardown').info('Stoping...');
        const httpServer = this._httpServer;

        if (httpServer) {
            this._httpServer = undefined;
            this.config = undefined;
            this.impl = undefined;
            this.loadCertificates = undefined;

            httpServer.close();
            this.log().ctx('teardown').info('Stoping is complete');
            this.api = undefined;
        } else {
            this.log().ctx('teardown').info(`Stoping is complete, hasn\'t started, nothing to stop`);
        }
        setImmediate(cb);
    }
}



Application.SERVICES = {
    http: {
        Ctor:Http 
    }
};



Application.prototype._startServices = function(cb) {
    const api = this._api;
    this.log().ctx('setup').ctx('SERVICES').info('Start services...');

    assert.equal('undefined', typeof this._services);

    const start = (index, services, cb)=>{
        const names = Object.keys(services);
        if (index < names.length) {
            const name = names[index];
            const Ctor = Application.SERVICES[name].Ctor;
            assert(Ctor);
            assert.equal('function', typeof Ctor);

            if (Ctor) {
                const service = new Ctor();
                const config = services[name];
                const opts = {
                    api:api,
                    config:config,
                    impl:this._impl,
                    loadCertificates: this._loadCertificatesIfAny.bind(this)
                };

                this.log().ctx('setup').ctx('SERVICES').info(`Starting service: ${service.name}...`);
                service.start(opts, (err)=>{
                    if (err) {
                        this.log().ctx('setup').ctx('SERVICES').error(`Starting service: ${service.name} has failed, err:${err}`);
                        cb(err);
                    } else {
                        this._services[name] = service;
                        this.log().ctx('setup').ctx('SERVICES').info(`Starting service: ${service.name} is complete`);
                        start(index+1, services, cb);
                    }
                });

            } else {
                cb();
            }
        } else {
            cb();
        }
    }

    const services = this.config.application.services;
    if (services) {
        this._services = {};
        start(0, services, (err)=>{
            if (err) {
                this.log().ctx('setup').ctx('SERVICES').info(`Start services has failed, error:`, error);
                cb(err);
            } else {
                this.log().ctx('setup').ctx('SERVICES').info(`Start services is complete`);
                cb();
            }
        });
    } else {
        this.log().ctx('setup').ctx('SERVICES').info(`Start services is complete, no services are defined, nothing to start`);
        cb();
    }
}



Application.prototype._stopServices = function(cb) {
    const api = this._api;
    this.log().ctx('setup').ctx('SERVICES').info('Stop services...');

    const stop = (index, services, cb)=>{
        const names = Object.keys(services);
        if (index < names.length) {
            const name = names[index];
            const service = services[name];
            assert(service);
            this.log().ctx('setup').ctx('SERVICES').info(`Stopping service: ${name}...`);
            service.stop((err)=>{
                if (err) {
                    this.log().ctx('setup').ctx('SERVICES').error(`Stopping service: ${name} has failed, error:`, err);
                    cb(err);
                } else {
                    this.log().ctx('setup').ctx('SERVICES').info(`Stopping service: ${name} is complete`);
                    stop(index+1, services, cb);
                }
            });
        } else {
            cb();
        }
    }

    const services = this._services;
    if (services) {
        stop(0, services, (err)=>{
            if (err) {
                this.log().ctx('setup').ctx('SERVICES').error(`Stop services has failed, error:`, error);
            } else {
                this._services = undefined;
                this.log().ctx('setup').ctx('SERVICES').info(`Stop services is complete`);
            }
            cb(err);
        });
    } else {
        this.log().ctx('setup').ctx('SERVICES').info(`Stop services is complete, no services are defined, nothing to stop`);
        setImmediate(cb);
    }
}



Application.prototype._loadCertificatesIfAny = function(config) {
    const api = this._api;

    if (config && config.key && config.cert) {
        const path = api.path.join('config', 'ssl');
        const certFile = api.lib.env.makePath(api.path.join(path, config.cert));
        const keyFile  = api.lib.env.makePath(api.path.join(path, config.key));
        this.log().ctx('SSL').info('cert file:' + certFile);
        this.log().ctx('SSL').info('key file:' + keyFile);

        try {
            const key = api.fs.readFileSync(keyFile);
            const cert = api.fs.readFileSync(certFile);
            this.log().ctx('SSL').info('Certificate is loaded');
            return { key, cert };
        } catch (e) {
            this.log().ctx('SSL').error('Certificate is not found');
            return undefined;
        }
    } else {
        this.log().ctx('SSL').warn('Certificate is not given, no SSL');
        return undefined;
    }
}



Application.assertAppIsClosed = function(app) {
    assert.equal('undefined', typeof app._api);
    assert.equal('undefined', typeof app.config);
    assert.equal('undefined', typeof app._loggerFs);
    assert.equal('undefined', typeof app._impl);
    assert.equal('undefined', typeof app._accessController);
    assert.equal('undefined', typeof app._services);
}



Application.assertAppIsOpen = function(app) {
    assert.notEqual('undefined', typeof app._api);
    assert.notEqual('undefined', typeof app.config);
    assert.notEqual('undefined', typeof app._loggerFs);
    assert.notEqual('undefined', typeof app._impl);
    assert.notEqual('undefined', typeof app._accessController);
    assert.notEqual('undefined', typeof app._services);
}



module.exports = Application;

