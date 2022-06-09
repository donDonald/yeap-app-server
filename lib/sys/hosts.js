'use strict';

// Q, What is it for?
// It's simple tool for updating /etc/hosts to help resolve app domain names.

const assert = require('assert');
const exec = require('child_process').exec;

module.exports = function(api) {
    assert(api);

    const Hosts = function(api) {
        this.api = api;
    }

    // Updates /etc/hosts
    // Takes app name ile for instance kz.test, splits it by '.' delimeter and
    // and inserts the last element to /etc/hosts
    Hosts.prototype.add = function(appName, cb) {
//      this.api.log.debug('hosts.add(), appName:' + appName);

        const hostIp = '127.0.0.1';
        const appDomains = appName.split('.');
        const appDomainsReversed = appDomains.reverse();
        const appHostName = appDomainsReversed.join('.');

        const cmd = [
            'cp /etc/hosts ~/hosts',
            'if grep -q \"' + appHostName + '\" ~/hosts; then',
            '    sed -i \"s/.*' + appHostName + '/' + hostIp + '    ' + appHostName + '/g\" ~/hosts',
            'else',
            '    echo "' + hostIp + '    ' + appHostName + '\" >> ~/hosts',
            'fi',
            'cp ~/hosts /etc/hosts'
        ].join("\n");;

//      this.api.log.debug(cmd);

        const execOptions = {
            env: Object.assign({}, process.env, { PATH: process.env.PATH + ':/usr/local/bin' })
        };

        exec(cmd, execOptions, function(error, stdout, stderr) {
//          this.api.log.debug('error:  ' + error);
//          this.api.log.debug('stdout: ' + stdout);
//          this.api.log.debug('stderr: ' + stderr);
            error = error || stderr;
            if (error) {
                cb(error);
            } else {
                cb();
            }
        });

    }

    return new Hosts(api);
}

