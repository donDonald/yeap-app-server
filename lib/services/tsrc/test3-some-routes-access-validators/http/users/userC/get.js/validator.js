'use strict';

const assert = require('assert');
const { check, oneOf } = require('express-validator');

module.exports = function(api) {
    assert(api);
    const re = function(module) { return require('../../../../../' + module); }

    const rules = () => {
        return [
            //check('cat').exists().isEmpty(),
        ];
    }

    const validate = re('validators/validate')(api);

    return {
        rules,
        validate,
    }
}
