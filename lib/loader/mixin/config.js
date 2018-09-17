'use strict';

const utility = require('2o3t-utility');
const utils = require('../../utils');

const MIXIN_NAMES = utils.MIXIN_NAMES;
const LOADER_CONFIG = Symbol('mixin#loader#config');

/**
 * Will merge config(s)/default.js 和 config(s)/${process.env.NODE_ENV}.js
 * 如果有特殊增加，则在 ${process.env.EXTEND_CONFIGS} 中配置，并以 ， 分割。
 * eg: EXTEND_CONFIGS=localhost,aaa,bbb
 * 文件必须与config同级，类型可为: [js|json]
 * 优先级： default > {SCOPE}  > {NODE_ENV} > {OTHERS_CONFIGS}
 *
 *
 * eg:
 * '/configs/default.js',
 * '/configs/development.js',
 * '/configs/plugin.default.js',
 * '/configs/plugin.development.js',
 * '/configs/middlewares.default.js',
 * '/configs/middlewares.development.js',
 */
module.exports = function() {

    if (this[LOADER_CONFIG]) {
        return;
    }
    this[LOADER_CONFIG] = [];

    const appInfo = this.appInfo;
    const env = appInfo.env;
    const scope = appInfo.scope;
    const configDir = appInfo.configDir;

    let target = {};

    if (configDir) {
        const fileList = utility.mapDirsBreadth(configDir, true);
        const filterFileList = this.filtersPath(fileList, this._getSupportFileType());
        // 注册配置方法
        utility.createReadOnlyProp(this, '_getConfigurations', _getConfigurations.bind(this, filterFileList, env, scope), false);

        if (filterFileList && filterFileList.length > 0) {
            // 默认加载通用配置文件
            const defaultRegExp = createAllFilesType(null, env, scope);
            // filter
            target = filterFileList.filter(file => {
                return defaultRegExp.some(reg => {
                    return reg.test(file);
                });
            }).reduce((obj, file) => {
                const o = this.loadFile(file);
                if (o) {
                    this[LOADER_CONFIG].push(file);
                    return utility.extend(true, obj, o);
                }
                return obj;
            }, {});

            // 加载其它配置文件
            // Get all plugin configurations
            // plugin.default.js
            // plugin.${scope}.js
            // plugin.${env}.js
            // plugin.${scope}_${env}.js
            // const othersRegs = MIXIN_NAMES.filter(name => name !== 'config').map(name => {
            //     return {
            //         name, regs: createAllFilesType(`${name}(s)?`, env),
            //     };
            // });
            // othersConfig = othersRegs.reduce((array, { name, regs }) => {
            //     const fileObjs = filterFileList.reduce((arr, file) => {
            //         const reg = regs.find(reg => {
            //             return reg.test(file);
            //         });
            //         if (reg) {
            //             return arr.concat({
            //                 name, file, reg,
            //             });
            //         }
            //         return arr;
            //     }, []);
            //     return array.concat(fileObjs);
            // }, []).reduce((obj, { name, file }) => {
            //     const o = this.loadFile(file);
            //     if (o) {
            //         this[LOADER_CONFIG].push(file);
            //     }
            //     return utility.extend(true, obj, {
            //         [name]: checkMustProps(o),
            //     });
            // }, {});
        }
    }

    this._regiestMixin('config', target);
    this._regiestMixin('_configs', this[LOADER_CONFIG]);

    // init _regiestMixin
    if (!this.mixin) {
        const othersConfigs = MIXIN_NAMES.filter(name => name !== 'config').reduce((obj, name) => {
            return Object.assign(obj, {
                [name]: {
                    mixins: [],
                },
            });
        }, {});
        utility.createReadOnlyProp(this, 'mixin', othersConfigs);
    }
};

// Get all plugin configurations
// plugin.default.js
// plugin.${scope}.js
// plugin.${env}.js
// plugin.${scope}_${env}.js
function createAllFilesType(name, env, scope) {
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

function checkMustProps(config) {
    if (!config) {
        config = {};
    }
    return config;
}

// 加载其它配置文件
// Get all plugin configurations
// plugin.default.js
// plugin.${scope}.js
// plugin.${env}.js
// plugin.${scope}_${env}.js
function _getConfigurations(filterFileList, env, scope, type) {
    let othersConfig = {};
    if (filterFileList && filterFileList.length > 0) {
        if (MIXIN_NAMES.includes(type)) {
            const { name, regs } = {
                name: type,
                regs: createAllFilesType(`${type}(s)?`, env, scope),
            };
            othersConfig = filterFileList.reduce((arr, file) => {
                const reg = regs.find(reg => {
                    return reg.test(file);
                });
                if (reg) {
                    return arr.concat({
                        name, file, reg,
                    });
                }
                return arr;
            }, []).reduce((obj, { file }) => {
                const o = this.loadFile(file);
                if (o) {
                    this[LOADER_CONFIG].push(file);
                }
                return utility.extend(true, obj, checkMustProps(o));
            }, {});
        }
    }
    return othersConfig;
}
