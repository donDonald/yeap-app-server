'use strict';

const assert = require('assert');

module.exports = (api)=>{
    assert(api);

    const makeId = ()=>{
        return api.Md5(Math.random().toString(16));
    }

    return makeId;
}

