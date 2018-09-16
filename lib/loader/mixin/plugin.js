'use strict';

const utility = require('2o3t-utility');
const utils = require('../../utils');

const LOADER_PLUGIN = Symbol('mixin#loader#plugin');

module.exports = function() {
    const app = this.app;
    const appInfo = this.appInfo;
    const mixin = this.mixin;
    const plugin = mixin.plugin;

    const pluginDir = appInfo.pluginDir;
    this.logger.debug(`pluginDir = ${pluginDir}`);

    if (this[LOADER_PLUGIN]) {
        return;
    }
    this[LOADER_PLUGIN] = [];

    let target = {};

    if (pluginDir) {
        const plugins = plugin.mixins;
        if (plugins && Array.isArray(plugins)) {
            const fileList = utility.mapDirsBreadth(pluginDir, true);
            const filterFileList = this.filtersPath(fileList, this._getSupportFileType());

            if (filterFileList && filterFileList.length > 0) {
                // filter
                const pluginsMap = new Map();

                // // plugin_name: false
                // if (typeof plugin === 'boolean') {
                //     plugins[name] = {
                //         name,
                //         enable: plugin,
                //         dependencies: [],
                //         optionalDependencies: [],
                //         env: [],
                //         from: configPath,
                //     };
                //     return;
                // }

                target = plugins.map(name => {
                    const reg = utils.createFileRegExp(name);
                    const file = filterFileList.find(file => {
                        return reg.test(file);
                    });
                    if (!file) {
                        this.logger.system.warn(`Plugin ${name} not found`);
                    }
                    return {
                        name, file,
                    };
                }).filter(({ name }) => {
                    // 去重复
                    if (pluginsMap.has(name)) {
                        this.logger.system.warn(`Plugin ${name} redefined`);
                        return false;
                    }
                    pluginsMap.set(name, true);
                    return true;
                }).reduce((obj, { name, file }) => {
                    const opts = plugin[name];

                    // FIXME: 需要对属性参数进行处理

                    const o = this.loadFile(file, opts);
                    if (o) {
                        this[LOADER_PLUGIN].push(file);
                        const fn = utils.middleware(o);
                        name = utility.defaultCamelize2Str(name, 'camel');
                        return utility.extend(true, obj, {
                            [name]: fn,
                        });
                    }
                    return obj;
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
