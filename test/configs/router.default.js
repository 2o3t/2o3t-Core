'use strict';

module.exports = {
    user: {
        middlewares: [ 'bodyParse' ],
        // prefix: '/api/v1/user',
    },

    schedule: {
        prefix: '/schedule',
    },

    cms: {
        prefix: '/plugins',
    },
};
