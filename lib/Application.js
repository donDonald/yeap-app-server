'use strict';

const assert = require('assert'),
      re = (module)=>{ return require('./' + module); };
const metavm = require('metavm');
const SANDBOX = { ...metavm.COMMON_CONTEXT, process, require, module, assert };




class Application {

    constructor(opts) {
        if (opts) {
            this.openModelImpl = opts.openModel;
            this.closeModelImpl = opts.closeModel;
        }
    }




    ///\brief Logger getter
    get log() {
        return this.sandbox.api.log.ctx('Application');
    }




    ///\brief Api getter and setter
    get api() {
        return this.sandbox.api;
    }

    set api(a) {
        this.sandbox.api = a;
    }




    ///\brief Config getter and setter
    get config() {
        return this.sandbox.config;
    }

    set config(c) {
        this.sandbox.config = c;
    }




    ///\brief Databases getter and setter
    get databases() {
        return this.sandbox.databases;
    }

    set databases(d) {
        this.sandbox.databases = d;
    }




    ///\brief Model getter and setter
    get model() {
        return this.sandbox.model;
    }

    set model(m) {
        this.sandbox.model = m;
    }




    ///\brief Services getter and setter
    get services() {
        return this._services;
    }

    set services(s) {
        this._services = s;
    }




    ///\brief Require a file inside isolated sandbox
    require(path) {
        assert(path);
        assert(this.sandbox);
        const fullPath = this.api.env.makePath(path);
        let src = this.api.fs.readFileSync(fullPath).toString();
        return this.runScript(src);
    }




    ///\brief Run a script inside isolated sandbox
    runScript(src) {
        assert(src);
        assert(this.sandbox);
        const result = metavm.createScript('script', src, {context:this.sandbox});
        return result.exports;
    }



    
    ///\brief Check whether app is open or not
    get isOpen () {
        return typeof this.sandbox !== 'undefined';
    }




    open (cb) {
        if (this.isOpen) {
            const err = 'Application is already open';
            this.log.ctx('setup').error(err);
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
            (cb)=>{ this.createSandbox(cb) },
            (cb)=>{ this.loadLib(cb) },
            (cb)=>{ this.loadPlaces(cb) },
            (cb)=>{ this.openLogger(cb) },
            (cb)=>{ this.openDatabases(cb) },
            (cb)=>{ this.openModel(cb) },
            (cb)=>{ this.openErrorHole(cb) },
            (cb)=>{ this.loadServices(cb) },
            (cb)=>{ this.startServices(cb) },
        ];

        load(0, steps, (err)=>{
            if (err) {
                this.log.ctx('setup').error('Opening application has failed:' + err);
            } else {
                Application.assertAppIsOpen(this);
                this.log.ctx('setup').info('Opening application is complete');
            }
            cb(err);
        });
    }




    close (cb) {
        if (!this.isOpen) {
            if (cb) setImmediate(cb);
            return;
        }

        this.log.ctx('teardown').info('Closing...');

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
            (cb)=>{ this.stopServices(cb) },
            (cb)=>{ this.closeErrorHole(cb) },
            (cb)=>{ this.closeModel(cb) },
            (cb)=>{ this.closeDatabases(cb) },
            (cb)=>{ this.closeLogger(cb) },
        ];

