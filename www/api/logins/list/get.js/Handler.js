'use strict';

const assert = require('assert');

module.exports = function (api) {
    assert(api);

    const KEYS = [
        api.model.Login.dbKeys.stts,
        api.model.Login.dbKeys.lid,
        api.model.Login.dbKeys.did,
        api.model.Login.dbKeys.uid
    ];

    // curl -i -X GET  "localhost:3000/api/logins/list?position=<position>&count=<count>"
    const Handler = function(opts) {
        assert(opts.route);
        assert(opts.method);
        this.route = opts.route;
        this.method = opts.method;
        this._logPrefix = `${this.method}${this.route}`;
    }

    Handler.prototype.handle = function(req, res, next) {
//      console.log(`${this._logPrefix}.handle(), position:${req.query.position}, count:${req.query.count}`);
        const logins = req.app.zzz.model.logins;
        const position = req.query.position;
        const count = req.query.count;
        const result = {};
        logins.count((err, totalCount)=>{
            if (err) {
//              console.log(`${this._logPrefix}.handle,._logins.count error:${err}`);
                res.sendStatus(500);
                return;
            }
//          console.log(`${this._logPrefix}.handle,._logins.count:${totalCount}`);
            result.totalCount = totalCount;

            logins.list(KEYS, position, count, (err, items)=>{
                if (err) {
//                  console.log(`${this._logPrefix}.handle,._logins.list error:${err}`);
                    res.sendStatus(500);
                    return;
                }
//              console.log(`${this._logPrefix}.handle, SUCCESS:`, items);
                result.logins = items;
                res.status(200).json(result);
            });
        });
    }

    return Handler;
}

