'use strict';

const assert = require('assert'),
      re = (module)=>{ return require('../' + module); },
      Impl = require('express');

const makeStep = (index, steps, cb)=>{
    if (index < steps.length) {
        const s = steps[index];
        s.call(undefined, (err)=>{
            if (err) {
                cb(err);
            } else {
                makeStep(index+1, steps, cb);
            }
        });
    } else {
        cb();
    }
}

module.exports = (api)=>{
    assert(api)

    const Http = function(ctx) {
        this.name = 'http';
        this.description = 'http(s) server';
        if (ctx) {
            this.log = function() {
                return api.lib.log.ctx(ctx).ctx(this.name);
            }
        } else {
            this.log = function() {
                return api.lib.log.ctx(this.name);
            }
        }
    }

    Http.prototype.isStarted = function() {
        return typeof this._httpServer !== 'undefined';
    }

    Http.prototype.start = function(opts, cb) {
        this.log().ctx('setup').info('Starting ...');

        assert(opts);
        assert(cb);

        if (this.isStarted()) {
            const err = 'Service is already started';
            this.log().ctx('setup').error(err);
            setImmediate(()=>{cb(err)});
            return;
        }

        assert(opts.config);
        this.config = opts.config;

        assert(opts.loadCertificates);
        this.loadCertificates = opts.loadCertificates.bind(this);

        assert(opts.loggerFs);
        this.loggerFs = opts.loggerFs;

        assert(cb);

        const steps = [
            (cb)=>{ this._createImpl(cb) },
            (cb)=>{ this._loadRoutes(cb) },
            (cb)=>{ this._start(cb) },
        ];

        makeStep(0, steps, (err)=>{
            if (err) {
                this.log().ctx('setup').error('Starting has failed:' + err);
            } else {
                this.log().ctx('setup').info('Starting is complete');
            }
            cb(err);
        });
    }

    Http.prototype.stop = function(cb) {
        this.log().ctx('teardown').info('Stoping...');

        assert(cb);
        if (!this.isStarted()) {
            this.log().ctx('teardown').info('Stopping is complete(already stopped)');
            setImmediate(cb);
            return;
        }

        const steps = [
            (cb)=>{ this._stop(cb) },
            (cb)=>{ this._unloadRoutes(cb) },
            (cb)=>{ this._destroyImpl(cb) },
        ];

        makeStep(0, steps, (err)=>{
            if (err) {
                this.log().ctx('teardown').error('Stopping has failed:' + err);
            } else {
                this.log().ctx('teardown').info('Stopping is complete');
            }
            cb(err);
        });
    }



    Http.prototype._handle404 = function(req, res, next) {
        res.status(404).send('Can\'t find requested url:' + req.originalUrl);
    }



    Http.prototype._start = function(cb) {
        assert(cb);
        assert(!this._httpServer);
        assert(this._impl);
        assert(this.config);
        assert(this.config.port);

        // Setup 404 handler
        const handle404 = this._handle404.bind(this);
        this._impl.use(handle404);

        const {key, cert} = this.loadCertificates(this.config);
        if (key && cert) {
            // SSL is here
            this.log().ctx('setup').ctx('SSL').info('SSL is setup, starting SSL server');
            this._httpServer = api.https.createServer({
                key: key,
                cert: cert
            }, this._impl)
            .listen(this.config.port, ()=>{
                this.log().ctx('setup').ctx('SSL').info(`Start listening port ${this.config.port}`);
                assert.equal('object', typeof this._httpServer);
                cb();
            });
        } else {
            // No SSL
            this.log().ctx('setup').warn('No SSL is setup, starting plain server');
            this._httpServer = this._impl.listen(this.config.port, ()=>{
                this.log().ctx('setup').warn(`Start listening port ${this.config.port}, no SSL`);
                assert.equal('object', typeof this._httpServer);
                cb();
            });
        }
    }



    Http.prototype._stop = function(cb) {
//      this.log().ctx('teardown').ctx('stop').info('Stopping...');

        assert(cb);
        assert(this._httpServer);
        assert(this._impl);
        assert(this.config);
        assert(this.loadCertificates);

        this._httpServer.close();
        this._httpServer = undefined;
        // No way! this._impl = undefined;
        this.config = undefined;
        this.loadCertificates = undefined;

//      this.log().ctx('teardown').ctx('stop').info('Stoping is complete');
        setImmediate(cb);
    }



    Http.prototype._createImpl = function(cb) {
//      this.log().ctx('setup').ctx('impl').info('Creating app impl(express)...');

        assert.equal('undefined', typeof this._impl);
        this._impl = Impl();

        // Setup view engine
        this._impl.set('views', api.lib.env.makePath('views'));
        this._impl.set('view engine', 'ejs');

        // Setup request logger MW
        assert(this.loggerFs.access, 'No access stream is specified');
        const logger  = this.loggerFs.access.bind(this.loggerFs);
        const requestLogger = api.lib.re('src/lib/requestLogger')(logger);
        this._impl.use(requestLogger);

        // Initialize cookie MW
        if (this.config.session && this.config.session.secret) {
//          this.log().ctx('setup').ctx('impl').info('Session secret is set, initializing session MW...');
//          this.log().ctx('setup').ctx('impl').info('session key:' + this.config.session.secret);
//          this.log().ctx('setup').ctx('impl').info('session age:' + this.config.session.age);
            assert(this.config.session.age, 'Cookie is enabled but age is not set');
            const cookieSession = require('cookie-session');
            this._impl.use(cookieSession({
                keys: [this.config.session.secret],
                maxAge: this.config.session.age,
            }));
//          this.log().ctx('setup').ctx('impl').info('Session secret is set, initializing session MW is complete');
        }

        // Initialize passport MW
        const passport = require('passport');
        this._impl.use(passport.initialize());
        this._impl.use(passport.session());

        // Setup body parser to support POST
        const bodyParser = require('body-parser');
        this._impl.use(bodyParser.json()); // support json encoded bodies
        this._impl.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
    
//      this.log().ctx('setup').ctx('impl').info('Creating app impl(express) is complete');
        setImmediate(cb);
    }   
            
                
            
    Http.prototype._destroyImpl = function(cb) {
//      this.log().ctx('teardown').ctx('impl').info('Destroying app impl(express)...');
        
        assert.equal('function', typeof this._impl);
        const impl = this._impl;
        this._impl = undefined;
    
//      this.log().ctx('teardown').ctx('impl').info('Destroying app impl(express)...');
        setImmediate(cb);
    }



    Http.prototype._loadRoutes = function(cb) {
//      this.log().ctx('setup').ctx('routes').info('Loading routes...');

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

        api.lib.routerHelper.loadRoutes(router, 'http', accessController, failure);
        this._impl.use(router);

//      this.log().ctx('setup').ctx('routes').info('Loading routes is complete');
        setImmediate(cb);
    }



    Http.prototype._unloadRoutes = function(cb) {
//      this.log().ctx('teardown').ctx('routes').info('Unloading routes...');

        const accessController = this._accessController;
        if (accessController) {
            this._accessController = undefined;
        }

//      this.log().ctx('teardown').ctx('routes').info('Unloading routes is complete');
        setImmediate(cb);
    }



    Http.assertIsStopped = function(service) {
        assert.equal('undefined', typeof service._impl);
        assert.equal('undefined', typeof service._accessController);
        assert.equal('undefined', typeof service._httpServer);
    }



    Http.assertIsStarted = function(service) {
        assert.notEqual('undefined', typeof service._impl);
        assert.notEqual('undefined', typeof service._accessController);
        assert.notEqual('undefined', typeof service._httpServer);
    }



    return Http;
}

