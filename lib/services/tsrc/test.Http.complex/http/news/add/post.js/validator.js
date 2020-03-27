'use strict';

const assert = require('assert');
const { check, oneOf } = require('express-validator');

module.exports = function(api) {
    assert(api);
    const re = function(module) { return require('../../../../../../../' + module); }

    const rules = () => {
        return [
            check('id').exists().isString().notEmpty(),
            check('title').exists().isString().notEmpty(),
        ];
    }

    const validate = re('validators/validate')(api);

    return {
        rules,
        validate,
    }
}
