'use strict';

const utility = require('2o3t-utility');
const READ_ONLY_APP = Symbol.for('context#readonly#app');
const INJECT_MAP = Symbol('context#inject#map');

class BaseContext {

    /**
     * @constructor
     * @param {AppCore} app instance
     * @param {Object} opts inject opts
     */
    constructor(app, ...opts) {
        /**
         * @member {AppCore} app
         */
        this[READ_ONLY_APP] = app;

        // init
        this[INJECT_MAP] = utility.mapCleanObject();

        utility.createLazyReadOnlyProp(this, 'options', function() {
            return Object.freeze(opts && Array.isArray(opts) && opts.length > 0 ? opts[0] : {});
        });
    }

    /**
     * @member {AppInfo} appInfo
     */
    get appInfo() {
        return this[READ_ONLY_APP].appInfo;
    }

    /**
     * @member {Config} config
     */
    get config() {
        return this[READ_ONLY_APP].config;
    }

    /**
     * @member {Plugin} plugin
     */
    get plugin() {
        return this[READ_ONLY_APP].loadPlugin;
    }

    /**
     * @member {Helper} helper
     */
    get helper() {
        return this[READ_ONLY_APP].loadHelper;
    }

    /**
     * @member {Router} router
     */
    get router() {
        return this[READ_ONLY_APP].loadRouter;
    }

    /**
     * @member {Logger} logger
     */
    get logger() {
        return this[READ_ONLY_APP].logger;
    }

    /**
     * 获取属性
     * @param {String|Symbol} name 唯一名称
     * @return {*} any
     */
    get(name) {
        return this[INJECT_MAP][name];
    }

    /**
     * 设置属性
     * @param {String|Symbol} name 唯一名称
     * @param {*} value any
     * @return {this} instance
     */
    set(name, value) {
        this[INJECT_MAP][name] = value;
        return this;
    }
}

module.exports = BaseContext;
