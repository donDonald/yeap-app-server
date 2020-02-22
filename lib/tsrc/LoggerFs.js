'use strict';

describe('lib.LoggerFs', function() {

    const assert = require('assert');
    const helpers = require('./helpers');
    const DIR = process.cwd() + '/tmp';
    const STREAMS = ['system', 'fatal', 'error', 'warn', 'info', 'debug'];

    let api;
    before(()=>{
        const re = function(module) { return require('../' + module); }
        api = {};
        api.lib = {};
        api.lib.LoggerFs = re('LoggerFs');
    });

    describe('#Logger.open and Logger.close', ()=>{
        let logger;
        before(()=>{
            logger = new api.lib.LoggerFs({path:DIR, streams:STREAMS});
        });

        it('logger.close, close not yet open logger', function() {
            assert.equal(false, logger.isOpen());
            logger.close();
            assert.equal(false, logger.isOpen());
        });

        it('logger.open, 1st time', function() {
            assert.equal(false, logger.isOpen());
            logger.open();
            assert.equal(true, logger.isOpen());
        });

        it('logger.open, 2nd time', function() {
            logger.open();
            assert.equal(true, logger.isOpen());
        });

        it('logger.close, 1st time', function(done) {
            logger.close((err)=>{
                assert(!err);
                assert.equal(false, logger.isOpen());
                done();
            });
        });

        it('logger.close, 2nd time', function(done) {
            logger.close((err)=>{
                assert(!err);
                assert.equal(false, logger.isOpen());
                done();
            });
        });

        it('logger.close, 3rd time, no cb', function() {
            logger.close();
            assert.equal(false, logger.isOpen());
        });
    });

    describe('#Logger.flush', ()=>{
        let logger;
        before(()=>{
            logger = new api.lib.LoggerFs({path:DIR, streams:STREAMS});
        });

        after(()=>{
            logger.close();
        });

        it('logger.flush, logger is not open', function(done) {
            logger.flush(done);
        });

        it('logger.open', function() {
            assert.equal(false, logger.isOpen());
            logger.open();
            assert.equal(true, logger.isOpen());
        });

        it('logger.flush, logger is empty', function(done) {
            logger.flush(done);
        });

        it('logger.flush, write some data and flush, ', function(done) {
            logger.system('line 1');
            logger.system('line 2');
            logger.system('line 3');

            logger.flush((err)=>{
                assert(!err);
                done();
            });
        });

        it('Check output', (done)=>{
            helpers.loadStream(logger, 'system', (lines)=>{
                assert.equal(3, lines.length);
                assert.notEqual(-1, lines[0].indexOf('line 1'));
                assert.notEqual(-1, lines[1].indexOf('line 2'));
                assert.notEqual(-1, lines[2].indexOf('line 3'));
                done();
            });
        });

        it('logger.flush, write some data and flush, ', function(done) {
            const stream = logger.tbrPeekStream('system');
            assert.equal(0, stream._buffer.length);
            logger.system('line 4');
            logger.system('line 5');
            logger.system('line 6');
            assert.equal(3, stream._buffer.length);

            logger.flush(()=>{
                assert.equal(false, stream._locked);
                assert.equal(0, stream._buffer.length);
                done();
            });

            assert.equal(true, stream._locked);
        });

        it('Check output', (done)=>{
            helpers.loadStream(logger, 'system', (lines)=>{
                assert.equal(6, lines.length);
                assert.notEqual(-1, lines[0].indexOf('line 1'));
                assert.notEqual(-1, lines[1].indexOf('line 2'));
                assert.notEqual(-1, lines[2].indexOf('line 3'));
                assert.notEqual(-1, lines[3].indexOf('line 4'));
                assert.notEqual(-1, lines[4].indexOf('line 5'));
                assert.notEqual(-1, lines[5].indexOf('line 6'));
                done();
            });
        });

        it('logger.flush, logger is empty', function(done) {
            logger.flush(done);
        });
    });

    describe('Basic cases', ()=>{
        let logger;
        before(()=>{
            logger = new api.lib.LoggerFs({path:DIR, streams:STREAMS});
            logger.open();
            assert.equal(true, logger.isOpen());
        });

        after(()=>{
            logger.close();
        });

        it('Check output', (done)=>{
            helpers.loadStreams(logger, 0, STREAMS, (streams)=>{
//              console.log('streams:', streams);
                assert(streams);

                assert.equal(0, streams.system.length);
                assert.equal(0, streams.fatal.length);
                assert.equal(0, streams.error.length);
                assert.equal(0, streams.warn.length);
                assert.equal(0, streams.info.length);
                assert.equal(0, streams.debug.length);
                done();
            });
        });

        it('write', function(done) {
            logger.system('system1');
            logger.fatal('fatal1');
            logger.error('error1');
            logger.warn('warn1');
            logger.info('info1');
            logger.debug('debug1');

            logger.flush((err)=>{
                assert(!err);
                done();
            });
        });

        it('Check output', (done)=>{
            helpers.loadStreams(logger, 0, STREAMS, (streams)=>{
//              console.log('streams:', streams);
                assert(streams);

                assert.equal(1, streams.system.length);
                assert.notEqual(-1, streams.system[0].indexOf('system1'));

                assert.equal(1, streams.fatal.length);
                assert.notEqual(-1, streams.fatal[0].indexOf('fatal1'));

                assert.equal(1, streams.error.length);
                assert.notEqual(-1, streams.error[0].indexOf('error1'));

                assert.equal(1, streams.warn.length);
                assert.notEqual(-1, streams.warn[0].indexOf('warn1'));

                assert.equal(1, streams.info.length);
                assert.notEqual(-1, streams.info[0].indexOf('info1'));

                assert.equal(1, streams.debug.length);
                assert.notEqual(-1, streams.debug[0].indexOf('debug1'));
                done();
            });
        });

        it('write', function(done) {
            logger.system('system1');

            logger.fatal('fatal1');
            logger.fatal('fatal2');

            logger.error('error1');
            logger.error('error2');
            logger.error('error3');

            logger.warn('warn1');
            logger.warn('warn2');
            logger.warn('warn3');
            logger.warn('warn4');

            logger.info('info1');
            logger.info('info2');
            logger.info('info3');
            logger.info('info4');
            logger.info('info5');

            logger.debug('debug1');
            logger.debug('debug2');
            logger.debug('debug3');
            logger.debug('debug4');
            logger.debug('debug5');
            logger.debug('debug6');

            logger.flush((err)=>{
                assert(!err);
                done();
            });
        });

        it('Check output', (done)=>{
            helpers.loadStreams(logger, 0, STREAMS, (streams)=>{
//              console.log('streams:', streams);
                assert(streams);

                assert.equal(1+1, streams.system.length);
                assert.notEqual(-1, streams.system[0].indexOf('system1'));
                assert.notEqual(-1, streams.system[1].indexOf('system1'));

                assert.equal(1+2, streams.fatal.length);
                assert.notEqual(-1, streams.fatal[0].indexOf('fatal1'));
                assert.notEqual(-1, streams.fatal[1].indexOf('fatal1'));
                assert.notEqual(-1, streams.fatal[2].indexOf('fatal2'));

                assert.equal(1+3, streams.error.length);
                assert.notEqual(-1, streams.error[0].indexOf('error1'));
                assert.notEqual(-1, streams.error[1].indexOf('error1'));
                assert.notEqual(-1, streams.error[2].indexOf('error2'));
                assert.notEqual(-1, streams.error[3].indexOf('error3'));

                assert.equal(1+4, streams.warn.length);
                assert.notEqual(-1, streams.warn[0].indexOf('warn1'));
                assert.notEqual(-1, streams.warn[1].indexOf('warn1'));
                assert.notEqual(-1, streams.warn[2].indexOf('warn2'));
                assert.notEqual(-1, streams.warn[3].indexOf('warn3'));
                assert.notEqual(-1, streams.warn[4].indexOf('warn4'));

                assert.equal(1+5, streams.info.length);
                assert.notEqual(-1, streams.info[0].indexOf('info1'));
                assert.notEqual(-1, streams.info[1].indexOf('info1'));
                assert.notEqual(-1, streams.info[2].indexOf('info2'));
                assert.notEqual(-1, streams.info[3].indexOf('info3'));
                assert.notEqual(-1, streams.info[4].indexOf('info4'));
                assert.notEqual(-1, streams.info[5].indexOf('info5'));

                assert.equal(1+6, streams.debug.length);
                assert.notEqual(-1, streams.debug[0].indexOf('debug1'));
                assert.notEqual(-1, streams.debug[1].indexOf('debug1'));
                assert.notEqual(-1, streams.debug[2].indexOf('debug2'));
                assert.notEqual(-1, streams.debug[3].indexOf('debug3'));
                assert.notEqual(-1, streams.debug[4].indexOf('debug4'));
                assert.notEqual(-1, streams.debug[5].indexOf('debug5'));
                assert.notEqual(-1, streams.debug[6].indexOf('debug6'));
                done();
            });
        });
    });

    describe('#LoggerFs._writeRaw', ()=>{
        let logger;
        before(()=>{
            logger = new api.lib.LoggerFs({path:DIR, streams:STREAMS});
            logger.open();
            assert.equal(true, logger.isOpen());
        });

        after(()=>{
            logger.close();
        });

        it('existing system stream', (done)=>{
            logger._writeRaw('system', 'systemstream');
            logger.flush(done);
        });

        it('Not existing stream', (done)=>{
            logger._writeRaw('notexisting', 'notexistingstream');
            logger.flush(done);
        });

        it('Check output', (done)=>{
            helpers.loadStreams(logger, 0, STREAMS, (streams)=>{
//              console.log('streams:', streams);
                assert(streams);

                assert.equal(1, streams.system.length);
                assert.notEqual(-1, streams.system[0].indexOf('systemstream'));
                done();
            });
        });
    });

});

