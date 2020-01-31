'use strict';

const assert = require('assert');

//  const accessCtrl = app.zzz.accessController.addRoute('routes/api/groups/add', 'POST', failure);
//  const validator = re('lib/tools/validators/gid.js')(api);
//  const Method = re('routes/api/groups/add/Post')(api);
//  groups.add = {};
//  groups.add.post = new Method({router:router, accessCtrl:accessCtrl, validator:validator, groups:model.groups});


const HANDLERS = {'get.js':'GET', 'post.js':'POST', 'delete.js':'DELETE', 'put.js':'PUT'};

const createHandler = function(api, router, path, accessController, accessFailure, params) {

    const fullPath = api.lib.env.makePath(path);
    const elements = path.split('/');
    elements.shift(); // remove routes
    const route = '/' + elements.join('/');
    console.log(`createHandler(), path:${path}, route:${route}, full path:${fullPath}`);

    const files = api.fs.readdirSync(fullPath);
    console.log('createHandler, files:', files);

    const result = {};
    files.forEach((file)=>{
        const methodName = HANDLERS[file];
        if (methodName) {
            console.log(`createHandler: method:${methodName}`);

            const pathHandler = path + '/' + file; 

            // Create handler
            const Handler = api.lib.re(pathHandler + '/Handler')(api);
            assert(Handler);
            params = params || {};
            params.route = route;
            params.method = methodName;
            const handler = new Handler(params);
            const foo = handler.handle.bind(handler);

            // Setup access controller
            let access;
            if (accessController) {
                access = accessController.addRoute(pathHandler, methodName, accessFailure);
                console.log(`createHandler, access:${typeof access}`);
            }

            // Setup validator
            let rules;
            const validator = api.lib.re(pathHandler + '/validator');
            console.log(`createHandler, validator:${typeof validator}`);
            if (typeof validator === 'function') {
                rules = validator(api);
            }
            console.log(`createHandler, rules:${typeof rules}`);

            // Setup middleware for router
            const mws = [];
            if (access) mws.push(access);
            if (validator) { mws.push(validator.rules()); mws.push(validator.validate); }

            // Add route
            const methodNameLower = methodName.toLowerCase();
            const routeHandler = router[methodNameLower];
            routeHandler.call(router, route, mws, foo);

           result[methodNameLower] = handler;
        }
    });

    return result;
}

module.exports = function(api) {
    assert(api);
    return {
        createHandler: createHandler.bind(undefined, api)
    };
}

