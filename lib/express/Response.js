'use strict';

const assert = require('assert');

module.exports = function (api) {

    const Response = function() {
        this.result = {};
        this.resultStr = '';
        this.status = function(code) {
            this.result.code = code;
            return this;
        }
        this.send = function(value) {
            if (typeof value !== 'undefined') {
                this.result.value = value;
            }
            this.resultStr = JSON.stringify(this.result);
            const self = this;
            setImmediate(()=>{self.cb(self);});
        }
        this.json = this.send;
        this.sendStatus = function(code) {
            this.status(code).send();
        }
        this.wait = function(cb) {
            this.cb = cb;
        }
    }

    return Response;
}

