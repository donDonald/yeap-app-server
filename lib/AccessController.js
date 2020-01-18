'use strict';

const assert = require('assert');
const Rbac = require('fast-rbac').default;

module.exports = function(api) {
    assert(api);

    const AccessController = function() {
        this._impl = new Rbac();
    }

    AccessController.GUESTS = 'guests';
    AccessController._DEFAULT_ROLES = {'guests':'guests'};

    AccessController.prototype.addRoles = function(access, resource, operation) {
        console.log(`lib.AccessController.addRoles(), access:${access}, resource:${resource}, operation:${operation}`);
        for (const role of access.groups) {
            this.add(role, resource, operation);
        }
        if (access.guests === true) {
            this.add(AccessController.GUESTS, resource, operation);
        }
    }

    AccessController.prototype.add = function(role, resource, operation) {
        console.log(`lib.AccessController.add(), role:${role}, resource:${resource}, operation:${operation}`);
        this._impl.add(role, resource, operation);
    }

    AccessController.prototype.can = function(roles, resource, operation) {
        console.log(`lib.AccessController.can(), roles:${JSON.stringify(roles)}, resource:${resource}, operation:${operation}`);
        let can = false;
        for (const role in roles) {
            console.log(`lib.AccessController.can(), role:${role}`);
            can = this._impl.can(role, resource, operation);
            if (can) break;
        }
        console.log(`lib.AccessController.can, can:${can}`);
        return can;
    }

    AccessController.prototype.authCheck = function(access, resource, operation, failure, req, res, next) {
//      console.log('authCheck(), req:', req);
//      console.log('authCheck, roles:', access.groups);
//      console.log('authCheck, resource:', resource);
//      console.log('authCheck, operation:', operation);
        const rolesReq = req.user ? req.user.groups : AccessController._DEFAULT_ROLES;
        const resourceReq = req.baseUrl + req._parsedUrl.pathname;
        const operationReq = req.method;
//      console.log('authCheck, rolesReq:', rolesReq);
//      console.log('authCheck, resourceReq:', resourceReq);
//      console.log('authCheck, operationReq:', operationReq);
        if (this.can(rolesReq, resourceReq, operationReq)) {
            return next();
        }
        return failure(req, res);
    }

    AccessController.prototype.createAuthHandler = function(access, resource, operation, failure) {
        console.log(`lib.AccessController.createAuthHandlers(), access:${access}, resource:${resource}, operation:${operation}`);
        this.addRoles(access, resource, operation);
        return this.authCheck.bind(this, access, resource, operation, failure);
    }


    return AccessController;
}

