'use strict';

const assert = require('assert'),
      re = (module)=>{ return require('./' + module); }

const api = require('yeap_lib');
module.exports = api;

api.lib.Logger = re('Logger')(api);
api.lib.log = api.lib.Logger;
api.lib.LoggerFs = re('LoggerFs')(api);
api.lib.requestLogger = re('requestLogger');
api.lib.AccessController = re('AccessController')(api);
api.lib.routerHelper = re('routerHelper')(api);

api.lib.validators = {};
api.lib.validators.validate = re('validators/validate')(api);

api.lib.services = {};
api.lib.services.Http = re('services/Http')(api);

api.lib.Application = re('Application');

