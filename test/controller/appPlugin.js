'use strict';

/**
 *  AppPlugin Controller
 */
class AppPluginController {

    index(ctx) {
        this.logger.info('I am AppPluginController index');
        ctx.body = [
            {
                name: '2o3t-pocket-plugin-apptest',
                version: '0.0.2',
                author: 'zyao89 <zyao89@gmail.com>',
                description: 'An Pokemon Project',
                license: 'MIT',
                url: 'http://files.cnblogs.com/files/gossip/ab.zip',
            },
            {
                name: '2o3t-pocket-plugin-online-apptest',
                version: '0.0.1',
                author: 'zyao89 <zyao89@gmail.com>',
                description: 'An Pokemon Project',
                license: 'MIT',
                url: 'http://files.cnblogs.com/files/gossip/ab.zip',
            },
            {
                name: '2o3t-pocket-plugin-online-apptest2',
                version: '0.0.1',
                author: 'zyao89 <zyao89@gmail.com>',
                description: 'An Pokemon Project',
                license: 'MIT',
                url: 'http://files.cnblogs.com/files/gossip/ab.zip',
            },
            {
                name: '2o3t-pocket-plugin-online-Calendar',
                version: '1.1.6',
                author: 'zyao89 <zyao89@gmail.com>',
                description: 'An Pokemon Project',
                license: 'MIT',
                url: 'https://github-production-release-asset-2e65be.s3.amazonaws.com/136362030/9eb70a78-8198-11e8-8209-631a08ea6f89?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIWNJYAX4CSVEH53A%2F20180930%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20180930T171937Z&X-Amz-Expires=300&X-Amz-Signature=68766d73ee3c23e3fb0ff125046fd87f381e0b452095c4cf267f5fc044c1edd7&X-Amz-SignedHeaders=host&actor_id=8985523&response-content-disposition=attachment%3B%20filename%3Dcn.zyao89.2o3t.calendar-1.1.6-mac.zip&response-content-type=application%2Foctet-stream&ext=.zip',
            },
            {
                name: '2o3t-pocket-plugin-online-444',
                version: '0.0.1',
                author: 'zyao89 <zyao89@gmail.com>',
                description: 'An Pokemon Project',
                license: 'MIT',
            },
        ];
    }
}

module.exports = AppPluginController;
