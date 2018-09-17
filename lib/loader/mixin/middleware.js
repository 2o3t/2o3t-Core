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

    const target = this._loadDirMixinsFromFile('middleware', (middlewareDir, middlewareMX, middlewares, filterFileList) => {
        // filter
        const middlewaresMap = new Map();
        return middlewares.map(name => {
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

    this._regiestMixin('middleware', target);
    this._regiestMixin('_middlewares', Object.freeze(this[LOADER_MIDDLEWARE]));
};

