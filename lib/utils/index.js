'use strict';

const fs = require('fs');
const convert = require('koa-convert');
const is = require('is-type-of');
const utility = require('2o3t-utility');

module.exports = {

    MIXIN_NAMES: [
        'config',
        'plugin',
        // 'extend', 'custom', 'service',
        'middleware',
        // 'controller', 'router',
    ],

    // 日志必须有的方法
    LOGGER_METHODS: [ 'debug', 'info', 'error', 'warn', 'fatal', 'system', 'test' ],

    middleware(fn) {
        return is.generatorFunction(fn) ? convert(fn) : fn;
    },

    /**
     * 解析配置的 env 环境，并赋值
     * @param {String} baseDir - baseDir
     * @return {Object} parsed object or error
     */
    parseEnvConfig(baseDir) {
        const files = [ '.env', 'env', 'config/.env', 'configs/.env', 'config/env', 'configs/env' ];
        const dotenvPaths = utility.existsFileSync(files, baseDir);
        const encoding = 'utf8';

        return dotenvPaths.reduceRight((obj, dotenvPath) => {
            try {
                // specifying an encoding returns a string instead of a buffer
                const parsed = utility.parseKeyValue(fs.readFileSync(dotenvPath, {
                    encoding,
                }));

                Object.keys(parsed).forEach(function(key) {
                    if (!process.env.hasOwnProperty(key)) {
                        process.env[key] = parsed[key];
                    }
                });

                return Object.assign(obj, parsed);
            } catch (e) {
                return obj;
            }
        }, {});
    },

    /**
     * 创建文件支持类型
     * @param {String} name str
     * @param {Boolean} [ignored=true] 是否可忽略后缀
     * @return {RegExp} reg
     */
    createFileRegExp(name, ignored = true) {
        if (!ignored) {
            return new RegExp(`${name}\.(js|json)$`, 'igm');
        }
        return new RegExp(`${name}(\.(js|json))?$`, 'igm');
    },
};