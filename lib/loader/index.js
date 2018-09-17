'use strict';

const assert = require('assert');
const utility = require('2o3t-utility');

const BaseLoader = require('../core/baseLoader');
const AppInfo = require('../core/appInfo');
const MIXIN_NAMES = require('../utils').MIXIN_NAMES;

const OPTIONS = Symbol('Loader#options');
const JSON = Symbol('Loader#json');

class Loader extends BaseLoader {

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

        const app = options.appInfo.app;
        super(app);

        this[OPTIONS] = options;

        // json
        this[JSON] = {
            baseDir: this.baseDir,
            env: this.env,
        };
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

    _loadDirMixins(name, cb) {
        let target = {};

        const appInfo = this.appInfo;
        const mixin = this.mixin;
        const MX = mixin[name];
        const dir = appInfo[`${name}Dir`];

        if (dir) {
            const mixins = MX.mixins;
            if (mixins && Array.isArray(mixins)) {

                const fileList = utility.mapDirsBreadth(dir, true);
                const filterFileList = this.filtersPath(fileList, this._getSupportFileType());

                if (filterFileList && filterFileList.length > 0) {
                // filter
                    target = cb(dir, mixins, filterFileList);
                }
            } else {
                this.logger.system.warn(`${name} "mixins" must be required !`);
            }
        }

        return target;
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
    run() {
        const loaders = MIXIN_NAMES.map(name => {
            return require(`./mixin/${name}`);
        });

        for (const loader of loaders) {
            loader.apply(this);
        }
    }
}

module.exports = Loader;
