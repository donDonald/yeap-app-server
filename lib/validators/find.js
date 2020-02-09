'use strict';

const assert = require('assert');
const { check } = require('express-validator');

module.exports = function(api) {
    assert(api);

    const rules = () => {
        return [
            check('key').matches(api.model.types.findKey),
            check('value').matches(api.model.types.findValue),
        ];
    }

    const validate = require('./validate')(api);

    return {
        rules,
        validate,
    }
}
