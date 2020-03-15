'use strict';

module.exports = {
    writeIntervalMs: 5000, // 5 secs
    writeBufferBytes: 128 * 1024, // Buffer size 128kb
    streams: ['system', 'fatal', 'error', 'warn', 'info', 'debug', 'access']
}

