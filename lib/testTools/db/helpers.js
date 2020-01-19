'use strict';

const assert = require('assert')
    , pg = require('pg');

const helpers = {};

helpers.createDbName = (name)=>{
    return 'ut_' + name.toLowerCase();
}

helpers.connect = (props, cb)=>{
//  console.log('helpers.connect()');
    assert(props);
    assert(props.database);
    assert(cb);
//  console.log('helpers.connect, props:', props);

    const dbc = new pg.Client(props);
    dbc.connect((err)=>{
        if (err) {
            dbc.end();
            cb(err);
        } else {
            cb(err, dbc);
        }
    });
}

// \brief Create database.
// https://stackoverflow.com/questions/20813154/node-postgres-create-database
// https://github.com/olalonde/pgtools/blob/master/index.js
helpers.create = (props, dbName, cb)=>{
//  console.log('helpers.create()');
    assert(props);
    assert(props.database); // master database
    assert(dbName); // db to create
    assert(cb);
//  console.log('helpers.create, props:', props);

    const queries = [
        'drop database if exists ' + dbName + ';',
        'create database ' + dbName + ';'
    ];

    const dbc = new pg.Client(props);
    dbc.connect((err)=>{
        if (err) {
            dbc.end();
            cb(err);
        } else {
            helpers.querySqls(dbc, queries, (err)=>{
                dbc.end();
                cb(err);
            });
        }
    });
}

// \brief Create database, establish connection and make some queries.
helpers.createAndQuery = (props, dbName, queries, cb)=>{
//  console.log('helpers.createAndQuery(), dbName:' + dbName);
    assert(props);
    assert(props.database); // master database
    assert(dbName); // db to create
    assert(queries);
    assert(cb);
//  console.log('helpers.createAndQuery, host:' + helpers.cridentials.host + ', user:' + helpers.cridentials.user + ', password:' + helpers.cridentials.password + ', dbName:' + dbName);

    helpers.create(props, dbName, (err)=>{
        if (err) {
            cb(err);
        } else {
            const dbProps = JSON.parse(JSON.stringify(props));
            dbProps.database = dbName; // Override database name
//          console.log('helpers.createAndQuery, dbProps:', dbProps);
            const dbc = new pg.Client(dbProps);
            dbc.connect((err)=>{
                if (err) {
                    dbc.end();
                    cb(err);
                } else {
                    helpers.querySqls(dbc, queries, (err)=>{
                        dbc.end();
                        cb(err);
                    });
                }
            });
        }
    });
}

// \brief Connect to database and make a query.
// https://stackoverflow.com/questions/20813154/node-postgres-create-database
// https://github.com/olalonde/pgtools/blob/master/index.js
helpers.connectAndQuery = (props, query, cb)=>{
//  console.log('helpers.connectAndQuery()');
    assert(props);
    assert(props.database);
    assert(cb);
//  console.log('helpers.connectAndQuery, props:', props);

    const dbc = new pg.Client(props);
    dbc.connect((err)=>{
        if (err) {
            dbc.end();
            cb(err);
        } else {
            dbc.query(query, (err, result)=>{
                dbc.end();
//              console.log('err:' + err);
                assert(!err, err + ', q:' + query);
                cb(err, result);
            });
        }
    });
}

// \brief Perform a set of queries on a database.
helpers.querySqls = (dbc, queries, cb)=>{
    assert(dbc);
    assert(queries);
    assert(cb);

    const run = function(index, queries, cb) {
        if (index < queries.length) {
//          console.log('helpers.querySqls, q:' + queries[index]);
            dbc.query(queries[index], [], function(err, res) {
//              console.log('helpers.querySqls, err:' + err);
                assert(!err, err + ', q:' + queries[index]);
                run(index + 1, queries, cb)
            });
        } else {
            cb();
        }
    }

    run(0, queries, ()=>{
        cb();
    });
}

// \brief Perform a query on a database.
helpers.query = (dbc, query, cb)=>{
    assert(dbc);
    assert(query);
    assert(cb);

    dbc.query(query, [], function(err, res) {
//      console.log('helpers.querySqls, err:' + err);
        //assert(!err, err + ', q:' + queries[index]);
        cb(err, res);
    });
}


module.exports = helpers;

