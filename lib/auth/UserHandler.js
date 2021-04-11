'use strict';

const assert = require('assert');

module.exports = (api)=>{
    assert(api);

    const UserHandler = function(provider, container, collectUserFoo, Constructor) {
//      console.log('auth.UserHandler, container:', container);
        this.provider = provider;
        this.container = container;
        this.collectUserFoo = collectUserFoo;
        this.Constructor = Constructor;
    }

    UserHandler.prototype.handle = function (accessToken, refreshToken, profile, cb) {
        const self = this;
//      console.log(self.provider.logName + ', auth.HandleUser.handle(), profile:', profile);

        // check if user already exist
//      const key = {};
//      key.authProviderId = profile.id;
        const params = {where:{}};
        const profileId = profile.id.toString();
        params.where[this.Constructor.dbKeys.authProviderId] = profileId;
        self.container.query(params, (err, users)=>{
            if (err) {
                cb(err);
            } else {
                let user;
                const keys = Object.keys(users);
                if (keys.length > 0) {
                    user = users[keys[0]];
                }
                if (user) {
                    // already have the user
//                  console.log(self.provider.logName + ', auth.HandleUser.handle, EXISTING user:', user);
                    cb(undefined, user); // Shall trigger passport.serializeUser
                } else {
                    // new user
                    user = self.collectUserFoo(profile);
                    user.uid = this.Constructor.makeId(); // Assign ID
                    user.cat = this.Constructor.makeCat(); // Make a cat to let user login

                    self.container.add(user, (err, user)=>{
//                      console.log(self.provider.logName + ', auth.HandleUser.handle, NEW user:', user);
                        cb(err, user); // Shall trigger passport.serializeUser
                    });
                }
            }

        });
    }

    return UserHandler;
}

