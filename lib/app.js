'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const is = require('is-type-of');
const delegate = require('delegates');

const KoaApplication = require('koa');

const Logger = require('2o3t-logger');
const utility = require('2o3t-utility');
const Timing = utility.Timing;

const AppInfo = require('./core/appInfo');
const Loader = require('./loader');
const utils = require('./utils');

const Router = require('./core/router');

const OPTIONS = Symbol('AppInfo#options');
const READ_ONLY = Symbol('AppInfo#readonly');
const INIT_READY = Symbol('AppCore#initReady');
const INIT_PROXY = Symbol('AppCore#initProxy');
const INITED = Symbol('AppCore#inited');

// 默认参数
const defaultOpts = {
    baseDir: process.cwd(),
    configDir: 'config',
    pluginDir: 'plugin',
    middlewareDir: 'middleware',
    routerDir: 'router',
    controllerDir: 'controller',
};

class AppCore extends KoaApplication {

    /**
     * Creates an instance of AppCore.
     * @param {Object} [opts={}] options
     * @param {Logger} [opts.logger] logger
     * @memberof AppCore
     */
    constructor(opts = {}) {

        const options = Object.assign({}, defaultOpts, opts);
        assert(typeof options.baseDir === 'string', 'options.baseDir required, and must be a string');
        assert(fs.existsSync(options.baseDir), `Directory ${options.baseDir} not exists`);
        assert(fs.statSync(options.baseDir).isDirectory(), `Directory ${options.baseDir} is not a directory`);

        // parse env config
        options.envConfig = utils.parseEnvConfig(options.baseDir);

        const logger = options.logger = options.logger || new Logger();
        utils.LOGGER_METHODS.forEach(key => {
            assert(logger[key] && is.function(logger[key]), `loggor.${key} required, and must be a function`);
        });

        super();

        this[OPTIONS] = options;
        this[READ_ONLY] = {
            timing: new Timing('AppCore', this.logger),
        };

        this.timing.start('Application Start');

        this[INIT_READY]();

        this[INIT_PROXY]();

        this.ready(() => {
            this.timing.end('Application Start');
        });

        this[INITED]();
    }

    /**
     * override koa's app.use, support generator function
     * @param {Function} middleware - middleware
     * @return {Application} app
     * @since 1.0.0
     */
    use(middleware) {
        // TODO: use 记录
        if (middleware[utils.MIDDLEWARE_NAME]) {
            this.logger.system('app.use middleware: ', middleware[utils.MIDDLEWARE_NAME]);
        }
        return super.use(middleware);
    }

    /**
     * 耗时计算
     *
     * @return {Timing} timing
     * @readonly
     * @memberof AppCore
     */
    get timing() {
        return this[READ_ONLY].timing;
    }

    /**
     * The current directory of application
     * @member {String}
     * @see {@link AppInfo#baseDir}
     * @since 1.0.0
     */
    get baseDir() {
        return this.appInfo.baseDir;
    }

    /**
     * 日志
     *
     * @return {Logger} logger
     * @readonly
     * @memberof AppCore
     */
    get logger() {
        return this[OPTIONS].logger;
    }

    /**
     * 初始化
     * @member {Function}
     * @memberof AppCore
     * @private
     */
    [INITED]() {
        if (this.rootFilePath) {
            this[OPTIONS].rootDir = path.dirname(this.rootFilePath);
            this.logger.system(`Loaded rootDir = ${this.rootDir}`);
        }

        this.loader.run();
    }


    /**
     * get router
     * @return { Router } router instance
     */
    get router() {
        if (this[READ_ONLY].router) {
            return this[READ_ONLY].router;
        }
        const router = this[READ_ONLY].router = new Router({ sensitive: true }, this);
        // register router middleware
        this.beforeStart(() => {
            this.use(router.middleware());
        });
        return router;
    }

    /**
     * 应用信息
     *
     * @return {AppInfo} instance
     * @readonly
     * @memberof AppCore
     */
    get appInfo() {
        if (this[READ_ONLY].appInfo) {
            return this[READ_ONLY].appInfo;
        }

        const appInfo = this[READ_ONLY].appInfo = new AppInfo({
            ...this[OPTIONS],
            app: this,
        });
        return appInfo;
    }

    /**
     * 加载器
     *
     * @return {Loader} instance
     * @readonly
     * @memberof AppCore
     */
    get loader() {
        if (this[READ_ONLY].loader) {
            return this[READ_ONLY].loader;
        }

        const loader = this[READ_ONLY].loader = new Loader({
            appInfo: this.appInfo,
            timing: this.timing,
            logger: this.logger,
        });
        return loader;
    }

