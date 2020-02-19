'use strict';

describe('lib.LoggerFs', function() {

    const assert = require('assert');
    const fs = require('fs');
    const readline = require('readline');
    let api;

    let lastLine, write;
    before(()=>{
        const re = function(module) { return require('../' + module); }
        api = {};
        api.lib = {};
        api.lib.LoggerFs = re('LoggerFs');
    });

    const DIR = process.cwd() + '/tmp';

    describe('#Logger.open and Logger.close', ()=>{
        let logger;
        before(()=>{
            logger = new api.lib.LoggerFs({path:DIR});
        });

        it('logger.close, close not yet open logger', function() {
            logger.close();

            assert.equal(false, logger.isOpen());
            assert.equal(false, logger._locked);
            assert(!logger._buffer);
            assert(!logger._fileName);
            assert(!logger._stream);
        });

        it('logger.open, 1st time', function() {
            assert.equal(false, logger.isOpen());
            assert.equal(false, logger._locked);
            assert(!logger._buffer);
            assert(!logger._fileName);
            assert(!logger._stream);

            logger.open();

            assert.equal(true, logger.isOpen());
            assert.equal(false, logger._locked);
            assert(logger._buffer);
            assert(logger._fileName);
            assert(logger._stream);
        });

        it('logger.open, 2nd time', function() {
            logger.open();

            assert.equal(true, logger.isOpen());
            assert.equal(false, logger._locked);
            assert(logger._buffer);
            assert(logger._fileName);
            assert(logger._stream);
        });

        it('logger.close, 1st time', function(done) {
            logger.once('close', ()=>{
                assert.equal(false, logger.isOpen());
                assert.equal(false, logger._locked);
                assert(!logger._buffer);
                assert(!logger._fileName);
                assert(!logger._stream);
                done();
            });
            logger.close();
        });

        it('logger.close, 2nd time', function() {
            logger.close();
            assert.equal(false, logger.isOpen());
            assert.equal(false, logger._locked);
            assert(!logger._buffer);
            assert(!logger._fileName);
            assert(!logger._stream);
        });
    });

    describe('#Logger.flush', ()=>{
        let logger;
        before(()=>{
            logger = new api.lib.LoggerFs({path:DIR});
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
            assert.equal(0, logger._buffer.length);
            logger.system('line 1');
            logger.system('line 2');
            logger.system('line 3');
            assert.equal(3, logger._buffer.length);

            logger.flush(()=>{
                assert.equal(false, logger._locked);
                assert.equal(0, logger._buffer.length);
                done();
            });

            assert.equal(true, logger._locked);
        });

        it('Check output', (done)=>{
            const f = logger._fileName;
            const e = fs.existsSync(f);
            assert.equal(true, e);

            const readInterface = readline.createInterface({
                input: fs.createReadStream(f),
//              output: process.stdout,
                console: false
            });

            const lines = [];
            readInterface.on('line', function(line) {
                lines.push(line);
            });

            setTimeout(()=>{
                assert.equal(3, lines.length);
                assert.notEqual(-1, lines[0].indexOf('line 1'));
                assert.notEqual(-1, lines[1].indexOf('line 2'));
                assert.notEqual(-1, lines[2].indexOf('line 3'));
                done();
            },1000);
        });

        it('logger.flush, write some data and flush, ', function(done) {
            assert.equal(0, logger._buffer.length);
            logger.system('line 4');
            logger.system('line 5');
            logger.system('line 6');
            assert.equal(3, logger._buffer.length);

            logger.flush(()=>{
                assert.equal(false, logger._locked);
                assert.equal(0, logger._buffer.length);
                done();
            });

            assert.equal(true, logger._locked);
        });

        it('Check output', (done)=>{
            const f = logger._fileName;
            const e = fs.existsSync(f);
            assert.equal(true, e);

            const readInterface = readline.createInterface({
                input: fs.createReadStream(f),
//              output: process.stdout,
                console: false
            });

            const lines = [];
            readInterface.on('line', function(line) {
                lines.push(line);
            });

            setTimeout(()=>{
                assert.equal(6, lines.length);
                assert.notEqual(-1, lines[0].indexOf('line 1'));
                assert.notEqual(-1, lines[1].indexOf('line 2'));
                assert.notEqual(-1, lines[2].indexOf('line 3'));
                assert.notEqual(-1, lines[3].indexOf('line 4'));
                assert.notEqual(-1, lines[4].indexOf('line 5'));
                assert.notEqual(-1, lines[5].indexOf('line 6'));
                done();
            },1000);
        });

        it('logger.flush, logger is empty', function(done) {
            logger.flush(done);
        });
    });

//  describe('instance methods', ()=>{
//      let logger;
//      before(()=>{
//          logger = new api.lib.LoggerFs({});
//      });

//      it('logger.system', function() {
//          logger.system('11111');
//      });

//      it('logger.fatal', function() {
//          logger.fatal('22222');
//      });

//      it('logger.error', function() {
//          logger.error('33333');
//      });

//      it('logger.warn', function() {
//          logger.warn('44444');
//      });

//      it('logger.info', function() {
//          logger.info('55555');
//      });

//      it('logger.debug', function() {
//          logger.debug('66666');
//      });
//  });
});

