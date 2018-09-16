'use strict';

module.exports = function(app, opts) {
    app.logger.info('a', app.config);
    app.logger.system.warn('opts = %o', opts);

    return function() {
        console.log('b');
    };
};
