'use strict';

const assert = require('assert'),
      concolor = require('concolor');

const STREAMS = ['system', 'fatal', 'error', 'warn', 'info', 'debug'];
const TYPE_COLOR = concolor({
    system: 'b,white/blue',
    fatal: 'b,yellow/red',
    error: 'black/red',
    warn: 'black/yellow',
    info: 'blue/green',
    debug: 'black/white',
    access: 'black/white',
    slow: 'b,yellow/blue',
    db: 'b,white/green',
});

const TEXT_COLOR = concolor({
    system: 'b,white',
    fatal: 'b,red',
    error: 'red',
    warn: 'b,yellow',
    info: 'b,green',
    debug: 'white',
    access: 'white',
    slow: 'b,blue',
    db: 'green',
});

const LINE_STACK = stack => stack.replace(/[\n\r]\s*/g, '; ')

module.exports = (api)=>{
    assert(api);

    const Logger = function() {
        this._cout = process.stdout.write.bind(process.stdout);
        STREAMS.forEach((name)=>{
            const foo = function(type, message) {
                this._write(type, message);
            }
            const f= foo.bind(this, name);
            this[name] = f;
        });
    }

    Logger._getInstance = function() {
        if (!Logger._instance) {
            Logger._instance = new Logger();
        }
        return Logger._instance;
    }

    // Instance methods
    Logger.prototype.setNext = function(next) {
        this._nextout = next;
    }

    Logger.prototype.ctx = function(ctx) {
        this._ctx = this._ctx || [];
        this._ctx.push(ctx);
        return this;
    }

    // Static methods
    Logger.setNext = function(next) {
        Logger._getInstance().setNext(next);
    }

    Logger.ctx = function(ctx) {
        return Logger._getInstance().ctx(ctx);
    }

    STREAMS.forEach((name)=>{
        const foo = function(type, message) {
            const f = Logger._getInstance()[type];
            f(message);
        }
        const f= foo.bind(this, name);
        Logger[name] = f;
    });

    Logger.prototype._write = function(type, message) {
        const normalColor = TEXT_COLOR[type];
        const markColor = TYPE_COLOR[type];

        const dateTime = (new Date()).toISOString();
        const mark = ' ' + type.padEnd(7);
        const msg = LINE_STACK(message);

        const ctx = this._ctx;
        this._ctx = undefined;
        let ctxline = '';
        if (ctx) {
            ctxline = ' ';
            ctx.forEach((c, i)=>{
                ctxline += `[${c}]`;
            });
        }

        const line = `${normalColor(dateTime)}${ctxline} ${markColor(mark)} ${normalColor(message)}\n`;
        this._cout(line);

        if (this._nextout) {
            const line = `${dateTime}${ctxline} ${mark} ${message}\n`;
            this._nextout(type, line);
        }
    }

    return Logger;
}
