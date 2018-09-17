'use strict';

const utility = require('2o3t-utility');
const isFunction = utility.is.function;
const utils = require('../../utils');

const LOADER_MIDDLEWARE = Symbol('mixin#loader#middleware');

// 提供中间件， 并可进行全局的注册配置

module.exports = function() {

    if (this[LOADER_MIDDLEWARE]) {
        return;
    }
    this[LOADER_MIDDLEWARE] = [];

    const app = this.app;
    const appInfo = this.appInfo;
    const mixin = this.mixin;
    const middlewareMX = mixin.middleware;
    const middlewareDir = appInfo.middlewareDir;

    // 获取配置
    const middlewareConfig = this._getConfigurations('middleware');
    utility.extendEx(true, middlewareMX, middlewareConfig);

    let target = {};

    if (middlewareDir) {
        const middlewares = middlewareMX.mixins;
        if (middlewares && Array.isArray(middlewares)) {

            const fileList = utility.mapDirsBreadth(middlewareDir, true);
            const filterFileList = this.filtersPath(fileList, this._getSupportFileType());

            if (filterFileList && filterFileList.length > 0) {
                // filter
                const middlewaresMap = new Map();
                target = middlewares.map(name => {
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
                    if (middlewaresMap.has(name)) {
                        this.logger.system.warn(`Middleware '${name}' redefined`);
                        return false;
                    }
                    middlewaresMap.set(name, true);
                    return true;
                }).reduce((obj, { name, file }) => {
                    if (!file) {
                        this.logger.system.warn(`Middleware '${name}' not found`);
                        return obj;
                    }
                    const opts = middlewareMX[name];
                    try {
                        const o = this.loadMiddlewareFile(file, opts);
                        if (o && isFunction(o)) {
                            this[LOADER_MIDDLEWARE].push(file);
                            const fn = utils.middleware(o);
                            fn[utils.MIDDLEWARE_NAME] = name;
                            name = utility.defaultCamelize2Str(name, 'modules');

                            if (opts && opts.enable === true) {
                                app.use(fn);
                            }

                            return utility.extend(true, obj, {
                                [name]: fn,
                            });
                        }
                        this.logger.system.warn(`Middleware '${name}' must be return function(){}`);
                    } catch (error) {
                        throw new TypeError(error);
                    }
                    return obj;
                }, {});
            }
        } else {
            this.logger.system.warn('Middleware "mixins" must be required !');
        }
    }

    this._regiestMixin('middleware', target);
    this._regiestMixin('_middlewares', Object.freeze(this[LOADER_MIDDLEWARE]));
};

