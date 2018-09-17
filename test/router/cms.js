'use strict';

module.exports = router => {
    const { app } = router;
    app.logger.warn('i am router cms');

    router.get('/', app.loadController.user.index);
};
