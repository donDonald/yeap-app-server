'use strict';

const assert = require('assert');

const api = {};
module.exports = api;

api.hosts = require('./hosts.js')(api);
api.docker_compose = require('./docker-compose.js')(api);

