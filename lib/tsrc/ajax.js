'use strict';

//----------------------------------------------------------------------------

const assert = require('assert');

const libRe = function(module) { return require('../../' + module); }

const api                              = {};
api.lib                                = {};

libRe('core/builtins.js')(api);

api.lib.log                            = libRe('core/log.js');
api.lib.core                           = libRe('core/exports.js');

api.lib.db                             = {};
api.lib.db.Connection                  = libRe('db/Connection.js')(api);
api.lib.db.helpers                     = libRe('db/helpers.js')(api);

api.lib.sys                            = {};
api.lib.sys.hosts                      = libRe('sys/hosts.js')(api);

api.lib.sys.ias                        = {};
api.lib.sys.ias.scale                  = libRe('sys/ias.scale.js')(api);

api.lib.tools                          = {};
api.lib.tools.ajax                     = libRe('tools/ajax.js')(api);

//----------------------------------------------------------------------------

const server                           = libRe('sys/server.host.js')(api);
const APP_NAME                         = 'structures/test';

//----------------------------------------------------------------------------

describe('lib.tools.ajax, AJAX helper.', function() {

//  describe('Get server up since AJAX tests need the server, to be reviewed!', function() {
//      it('Stop server', function(done) {
//          api.lib.log.warning('Get server up since AJAX tests need the server, to be reviewed!');
//          server.stop(function(err) {
//              assert(!err, 'Server.stop() has failed:' + err);
//              done();
//          });
//      });

//      it('Unlink all apps', function(done) {
//          server.removeAllApps(function(err) {
//              assert(!err, 'Server.removeAllApps() has failed: ' + err);
//              done();
//          });
//      });

//      it('Link test app', function(done) {
//          const properties = {
//              databases: [
//                  {
//                      alias: 'dbmain',
//                      user:  'root',
//                      host:  'localhost',
//                      name:  'dbTest1',
//                  }
//              ]
//          };
//          server.addApp(APP_NAME, properties, function(err) {
//              if(err) {
//                  api.lib.log.error('Server.addApp() has failed:' + err);
//              }
//              assert(!err, 'Server.addApp() has failed:' + err);
//              done();
//          });
//      });

//      it('Start server', function(done) {
//          server.start((err)=>{
//              if(err) {
//                  api.lib.log.error('Server.start() has failed:' + err);
//              }
//              assert(!err, 'Server.start() has failed:' + err);
//              done();
//          });
//      });
//  });

    describe('Test ajax itself.', function() {
        it('ajax.json.get', function (done) {
            api.lib.tools.ajax.json.get(undefined, server.application(APP_NAME).peekUrl(), 'ajax.json', {}, {}, function(err, session, result) {
                assert(!err);
                assert(!session);
                assert(result);
                assert.equal('This is some value.', result.someValue);
                assert.notEqual('This is NOT some value.', result.someValue);
                done();
            });
        });

        it('ajax.json.get, ajax.2.json', function (done) {
            api.lib.tools.ajax.json.get(undefined, server.application(APP_NAME).peekUrl(), 'ajax.2.json', {}, {}, function(err, session, result) {
                assert(!err);
                assert(!session);
                assert(result);
                done();
            });
        });

        it('ajax.json.post', function (done) {
            api.lib.tools.ajax.json.post(undefined, server.application(APP_NAME).peekUrl(), 'ajax.json', {}, { testString: "Hello" }, function(err, session, result) {
                assert(!err);
                assert(!session);
                assert(result);
                assert.equal('Hello', result.youPosted);
                done();
            });
        });
    });

//  describe('Shutdown server.', function() {
//      it('Stop server', function(done) {
//          server.stop(function(err) {
//              assert(!err, 'Server.stop() has failed:' + err);
//              done();
//          });
//      });
//  });
});

