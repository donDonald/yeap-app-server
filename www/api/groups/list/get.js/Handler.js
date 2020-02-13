'use strict';

const assert = require('assert');

module.exports = function (api) {
    assert(api);

    const KEYS = [
        api.model.Group.dbKeys.stts,
        api.model.Group.dbKeys.gid
    ];

    // curl -i -X GET  "localhost:3000/api/groups/list?position=<position>&count=<count>"
    const Handler = function(opts) {
        assert(opts.route);
        assert(opts.method);
        this.route = opts.route;
        this.method = opts.method;
        this._logPrefix = `${this.method}${this.route}`;
    }

    Handler.prototype.handle = function(req, res, next) {
//      console.log(`${this._logPrefix}.handle(), position:${req.query.position}, count:${req.query.count}`);
        const groups = req.app.zzz.model.groups;
        const position = req.query.position;
        const count = req.query.count;
        const result = {};
        groups.count((err, totalCount)=>{
            if (err) {
//              console.log(`${this._logPrefix}.handle, groups.count error:${err}`);
                res.sendStatus(500);
                return;
            }
//          console.log(`${this._logPrefix}.handle, groups.count:${totalCount}`);
            result.totalCount = totalCount;

            groups.list(KEYS, position, count, (err, items)=>{
                if (err) {
//                  console.log(`${this._logPrefix}.handle, groups.list error:${err}`);
                    res.sendStatus(500);
                    return;
                }
//              console.log(`${this._logPrefix}.handle, SUCCESS:`, items);
                result.groups = items;
                res.status(200).json(result);
            });
        });
    }

    return Handler;
}


