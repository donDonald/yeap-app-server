'use strict';

const assert = require('assert');
const vm = require('metavm');
const Application = require('../sandboxing');

describe('sabdboxing', ()=>{

/*
    it('global g_application v1', ()=>{
        const g_application = { name:'g_application v1'};
        const SANDBOX = { ...vm.COMMON_CONTEXT, assert, g_application };
        const sandbox = { ...SANDBOX };
        const context = vm.createContext(sandbox);
        const src = `
            console.log("---- g_application:");
            console.dir(g_application);
            assert.equal("g_application v1", g_application.name);
            `;
        const script = vm.createScript('script', src, {context:context});
    });

    it('global g_application v2', ()=>{
        const g_application = {name:'g_application v2'};
        const SANDBOX = { ...vm.COMMON_CONTEXT, assert };
        const sandbox = { ...SANDBOX };
        sandbox.g_application = g_application;
        const context = vm.createContext(sandbox);
        const src = `
            console.log("---- g_application:");
            console.dir(g_application);
            assert.equal("g_application v2", g_application.name);
            `;
        const script = vm.createScript('script', src, {context:context});
    });

    it('global g_application v3', ()=>{
        const g_application = {name:'g_application v3'};
        const SANDBOX = { ...vm.COMMON_CONTEXT, assert, module };
        const sandbox = { ...SANDBOX };
        sandbox.g_application = g_application;
        const context = vm.createContext(sandbox);
        const src = `
            "use strict";
            const foo = ()=>{
                //console.log("---- global:");
                //console.dir(global);
                console.log("---- g_application:");
                console.dir(g_application);
                assert.equal("g_application v3", g_application.name);
            }
            module.exports = foo();
            `;
        const script = vm.createScript('script', src, {context:context});
    });

    it('Context out of context', ()=>{
        const g_application = {name:'App A'};
        const SANDBOX = { ...vm.COMMON_CONTEXT, process, g_application };

        const sandboxA = { ...SANDBOX };
        const contextA = vm.createContext(sandboxA);
        const scriptA = vm.createScript('scriptA', 'console.log("---- g_application:"); console.dir(g_application);', {context:contextA});
        sandboxA.g_application.name = 'App A, v2';
        scriptA.script.runInContext(scriptA.context);


        const sandboxB = { ...contextA };
        sandboxB.g_application.name = 'App B';
        const contextB = vm.createContext(sandboxB);
        const scriptB = vm.createScript('scriptB', 'console.log("---- g_application:"); console.dir(g_application);', {context:contextB});

        scriptA.script.runInContext(scriptA.context);
        scriptB.script.runInContext(scriptB.context);

      //console.log('----------');
      //console.dir(scriptA.context);
    });
*/

//  it('require in separated context', ()=>{
//      //console.log('---------------------- module:');
//      //console.dir(module);

//      const SANDBOX = { ...vm.COMMON_CONTEXT, process, require };
//      const sandbox = { ...SANDBOX };
//      sandbox.global = sandbox;
//      sandbox.superDuper = 'This is super duper string';
//      const context = vm.createContext(sandbox);
//      const src = `
//          console.log('---------------------- typeof global:' + typeof global);
//          console.log('---------------------- typeof global.superDuper:' + typeof global.superDuper);
//          const stuff = require("./sandboxing.stuff.js");
//        //console.dir(stuff);
//      `;
//      const script = vm.createScript('script', src, {context:context});
//  });


    it('require in separated context', ()=>{
        console.log('---------------------- module:');
        console.dir(module);

        const SANDBOX = { ...vm.COMMON_CONTEXT, process, require, node };
        const sandbox = { ...SANDBOX };
        sandbox.global = sandbox;
        sandbox.superDuper = 'This is super duper string';
        const context = vm.createContext(sandbox);
        const src = `
            console.log('---------------------- typeof global:' + typeof global);
            console.log('---------------------- typeof global.superDuper:' + typeof global.superDuper);
            const stuff = require("./sandboxing.stuff.js");
          //console.dir(stuff);
        `;
        const script = vm.createScript('script', src, {context:context});
    });









//      it('tmp', ()=>{
//          const context = {};
//          context.api = null;

//          const context2 = {};
//          context2.api = context.api;

//          console.log('context2.api:' + context2.api);
//          context.api = 'yeeeeee';
//          console.log('context2.api:' + context2.api);
//      });

//      it('tmp2', ()=>{

//          class Tmp {
//              constructor() {
//                  this.api = null;
//                  this.config = null;
//                  this.config2 = null;
//  //              this.console = null;
//                  this.resources={name:'rrresources'};
//                  this.schemas={name:'sssschemas'};
//                  this.scheduler={name:'ssscheduler'};
//              }

//              createSandbox() {
//  //              const SANDBOX = { ...vm.COMMON_CONTEXT };
//  //              const { config, config2, /*console,*/ resources, schemas, scheduler } = this;
//  //              const sandbox = { ...SANDBOX, console, config, process };
//  //              sandbox.api = {};
//  //              this.sandbox = vm.createContext(sandbox);
//  //              console.log('typeof this.sandbox.config:' + typeof this.sandbox.config);
//  //              console.log('typeof this.sandbox.config2:' + typeof this.sandbox.config2);

//                  const SANDBOX = { ...vm.COMMON_CONTEXT };
//                  console.log('typeof this.api:' + typeof this.api);
//                  const { api, config, config2, /*console,*/ resources, schemas, scheduler } = this;
//                  console.log('typeof api:' + typeof api);
//                  const sandbox = { ...SANDBOX, console, process, api, config, config2 };
//                  this.sandbox = vm.createContext(sandbox);
//                  console.log('typeof this.sandbox.api:' + typeof this.sandbox.api);
//                  console.log('typeof this.sandbox.config:' + typeof this.sandbox.config);
//                  console.log('typeof this.sandbox.config2:' + typeof this.sandbox.config2);
//                  console.log('!!! this.sandbox.api:' + this.sandbox.api);
//  this.api = "aaapi"
//          const scriptA = vm.createScript('scriptA', 'console.log("api:"+api);', {context:this.sandbox});
//  this.sandbox.api = "aaapi2"
//          const scriptB = vm.createScript('scriptA', 'console.log("api:"+api);', {context:this.sandbox});
//              }

//              init() {
//  console.log('fff');
//                  this.createSandbox();
//              }
//          };

//          const tmp = new Tmp;
//          tmp.init();
//      });
});

