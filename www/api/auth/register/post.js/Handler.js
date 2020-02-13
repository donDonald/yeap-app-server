'use strict';

const assert = require('assert');

module.exports = function (api) {
    assert(api);

    const passport = require('passport');

    const Handler = function(opts) {
        assert(opts.route);
        assert(opts.method);
        this.route = opts.route;
        this.method = opts.method;
        this._logPrefix = `${this.method}${this.route}`;
    }

    Handler.prototype.peekDeployment = function(deployments, did, cb) {
//      console.log(`${this._logPrefix}.peekDeployment(), did:${did}`);
        deployments.findByDid(did, (err, list)=>{
            if (err) {
                cb(500);
            } else {
                let deployment = list[Object.keys(list)[0]];
                if (deployment) {
                    cb(err, deployment);
                } else {
                    deployments.add(
                        {
                            did: api.model.Deployment.makeId()
                        },
                        (err, deployment)=>{
                            if (err || !deployment) {
//                              console.log(`${this._logPrefix}.peekDeployment, failed creating a new deployment, err: ${err}`);
                                cb(err);
                            } else {
//                              console.log(`${this._logPrefix}.peekDeployment, new deployment has been added, DID:${deployment.did}`);
                                cb(err, deployment);
                            }
                        }
                    );
                }
            }
        });
    }

    Handler.prototype.peekUser = function(authProvider, req, res, cb) {
        const accessToken = req.body.access_token;
//      console.log(`${this._logPrefix}.peekUser(), authProvider:${authProvider}, accessToken:${accessToken}`);

        // Check requested auth provider is here
        const strategy = passport._strategy(authProvider);
        if (!strategy) {
            cb('Unknown auth provider');
            return;
        }

        passport.authenticate(authProvider)(req, res, (err)=>{
//          console.log(`${this._logPrefix}.peekUser, passport.authenticate.err: ${err}`);
//          console.log(`${this._logPrefix}.peekUser, passport.authenticate.user: ${req.user}`);
            // No need to create user here, passport does this thing
            cb(err, req.user);
        });
    }

    Handler.prototype.handle = function(req, res, next) {
//      console.log(`${this._logPrefix}.handle(), did:${req.body.did}, ap:${req.body.ap}, access_token:${req.body.access_token}`);
        const did = req.body.did;
        const ap = req.body.ap;
        const access_token = req.body.access_token;
        const self = this;
        const result = {};

        // Check requested auth provider is here
        const strategy = passport._strategy(ap);
        if (!strategy) {
            return res.sendStatus(500);
        }

        const deployments = req.app.zzz.model.deployments

        // Peek deployment, if not found create a new deployment
        self.peekDeployment(deployments, did, (err, deployment)=>{
            if (err) {
                res.sendStatus(500);
            } else {
                result.did = deployment.did;
                // Peek a user, assign this user a CAT
                self.peekUser(ap, req, res, (err, user)=>{
                    if (err) {
                        res.sendStatus(500);
                    } else {
                        result.cat = user.cat;
//                      console.log(`${this._logPrefix}.handle, SUCCESS, result:`, result);
                        res.status(200).json(result);
                    }
                });
            }
        });
    }

    return Handler;
}

