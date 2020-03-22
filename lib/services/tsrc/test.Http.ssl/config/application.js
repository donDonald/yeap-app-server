'use strict';

module.exports = {

    services: {
        http: {
            port:      3001,
            key:       'config/ssl/test.key',
            cert:      'config/ssl/test.cert',
            session: {
                // Session secret
                // is a string known just at server side to sign session cookie
                secret: 'noway',
                age: 24*60*60*1000, // 1day
            }
        }
    }

}

