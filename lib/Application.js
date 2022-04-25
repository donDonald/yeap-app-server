'use strict';

const assert = require('assert'),
      re = (module)=>{ return require('./' + module); };




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
        (cb)=>{ this._openDatabases(cb) },
        (cb)=>{ this._openModel(cb) },
        (cb)=>{ this._startServices(cb) },
    ];

    load(0, steps, (err)=>{
        if (err) {
            this.log().ctx('setup').error('Opening application has failed:' + err);
        } else {
            Application.assertAppIsOpen(this);
            this.log().ctx('setup').info('Opening application is complete');
        }
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
        (cb)=>{ this._closeModel(cb) },
        (cb)=>{ this._closeLogger(cb) },
    ];

    close(0, steps, (err)=>{
        if (err) {
            this.log().ctx('teardown').error('Opening application has failed:' + err);
        } else {
            this.log().ctx('teardown').info('Closing application is complete');
            this._api = undefined;
            this.config = undefined;
            Application.assertAppIsClosed(this);
        }
        cb(err);
    });
}




Application.prototype._loadLib = function(cb) {
    this._api = {};
    assert.equal('undefined', typeof this._api.lib);
    this._api = re('index');
    this.log().ctx('setup').ctx('lib').info('Loading libraries...');
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
console.log('--- config[name]:' + name);

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




Application.prototype._openDatabases = function(cb) {
    const api = this._api;
    this.log().ctx('setup').ctx('databases').info('Opening databases...');
    const databases = this.config.databases;
    if(databases) {
        this.log().ctx('setup').ctx('databases').info('Opening databases is complete');
        setImmediate(cb);
    } else {
        this.log().ctx('setup').ctx('databases').info('No databases are assigned, nothing to open');
        setImmediate(cb);
    }
}




Application.prototype._closeDatabases = function(cb) {
    const api = this._api;
    this.log().ctx('teardown').ctx('databases').info('Closing databases...');
    const databases = this.config.databases;
    if(databases) {
        this.log().ctx('setup').ctx('databases').info('Closing databases is complete');
        setImmediate(cb);
    } else {
        this.log().ctx('setup').ctx('databases').info('No databases are assigned, nothing to close');
        setImmediate(cb);
    }
}




Application.prototype._openModel = function(cb) {
    const api = this._api;
    this.log().ctx('setup').ctx('model').info('Opening model...');

    if (this.openModel) {
        this.openModel(api, (err, model)=>{
            if (err) {
                this.log().ctx('setup').ctx('model').error(`Opening model has failed, error:${err}`);
            } else {
                this._model = model;
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
        this.closeModel(api, this._model, (err)=>{
            this._model = undefined;
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




Application.prototype._startServices = function(cb) {
    const api = this._api;
    this.log().ctx('setup').ctx('SERVICES').info('Start services...');

    assert.equal('undefined', typeof this._services);

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    const reService = (name)=>{
        const Name = capitalizeFirstLetter(name);
        const path = './services/' +capitalizeFirstLetter(name);  
        const Ctor = re('./services/' + Name)(api);
        assert(Ctor);
        return Ctor;
    }

    const start = (index, services, cb)=>{
        const names = Object.keys(services);
        if (index < names.length) {
            const name = names[index];
            const Ctor = reService(name);
            assert(Ctor);
            assert.equal('function', typeof Ctor);

            if (Ctor) {
                const service = new Ctor();
                const config = services[name];
                const opts = {
                    model:this._model,
                    config:config,
                    loadCertificates: this._loadCertificatesIfAny.bind(this),
                    loggerFs: this._loggerFs
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

    let key, cert;
    if (config && config.key && config.cert) {
        const certFile = api.lib.env.makePath(config.cert);
        const keyFile  = api.lib.env.makePath(config.key);
        this.log().ctx('SSL').info('cert file:' + certFile);
        this.log().ctx('SSL').info('key file:' + keyFile);

        try {
            key = api.fs.readFileSync(keyFile);
            cert = api.fs.readFileSync(certFile);
            this.log().ctx('SSL').info('Certificate is loaded');
            return { key, cert };
        } catch (e) {
            this.log().ctx('SSL').error('Certificate is not found');
            return { key, cert };
        }
    } else {
        this.log().ctx('SSL').warn('Certificate is not given, no SSL');
        return { key, cert };
    }
}




Application.assertAppIsClosed = function(app) {
    assert.equal('undefined', typeof app._api);
    assert.equal('undefined', typeof app.config);
    assert.equal('undefined', typeof app._loggerFs);
    assert.equal('undefined', typeof app._services);
}




Application.assertAppIsOpen = function(app) {
    assert.notEqual('undefined', typeof app._api);
    assert.notEqual('undefined', typeof app.config);
    assert.notEqual('undefined', typeof app._loggerFs);
    assert.notEqual('undefined', typeof app._services);
}




module.exports = Application;

