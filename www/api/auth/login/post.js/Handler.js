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
        const params = req.body;
//      console.log(`${this._logPrefix}.handle(), did:${params.did}, cat:${params.cat}`);
        const logins = req.app.zzz.model.logins;
        const cat = params.cat;
        const did = params.did;
        logins.login(did, cat, (err, result)=>{
            if (err) {
//              console.log(`${this._logPrefix}.handle, error:${err}`);
                res.sendStatus(401);
            } else {
//              console.log(`${this._logPrefix}.handle, SUCCESS, result:`, result);
                res.status(200).json(result);
            }
        });
    }

    return Handler;
}

