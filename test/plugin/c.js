'use strict';

module.exports = function(app, opts) {
    app.logger.warn.json('a plugin opts = %o', opts);

    return function cc() {
        console.log('ba plugin');
    };
};
