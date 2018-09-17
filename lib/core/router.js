'use strict';

const KoaRouter = require('koa-router');
const utility = require('2o3t-utility');
const is = utility.is;
const utils = require('../utils/');

// TODO: Router
class Router extends KoaRouter {
    constructor(opts, app) {
        super(opts);
        this.__name__ = utils.ROUTER_NAME;
        this.app = app;
    }
}

module.exports = Router;
