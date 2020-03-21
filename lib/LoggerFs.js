'use strict';

const assert = require('assert'),
      { EventEmitter } = require('events');

const DAY_MILLISECONDS = 24*60*60*1000; // 86400000
const LINE_STACK = stack => stack.replace(/[\n\r]\s*/g, '; ');

module.exports = (api)=>{
    assert(api);
    assert(api.fs);

    const Stream = function(opts) {
        EventEmitter.call(this);
        this._type = opts.type || 'TBD';
        const { writeIntervalMs, writeBufferBytes } = opts;
        this._writeIntervalMs = writeIntervalMs || 3000;
        this._writeBufferBytes = writeBufferBytes || 64 * 1024;
//      console.log(`lib.LoggerFs.Stream.Stream(), writeIntervalMs:${this._writeIntervalMs}, writeBufferBytes:${this._writeBufferBytes}`);
        const { path } = opts;
        assert(path);
        this._path = path;
//      console.log(`lib.LoggerFs.Stream.Stream, path:${this._path}`);
        this._locked = false;
    }
    Stream.prototype = Object.create(EventEmitter.prototype);

    Stream.prototype.isOpen = function() {
        return (typeof this._stream !== 'undefined');
    }

    Stream.prototype.open = function() {
//      console.log(`lib.LoggerFs.Stream.open(), isOpen:${this.isOpen()}`);
        if (this.isOpen()) return;

        const {next} = LoggerFs.after();
//      console.log(`lib.LoggerFs.Stream.open, next:` + next);

        this._reopenTimer = setTimeout(() => {
            this.once('close', () => {
                this.open();
            });
            this.close();
        }, next);

        this._buffer = [];
        this._fileName = this._path + '/' + LoggerFs.createStreamFileName(this);
//      console.log(`lib.LoggerFs.Stream.open, _fileName:`, this._fileName);
        this._stream = api.fs.createWriteStream(this._fileName);

        this._flushTimer = setInterval(() => {
            this.flush();
        }, this._writeIntervalMs);
    }

    Stream.prototype.close = function(cb) {
//      console.log(`lib.LoggerFs.Stream.close(), isOpen:${this.isOpen()}`);
        if (!this.isOpen()) {
            if (cb) setImmediate(cb);
            return;
        }

        this.flush((err) => {
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
                if (cb) setImmediate(cb);
////////////////api.fs.stat(fileName, (err, stats) => { // PTFIXME, what is this shit for?
////////////////    if (err) return;
////////////////    if (stats.size > 0) return;
////////////////    api.fs.unlink(fileName, () => {});
////////////////});
            });
        });
    }

    Stream.prototype.flush = function(cb) {
//      console.log(`lib.LoggerFs.Stream.flush(), isOpen:${this.isOpen()}`);
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
        const buffer = Buffer.concat(this._buffer);
        this._buffer = [];
        if (buffer.length==0) {
            if (cb) setImmediate(cb);
            return;
        }

        this._locked = true;
//      console.log(`lib.LoggerFs.flush, buffer:${buffer}`);
        this._stream.write(buffer, () => {
            this._locked = false;
            this.emit('finished');
            if (cb) cb(); // PTFXIME, is it save, few lines above here is once(finished) already is calling cb, double cb call?
        });
    }

    Stream.prototype.write = function(message) {
//      console.log(`lib.LoggerFs.Stream.write(), message:${message}`);
        if (!this.isOpen()) return;
        const buffer = Buffer.from(message);
        this._buffer.push(buffer);
    }

    /////////////////////////////////////////////
    /////////////////////////////////////////////
    /////////////////////////////////////////////

    const LoggerFs = function(opts) {
        assert(opts.streams, 'No streams are given');
        this.opts = opts;
        this._streams = [];
    }

    LoggerFs.createStreamFileName = function(stream) {
        const DateFoo = LoggerFs.dateFoo || Date;
        const now = new DateFoo();
        let nowStr = now.toUTCString();
        nowStr = nowStr.split(' ').slice(1).join(' '); // Removing day of week
        const fileName = `${nowStr}.${stream._type}.log`;
//      console.log(`lib.LoggerFs.Stream.open, now.v1:` + now);
//      console.log(`lib.LoggerFs.Stream.open, now.v2:`, now);
//      console.log(`lib.LoggerFs.Stream.open, now.toString:` + now.toString());
//      console.log(`lib.LoggerFs.Stream.open, now.toLocaleString:` + now.toLocaleString());
//      console.log(`lib.LoggerFs.Stream.open, now.toDateString:` + now.toDateString());
//      console.log(`lib.LoggerFs.Stream.open, now.toUTCString:` + now.toUTCString());
//      console.log(`lib.LoggerFs.Stream.open, now.toTimeString:` + now.toTimeString());
//      console.log(`lib.LoggerFs.Stream.open, now.toISOString:` + now.toISOString());
        return fileName;
    }

    LoggerFs.after = function() {
        const DateFoo = LoggerFs.dateFoo || Date;

        const begin = new DateFoo();
        begin.setUTCHours(0, 0, 0, 0);
        const now = new DateFoo();

        const next = DAY_MILLISECONDS - (now - begin);
        return {now:now, next:next};
    }

    LoggerFs.prototype.getStream = function(stream) {
        return this._streams[stream];
    }

    LoggerFs.prototype.getStreamFileName = function(stream) {
        return this.getStream(stream)._fileName;
    }

    LoggerFs.prototype.isOpen = function() {
        return Object.keys(this._streams).length > 0;
    }

    LoggerFs.prototype.open = function() {
//      console.log(`lib.LoggerFs.open(), isOpen:${this.isOpen()}`);
        if (this.isOpen()) return;

        const createStream = (name)=>{
            this.opts.type = name;
            const stream = new Stream(this.opts);
            stream.open();
            this._streams[name] = stream;

            const foo = function(type, message) {
                this._write(type, message);
            }
            const f= foo.bind(this, name);
            this[name] = f;
        }

        this.opts.streams.forEach((name)=>{
            createStream(name);
        });
    }

    LoggerFs.prototype.close = function(cb) {
//      console.log(`lib.LoggerFs.close(), isOpen:${this.isOpen()}`);
        if (!this.isOpen()) {
            if (cb) setImmediate(cb);
            return;
        }

        const close = function(streams, cb) {
            const keys = Object.keys(streams);
            if (keys.length > 0) {
                const k = keys[0];
                const s = streams[k];
                delete streams[k]; 
                s.close((err)=>{
                    if (err) {
                        cb(err);
                    } else {
                        close(streams, cb);
                    }
                });
            } else {
                cb();
            }
        }

        close(this._streams, (err)=>{
            if (cb) setImmediate(()=>{cb(err)});
        });
    }

    LoggerFs.prototype.flush = function(cb) {
//      console.log(`lib.LoggerFs.flush(), isOpen:${this.isOpen()}`);
        if (!this.isOpen()) {
            if (cb) setImmediate(cb);
            return;
        }

        const flush = function(index, streams, cb) {
            const keys = Object.keys(streams);
            if (index < keys.length) {
                const k = keys[index];
                const s = streams[k];
                s.flush((err)=>{
                    if (err) {
                        cb(err);
                    } else {
                        flush(index+1, streams, cb);
                    }
                });
            } else {
                cb();
            }
        }

        flush(0, this._streams, (err)=>{
            if (cb) setImmediate(()=>{cb(err)});
        });
    }

    LoggerFs.prototype._write = function(type, message) {
//      console.log(`lib.LoggerFs._write, type:${type}, message:${message}`);
        const dateTime = (new Date()).toISOString();
        const mark = ' ' + type.padEnd(7);
        const msg = LINE_STACK(message);

        const line = `${dateTime} ${mark} ${message}\n`;
        const stream = this._streams[type];
        stream.write(line);
    }

    LoggerFs.prototype._writeRaw = function(type, message) {
//      console.log(`lib.LoggerFs._writeRaw, type:${type}, message:${message}`);
        const stream = this._streams[type];
        if (stream) {
            stream.write(message);
        }
    }

    return LoggerFs;
}

