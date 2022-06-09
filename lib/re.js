'use strict';

const assert = require('assert');

module.exports = (api)=>{
    assert(api);

    const re = (path)=>{
        let m;
        try {
            m = require(api.env.makePath(path));
        } catch (e) {
            api.log.error('Failed to require module:' + path);
        }
        return m;
    }

    return re;
}

