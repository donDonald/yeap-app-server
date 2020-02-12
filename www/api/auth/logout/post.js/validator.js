'use strict';

const assert = require('assert');
const { check, oneOf } = require('express-validator');

module.exports = function(api) {
    assert(api);
    const re = function(module) { return require('../../../../../src/' + module); }

    const rules = () => {
        return [
            check('did').matches(api.model.types.Did),
            check('uid').matches(api.model.types.Uid),
        ];
    }

    const validate = re('lib/validators/validate')(api);

    return {
        rules,
        validate,
    }
}
