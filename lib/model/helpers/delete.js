'use strict';

const assert = require('assert');

module.exports = (dbc, tableName, idName, id, cb)=>{
//  console.log(`model.helpers.delete(), tableName:${tableName}, ${idName}:${id}`);

    const q = `DELETE FROM ${tableName} WHERE ${idName}='${id}'`;
//  console.log(`model.helpers.add, q:${q}`);
    dbc.query(q, (err, res) => {
//      console.log('model.helpers.delete, err:', err);
//      console.log('model.helpers.delete, res:', res);
        cb(err);
    });
}
