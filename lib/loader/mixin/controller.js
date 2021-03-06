'use strict';

const utility = require('2o3t-utility');
const utils = require('../../utils');

const MAIN_NAME = 'controller';

const LOADER_CONTROLLER = Symbol('mixin#loader#controller');

// 提供 controller， 并全局注册配置

module.exports = function() {

    if (this[LOADER_CONTROLLER]) {
        return;
    }
    this[LOADER_CONTROLLER] = [];

    const target = this._loadDirMixinsFromFile(MAIN_NAME, (controllerDir, controllerMX, controllers, filterFileList) => {
        // filter
        const controllersMap = new Map();
        // FIXME: mixin = false 在这里不起作用, 被 plugin 植入了
        return this._parseMixinsSelectLoad(controllerDir, controllers, filterFileList, true)
            .filter(({ name }, index) => {
                // 去重复
                if (controllersMap.has(name)) {
                    this.logger.system.warn(`Controller '${name}' redefined`);
                    utility.spliceOne(controllers, index);
                    return false;
                }
                controllersMap.set(name, true);
                return true;
            })
            .reduce((obj, { name, file }) => {
                const opts = controllerMX[name];
                // 根据 opts 解析是否需要从 module 中加载文件
                file = this._praseModuleFileByOpts(opts, name, MAIN_NAME, file);
                if (!file) {
                    this.logger.system.warn(`Controller '${name}' not found`);
                    return obj;
                }
                try {
                    const o = this.loadControllerFile(file, opts);
                    if (o) {
                        this[LOADER_CONTROLLER].push(file);
                        const fn = utils.middleware(o);
                        name = utility.defaultCamelize2Str(name, 'upper');
                        return utility.extend(true, obj, {
                            [name]: fn,
                        });
                    }
                    this.logger.system.warn(`Controller '${name}' must be Class, eg: class '${name}'Controller {}`);
                } catch (error) {
                    throw error;
                }
                return obj;
            }, {});
    });

    this._regiestMixin(MAIN_NAME, target);
    this._regiestMixin(`_${MAIN_NAME}s`, Object.freeze(this[LOADER_CONTROLLER]));
};
