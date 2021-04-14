'use strict';

const assert = require('assert'),
      re = (module)=>{ return require('./' + module); }

const api = {};
module.exports = api;



api.fs = require('fs');
api.zlib = require('zlib');
api.stream = require('stream');
api.path = require('path');
api.https = require('https');



api.lib = {};
api.lib.env = re('env')(api);
api.lib.re = re('re')(api);

api.lib.sys = {};
api.lib.sys.docker_compose = re('sys/docker-compose')(api);
api.lib.sys.docker_hosts = re('sys/docker-hosts');

api.lib.types = re('types')(api);
api.lib.makeId = re('makeId')(api);

api.lib.ajax = re('ajax')(api);

api.lib.Logger = re('Logger')(api);
api.lib.log = api.lib.Logger;
api.lib.LoggerFs = re('LoggerFs')(api);
api.lib.requestLogger = re('requestLogger');

api.lib.db = {};
api.lib.db.tools = re('db/tools');
api.lib.db.DbPool = re('db/DbPool')(api);

api.lib.Md5 = re('Md5')(api);
api.lib.AccessController = re('AccessController')(api);

api.lib.routerHelper = re('routerHelper')(api);

api.lib.validators = {};
api.lib.validators.validate = re('validators/validate')(api);

api.lib.model = {};
api.lib.model.helpers = {};
api.lib.model.helpers.add = re('model/helpers/add');
api.lib.model.helpers.delete = re('model/helpers/delete');
api.lib.model.helpers.count = re('model/helpers/count');
api.lib.model.helpers.query = re('model/helpers/query');

api.lib.services = {};
api.lib.services.Http = re('services/Http')(api);

api.lib.testTools = {};
api.lib.testTools.express = {};
api.lib.testTools.express.Delete = re('testTools/express/Delete')(api);
api.lib.testTools.express.Get = re('testTools/express/Get')(api);
api.lib.testTools.express.Post = re('testTools/express/Post')(api);
api.lib.testTools.express.Response = re('testTools/express/Response')(api);
api.lib.testTools.express.Router = re('testTools/express/Router')(api);
api.lib.testTools.express.getRoutes = re('testTools/express/getRoutes')(api);

api.lib.Application = re('Application');

