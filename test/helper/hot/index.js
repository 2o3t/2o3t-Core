'use strict';


module.exports = function() {
    console.log('I am hot');

    return function(name) {
        return `Help --> ${name}`;
    };
};
