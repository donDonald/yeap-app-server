'use strict';

const assert = require('assert');

module.exports = function (api) {

    const Post = function(setup, body) {
        this.method = 'POST';
        this.body = body;
        if (setup) {
            setup(this);
        }
    }

    // Subclass req
    const req = require('passport/lib/http/request.js');
    Post.prototype = Object.create(req);

    return Post;
}

