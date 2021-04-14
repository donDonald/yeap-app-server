'use strict';

const assert = require('assert');

function makeLikeStatement(value) {
    //http://www.postgresqltutorial.com/postgresql-like/
    let res = value.replace(/\*\*/g, '%');
    res = res.replace(/\*/g, '_');
    return res;
}

module.exports = (dbc, tableName, cb)=>{
//  console.log(`model.helpers.count(), tableName:${tableName}`);
        
    const q = `SELECT COUNT(*) AS count FROM ${tableName}`;
//  console.log('model.FindEx.count, q:', q);
    dbc.query(q, (err, res) => {
//      console.log('model.helpers.count, err:', err);
//      console.log('model.helpers.count, res:', res);
        cb(err, res.rows[0].count);
    });
}
