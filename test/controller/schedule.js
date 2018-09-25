'use strict';

/**
 * Schedule Controller
 */
class ScheduleController {

    index(ctx) {
        this.logger.warn('I am ScheduleController index');
        ctx.body = 'Schedule Controller';
    }

    get(ctx) {
        this.logger.warn('I am ScheduleController get');
        ctx.body = 'Schedule Controller get' + this.helper.hot('cctv');
    }
}

module.exports = ScheduleController;
