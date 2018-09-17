'use strict';

/**
 * User Controller
 */
class User1Controller {

    index(ctx) {
        this.logger.warn('I am UserController index');
        ctx.body = this.options;
    }
}

module.exports = User1Controller;
