'use strict';

const assert = require('assert');

module.exports = (api)=>{
    assert(api);

    const env = {
        get root() {
            assert(process.env.YEAP_APP_SERVER_ROOT, 'YEAP_APP_SERVER_ROOT is not set!');
            return process.env.YEAP_APP_SERVER_ROOT;
        },

        get appName() {
            return process.env.APP_NAME || 'TBD';
        },

        makePath (path) {
            const result = this.root + '/' + path;
//          console.log('env.makePath(), root:' + this.root + ', path:' + path + ', result:' + result);
            return result;
        }
    }

    return env;
}

