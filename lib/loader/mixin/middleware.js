'use strict';

const utility = require('2o3t-utility');
const isFunction = utility.is.function;
const utils = require('../../utils');

const MAIN_NAME = 'middleware';

const LOADER_MIDDLEWARE = Symbol('mixin#loader#middleware');

// 提供中间件， 并可进行全局的注册配置

module.exports = function() {

    if (this[LOADER_MIDDLEWARE]) {
        return;
    }
    this[LOADER_MIDDLEWARE] = [];

    const app = this.app;

    const target = this._loadDirMixinsFromFile(MAIN_NAME, (middlewareDir, middlewareMX, middlewares, filterFileList) => {
        // filter
        const middlewaresMap = new Map();
        // return middlewares.map(name => {
        //     const reg = utils.createFileRegExp(name);
        //     let file = filterFileList.find(file => {
        //         return reg.test(file);
        //     });
        //     if (!file) {
        //         file = this.resolveModule(name);
        //     }
        //     return {
        //         name, file,
        //     };
        // })
        const _orders = middlewareMX._orders = utility.dedupeArray([].concat(middlewares));
        return this._parseMixinsSelectLoad(middlewareDir, middlewares, filterFileList, true)
            .filter(({ name }, index) => {
            // 去重复
                if (middlewaresMap.has(name)) {
                    this.logger.system.warn(`Middleware '${name}' redefined`);
                    utility.spliceOne(middlewares, index);
                    return false;
                }
                middlewaresMap.set(name, true);
                return true;
            }).reduce((obj, { name, file }) => {
                const opts = middlewareMX[name];
                // 根据 opts 解析是否需要从 module 中加载文件
                file = this._praseModuleFileByOpts(opts, name, MAIN_NAME, file);
                if (!file) {
                    this.logger.system.warn(`Middleware '${name}' not found`);
                    return obj;
                }
                try {
                    const o = this.loadMiddlewareFile(file, opts);
                    if (o && isFunction(o)) {
                        this[LOADER_MIDDLEWARE].push(file);
                        const fn = utils.middleware(o);
                        fn[utils.MIDDLEWARE_NAME] = name;
                        name = utility.defaultCamelize2Str(name, 'modules');

                        if (opts && opts.enable === true || _orders.includes(name)) {
                        // do app.use();
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
    });

    this._regiestMixin(MAIN_NAME, target);
    this._regiestMixin(`_${MAIN_NAME}s`, Object.freeze(this[LOADER_MIDDLEWARE]));
};

