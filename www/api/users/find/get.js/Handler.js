'use strict';

const assert = require('assert');

module.exports = function (api) {
    assert(api);

    const KEYS = [
        api.model.User.dbKeys.stts,
        api.model.User.dbKeys.uid,
        api.model.User.dbKeys.displayName,
        api.model.User.dbKeys.cat,
        api.model.User.dbKeys.authProviderName,
        api.model.User.dbKeys.authProviderId
    ];

    // curl -i -X GET  "localhost:3000/api/users/find?key=<uid>&value=<value>"
    const Handler = function(opts) {
        assert(opts.route);
        assert(opts.method);
        this.route = opts.route;
        this.method = opts.method;
        this._logPrefix = `${this.method}${this.route}`;
    }

    Handler.prototype.handle = function(req, res, next) {
//      console.log(`${this._logPrefix}.handle(), key:${req.query.key}, value:${req.query.value}`);
        const users = req.app.zzz.model.users;
        const key = req.query.key;
        const value = req.query.value;
        const params = {keys:KEYS, where:{}};
        const dbKey = api.model.User.dbKeys[key];
        if (!dbKey) {
            return res.sendStatus(500);
        }
        params.where[dbKey] = value;
        users.query(params, (err, items)=>{
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

