'use strict';

module.exports = function(router) {
    this.logger.warn('i am router user', this.middleware);
    router.get('/', this.loader.controller.user.index);

    return router;
};
