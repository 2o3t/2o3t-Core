'use strict';

module.exports = function(router) {
    this.logger.warn.json('i am router user', this.middleware);
    router.get('/', this.controller.user.index);

    router.get('/test', router.new().routes());

    router.proxy('/p/fef91266a44c', {
        target: 'https://www.jianshu.com',
        headers: {
            '007': '008',
        },
    });

};
