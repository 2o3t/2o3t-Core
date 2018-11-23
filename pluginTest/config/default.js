'use strict';

module.exports = {
    middleware: {
        mixins: [ 'a-b', 'c-0', 'bodyParse' ],
        bodyParse: {
            enable: true,
        },
    },
    controller: { // 不能乱配
        mixins: [ 'user' ],
    },
    config: {
        RPG: 'I AM Plugins',
    },
    555: '666',
};
