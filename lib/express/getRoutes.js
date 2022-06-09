'use strict';

const assert = require('assert');

// https://stackoverflow.com/questions/14934452/how-to-get-all-registered-routes-in-express/49152014#49152014
// getRoutes(app._router && app._router.stack);
// =>
// [
//     [ 'GET', '/'], 
//     [ 'POST', '/auth'],
//     ...
// ]

/**
* Converts Express 4 app routes to an array representation suitable for easy parsing.
* @arg {Array} stack An Express 4 application middleware list.
* @returns {Array} An array representation of the routes in the form [ [ 'GET', '/path' ], ... ].
*/
function getRoutes(stack) {
        const routes = (stack || [])
                // We are interested only in endpoints and router middleware.
                .filter(it => it.route || it.name === 'router')
                // The magic recursive conversion.
                .reduce((result, it) => {
                        if (! it.route) {
                                // We are handling a router middleware.
                                const stack = it.handle.stack
                                const routes = getRoutes(stack)

                                return result.concat(routes)
                        }

                        // We are handling an endpoint.
                        const methods = it.route.methods
                        const path = it.route.path

                        const routes = Object
                                .keys(methods)
                                .map(m => [ m.toUpperCase(), path ])

                        return result.concat(routes)
                }, [])
                // We sort the data structure by route path.
                .sort((prev, next) => {
                        const [ prevMethod, prevPath ] = prev
                        const [ nextMethod, nextPath ] = next

                        if (prevPath < nextPath) {
                                return -1
                        }

                        if (prevPath > nextPath) {
                                return 1
                        }

                        return 0
                })

        return routes
}

module.exports = function (api) {
    return (app)=>{
        //console.log('######################.1, amount of routes:' + app._router.stack.length);
        const routes = getRoutes(app._router && app._router.stack);
//      console.log(routes);
        return routes;
        

//      console.log('######################.2, amount of routes:' + app._router.stack.length);
//      app._router.stack.forEach((r, index)=>{
//          console.log('        GGGGGGGGGGG[' + index + ']:');
//          console.log(r);
//      });
    }
}

