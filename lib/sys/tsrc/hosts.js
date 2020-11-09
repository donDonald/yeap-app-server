'use strict';

describe("lib.sys.hosts, System helper for updating /etc/hosts.", function() {

    const assert = require('assert');
    const re = function(module) { return require('../../' + module); }

    let api;

    before(()=>{
        api = {};
        api.lib = {};
        api.lib.sys = re('sys/exports.js')(api);
    });

    it('Add host aaaaaa.bbbb', function(done) {
        api.lib.sys.hosts.add('aaaaaa.bbbb', function(err) {
            assert(!err);
            done();
        });
    });

});

