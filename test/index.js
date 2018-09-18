'use strict';

const AppCore = require('./app/server');

const app = new AppCore({
    baseDir: __dirname,
});
const mysql = require('./mysql');

app.beforeStart(async () => {
    await app.sleep(200);
    // app.logger.debug('beforeStart...')
});

app.beforeStart(async function() {
    await this.sleep(100);
    // this.logger.debug('beforeStart1...')
});

app.ready(err => {
    app.logger.debug.json('ready...', app.loader);
    app.logger.system.json('ready...', app.loader.mixin);
});

app.listen(3003, () => {
    app.logger.error('ready...', 3003);
});
