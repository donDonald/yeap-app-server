'use strict';

const assert = require('assert');

const query = {}

query.makeLikeStatement = function(value) {
    //http://www.postgresqltutorial.com/postgresql-like/
    let res = value.replace(/\*\*/g, '%');
    res = res.replace(/\*/g, '_');
    return res;
}

query.makeColumns = function(columns) {
    const type = typeof columns;
    if ('undefined' === type) {
        return '*';
    } else if ('string' === type) {
        return columns;
    } else {
        assert(Array.isArray(columns));
        return columns.join(',');
    }
}

query.makeWhere = function(where) {
    const type = typeof where;
    if ('undefined' === type) {
        return '';
    } else if ('string' === type) {
        return ' WHERE ' + where;
    } else {
        const keys = Object.keys(where);
        if (keys.length === 0) {
            return '';
        }
        let matchStatement;
        let result = ' WHERE ';
        for(let i=0; i<keys.length; ++i) {
            if (i>0) result += ' AND '
            const k = keys[i];
            const v = where[keys[i]];
            const v2 = query.makeLikeStatement(v);
            if (v2 === v) {
                matchStatement = '=';
            } else {
                matchStatement = ' LIKE ';
            }
            const sub = `${k}${matchStatement}'${v2}'`;
//          console.log(`makeWhere, k:${k}, v:${v}, v2:${v2}, sub:${sub}`);
            result += sub;
        }
        return result;
    }
}

query.makePositionStatement = function(position) {
    let result = '';
    if (position) {
        if (typeof position.count !== 'undefined') {
            result += ` LIMIT ${position.count}`;
        }
        if (typeof position.offset !== 'undefined') {
            result += ` OFFSET ${position.offset}`;
        }
    }
    return result;
}

query.makeOrderStatement = function(order) {
    let result = '';
    if (order) {
        if (typeof order.by!== 'undefined') {
            result += ` ORDER BY ${order.by}`;
        }
        if (typeof order.direction !== 'undefined') {
            result += ` ${order.direction}`;
        }
    }
    return result;
}

query.makeQuery = function(tableName, opts) {
    const columns = query.makeColumns(opts.keys);
    const where = query.makeWhere(opts.where);
    const order = query.makeOrderStatement(opts.order);
    const position = query.makePositionStatement(opts.position);
    const q = `SELECT ${columns} FROM ${tableName}${where}${order}${position}`;
    return q;
}

query.run = function(dbc, tableName, Constructor, inserter, opts, cb) {
//  console.log(`model.helpers.query.run(), tableName:${tableName}, opts:`, opts);
    query.q = query.makeQuery(tableName, opts);
//  console.log(`model.helpers.query.run, q:${query.q}`);
    dbc.query(query.q, (err, res) => {
//      console.log('model.helpers.query.run, err:', err);
//      console.log('model.helpers.query.run, res:', res);
        let values = inserter();
        if (!err) {
            res.rows.forEach((r)=>{
                const value = new Constructor(r);
                inserter(values, value);
            });
        }
//      console.log('model.helpers.query.run, values:', values);
        cb(err, values);
    });
}

module.exports = query;
