'use strict';

module.exports = async function(ctx, next) {
    console.log('cc....');

    console.log('m2m2m2');

    await next();

    console.log('end...');
};
