'use strict';

module.exports = function(app, opts) {
    app.logger.info('a plugin', app.config);
    app.logger.system.warn('a plugin opts = %o', opts);

    return function cc() {
        console.log('ba plugin');
    };
};
