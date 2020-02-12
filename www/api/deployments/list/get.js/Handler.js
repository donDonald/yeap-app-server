'use strict';

const assert = require('assert');

module.exports = function (api) {
    assert(api);

    const KEYS = [
        api.model.Deployment.dbKeys.stts,
        api.model.Deployment.dbKeys.did
    ];

    // curl -i -X GET  "localhost:3000/api/deployments/list?position=<position>&count=<count>"
    const Handler = function(opts) {
        assert(opts.route);
        assert(opts.method);
        this.route = opts.route;
        this.method = opts.method;
        this._logPrefix = `${this.method}${this.route}`;
    }

    Handler.prototype.handle = function(req, res, next) {
//      console.log(`${this._logPrefix}.handle(), position:${req.query.position}, count:${req.query.count}`);
        const deployments = req.app.zzz.model.deployments;
        const position = req.query.position;
        const count = req.query.count;
        const result = {};
        deployments.count((err, totalCount)=>{
            if (err) {
//              console.log(`${this._logPrefix}.handle, deployments.count error:${err}`);
                res.sendStatus(500);
                return;
            }
//          console.log(`${this._logPrefix}.handle, deployments.count:${totalCount}`);
            result.totalCount = totalCount;

            deployments.list(KEYS, position, count, (err, items)=>{
                if (err) {
//                  console.log(`${this._logPrefix}.handle, deployments.list error:${err}`);
                    res.sendStatus(500);
                    return;
                }
//              console.log(`${this._logPrefix}.handle, SUCCESS:`, items);
                result.deployments = items;
                res.status(200).json(result);
            });
        });
    }

    return Handler;
}

