'use strict';

const utility = require('2o3t-utility');
const utils = require('../../utils');
const fs = require('fs');

const MAIN_NAME = 'plugin';

const LOADER_PLUGIN = Symbol('mixin#loader#plugin');
const LOADER_MODULE = Symbol('mixin#loader#module');

module.exports = function() {

    if (this[LOADER_PLUGIN]) {
        return;
    }
    this[LOADER_PLUGIN] = [];

    const mixin = this.mixin;

    // ZAP: 能力需要增强
    const target = this._loadDirMixinsFromDirs(MAIN_NAME, (pluginDir, pluginMX, plugins, fileList) => {
        // filter
        const pluginsMap = new Map();

        return plugins.map(name => {
            const reg = utils.createFileRegExp(name);
            let fromModule = false;
            let file = fileList.find(file => {
                // 增强能力
                try {
                    if (file && fs.existsSync(file) && fs.statSync(file).isDirectory()) {
                        fromModule = true; // 认为是一个独立的module
                    }
                } catch (error) {
                    this.logger.system.warn('Plugin load some error!');
                }
                return reg.test(file);
            });
            if (!file) {
                file = this.resolveModule(name);
                if (file) {
                    fromModule = true;
                }
            }
            return {
                name, file, fromModule,
            };
        }).filter(({ name }, index) => {
            // 去重复
            if (pluginsMap.has(name)) {
                this.logger.system.warn(`Plugin '${name}' redefined`);
                utility.spliceOne(plugins, index);
                return false;
            }
            pluginsMap.set(name, true);
            return true;
        }).reduce((obj, { name, file, fromModule }) => {
            if (!file) {
                this.logger.system.warn(`Plugin '${name}' not found`);
                return obj;
            }
            if (fromModule) { // 来自 module
                const moduleConfigs = this.resolveModuleConfigs(file);
                if (Array.isArray(moduleConfigs) && moduleConfigs.length > 0) {
                    const config = moduleConfigs.reduce((obj, file) => {
                        const config = this.loadFile(file);
                        if (config) {
                            pushLoadModule.call(this, file.replace(/\/config(s)?\/.*$/ig, '/'));
                            return utility.extend(true, obj, config);
                        }
                        return obj;
                    }, {});
                    // 重新覆盖
                    pluginMX[name] = utility.extend(true, config, pluginMX[name]);
                }
            }
            const opts = pluginMX[name];
            try {
                // FIXME: 需要对属性参数进行处理
                const o = this.loadFile(file, opts);
                name = utility.defaultCamelize2Str(name, 'modules');
                // 加载合并 mixin
                if (opts && typeof opts === 'object') {
                    for (const key in opts) {
                        if (opts.hasOwnProperty(key)) {
                            if (key === MAIN_NAME || key === 'config') {
                                continue;
                            }
                            const item = opts[key];
                            // TODO: 处理各个数据增加 , { module: fromModule, }
                            if (item.mixins && Array.isArray(item.mixins)) {
                                item.mixins.forEach(name => {
                                    if (item[name]) {
                                        item[name]._fromModule = fromModule;
                                        if (fromModule) {
                                            item[name]._modulePath = file;
                                        }
                                    }
                                });
                            }
                            if (mixin[key] && typeof item === 'object') {
                                utility.extendEx(true, mixin[key], item);
                            }
                        }
                    }
                }

                this[LOADER_PLUGIN].push(file);
                const fn = utils.middleware(o);
                return utility.extend(true, obj, {
                    [name]: fn,
                });
            } catch (error) {
                throw error;
            }
        }, {});
    });

    this._regiestMixin(MAIN_NAME, target);
    this._regiestMixin(`_${MAIN_NAME}s`, Object.freeze(this[LOADER_PLUGIN]));

    // TODO: ? how to do use?

    this._regiestMixin('_modules', Object.freeze(this[LOADER_MODULE]));
};

// 记录 loader module
function pushLoadModule(filepath) {
    if (!this[LOADER_MODULE]) {
        this[LOADER_MODULE] = [];
    }
    this[LOADER_MODULE].push(filepath);
}
