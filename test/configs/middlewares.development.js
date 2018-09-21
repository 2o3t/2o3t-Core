'use strict';

module.exports = {
    mixins: [ 'bodyParse', 'a/a-b', 'abc' ],

    bodyParse: {
        bo: 33,
    },

    'a/a-b': {
        enable: true,
    },
};
