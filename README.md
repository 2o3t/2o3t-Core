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

## Middleware

中间件，只是全局进行注册，但是并不进行使用。
可以在 Router 中配置使用，或者手动使用 `app.loadMiddleware.${}`。

## Controller

## Service

## Router



## Custom ？？？

全局配置中心，负责配置所有中间件顺序？
