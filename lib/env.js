'use strict';

const assert = require('assert');

const env = {};
env.root = process.env.APP_ROOT;
assert(env.root, 'APP_ROOT is not set!');
//console.log(`env.APP_ROOT:${env.root}`);

env.makePath = (path)=>{ return env.root + '/' + path; }

module.exports = env;


