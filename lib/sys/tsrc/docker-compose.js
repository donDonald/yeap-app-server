'use strict';

describe("lib.sys.docker-compose, Simple docker-compose helper", ()=>{
    const assert = require('assert');
    const re = (module)=>{ return require('../../' + module); }



    let api, dcompose, dc;
    before(()=>{
        api = {};
        api.fs = require('fs');
        api.zlib = require('zlib');
        api.stream = require('stream'); // PTFIXME ????
        api.lib = re('exports')(api);
        dcompose = re('sys/docker-compose.js')(api);
    });



    describe("#docker-compose.ps_handler", ()=>{

        //      it('incorrect context(folder)', ()=>{
        //          const a = [
        //              'ERROR: ',
        //              '        Can\'t find a suitable configuration file in this directory or any',
        //              '        parent. Are you in the right directory?',
        //              '',
        //              '        Supported filenames: docker-compose.yml, docker-compose.yaml'
        //          ];
        //          const b = a.join('\n');

        //          const containers = dc.ps.handler(b);
        //          assert(containers);
        //          assert.equal(0, containers.length);
        //          assert.equal(0, Object.keys(containers).length);
        //      });
        it('set context', ()=>{
            dc = dcompose('some context is here');
        });



        it('no services', ()=>{
            const a = [
                'Name                   Command              State    Ports',
                '--------------------------------------------------------------',
                ''
            ];
            const b = a.join('\n');

            const containers = dc.ps_handler(b);
            assert(containers);
            assert.equal(0, Object.keys(containers).length);
        });



        it('serviceA', (done)=>{
            const a = [
                '    Name                   Command              State               Ports             ',
                '--------------------------------------------------------------------------------------',
                'serviceA        /entrypoint.sh                  Up      443/tcp, 0.0.0.0:11111->80/tcp',
                ''
            ];
            const b = a.join('\n');

            const containers = dc.ps_handler(b);
            assert(containers);
            assert.equal(1, Object.keys(containers).length);

            assert(containers.serviceA);
            assert.equal('serviceA', containers.serviceA.name);
            assert.equal('/entrypoint.sh', containers.serviceA.command);
            assert.equal('443/tcp, 0.0.0.0:11111->80/tcp', containers.serviceA.ports);
            done();
        });



        it('serviceA + serviceB', (done)=>{
            const a = [
                '    Name                   Command              State               Ports             ',
                '--------------------------------------------------------------------------------------',
                'serviceA        /entrypoint.sh                  Up      443/tcp, 0.0.0.0:11111->80/tcp',
                'serviceB        docker-entrypoint.sh postgres   Up      0.0.0.0:5432->5432/tcp  ',
                ''
            ];
            const b = a.join('\n');

            const containers = dc.ps_handler(b);
            assert(containers);
            assert.equal(2, Object.keys(containers).length);

            assert(containers.serviceA);
            assert.equal('serviceA', containers.serviceA.name);
            assert.equal('/entrypoint.sh', containers.serviceA.command);
            assert.equal('443/tcp, 0.0.0.0:11111->80/tcp', containers.serviceA.ports);

            assert(containers.serviceB);
            assert.equal('serviceB', containers.serviceB.name);
            assert.equal('docker-entrypoint.sh postgres', containers.serviceB.command);
            assert.equal('0.0.0.0:5432->5432/tcp', containers.serviceB.ports);
            done();
        });
    });



    describe("#docker-compose.ps", (done)=>{

        it('set context', ()=>{
            dc = dcompose('some context is here');
        });



        it('no services', (done)=>{
            const a = [
                'Name                   Command              State    Ports',
                '--------------------------------------------------------------',
                ''
            ];
            dc.tsrc.stdout.reset().push(a.join('\n'));

            dc.ps((err, containers)=>{
                assert(!err, err);
                assert(containers);
                assert.equal(0, Object.keys(containers).length);
                done();
            });
        });



        it('serviceA', (done)=>{
            const a = [
                '    Name                   Command              State               Ports             ',
                '--------------------------------------------------------------------------------------',
                'serviceA        /entrypoint.sh                  Up      443/tcp, 0.0.0.0:11111->80/tcp',
                ''
            ];
            dc.tsrc.stdout.reset().push(a.join('\n'));

            dc.ps((err, containers)=>{
                assert(!err, err);
                assert(containers);
                assert.equal(1, Object.keys(containers).length);

                assert(containers.serviceA);
                assert.equal('serviceA', containers.serviceA.name);
                assert.equal('Up', containers.serviceA.state);
                assert.equal('/entrypoint.sh', containers.serviceA.command);
                assert.equal('443/tcp, 0.0.0.0:11111->80/tcp', containers.serviceA.ports);
                done();
            });
        });



        it('serviceA + serviceB', (done)=>{
            const a = [
                '    Name                   Command              State               Ports             ',
                '--------------------------------------------------------------------------------------',
                'serviceA        /entrypoint.sh                  Up      443/tcp, 0.0.0.0:11111->80/tcp',
                'serviceB        docker-entrypoint.sh postgres   Up      0.0.0.0:5432->5432/tcp  ',
                ''
            ];
            dc.tsrc.stdout.reset().push(a.join('\n'));

            dc.ps((err, containers)=>{
                assert(!err, err);
                assert(containers);
                assert.equal(2, Object.keys(containers).length);

                assert(containers.serviceA);
                assert.equal('serviceA', containers.serviceA.name);
                assert.equal('Up', containers.serviceA.state);
                assert.equal('/entrypoint.sh', containers.serviceA.command);
                assert.equal('443/tcp, 0.0.0.0:11111->80/tcp', containers.serviceA.ports);

                assert(containers.serviceB);
                assert.equal('serviceB', containers.serviceB.name);
                assert.equal('Up', containers.serviceB.state);
                assert.equal('docker-entrypoint.sh postgres', containers.serviceB.command);
                assert.equal('0.0.0.0:5432->5432/tcp', containers.serviceB.ports);
                done();
            });
        });
    });



    describe("#docker-compose.state", (done)=>{
        it('set context', ()=>{
            dc = dcompose('some context is here');
        });



        it('no services, Down', (done)=>{
            const a = [
                'Name                   Command              State    Ports',
                '--------------------------------------------------------------',
                ''
            ];
            dc.tsrc.stdout.reset().push(a.join('\n'));

            dc.state((err, state)=>{
                assert(!err, err);
                assert(state);
                assert.equal('Down', state);
                done();
            });
        });



        it('serviceA, Up', (done)=>{
            const a = [
                '    Name                   Command              State               Ports             ',
                '--------------------------------------------------------------------------------------',
                'serviceA        /entrypoint.sh                  Up      443/tcp, 0.0.0.0:11111->80/tcp',
                ''
            ];
            dc.tsrc.stdout.reset().push(a.join('\n'));

            dc.state((err, state)=>{
                assert(!err, err);
                assert(state);
                assert.equal('Up', state);
                done();
            });
        });



        it('serviceA + serviceB, Up', (done)=>{
            const a = [
                '    Name                   Command              State               Ports             ',
                '--------------------------------------------------------------------------------------',
                'serviceA        /entrypoint.sh                  Up      443/tcp, 0.0.0.0:11111->80/tcp',
                'serviceB        docker-entrypoint.sh postgres   Up      0.0.0.0:5432->5432/tcp  ',
                ''
            ];
            dc.tsrc.stdout.reset().push(a.join('\n'));

            dc.state((err, state)=>{
                assert(!err, err);
                assert(state);
                assert.equal('Up', state);
                done();
            });
        });



        it('serviceA + serviceB, Unclear', (done)=>{
            const a = [
                '    Name                   Command              State               Ports             ',
                '--------------------------------------------------------------------------------------',
                'serviceA        /entrypoint.sh                  Up      443/tcp, 0.0.0.0:11111->80/tcp',
                'serviceB        docker-entrypoint.sh postgres   Exit 0  0.0.0.0:5432->5432/tcp  ',
                ''
            ];
            dc.tsrc.stdout.reset().push(a.join('\n'));

            dc.state((err, state)=>{
                assert(!err, err);
                assert(state);
                assert.equal('Unclear', state);
                done();
            });
        });
    });



    describe("#docker-compose.up", ()=>{
        it('set context', ()=>{
            dc = dcompose('some context is here');
        });



        it('no services', (done)=>{
            const a = [
                'Name                   Command              State    Ports',
                '--------------------------------------------------------------',
                ''
            ];
            dc.tsrc.stdout.reset().push(a.join('\n')).push('this outpot doesn\'t matter');

            dc.up((err, containers)=>{
                assert(!err, err);
                assert(containers);
                assert.equal(0, Object.keys(containers).length);
                done();
            });
        });



        it('serviceA', (done)=>{
            const a = [
                '    Name                   Command              State               Ports             ',
                '--------------------------------------------------------------------------------------',
                'serviceA        /entrypoint.sh                  Up      443/tcp, 0.0.0.0:11111->80/tcp',
                ''
            ];
            dc.tsrc.stdout.reset().push(a.join('\n')).push('this outpot doesn\'t matter');

            dc.up((err, containers)=>{
                assert(!err, err);
                assert(containers);
                assert.equal(1, Object.keys(containers).length);

                assert(containers.serviceA);
                assert.equal('serviceA', containers.serviceA.name);
                assert.equal('Up', containers.serviceA.state);
                assert.equal('/entrypoint.sh', containers.serviceA.command);
                assert.equal('443/tcp, 0.0.0.0:11111->80/tcp', containers.serviceA.ports);
                done();
            });
        });



        it('serviceA + serviceB', (done)=>{
            const a = [
                '    Name                   Command              State               Ports             ',
                '--------------------------------------------------------------------------------------',
                'serviceA        /entrypoint.sh                  Up      443/tcp, 0.0.0.0:11111->80/tcp',
                'serviceB        docker-entrypoint.sh postgres   Up      0.0.0.0:5432->5432/tcp  ',
                ''
            ];
            dc.tsrc.stdout.reset().push(a.join('\n')).push('this outpot doesn\'t matter');

            dc.up((err, containers)=>{
                assert(!err, err);
                assert(containers);
                assert.equal(2, Object.keys(containers).length);

                assert(containers.serviceA);
                assert.equal('serviceA', containers.serviceA.name);
                assert.equal('Up', containers.serviceA.state);
                assert.equal('/entrypoint.sh', containers.serviceA.command);
                assert.equal('443/tcp, 0.0.0.0:11111->80/tcp', containers.serviceA.ports);

                assert(containers.serviceB);
                assert.equal('serviceB', containers.serviceB.name);
                assert.equal('Up', containers.serviceB.state);
                assert.equal('docker-entrypoint.sh postgres', containers.serviceB.command);
                assert.equal('0.0.0.0:5432->5432/tcp', containers.serviceB.ports);
                done();
            });
        });
    });



    describe("#docker-compose.down", ()=>{
        it('set context', ()=>{
            dc = dcompose('some context is here');
        });



        it('no services', (done)=>{
            const a = [
                'Name                   Command              State    Ports',
                '--------------------------------------------------------------',
                ''
            ];
            dc.tsrc.stdout.reset().push(a.join('\n')).push('this outpot doesn\'t matter');

            dc.down((err, containers)=>{
                assert(!err, err);
                assert(!containers);
                //assert.equal(0, Object.keys(containers).length);
                done();
            });
        });



        it('error, serviceA is still running', (done)=>{
            const a = [
                '    Name                   Command              State               Ports             ',
                '--------------------------------------------------------------------------------------',
                'serviceA        /entrypoint.sh                  Up      443/tcp, 0.0.0.0:11111->80/tcp',
                ''
            ];
            dc.tsrc.stdout.reset().push(a.join('\n')).push('this outpot doesn\'t matter');

            dc.down((err, containers)=>{
                assert(err);
                assert(containers);
                assert.equal(1, Object.keys(containers).length);

                assert(containers.serviceA);
                assert.equal('serviceA', containers.serviceA.name);
                assert.equal('Up', containers.serviceA.state);
                assert.equal('/entrypoint.sh', containers.serviceA.command);
                assert.equal('443/tcp, 0.0.0.0:11111->80/tcp', containers.serviceA.ports);
                done();
            });
        });



        it('error, serviceA and serviceB are still running for some reason', (done)=>{
            const a = [
                '    Name                   Command              State               Ports             ',
                '--------------------------------------------------------------------------------------',
                'serviceA        /entrypoint.sh                  Up      443/tcp, 0.0.0.0:11111->80/tcp',
                'serviceB        docker-entrypoint.sh postgres   Up      0.0.0.0:5432->5432/tcp  ',
                ''
            ];
            dc.tsrc.stdout.reset().push(a.join('\n')).push('this outpot doesn\'t matter');

            dc.down((err, containers)=>{
                assert(err);
                assert(containers);
                assert.equal(2, Object.keys(containers).length);

                assert(containers.serviceA);
                assert.equal('serviceA', containers.serviceA.name);
                assert.equal('Up', containers.serviceA.state);
                assert.equal('/entrypoint.sh', containers.serviceA.command);
                assert.equal('443/tcp, 0.0.0.0:11111->80/tcp', containers.serviceA.ports);

                assert(containers.serviceB);
                assert.equal('serviceB', containers.serviceB.name);
                assert.equal('Up', containers.serviceB.state);
                assert.equal('docker-entrypoint.sh postgres', containers.serviceB.command);
                assert.equal('0.0.0.0:5432->5432/tcp', containers.serviceB.ports);
                done();
            });
        });
    });



    describe("#docker-compose, testing real postgres + pgadmin compose file", ()=>{
        it('set context', ()=>{
            dc = dcompose(process.cwd()+'/pg_test');
        });



        it('#ps, check no containers are up and running', (done)=>{
            dc.ps((err, containers)=>{
                assert(!err, err);
                assert(containers);
                assert.equal(0, Object.keys(containers).length);
                done();
            });
        });



        it('#down, check no containers', (done)=>{
            dc.down((err, containers)=>{
                assert(!err, err);
                assert(!containers);
                done();
            });
        });



        it('#state, check state', (done)=>{
            dc.state((err, state)=>{
                assert(!err, err);
                assert(state);
                assert.equal('Down', state);
                done();
            });
        });



        it('#up,  check all containers up and running', (done)=>{
            dc.up((err, containers)=>{
                assert(!err, err);
                assert(containers);
                assert.equal(2, Object.keys(containers).length);

                assert(containers.pg_test_pgadmin_1);
                assert.equal('Up', containers.pg_test_pgadmin_1.state);
                assert.equal('pg_test_pgadmin_1', containers.pg_test_pgadmin_1.name);
                assert.equal('/entrypoint.sh', containers.pg_test_pgadmin_1.command);
                assert.equal('443/tcp, 0.0.0.0:11111->80/tcp', containers.pg_test_pgadmin_1.ports);

                assert(containers.pg_test_postgres_1);
                assert.equal('Up', containers.pg_test_postgres_1.state);
                assert.equal('pg_test_postgres_1', containers.pg_test_postgres_1.name);
                assert.equal('docker-entrypoint.sh postgres', containers.pg_test_postgres_1.command);
                assert.equal('0.0.0.0:5432->5432/tcp', containers.pg_test_postgres_1.ports);
                done();
            });
        });



        it('#state, check state', (done)=>{
            dc.state((err, state)=>{
                assert(!err, err);
                assert(state);
                assert.equal('Up', state);
                done();
            });
        });



        it('#down, check no containers', (done)=>{
            dc.down((err, containers)=>{
                assert(!err, err);
                assert(!containers);
                done();
            });
        });



        it('#state, check state', (done)=>{
            dc.state((err, state)=>{
                assert(!err, err);
                assert(state);
                assert.equal('Down', state);
                done();
            });
        });

    });

});

