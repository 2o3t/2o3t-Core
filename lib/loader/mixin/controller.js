'use strict';

const utility = require('2o3t-utility');
const utils = require('../../utils');

const LOADER_CONTROLLER = Symbol('mixin#loader#controller');

// 提供 controller， 并全局注册配置

module.exports = function() {

    if (this[LOADER_CONTROLLER]) {
        return;
    }
    this[LOADER_CONTROLLER] = [];

    const target = this._loadDirMixinsFromFile('controller', (controllerDir, controllerMX, controllers, filterFileList) => {
        // filter
        const controllersMap = new Map();
        return parseMixins.call(this, controllerDir, controllers, filterFileList)
            .filter(({ name }) => {
                // 去重复
                if (controllersMap.has(name)) {
                    this.logger.system.warn(`Controller '${name}' redefined`);
                    return false;
                }
                controllersMap.set(name, true);
                return true;
            }).reduce((obj, { name, file }) => {
                if (!file) {
                    this.logger.system.warn(`Controller '${name}' not found`);
                    return obj;
                }
                const opts = controllerMX[name];
                try {
                    const o = this.loadControllerFile(file, opts);
                    if (o) {
                        this[LOADER_CONTROLLER].push(file);
                        name = utility.defaultCamelize2Str(name, 'modules');
                        return utility.extend(true, obj, {
                            [name]: o,
                        });
                    }
                    this.logger.system.warn(`Controller '${name}' must be Class, eg: class '${name}'Controller {}`);
                } catch (error) {
                    throw error;
                }
                return obj;
            }, {});
    });

    this._regiestMixin('controller', target);
    this._regiestMixin('_controllers', Object.freeze(this[LOADER_CONTROLLER]));
};

// 判断mixin，决定是否全加载
function parseMixins(baseDir, mixins, filterFileList) {
    if (mixins && Array.isArray(mixins) && mixins.length <= 0) {
        return filterFileList.map(file => {
            const name = utility.defaultCamelize2Str(file.replace(baseDir, '').replace(/^(\/)+/igm, ''));
            return {
                name, file,
            };
        });
    }
    return mixins.map(name => {
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
    });
}
