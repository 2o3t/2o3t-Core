'use strict';

const utility = require('2o3t-utility');
const utils = require('../../utils');

const MAIN_NAME = 'helper';

const LOADER_HELPER = Symbol('mixin#loader#helper');

// 提供 helper 并全局注册配置

module.exports = function() {

    if (this[LOADER_HELPER]) {
        return;
    }
    this[LOADER_HELPER] = [];

    const target = this._loadDirMixinsFromDirs(MAIN_NAME, (helperDir, helperMX, helpers, fileList) => {
        // filter
        const helpersMap = new Map();

        return this._parseMixinsSelectLoad(helperDir, helpers, fileList, true)
            .filter(({ name }, index) => {
                // 去重复
                if (helpersMap.has(name)) {
                    this.logger.system.warn(`Helper '${name}' redefined`);
                    utility.spliceOne(helpers, index);
                    return false;
                }
                helpersMap.set(name, true);
                return true;
            }).reduce((obj, { name, file }) => {
                const opts = helperMX[name];
                // 根据 opts 解析是否需要从 module 中加载文件
                file = this._praseModuleFileByOpts(opts, name, MAIN_NAME, file);
                if (!file) {
                    this.logger.system.warn(`Helper '${name}' not found`);
                    return obj;
                }
                try {
                    const o = this.loadFile(file, opts);
                    if (o) {
                        this[LOADER_HELPER].push(file);
                        const fn = utils.middleware(o);
                        name = utility.defaultCamelize2Str(name, 'modules');
                        return utility.extend(true, obj, {
                            [name]: fn,
                        });
                    }
                    this.logger.system.warn(`Helper '${name}' must be return 'function(){}' or '{}'`);
                } catch (error) {
                    throw error;
                }
                return obj;
            }, {});
    });

    this._regiestMixin(MAIN_NAME, target);
    this._regiestMixin(`_${MAIN_NAME}s`, Object.freeze(this[LOADER_HELPER]));
};
