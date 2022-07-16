'use strict';

describe('yeap_app_server.makeId', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../' + module); }
    let api;

    before(()=>{
        api = {};
        api.Md5 = re('Md5')(api);
        api.types = re('types')(api);
        api.makeId = re('makeId')(api);
    });

    it('Single id.', ()=>{
        const id = api.makeId();
        assert.equal(true, api.types.hash32.test(id));
    });

    it('Many ids.', ()=>{
        const id1 = api.makeId();
        const id2 = api.makeId();
        const id3 = api.makeId();
        assert.equal(true, api.types.hash32.test(id1));
        assert.equal(true, api.types.hash32.test(id2));
        assert.equal(true, api.types.hash32.test(id3));
        assert.notEqual(id1, id2);
        assert.notEqual(id1, id3);
    });

});

