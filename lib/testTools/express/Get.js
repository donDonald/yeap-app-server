'use strict';

const assert = require('assert');

module.exports = function (api) {

    const Get = function(setup, query) {
        this.method = 'GET';
        this.query = query;
        if (setup) {
            setup(this);
        }
    }

    // Subclass req
    const req = require('passport/lib/http/request.js');
    Get.prototype = Object.create(req);

    return Get;
}

