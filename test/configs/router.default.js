'use strict';

module.exports = {
    mixins: [ 'user', 'cms' ],

    user: {
        middlewares: [ 'bodyParse' ],
        path: '/api/t',
        prefix: 'c',
    },
};
