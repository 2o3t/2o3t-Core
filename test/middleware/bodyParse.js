'use strict';

module.exports = function(app, opts) {
    app.logger.warn('a', app.config);
    app.logger.warn('opts = %o', opts);

    return function() {
        console.log('b');
    };
};
