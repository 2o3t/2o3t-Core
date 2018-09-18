'use strict';

const BaseContext = require('./base').BaseContext;
const READ_ONLY_APP = Symbol.for('context#readonly#app');

class ControllerContext extends BaseContext {

    /**
     * @member {Service} service
     */
    get service() {
        return this[READ_ONLY_APP].loadService;
    }
}

module.exports = ControllerContext;
