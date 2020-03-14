'use strict';

const assert = require('assert');
const { check, oneOf } = require('express-validator');

module.exports = function(api) {
    assert(api);
    const re = function(module) { return require('../../../../../src/' + module); }

    const rules = () => {
        return [
            check('uid').matches(api.model.types.Uid),
            oneOf([
                check('cat').matches(api.model.types.Cat),
                check('cat').exists().isEmpty(),
            ]),
            check('displayName').matches(api.lib.types.Name),
            check('thumbnail').matches(api.lib.types.Name),
            check('authProviderName').matches(api.model.types.AuthProviderName),
            check('authProviderId').matches(api.lib.types.Name),
            check('authProviderRawString').exists(), // PTFIXME, what validation shall be heree to prevent sql injection and so on?
        ];
    }

    const validate = re('lib/validators/validate')(api);

    return {
        rules,
        validate,
    }
}
