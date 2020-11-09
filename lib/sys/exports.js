'use strict';

const assert = require('assert');

module.exports = function(api) {
    assert(api);

    const sys = {};
    sys.hosts = require('./hosts.js')(api);
    return sys;
}

