'use strict';

describe('lib.auth.providers.bogus.ProviderToken', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../../' + module); }
    const createDbName=(name)=>{ return re('db/tools').createDbName('lib_auth_bogus_provider_token_') + name };

    let api, masterDbProps, dbProps;



    // Database record
    let User = function (props) {
        if (props.uid) this.uid = props.uid;
        if (props.cat) this.uid = props.cat;

        const displayName = props.displayName || props[User.dbKeys.displayName];
        if (displayName) this.displayName = displayName;

        if (props.thumbnail) this.thumbnail = props.thumbnail;

        const authProviderName = props.authProviderName || props[User.dbKeys.authProviderName];
        if (authProviderName) this.authProviderName = authProviderName;

        const authProviderId = props.authProviderId || props[User.dbKeys.authProviderId];
        if (authProviderId) this.authProviderId = authProviderId;

        const authProviderRawString = props.authProviderRawString || props[User.dbKeys.authProviderRawString];
        if (authProviderRawString) this.authProviderRawString = authProviderRawString;

        if (props.stts) this.stts = props.stts;
    }

    // \brief These keys are mant for mapping JS fileds to DB fields.
    //        Postgresql doesn't support camel-case notation.
    User.dbKeys = {};
    User.dbKeys.uid = 'uid';
    User.dbKeys.cat = 'cat';

    User.dbKeys.displayName = 'display_name';
    User.dbKeys.thumbnail = 'thumbnail';
    User.dbKeys.authProviderName = 'auth_provider_name';
    User.dbKeys.authProviderId = 'auth_provider_id';
    User.dbKeys.authProviderRawString  = 'auth_provider_raw';

    User.dbKeys.stts = 'stts';
    User.dbKeysArray = Object.values(User.dbKeys);

    // Database schema
    const schema =
    'CREATE TABLE IF NOT EXISTS users ( \
        uid                   CHAR(32) PRIMARY KEY, \
        cat                   CHAR(32), \
        display_name          VARCHAR (100) NOT NULL, \
        thumbnail             VARCHAR (256) NOT NULL, \
        auth_provider_name    VARCHAR (100) NOT NULL, \
        auth_provider_id      VARCHAR (100) NOT NULL, \
        auth_provider_raw     VARCHAR (4096) NOT NULL, \
        stindex               SERIAL, \
        stts                  TIMESTAMP NOT NULL DEFAULT NOW() \
    ); \
     \
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uid ON users (uid); \
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stts ON users (stts);'



    before(()=>{
        api = {};
        api.fs = require('fs');
        api.lib = {};
        api.lib.db = {};
        api.lib.db.tools = re('db/tools');
        api.lib.db.DbPool = re('db/DbPool')(api);
        api.lib.Md5 = re('Md5')(api);
        api.lib.makeId = re('makeId')(api);
        api.lib.model = {};
        api.lib.model.helpers = {};
        api.lib.model.helpers.add = re('model/helpers/add');
        api.lib.model.helpers.delete = re('model/helpers/delete');
        api.lib.model.helpers.count = re('model/helpers/count');
        api.lib.model.helpers.query = re('model/helpers/query');
        api.lib.auth = {};
        api.lib.auth.UserHandler = re('auth/UserHandler')(api);
        api.lib.auth.providers = {};
        api.lib.auth.providers.bogus = {};
        api.lib.auth.providers.bogus.ProviderToken = re('auth/providers/bogus/ProviderToken')(api);

        // Database record
        User.makeId = api.lib.makeId;
        User.makeCat = api.lib.makeId;

        masterDbProps = api.lib.db.tools.masterDbProps;
        dbProps = JSON.parse(JSON.stringify(masterDbProps));
    });

    describe('#Provider.collectUser()', ()=>{
        it('collect user', ()=>{
            const provider = new api.lib.auth.providers.bogus.ProviderToken({});
            const profile = {
                id: 'someId',
                displayName: 'somename',
                thumbnail: 'user.png',
            };
            const user = provider.collectUser(profile);
            assert(user);
            assert.equal(5, Object.keys(user).length);
            assert.equal(JSON.stringify(profile), user.authProviderRawString);
            assert.equal('bogus-token', user.authProviderName);
            assert.equal(profile.id, user.authProviderId);
            assert.equal(profile.displayName, user.displayName);
            assert.equal('user.png', user.thumbnail);
        });
    });

    describe('#Provider.handleUser()', ()=>{

        before((done)=>{
            dbProps.database = createDbName('handleuser');
            api.lib.db.tools.create(
                masterDbProps,
                dbProps.database,
                (err)=>{
                    assert(!err, err);
                    done();
                }
            );
        });

        after((done)=>{
            users.dbc.end(done);
        });

        let users;
        it('Create Users container', (done)=>{
            const Users = function(dbProps) {
                this.dbc = new api.lib.db.DbPool(dbProps);
                this.tableName = 'users';
                this.add = api.lib.model.helpers.add.bind(this, this.dbc, this.tableName, User);
                this.count = api.lib.model.helpers.count.bind(this, this.dbc, this.tableName);
                this.inserter = function(values, value)
                {
                    if (!values) {
                        return [];
                    }
                    values.push(value);
                    return values;
                }
                this.query = api.lib.model.helpers.query.run.bind(this, this.dbc, this.tableName, User, this.inserter);
            }

            Users.construct = function (dbProps, cb) {
                let users = new Users(dbProps);
                users.init((err)=>{
                    if (err) {
                        users = undefined;
                    }
                    cb(err, users);
                });
            }

            Users.prototype.init = function(cb) {
                api.lib.db.tools.querySqls(this.dbc, [schema], (err)=>{
                    cb(err);
                });
            }

            Users.construct(dbProps, (err, u)=>{
                assert(!err, err);
                users = u;
                assert(users);
                done();
            });
        });

        let provider;
        it('Create Provider', ()=>{
            provider = new api.lib.auth.providers.bogus.ProviderToken(users, User);
            assert.equal('bogus-token', provider.name);
            assert.equal('[bogus-token]', provider.logName);
            assert(provider.handleUser);
        });

        it('Count Users, shall be 0', (done)=>{
            users.count((err, count)=>{
                assert(!err, err);
                assert.equal(0, count);
                done();
            });
        });

        const profileIvan = {
            id: 'Ivan123',
            displayName: 'Ivan',
            thumbnail: 'Ivan.png',
        };
        it('Provider.handleUser, new Ivan', (done)=>{
            provider.handleUser(
                'accessToken',
                'refreshToken',
                profileIvan,
                (err, user)=>{
                    assert(!err, err);
                    assert(user);
                    done();
                }
            );
        });

        it('Count Users, shall be 1', (done)=>{
            users.count((err, count)=>{
                assert(!err, err);
                assert.equal(1, count);
                done();
            });
        });

        it('Find Ivan', (done)=>{
            const params = {where:{}};
            params.where[User.dbKeys.authProviderId] = profileIvan.id;
            users.query(params, (err, user)=>{
                assert(!err, err);
                assert(user);
                user = user[Object.keys(user)[0]];
                assert.equal('bogus-token', user.authProviderName);
                assert.equal('Ivan', user.displayName);
                assert.equal('Ivan.png', user.thumbnail);
                assert.equal(profileIvan.id, user.authProviderId);
                assert.equal(JSON.stringify(profileIvan), user.authProviderRawString);
                done();
            });
        });

        it('Provider.handleUser, existing Ivan', (done)=>{
            provider.handleUser(
                'accessToken',
                'refreshToken',
                profileIvan,
                (err, user)=>{
                    assert(!err, err);
                    assert(user);
                    done();
                }
            );
        });

        it('Count Users, shall be 1', (done)=>{
            users.count((err, count)=>{
                assert(!err, err);
                assert.equal(1, count);
                done();
            });
        });

        it('Find Ivan', (done)=>{
            const params = {where:{}};
            params.where[User.dbKeys.authProviderId] = profileIvan.id;
            users.query(params, (err, user)=>{
                assert(!err, err);
                assert(user);
                user = user[Object.keys(user)[0]];
                assert.equal('bogus-token', user.authProviderName);
                assert.equal('Ivan', user.displayName);
                assert.equal('Ivan.png', user.thumbnail);
                assert.equal(profileIvan.id, user.authProviderId);
                assert.equal(JSON.stringify(profileIvan), user.authProviderRawString);
                done();
            });
        });

    });

});

