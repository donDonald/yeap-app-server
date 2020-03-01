'use strict';

const assert = require('assert');

module.exports = (api)=>{
    assert(api);
    const stuff = {};

    stuff.root = process.env.APP_ROOT;
    assert(stuff.root, 'APP_ROOT is not set!');
    console.log(`stuff.APP_ROOT:${stuff.root}`);

    stuff.makePath = (path)=>{ return stuff.root + '/' + path; }

    return stuff;
}

