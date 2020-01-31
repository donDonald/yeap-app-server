'use strict';

const assert = require('assert');

module.exports = function (api) {

    //https://expressjs.com/en/guide/routing.html
    //https://flaviocopes.com/express-validate-input/
    //https://express-validator.github.io/docs/check-api.html
    const Router = function() {
        this.routes = {
            GET: {},
            POST: {},
            DELETE: {},
        };

        this.add = function(method, route, a, b, c, d) {
            const handlers = [];
            if (a) {
                const v = a;
                if (Array.isArray(v)) {
                    v.forEach((h)=>{handlers.push(h);});
                } else {
                    handlers.push(v);
                }
            }
            if (b) {
                const v = b;
                if (Array.isArray(v)) {
                    v.forEach((h)=>{handlers.push(h);});
                } else {
                    handlers.push(v);
                }
            }
            if (c) {
                const v = c;
                if (Array.isArray(v)) {
                    v.forEach((h)=>{handlers.push(h);});
                } else {
                    handlers.push(v);
                }
            }
            if (d) {
                const v = d;
                if (Array.isArray(v)) {
                    v.forEach((h)=>{handlers.push(h);});
                } else {
                    handlers.push(v);
                }
            }

            this.routes[method][route] = {handlers:handlers};
        }

        this.get = this.add.bind(this, 'GET');
        this.post = this.add.bind(this, 'POST');
        this.delete = this.add.bind(this, 'DELETE');


        this.handle = function(route, req, res, next) {
//          console.log(`testTools.express.Router.handle(), method:${req.method}, route:${route}`);

            const r = this.routes[req.method][route];
            assert(r);
            assert(r.handlers);

            const self = this;
            const runMw = function(index, mws, cb) {
                if (index<mws.length) {
                    const mw = self.mws[index];
                    mw(req, res, (err)=>{
//                      console.log('testTools.express.Router.handle(), handling mw No:' + index);
//                      console.log('testTools.express.Router.handle(), req:', req);
                        if (err) {
                            assert(false);
                        } else {
                            runMw(index+1, mws, cb);
                        }
                    });
                } else {
                    cb();
                }
            }

            const runHandlers = function(index, handlers, req, res, cb) {
//console.log(`BBBBB, runHandlers, index:${index}, length:${handlers.length}`);
                if (index<handlers.length) {
                    const h = handlers[index];
//console.log(`CCCCC, handler[${index}]`);
                    h(req, res, (err)=>{
//console.log(`DDDDD, handler[${index}]: err:${err}`);
                        runHandlers(index+1, handlers, req, res, cb);
                    });
                } else {
                    cb();
                }
            }

            runMw(0, this.mws, ()=>{
                runHandlers(0, r.handlers, req, res, ()=>{
                });
            });
        }

        // Setup mw for req, like express does
        // Check node_modules/passport/lib/middleware/initialize.js
        this.mws = [];

        this.use = function(mw) {
//          console.log('testTools.express.Router.use(), typeof mw:' + typeof mw);
            assert(mw);
            assert.equal('function', typeof mw);
            this.mws.push(mw);
        }
    }

    return Router;
}

