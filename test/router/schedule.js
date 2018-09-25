'use strict';

module.exports = function(router) {

    router.get('/', this.controller.schedule.index);
    router.get('/get', this.controller.schedule.get);

};
