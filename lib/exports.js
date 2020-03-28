'use strict';

const assert = require('assert'),
      re = (module)=>{ return require('./' + module); }

module.exports = (api)=>{
    assert(api);

    const lib = {};

    lib.env = re('env')(api);
    lib.re = re('re')(api);

    lib.types = re('types')(api);
    lib.makeId = re('makeId')(api);

    lib.ajax = re('ajax')(api);

    lib.Logger = re('Logger')(api);
    lib.log = lib.Logger;
    lib.LoggerFs = re('LoggerFs')(api);

    lib.db = {};
    lib.db.tools = re('db/tools');
    lib.db.DbPool = re('db/DbPool')(api);

    lib.Md5 = re('Md5')(api);
    lib.AccessController = re('AccessController')(api);

    lib.routerHelper = re('routerHelper')(api);

    lib.Application = re('Application');

    return lib;
}
