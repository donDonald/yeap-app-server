'use strict';

const assert = require('assert');

module.exports = (api)=>{
    assert(api);
    const stuff = {};

    stuff.root = process.env.APP_ROOT;
    assert(stuff.root, 'APP_ROOT is not set!');
//  console.log(`stuff.root:${stuff.root}`);

    stuff.appName = process.env.APP_NAME || 'TBD';
    assert(stuff.appName, 'APP_NAME is not set!');
//  console.log(`stuff.appName:${stuff.appName}`);

    stuff.makePath = (path)=>{
//      console.log('env.makePath(), root:' + stuff.root + ', path:' + path);
        return stuff.root + '/' + path;
    }

    return stuff;
}

