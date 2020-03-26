'use strict';

module.exports = {

    services: {
        http: {
            port:      3001,
            key:       'tmp.key',
            cert:      'tmp.cert',
            session: {
                // Session secret
                // is a string known just at server side to sign session cookie
                secret: 'anysecret',
                age: 24*60*60*1000*14, // 14 days
            }
        }
    }

}

