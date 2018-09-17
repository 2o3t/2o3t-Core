'use strict';

module.exports = {
    mixins: [ 'user', 'cms' ],

    user: {
        middlewares: [ 'bodyParse' ],
        prefix: '/api/v1/user',
    },
};