        close(0, steps, (err)=>{
            if (err) {
                this.log.ctx('teardown').error('Opening application has failed:' + err);
            } else {
                this.log.ctx('teardown').info('Closing application is complete');
                this.api = undefined;
                this.config = undefined;
                this.databases = undefined;
                this.modle = undefined;
                this.sandbox = undefined;
                Application.assertAppIsClosed(this);
            }
            cb(err);
        });
    }




    createSandbox(cb) {
        const sandbox = { ...SANDBOX };
        sandbox.api = undefined;
        sandbox.config = undefined;
        sandbox.databases = undefined;
        sandbox.model = undefined;
        sandbox.services = undefined;
        sandbox.g_application = this;
        sandbox.global = sandbox;
        this.sandbox = metavm.createContext(sandbox);
        setImmediate(cb);
    }




    loadLib (cb) {
        assert.equal('undefined', typeof this.api);
        this.api = re('index');
        this.log.ctx('setup').ctx('lib').info('Loading libraries...');
        this.log.ctx('setup').ctx('lib').info('Loading libraries is complete');
        setImmediate(cb);
    }




    static PLACES = ['config'];
    loadPlaces (cb) {
        const api = this.api;
        this.log.ctx('setup').ctx('places').info('Loading places...');

        const loadFiles = (index, files, place, cb)=>{
            if (index < files.length) {
                const file = files[index];

                let relPath='';
                place.forEach((p)=>{
                    relPath = api.path.join(relPath, p);
                });
                relPath = api.path.join(relPath, file);

                const path = api.env.makePath(relPath);
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
                    this.log.ctx('setup').ctx('places').debug('loadFiles, path:' + path);
                    let config = this;
                    place.forEach((p)=>{
                        config[p] = config[p] || {};
                        config = config[p];
                    });
                    const name = file.substring(0, file.length-3);
                    config[name] = api.re(relPath);
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
                const path = api.env.makePath(place);
                this.log.ctx('setup').ctx('places').debug('loadPlaces, path:' + path);
                api.fs.readdir(path, (err, files) => {
                    if (err) {
                        cb(`Failing loading place:${path}, error:${err}`);
                    } else {
                        loadFiles(0, files, [place], (err)=>{
                            if (err) {
                                this.log.ctx('setup').ctx('places').error('Loading files has failed:' + err);
                            } else {
                                this.log.ctx('setup').ctx('places').info('Loading files is complete');
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
                this.log.ctx('setup').ctx('places').error('Loading places has failed:' + err);
                this.close((err)=>{
                    cb(err);
                });
                return;
            }

            this.log.ctx('setup').ctx('places').info('Loading places is complete');
            cb(err);
        });
    }




    openLogger (cb) {
        const api = this.api;
        this.log.ctx('setup').ctx('logger').info('Opening logger...');

        assert.equal('undefined', typeof this._loggerFs);
        this.config.log.path = api.env.makePath('logs');
        this._loggerFs = new api.logger.LoggerFs(this.config.log);
        this._loggerFs.open();

        // Chaining lib.Logger and lib.LoggerFs
        api.log.setNext(this._loggerFs._writeRaw.bind(this._loggerFs));

        this.log.ctx('setup').ctx('logger').info('Opening logger is complete');
        setImmediate(cb);
    }




    closeLogger (cb) {
        const api = this.api;
        this.log.ctx('teardown').ctx('logger').info('Closing logger...');

        // Unchaining lib.Logger and lib.LoggerFs
        api.log.setNext();

        const loggerFs = this._loggerFs;
        this._loggerFs = undefined;
        assert.equal('object', typeof loggerFs);
        loggerFs.close((err)=>{
            if (err) {
                this.log.ctx('teardown').ctx('logger').error(`Closing logger has failed, error:${err}`);
            } else {
                this.log.ctx('teardown').ctx('logger').info('Closing logger is complete');
            }
            cb(err);
        });
    }




    openDatabases (cb) {
        const api = this.api;
        this.log.ctx('setup').ctx('databases').info('Opening databases...');
        const databases = this.config.databases;
        if(databases) {
            let db = new this.api.db.Db(databases)
            db.open((err, connections)=>{
                if(err) {
                    this.log.ctx('setup').ctx('databases').error(`Opening databases has failed, err:${err}`);
                    cb(err);
                } else {
                    this.databases = db;

                    this.log.ctx('setup').ctx('databases').info('Connections list:');
                    const dbcs = Object.keys(connections);
                    dbcs.forEach((c)=>{
                        this.log.ctx('setup').ctx('databases').info(`    ${c}:`);
                        const dbc = connections[c];
                        this.log.ctx('setup').ctx('databases').info(`        schema:${dbc._props.schema}`);
                        this.log.ctx('setup').ctx('databases').info(`        host:${dbc._props.host}`);
                        this.log.ctx('setup').ctx('databases').info(`        port:${dbc._props.port}`);
                        this.log.ctx('setup').ctx('databases').info(`        database:${dbc._props.database}`);
                        this.log.ctx('setup').ctx('databases').info(`        pool_size:${dbc._props.pool_size}`);
                        this.log.ctx('setup').ctx('databases').info(`        slow_time:${dbc._props.slow_time}`);
                    });
                    this.log.ctx('setup').ctx('databases').info('Opening databases is complete');
                    cb();
                }
            });
        } else {
            this.log.ctx('setup').ctx('databases').info('No databases are assigned, nothing to open');
            setImmediate(cb);
        }
    }




    closeDatabases (cb) {
        const api = this.api;
        this.log.ctx('teardown').ctx('databases').info('Closing databases...');
        if(this.databases) {
            this.databases.close((err)=>{
                this.log.ctx('setup').ctx('databases').info('Closing databases is complete');
                this.databases = undefined;
                cb();
            });
        } else {
            this.log.ctx('setup').ctx('databases').info('No databases are assigned, nothing to close');
            setImmediate(cb);
        }
    }




    openModel (cb) {
        const api = this.api;
        this.log.ctx('setup').ctx('model').info('Opening model...');

        if (this.openModelImpl) {
            this.openModelImpl(this, (err, model)=>{
                if (err) {
                    this.log.ctx('setup').ctx('model').error(`Opening model has failed, error:${err}`);
                } else {
                    this.model = model;
                    this.log.ctx('setup').ctx('model').info('Opening model is complete');
                }
                cb(err);
            });
        } else {
            this.log.ctx('setup').ctx('model').info('Opening model is complete, no model is set');
            setImmediate(cb);
        }
    }




    closeModel (cb) {
        const api = this.api;
        this.log.ctx('teardown').ctx('model').info('Closing model...');

        if (this.closeModelImpl) {
            this.closeModelImpl(api, this.model, (err)=>{
                this.model = undefined;
                if (err) {
                    this.log.ctx('teardown').ctx('model').error(`Closing model has failed, error:${err}`);
                } else {
                    this.log.ctx('teardown').ctx('model').info('Closing model is complete');
                }
                cb(err);
            });
        } else {
            this.log.ctx('teardown').ctx('model').info('Closing model is complete, no model is set');
            setImmediate(cb);
        }
    }




    openErrorHole (cb) {
        this.log.ctx('setup').ctx('errorHole').info('Opening error hole...');
        assert.equal('undefined', typeof this.errorHole);
        const errorHole = new this.api.app_server.ErrorHole();
        errorHole.open({}, (err)=>{
            if (err) {
                this.log.ctx('setup').ctx('111111errorHole').error(`Opening errorHole has failed, err:${err}`);
            } else {
                this.errorHole = errorHole;
                this.log.ctx('setup').ctx('111111errorHole').info(`Opening errorHole is complete`);
            }
            cb(err);
        });
    }




    closeErrorHole (cb) {
        this.log.ctx('teardown').ctx('errorHole').info('Closing error hole...');
        this.errorHole.close( (err)=>{
            this.errorHole = undefined;
            if (err) {
                this.log.ctx('setup').ctx('111111errorHole').error(`Closing errorHole has failed, err:${err}`);
            } else {
                this.log.ctx('setup').ctx('111111errorHole').info(`Closing errorHole is complete`);
            }
            cb(err);
        });
    }




    loadServices (cb) {
        const api = this.api;
        this.log.ctx('setup').ctx('SERVICES').info('Load services...');
        assert.equal('undefined', typeof this.services);

        const capitalizeFirstLetter=(string)=>{
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        const reService = (name)=>{
            const Name = capitalizeFirstLetter(name);
            const Ctor = re('./services/' + Name)(api);
            assert(Ctor);
            return Ctor;
        }

        const load = (index, services, cb)=>{
            const names = Object.keys(services);
            if (index < names.length) {
                const name = names[index];
                const Ctor = reService(name);
                //reService(name);
                //const Ctor = this.config.services[name].Ctor;
                assert(Ctor);
                assert.equal('function', typeof Ctor);

                if (Ctor) {
                    const service = new Ctor(this);
                    this.log.ctx('setup').ctx('SERVICES').info(`Loading service "${service.name}"...`);
                    const config = services[name];
                    const opts = {
                        model:this.model,
                        config:config,
                        loadCertificates: this.loadCertificatesIfAny.bind(this),
                        loggerFs: this._loggerFs
                    };

                    service.load(opts, (err)=>{
                        if (err) {
                            this.log.ctx('setup').ctx('SERVICES').error(`Loading service "${service.name}" has failed, err:${err}`);
                            cb(err);
                        } else {
                            this.services[name] = service;
                            this.log.ctx('setup').ctx('SERVICES').info(`Loading service "${service.name}" is complete`);
                            load(index+1, services, cb);
                        }
                    });

                } else {
                    cb();
                }
            } else {
                cb();
            }
        }

        const services = this.config.services;
        if (services) {
            this.services = {};
            load(0, services, (err)=>{
                if (err) {
                    this.log.ctx('setup').ctx('SERVICES').info(`Loading services has failed, error:`, error);
                    cb(err);
                } else {
                    this.log.ctx('setup').ctx('SERVICES').info(`Loading services is complete`);
                    cb();
                }
            });
        } else {
            this.log.ctx('setup').ctx('SERVICES').info(`Loading services is complete, no services are defined, nothing to load`);
            cb();
        }
    }




    startServices (cb) {
        const api = this.api;
        this.log.ctx('setup').ctx('SERVICES').info('Start services...');
        assert.equal('object', typeof this.services);

        const start = (index, services, cb)=>{
            const keys = Object.keys(services);
            if (index < keys.length) {
                const k = keys[index];
                const service = services[k];
                this.log.ctx('setup').ctx('SERVICES').info(`Starting service: ${service.name}...`);
                service.start((err)=>{
                    if (err) {
                        this.log.ctx('setup').ctx('SERVICES').error(`Starting service: ${service.name} has failed, err:${err}`);
                        cb(err);
                    } else {
                        this.log.ctx('setup').ctx('SERVICES').info(`Starting service: ${service.name} is complete`);
                        start(index+1, services, cb);
                    }
                });
            } else {
                cb();
            }
        }

        this.sandbox._services = this.services;
        const services = this.sandbox._services;
        if (services) {
            start(0, services, (err)=>{
                if (err) {
                    this.log.ctx('setup').ctx('SERVICES').info(`Start services has failed, error:`, error);
                    cb(err);
                } else {
                    this.log.ctx('setup').ctx('SERVICES').info(`Start services is complete`);
                    cb();
                }
            });
        } else {
            this.log.ctx('setup').ctx('SERVICES').info(`Start services is complete, no services are defined, nothing to start`);
            cb();
        }
    }




    stopServices (cb) {
        const api = this.api;
        this.log.ctx('setup').ctx('SERVICES').info('Stop services...');

        const stop = (index, services, cb)=>{
            const names = Object.keys(services);
            if (index < names.length) {
                const name = names[index];
                const service = services[name];
                assert(service);
                this.log.ctx('setup').ctx('SERVICES').info(`Stopping service: ${name}...`);
                service.stop((err)=>{
                    if (err) {
                        this.log.ctx('setup').ctx('SERVICES').error(`Stopping service: ${name} has failed, error:`, err);
                        cb(err);
                    } else {
                        this.log.ctx('setup').ctx('SERVICES').info(`Stopping service: ${name} is complete`);
                        stop(index+1, services, cb);
                    }
                });
            } else {
                cb();
            }
        }

        const services = this.sandbox._services;
        if (services) {
            stop(0, services, (err)=>{
                if (err) {
                    this.log.ctx('setup').ctx('SERVICES').error(`Stop services has failed, error:`, error);
                } else {
                    this.services = undefined;
                    this.log.ctx('setup').ctx('SERVICES').info(`Stop services is complete`);
                }
                cb(err);
            });
        } else {
            this.log.ctx('setup').ctx('SERVICES').info(`Stop services is complete, no services are defined, nothing to stop`);
            setImmediate(cb);
        }
    }




    loadCertificatesIfAny (config) {
        const api = this.api;

        let key, cert;
        if (config && config.key && config.cert) {
            const certFile = api.env.makePath(config.cert);
            const keyFile  = api.env.makePath(config.key);
            this.log.ctx('SSL').info('cert file:' + certFile);
            this.log.ctx('SSL').info('key file:' + keyFile);

            try {
                key = api.fs.readFileSync(keyFile);
                cert = api.fs.readFileSync(certFile);
                this.log.ctx('SSL').info('Certificate is loaded');
                return { key, cert };
            } catch (e) {
                this.log.ctx('SSL').error('Certificate is not found');
                return { key, cert };
            }
        } else {
            this.log.ctx('SSL').warn('Certificate is not given, no SSL');
            return { key, cert };
        }
    }




    static assertAppIsClosed (app) {
        assert.equal('undefined', typeof app.sandbox);
      //assert.equal('undefined', typeof app.api);
      //assert.equal('undefined', typeof app.config);
      //assert.equal('undefined', typeof app._loggerFs);
      //assert.equal('undefined', typeof app.services);
    }




    static assertAppIsOpen (app) {
        assert.equal('object', typeof app.sandbox);
        assert.equal('object', typeof app.api);
        assert.equal('object', typeof app.config);
        assert.equal('object', typeof app._loggerFs);
        assert.equal('object', typeof app.errorHole);
        assert.equal('object', typeof app.services);
    }
}




module.exports = Application;

