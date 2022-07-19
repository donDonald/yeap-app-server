'use strict';

const assert = require('assert'),
      re = (module)=>{ return require('./' + module); }

const api = {}
module.exports = api;

api.fs = require('fs');
api.zlib = require('zlib');
api.stream = require('stream');
api.path = require('path');
api.https = require('https');

api.env = re('env')(api);
api.re = re('re')(api);
api.ajax = re('ajax')(api);

api.types = require('yeap_types');

api.sys = {};
api.sys.docker_compose = re('sys/docker-compose')(api);
api.sys.docker_hosts = re('sys/docker-hosts');

api.validators = {};
api.validators.validate = re('validators/validate')(api);

api.express = {};
api.express.Delete = re('express/Delete')(api);
api.express.Get = re('express/Get')(api);
api.express.Post = re('express/Post')(api);
api.express.Response = re('express/Response')(api);
api.express.Router = re('express/Router')(api);
api.express.getRoutes = re('express/getRoutes')(api);

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

