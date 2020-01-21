'user string';

const assert = require('assert');

module.exports = function () {

    const Post = function(body) {
        this.method = 'POST';
        this.body = body;
    }

    // Subclass req
    const req = require('passport/lib/http/request.js');
    Post.prototype = Object.create(req);

    return Post;
}

