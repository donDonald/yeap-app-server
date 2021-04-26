'use strict';

describe('app_server.Logger + app_server.LoggerFs, chaining Logger and LoggerFs', function() {

    const assert = require('assert');
    const helpers = require('./helpers');
    const DIR = '/tmp/api.app_server.LoggerChaining/';
    const STREAMS = ['system', 'fatal', 'error', 'warn', 'info', 'debug'];

    let api;
    let logger, loggerFs;
    before(()=>{
        const re = function(module) { return require('../' + module); }
        api = {};
        api.fs = require('fs');
        api.app_server = {};
        api.app_server.Logger = re('Logger')(api);
        api.app_server.LoggerFs = re('LoggerFs')(api);
        if (!api.fs.existsSync(DIR)){
            api.fs.mkdirSync(DIR, { recursive: true });
        }
    });

    after(()=>{
        loggerFs.close();
    });

    it('Create LoggerFs and open', ()=>{
        loggerFs = new api.app_server.LoggerFs({path:DIR, streams:STREAMS});
        assert.equal(false, loggerFs.isOpen());
        loggerFs.open();
        assert.equal(true, loggerFs.isOpen());
    });

    it('Create Logger and chain to LoggerFs', ()=>{
        api.app_server.Logger.setNext(loggerFs._writeRaw.bind(loggerFs));
    });

    it('Write logs, no context', (done)=>{
        api.app_server.Logger.system('AAAAAAAAAAAAAA');
        api.app_server.Logger.fatal('BBBBBBBBBBBBBB');
        api.app_server.Logger.error('CCCCCCCCCCCCCC');
        api.app_server.Logger.warn('DDDDDDDDDDDDDD');
        api.app_server.Logger.info('EEEEEEEEEEEEEE');
        api.app_server.Logger.debug('FFFFFFFFFFFFFF');
        loggerFs.flush(done);
    });

    it('Check output', (done)=>{
        helpers.loadStreams(loggerFs, 0, STREAMS, (streams)=>{
//          console.log('streams:', streams);
            assert(streams);

            assert.equal(1, streams.system.length);
            assert.notEqual(-1, streams.system[0].indexOf('AAAAAAAAAAAAAA'));

            assert.equal(1, streams.fatal.length);
            assert.notEqual(-1, streams.fatal[0].indexOf('BBBBBBBBBBBBBB'));

            assert.equal(1, streams.error.length);
            assert.notEqual(-1, streams.error[0].indexOf('CCCCCCCCCCCCCC'));

            assert.equal(1, streams.warn.length);
            assert.notEqual(-1, streams.warn[0].indexOf('DDDDDDDDDDDDDD'));

            assert.equal(1, streams.info.length);
            assert.notEqual(-1, streams.info[0].indexOf('EEEEEEEEEEEEEE'));

            assert.equal(1, streams.debug.length);
            assert.notEqual(-1, streams.debug[0].indexOf('FFFFFFFFFFFFFF'));
            done();
        });
    });

    it('Write logs, CTX1 context', (done)=>{
        api.app_server.Logger.ctx('CTX1').system('AAAAAAAAAAAAAA');
        api.app_server.Logger.ctx('CTX1').fatal('BBBBBBBBBBBBBB');
        api.app_server.Logger.ctx('CTX1').error('CCCCCCCCCCCCCC');
        loggerFs.flush(done);
    });

    it('Check output', (done)=>{
        helpers.loadStreams(loggerFs, 0, STREAMS, (streams)=>{
//          console.log('streams:', streams);
            assert(streams);

            assert.equal(2, streams.system.length);
            assert.notEqual(-1, streams.system[0].indexOf('AAAAAAAAAAAAAA'));
            assert.notEqual(-1, streams.system[1].indexOf('[CTX1]  system  AAAAAAAAAAAAAA'));

            assert.equal(2, streams.fatal.length);
            assert.notEqual(-1, streams.fatal[0].indexOf('BBBBBBBBBBBBBB'));
            assert.notEqual(-1, streams.fatal[1].indexOf('[CTX1]  fatal   BBBBBBBBBBBBBB'));

            assert.equal(2, streams.error.length);
            assert.notEqual(-1, streams.error[0].indexOf('CCCCCCCCCCCCCC'));
            assert.notEqual(-1, streams.error[1].indexOf('[CTX1]  error   CCCCCCCCCCCCCC'));

            assert.equal(1, streams.warn.length);
            assert.notEqual(-1, streams.warn[0].indexOf('DDDDDDDDDDDDDD'));

            assert.equal(1, streams.info.length);
            assert.notEqual(-1, streams.info[0].indexOf('EEEEEEEEEEEEEE'));

            assert.equal(1, streams.debug.length);
            assert.notEqual(-1, streams.debug[0].indexOf('FFFFFFFFFFFFFF'));
            done();
        });
    });

    it('Write logs, CTX1 & CTX2 context', (done)=>{
        api.app_server.Logger.ctx('CTX1').ctx('CTX2').system('AAAAAAAAAAAAAA');
        api.app_server.Logger.ctx('CTX1').ctx('CTX2').fatal('BBBBBBBBBBBBBB');
        api.app_server.Logger.ctx('CTX1').ctx('CTX2').error('CCCCCCCCCCCCCC');
        loggerFs.flush(done);
    });

    it('Check output', (done)=>{
        helpers.loadStreams(loggerFs, 0, STREAMS, (streams)=>{
//          console.log('streams:', streams);
            assert(streams);

            assert.equal(3, streams.system.length);
            assert.notEqual(-1, streams.system[0].indexOf('AAAAAAAAAAAAAA'));
            assert.notEqual(-1, streams.system[1].indexOf('[CTX1]  system  AAAAAAAAAAAAAA'));
            assert.notEqual(-1, streams.system[2].indexOf('[CTX1][CTX2]  system  AAAAAAAAAAAAAA'));

            assert.equal(3, streams.fatal.length);
            assert.notEqual(-1, streams.fatal[0].indexOf('BBBBBBBBBBBBBB'));
            assert.notEqual(-1, streams.fatal[1].indexOf('[CTX1]  fatal   BBBBBBBBBBBBBB'));
            assert.notEqual(-1, streams.fatal[2].indexOf('[CTX1][CTX2]  fatal   BBBBBBBBBBBBBB'));

            assert.equal(3, streams.error.length);
            assert.notEqual(-1, streams.error[0].indexOf('CCCCCCCCCCCCCC'));
            assert.notEqual(-1, streams.error[1].indexOf('[CTX1]  error   CCCCCCCCCCCCCC'));
            assert.notEqual(-1, streams.error[2].indexOf('[CTX1][CTX2]  error   CCCCCCCCCCCCCC'));

            assert.equal(1, streams.warn.length);
            assert.notEqual(-1, streams.warn[0].indexOf('DDDDDDDDDDDDDD'));

            assert.equal(1, streams.info.length);
            assert.notEqual(-1, streams.info[0].indexOf('EEEEEEEEEEEEEE'));

            assert.equal(1, streams.debug.length);
            assert.notEqual(-1, streams.debug[0].indexOf('FFFFFFFFFFFFFF'));
            done();
        });
    });
});

