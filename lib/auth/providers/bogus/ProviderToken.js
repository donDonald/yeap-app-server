'use strict';

const assert = require('assert')
    , passport = require('passport')
    , util = require('util');

module.exports = (api)=>{
    assert(api);

    const strategyName = 'bogus-token';

    const BogusStrategy = function(verify) {
        if (!verify) {
            throw new TypeError('CustomStrategy requires a verify callback');
        }
        passport.Strategy.call(this);
        this.name = strategyName;
        this._verify = verify;
    }
    util.inherits(BogusStrategy, passport.Strategy);

    BogusStrategy.prototype.authenticate = function (req) {
        const self = this;
//      console.log('auth.bogus.BogusStrategy.authenticate(), req:', req);

        function verified(err, user, info) {
            if (err) {
                return self.error(err);
            }
            if (!user) {
                return self.fail(info);
            }
            self.success(user, info);
        }

        try {
            self._verify(req, verified);
        } catch (ex) {
            return self.error(ex);
        }
    }

    const Provider = function (container, Constructor) {
        this.name = strategyName;
        this.logName = `[${this.name}]`;

        const collectUser = this.collectUser.bind(this);
        const userHandler = new api.lib.auth.UserHandler(this, container, collectUser, Constructor);
        this.handleUser = userHandler.handle.bind(userHandler);

        passport.use(
            new BogusStrategy(
                (req, cb)=>{
//                  console.log('auth.bogus.Provider.BogusStrategy.handler, req:', req);

                    if ('string' !== typeof req.body.access_token) {
                        return cb('No access token presenting');
                    }

                    const accessToken = JSON.parse(req.body.access_token);
                    if ('string' !== typeof accessToken.id ||
                        'string' !== typeof accessToken.displayName ||
                        'string' !== typeof accessToken.thumbnail) {
                        return cb('Invalid access token');
                    }
                    const profile = accessToken;

                    this.handleUser(undefined, undefined, profile, cb);
                }
            )
        );
    }

    // Profile info is auth service specific, lets collect user here
    Provider.prototype.collectUser = function(profile) {
//      console.log('auth.bogus.Provider.collectUser(), profile:', profile);
        const user = {
            // Mandatory
            authProviderRawString: JSON.stringify(profile),
            authProviderName:      this.name,
            authProviderId:        profile.id.toString(),
            displayName:           profile.displayName,
            thumbnail:             profile.thumbnail,
        };
//      console.log(`${this.logName}: auth.${this.name}.ProviderToken.collectUser, user:`, user);
        return user;
    }

    return Provider;
}

