'use strict';

const KoaRouter = require('koa-router');
const utility = require('2o3t-utility');
const is = utility.is;
const utils = require('./');

const INIT = Symbol('Router#init');

// TODO: Router
class Router extends KoaRouter {

    constructor(opts, app) {
        super(opts);

        this[utils.ROUTER_NAME] = this.opts.name || Router.ROOT_NAME;
        this.app = app;

        this[INIT]();
    }

    static get ROOT_NAME() {
        return '<ROOT-ROUTER>';
    }

    get name() {
        return this[utils.ROUTER_NAME];
    }

    /**
     * @return {Loader} loader
     */
    get loader() {
        return this.app.loader;
    }

    [INIT]() {

    }

    new(name = '') {
        const opts = {
            ...this.opts,
            name,
        };
        return new Router(opts, this.app);
    }

    /**
     * restful router api
     * (CUDA)
     *
     * @return {Router} return route object.
     */
    resources() {

    }

    toJSON() {
        // TODO： 打印所有注册的API
    }
}

module.exports = Router;
