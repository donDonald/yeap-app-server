'use strict';

describe('lib.Logger + lib.LoggerFs, chaining Logger and LoggerFs', function() {

    const assert = require('assert');
    const fs = require('fs');
    const readline = require('readline');
    let api;

    before(()=>{
        const re = function(module) { return require('../' + module); }
        api = {};
        api.lib = {};
        api.lib.Logger = re('Logger');
        api.lib.LoggerFs = re('LoggerFs');
    });

    const DIR = process.cwd() + '/tmp';
    let logger, loggerFs;

    after(()=>{
        loggerFs.close();
    });

    describe('Static methods', ()=>{
        it('Create LoggerFs and open', ()=>{
            loggerFs = new api.lib.LoggerFs({path:DIR});
            assert.equal(false, loggerFs.isOpen());
            loggerFs.open();
            assert.equal(true, loggerFs.isOpen());
        });

        it('Create Logger and chain to LoggerFs', ()=>{
            api.lib.Logger.setNext(loggerFs._writeRaw.bind(loggerFs));
        });

        it('Write logs, no context', (done)=>{
            api.lib.Logger.system('AAAAAAAAAAAAAA');
            api.lib.Logger.fatal('BBBBBBBBBBBBBB');
            api.lib.Logger.error('CCCCCCCCCCCCCC');
            api.lib.Logger.warn('DDDDDDDDDDDDDD');
            api.lib.Logger.info('EEEEEEEEEEEEEE');
            api.lib.Logger.debug('FFFFFFFFFFFFFF');
            loggerFs.flush(done);
        });

        it('Check output', (done)=>{
            const f = loggerFs._fileName;
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
                assert.notEqual(-1, lines[0].indexOf('system  AAAAAAAAAAAAAA'));
                assert.notEqual(-1, lines[1].indexOf('fatal   BBBBBBBBBBBBBB'));
                assert.notEqual(-1, lines[2].indexOf('error   CCCCCCCCCCCCCC'));
                assert.notEqual(-1, lines[3].indexOf('warn    DDDDDDDDDDDDDD'));
                assert.notEqual(-1, lines[4].indexOf('info    EEEEEEEEEEEEEE'));
                assert.notEqual(-1, lines[5].indexOf('debug   FFFFFFFFFFFFFF'));
                done();
            }, 100);
        });

        it('Write logs, CTX1 context', (done)=>{
            api.lib.Logger.ctx('CTX1').system('AAAAAAAAAAAAAA');
            api.lib.Logger.ctx('CTX1').fatal('BBBBBBBBBBBBBB');
            api.lib.Logger.ctx('CTX1').error('CCCCCCCCCCCCCC');
            loggerFs.flush(done);
        });

        it('Check output', (done)=>{
            const f = loggerFs._fileName;
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
                assert.equal(6+3, lines.length);
                assert.notEqual(-1, lines[6].indexOf('[CTX1]  system  AAAAAAAAAAAAAA'));
                assert.notEqual(-1, lines[7].indexOf('[CTX1]  fatal   BBBBBBBBBBBBBB'));
                assert.notEqual(-1, lines[8].indexOf('[CTX1]  error   CCCCCCCCCCCCCC'));
                done();
            }, 100);
        });

        it('Write logs, CTX1 & CTX2 context', (done)=>{
            api.lib.Logger.ctx('CTX1').ctx('CTX2').system('AAAAAAAAAAAAAA');
            api.lib.Logger.ctx('CTX1').ctx('CTX2').fatal('BBBBBBBBBBBBBB');
            api.lib.Logger.ctx('CTX1').ctx('CTX2').error('CCCCCCCCCCCCCC');
            loggerFs.flush(done);
        });

        it('Check output', (done)=>{
            const f = loggerFs._fileName;
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
                assert.equal(6+3+3, lines.length);
                assert.notEqual(-1, lines[9 ].indexOf('[CTX1][CTX2]  system  AAAAAAAAAAAAAA'));
                assert.notEqual(-1, lines[10].indexOf('[CTX1][CTX2]  fatal   BBBBBBBBBBBBBB'));
                assert.notEqual(-1, lines[11].indexOf('[CTX1][CTX2]  error   CCCCCCCCCCCCCC'));
                done();
            }, 100);
        });
    });

});

