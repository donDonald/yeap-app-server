'use strict';

describe('app_server.Logger', function() {

    const assert = require('assert');
    let api;
    before(()=>{
        const re = function(module) { return require('../' + module); }
        api = {};
        api.app_server = {};
        api.app_server.Logger = re('Logger')(api);
        api.app_server.Logger._getInstance()._cout = (message)=>{
            lastLine = message;
        };
    });

    describe('static methods', ()=>{
        let lastLine;
        before(()=>{
            api.app_server.Logger._getInstance()._cout = (message)=>{
                lastLine = message;
            };
        });

        it('Check instantiation', function() {
            const i1 = api.app_server.Logger._getInstance();
            const i2 = api.app_server.Logger._getInstance();
            assert.equal(i1, i2);

            const i3 = new api.app_server.Logger();
            assert.notEqual(i1, i3);
        });

        it('lib.Logger.system', function() {
            api.app_server.Logger.system('AAAAA');
            assert.notEqual(-1, lastLine.indexOf('system'));
            assert.notEqual(-1, lastLine.indexOf('AAAAA'));
        });

        it('lib.Logger.fatal', function() {
            api.app_server.Logger.fatal('BBBBB');
            assert.notEqual(-1, lastLine.indexOf('fatal'));
            assert.notEqual(-1, lastLine.indexOf('BBBBB'));
        });

        it('lib.Logger.error', function() {
            api.app_server.Logger.error('CCCCC');
            assert.notEqual(-1, lastLine.indexOf('error'));
            assert.notEqual(-1, lastLine.indexOf('CCCCC'));
        });

        it('lib.Logger.warn', function() {
            api.app_server.Logger.warn('DDDDD');
            assert.notEqual(-1, lastLine.indexOf('warn'));
            assert.notEqual(-1, lastLine.indexOf('DDDDD'));
        });

        it('lib.Logger.info', function() {
            api.app_server.Logger.info('EEEEE');
            assert.notEqual(-1, lastLine.indexOf('info'));
            assert.notEqual(-1, lastLine.indexOf('EEEEE'));
        });

        it('lib.Logger.debug', function() {
            api.app_server.Logger.debug('FFFFF');
            assert.notEqual(-1, lastLine.indexOf('debug'));
            assert.notEqual(-1, lastLine.indexOf('FFFFF'));
        });

        it('context switching', function() {
            api.app_server.Logger.ctx('CTXA').debug('aaa1');
            assert.notEqual(-1, lastLine.indexOf('CTXA'));
            assert.notEqual(-1, lastLine.indexOf('aaa1'));

            api.app_server.Logger.ctx('CTXA').info('aaa2');
            assert.notEqual(-1, lastLine.indexOf('CTXA'));
            assert.notEqual(-1, lastLine.indexOf('aaa2'));

            api.app_server.Logger.debug('aaa3');
            assert.equal(-1, lastLine.indexOf('CTXA'));
            assert.notEqual(-1, lastLine.indexOf('aaa3'));

            api.app_server.Logger.ctx('CTXB').warn('bbb1');
            assert.notEqual(-1, lastLine.indexOf('CTXB'));
            assert.notEqual(-1, lastLine.indexOf('bbb1'));

            api.app_server.Logger.ctx('CTXB').error('bbb2');
            assert.notEqual(-1, lastLine.indexOf('CTXB'));
            assert.notEqual(-1, lastLine.indexOf('bbb2'));

            api.app_server.Logger.debug('bbb3');
            assert.equal(-1, lastLine.indexOf('CTXB'));
            assert.notEqual(-1, lastLine.indexOf('bbb3'));
        });

        it('2 conextes at once', function() {
            api.app_server.Logger.ctx('CTX1').ctx('CTX2').debug('yyy');

            const ctx1Index = lastLine.indexOf('CTX1');
            assert.notEqual(-1, ctx1Index);

            const ctx2Index = lastLine.indexOf('CTX2');
            assert.notEqual(-1, ctx2Index);

            assert(ctx1Index < ctx2Index);
        });

        it('3 conextes at once', function() {
            api.app_server.Logger.ctx('CTX1').ctx('CTX2').ctx('CTX3').debug('zzz');

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
        let logger, lastLine;
        before(()=>{
            logger = new api.app_server.Logger();
            logger._cout = (message)=>{
                lastLine = message;
            };
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

