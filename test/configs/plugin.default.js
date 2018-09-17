'use strict';

// module.exports = {
//     mixins: [ 'c', 'bP' ],
//     cc: {
//         s: [],
//     },
// };

exports.mixins = [ 'plugintest', 'c' ];

exports.plugintest = {
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
};

exports.c = {
    middleware: {
        mixins: [ 'a-b-1', 'c-0-1' ],
    },
    plugin: false, // 这里不能有 plugin
};
