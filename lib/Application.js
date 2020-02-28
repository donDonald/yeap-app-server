'use strict';

const assert = require('assert');
const re = (module)=>{ return require('../' + module); }
const Impl = require('express');



const Application = function() {
}



Application.prototype.isOpen = function() {
    return (typeof this._api !== 'undefined'); // PTFIXME, it shall be something other tan this
}



Application.prototype.open = function(cb) {
    if (this.isOpen()) {
        const api = this._api;
        const err = 'Application is already open';
        api.lib.log.ctx('Application').ctx('setup').error(err);
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
        (cb)=>{ this._loadRoutes(cb) },
        (cb)=>{ this._startListening(cb) },
    ];

    load(0, steps, (err)=>{
        const api = this._api;
        if (err) {
            api.lib.log.ctx('Application').ctx('setup').error('Opening application has failed:' + err);
            cb(err);
            return;
        }

        // Double check
        assert.equal('object', typeof this._api);
        assert.equal('object', typeof this.config);
        assert.equal('object', typeof this._loggerFs);
        assert.equal('function', typeof this._impl);
        assert.equal('object', typeof this._httpServer);

        api.lib.log.ctx('Application').ctx('setup').info('Opening application is complete');
        cb(err);
    });
}



Application.prototype.close = function(cb) {
    if (!this.isOpen()) {
        if (cb) setImmediate(cb);
        return;
    }

    const api = this._api;
    api.lib.log.ctx('Application').ctx('teardown').info('Closing...');

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
        (cb)=>{ this._stopListening(cb) },
        (cb)=>{ this._destroyImpl(cb) },
        (cb)=>{ this._closeLogger(cb) },
    ];

    close(0, steps, (err)=>{
        api.lib.log.ctx('Application').ctx('teardown').info('Closing is complete');
        this._api = undefined;
        this.config = undefined;

        // Double check
        assert.equal('undefined', typeof this._api);
        assert.equal('undefined', typeof this.config);
        assert.equal('undefined', typeof this._loggerFs);
        assert.equal('undefined', typeof this._impl);
        assert.equal('undefined', typeof this._httpServer);

        if (cb) {
            cb(err);
        }
    });
}



Application.prototype._loadLib = function(cb) {
    this._api = {};
    const api = this._api;

    api.fs = require('fs');

    api.lib = {};

    api.lib.Logger = re('lib/Logger');
    api.lib.log = api.lib.Logger;
    api.lib.LoggerFs = re('lib/LoggerFs');
    api.lib.log.ctx('Application').ctx('setup').info('Loading libraries...');

    api.lib.env = re('lib/env');
    api.lib.re = re('lib/re')(api);

    api.lib.db = {};
    api.lib.db.tools = re('lib/db/tools');
    api.lib.db.DbPool = re('lib/db/DbPool')(api);

    api.lib.Md5 = re('lib/Md5')(api);
    api.lib.AccessController = re('lib/AccessController')(api);
    api.lib.routerHelper = re('lib/routerHelper')(api);

    api.lib.log.ctx('Application').ctx('setup').info('Loading libraries is complete');
    setImmediate(cb);
}



