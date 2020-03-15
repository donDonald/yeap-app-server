'use strict';

const assert = require('assert');
const pg = require('pg');

module.exports = (api)=>{
    assert(api);
    const DbPool = pg.Pool;
    return DbPool;
}

