'use strict';

const assert = require('assert');
const fs = require('fs');
const utility = require('2o3t-utility');
const is = utility.is;
const isFunction = is.function;

const AppInfo = require('../core/appInfo');
const MIXIN_NAMES = require('../utils').MIXIN_NAMES;

const OPTIONS = Symbol('Loader#options');
const REQUIRE_COUNT = Symbol('Loader#requireCount');
const REQUIRE_FILE_STACKS = Symbol('Loader#requireFileStacks');
const JSON = Symbol('Loader#json');

class Loader {

    /**
     * Creates an instance of Loader.
     * @param {*} [options={}] - options
     * @param {AppInfo} options.appInfo - appInfo
     * @param {Timing} options.timing - timing
     * @param {Logger} options.logger - logger
     * @memberof Loader
     */
    constructor(options = {}) {
        assert(options.appInfo instanceof AppInfo, 'options.appInfo required, and must be a AppInfo');
        assert(options.timing, 'options.timing is required');
        assert(options.logger, 'options.logger is required');

        this[OPTIONS] = options;

        this[REQUIRE_COUNT] = 0;
        this[REQUIRE_FILE_STACKS] = [];

        // json
        this[JSON] = {
            baseDir: this.baseDir,
            env: this.env,
        };
    }

    /**
     * @return {AppCore} core
     */
    get app() {
        return this.appInfo.app;
    }

    /**
     * @return {String} baseDir
     */
    get baseDir() {
        return this.appInfo.baseDir;
    }

    /**
     * @return {String} env
     */
    get env() {
        return this.appInfo.env;
    }

    /**
     * @return {AppInfo} appinfo
     */
    get appInfo() {
        return this[OPTIONS].appInfo;
    }

    /**
     * @return {Timing} timing
     */
    get timing() {
        return this[OPTIONS].timing;
    }

    /**
     * @return {Loggor} loggor
     */
    get logger() {
        return this[OPTIONS].logger;
    }

    /**
     * @return {JSON} package.json
     */
    get pkg() {
        return this.appInfo.pkg;
    }


    /**
   * Load single file, will invoke when export is function
   *
   * @param {String} filepath - fullpath
   * @param {Array} arguments - pass rest arguments into the function when invoke
   * @return {Object} exports
   * @example
   * ```js
   * app.loader.loadFile(path.join(app.options.baseDir, 'config/router.js'));
   * ```
   */
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

        let ret = this.requireFile(filepath);
        ret = isFunction(ret) ? ret(...inject) : ret;
        return ret;
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

    resolveModule(filepath) {
        let fullPath;
        try {
            fullPath = require.resolve(filepath);
        } catch (e) {
            return undefined;
        }

        if (!fullPath.endsWith('.js') && !fullPath.endsWith('.json')) {
            return undefined;
        }

        return fullPath;
    }

    /**
     * 注册参数
     *
     * @param {String} name prop
     * @param {Object} target obj
     */
    _regiestMixin(name, target) {
        if (name in this) {
            this.logger.error(`App "${name}" redefined`);
            return;
        }
        utility.createReadOnlyProp(this, name, target);
        if (this[JSON]) {
            Object.assign(this[JSON], {
                [name]: target,
            });
        }
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
     *
     * Get all loadUnit
     *
     * loadUnit has a path and a type(app, framework, plugin).
     *
     * The order of the loadUnits:
     *
     * 1. plugin
     * 2. framework
     * 3. app
     *
     * @return {Array} loadUnits
     * @since 1.0.0
     */
    getLoadUnits() { // FIXME: 待修复，用来提供其它环境的根目录
        if (this.dirs) {
            return this.dirs;
        }

        const dirs = this.dirs = [];

        // if (this.orderPlugins) {
        //     for (const plugin of this.orderPlugins) {
        //         dirs.push({
        //             path: plugin.path,
        //             type: 'plugin',
        //         });
        //     }
        // }

        // // framework or egg path
        // for (const eggPath of this.eggPaths) {
        //     dirs.push({
        //         path: eggPath,
        //         type: 'framework',
        //     });
        // }

        // // application
        // dirs.push({
        //     path: this.options.baseDir,
        //     type: 'app',
        // });

        // debug('Loaded dirs %j', dirs);
        return dirs;
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
        return this[JSON];
    }

    /**
     * 手动加载
     */
    load() {
        const loaders = MIXIN_NAMES.map(name => {
            return require(`./mixin/${name}`);
        });

        for (const loader of loaders) {
            loader.apply(this);
        }
    }
}

module.exports = Loader;
