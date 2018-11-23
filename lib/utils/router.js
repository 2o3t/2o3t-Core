'use strict';

const KoaRouter = require('koa-router');
const inflection = require('inflection');
const utility = require('2o3t-utility');
const assert = require('assert');
const utils = require('./');
const proxyServer = require('./proxy');

const logger = require('2o3t-logger').instance('Router');
const timing = new utility.Timing('Router#Proxy', logger);

const WATCH_STACK = Symbol('Router#watch#stack');

const RESTFUL_MAP = {
    index: {
        suffix: '',
        method: 'GET',
    },
    new: {
        namePrefix: 'new_',
        member: true,
        suffix: 'new',
        method: 'GET',
    },
    create: {
        suffix: '',
        method: 'POST',
    },
    show: {
        member: true,
        suffix: ':id',
        method: 'GET',
    },
    edit: {
        member: true,
        namePrefix: 'edit_',
        suffix: ':id/edit',
        method: 'GET',
    },
    update: {
        member: true,
        namePrefix: '',
        suffix: ':id',
        method: [ 'PATCH', 'PUT' ],
    },
    destroy: {
        member: true,
        namePrefix: 'destroy_',
        suffix: ':id',
        method: 'DELETE',
    },
};

class Router extends KoaRouter {

    constructor(opts, app) {
        super(opts);

        this[utils.ROUTER_NAME] = this.opts.name || Router.ROOT_NAME;
        this.app = app;
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

    /**
     * @return {Logger} logger
     */
    get logger() {
        return logger;
    }

    /**
     * create new router
     * @param {String} name Router name
     * @return {Router} new instance
     */
    new(name = 'SubRouter') {
        const opts = {
            ...this.opts,
            name,
        };
        return new Router(opts, this.app);
    }

    /**
     * restful router api
     * (CUDA)
     * @param {String} [name] name
     * @param {String} prefix path
     * @param {Array} middlewares controller
     * @return {Router} return route object.
     */
    resources(name, prefix, middlewares) {

        if (typeof prefix === 'string') {
            middlewares = Array.prototype.slice.call(arguments, 2);
        } else {
            middlewares = Array.prototype.slice.call(arguments, 1);
            prefix = name;
            name = null;
        }

        const controller = middlewares.pop();

        for (const key in RESTFUL_MAP) {
            const action = controller[key];
            if (!action) continue;

            const opts = RESTFUL_MAP[key];
            let formatedName;
            if (opts.member) {
                formatedName = inflection.singularize(name);
            } else {
                formatedName = inflection.pluralize(name);
            }
            if (opts.namePrefix) {
                formatedName = opts.namePrefix + formatedName;
            }
            prefix = prefix.replace(/\/$/, '');
            const path = opts.suffix ? `${prefix}/${opts.suffix}` : prefix;
            const method = Array.isArray(opts.method) ? opts.method : [ opts.method ];
            this.register(path, method, middlewares.concat(action), { name: formatedName });
        }

        return this;
    }

    /**
     * 代理转发
     * @param {String} name name
     * @param {String} path path
     * @param {Array} middleware middleware
     * @param {String|Object} target target
     * @return {Router} this
     */
    proxy(name, path, middleware, target) {
        const args = Array.prototype.slice.call(arguments);
        if (args.length < 2) {
            throw new TypeError('target must be required!');
        }
        const type = typeof args[args.length - 1];
        if (utility.isString(type) || utility.isObject(type)) {
            target = args.pop();
        }
        if (path === target) {
            path = null;
        }
        if (typeof path === 'string') {
            middleware = Array.prototype.slice.call(args, 2);
        } else {
            middleware = Array.prototype.slice.call(args, 1);
            path = name;
            name = null;
        }

        let options = {
            changeOrigin: true, // for vhosted sites, changes host header to match to target's host
            onProxyRes, onProxyReq,
        };
        if (utility.isObject(target)) {
            options = Object.assign(options, target);
        } else {
            options.target = target;
        }
        middleware.push(proxyServer(options));

        this.logger.system('Proxy created:', path, ' -> ', options.target);

        // all
        this.all(name, path, ...middleware);

        return this;
    }


    /**
   * @param {String} name - Router name
   * @param {Object} params - more parameters
   * @example
   * ```js
   * router.url('edit_post', { id: 1, name: 'foo', page: 2 })
   * => /posts/1/edit?name=foo&page=2
   * router.url('posts', { name: 'foo&1', page: 2 })
   * => /posts?name=foo%261&page=2
   * ```
   * @return {String} url by path name and query params.
   */
    pathFor(name, params) {
        const route = this.route(name);
        if (!route) return '';

        const args = params;
        let url = route.path;

        assert(!utility.is.regExp(url), `Can't get the url for regExp ${url} for by name '${name}'`);

        const queries = [];
        if (typeof args === 'object' && args !== null) {
            const replacedParams = [];
            url = url.replace(/:([a-zA-Z_]\w*)/g, function($0, key) {
                if (utility.has(args, key)) {
                    const values = args[key];
                    replacedParams.push(key);
                    return utility.encodeURIComponent(Array.isArray(values) ? values[0] : values);
                }
                return $0;
            });

            for (const key in args) {
                if (replacedParams.includes(key)) {
                    continue;
                }

                const values = args[key];
                const encodedKey = utility.encodeURIComponent(key);
                if (Array.isArray(values)) {
                    for (const val of values) {
                        queries.push(`${encodedKey}=${utility.encodeURIComponent(val)}`);
                    }
                } else {
                    queries.push(`${encodedKey}=${utility.encodeURIComponent(values)}`);
                }
            }
        }

        if (queries.length > 0) {
            const queryStr = queries.join('&');
            if (!url.includes('?')) {
                url = `${url}?${queryStr}`;
            } else {
                url = `${url}&${queryStr}`;
            }
        }

        return url;
    }

    toJSON() {
        if (!this[WATCH_STACK] || this[WATCH_STACK].stack_len !== this.stack.length) {
            this[WATCH_STACK] = {
                stack_len: this.stack.length,
                cache: mapStacksDepth(this.stack),
            };
        }
        return this[WATCH_STACK].cache;
    }

    toString() {
        return this.toJSON().map(item => {
            return `[${item.methods.join(',')}]  ${item.path}  ${item.regexp}`;
        }).join('\n');
    }
}

/**
 * 遍历堆栈
 * @param {Array} stacks 栈
 * @return {Array} 扁平栈
 */
function mapStacksDepth(stacks = []) {
//   debug('defined route %s %s', this.methods, this.opts.prefix + this.path);
    const result = [];
    if (stacks.length) {
        let temp = [ ].concat(stacks);
        while (temp.length) {
            const layer = temp.shift();
            const s = layer.stack;
            if (Array.isArray(s)) {
                temp = temp.concat(s);
                if (layer.methods && layer.methods.length > 0) {
                    const obj = utility.mapCleanObject(layer, [ 'name', 'methods', 'path', 'regexp' ]);
                    result.push(obj);
                }
            }
        }
    }
    return result;
}

function onProxyReq(proxyReq, req /* res, options*/) {
    if (process.env.NODE_ENV !== 'production') {
        timing.start(`${proxyReq.method} --> ${proxyReq.path}`);
    }
    if (req.body) {
        const bodyData = JSON.stringify(req.body);
        // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        // stream the content
        proxyReq.write(bodyData);
    }
    logger.system('Proxy <onProxyReq> method: %s, url: %s', proxyReq.method, proxyReq.path);
}

function onProxyRes(proxyRes, req /* res, options */) {
    logger.system('Proxy <onProxyRes> method: %s, url: %s, statusCode: %s', req.method, req.url, proxyRes.statusCode);
    if (process.env.NODE_ENV !== 'production') {
        timing.end(`${req.method} --> ${req.url}`).toString();
    }
}

module.exports = Router;
