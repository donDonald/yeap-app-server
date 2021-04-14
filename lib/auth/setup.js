'use strict';

const assert = require('assert')
    , passport = require('passport');

module.exports = (api, users)=>{

    passport.serializeUser((user, done)=>{
//      console.log('passport.serializeUser(), user:', user);
        done(undefined, user.uid);
    });

    passport.deserializeUser((uid, done)=>{
//      console.log('passport.deserializeUser(), uid:' + uid);
        users.collectUser(uid, (err, user)=>{
            if (err) {
                done(err);
            } else {
                if(!user || !user) err = 'No user ' + uid + ' is found. Since users are stored in ram, this error might happen if server was restarted. Cleanup your localhost cookie.';
                done(err, user);
            }
        });
    });

    return passport;
}

