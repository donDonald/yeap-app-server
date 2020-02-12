'use strict';

const assert = require('assert');

module.exports = function (api) {
    assert(api);

    // PTFIXME: Meant only for tests!
    const Handler = function(opts) {
        assert(opts.route);
        assert(opts.method);
        this.route = opts.route;
        this.method = opts.method;
        this._logPrefix = `${this.method}${this.route}`;
    }

    Handler.prototype.handle = function(req, res, next) {
        const params = req.body;
//      console.log(`${this._logPrefix}.handle(), did:${params.did}`);
        const deployments = req.app.zzz.model.deployments;
        const did = params.did;
        deployments.delete(did, (err)=>{
            if (err) {
//              console.log(`${this._logPrefix}.handle, error:${err}`);
                res.sendStatus(500);
            } else {
//              console.log(`${this._logPrefix}.handle, SUCCESS`);
                res.sendStatus(200);
            }
        });
    }

    return Handler;
}

