'use strict';

module.exports = function(app, opts) {
    app.logger.warn('a plugin opts = %o', opts);

    return function cc() {
        console.log('ba plugin');
    };
};