    /**
     * 当前实例文件路径
     *
     * @return {String} filepath
     * @readonly
     * @memberof AppCore
     */
    get rootFilePath() {
        if (this[OPTIONS].rootFilePath) {
            return this[OPTIONS].rootFilePath;
        }

        // 获取当前实例的位置
        const rootFilePath = this[OPTIONS].rootFilePath = utility.getCalleeFromStacks()[0];
        this.logger.system(`Loaded rootFilePath = ${this.rootFilePath}`);
        return rootFilePath;
    }

    /**
     * 当前实例文件夹路径
     *
     * @return {String} root dir
     * @readonly
     * @memberof AppCore
     */
    get rootDir() {
        return this[OPTIONS].rootDir;
    }

    /**
     * ready callback 方法
     * @member {Function}
     * @private
     */
    [INIT_READY]() {
        /**
         * register an callback function that will be invoked when application is ready.
         * @method {Function} EggCore#ready
         * @see https://github.com/node-modules/ready
         * @since 1.0.0
         * @example
         * const app = new Application(...);
         * app.ready(err => {
         *   if (err) throw err;
         *   console.log('done');
         * });
         */

        // get app timeout from env or use default timeout 10 second
        const eggReadyTimeoutEnv = Number.parseInt(process.env.READY_TIMEOUT_ENV || 10000);
        assert(Number.isInteger(eggReadyTimeoutEnv), `process.env.EGG_READY_TIMEOUT_ENV ${process.env.READY_TIMEOUT_ENV} should be able to parseInt.`);

        /**
         * If a client starts asynchronously, you can register `readyCallback`,
         * then the application will wait for the callback to ready
         *
         * It will log when the callback is not invoked after 10s
         *
         * @example
         * const done = app.readyCallback('mysql');
         * mysql.ready(done);
         */
        require('ready-callback')({
            timeout: eggReadyTimeoutEnv,
        }).mixin(this);

        this.on('ready_stat', data => {
            this.logger.system('[ReadyStat: End Task] <%s>', data.id);
            this.logger.system('[ReadyStat: Remain Tasks] %j', data.remain);
        }).on('ready_timeout', id => {
            this.logger.warn('[ReadyStat: Timeout] %ss later <%s> was still unable to finish.', eggReadyTimeoutEnv / 1000, id);
        });
    }

    get config() {
        return this.loader.config;
    }

    /**
     * 代理 loader
     * @memberof AppCore
     * @private
     */
    [INIT_PROXY]() {
        utils.MIXIN_NAMES.reduce((obj, name) => {
            const key = utility.defaultCamelize2Str(`load_${name}`, 'modules');
            utility.createLazyReadOnlyProp(obj, key, () => {
                return this.loader[name];
            });
            return obj;
        }, this);
    }

    /**
     * 假睡
     *
     * @param {Number} time 时间（ms)
     * @return {Promise} 异步
     * @memberof AppCore
     */
    sleep(time) {
        assert(typeof time === 'number', 'time must be number!');
        const name = utility.getCalleeFromStack(true);
        const timingkey = `Sleep(${time}ms) End in ` + utility.getResolvedFilename(name, this.baseDir);
        this.timing.start(timingkey);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
                this.timing.end(timingkey);
            }, time);
        });
    }

    /**
     * Execute scope after loaded and before app start
     *
     * @param  {Function|GeneratorFunction|AsyncFunction} scope function will execute before app start
     */
    beforeStart(scope) {
        if (!is.function(scope)) {
            throw new Error('beforeStart only support function');
        }

        // get filename from stack
        const name = utility.getCalleeFromStack(true);
        const timingkey = 'Before Start in ' + utility.getResolvedFilename(name, this.baseDir);

        this.timing.start(timingkey);

        const done = this.readyCallback(name);

        // ensure scope executes after load completed
        process.nextTick(() => {
            utility.callFn(scope, null, this).then(() => {
                done();
                this.timing.end(timingkey);
            }, err => {
                done(err);
                this.timing.end(timingkey);
            });
        });
    }


    /**
     * Return JSON representation.
     * We only bother showing settings.
     *
     * @return {Object} json
     * @api public
     */
    toJSON() {
        const sup = super.toJSON();
        return Object.assign({}, sup, utility.mapCleanObject(this, [
            'baseDir',
            'appInfo',
            'rootFilePath',
            'rootDir',
            'loader',
        ]));
    }
}

module.exports = AppCore;
