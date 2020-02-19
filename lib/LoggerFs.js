'use strict';

const fs = require('fs');
const assert = require('assert');
const util = require('util');
const { EventEmitter } = require('events');
const DAY_MILLISECONDS = 24*60*60*1000;
const LINE_STACK = stack => stack.replace(/[\n\r]\s*/g, '; ');

const Logger = function(opts) {
    EventEmitter.call(this);
    const { writeIntervalMs, writeBufferBytes, keepDays } = opts;
    this._writeIntervalMs = writeIntervalMs || 3000;
    this._writeBufferBytes = writeBufferBytes || 64 * 1024;
    this._keepDays = keepDays || 0;
//  console.log(`lib.LoggerFs.LoggerFs(), writeIntervalMs:${this._writeIntervalMs}, writeBufferBytes:${this._writeBufferBytes}, keepDays:${this._keepDays}`);
    const { path } = opts;
    this._path = path;
//  console.log(`lib.LoggerFs.LoggerFs, path:${this._path}`);
    this._locked = false;
}
util.inherits(Logger, EventEmitter);

Logger.prototype.isOpen = function() {
    return (typeof this._stream !== 'undefined');
}

Logger.prototype.open = function() {
//  console.log(`lib.LoggerFs.open(), isOpen:${this.isOpen()}`);
    if (this.isOpen()) return;

    const now = new Date();
    const nextDate = new Date();
    nextDate.setUTCHours(0, 0, 0, 0);
    const nextReopen = nextDate - now + DAY_MILLISECONDS;

    this._reopenTimer = setTimeout(() => {
        this.once('close', () => {
            this.open();
        });
        this.close();
    }, nextReopen);

    this._buffer = [];
    this._fileName = `${this._path}/${now}.log`;
    this._stream = fs.createWriteStream(this._fileName);

    this._flushTimer = setInterval(() => {
        this.flush();
    }, this._writeIntervalMs);
}

Logger.prototype.close = function() {
//  console.log(`lib.LoggerFs.close(), isOpen:${this.isOpen()}`);
    if (!this.isOpen()) return;

    this.flush(err => {
        assert(!err, err);
        clearInterval(this._flushTimer);
        clearTimeout(this._reopenTimer);
        this._flushTimer = undefined;
        this._reopenTimer = undefined;
        this._stream.end(() => {
            const fileName = this._fileName;
            this._buffer = undefined;
            this._fileName = undefined;
            this._stream = undefined;
            this.emit('close');
            fs.stat(fileName, (err, stats) => {
                if (err) return;
                if (stats.size > 0) return;
                fs.unlink(fileName, () => {});
            });
        });
    });
}

Logger.prototype.flush = function(cb) {
//  console.log(`lib.LoggerFs.flush()`);
    if (!this.isOpen()) {
        if (cb) setImmediate(cb);
        return;
    }
    if (this._locked) {
        if (cb) this.once('finished', cb);
        return;
    }
    if (this._buffer.length === 0) {
        if (cb) setImmediate(cb);
        return;
    }
    this._locked = true;
    const buffer = Buffer.concat(this._buffer);
    if (buffer.length>0) {
//      console.log(`lib.LoggerFs.flush, buffer:${buffer}`);
        this._buffer = [];
        this._stream.write(buffer, () => {
            this._locked = false;
            this.emit('finished');
            if (cb) cb();
        });
    } else {
        this._locked = false;
        this.emit('finished');
        if (cb) setImmediate(cb);
    }
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

Logger.prototype._write = function(type, message) {
    const date = new Date();
    const dateTime = date.toISOString();
    const msg = LINE_STACK(message);
    const line = `${dateTime} [${type}] ${msg}\n`;
    const buffer = Buffer.from(line);
    this._buffer.push(buffer);
}

Logger.prototype._writeRaw = function(type, message) {
    const buffer = Buffer.from(message);
    this._buffer.push(buffer);
}

module.exports = Logger;
