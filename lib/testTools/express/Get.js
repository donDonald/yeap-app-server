'user string';

const assert = require('assert');

module.exports = function () {

    const Get = function(query) {
        this.method = 'GET';
        this.query = query;
    }

    // Subclass req
    const req = require('passport/lib/http/request.js');
    Get.prototype = Object.create(req);

    return Get;
}

