'use strict';

describe("yeap_app_server.sys.hosts, System helper for updating /etc/hosts.", ()=>{
    const assert = require('assert');
    const re = (module)=>{ return require('../../' + module); }

    let api;
    before(()=>{
        api = {};
        api.sys = re('sys/exports.js');
    });

    it('Add host aaaaaa.bbbb', (done)=>{
        api.sys.hosts.add('aaaaaa.bbbb', (err)=>{
            assert(!err);
            done();
        });
    });

});

