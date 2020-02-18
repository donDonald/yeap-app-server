'use strict';

describe('lib.Logger', function() {

    const assert = require('assert');
    let api;

    let lastLine, write;
    before(()=>{
        const re = function(module) { return require('../' + module); }
        api = {};
        api.lib = {};
        api.lib.Logger = re('Logger');
        api.lib.Logger.cout = (message)=>{
            lastLine = message;
//          console.log('ZZZZZZ:' + message);
        }
    });

    describe('static methods', ()=>{
        it('Check instantiation', function() {
            const i1 = api.lib.Logger._getInstance();
            const i2 = api.lib.Logger._getInstance();
            assert.equal(i1, i2);

            const i3 = new api.lib.Logger();
            assert.notEqual(i1, i3);
        });

        it('api.lib.Logger.system', function() {
            api.lib.Logger.system('AAAAA');
            assert.notEqual(-1, lastLine.indexOf('system'));
            assert.notEqual(-1, lastLine.indexOf('AAAAA'));
        });

        it('api.lib.Logger.fatal', function() {
            api.lib.Logger.fatal('BBBBB');
            assert.notEqual(-1, lastLine.indexOf('fatal'));
            assert.notEqual(-1, lastLine.indexOf('BBBBB'));
        });

        it('api.lib.Logger.error', function() {
            api.lib.Logger.error('CCCCC');
            assert.notEqual(-1, lastLine.indexOf('error'));
            assert.notEqual(-1, lastLine.indexOf('CCCCC'));
        });

        it('api.lib.Logger.warn', function() {
            api.lib.Logger.warn('DDDDD');
            assert.notEqual(-1, lastLine.indexOf('warn'));
            assert.notEqual(-1, lastLine.indexOf('DDDDD'));
        });

        it('api.lib.Logger.info', function() {
            api.lib.Logger.info('EEEEE');
            assert.notEqual(-1, lastLine.indexOf('info'));
            assert.notEqual(-1, lastLine.indexOf('EEEEE'));
        });

        it('api.lib.Logger.debug', function() {
            api.lib.Logger.debug('FFFFF');
            assert.notEqual(-1, lastLine.indexOf('debug'));
            assert.notEqual(-1, lastLine.indexOf('FFFFF'));
        });

        it('context switching', function() {
            api.lib.Logger.ctx('CTXA').debug('aaa1');
            assert.notEqual(-1, lastLine.indexOf('CTXA'));
            assert.notEqual(-1, lastLine.indexOf('aaa1'));

            api.lib.Logger.ctx('CTXA').info('aaa2');
            assert.notEqual(-1, lastLine.indexOf('CTXA'));
            assert.notEqual(-1, lastLine.indexOf('aaa2'));

            api.lib.Logger.debug('aaa3');
            assert.equal(-1, lastLine.indexOf('CTXA'));
            assert.notEqual(-1, lastLine.indexOf('aaa3'));

            api.lib.Logger.ctx('CTXB').warn('bbb1');
            assert.notEqual(-1, lastLine.indexOf('CTXB'));
            assert.notEqual(-1, lastLine.indexOf('bbb1'));

            api.lib.Logger.ctx('CTXB').error('bbb2');
            assert.notEqual(-1, lastLine.indexOf('CTXB'));
            assert.notEqual(-1, lastLine.indexOf('bbb2'));

            api.lib.Logger.debug('bbb3');
            assert.equal(-1, lastLine.indexOf('CTXB'));
            assert.notEqual(-1, lastLine.indexOf('bbb3'));
        });

        it('2 conextes at once', function() {
            api.lib.Logger.ctx('CTX1').ctx('CTX2').debug('yyy');

            const ctx1Index = lastLine.indexOf('CTX1');
            assert.notEqual(-1, ctx1Index);

            const ctx2Index = lastLine.indexOf('CTX2');
            assert.notEqual(-1, ctx2Index);

            assert(ctx1Index < ctx2Index);
        });

        it('3 conextes at once', function() {
            api.lib.Logger.ctx('CTX1').ctx('CTX2').ctx('CTX3').debug('zzz');

            const ctx1Index = lastLine.indexOf('CTX1');
            assert.notEqual(-1, ctx1Index);

            const ctx2Index = lastLine.indexOf('CTX2');
            assert.notEqual(-1, ctx2Index);

            const ctx3Index = lastLine.indexOf('CTX3');
            assert.notEqual(-1, ctx3Index);

            assert(ctx1Index < ctx2Index);
            assert(ctx2Index < ctx3Index);
        });
    });

    describe('instance methods', ()=>{
        let logger;
        before(()=>{
            logger = new api.lib.Logger();
        });

        it('logger.system', function() {
            logger.system('11111');
            assert.notEqual(-1, lastLine.indexOf('system'));
            assert.notEqual(-1, lastLine.indexOf('11111'));
        });

        it('logger.fatal', function() {
            logger.fatal('22222');
            assert.notEqual(-1, lastLine.indexOf('fatal'));
            assert.notEqual(-1, lastLine.indexOf('22222'));
        });

        it('logger.error', function() {
            logger.error('33333');
            assert.notEqual(-1, lastLine.indexOf('error'));
            assert.notEqual(-1, lastLine.indexOf('33333'));
        });

        it('logger.warn', function() {
            logger.warn('44444');
            assert.notEqual(-1, lastLine.indexOf('warn'));
            assert.notEqual(-1, lastLine.indexOf('44444'));
        });

        it('logger.info', function() {
            logger.info('55555');
            assert.notEqual(-1, lastLine.indexOf('info'));
            assert.notEqual(-1, lastLine.indexOf('55555'));
        });

        it('logger.debug', function() {
            logger.debug('66666');
            assert.notEqual(-1, lastLine.indexOf('debug'));
            assert.notEqual(-1, lastLine.indexOf('66666'));
        });

        it('context switching', function() {
            logger.ctx('CTXA').debug('aaa1');
            assert.notEqual(-1, lastLine.indexOf('CTXA'));
            assert.notEqual(-1, lastLine.indexOf('aaa1'));

            logger.ctx('CTXA').info('aaa2');
            assert.notEqual(-1, lastLine.indexOf('CTXA'));
            assert.notEqual(-1, lastLine.indexOf('aaa2'));

            logger.debug('aaa3');
            assert.equal(-1, lastLine.indexOf('CTXA'));
            assert.notEqual(-1, lastLine.indexOf('aaa3'));

            logger.ctx('CTXB').warn('bbb1');
            assert.notEqual(-1, lastLine.indexOf('CTXB'));
            assert.notEqual(-1, lastLine.indexOf('bbb1'));

            logger.ctx('CTXB').error('bbb2');
            assert.notEqual(-1, lastLine.indexOf('CTXB'));
            assert.notEqual(-1, lastLine.indexOf('bbb2'));

            logger.debug('bbb3');
            assert.equal(-1, lastLine.indexOf('CTXB'));
            assert.notEqual(-1, lastLine.indexOf('bbb3'));
        });

        it('2 conextes at once', function() {
            logger.ctx('CTX1').ctx('CTX2').debug('yyy');

            const ctx1Index = lastLine.indexOf('CTX1');
            assert.notEqual(-1, ctx1Index);

            const ctx2Index = lastLine.indexOf('CTX2');
            assert.notEqual(-1, ctx2Index);

            assert(ctx1Index < ctx2Index);
        });

        it('3 conextes at once', function() {
            logger.ctx('CTX1').ctx('CTX2').ctx('CTX3').debug('zzz');

            const ctx1Index = lastLine.indexOf('CTX1');
            assert.notEqual(-1, ctx1Index);

            const ctx2Index = lastLine.indexOf('CTX2');
            assert.notEqual(-1, ctx2Index);

            const ctx3Index = lastLine.indexOf('CTX3');
            assert.notEqual(-1, ctx3Index);

            assert(ctx1Index < ctx2Index);
            assert(ctx2Index < ctx3Index);
        });
    });
});

