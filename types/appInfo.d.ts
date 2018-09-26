import AppCore from './index';

declare class AppInfo {
    /**
     * @return {AppCore} core
     */
    app: AppCore

    /**
     * @return {Logger} logger
     */
    logger: Logger

    /**
     * @return {String} baseDir
     */
    baseDir: string;

    /**
     * @return {Object} package.json
     */
    pkg: Object;

    /**
     * @return {String} app name
     */
    name: string;

    /**
     * @return {String} env name
     */
    env: string;

    /**
     * @return {String} env name
     */
    scope: string;

    /**
     * @return {Object} env config
     */
    envConfig: Object;


    // Other API

    /**
     * @return {Array} list
     */
    loggerAllows: string[];

    /**
     * @return {Array} list
     */
    loggerBans: string[];

    toJSON(): Object;
}

export as namespace AppInfo;
export = AppInfo;
