'use strict';

const assert = require('assert')
    , pg = require('pg')
    , env = require('../env');

const tools = {};

tools.masterDbProps = {
    host: '127.0.0.1',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'example',
};

tools.schemas = env.root + '/db/';
tools.tableUsers= 'users.sql';
tools.tableDeployments = 'deployments.sql';
tools.tableLogins = 'logins.sql';
tools.tableGroups = 'groups.sql';
tools.tableUsersGroups = 'usersgroups.sql';



tools.createDbName = (name)=>{
    return 'ut_' + name.toLowerCase();
}



tools.connect = (props, cb)=>{
//  console.log('lib.db.tools.connect()');
    assert(props);
    assert(props.database);
    assert(cb);
//  console.log('lib.db.tools.connect, props:', props);

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
tools.create = (props, dbName, cb)=>{
//  console.log('lib.db.tools.create()');
    assert(props);
    assert(props.database); // master database
    assert(dbName); // db to create
    assert(cb);
//  console.log('lib.db.tools.create, props:', props);

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
            tools.querySqls(dbc, queries, (err)=>{
                dbc.end();
                cb(err);
            });
        }
    });
}



// \brief Create database, establish connection and make some queries.
tools.createAndQuery = (props, dbName, queries, cb)=>{
//  console.log('lib.db.tools.createAndQuery(), dbName:' + dbName);
    assert(props);
    assert(props.database); // master database
    assert(dbName); // db to create
    assert(queries);
    assert(cb);
//  console.log('lib.db.tools.createAndQuery, host:' + tools.cridentials.host + ', user:' + tools.cridentials.user + ', password:' + tools.cridentials.password + ', dbName:' + dbName);

    tools.create(props, dbName, (err)=>{
        if (err) {
            cb(err);
        } else {
            const dbProps = JSON.parse(JSON.stringify(props));
            dbProps.database = dbName; // Override database name
//          console.log('lib.db.tools.createAndQuery, dbProps:', dbProps);
            const dbc = new pg.Client(dbProps);
            dbc.connect((err)=>{
                if (err) {
                    dbc.end();
                    cb(err);
                } else {
                    tools.querySqls(dbc, queries, (err)=>{
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
tools.connectAndQuery = (props, query, cb)=>{
//  console.log('lib.db.tools.connectAndQuery()');
    assert(props);
    assert(props.database);
    assert(cb);
//  console.log('lib.db.tools.connectAndQuery, props:', props);

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
tools.querySqls = (dbc, queries, cb)=>{
    assert(dbc);
    assert(queries);
    assert(cb);

    const run = function(index, queries, cb) {
        if (index < queries.length) {
//          console.log('lib.db.tools.querySqls, q:' + queries[index]);
            dbc.query(queries[index], [], function(err, res) {
                if (err) {
                    console.log('lib.db.tools.querySqls, err:' + err);
                }
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
tools.query = (dbc, query, cb)=>{
    assert(dbc);
    assert(query);
    assert(cb);

    dbc.query(query, [], function(err, res) {
//      console.log('lib.db.tools.querySqls, err:' + err);
        //assert(!err, err + ', q:' + queries[index]);
        cb(err, res);
    });
}

module.exports = tools;

