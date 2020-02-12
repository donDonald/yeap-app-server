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

    // curl -i -X GET  "localhost:3000/api/users/list?position=<position>&count=<count>"
    const Handler = function(opts) {
        assert(opts.route);
        assert(opts.method);
        this.route = opts.route;
        this.method = opts.method;
        this._logPrefix = `${this.method}${this.route}`;
    }

    Handler.prototype.handle = function(req, res, next) {
//      console.log(`${this._logPrefix}.handle(), position:${req.query.position}, count:${req.query.count}`);
        const users = req.app.zzz.model.users;
        const position = req.query.position;
        const count = req.query.count;
        const result = {};
        users.count((err, totalCount)=>{
            if (err) {
//              console.log(`${this._logPrefix}.handle, users.count error:${err}`);
                res.sendStatus(500);
                return;
            }
//          console.log(`${this._logPrefix}.handle, users.count:${totalCount}`);
            result.totalCount = totalCount;

            users.list(KEYS, position, count, (err, items)=>{
                if (err) {
//                  console.log(`${this._logPrefix}.handle, users.list error:${err}`);
                    res.sendStatus(500);
                    return;
                }
//              console.log(`${this._logPrefix}.handle, SUCCESS:`, items);
                result.users = items;
                res.status(200).json(result);
            });
        });
    }

    return Handler;
}

