'use strict';

describe('lib.makeId', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../' + module); }
    let api;

    before(()=>{
        api = {};
        api.lib = {};
        api.lib.Md5 = re('Md5')(api);
        api.lib.types = re('types')(api);
        api.lib.makeId = re('makeId')(api);
    });

    it('Single id.', ()=>{
        const id = api.lib.makeId();
        assert.equal(true, api.lib.types.hash32.test(id));
    });

    it('Many ids.', ()=>{
        const id1 = api.lib.makeId();
        const id2 = api.lib.makeId();
        const id3 = api.lib.makeId();
        assert.equal(true, api.lib.types.hash32.test(id1));
        assert.equal(true, api.lib.types.hash32.test(id2));
        assert.equal(true, api.lib.types.hash32.test(id3));
        assert.notEqual(id1, id2);
        assert.notEqual(id1, id3);
    });

});

