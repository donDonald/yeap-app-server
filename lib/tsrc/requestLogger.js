'use strict';

const express = require('express');
const app = express();

const logger = console.log;
const requestLogger = require('../requestLogger')(logger);

const authentication = function (req, res, next) {
    console.log('authentication');
    next();
}

const business = function (req, res, next) {
    console.log('business');
    next();
}

const error = function (req, res, next) {
    console.log('error1');
    next('error1: some error');
}

const errorCrash = function (req, res, next) {
    console.log('errorCrash');
    setImmediate(()=>{
throw 'shall crash';
    });
}

const errorAsError = function (req, res, next) {
    console.log('errorAsError');
    throw new Error('error as Error');
}

const errorAsString = function (req, res, next) {
    console.log('errorAsString');
    throw 'error as string';
}

const errorAsObject = function (req, res, next) {
    console.log('errorAsObject');
    const e = {}
    e.name = 'acces denied';
    e.ex = 'invalid cridentials';
    throw e;
}

const errorHandler = function (error, req, res, next) {
    let errMsg;
    if (typeof error == 'string') {
        errMsg = error;
    } else if(error instanceof Error) {
        errMsg = error.toString();
    } else {
        errMsg = JSON.stringify(error);
    }
    console.log('errorHandler, error:' + errMsg);
    res.status(500).send(errMsg);
}

app.use(requestLogger);
app.use(authentication);
app.use(errorAsObject);
app.use(business);
app.use(errorHandler);

app.get('/', function (req, res) {
    res.send('Hello World!')
});

app.listen(3000);


