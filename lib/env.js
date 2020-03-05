'use strict';

const assert = require('assert');

module.exports = (api)=>{
    assert(api);
    const stuff = {};

    stuff.root = process.env.APP_ROOT;
    assert(stuff.root, 'APP_ROOT is not set!');
//  console.log(`stuff.APP_ROOT:${stuff.root}`);
//  console.trace();

    stuff.makePath = (path)=>{
//      console.log('env.makePath(), root:' + stuff.root + ', path:' + path);
        return stuff.root + '/' + path;
    }

    return stuff;
}

