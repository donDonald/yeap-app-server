'use strict';

const assert = require('assert'),
      re = (module)=>{ return require('./' + module); }

module.exports = (api)=>{
    assert(api);

    const lib = {};

    lib.env = re('env')(api);
    lib.re = re('re')(api);

    lib.Logger = re('Logger')(api);
    lib.log = lib.Logger;
    lib.LoggerFs = re('LoggerFs')(api);

    lib.db = {};
    lib.db.tools = re('db/tools')(api);
    lib.db.DbPool = re('db/DbPool')(api);

    lib.Md5 = re('Md5');
    lib.AccessController = re('AccessController')(api);

    lib.routerHelper = re('routerHelper')(api);

    lib.Application = re('Application');

    return lib;
}

