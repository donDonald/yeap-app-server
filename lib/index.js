'use strict';

const assert = require('assert'),
      re = (module)=>{ return require('./' + module); }

const api = {}
module.exports = api;

api.lib = require('yeap_lib');
api.logger = require('yeap_logger');
api.log = api.logger.Logger;
api.db = require('yeap_db');

api.app_server = {};
api.app_server.https  = require('https');;
api.app_server.requestLogger = re('requestLogger');
api.app_server.AccessController = re('AccessController')(api);
api.app_server.routerHelper = re('routerHelper')(api);

api.app_server.validators = {};
api.app_server.validators.validate = re('validators/validate')(api);

api.app_server.services = {};
api.app_server.services.Http = re('services/Http')(api);

api.app_server.Application = re('Application');

