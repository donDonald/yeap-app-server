'use strict';

const assert = require('assert'),
      Rbac = require('fast-rbac').default;

module.exports = (api)=>{
    assert(api);

    const AccessController = function() {
        this._impl = new Rbac();
    }

    AccessController._GUESTS = 'guests';
    AccessController._DEFAULT_ROLES = {'guests':'guests'};



    AccessController.prototype.addRoute = function(path, operaton, failure) {
        const access = api.lib.re(path + '/access');
    //  console.log(`lib.AccessController.addRoute, path:${path}, access:${JSON.stringify(access)}`);
        if (access) {
            const elements = path.split('/');
            elements.shift(); // remove routes
            elements.splice(-1,1); //Remove last element like get.js for instance
            const route = '/' + elements.join('/');
            return  this.createAuthHandler(access, route, operaton, failure);
        } else {
            return undefined;
        }
    }



    AccessController.prototype.addRoles = function(access, resource, operation) {
    //  console.log(`lib.AccessController.addRoles(), access:${access}, resource:${resource}, operation:${operation}`);
        if (access.groups) {
            for (const role of access.groups) {
                this.add(role, resource, operation);
            }
        }
        if (access.guests === true) {
            this.add(AccessController._GUESTS, resource, operation);
        }
    }



    AccessController.prototype.add = function(role, resource, operation) {
    //  console.log(`lib.AccessController.add(), role:${role}, resource:${resource}, operation:${operation}`);
        this._impl.add(role, resource, operation);
    }



    AccessController.prototype.can = function(roles, resource, operation) {
    //  console.log(`lib.AccessController.can(), roles:${JSON.stringify(roles)}, resource:${resource}, operation:${operation}`);
        let can = false;
        for (const role in roles) {
    //      console.log(`lib.AccessController.can(), role:${role}`);
            can = this._impl.can(role, resource, operation);
            if (can) break;
        }
    //  console.log(`lib.AccessController.can, can:${can}`);
        return can;
    }



    AccessController.prototype.authCheck = function(access, resource, operation, failure, req, res, next) {
    //  console.log('authCheck(), req:', req);
    //  console.log('authCheck, access:', access);
    //  console.log('authCheck, access.roles:', access.groups);
    //  console.log('authCheck, resource:', resource);
    //  console.log('authCheck, operation:', operation);

        {
            //  example:
            //  access has no groups or groups are empty
            //  access guests is false
            //  in this case can retunrs false althoug it shall be true, i.e. any authenticatd user is allowed here
            if ((!access.groups || access.groups.length === 0) && req.user) {
                return next();
            }
        }

        const rolesReq = req.user ? req.user.groups : AccessController._DEFAULT_ROLES;
        const resourceReq = req.baseUrl + req._parsedUrl.pathname;
        const operationReq = req.method;
    //  console.log('authCheck, resource:', resourceReq);
    //  console.log('authCheck, roles:', rolesReq);
    //  console.log('authCheck, operation:', operationReq);
        if (this.can(rolesReq, resourceReq, operationReq)) {
            return next();
        }
        return failure(req, res);
    }

    AccessController.prototype.createAuthHandler = function(access, resource, operation, failure) {
    //  console.log(`lib.AccessController.createAuthHandlers(), access:${access}, resource:${resource}, operation:${operation}`);
        this.addRoles(access, resource, operation);
        return this.authCheck.bind(this, access, resource, operation, failure);
    }

    return AccessController;
}

