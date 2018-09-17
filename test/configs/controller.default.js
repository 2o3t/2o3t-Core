'use strict';

module.exports = app => {

    const appInfo = app.appInfo;

    return {
        // mixins: [ 'user', 'cms' ],
        mixins: false,

        user: {
            name: 'xiao ming, 红',
            pkg: appInfo.pkg,
        },
    };
};
