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
//      console.log(`${this._logPrefix}.handle()`);

        let result;
        const id = req.query.id;
        if (id) {
            result = req.app.zzz.model.news[id];
        } else {
            result = req.app.zzz.model.news;
        }

        res.status(200).json(result);
    }

    return Handler;
}

