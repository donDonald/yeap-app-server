'use strict';

const assert = require('assert');
const { check, oneOf } = require('express-validator');

module.exports = function(api) {
    assert(api);
    const re = function(module) { return require('../../../../../src/' + module); }

    const rules = () => {
        return [
            oneOf([
                check('did').matches(api.model.types.Did),
                check('did').exists().isEmpty(),
            ]),
            check('ap').matches(api.model.types.AuthProviderName),
            check('access_token').isLength({ min: 10 })
        ];
    }

    const validate = re('lib/validators/validate')(api);

    return {
        rules,
        validate,
    }
}
