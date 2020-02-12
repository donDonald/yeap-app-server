'use strict';

const assert = require('assert');

module.exports = function (api) {
    assert(api);

    const Handler = function(opts) {
        assert(opts.route);
        assert(opts.method);
        this.route = opts.route;
        this.method = opts.method;
        this._logPrefix = `${this.method}${this.route}`;
    }

    Handler.prototype.handle = function(req, res, next) {
//      console.log(`${this._logPrefix}.handle()`);
        req.app.zzz.authProviders.facebookToken.authFoo1(req, res, (err)=>{
            //res.send(req.user ? {userId:req.user.uid} : 401);
            res.redirect('/auth/profile');
        });
    }

    return Handler;
}

