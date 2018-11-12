'use strict';

module.exports = function(app, opts) {
    app.logger.warn.json('我是 PluginTest， 我是来测试的。', opts);
};
