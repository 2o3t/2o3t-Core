const AppCore = require('./app/server');

const app = new AppCore({
    baseDir: __dirname
});
const mysql = require('./mysql');

app.beforeStart(async () => {
    await app.sleep(200);
    // app.logger.debug('beforeStart...')
})

app.beforeStart(async function() {
    await this.sleep(100);
    // this.logger.debug('beforeStart1...')
})

app.ready((err) => {
    app.logger.debug('ready...', app.loader);
    app.logger.debug('ready...', app.loader.mixin);
})
