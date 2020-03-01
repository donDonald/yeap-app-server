'use strict';

const assert = require('assert'),
      re = (module)=>{ return require('../' + module); },
      Impl = require('express');



const Application = function() {
}



Application.prototype.isOpen = function() {
    return (typeof this._api !== 'undefined');
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
        assert.equal('object', typeof this._accessController);
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
        (cb)=>{ this._unloadRoutes(cb) },
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
        assert.equal('undefined', typeof this._accessController);
        assert.equal('undefined', typeof this._httpServer);

        if (cb) {
            cb(err);
        }
    });
}



Application.STATIC_APIS = ['fs'];
Application.prototype._loadLib = function(cb) {
    this._api = {};
    const api = this._api;

    Application.STATIC_APIS.forEach((name)=>{
        api[name] = require(name);
    });

    api.lib = re('lib/exports')(api);

    api.lib.log.ctx('Application').ctx('setup').info('Loading libraries...');
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
            const path = place+'/'+file;
            api.lib.log.ctx('Application').ctx('setup').debug('loadFiles, path:' + path);
            if (path.endsWith('.js')) {
                this[place] = this[place] || {};
                const name = file.substring(0, file.length-3);
                this[place][name] = api.lib.re(path);
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
            this.close((err)=>{
                cb(err);
            });
            return;
        }

        api.lib.log.ctx('Application').ctx('setup').info('Loading places is complete');
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

    // Setup view engine
    this._impl.set('views', api.lib.env.makePath('views'));
    this._impl.set('view engine', 'ejs');

    // Setup request logger MW
    assert(this._loggerFs.access, 'No access stream is specified');
    const logger  = this._loggerFs.access.bind(this._loggerFs);
    const requestLogger = re('lib/requestLogger')(logger);
    this._impl.use(requestLogger);

    // Initialize cookie MW
    const authKeysSession = require('../auth/keys/session');
    const cookieSession = require('cookie-session');
    this._impl.use(cookieSession({
        maxAge: 24*60*60*1000, // 1day
        keys:[authKeysSession.cookieKey]
    }));

    // Initialize passport MW
    const passport = require('passport');
    this._impl.use(passport.initialize());
    this._impl.use(passport.session());

    // Setup body parser to support POST
    const bodyParser = require('body-parser');
    this._impl.use(bodyParser.json()); // support json encoded bodies
    this._impl.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

    api.lib.log.ctx('Application').ctx('setup').info('Creating app impl(express) is complete');
    setImmediate(cb);
}



Application.prototype._destroyImpl = function(cb) {
    const api = this._api;
    api.lib.log.ctx('Application').ctx('teardown').info('Destroying app impl(express)...');

    assert.equal('function', typeof this._impl);
    const impl = this._impl;
    this._impl = undefined;

    api.lib.log.ctx('Application').ctx('teardown').info('Destroying app impl(express)...');
    setImmediate(cb);
}



Application.prototype._loadRoutes = function(cb) {
    const api = this._api;
    api.lib.log.ctx('Application').ctx('setup').info('Loading routes...');

    // Setup static routes
    this._impl.use(Impl.static('static'));

    // Setup access controller
    assert.equal('undefined', typeof this._accessController);
    this._accessController = new api.lib.AccessController();

    const router = require('express').Router();
    const accessController = this._accessController;

    // PTFIXME, have to requre api.model here since loadRoutes will init validators which in turn use api.model
    {
                api.model = {};
                api.model.types = re('model/types')(api);
                api.model.makeId = re('model/makeId')(api);

                api.model.helpers = {};
                api.model.helpers.add = re('model/helpers/add');
                api.model.helpers.delete = re('model/helpers/delete');
                api.model.helpers.count = re('model/helpers/count');
                api.model.helpers.query = re('model/helpers/query');

                api.model.Deployment = re('model/Deployment')(api);
                api.model.Deployments = re('model/Deployments')(api);

                api.model.Group = re('model/Group')(api);
                api.model.Groups = re('model/Groups')(api);

                api.model.User = re('model/User')(api);
                api.model.Users = re('model/Users')(api);

                api.model.Login = re('model/Login')(api);
                api.model.Logins = re('model/Logins')(api);

                api.model.factory = re('model/factory')(api);

                api.auth = {};
                api.auth.UserHandler = re('auth/UserHandler')(api);
                api.auth.google = {};
                api.auth.google.Provider = re('auth/google/Provider')(api);
                api.auth.facebook = {};
                api.auth.facebook.Provider = re('auth/facebook/Provider')(api);
                api.auth.facebook.ProviderToken = re('auth/facebook/ProviderToken')(api);
                api.auth.odnoklassniki = {};
                api.auth.odnoklassniki.Provider = re('auth//odnoklassniki/Provider')(api);
                api.auth.vkontakte = {};
                api.auth.vkontakte.Provider = re('auth/vkontakte/Provider')(api);
                api.auth.yandex = {};
                api.auth.yandex.Provider = re('auth/yandex/Provider')(api);
                api.auth.bogus = {};
                api.auth.bogus.ProviderToken = re('auth/bogus/ProviderToken')(api);
    }

// PTFIXME
const failure = (req, res)=>{
    api.lib.log.error('!!! auth FAILURE');
    res.sendStatus(401);
    //res.redirect('/auth/login');
    // PTFIXME write to log
}

    api.lib.routerHelper.loadRoutes(router, 'www', accessController, failure);
    this._impl.use(router);

    api.lib.log.ctx('Application').ctx('setup').info('Loading routes is complete');
    setImmediate(cb);
}



Application.prototype._unloadRoutes = function(cb) {
    const api = this._api;
    api.lib.log.ctx('Application').ctx('teardown').info('Unloading routes...');

    const accessController = this._accessController;
    if (accessController) {
        this._accessController = undefined;
    }

    api.lib.log.ctx('Application').ctx('teardown').info('Unloading routes is complete');
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
    api.lib.log.ctx('Application').ctx('teardown').info('Stop listening...');

    const httpServer = this._httpServer;
    if (httpServer) {
        this._httpServer = undefined;
        httpServer.close();
        api.lib.log.ctx('Application').ctx('teardown').info(`Stop listening port ${this.config.application.port}`);
    }
    setImmediate(cb);
}



module.exports = Application;

