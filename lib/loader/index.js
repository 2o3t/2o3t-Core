'use strict';

const assert = require('assert');
const utility = require('2o3t-utility');

const BaseLoader = require('../core/base/baseLoader');
const AppInfo = require('../core/appInfo');
const utils = require('../utils');
const MIXIN_NAMES = utils.MIXIN_NAMES;

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

    /**
     * 加载当前目录的文件及文件夹
     *
     * @param {String} name 类型
     * @param {Function} cb 回调
     * @return {Object} target
     */
    _loadDirMixinsFromDirs(name, cb) {
        this.timing.start(`Load Dir Files ${name}`);

        const appInfo = this.appInfo;
        const mixin = this.mixin;
        const MX = mixin[name];
        const dir = appInfo[`${name}Dir`];

        // 获取配置
        const config = this._getConfigurations(name);
        utility.extendEx(true, MX, config);

        let target = {};
        const mixins = MX.mixins;
        if (mixins && Array.isArray(mixins)) {
            if (dir) {
                const fileList = utility.mapDirs(dir) || [];

                if (fileList && Array.isArray(fileList)) {
                    // filter
                    target = cb(dir, MX, mixins, fileList);
                }
            }

        } else {
            this.logger.system.error(`${utility.defaultCamelize2Str(name, 'upper')} "mixins" must be required !`);
        }
        this.timing.end(`Load Dir Files ${name}`);
        return target;
    }

    /**
     * 根据类型加载文件
     *
     * @param {String} name 类型
     * @param {Function} cb 回调
     * @return {Object} target
     */
    _loadDirMixinsFromFile(name, cb) {
        this.timing.start(`Load Dir Files ${name}`);

        const appInfo = this.appInfo;
        const mixin = this.mixin;
        const MX = mixin[name];
        const dir = appInfo[`${name}Dir`];

        // 获取配置
        const config = this._getConfigurations(name);
        utility.extendEx(true, MX, config);

        let target = {};
        const mixins = MX.mixins;
        if (mixins && Array.isArray(mixins)) {
            if (dir) {
                const fileList = utility.mapDirsFileBreadth(dir, true) || [];
                const filterFileList = this.filtersPath(fileList, this._getSupportFileType()) || [];

                if (filterFileList && Array.isArray(filterFileList)) {
                    // filter
                    target = cb(dir, MX, mixins, filterFileList);
                }
            }
        } else {
            this.logger.system.error(`${utility.defaultCamelize2Str(name, 'upper')} "mixins" must be required !`);
        }

        this.timing.end(`Load Dir Files ${name}`);
        return target;
    }


    /**
     * 判断mixin，决定是否全加载
     *
     * @param {String} baseDir dir
     * @param {Array} mixins mixins
     * @param {Array} filterFileList filelist
     * @param {Boolean} [force=false] 强制全部
     * @return {Array} fileObj
     */
    _parseMixinsSelectLoad(baseDir, mixins, filterFileList, force = false) {
        if (!mixins || !Array.isArray(mixins)) return [];
        if (!force) {
            if (mixins.length <= 0) {
                return filterFileList.map(file => {
                    const name = utility.defaultCamelize2Str(utility.getResolvedFilename(file, baseDir));
                    // const name = utility.defaultCamelize2Str(file.replace(baseDir, '').replace(/^(\/)+/igm, ''));
                    mixins.push(name);
                    return {
                        name,
                        file,
                    };
                });
            }
            return mixins.map(name => {
                const reg = utils.createFileRegExp(name);
                let file = filterFileList.find(file => {
                    return reg.test(file);
                });
                if (!file) {
                    file = this.resolveModule(name);
                }
                return {
                    name,
                    file,
                };
            });
        }

        const copyMixins = [].concat(mixins);
        const tempFileMap = {};
        const fileMap = filterFileList.map(file => {
            const name = utility.defaultCamelize2Str(utility.getResolvedFilename(file, baseDir));
            // const name = utility.defaultCamelize2Str(file.replace(baseDir, '').replace(/^(\/)+/igm, ''));
            tempFileMap[name] = file;
            if (!mixins.includes(name)) {
                mixins.push(name);
            }
            if (copyMixins.includes(name)) { // 去重复
                return null;
            }
            return {
                name,
                file,
            };
        }).filter(item => {
            return !!item;
        });

        // first mixins, 保证顺序
        return copyMixins.map(name => {
            let file = tempFileMap[name];
            if (!file) {
                file = this.resolveModule(name);
            }
            return {
                name,
                file,
            };
        }).concat(fileMap);
    }

    /**
     * 按名称从 module 中解析文件路径
     *
     * @param {Object} opts 参数
     * @param {String} name 文件名
     * @param {String} type 类型名称
     * @param {String} [file] 文件路径
     * @return {String} 路径
     */
    _praseModuleFileByOpts(opts, name, type, file) {
        if (opts && opts._fromModule && opts._modulePath) { // 从 module 中加载
            const files = this.resolveModuleFiles(opts._modulePath, type);
            const reg = new RegExp(`\/${name}\.js`, 'i');
            const f = files.filter(p => {
                return String.prototype.match.call(p, reg);
            })[0];
            if (!f) {
                delete opts._fromModule;
                delete opts._modulePath;
            } else {
                opts._modulePath = f;
                file = f;
            }
        }
        if (opts && (!opts._fromModule || !opts._modulePath)) {
            delete opts._fromModule;
            delete opts._modulePath;
        }
        return file;
    }

    /**
     *
     * Get all loadUnit
     *
     * @return {Array} loadUnits
     */
    getLoadUnits() {
        if (this[OPTIONS].loadUnitDirs) {
            return this[OPTIONS].loadUnitDirs;
        }

        const dirs = this[OPTIONS].loadUnitDirs = [];

        MIXIN_NAMES.forEach(name => {
            const key = `_${name}s`;
            if (this[key]) {
                for (const p of this[key]) {
                    dirs.push({
                        path: p,
                        type: name,
                    });
                }
            }
        });

        // plugin path
        if (this._modules) {
            for (const p of this._modules) {
                dirs.push({
                    path: p,
                    type: 'module',
                });
            }
        }

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
