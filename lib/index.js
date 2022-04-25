'use strict';

const assert = require('assert'),
      re = (module)=>{ return require('./' + module); }

const api = require('yeap_lib');
module.exports = api;

const yeap_logger = require('yeap_logger');
api.lib.Logger = yeap_logger.Logger;
api.lib.LoggerFs = yeap_logger.LoggerFs;
api.lib.log = yeap_logger.Logger;

api.app_server = {};
api.app_server.requestLogger = re('requestLogger');
api.app_server.AccessController = re('AccessController')(api);
api.app_server.routerHelper = re('routerHelper')(api);

api.app_server.validators = {};
api.app_server.validators.validate = re('validators/validate')(api);

api.app_server.services = {};
api.app_server.services.Http = re('services/Http')(api);

api.app_server.Application = re('Application');

