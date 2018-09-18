'use strict';

const assert = require('assert');
const fs = require('fs');
const utility = require('2o3t-utility');
const is = utility.is;
const isFunction = is.function;
const isAsyncFunction = is.asyncFunction;
const isGeneratorFunction = is.generatorFunction;
const co = require('co');
const path = require('path');

const utils = require('../../utils');
const ControllerContext = require('../controller');
const RouterContext = require('../router');

// 方法中判断是否为 class
const CLASS_FUNCTION_FULLPATH = Symbol('2o3t#function#fullpath');

const APP_CORE = Symbol('Loader#app#core');
const REQUIRE_COUNT = Symbol('Loader#requireCount');
const REQUIRE_FILE_STACKS = Symbol('Loader#requireFileStacks');

class BaseLoader {

    constructor(app) {
        this[APP_CORE] = app;

        this[REQUIRE_COUNT] = 0;
        this[REQUIRE_FILE_STACKS] = [];
    }

    /**
     * @return {AppCore} core
     */
    get app() {
        return this[APP_CORE];
    }

    /**
     * Load single file, will invoke when export is function
     *
     * @param {*} ctx - ctx
     * @param {String} filepath - fullpath
     * @param {Array} arguments - pass rest arguments into the function when invoke
     * @return {Object} exports
     * @private
     * @example
     * ```js
     * app.loader.loadFile(path.join(app.options.baseDir, 'config/router.js'));
     * ```
     */
    _loadFile(ctx, filepath, ...inject) {
        if (!filepath || !fs.existsSync(filepath)) {
            return null;
        }

        // function(arg1, args, ...) {}
        if (inject.length === 0) {
            inject = [ this.app ];
        }

        let ret = this.requireFile(filepath);
        if (isFunction(ret)) {
            if (is.class(ret)) {
                ret.prototype[CLASS_FUNCTION_FULLPATH] = filepath;
            } else {
                if (ctx) {
                    ret = ret.apply(ctx, inject);
                } else {
                    if (isGeneratorFunction(ret)) {
                        ret = co.wrap(ret);
                    }
                    if (isAsyncFunction(ret)) {
                        ret = ret(...inject).catch(function() {});
                    } else {
                        ret = ret(...inject);
                    }
                }
            }
        }
        // ret = isFunction(ret) ? ret(...inject) : ret;
        return ret;
    }

    loadFile(filepath, ...inject) {
        if (!filepath || !fs.existsSync(filepath)) {
            return null;
        }

        // function(arg1, args, ...) {}
        if (inject.length === 0) {
            inject = [ this.app ];
        } else {
            inject.unshift(this.app);
        }
        return this._loadFile(null, filepath, ...inject);
    }

    /**
     * 加载 middleware
     * @param {String} filepath path
     * @param  {...any} inject 参数
     * @return {Object} obj
     */
    loadMiddlewareFile(filepath, ...inject) {
        if (!filepath || !fs.existsSync(filepath)) {
            return null;
        }

        // function(arg1, args, ...) {}
        if (inject.length === 0) {
            inject = [ this.app ];
        } else {
            inject.unshift(this.app);
        }

        let ret = this.requireFile(filepath);
        if (isFunction(ret)) {
            let temp;
            try {
                if (isGeneratorFunction(ret)) {
                    ret = async function(...args) {
                        return co.wrap(ret).apply(this, args);
                    };
                }
                if (isAsyncFunction(ret)) {
                    temp = ret(...inject).catch(function() {});
                } else {
                    temp = ret(...inject);
                }
                if (isFunction(temp)) {
                    ret = temp;
                }
            } catch (error) {
                // do nothing
            }
        }
        // ret = isFunction(ret) ? ret(...inject) : ret;
        return ret;
    }

    /**
     * 加载 controller
     * @param {String} filepath path
     * @param  {...any} inject 参数
     * @return {Object} obj
     */
    loadControllerFile(filepath, ...inject) {
        const ret = this.loadFile(filepath, ...inject);
        if (ret && is.class(ret)) {
            // 加载controller
            const ctx = new ControllerContext(this.app, ...inject);
            return wrapClass(ret, ctx);
        } else if (ret && isFunction(ret)) {
            const ctx = new ControllerContext(this.app, ...inject);
            return ret.bind(ctx);
        }
        return null;
    }

    loadRouterFile(filepath, router, ...inject) {
        const ctx = new RouterContext(this.app, ...inject);
        const o = this._loadFile(ctx, filepath, router, ...inject);
        return o || router;
    }

    /**
     * @param {String} filepath - fullpath
     * @return {Object} exports
     * @private
     */
    requireFile(filepath) {
        const timingKey = `Require(${this[REQUIRE_COUNT]++}) ${utility.getResolvedFilename(filepath, this.baseDir)}`;
        this.timing.start(timingKey);
        const ret = utility.loadFile(filepath);
        this.timing.end(timingKey);
        this[REQUIRE_FILE_STACKS].push(filepath);
        return ret;
    }

