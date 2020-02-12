'use strict';

const assert = require('assert');

module.exports = function (api) {
    assert(api);

    const Method = function(opts) {
        assert(opts.route);
        assert(opts.method);
        this.route = opts.route;
        this.method = opts.method;
        this._logPrefix = `${this.method}${this.route}`;
    }

    Method.prototype.handle = function(req, res, next) {
        const params = req.body;
//      console.log(`${this._logPrefix}.handle(), uid:${params.uid}`);
        const opts = {};
        opts.uid = params.uid;
        opts.cat = params.cat;
        opts.displayName = params.displayName;
        opts.thumbnail = params.thumbnail;
        opts.authProviderName = params.authProviderName;
        opts.authProviderId = params.authProviderId;
        opts.authProviderRawString = params.authProviderRawString;
        const users = req.app.zzz.model.users;
        users.add(opts, (err, result)=>{
            if (err) {
//              console.log(`${this._logPrefix}.handle, error:${err}`);
                res.sendStatus(500);
            } else {
//              console.log(`${this._logPrefix}.handle, SUCCESS:`, result);
                res.status(200).json(result);
            }
        });
    }

    return Method;
}

