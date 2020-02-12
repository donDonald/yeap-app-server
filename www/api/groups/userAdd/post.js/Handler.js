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
//      console.log(`${this._logPrefix}.handle(), gid:${params.gid}, uid:${params.uid}`);
        const groups = req.app.zzz.model.groups;
        const gid = params.gid;
        const uid = params.uid;
        groups.userAdd(gid, uid, (err, result)=>{
            if (err) {
//              console.log(`${this._logPrefix}.handle, error:${err}`);
                res.sendStatus(500);
            } else {
//              console.log(`${this._logPrefix}.handle, SUCCESS:`, result);
                res.sendStatus(200);
            }
        });
    }

    return Handler;
}

