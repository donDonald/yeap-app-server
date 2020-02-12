'use strict';

describe('lib.Md5', function() {

    const assert = require('assert');
    let api;

    before(()=>{
        const re = function(module) { return require('../' + module); }
        api = {};
        api.lib = {};
        api.lib.Md5 = re('Md5')(api);
    });


    it('Empty string', function() {
        const h = api.lib.Md5('');
        assert.equal(h, 'd41d8cd98f00b204e9800998ecf8427e');
    });

    it('A', function() {
        const h = api.lib.Md5('A');
        assert.equal(h, '7fc56270e7a70fa81a5935b72eacbe29');
    });

    it('a', function() {
        const h = api.lib.Md5('a');
        assert.equal(h, '0cc175b9c0f1b6a831c399e269772661');
    });

});

