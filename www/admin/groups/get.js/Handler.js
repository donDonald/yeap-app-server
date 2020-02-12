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

        const keys = Object.keys(api.model.Group.dbKeys);

        const opts = {
            name:'groups',
            itemName:'group',
            itemId:'gid',
            urls: {
                list:'/api/groups/list',
                add:'/api/groups/add',
                delete:'/api/groups/delete',
                find:'/api/groups/find',
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