    /**
     * 过滤需要的文件
     *
     * @param {Array} fileList 文件列表
     * @param {RegExp|Function} regexp 规则
     * @return {Array} - array
     */
    filtersPath(fileList, regexp) {
        assert(Array.isArray(fileList), 'fileList must be Array...');
        assert(regexp instanceof RegExp || isFunction(regexp), 'regexp must be RegExp...');
        return fileList.filter(file => {
            if (isFunction(regexp)) {
                return regexp(file);
            }
            return String.prototype.match.call(file, regexp);
        });
    }

    /**
     * 查询 Module 的绝对路径
     * @param {String} filepath path
     * @return {String} fullpath
     */
    resolveModule(filepath) {
        let fullPath;
        try {
            fullPath = require.resolve(filepath);
        } catch (e) {
            return undefined;
        }

        if (!this._getSupportFileType().test(fullPath)) {
            return undefined;
        }
        return fullPath;
    }

    /**
     * 从 Module 中获取 config 文件
     * @param {String} filepath name
     * @return {Array} fullpath
     */
    resolveModuleConfigs(filepath) {
        const filterFileList = this.resolveModuleFiles(filepath);
        if (filterFileList && Array.isArray(filterFileList) && filterFileList.length > 0) {
            const appInfo = this.appInfo;
            const env = appInfo.env;
            const scope = appInfo.scope;
            // 默认加载通用配置文件
            const defaultRegExp = this.createAllConfigFilesType(null, env, scope);
            // filter
            return filterFileList.filter(file => {
                return defaultRegExp.some(reg => {
                    return reg.test(file);
                });
            });
        }

        return [];
    }

    /**
     * 从 Module 中获取 middleware 文件
     * @param {String} filepath name
     * @param {String} dirName dirName
     * @return {Array} fullpath
     */
    resolveModuleFiles(filepath, dirName = false) {
        const fullpath = this.resolveModule(filepath);
        if (fullpath) {
            const rootDir = path.dirname(fullpath);
            let fileDir = dirName ? path.join(rootDir, dirName) : rootDir;
            if (!fs.existsSync(fileDir)) {
                fileDir += 's';
                if (!fs.existsSync(fileDir)) {
                    return [];
                }
            }
            const fileList = utility.mapDirsBreadth(fileDir, true, 'node_modules');
            const filterFileList = this.filtersPath(fileList, this._getSupportFileType());

            return filterFileList;
        }

        return [];
    }


    // Get all plugin configurations
    // plugin.default.js
    // plugin.${scope}.js
    // plugin.${env}.js
    // plugin.${scope}_${env}.js
    createAllConfigFilesType(name, env, scope) {
        let all = [ 'default', scope, env, `${scope}_${env}` ];
        if (!scope) {
            all = [ 'default', env ];
        }
        return all.map(type => {
            if (!name || name === 'config') {
                return utils.createFileRegExp(`[^\.]${type}`);
            }
            return utils.createFileRegExp(`${name}.${type}`);
        });
    }

    /**
     * Inspect implementation.
     *
     * @return {Object} json
     * @api public
     */
    inspect() {
        return this.toJSON();
    }

    /**
     * Return JSON representation.
     * We only bother showing settings.
     *
     * @return {Object} json
     * @api public
     */
    toJSON() {
        return {};
    }

    /**
     * 获取支持的文件类型
     * @param {String} name name
     * @return {RegExp} reg
     */
    _getSupportFileType(name = '') {
        // /\.(js|json)$/i
        return new RegExp(`${name}\.(js|json)$`, 'i');
    }

    /**
     * @abstract
     */
    run() {
        // do nothing
    }
}

// wrap the class, yield a object with middlewares
function wrapClass(Controller, ctx) {
    let proto = Controller.prototype;
    const ret = {};
    // tracing the prototype chain
    while (proto !== Object.prototype) {
        const keys = Object.getOwnPropertyNames(proto);
        for (const key of keys) {
            // getOwnPropertyNames will return constructor
            // that should be ignored
            if (key === 'constructor') {
                continue;
            }
            // skip getter, setter & non-function properties
            const d = Object.getOwnPropertyDescriptor(proto, key);
            // prevent to override sub method
            if (is.function(d.value) && !ret.hasOwnProperty(key)) {
                ret[key] = methodToMiddleware(Controller, key, ctx);
                ret[key][CLASS_FUNCTION_FULLPATH] =
                    Controller.prototype[CLASS_FUNCTION_FULLPATH] + '#' + Controller.name + '.' + key + '()';
            }
        }
        proto = Object.getPrototypeOf(proto);
    }
    return ret;

    function methodToMiddleware(Controller, key, ctx) {
        return function classControllerMiddleware(...args) {
            const controller = new Controller();
            return utility.callFn(controller[key], args, ctx);
        };
    }
}

module.exports = BaseLoader;
