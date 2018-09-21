'use strict';

module.exports = function(app, opts) {

    app.logger.info(opts);

    return async function(ctx, next) {
        console.log('abc 1');

        await next();

        console.log('abc end...');
    };
};
