'use strict';

const BaseContext = require('./base').BaseContext;
const READ_ONLY_APP = Symbol.for('context#readonly#app');

class RouterContext extends BaseContext {

    /**
     * @member {Controller} controller
     */
    get controller() {
        return this[READ_ONLY_APP].loadController;
    }

    /**
     * @member {Middleware} middleware
     */
    get middleware() {
        return this[READ_ONLY_APP].loadMiddleware;
    }
}


module.exports = RouterContext;
