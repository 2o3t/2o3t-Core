'use strict';

const utility = require('2o3t-utility');
const utils = require('../../utils');

const LOADER_MIDDLEWARE = Symbol('mixin#loader#middleware');

// 提供中间件， 并可进行全局的注册配置

module.exports = function() {
    const app = this.app;
    const appInfo = this.appInfo;
    const mixin = this.mixin;
    const middleware = mixin.middleware;

    const middlewareDir = appInfo.middlewareDir;
    this.logger.debug(`middlewareDir = ${middlewareDir}`);

    if (this[LOADER_MIDDLEWARE]) {
        return;
    }
    this[LOADER_MIDDLEWARE] = [];

    let target = {};

    if (middlewareDir) {
        const middlewares = middleware.mixins;
        if (middlewares && Array.isArray(middlewares)) {

            const fileList = utility.mapDirsBreadth(middlewareDir, true);
            const filterFileList = this.filtersPath(fileList, this._getSupportFileType());

            if (filterFileList && filterFileList.length > 0) {
                // filter
                const middlewaresMap = new Map();
                target = middlewares.map(name => {
                    const reg = utils.createFileRegExp(name);
                    const file = filterFileList.find(file => {
                        return reg.test(file);
                    });
                    if (!file) {
                        this.logger.system.warn(`Middleware ${name} not found`);
                    }
                    return {
                        name, file,
                    };
                }).filter(({ name }) => {
                    // 去重复
                    if (middlewaresMap.has(name)) {
                        this.logger.system.warn(`Middleware ${name} redefined`);
                        return false;
                    }
                    middlewaresMap.set(name, true);
                    return true;
                }).reduce((obj, { name, file }) => {
                    const opts = middleware[name];
                    const o = this.loadFile(file, opts);
                    if (o) {
                        this[LOADER_MIDDLEWARE].push(file);
                        const fn = utils.middleware(o);
                        name = utility.defaultCamelize2Str(name, 'camel');
                        return utility.extend(true, obj, {
                            [name]: fn,
                        });
                    }
                    return obj;
                }, {});
            }
        }

    } else {
        this.logger.system.warn('Middleware "mixins" must be required !');
    }

    this._regiestMixin('middleware', target);
    this._regiestMixin('_middlewares', Object.freeze(this[LOADER_MIDDLEWARE]));

    // TODO: ? how to do app.use()
};

