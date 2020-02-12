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

        const keys = Object.keys(api.model.Deployment.dbKeys);

        const opts = {
            name:'deployments',
            itemName:'deployment',
            itemId:'did',
            urls: {
                list:'/api/deployments/list',
                add:'/api/deployments/add',
                delete:'/api/deployments/delete',
                find:'/api/deployments/find',
            }
        };

        const user = {};
        user.displayName = req.user.displayName;
        user.thumbnail = req.user.thumbnail;
//      console.log(`${this._logPrefix}.handle, user:`, user);

        const template = {};
        template.templateUser = user;
        template.templateKeys = keys;
        template.templateOpts = opts;
        res.render('elements', template);
    }

    return Handler;
}

