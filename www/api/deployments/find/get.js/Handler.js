'use strict';

const assert = require('assert');

module.exports = function (api) {
    assert(api);

    const KEYS = [
        api.model.Deployment.dbKeys.stts,
        api.model.Deployment.dbKeys.did
    ];

    // curl -i -X GET  "localhost:3000/api/deployments/find?key=<did>&value=<value>"
    const Handler = function(opts) {
        assert(opts.route);
        assert(opts.method);
        this.route = opts.route;
        this.method = opts.method;
        this._logPrefix = `${this.method}${this.route}`;
    }

    Handler.prototype.handle = function(req, res, next) {
//      console.log(`${this._logPrefix}.handle(), key:${req.query.key}, value:${req.query.value}`);
        const deployments = req.app.zzz.model.deployments;
        const key = req.query.key;
        const value = req.query.value;
        const params = {keys:KEYS, where:{}};
        const dbKey = api.model.Deployment.dbKeys[key];
        if (!dbKey) {
            return res.sendStatus(500);
        }
        params.where[dbKey] = value;
        deployments.query(params, (err, items)=>{
            if (err) {
//              console.log(`${this._logPrefix}.handle, error:${err}`);
                res.sendStatus(500);
            } else {
//              console.log(`${this._logPrefix}.handle, SUCCESS:`, items);
                res.status(200).json(items);
            }
        });
    }

    return Handler;
}

