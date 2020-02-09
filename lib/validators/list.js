'use strict';

const assert = require('assert');
const { check } = require('express-validator');

module.exports = function(api) {
    assert(api);

    const rules = () => {
        return [
            check('position').isInt({min:0}),
            check('count').isInt({min:1, max:1000}),
        ];
    }

    const validate = require('./validate')(api);

    return {
        rules,
        validate,
    }
}
