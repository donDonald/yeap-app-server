'use strict';

const assert = require('assert');
const fs = require('fs');
const readline = require('readline');

const loadStream = (logger, stream, cb)=>{
    const f = logger.getStreamFileName(stream);
    const e = fs.existsSync(f);
    assert.equal(true, e);

    const readInterface = readline.createInterface({
        input: fs.createReadStream(f),
//      output: process.stdout,
        console: false
    });

    const lines = [];
    readInterface.on('line', function(line) {
        lines.push(line);
    });

    setTimeout(()=>{
        cb(lines);
    }, 100);
}

const loadStreams = (logger, index, streams, cb, result)=>{
    if (index < streams.length) {
        const stream = streams[index];
        assert(stream);
        loadStream(logger, stream, (lines)=>{
            assert(lines);
            const r = result || {};
            r[stream] = lines;
            loadStreams(logger, index+1, streams, cb, r);
        });
    } else {
        cb(result);
    }
}

module.exports = {
    loadStream: loadStream,
    loadStreams: loadStreams
};

