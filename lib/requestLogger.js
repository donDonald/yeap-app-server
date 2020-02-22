'use strict';

const assert = require('assert');
const onFinished = require('on-finished');

module.exports = function(logger) {
    assert(logger);

    const getIp = function (req) {
        let ip = (req.headers['x-forwarded-for'] ||
              req.connection.remoteAddress ||
              req.socket.remoteAddress ||
              req.connection.socket.remoteAddress).split(",")[0]
        if (ip.includes('::ffff:')) {
            ip = ip.split(':').reverse()[0]
        }
        return ip;
    }

    return function(req, res, next) {
        //console.log('req:', res);
        const ts1 = Date.now();
        const ip = getIp(req);
        const url = req.url;

        onFinished(res, function (err, res) {
            const ts2 = Date.now();
            const d = new Date(ts1);
            logger(`date:${d}, spent(ms):${ts2-ts1}, ip:${ip}, method:${req.method}, url:${url}, status:${res.statusCode}`);
        });

        next();
    }
}

