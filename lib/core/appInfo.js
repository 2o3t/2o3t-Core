'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const utility = require('2o3t-utility');

const INIT = Symbol('AppInfo#init');
const OPTIONS = Symbol('AppInfo#options');

class AppInfo {

    /**
     *Creates an instance of AppInfo.
    * @param {*} [options={}] - options
    * @memberof AppInfo
    */
    constructor(options = {}) {
        assert(typeof options.baseDir === 'string', 'options.baseDir required, and must be a string');
        assert(fs.existsSync(options.baseDir), `Directory ${options.baseDir} not exists`);
        assert(fs.statSync(options.baseDir).isDirectory(), `Directory ${options.baseDir} is not a directory`);

        assert(options.envConfig, 'options.envConfig is required');
        assert(options.app, 'options.app is required');
        assert(options.logger, 'options.logger is required');

        this[OPTIONS] = Object.assign({}, options);
        this[INIT]();
    }

    [INIT]() {
        const options = this[OPTIONS];
        this.logger.system('Loaded envConfig = %o', this.envConfig);

        // package.json
        let pkgPath = path.join(process.cwd(), 'package.json');
        if (!fs.existsSync(pkgPath)) {
            pkgPath = path.join(this.baseDir, 'package.json');
        }
        options.pkg = utility.readJSONSync(pkgPath);

        // appName
        if (this.pkg.name) {
            this.logger.system('Loaded appname(%s) from package.json', this.pkg.name);
            options.appName = this.pkg.name;
        } else {
            throw new Error(`name is required from ${pkgPath}`);
        }

        options.serverEnv = getServerEnv(this.baseDir);
        this.logger.system('Loaded env = %s', this.env);

        options.configDir = getDirectoryPath(options.configDir, this.baseDir);
        this.logger.system('Loaded configDir = %s', this.configDir);

        options.pluginDir = getDirectoryPath(options.pluginDir, this.baseDir);
        this.logger.system('Loaded pluginDir = %s', this.pluginDir);

        options.middlewareDir = getDirectoryPath(options.middlewareDir, this.baseDir);
        this.logger.system('Loaded middlewareDir = %s', this.middlewareDir);

        options.routerDir = getDirectoryPath(options.routerDir, this.baseDir);
        this.logger.system('Loaded routerDir = %s', this.routerDir);

    }

    /**
     * @return {AppCore} core
     */
    get app() {
        return this[OPTIONS].app;
    }

    /**
     * @return {Logger} logger
     */
    get logger() {
        return this[OPTIONS].logger;
    }

    /**
     * @return {String} baseDir
     */
    get baseDir() {
        return this[OPTIONS].baseDir;
    }

    get pkg() {
        return this[OPTIONS].pkg;
    }

    /**
     * @return {String} app name
     */
    get name() {
        return this[OPTIONS].appName;
    }

    /**
     * @return {String} env name
     */
    get env() {
        return this[OPTIONS].serverEnv;
    }

    /**
     * @return {String} config dir
     */
    get configDir() {
        return this[OPTIONS].configDir;
    }

    /**
     * @return {String} plugin dir
     */
    get pluginDir() {
        return this[OPTIONS].pluginDir;
    }

    /**
     * @return {String} middleware dir
     */
    get middlewareDir() {
        return this[OPTIONS].middlewareDir;
    }

    /**
     * @return {String} router dir
     */
    get routerDir() {
        return this[OPTIONS].routerDir;
    }

    /**
     * @return {Object} env config
     */
    get envConfig() {
        return this[OPTIONS].envConfig;
    }


    // Other API

    /**
     * @return {Array} list
     */
    get loggerAllows() {
        return this.logger.inspect;
    }

    /**
     * @return {Array} list
     */
    get loggerBans() {
        return this.logger.ban;
    }

    /**
     * Inspect implementation.
     *
     * @return {Object} json
     * @api public
     */
    inspect() {
        return this.toJSON();
    }

    /**
     * Return JSON representation.
     * We only bother showing settings.
     *
     * @return {Object} json
     * @api public
     */
    toJSON() {
        return utility.mapCleanObject(this, [
            'appName',
            'env',
            'baseDir',
            'configDir',
            'pluginDir',
            'middlewareDir',
            'routerDir',
            'envConfig',
            'rootFilePath',
            'rootDir',
            'pkg',
            'loggerAllow',
            'loggerBans',
        ]);
    }
}


/**
 * 获取当前服务环境状态
 *
 * @return {String} 'test', 'production', 'development'
 * @private
 */
function getServerEnv() {
    const serverEnv = process.env.NODE_ENV || 'production';
    return serverEnv;
}

/**
 * 获取文件夹路径
 *
 * @param {String} dir 路径
 * @param {String} baseDir - baseDir
 * @return {String} 绝对路径
 */
function getDirectoryPath(dir, baseDir) {
    if (dir) {
        try {
            let dest = path.join(baseDir, dir);
            if (fs.existsSync(dest)) {
                const stat = fs.statSync(dest);
                if (stat.isDirectory()) {
                    return dest;
                }
            } else {
                dest = dest + 's';
                if (fs.existsSync(dest)) {
                    const stat = fs.statSync(dest);
                    if (stat.isDirectory()) {
                        return dest;
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }
    return null;
}

module.exports = AppInfo;
