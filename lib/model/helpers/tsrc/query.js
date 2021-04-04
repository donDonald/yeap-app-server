'use strict';

describe('lib.model.helpers.query', ()=>{

    const assert = require('assert');
    const re = (module)=>{ return require('../../../' + module); }
    const createDbName=(name)=>{ return re('db/tools').createDbName('lib_model_helpers_query_') + name };

    let masterDbProps, dbProps;
    let api, query;

    // Database record
    let Record = function (props) {
        if (props.uid) this.uid = props.uid;
        if (props.name) this.name = props.name;
        if (props.address) this.address = props.address;
        if (props.email) this.email = props.email;
        if (props.stts) this.stts = props.stts;
    }

    // \brief These keys are mant for mapping JS fileds to DB fields.
    //        Postgresql doesn't support camel-case notation.
    Record.dbKeys = {};
    Record.dbKeys.uid = 'uid';
    Record.dbKeys.name = 'name';
    Record.dbKeys.address = 'address';
    Record.dbKeys.email = 'email';
    Record.dbKeys.stts = 'stts';
    Record.dbKeysArray = Object.values(Record.dbKeys);

    // Database schema
    const schema = 
    'CREATE TABLE IF NOT EXISTS records ( \
        uid                   CHAR(32) PRIMARY KEY, \
        name                  VARCHAR (100) NOT NULL, \
        address               VARCHAR (100) NOT NULL, \
        email                 VARCHAR (100) NOT NULL, \
        stindex               SERIAL, \
        stts                  TIMESTAMP NOT NULL DEFAULT NOW() \
    ); \
     \
    CREATE UNIQUE INDEX IF NOT EXISTS idx_records_uid ON records (uid); \
    CREATE UNIQUE INDEX IF NOT EXISTS idx_records_stts ON records (stts);'

    before(()=>{
        api = {};
        api.fs = require('fs')
        api.lib = {};
        api.lib.db = {};
        api.lib.db.tools = re('db/tools');
        api.lib.Md5 = re('Md5')(api);
        api.lib.types = re('types')(api);
        api.lib.makeId = re('makeId')(api);
        api.model = {};
        api.model.helpers = {};
        api.model.helpers.count = re('model/helpers/count');
        api.model.helpers.add = re('model/helpers/add');

        masterDbProps = api.lib.db.tools.masterDbProps;
        dbProps = JSON.parse(JSON.stringify(masterDbProps));

        query = re('model/helpers/query');

        // Database record
        Record.makeId = api.lib.makeId;
    });

    describe('query.makeColumns', ()=>{
        it('undefined', ()=>{
            const result = query.makeColumns();
            assert.equal('*', result);
        });

        it('key1, key2', ()=>{
            const result = query.makeColumns('key1, key2');
            assert.equal('key1, key2', result);
        });

        it('["name:]', ()=>{
            const keys = ['name'];
            const result = query.makeColumns(keys);
            assert.equal('name', result);
        });

        it('["name", "age"]', ()=>{
            const keys = ['name', 'age'];
            const result = query.makeColumns(keys);
            assert.equal('name,age', result);
        });
    });

    describe('query.makeWhere', ()=>{
        it('undefined', ()=>{
            const result = query.makeWhere();
            assert.equal('', result);
        });

        it('name = "Pablo"', ()=>{
            const result = query.makeWhere('name = "Pablo"');
            assert.equal(' WHERE name = "Pablo"', result);
        });

        it('{}', ()=>{
            const result = query.makeWhere({});
            assert.equal('', result);
        });

        it('{name: \'Pablo\'}', ()=>{
            const result = query.makeWhere({name:'Pablo'});
            assert.equal(' WHERE name=\'Pablo\'', result);
        });

        it('{name: \'Pabl*\'"}', ()=>{
            const result = query.makeWhere({name:'Pabl*'});
            assert.equal(' WHERE name LIKE \'Pabl_\'', result);
        });

        it('{name: \'*ablo\'}', ()=>{
            const result = query.makeWhere({name:'*ablo'});
            assert.equal(' WHERE name LIKE \'_ablo\'', result);
        });

        it('{name: \'**blo\'}', ()=>{
            const result = query.makeWhere({name:'**blo'});
            assert.equal(' WHERE name LIKE \'%blo\'', result);
        });

        it('{name: \'*abl*\'}', ()=>{
            const result = query.makeWhere({name:'*abl*'});
            assert.equal(' WHERE name LIKE \'_abl_\'', result);
        });

        it('{name: \'**b**\'}', ()=>{
            const result = query.makeWhere({name:'**b**'});
            assert.equal(' WHERE name LIKE \'%b%\'', result);
        });

        it('{name: \'P**l**\'}', ()=>{
            const result = query.makeWhere({name:'P**l**'});
            assert.equal(' WHERE name LIKE \'P%l%\'', result);
        });

        it('{name: \'Pablo\', surname:\'Ivanov\'}', ()=>{
            const result = query.makeWhere({name: 'Pablo', surname:'Ivanov'});
            assert.equal(' WHERE name=\'Pablo\' AND surname=\'Ivanov\'', result);
        });

        it('{name: \'Pablo\', surname:\'Ivano*\'', ()=>{
            const result = query.makeWhere({name: 'Pablo', surname:'Ivano*'});
            assert.equal(' WHERE name=\'Pablo\' AND surname LIKE \'Ivano_\'', result);
        });

        it('{name: \'Pablo\', surname:\'Ivan**\'}', ()=>{
            const result = query.makeWhere({name: 'Pablo', surname:'Ivan**'});
            assert.equal(' WHERE name=\'Pablo\' AND surname LIKE \'Ivan%\'', result);
        });

        it('{name: \'Pablo\', surname:\'**\'}', ()=>{
            const result = query.makeWhere({name: 'Pablo', surname:'**'});
            assert.equal(' WHERE name=\'Pablo\' AND surname LIKE \'%\'', result);
        });
    });

    describe('query.makePositionStatement', ()=>{
        it('undefined', ()=>{
            const result = query.makePositionStatement();
            assert.equal('', result);
        });

        it(' LIMIT 100', ()=>{
            const result = query.makePositionStatement({count:100});
            assert.equal(' LIMIT 100', result);
        });

        it(' OFFSET 0', ()=>{
            const result = query.makePositionStatement({offset:0});
            assert.equal(' OFFSET 0', result);
        });

        it(' LIMIT 100 OFFSET 1000', ()=>{
            const result = query.makePositionStatement({count:100, offset:1000});
            assert.equal(' LIMIT 100 OFFSET 1000', result);
        });
    });

    describe('query.makePositionStatement', ()=>{
        it('undefined', ()=>{
            const result = query.makeOrderStatement();
            assert.equal('', result);
        });

        it(' ORDER BY name', ()=>{
            const result = query.makeOrderStatement({by:'name'});
            assert.equal(' ORDER BY name', result);
        });

        it(' ORDER BY name ASC', ()=>{
            const result = query.makeOrderStatement({by:'name', direction:'ASC'});
            assert.equal(' ORDER BY name ASC', result);
        });

        it(' ORDER BY name DESC', ()=>{
            const result = query.makeOrderStatement({by:'name', direction:'DESC'});
            assert.equal(' ORDER BY name DESC', result);
        });
    });

    describe('query.makeQuery', ()=>{
        it('SELECT * from users', ()=>{
            const opts = {
            };
            const q = query.makeQuery('users', opts);
            assert.equal('SELECT * FROM users', q);
        });

        it('SELECT name,surname from users', ()=>{
            const opts = {
                keys:['name', 'surname'],
            };
            const q = query.makeQuery('users', opts);
            assert.equal('SELECT name,surname FROM users', q);
        });

        it('SELECT name,surname from users WHERE name=\'Natalia\'', ()=>{
            const opts = {
                keys:['name', 'surname'],
                where:{name: 'Natalia'},
            };
            const q = query.makeQuery('users', opts);
            assert.equal('SELECT name,surname FROM users WHERE name=\'Natalia\'', q);
        });

        it('SELECT name,surname from users WHERE name=\'Natalia\' AND surname LIKE \'Za%\'', ()=>{
            const opts = {
                keys:['name', 'surname'],
                where:{name: 'Natalia', surname: 'Za**'},
            };
            const q = query.makeQuery('users', opts);
            assert.equal('SELECT name,surname FROM users WHERE name=\'Natalia\' AND surname LIKE \'Za%\'', q);
        });

        it('SELECT name,surname from users WHERE name=\'Natalia\' AND surname LIKE \'Za%\' LIMIT 100 OFFSET 0', ()=>{
            const opts = {
                keys: ['name', 'surname'],
                where: {name: 'Natalia', surname: 'Za**'},
                position: {count:100, offset:0}
            };
            const q = query.makeQuery('users', opts);
            assert.equal('SELECT name,surname FROM users WHERE name=\'Natalia\' AND surname LIKE \'Za%\' LIMIT 100 OFFSET 0', q);
        });

        it('SELECT name,surname from users WHERE name=\'Natalia\' AND surname LIKE \'Za%\' LIMIT 100 OFFSET 0 ORDER BY name', ()=>{
            const opts = {
                keys: ['name', 'surname'],
                where: {name: 'Natalia', surname: 'Za**'},
                position: {count:100, offset:0},
                order: {by:'name'}
            };
            const q = query.makeQuery('users', opts);
            assert.equal('SELECT name,surname FROM users WHERE name=\'Natalia\' AND surname LIKE \'Za%\' ORDER BY name LIMIT 100 OFFSET 0', q);
        });
    });

    describe('query.run', ()=>{
        let dbc, dbCount, dbAdd;

        const addSome = function(index, count, add, cb) {
            if (index<count) {
                add(
                    {
                        uid:                   api.lib.makeId(),
                        name:                  'Name-'+ index,
                        address:               'address-'+ index,
                        email:                 'email-'+ index
                    },
                    (err, record)=>{
    //                  console.log('err:', err);
    //                  console.log('record:', record);
                        assert(!err, err);
                        assert(record);
                        addSome(index+1, count, add, cb);
                    }
                );
            } else {
                cb();
            }
        }


        before((done)=>{
            dbProps.database = createDbName('run');
            api.lib.db.tools.create(
                masterDbProps,
                dbProps.database,
                (err)=>{
                    assert(!err, err);
                    api.lib.db.tools.connect(dbProps, (err, result)=>{
                        assert(!err, err);
                        dbc = result;
                        dbCount = api.model.helpers.count.bind(undefined, dbc, 'records');
                        dbAdd = api.model.helpers.add.bind(undefined, dbc, 'records', Record);
                        api.lib.db.tools.querySqls(dbc, [schema], (err)=>{
                            assert(!err, err);
                            done();
                        });
                    });
                }
            );
        });

        after((done)=>{
            dbc.end(done);
        });

        const inserter = function(values, value)
        {
            if (!values) {
                return [];
            }
            values.push(value);
            return values;
        }

        it('SELECT * FROM records', (done)=>{
            const opts = {
            };
            query.run(dbc, 'records', Record, inserter, opts, (err, elements)=>{
                assert(!err, err);
                assert(elements);
                assert.equal(0, elements.length);
                done();
            });
        });

        it('model.helpers.count', (done)=>{
            dbCount((err, count)=>{
                assert(!err, err);
                assert.equal(0, count);
                done();
            });
        });

        it('insert 30 records', (done)=>{
            addSome(0, 30, dbAdd, ()=>{
                done();
            });
        });

        it('model.helpers.count', (done)=>{
            dbCount((err, count)=>{
                assert(!err, err);
                assert.equal(30, count);
                done();
            });
        });

        it('SELECT * FROM records', (done)=>{
            const opts = {
            };
            query.run(dbc, 'records', Record, inserter, opts, (err, elements)=>{
                assert(!err, err);
                assert(elements);
//              console.log('res:', elements);
                assert.equal(30, elements.length);
                const keys = Object.keys(Record.dbKeys);
                elements.forEach((e, index)=>{
                    keys.forEach((k)=>{
                        assert(typeof e[k] !== 'undefined', 'missing key:' + k);
                    });
                });
                done();
            });
        });

        it('SELECT email FROM records', (done)=>{
            const opts = {
                keys: [Record.dbKeys.email],
            };
            query.run(dbc, 'records', Record, inserter, opts, (err, elements)=>{
                assert(!err, err);
                assert(elements);
//              console.log('res:', elements);
                assert.equal(query.q, 'SELECT email FROM records');
                assert.equal(30, elements.length);
                elements.forEach((e, index)=>{
                    assert.equal(1, Object.keys(e).length);
                    assert(e.email);
                });
                done();
            });
        });

        it('SELECT name FROM records WHERE name=\'Name-10\'', (done)=>{
            const opts = {
                keys: [Record.dbKeys.name],
                where: {},
            };
            opts.where[Record.dbKeys.name] = 'Name-10';

            query.run(dbc, 'records', Record, inserter, opts, (err, elements)=>{
                assert(!err, err);
                assert(elements);
//              console.log('res:', elements);
                assert.equal(query.q, 'SELECT name FROM records WHERE name=\'Name-10\'');
                assert.equal(1, elements.length);
                const e = elements[0];
                assert.equal(1, Object.keys(e).length);
                assert.equal(e.name, 'Name-10');
                done();
            });
        });

        it('SELECT name FROM records WHERE name LIKE \'Name-1_\'', (done)=>{
            const opts = {
                keys: [Record.dbKeys.name],
                where: {},
            };
            opts.where[Record.dbKeys.name] = 'Name-1*';

            query.run(dbc, 'records', Record, inserter, opts, (err, elements)=>{
                assert(!err, err);
                assert(elements);
//              console.log('res:', elements);
                assert.equal(query.q, 'SELECT name FROM records WHERE name LIKE \'Name-1_\'');
                assert.equal(10, elements.length);
                elements.forEach((e, index)=>{
                    assert.equal(1, Object.keys(e).length);
                    assert.equal(e.name, 'Name-1'+index);
                });
                done();
            });
        });

        it('SELECT name FROM records WHERE name LIKE \'Name-%\'', (done)=>{
            const opts = {
                keys: [Record.dbKeys.name],
                where: {},
            };
            opts.where[Record.dbKeys.name] = 'Name-**';

            query.run(dbc, 'records', Record, inserter, opts, (err, elements)=>{
                assert(!err, err);
                assert(elements);
//              console.log('res:', elements);
                assert.equal(query.q, 'SELECT name FROM records WHERE name LIKE \'Name-%\'');
                assert.equal(30, elements.length);
                elements.forEach((e, index)=>{
                    assert.equal(1, Object.keys(e).length);
                    assert.equal(e.name, 'Name-'+index);
                });
                done();
            });
        });

        it('SELECT name FROM records WHERE name LIKE \'Name-%\' LIMIT 3 OFFSET 0', (done)=>{
            const opts = {
                keys: [Record.dbKeys.name],
                where: {},
                position: {count:3, offset:0},
            };
            opts.where[Record.dbKeys.name] = 'Name-**';

            query.run(dbc, 'records', Record, inserter, opts, (err, elements)=>{
                assert(!err, err);
                assert(elements);
//              console.log('res:', elements);
                assert.equal(query.q, 'SELECT name FROM records WHERE name LIKE \'Name-%\' LIMIT 3 OFFSET 0');
                assert.equal(3, elements.length);
                elements.forEach((e, index)=>{
                    assert.equal(1, Object.keys(e).length);
                    assert.equal(e.name, 'Name-'+index);
                });
                done();
            });
        });

        it('SELECT name FROM records WHERE name LIKE \'Name-%\' LIMIT 10 OFFSET 25', (done)=>{
            const opts = {
                keys: [Record.dbKeys.name],
                where: {},
                position: {count:10, offset:25},
            };
            opts.where[Record.dbKeys.name] = 'Name-**';

            query.run(dbc, 'records', Record, inserter, opts, (err, elements)=>{
                assert(!err, err);
                assert(elements);
//              console.log('res:', elements);
                assert.equal(query.q, 'SELECT name FROM records WHERE name LIKE \'Name-%\' LIMIT 10 OFFSET 25');
                assert.equal(5, elements.length);
                elements.forEach((e, index)=>{
                    assert.equal(1, Object.keys(e).length);
                    assert.equal(e.name, 'Name-'+(index+25));
                });
                done();
            });
        });

        it('SELECT * FROM records ORDER BY stts ASC LIMIT 100 OFFSET 0', (done)=>{
            const opts = {
                position: {count:100, offset:0},
                order: {by:'stts', direction:'ASC'}
            };

            query.run(dbc, 'records', Record, inserter, opts, (err, elements)=>{
                assert(!err, err);
                assert(elements);
//              console.log('res:', elements);
                assert.equal(query.q, 'SELECT * FROM records ORDER BY stts ASC LIMIT 100 OFFSET 0');
                assert.equal(30, elements.length);
                elements.forEach((e, index)=>{
                    assert.equal(e.name, 'Name-'+index);
                });
                done();
            });
        });

        it('SELECT * FROM records ORDER BY stts DESC LIMIT 100 OFFSET 0', (done)=>{
            const opts = {
                position: {count:100, offset:0},
                order: {by:'stts', direction:'DESC'}
            };

            query.run(dbc, 'records', Record, inserter, opts, (err, elements)=>{
                assert(!err, err);
                assert(elements);
//              console.log('res:', elements);
                assert.equal(query.q, 'SELECT * FROM records ORDER BY stts DESC LIMIT 100 OFFSET 0');
                assert.equal(30, elements.length);
                elements.forEach((e, index)=>{
                    assert.equal(e.name, 'Name-'+(29-index));
                });
                done();
            });
        });
    });
});

