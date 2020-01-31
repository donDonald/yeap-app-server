'use strict';

const assert = require('assert');

module.exports = function(api) {
    const re = (path)=>{
        let m;
        try {
            m = require(api.lib.env.makePath(path));
        } catch (e) {
        }
        return m;
    }
    return re;
}

