'use strict';

module.exports = function(app, opts) {
    app.logger.warn.json('a', app.config);
    app.logger.warn.json('opts = %o', opts);

    return function(ctx, next) {
        console.log('b');
        next();
    };
};
