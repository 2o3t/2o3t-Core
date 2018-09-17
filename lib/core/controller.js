'use strict';

const utility = require('2o3t-utility');
const READ_ONLY_APP = Symbol('controller#readonly#app');

class Controller {

    /**
     * @constructor
     * @param {AppCore} app instance
     * @param {Object} opts inject opts
     */
    constructor(app, ...opts) {
        /**
         * @member {AppCore} app
         */
        this[READ_ONLY_APP] = app;

        utility.createLazyReadOnlyProp(this, 'options', function() {
            return opts && Array.isArray(opts) && opts.length > 0 ? opts[0] : {};
        });
    }

    /**
     * @member {AppInfo} appInfo
     */
    get appInfo() {
        return this[READ_ONLY_APP].appInfo;
    }

    /**
     * @member {Config} config
     */
    get config() {
        return this[READ_ONLY_APP].config;
    }

    /**
     * @member {Service} service
     */
    get service() {
        return this[READ_ONLY_APP].service;
    }

    /**
     * @member {Helper} helper
     */
    get helper() {
        return this[READ_ONLY_APP].helper;
    }

    /**
     * @member {Logger} logger
     */
    get logger() {
        return this[READ_ONLY_APP].logger;
    }
}

module.exports = Controller;