Application.PLACES = ['config'];
Application.prototype._loadPlaces = function(cb) {
    const api = this._api;
    api.lib.log.ctx('Application').ctx('setup').info('Loading places...');

    const loadFiles = (index, files, place, cb)=>{
        if (index < files.length) {
            const file = files[index];
            const path = api.lib.env.makePath(place+'/'+file);
            api.lib.log.ctx('Application').ctx('setup').debug('loadFiles, path:' + path);
            if (path.endsWith('.js')) {
                this[place] = this[place] || {};
                const name = file.substring(0, file.length-3);
                this[place][name] = require(path); // PTFIXME, use re rather than requre
            }
            setImmediate(()=>{ loadFiles(index+1, files, place, cb); });
        } else {
            cb();
        }
    }

    const loadPlaces = (index, places, cb)=>{
        if (index < places.length) {
            const place = places[index];
            const path = api.lib.env.makePath(place);
            api.lib.log.ctx('Application').ctx('setup').debug('loadPlaces, path:' + path);
            api.fs.readdir(path, (err, files) => {
                if (err) {
                    cb(`Failing loading place:${path}, error:${err}`);
                } else {
                    loadFiles(0, files, place, (err)=>{
                        if (err) {
                            api.lib.log.ctx('Application').ctx('setup').error('Loading places has failed:' + err);
                        } else {
                            api.lib.log.ctx('Application').ctx('setup').info('Loading places is complete');
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
            api.lib.log.ctx('Application').ctx('setup').error('Loading places has failed:' + err);
            // PTFIXME, shall close in this case?
        } else {
            api.lib.log.ctx('Application').ctx('setup').info('Loading places is complete');
        }
        cb(err);
    });
}



Application.prototype._openLogger = function(cb) {
    const api = this._api;
    api.lib.log.ctx('Application').ctx('setup').info('Opening logger...');

    assert.equal('undefined', typeof this._loggerFs);
    this.config.log.path = api.lib.env.makePath('logs');
    this._loggerFs = new api.lib.LoggerFs(this.config.log);
    this._loggerFs.open();

    // Chaining lib.Logger and lib.LoggerFs
    api.lib.log.setNext(this._loggerFs._writeRaw.bind(this._loggerFs));

    api.lib.log.ctx('Application').ctx('setup').info('Opening logger is complete');
    setImmediate(cb);
}



Application.prototype._closeLogger = function(cb) {
    const api = this._api;
    api.lib.log.ctx('Application').ctx('teardown').info('Closing logger...');

    // Unchaining lib.Logger and lib.LoggerFs
    api.lib.log.setNext();

    const loggerFs = this._loggerFs;
    this._loggerFs = undefined;
    assert.equal('object', typeof loggerFs);
    loggerFs.close((err)=>{
        api.lib.log.ctx('Application').ctx('teardown').info('Closing logger is complete');
        cb(err);
    });
}



Application.prototype._createImpl = function(cb) {
    const api = this._api;
    api.lib.log.ctx('Application').ctx('setup').info('Creating app impl(express)...');

    assert.equal('undefined', typeof this._impl);
    this._impl = Impl();
    this._impl.zzz = {};

    api.lib.log.ctx('Application').ctx('setup').info('Creating app impl(express) is complete');
    setImmediate(cb);
}



Application.prototype._destroyImpl = function(cb) {
    const api = this._api;
    api.lib.log.ctx('Application').ctx('teardown').info('Destroying app impl(express)...');

    const impl = this._impl;
    this._impl = undefined;
    assert.equal('function', typeof impl);
    api.lib.log.ctx('Application').ctx('teardown').info('Destroying app impl(express)...');
    setImmediate(cb);
}



Application.prototype._loadRoutes = function(cb) {
    const api = this._api;
    api.lib.log.ctx('Application').ctx('setup').info('Loading routes...');

    // Setup static routes
    this._impl.use(Impl.static('static'))

    // Setup access controller
    this._accessController = new api.lib.AccessController();
    this._impl.zzz.accessController = this._accessController;

    api.lib.log.ctx('Application').ctx('setup').info('Loading routes is complete');
    setImmediate(cb);
}



Application.prototype._startListening = function(cb) {
    const api = this._api;
    assert.equal('undefined', typeof this._httpServer);
    this._httpServer = this._impl.listen(this.config.application.port, ()=>{
        api.lib.log.ctx('Application').ctx('setup').info(`Start listening port ${this.config.application.port}`);
        assert.equal('object', typeof this._httpServer);
        cb();
    });
}



Application.prototype._stopListening = function(cb) {
    const api = this._api;
    const httpServer = this._httpServer;
    this._httpServer = undefined;
    assert.equal('object', typeof httpServer);
    httpServer.close();
    api.lib.log.ctx('Application').ctx('teardown').info(`Stop listening port ${this.config.application.port}`);
    setImmediate(cb);
}



module.exports = Application;

