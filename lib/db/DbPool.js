'use strict';

const assert = require('assert');
const pg = require('pg');

module.exports = (api)=>{
    assert(api);
    const DbPool = pg.Pool;

    DbPool.close = (index, items, cb)=>{
        const keys = Object.keys(items);
        if (index < keys.length) {
            const v = items[keys[index]];
            v.dbc.end(()=>{
                DbPool.close(index+1, items, cb);
            });
        } else {
            cb();
        }
    }

    return DbPool;
}

