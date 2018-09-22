# 说明记录

## 项目结构(必须)

```js
ROOT: {
    helper(s): "工具辅助类统一存放(一般是固定不变的静态工具)",
    config(s): "配置文件Config存放处",
    plugin(s): "插件统一存放, 只加载根目录的文件及文件夹, 不支持文件包含",
    middleware(s): "中间件统一存放",
    controller(s): "控制器统一存放",
    service(s): "服务类型统一存放",
    router(s): "路由控制类统一存放",
}
```

类加载顺序:


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

插件代表是组件, 可独立生产(但是不能独立运行)，插件中的 `中间件` 会进行全局注册, 并且优先级最高。

插件类型可以是以下任一种:

- 一个单独的外部模块.
- 一个单独的内部文件夹.
- 一个单独的文件.

插件返回值(支持任何形式)可进行全局注册, 调用如下:

```js
    this.plugin.${filename}
    // or
    app.loadPlugin.${filename}
```

## Middleware

中间件，只是全局进行注册，但是并不进行使用。
可以在 Router 中配置使用，或者手动使用 `app.loadMiddleware.${filename}`。

如果想全局使用的话，可以在 `config/middlewares.${default}.js` 中单独配置，通过 `mixins` 进行全局顺序注册, 或者是 `enable` 参数进行注册，如下：

```js
    mixins: [ 'bodyParse' ], // 自动进行全局顺序注册
    bodyParse: {
        enable: true, // 自动全局注册(可选)
        bo: 33,
        c: 3,
    },
```

## Controller

在 `config/controller.${default}.js` 中可以通过 `mixins` 配置需要加载的 Controller 优先顺序， 默认加载所有 Controller 文件。
其它参数配置统一。

```js
    mixins: [ 'user', 'cms' ], // 控制加载顺序

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
this.plugin
this.service
this.helper
this.logger
```


## Service

待补充

## Router

待补充

## Helper

待补充

```js
    app.loadHelper.${filename}.${method};
    // ort
    this.helper.${filename}.${method};
```

## Utility (系统工具类)

待补充


## Custom ？？？
