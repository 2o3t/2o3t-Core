'use strict';

// module.exports = {
//     mixins: [ 'c', 'bP' ],
//     cc: {
//         s: [],
//     },
// };

exports.mixins = [ 'plugintest', 'c' ];

exports['plugintest'] = {
    middleware: { // 这里不能有 plugin
        mixins: ['a-b', 'c-0']
    },
    plugin: false
};

exports['c'] = {
    middleware: { // 这里不能有 plugin
        mixins: ['a-b-1', 'c-0-1']
    },
    plugin: false
};
