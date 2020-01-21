'user string';

const assert = require('assert');

module.exports = function () {

    const Delete = function(body) {
        this.method = 'DELETE';
        this.body = body;
    }

    // Subclass req
    const req = require('passport/lib/http/request.js');
    Delete.prototype = Object.create(req);

    return Delete;
}

