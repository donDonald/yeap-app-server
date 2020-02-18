'use strict';

// Console logger 
const concolor = require('concolor');

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

const Logger = function() {
    this._cout = Logger.cout || process.stdout.write.bind(process.stdout);
}

Logger._getInstance = function() {
    if (!Logger._instance) {
        Logger._instance = new Logger();
    }
    return Logger._instance;
}



// Instance methods
Logger.prototype.ctx = function(ctx) {
    this._ctx = this._ctx || [];
    this._ctx.push(ctx);
    return this;
}

Logger.prototype.system = function(message) {
    this._write('system', message);
}

Logger.prototype.fatal = function(message) {
    this._write('fatal', message);
}

Logger.prototype.error = function(message) {
    this._write('error', message);
}

Logger.prototype.warn = function(message) {
    this._write('warn', message);
}

Logger.prototype.info = function(message) {
    this._write('info', message);
}

Logger.prototype.debug = function(message) {
    this._write('debug', message);
}



// Static methods
Logger.ctx = function(ctx) {
    return Logger._getInstance().ctx(ctx);
}

Logger.system = function(message) {
    Logger._getInstance().system(message);
}

Logger.fatal = function(message) {
    Logger._getInstance().fatal(message);
}

Logger.error = function(message) {
    Logger._getInstance().error(message);
}

Logger.warn = function(message) {
    Logger._getInstance().warn(message);
}

Logger.info = function(message) {
    Logger._getInstance().info(message);
}

Logger.debug = function(message) {
    Logger._getInstance().debug(message);
}

Logger.prototype._write = function(type, message) {
    const date = new Date();
    const dateTime = date.toISOString()
    const normalColor = TEXT_COLOR[type];
    const markColor = TYPE_COLOR[type];
    const time = normalColor(dateTime.substring(11, 19));
    const mark = markColor(' ' + type.padEnd(7));
    const msg = normalColor(message);
    const line = `${time}  ${mark}  ${msg}\n`;

    let ctxline = '';
    const ctx = this._ctx || [];
    this._ctx = undefined;
    ctx.forEach((c, i)=>{
        ctxline += `[${c}]`;
    });
    this._cout(ctxline + line);
}

module.exports = Logger;
