'use strict';

const utility = require('2o3t-utility');
const utils = require('../../utils');

const MAIN_NAME = 'service';

const LOADER_SERVICE = Symbol('mixin#loader#service');

// 提供 service 并全局注册配置

module.exports = function() {

    if (this[LOADER_SERVICE]) {
        return;
    }
    this[LOADER_SERVICE] = [];

    const target = this._loadDirMixinsFromFile(MAIN_NAME, (serviceDir, serviceMX, services, filterFileList) => {
        // filter
        const servicesMap = new Map();
        return this._parseMixinsSelectLoad(serviceDir, services, filterFileList, true)
            .filter(({ name }, index) => {
                // 去重复
                if (servicesMap.has(name)) {
                    this.logger.system.warn(`Service '${name}' redefined`);
                    utility.spliceOne(services, index);
                    return false;
                }
                servicesMap.set(name, true);
                return true;
            }).reduce((obj, { name, file }) => {
                if (!file) {
                    this.logger.system.warn(`Service '${name}' not found`);
                    return obj;
                }
                const opts = serviceMX[name];
                try {
                    const o = this.loadServiceFile(file, opts);
                    if (o) {
                        this[LOADER_SERVICE].push(file);
                        name = utility.defaultCamelize2Str(name, 'modules');
                        return utility.extend(true, obj, {
                            [name]: o,
                        });
                    }
                    this.logger.system.warn(`Service '${name}' must be Class, eg: class '${name}'Service {}`);
                } catch (error) {
                    throw error;
                }
                return obj;
            }, {});
    });

    this._regiestMixin(MAIN_NAME, target);
    this._regiestMixin(`_${MAIN_NAME}s`, Object.freeze(this[LOADER_SERVICE]));

};
