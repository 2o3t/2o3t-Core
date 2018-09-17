'use strict';

const utility = require('2o3t-utility');
const isFunction = utility.is.function;
const utils = require('../../utils');

const LOADER_CONTROLLER = Symbol('mixin#loader#controller');

// 提供 controller， 并全局注册配置

module.exports = function() {

    if (this[LOADER_CONTROLLER]) {
        return;
    }
    this[LOADER_CONTROLLER] = [];

    const appInfo = this.appInfo;
    const mixin = this.mixin;
    const controllerMX = mixin.controller;
    const controllerDir = appInfo.controllerDir;

    // 获取配置
    const controllerConfig = this._getConfigurations('controller');
    utility.extendEx(true, controllerMX, controllerConfig);

    let target = {};

    if (controllerDir) {
        const controllers = controllerMX.mixins;
        if (controllers && Array.isArray(controllers)) {

            const fileList = utility.mapDirsBreadth(controllerDir, true);
            const filterFileList = this.filtersPath(fileList, this._getSupportFileType());

            if (filterFileList && filterFileList.length > 0) {
                // filter
                const controllersMap = new Map();
                target = controllers.map(name => {
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
                    if (controllersMap.has(name)) {
                        this.logger.system.warn(`Controller '${name}' redefined`);
                        return false;
                    }
                    controllersMap.set(name, true);
                    return true;
                }).reduce((obj, { name, file }) => {
                    if (!file) {
                        this.logger.system.warn(`Controller '${name}' not found`);
                        return obj;
                    }
                    const opts = controllerMX[name];
                    try {
                        const o = this.loadControllerFile(file, opts);
                        if (o) {
                            this[LOADER_CONTROLLER].push(file);
                            name = utility.defaultCamelize2Str(name, 'modules');
                            return utility.extend(true, obj, {
                                [name]: o,
                            });
                        }
                        this.logger.system.warn(`Controller '${name}' must be Class, eg: class '${name}'Controller {}`);
                    } catch (error) {
                        throw error;
                    }
                    return obj;
                }, {});
            }
        } else {
            this.logger.system.warn('Controller "mixins" must be required !');
        }
    }

    this._regiestMixin('controller', target);
    this._regiestMixin('_controllers', Object.freeze(this[LOADER_CONTROLLER]));
};
