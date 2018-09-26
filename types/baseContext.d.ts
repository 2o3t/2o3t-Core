import Logger from "2o3t-logger";
import AppInfo from './appInfo';

declare class BaseContext {

    options: Object;

    /**
     * @member {AppInfo} appInfo
     */
    appInfo: AppInfo;

    /**
     * @member {Config} config
     */
    config: Object;

    /**
     * @member {Plugin} plugin
     */
    plugin: Object;

    /**
     * @member {Helper} helper
     */
    helper : Object;

    /**
     * @member {Logger} logger
     */
    logger: Logger;

    /**
     * 获取属性
     * @param {String|Symbol} name 唯一名称
     * @return {*} any
     */
    get(name: string | Symbol): any;

    /**
     * 设置属性
     * @param {String|Symbol} name 唯一名称
     * @param {*} value any
     * @return {this} instance
     */
    set(name: string | Symbol, value: any): BaseContext;
}

export as namespace BaseContext;
export = BaseContext;
