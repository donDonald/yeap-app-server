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
//      console.log(`${this._logPrefix}.handle(), lid:${params.lid}, did:${params.did}, uid:${params.uid}`);
        const logins = req.app.zzz.model.logins;
        const lid = params.lid;
        const did = params.did;
        const uid = params.uid;
        logins.add({lid:lid, did:did, uid:uid}, (err, result)=>{
            if (err) {
//              console.log(`${this._logPrefix}.handle, error:${err}`);
                res.sendStatus(500);
            } else {
//              console.log(`${this._logPrefix}.handle, SUCCESS:`, result);
                res.status(200).json(result);
            }
        });
    }

    return Handler;
}

