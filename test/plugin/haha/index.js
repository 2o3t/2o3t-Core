'use strict';

module.exports = function(app, opts) {
    app.logger.warn.json('haha plugin opts = %o', opts);

    return function() {
        console.log('haha plugin');
    };
};
