'use strict';

(function() {

const assert = require('assert');
const request = require('request');
const tough  = require('tough-cookie');

//----------------------------- AJAX tool  -----------------------------------

module.exports = function(api) {
    assert(api);

    // Use IAS builtin module
    assert(api.zlib, 'api.zlib is not set');

    // Use IAS builtin module
    assert(api.stream, 'api.stream is not set');

    function streamToString(stream, cb) {
        const chunks = [];
        stream.on('data', (chunk) => {
            chunks.push(chunk);
        });
        stream.on('end', () => {
            cb(chunks.join(''));
        });
    }

    function streamToJson(stream, cb) {
        const chunks = [];
        stream.on('data', (chunk) => {
            chunks.push(chunk);
        });
        stream.on('end', () => {
            const str = chunks.join('');
            if (str.length == 0) {
                cb();
            } else {
                const json = JSON.parse(str);
                cb(json);
            }
        });
    }

    function parseCookies(session) {
        let cookies;
        if (session) {
            cookies = [];
            session.forEach((s)=>{
                const cookie = tough.parse(s);
                assert(cookie.key);
                assert(cookie.value);
                cookies.push({key:cookie.key, value:cookie.value});
            });
        }
//      api.lib.log.debug('parseCookies(), cookies:'); api.lib.log.dir(cookies);
        return cookies;
    }

    function createSession(cookies) {
        let session;
        if (cookies) {
            session = {};
            session.cookiesOriginal = cookies;
            session.cookies = parseCookies(cookies);
        }
//      api.lib.log.debug('createSession(), session:'); api.lib.log.dir(session);
        return session;
    }

    const Ajax = function() {
        this.json = {};

        this.get = function(session, domain, url, params, data, cb) {
//          api.lib.log.debug('ajax.get()');

            const headers = {
                "user-agent": "kz",
                "accept-encoding": "gzip,deflate",
                "connection": "close",
            };
            if (session) {
                assert(session.cookiesOriginal);
                headers['Cookie'] = session.cookiesOriginal;
            }

            const req = request.get(
                {
                    url: domain + '/' + url,
                    headers: headers,
                    qs: params,
                }
            );

            let zl = null;
            req.on('response', function (res) {
                if(res.statusCode !== 200) {
                    cb( 'Error, status=' + res.statusCode );
                    return;
                }

                const cookies = res.headers['set-cookie'];
                if (cookies) {
                    session = createSession(cookies);
                } else {
                    session = undefined;
                }

//              api.lib.log.debug('Content-type: ' + res.headers['Content-type'] );
                const encoding = res.headers['content-encoding'];
//              api.lib.log.debug('encoding: ' + encoding);
                if (encoding == 'gzip') {
//                  api.lib.log.debug('req.on.gzip');
                    zl = api.zlib.createGunzip();
                    streamToString(zl, function(str) {
//                      api.lib.log.debug('streamToString');
                        cb(undefined, session, str);
                    });
                    res.pipe(zl);
                } else if (encoding == 'deflate') {
//                  api.lib.log.debug('req.on.deflate');
                    zl = api.zlib.createInflate();
                    streamToString(zl, function(str) {
//                      api.lib.log.debug('streamToString, str:' + str);
                        cb(undefined, session, str);
                    });
                    res.pipe(zl);
                } else {
//                  api.lib.log.debug('req.on.none');
                    streamToString(res, function(str) {
//                      api.lib.log.debug('streamToString, str:' + str);
                        cb(undefined, session, str);
                    });
                }
            });

            req.on('end', function(res){
            });

            req.on('error', function(err){
                cb(err.toString());
            });
        }

        // JSON AJAX
        this.json.get = function(session, domain, url, params, data, cb) {
//          api.lib.log.debug(`ajax.json.get(), domain:${domain}, url:${url}`);

            const headers = {
                "user-agent": "kz",
                "accept-encoding": "gzip,deflate",
                "connection": "close",
            };
            if (session) {
                assert(session.cookiesOriginal);
                headers['Cookie'] = session.cookiesOriginal;
            }

            const req = request.get(
                {
                    url: domain + '/' + url,
                    headers: headers,
                    qs: params,
                }
            );

            let zl = null;
            req.on('response', function (res) {
                if(res.statusCode !== 200) {
                    cb( 'Error, status=' + res.statusCode );
                    return;
                }

                const cookies = res.headers['set-cookie'];
                if (cookies) {
                    session = createSession(cookies);
                } else {
                    session = undefined;
                }

                const encoding = res.headers['content-encoding'];
                if (encoding == 'gzip') {
                    zl = api.zlib.createGunzip();
                    streamToJson(res, function(json) {
                        cb(undefined, session, json);
                    });
                    res.pipe(zl);
                } else if (encoding == 'deflate') {
                    zl = api.zlib.createInflate();
                    streamToJson(res, function(json) {
                        cb(undefined, session, json);
                    });
                    res.pipe(zl);
                } else {
                    streamToJson(res, function(json) {
                        cb(undefined, session, json);
                    });
                }
            });

            req.on('end', function(res){
            });

            req.on('error', function(err){
                cb(err.toString());
            });
        }

        this.json.post = function(session, domain, url, params, data, cb) {
//          api.lib.log.debug(`ajax.json.post(), domain:${domain}, url:${url}`);

            const headers = {
                "user-agent": "kz",
                "content-type":"application/json; charset=UTF-8",
                "accept-charset": "utf-8",
                "accept-encoding": "gzip,deflate",
                "connection": "close",
            };
            if (session) {
                assert(session.cookiesOriginal);
                headers['Cookie'] = session.cookiesOriginal;
            }

            const req = request.post(
                {
                    url: domain + '/' + url,
                    headers: headers,
                    qs: params,
                    body: JSON.stringify(data),
                }
            );

            let zl = null;
            req.on('response', function (res) {
                if(res.statusCode !== 200) {
                    cb( 'Error, status=' + res.statusCode );
                    return;
                }

                const cookies = res.headers['set-cookie'];
                if (cookies) {
                    session = createSession(cookies);
                } else {
                    session = undefined;
                }

                const encoding = res.headers['content-encoding'];
                if (encoding == 'gzip') {
                    zl = api.zlib.createGunzip();
                    streamToJson(zl, function(json) {
                        cb(undefined, session, json);
                   });
                   res.pipe(zl);
                } else if (encoding == 'deflate') {
                    zl = api.zlib.createInflate();
                    streamToJson(zl, function(json) {
                        cb(undefined, session, json);
                    });
                    res.pipe(zl);
                } else {
                    streamToJson(res, function(json) {
                        cb(undefined, session, json);
                    });
                }
            });

            req.on('end', function(res){
            });

            req.on('error', function(err){
                cb(err.toString());
            });
        }



        this.json.delete = function(session, domain, url, params, data, cb) {
//          api.lib.log.debug(`ajax.json.delete(), domain:${domain}, url:${url}`);

            const headers = {
                "user-agent": "kz",
                "content-type":"application/json; charset=UTF-8",
                "accept-charset": "utf-8",
                "accept-encoding": "gzip,deflate",
                "connection": "close",
            };
            if (session) {
                assert(session.cookiesOriginal);
                headers['Cookie'] = session.cookiesOriginal;
            }

            const req = request.delete(
                {
                    url: domain + '/' + url,
                    headers: headers,
                    qs: params,
                    body: JSON.stringify(data),
                }
            );

            let zl = null;
            req.on('response', function (res) {
                if(res.statusCode !== 200) {
                    cb( 'Error, status=' + res.statusCode );
                    return;
                }

                const cookies = res.headers['set-cookie'];
                if (cookies) {
                    session = createSession(cookies);
                } else {
                    session = undefined;
                }

                const encoding = res.headers['content-encoding'];
                if (encoding == 'gzip') {
                    zl = api.zlib.createGunzip();
                    streamToJson(res, function(json) {
                        cb(undefined, session, json);
                    });
                   res.pipe(zl);
                } else if (encoding == 'deflate') {
                    zl = api.zlib.createInflate();
                    streamToJson(res, function(json) {
                        cb(undefined, session, json);
                    });
                    res.pipe(zl);
                } else {
                    streamToJson(res, function(json) {
                        cb(undefined, session, json);
                    });
                }
            });

            req.on('end', function(res){
            });

            req.on('error', function(err){
                cb(err.toString());
            });
        }

    }

    return new Ajax();
}

})();

