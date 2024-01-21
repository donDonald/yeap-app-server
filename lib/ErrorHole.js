'use strict';

const assert = require('assert'),
      re = (module)=>{ return require('../' + module); };




module.exports = (api)=>{
    assert(api)




    class ErrorHole {
        constructor(ctx) {
            this._ctx = ctx;
        }




        get name() {
            return 'ErrorHole';
        }




        get log() {
            if (this._ctx) {
                return api.log.ctx(this._ctx).ctx(this.name);
            } else {
                return api.log.ctx(this.name);
            }
        }




        open(opts, cb) {
            this.log.ctx('setup').info('Opening ...');
            this.log.ctx('setup').info('Opening is complete');
            setImmediate(cb);
        }




        close(cb) {
            this.log.ctx('setup').info('Closing ...');
            this.log.ctx('setup').info('Closing is complete');
            setImmediate(cb);
        }




        handle404(req, res, next) {
            this.log.ctx('404').info('handle404...');
            const template = {
                title: '404',
                message: `The requested URL ${req.url} is not found`
            };

            /// !!!!!!!!
            /// https://github.com/expressjs/express/blob/master/examples/error-pages/views/500.ejs
            res.render('404', template, (err, html)=>{
                if (err) {
                    res.status(500);
                    res.send("PTFIXME - 500??? "); // PTFIXME - 500???
                } else {
                    res.status(404);
                    res.send(html);
                }
                this.log.ctx('404').info('handle404 is complete');
            });
        }
    }




    return ErrorHole;
}

