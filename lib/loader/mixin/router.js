'use strict';

const utility = require('2o3t-utility');
const utils = require('../../utils');
const is = utility.is;
const isFunction = is.function;

const LOADER_ROUTER = Symbol('mixin#loader#router');

module.exports = function() {

    if (this[LOADER_ROUTER]) {
        return;
    }
    this[LOADER_ROUTER] = [];

    const app = this.app;
    const appRouter = app.router;
    const appInfo = this.appInfo;
    const mixin = this.mixin;
    const routerMX = mixin.router;
    const routerDir = appInfo.routerDir;

    // 获取配置
    const routerConfig = this._getConfigurations('router');
    utility.extendEx(true, routerMX, routerConfig);

    let target = {};

    this.timing.start('Load Router');
    if (routerDir) {
        const routers = routerMX.mixins;

        if (routers && Array.isArray(routers)) {

            const fileList = utility.mapDirsBreadth(routerDir, true);
            const filterFileList = this.filtersPath(fileList, this._getSupportFileType());

            let onlyOneLoadModeSucceeded = false;
            // 模式一： 单文件 index.js
            if (filterFileList && filterFileList.length === 1) {
                const rp = this.resolveModule(routerDir);
                if (rp) {
                    // 加载 router.js
                    const o = this.loadFile(rp);
                    this.logger.warn(o);
                    onlyOneLoadModeSucceeded = true;
                }
            }
            // 模式二
            if (!onlyOneLoadModeSucceeded && filterFileList && filterFileList.length > 0) {
                // filter
                const routersMap = new Map();
                target = routers.map(name => {
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
                    if (routersMap.has(name)) {
                        this.logger.system.warn(`Router '${name}' redefined`);
                        return false;
                    }
                    routersMap.set(name, true);
                    return true;
                }).reduce((obj, { name, file }) => {
                    if (!file) {
                        this.logger.system.warn(`Router '${name}' not found`);
                        return obj;
                    }
                    const opts = routerMX[name];
                    try {
                        if (opts && is.array(opts.middlewares) && is.string(opts.prefix)) {
                            // 产生新的路由分支，并自动注册
                            const subRouter = appRouter.new(name);
                            const o = this.loadRouterFile(file, subRouter, opts);
                            if (o && o[utils.ROUTER_NAME] === true) {
                                // 判断参数
                                if (opts && opts.middlewares) {
                                    const ms = opts.middlewares.filter(name => {
                                        const fn = this.middleware[name];
                                        return fn && isFunction(fn);
                                    }).map(name => {
                                        return this.middleware[name];
                                    });
                                    if (opts.prefix) {
                                        appRouter.use(opts.prefix, ...ms, o.routes());
                                    } else {
                                        appRouter.use(...ms, o.routes());
                                    }
                                } else if (opts && opts.prefix) {
                                    appRouter.use(opts.prefix, o.routes());
                                } else {
                                    appRouter.use(o.routes());
                                }
                            }
                        } else {
                            const o = this.loadRouterFile(file, appRouter, opts);
                            if (o && o[utils.ROUTER_NAME] === true) {
                                // 根路由，不处理
                            }
                        }
                        this[LOADER_ROUTER].push(file);
                        name = utility.defaultCamelize2Str(name, 'modules');
                        return utility.extend(true, obj, {
                            [name]: utility.mapCleanObject(opts, [
                                'middlewares', 'path',
                            ]),
                        });
                    } catch (error) {
                        throw error;
                    }
                }, {});

            }

        } else {
            this.logger.system.warn('Router "mixins" must be required !');
        }
    }

    this._regiestMixin('router', target);
    this._regiestMixin('_routers', Object.freeze(this[LOADER_ROUTER]));


    this.timing.end('Load Router');
};
