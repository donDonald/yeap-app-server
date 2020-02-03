'use strict';

const assert = require('assert');

//  const accessCtrl = app.zzz.accessController.addRoute('routes/api/groups/add', 'POST', failure);
//  const validator = re('lib/tools/validators/gid.js')(api);
//  const Method = re('routes/api/groups/add/Post')(api);
//  groups.add = {};
//  groups.add.post = new Method({router:router, accessCtrl:accessCtrl, validator:validator, groups:model.groups});


const HANDLERS = {'get.js':'GET', 'post.js':'POST', 'delete.js':'DELETE', 'put.js':'PUT'};

const collectFolders = function(api, path, routes) {
//  console.log(`collectFolders(), path:${path}`);

    const fullPath = api.lib.env.makePath(path);
    let files;
    try {
        files = api.fs.readdirSync(fullPath);
//      console.log('collectFolders, files:', files);
    } catch(e) {
        return;
    }

    files.forEach((file)=>{
        const handler = HANDLERS[file];
        if (handler) {
            routes.push({path:path});
//          console.log('collectFolders, route is found:', (path + '/'+ file));
        }
        collectFolders(api, path + '/' + file, routes);
    });
}

const collectMethods = function(api, path, methods) {
//  console.log(`collectMethods(), path:${path}`);

    const fullPath = api.lib.env.makePath(path);
    let files;
    try {
        files = api.fs.readdirSync(fullPath);
//      console.log('collectMethods, files:', files);
    } catch(e) {
        return;
    }

    files.forEach((file)=>{
        const method = HANDLERS[file];
        if (method) {
            methods.push({name:method, dir:file});

            let props;
            try {
                props = api.fs.readdirSync(path + '/' + file);
        //      console.log('collectMethods, files:', files);
            } catch(e) {
                return;
            }

//          console.log('collectMethods, route is found:', (path + '/'+ file));
        }
        collectMethods(api, path + '/' + file, methods);
    });
}

const loadRoutes = function(api, router, path, accessController, accessFailure, params) {
    console.log(`loadRoutes(), path:${path}`);
    const folders = [];
    collectFolders(api, path, folders);
//  console.log('loadRoutes, collected folders:');
//  folders.forEach((f, index)=>{console.log(`    folder[${index}]:${f}`);});

    console.log('0!!!!!!loadRoutes, collected folders:');
    folders.forEach((f, index)=>{
//      console.log(`1!!!!!!    `, f);
        console.log(`1!!!!!!    path:${f.path}`);
        let methods = [];
        collectMethods(api, f.path, methods);
        f.methods = methods;
//      console.log(`2!!!!!!    `, f);
        console.log(`2!!!!!!    methods:`, f.methods);
//      f.methods.forEach((m, index)=>{
//      });
    });

console.log('!!!!!!!');
console.log('!!!!!!!');
console.log('!!!!!!!');
console.log(folders);

//  routes.forEach((route)=>{
//      createMethod(api, router, route, accessController, accessFailure, params);
//  });
}

const createMethod = function(api, router, path, accessController, accessFailure, params) {
    const fullPath = api.lib.env.makePath(path);
    let route, method;
    {
        const elements = path.split('/');
        method = elements[elements.length-1];
        elements.shift(); // remove routes
        elements.splice(-1,1); // remove method
        route = '/' + elements.join('/');
        method = HANDLERS[method];
    }
    console.log(`createMethod(), path:${path}, route:${route}, method:${method}`);

    // Create handler
    const Handler = api.lib.re(path + '/Handler')(api);
    assert(Handler);
    params = params || {};
    params.route = route;
    params.method = method;
    const handler = new Handler(params);
    const foo = handler.handle.bind(handler);

    const mws = [];

    // Setup access controller
    let access;
    if (accessController) {
        access = accessController.addRoute(path, method, accessFailure);
        console.log(`createMethod, access:${typeof access}`);
        if (access) mws.push(access);
    }

    // Setup validator
    const validator = api.lib.re(path + '/validator');
    console.log(`createMethod, validator:${typeof validator}`);
    if (typeof validator === 'function') {
        const rules = validator(api);
        console.log(`createMethod, rules:${typeof rules}`);
        if (rules )mws.push(validator.rules()); mws.push(validator.validate);
    }

    // Add route
    const methodLower = method.toLowerCase();
    const routeHandler = router[methodLower];
console.log('AAAAAAAAAAAAA');
    console.log(`createMethod, new handler is ready:`);
    console.log(`    method:${handler.method}`);
    console.log(`    route:${handler.route}`);
    console.log(`    access:`, access);
    console.log(`    validator:`, validator);
console.log('BBBBBBBBBBBBB');

    console.log(`createMethod, new handler is ready, route:${method}|${handler.method}, route:${route}|${handler.route}`);
    routeHandler.call(router, route, mws, foo);
}

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
        createHandler: createHandler.bind(undefined, api),
        loadRoutes: loadRoutes.bind(undefined, api)
    };
}

