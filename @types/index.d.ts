import KoaApplication from "koa";
import KoaRouter from "koa-router";
import Logger from "2o3t-logger";
import AppInfo from './appInfo';

interface Loader {}

interface ProxyTarget {
    target: string;
    changeOrigin?: boolean;
    ws?: boolean;
    // '^/api/old-path': '/api/new-path', // rewrite path
    // '^/api/remove/path': '/path', // remove base path
    pathRewrite?: Object | Function;
}

declare class Router extends KoaRouter {
    name: string;
    loader: Loader;
    logger: Logger;
    new(name: string): Router;
    resources(name: string, prefix: string, middlewares: Array<KoaRouter.IMiddleware>): Router;
    proxy(name:string, path: string, middleware: Array<KoaRouter.IMiddleware>, target: string | ProxyTarget): Router;
    pathFor(name: string, params: Object);
    toJSON(); Array;
    toString(): string;
}

interface Timing {
    start(name: string): Object;
    end(name: string): Object;
    toJSON(): Object;
}

declare namespace AppCore {

    export interface Options {
        baseDir: string;
        configDir: string;
        pluginsDir: string;
        helperDir: string;
        middlewareDir: string;
        routerDir: string;
        controllerDir: string;
        serviceDir: string;
        logger?: Logger;
    }
}

declare class AppCore extends KoaApplication {
    constructor(parameters: AppCore.Options);

    timing: Timing;
    baseDir: string;
    logger: Logger;
    rootFilePath: string;
    rootDir: string;
    router: Router;
    appInfo: AppInfo;
    loader: Loader;
    config: Object;
    sleep(time: Number): void;
    beforeStart(scope: Function): void;
    toJSON(): Object;

    ready(callback: Function): void;

    // loader
    loadConfig: Object;
    loadPlugin: Object;
    loadHelper: Object;
    loadService: Object;
    loadMiddleware: Object;
    loadController: Object;
    loadRouter: Object;
}


export = AppCore;
