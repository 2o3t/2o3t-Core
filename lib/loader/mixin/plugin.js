'use strict';

const utility = require('2o3t-utility');
const utils = require('../../utils');

const LOADER_PLUGIN = Symbol('mixin#loader#plugin');

module.exports = function() {

    if (this[LOADER_PLUGIN]) {
        return;
    }
    this[LOADER_PLUGIN] = [];

    const appInfo = this.appInfo;
    const mixin = this.mixin;
    const pluginMX = mixin.plugin;
    const pluginDir = appInfo.pluginDir;

    // 获取配置
    const pluginConfig = this._getConfigurations('plugin');
    utility.extendEx(true, pluginMX, pluginConfig);

    let target = {};

    if (pluginDir) {
        const plugins = pluginMX.mixins;
        if (plugins && Array.isArray(plugins)) {
            const fileList = utility.mapDirsBreadth(pluginDir, true);
            const filterFileList = this.filtersPath(fileList, this._getSupportFileType());

            if (filterFileList && filterFileList.length > 0) {
                // filter
                const pluginsMap = new Map();

                target = plugins.map(name => {
                    const reg = utils.createFileRegExp(name);
                    let file = filterFileList.find(file => {
                        return reg.test(file);
                    });
                    if (!file) {
                        file = this.resolveModule(name);
                    }
                    return {
                        name, file,
                    };
                }).filter(({ name }) => {
                    // 去重复
                    if (pluginsMap.has(name)) {
                        this.logger.system.warn(`Plugin '${name}' redefined`);
                        return false;
                    }
                    pluginsMap.set(name, true);
                    return true;
                }).reduce((obj, { name, file }) => {
                    if (!file) {
                        this.logger.system.warn(`Plugin '${name}' not found`);
                        return obj;
                    }
                    const opts = pluginMX[name];
                    // FIXME: 需要对属性参数进行处理
                    try {
                        const o = this.loadFile(file, opts);
                        name = utility.defaultCamelize2Str(name, 'modules');
                        // 加载合并 mixin
                        if (opts && typeof opts === 'object') {
                            for (const key in opts) {
                                if (opts.hasOwnProperty(key)) {
                                    const item = opts[key];
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
            }

        } else {
            this.logger.system.warn('Plugin "mixins" must be required !');
        }
    }

    this._regiestMixin('plugin', target);
    this._regiestMixin('_plugins', Object.freeze(this[LOADER_PLUGIN]));

    // TODO: ? how to do use?
};
