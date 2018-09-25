# 说明记录

## 项目结构(必须)

```js
ROOT: {
    config(s): "配置文件Config存放处",
    plugin(s): "插件统一存放, 只加载根目录的文件及文件夹, 不支持文件包含",
    helper(s): "工具辅助类统一存放(一般是固定不变的静态工具)",
    middleware(s): "中间件统一存放",
    controller(s): "控制器统一存放",
    service(s): "服务类型统一存放",
    router(s): "路由控制类统一存放",
}
```

类加载顺序:
    config > plugin > helper > middleware > controller > service > router

## Init

初始化, 例如:

```js
    const AppCore = require('./app/server');

    const app = new AppCore({
        baseDir: __dirname, // 根目录, (选配, 默认 process.cwd())
    });
```

## Config

环境配置: `.env` , 如下:

```conf
    HOSTNAME=localhost
    # node env
    NODE_ENV=development
    # scope
    SERVER_SCOPE=local

    # logger 启用日志列表
    LOGGER_ALLOW=*  # 全部开启
    LOGGER_ALLOW=DEBUG,INFO,ERROR,WARN  # 部分开启
    # logger 禁用日志列表
    LOGGER_BAN=NULL # 不开启禁用
    LOGGER_BAN=* # 全部禁用
    LOGGER_BAN=TEST,SYSTEM # 部分禁用
```

配置文件支持类型 [ `js` | `json` ]

### 加载顺序：

Will merge config(s)/default.js 和 config(s)/${process.env.SERVER_SCOPE}.js 和 config(s)/${process.env.NODE_ENV}.js 和 config(s)/${process.env.SERVER_SCOPE}_${process.env.NODE_ENV}.js

```json
    '/configs/default.js',
    '/configs/local.js',
    '/configs/development.js',
    '/configs/local_development.js',

    '/configs/plugin.default.js',
    '/configs/plugin.${scope}.js',
    '/configs/plugin.${env}.js',
    '/configs/plugin.${scope}_${env}.js',

    '/configs/middlewares.default.js',
    '/configs/middlewares.${scope}.js',
    '/configs/middlewares.${env}.js',
    '/configs/middlewares.${scope}_${env}.js',

    '/configs/controller.default.js',
    '/configs/controller.${scope}.js',
    '/configs/controller.${env}.js',
    '/configs/controller.${scope}_${env}.js',

    '/configs/service.default.js',
    '/configs/service.${scope}.js',
    '/configs/service.${env}.js',
    '/configs/service.${scope}_${env}.js',

    '/configs/router.default.js',
    '/configs/router.${scope}.js',
    '/configs/router.${env}.js',
    '/configs/router.${scope}_${env}.js',
```

### 优先级：

```json
    default > {SERVER_SCOPE}  > {NODE_ENV} > {SERVER_SCOPE}_{NODE_ENV}
```

## Plugin

插件代表是组件, 可独立生产(但是不能独立运行)，插件中的 `中间件` 会进行全局注册, 并且优先级最高。
默认自动加载plugin(s)目录下文件, 可在初始化时, 更改目录路径.

### PluginConfig

可配置config信息, 如下:

```js
// 普通配置
module.exports = {
    mixins: [ 'plugin1', 'plugin2' ],  // 指定加载顺序, 自动加载plugin(s)目录下文件
    plugin1: { // 给 ‘plugin1’ 指定配置文件
        s: [],
    },
};
```

```js
// 文件夹 或 模块配置
module.exports = {
    middleware: { // 扩展中间件
        mixins: [ 'a-b', 'c-0', 'bodyParse' ], // 全局顺序注册加载
        bodyParse: {
            enable: true, // 开启全局注册(可选)
            p: "", // 参数
        },
    },
    controller: { // 扩展 controller
        mixins: [ 'user' ],
    },
    service: { // 扩展 service
        mixins: [ 'user' ],
    },
    config: { // 其它参数
        RPG: 'I AM Plugins',
    },
    "555": "666",  // 其它参数
}
```

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
