'use strict';

const assert = require('assert');

module.exports = (dbc, tableName, Constructor, opts, cb)=>{
//  console.log(`model.helpers.add(), tableName:${tableName}, opts:`, opts);
    const element = new Constructor(opts);

    let keys = '';
    let values = '';

    const dkeys = Object.keys(element);
    dkeys.forEach((k, index)=>{
        const k2 = Constructor.dbKeys[k];
        const v = element[k];
        if (v) {
            if (index !== 0) {
                keys += ',';
                values += ',';
            }
            keys += k2;
            values += `'${v}'`;
        }
    });

    const q = `INSERT INTO ${tableName}(${keys}) VALUES(${values})`;
//  console.log(`model.helpers.add, q:${q}`);
    dbc.query(q, (err, res) => {
//      console.log('model.helpers.add, err:', err);
//      console.log('model.helpers.add, res:', res);
        if (err) {
            cb(err);
        } else {
//          console.log('model.helpers.add, element:', element);
            cb(err, element);
        }
    });
}
