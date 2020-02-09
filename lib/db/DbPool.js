'use strict';

const assert = require('assert')
    , pg = require('pg');

module.exports = function(api) {
    assert(api);

    const DbPool = pg.Pool;

    return DbPool;
}

