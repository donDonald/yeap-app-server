'use strict';

const assert = require('assert');
const exec = require('child_process').exec;
const hostile = require('hostile');

const hosts = {};

hosts.add = (containerName, cb)=>{
//  console.log('docker-hosts.add(), containerName:' + containerName);

    const container={};
    const commands = [
        {cmd: `docker exec -t ${containerName} sh -c "hostname -i" | head -c-2`, handler:(stdout)=>{container.addr=stdout;}},
        {cmd: `docker exec -t ${containerName} sh -c "hostname" | head -c-2`, handler:(stdout)=>{container.host=stdout;}},
    ];

    const execCmd = function(index, commands, cb) {
        if (index < commands.length) {
            const cmd = commands[index];
//          console.log('cmd:'); console.log(cmd.cmd);
            
            exec(cmd.cmd, {encoding: 'utf8', maxBuffer: 200*1024}, (error, stdout, stderr)=>{
//              console.log('error:  ' + error);
//              console.log('stdout: ' + stdout);
//              console.log('stderr: ' + stderr);
                error = error || stderr;
                if (error) {
                    cb(error)
                } else {
                    cmd.handler(stdout);
                    execCmd(index+1, commands, cb);
                }
            });
        } else {
            cb();
        }
    }

    execCmd(0, commands, (err)=>{
        if (err) {
            cb(err);
        } else {
//          console.log('docker-hosts.add, container:'); console.log(container);
            hostile.set(container.addr, container.host, (err)=>{
                cb(err);
            });
        }
    });
}

module.exports = hosts;

