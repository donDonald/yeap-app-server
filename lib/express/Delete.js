'use strict';

const assert = require('assert');

module.exports = function (api) {

    const Delete = function(setup, body) {
        this.method = 'DELETE';
        this.body = body;
        if (setup) {
            setup(this);
        }
    }

    // Subclass req
    const req = require('passport/lib/http/request.js');
    Delete.prototype = Object.create(req);

    return Delete;
}

