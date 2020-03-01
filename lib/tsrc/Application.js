'use strict';

describe('lib.Application', function() {

    const assert = require('assert');

    let api;
    before(()=>{
        const re = (module)=>{ return require('../../' + module); }
        api = {};
        api.fs = require('fs');
        api.lib = re('lib/exports')(api);
    });

    describe('Close unopen app', ()=>{
        it('#Application.close', (done)=>{
            const app = new api.lib.Application();
            assert.equal(false, app.isOpen());

            app.close(()=>{
                assert.equal(false, app.isOpen());
                done();
            });
        });
    });

    describe('Open app and close it', ()=>{

        let app;
        before(()=>{
            app = new api.lib.Application();
        });

        it('#Application.open', (done)=>{
            assert.equal(false, app.isOpen());
            app.open(()=>{
                assert.equal(true, app.isOpen());
                assert.equal('object', typeof app.config.application);
                assert.equal('object', typeof app.config.databases);
                assert.equal('object', typeof app.config.log);
                done();
            });
        });

        it('#Application.close', (done)=>{
            assert.equal(true, app.isOpen());
            app.close(()=>{
                assert.equal(false, app.isOpen());
                done();
            });
        });
    });

    describe('Open app many times', ()=>{

        let app;
        before(()=>{
            app = new api.lib.Application();
        });

        after((done)=>{
            app.close(done);
        });

        it('#Application.open, 1st time', (done)=>{
            assert.equal(false, app.isOpen());
            app.open(()=>{
                assert.equal(true, app.isOpen());
                assert.equal('object', typeof app.config.application);
                assert.equal('object', typeof app.config.databases);
                assert.equal('object', typeof app.config.log);
                done();
            });
        });

        it('#Application.open, 2nd time', (done)=>{
            assert.equal(true, app.isOpen());
            app.open((err)=>{
                assert(err);
                assert.equal(true, app.isOpen());
                done();
            });
        });

        it('#Application.open, 3rd time', (done)=>{
            assert.equal(true, app.isOpen());
            app.open((err)=>{
                assert(err);
                assert.equal(true, app.isOpen());
                done();
            });
        });
    });
});

