'use strict';

/**
 * User Controller
 */
class UserController {

    index(ctx) {
        this.logger.warn('I am UserController index');
        ctx.body = this.options;
    }
}

module.exports = UserController;
