# 说明记录

## Config

配置文件 [ js | json ]

### 加载顺序：

    '/configs/default.js',
    '/configs/development.js',
    '/configs/local.js',
    '/configs/local_development.js',
    '/configs/plugin.default.js',
    '/configs/plugin.development.js',
    '/configs/middlewares.default.js',
    '/configs/middlewares.development.js',
    '/configs/controller.default.js',
    '/configs/router.default.js'

### 优先级：

    default > {SCOPE}  > {NODE_ENV} > {OTHERS_CONFIGS}


## Plugin

插件代表是组建，插件中的 `中间件` 会进行全局注册。

## Helper

待补充

## Middleware

中间件，只是全局进行注册，但是并不进行使用。
可以在 Router 中配置使用，或者手动使用 `app.loadMiddleware.${}`。

如果想全局使用的话，可以在 `config/middlewares.${default}.js` 中单独配置，通过 `enable` 参数进行注册，如下：

```js
    mixins: [], // 自动进行全局注册
    bodyParse: {
        enable: true, // 自动全局注册(可选)
        bo: 33,
        c: 3,
    },
```

## Controller

在 `config/controller.${default}.js` 中可以通过 `mixins` 配置需要加载的 Controller， 或者不配置 `mixins` 来加载所有 Controller。
其它参数配置统一。

```js
    // mixins: [ 'user', 'cms' ],
    mixins: false,

    user: {
        name: 'xiao ming, 红',
    },
```

另，Controller 文件需要以如下格式书写，如：

```js
class UserController {

}
module.exports = UserController;
```

注入参数可通过 `this.options` 进行获取。
还支持以下参数：

```js
this.appInfo
this.config
this.service
this.helper
this.logger
```


## Service

待补充

## Router

待补充



## Custom ？？？

全局配置中心，负责配置所有中间件顺序？
