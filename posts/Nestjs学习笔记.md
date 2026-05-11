---
title: Nestjs学习笔记
tags: 
- nestjs
- nodejs
- typescript
- backend
- enterprise
categories: 
- backend
abbrlink: 391860339
date: 2025-07-27 11:28:46
keywords: nestjs,nodejs,web
description: 'NestJS企业级Node.js后端框架学习笔记，涵盖模块化和依赖注入等核心概念'
---



# Nest.js学习笔记

---

## 简介

Nest（NestJS）是一个用于构建高效、可扩展的 [Node.js](https://nodejs.org/) 服务端应用的框架。它采用渐进式 JavaScript，使用 [TypeScript](http://www.typescriptlang.org/) 构建并全面支持 TypeScript（同时仍允许开发者使用纯 JavaScript 编码），融合了 OOP（面向对象编程）、FP（函数式编程）和 FRP（函数响应式编程）的元素。

在底层，Nest 使用了强大的 HTTP 服务器框架如 [Express](https://expressjs.com/)（默认），也可以配置使用 [Fastify](https://github.com/fastify/fastify)！

Nest 在这些常见的 Node.js 框架（Express/Fastify）之上提供了一层抽象，同时也将其 API 直接暴露给开发者。这使得开发者能够自由使用底层平台提供的众多第三方模块。

## 安装

### 快速安装

默认使用Nestjs脚手架安装

```shell
pnpm i @nestjs/cli
nest new project-name
```

### 启动项目

```shell
cd ./project-name
pnpm run start
```

### 项目结构

#### NestFactory

`NestFactory` 暴露了几个静态方法，允许创建应用程序实例。`create()` 方法返回一个应用程序对象`NestApplication` ，该对象实现了 `INestApplication` 接口。该对象提供了一组方法，这些方法将在后续章节中描述。我们启动了 HTTP 监听器，这让应用程序可以等待入站的 HTTP 请求。

#### Platform-express/Platform-fastify

Nest 旨在成为一个平台无关的框架。平台独立性使得创建可重用的逻辑部分成为可能，开发者可以在几种不同类型的应用程序中利用这些部分。从技术上讲，一旦创建了适配器，Nest 就能够与任何 Node HTTP 框架一起工作(`AbstractHttpAdapter`)。开箱即用支持两个 HTTP 平台：[express](https://expressjs.com/) 和 [fastify](https://www.fastify.io/)。你可以选择最适合你需求的平台。

## Nest CLI

[Nest CLI](https://github.com/nestjs/nest-cli) 是一个命令行界面工具，可帮助您初始化、开发和维护 Nest 应用程序。它以多种方式提供支持，包括项目脚手架搭建、开发模式下的服务运行，以及为生产环境构建和打包应用程序。该工具体现了最佳实践的架构模式，以鼓励构建结构良好的应用。

### 命令

1. `new`:搭建一个包含所有运行所需样板文件的标准模式应用程序

2. `generate`:根据原理图生成和/或修改文件

3. `build`:将应用程序或工作区编译到输出文件夹中

4. `start`:编译并运行应用程序（或工作区中的默认项目）

5. `info`:显示已安装的 Nest 包信息及其他有用的系统信息。

### 工作区

Nest 有两种代码组织模式：

* **标准模式** ：适用于构建专注于单个项目的应用程序，这些应用程序拥有自己的依赖项和设置，不需要优化模块共享或复杂构建。这是默认模式。
* **monorepo 模式** ：该模式将代码产物视为轻量级 **monorepo** 的一部分，可能更适合开发团队和/或多项目环境。它自动化了部分构建过程，便于创建和组合模块化组件，促进代码重用，简化集成测试，便于共享项目范围内的产物（如 `eslint` 规则和其他配置策略），且比 Git 子模块等替代方案更易使用。Monorepo 模式采用**工作区**的概念（在 `nest-cli.json` 文件中表示）来协调 monorepo 各组件间的关系。

### 库

#### NestJS 中的库（Library）与 Monorepo 结构

NestJS 提供了多种方式实现模块化复用，其中之一就是**库（Library）**。它适合将通用功能抽离成可复用模块，尤其在 **monorepo** 项目结构中表现更佳。

#### 库的用途

* 用于组织内共享模块（如认证、日志等通用逻辑）

* 提高复用性，简化应用组装与维护

* 配合 monorepo，可直接引用最新代码，方便协作开发与测试

#### 库 vs 应用

* **库不是独立运行的项目**，必须导入到某个应用中使用

* Nest 使用不同的构建配置管理库，如 `entryFile: index` 而不是 `main`

* 每个库在 `libs/` 目录下维护，配置写入 `nest-cli.json` 和 `tsconfig.json`

#### 创建库

使用 CLI 命令创建库：

`nest g library my-library`

* 系统会要求输入前缀（默认 `@app`），用于 import 路径别名

* 会在 `libs/` 下生成对应目录和配置

#### 构建库

`nest build my-library`

#### 在应用中使用库

在应用模块中引入库模块：

```ts
import { MyLibraryModule } from '@app/my-library'; 
@Module({  imports: [MyLibraryModule],}) export class AppModule {}

```

此处的 `@app/my-library` 是通过 tsconfig 的路径映射实现的，Nest 在添加库时自动配置：

```json
"paths": { 
    "@app/my-library": ["libs/my-library/src"],
    "@app/my-library/*": ["libs/my-library/src/*"]
 }
```

### 用法

<a href="https://docs.nestjs.cn/cli/usages.html" target="_blank">NestCLI用法</a>

#### nest generate

根据原理图生成和/或修改文件

```shell
nest generate <schematic> <name> [options]
nest g <schematic> <name> [options]
```

##### 参数

| 参数            | 描述                                                         |
| ------------- | ---------------------------------------------------------- |
| `<schematic>` | 要生成的 schematic 或 collection:schematic。可用的 schematic 请参阅下表。 |
| `<name>`      | 所生成组件的名称。                                                  |

##### 原理图

| 名称          | 别名  | 描述                                         |
| ----------- | --- | ------------------------------------------ |
| app         |     | 在 monorepo 中生成一个新应用（如果是标准结构则转换为 monorepo）。 |
| library     | lib | 在 monorepo 中生成一个新库（如果是标准结构则转换为 monorepo）。  |
| class       | cl  | 生成一个新类。                                    |
| controller  | co  | 生成控制器声明。                                   |
| decorator   | d   | 生成自定义装饰器。                                  |
| filter      | f   | 生成过滤器声明。                                   |
| gateway     | ga  | 生成网关声明。                                    |
| guard       | gu  | 生成守卫声明。                                    |
| interface   | itf | 生成一个接口。                                    |
| interceptor | itc | 生成一个拦截器声明。                                 |
| middleware  | mi  | 生成一个中间件声明。                                 |
| module      | mo  | 生成一个模块声明。                                  |
| pipe        | pi  | 生成管道声明。                                    |
| provider    | pr  | 生成提供者声明。                                   |
| resolver    | r   | 生成解析器声明。                                   |
| resource    | res | 生成新的 CRUD 资源。详情请参阅 CRUD（资源）生成器 。（仅限 TS）    |
| service     | s   | 生成服务声明                                     |

## Nest控制器与路由

控制器负责处理传入的**请求**并向客户端返回**响应**。

控制器的目的是处理应用程序的特定请求。**路由**机制决定了哪个控制器将处理每个请求。通常，一个控制器具有多个路由，每个路由可以执行不同的操作。

要创建基本控制器，我们使用类和**装饰器**。装饰器将类与必要的元数据关联起来，使 Nest 能够创建将请求连接到相应控制器的路由映射。

### 控制器(Controller)

控制器负责处理传入的**请求**并向客户端返回**响应**。

控制器的目的是处理应用程序的特定请求。**路由**机制决定了哪个控制器将处理每个请求。通常，一个控制器具有多个路由，每个路由可以执行不同的操作。

要创建基本控制器，我们使用类和**装饰器**。装饰器将类与必要的元数据关联起来，使 Nest 能够创建将请求连接到相应控制器的路由映射。

```ts
import { Controller, Get } from '@nestjs/common';

@Controller('cats') // 设置路由前缀
export class CatsController {
  @Get() // 处理 GET /cats 请求
  findAll(): string {
    return 'This action returns all cats';
  }
}

```

> 💡 使用 CLI 快速生成控制器：  `$ nest g controller [name]`

#### 路由路径组成

一个处理器的完整路由由两部分组成：

* 控制器 *@Controller()* 的路径前缀（如 `'cats'`）

* 方法装饰器 *@Get()* 指定的路径（如 `@Get('breed')`

#### 路由装饰器

| 装饰器          | 对应 HTTP 方法 | 用途说明           |
| ------------ | ---------- | -------------- |
| `@Get()`     | GET        | 获取资源（读取数据）     |
| `@Post()`    | POST       | 创建资源（提交数据）     |
| `@Put()`     | PUT        | 替换资源（整体更新）     |
| `@Patch()`   | PATCH      | 更新资源（部分更新）     |
| `@Delete()`  | DELETE     | 删除资源           |
| `@Options()` | OPTIONS    | 获取通信选项         |
| `@Head()`    | HEAD       | 类似 GET，但不返回响应体 |

#### 路由装饰器实践

```ts
@Controller('users')
export class UserController {
  @Get()
  findAll() {
    return 'GET /users';
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return `GET /users/${id}`;
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return 'POST /users';
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return `PUT /users/${id}`;
  }

  @Patch(':id')
  partialUpdate(@Param('id') id: string, @Body() partial: Partial<UpdateUserDto>) {
    return `PATCH /users/${id}`;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return `DELETE /users/${id}`;
  }
}

```

#### 请求方法装饰器

| 装饰器            | 来源位置             | 作用                                | 典型用于方法                        | 示例路径            |
| -------------- | ---------------- | --------------------------------- | ----------------------------- | --------------- |
| `@Body()`      | 请求体（body）        | 获取 POST/PUT/PATCH 请求中的 JSON 或表单数据 | `@Post()`、`@Put()`、`@Patch()` | POST /cats      |
| `@Param()`     | 路径参数（params）     | 获取 URL 中的动态参数值                    | `@Get()`、`@Put()`、`@Delete()` | GET /cats/:id   |
| `@Query()`     | 查询参数（query）      | 获取 URL 中 `?key=value` 格式参数        | 通常用于 `@Get()`                 | GET /cats?age=3 |
| `@Headers()`   | 请求头（headers）     | 获取请求头字段                           | 任何请求                          | —               |
| `@Req()`       | 原始请求对象（Request）  | 获取完整请求对象（Express/Fastify）         | 任何请求                          | —               |
| `@Res()`       | 原始响应对象（Response） | 手动控制响应（状态码、headers）               | 任何请求                          | —               |
| `@Ip()`        | 客户端 IP 地址        | 获取客户端 IP 地址                       | 任何请求                          | —               |
| `@HostParam()` | 路由主机参数           | 用于基于主机名的路由                        | 较少使用                          | —               |

#### 请求方法装饰器实践

```ts
@Post()
create(@Body() createCatDto: CreateCatDto) {
  return `创建猫: ${createCatDto.name}`;
}

@Get(':id')
findOne(@Param('id') id: string) {
  return `查找 ID 为 ${id} 的猫`;
}

@Get()
findByAge(@Query('age') age: number) {
  return `查找年龄为 ${age} 的猫`;
}

@Get('header-info')
getHeader(@Headers('user-agent') ua: string) {
  return `你的 User-Agent 是 ${ua}`;
}

@Get('ip')
getClientIp(@Ip() ip: string) {
  return `客户端 IP: ${ip}`;
}

@Get('raw')
getRawRequest(@Req() req: Request) {
  return req.headers;
}

```

#### 最佳实践参考

##### 拿客户端请求

```ts
// cats.controller.ts
import { Body, Controller, Post } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Body() createCatDto) {
    const { name, age, breed } = createCatDto;
    return `创建了猫：${name}, 年龄：${age}, 品种：${breed}`;
  }
}


```

##### 路径参数

路径：`GET /cats/:id`

```ts
//多个参数
@Get(':id/:action')
handle(@Param() params: { id: string; action: string }) {
  return `对猫 ${params.id} 执行动作 ${params.action}`;
}


```

##### 查询参数

路径：`GET /cats?age=3&breed=short`

```ts
@Get()
filter(@Query('age') age: string, @Query('breed') breed: string) {
  return `查询年龄为 ${age}，品种为 ${breed} 的猫`;
}

// 或者整体接收
@Get()
filter(@Query() query: { age?: string; breed?: string }) {
  return query;
}


```

## NestSession

Session是Nestjs服务器为每个浏览器创建的一个会话对象,Session会记录到浏览器的cookie用来区分用户.

### 安装

```shell
pnpm i express-session --save

pnpm i @types/express-session -D
```

### 引入

```ts
// main.ts

import * as session from 'express-session'


app.use(session())
```

### 参数

| 配置项     | 作用                      |
| ------- | ----------------------- |
| secret  | 生成服务端Session签名          |
| name    | 生成客户端cookie的名字          |
| cookie  | 设置返回到前端key的属性(键值对)      |
| rolling | 在每次请求时强制设置cookie,重置过期时间 |

### 示例

使用svg-captcha+Nestjs传递验证码

```ts

// user.controller.ts
@Get('code')
createCode(@Req() req,@Res res,@Session session){
    const Captcha = svgCaptcha.create({

    size:4,fontSize:50,width:100,height:34,background:'#cc9966'

})
    session.code = Captcha.text
    res.type('image/svg+xml')
    res.send(Captcha.data)

}


```

## NestProvider

提供者是 Nest 的核心概念。许多基础的 Nest 类，如服务、存储库、工厂和辅助工具，都可以被视为提供者。提供者的核心理念在于它可以作为依赖项被注入。**提供程序通常具有与应用程序生命周期一致的生存期（"作用域"）。当应用程序启动时，每个依赖项都必须被解析，这意味着每个提供程序都会被实例化。**

### 用法

#### Provider注入Controller

`xxx.service.ts`中使用`@Injectable`修饰导出类,在`xxx.module.ts`中引入,添加到`@Module()`下的`providers`

#### Provider别名

在`providers`数组下传入对象,使用`provide:'alias'`,在Controller层使用`@Inject('alias')`修饰

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';



@Module({
  controllers: [AppController],
  imports: [],
  providers: [AppService,{
    provide:'ABC',
    useClass:AppService
}],

})
export class AppModule {}
```

#### Provider自定义值

在`providers`数组下传入对象,使用`provide:'alias',useValue:{...}`,在Controller层使用`@Inject('alias')`修饰

#### Provider工厂模式

同上,`useFactory()`

> 参考: <a href="https://docs.nestjs.cn/fundamentals/dependency-injection.html#%E5%B7%A5%E5%8E%82%E6%8F%90%E4%BE%9B%E8%80%85usefactory" target="_blank">工厂模式</a>

## NestModule

模块是一个用 `@Module()` 装饰器注解的类。该装饰器提供了元数据，Nest 使用它来有效地组织和管理应用程序结构。

`@Module()` 装饰器接收一个带有描述模块属性的对象：

| 模块属性        | 模块作用                                                              |
| ----------- | ----------------------------------------------------------------- |
| providers   | 将由 Nest 注入器实例化,且至少可在本模块内共享的提供者                                    |
| controllers | 本模块中定义的需要实例化的控制器集合                                                |
| imports     | 导入模块的列表，这些模块导出了本模块所需的提供者                                          |
| exports     | 本模块提供的 providers 子集，这些提供者应可供导入本模块的其他模块使用。可以使用提供者本身或其令牌（provide 值） |

默认情况下，模块**封装**了提供者，这意味着您只能注入属于当前模块或从其他导入模块显式导出的提供者。模块导出的提供者本质上充当了该模块的公共接口或 API。

### 创建Module

1. 使用NestCLI创建

```shell
nest g res <模块名>
```

将创建`<模块名>Module`模块.

2. `import`引入,如果涉及跨模块则需`@Module({exports:[]})`转变为共享模块

```ts
// service模块
import {UserService} from './user/user.service.ts'

@Controller()
export class AppController{
    constructor(private readonly appService:AppService,
    private readonly UserService:UserService
)
}
```

```ts
// xxx.module.ts


@Module({
    exports:[UserService]
})
```

3. 手动创建并引入依赖项

```ts
// xx.module.ts
import {Module} from '@nestjs/common'

//注册到全局的模块修饰符
@Global
@Module({
    provider:[
    {
    provide:'Config',
    useValue:{baseUrl:'/api'}
}
],
    exports:[
    {...}
]
})
export class xxModule{

}
```

对全局模块的Provider通过`@Inject('ProviderName') private readonly base:any`引入.

## Nest中间件

中间件是在路由处理程序**之前**调用的函数。中间件函数可以访问[请求](https://expressjs.com/en/4x/api.html#req)和[响应](https://expressjs.com/en/4x/api.html#res)对象，以及应用程序请求-响应周期中的 `next()` 中间件函数。 **下一个**中间件函数通常由名为 `next` 的变量表示。

> 中间件函数可以执行以下任务：
> 
> * 执行任意代码。
> * 修改请求和响应对象。
> * 结束请求-响应周期。
> * 调用堆栈中的下一个中间件函数。
> * 如果当前中间件函数没有结束请求-响应周期，它必须调用 `next()` 将控制权传递给下一个中间件函数。否则，请求将被挂起。

### 创建中间件

1. 使用Nest CLI创建

```shell
nest g mi <中间件名> 
```

2. 手动创建

```ts
import {Injectable,NestMiddleware} from '@nestjs/common'


@Injectable()
export class Logger implements NestMiddleware{

}
```

### 用法

```ts
    @Injectable()
    export class Logger implements NestMiddleware{
        use(req,res,next){
        console.log('Hi')
        //若无Next则被拦截
        next()
    }
    }
```

### 导入到Module

```ts
// 引入...
export class UserModule implements NestModule{
    configure(consumer:MiddlewareConsumer){
    // 消费者函数注册中间件
    consumer.apply(Logger).forRoutes('User')

}
}
```

### 全局中间件

```ts
// main.ts

import {Request,Response,NextFunction} from 'express'


function MiddlewareAll(req:Request,res:Response,next:NextFunction){
    //全局中间件逻辑
}
async function bootstrap(){
    const app = await NestFactory.create(AppModule);
    //注册中间件
    app.use(MiddlewareAll)
    ...
}
```

## Nest-Swagger

为Nestjs添加完整的API文档支持。

### Scalar API安装

[OpenAPI](https://swagger.io/specification/) 规范是一种与语言无关的定义格式，用于描述 RESTful API。Nest 提供了一个专用[模块](https://github.com/nestjs/swagger)，可通过装饰器生成此类规范。

ScalarAPI在此基础上提供了更加整洁、优雅的API文档界面。

```bash
npm install --save @nestjs/swagger @scalar/nestjs-api-reference
```

### 注入NestModule

```ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
/* ... */
const app = await NestFactory.create(AppModule)
const config = new DocumentBuilder()
  .setTitle('Cats example')
  .setDescription('The cats API description')
  .setVersion('1.0')
  .addTag('cats')
  .build()
const document = SwaggerModule.createDocument(app, config)
/* ... */
const OpenApiSpecification =
  /* … */
  app.use(
    '/reference',
    apiReference({
      content: document,
    }),
  )
```

### 装饰器

| 装饰器名                    | 装饰器作用域 | 装饰功能                                                                 |
| ----------------------- | ------ | -------------------------------------------------------------------- |
| @ApiBasicAuth()         | 方法/控制器 | 声明该接口使用 HTTP Basic Auth（Authorization: Basic base64(user:password)）。 |
| @ApiBearerAuth()        | 方法/控制器 | 声明接口使用 Bearer Token（通常是 JWT）。                                        |
| @ApiBody()              | 方法     | 显式声明 请求体结构，用于 POST / PUT / PATCH。                                    |
| @ApiConsumes()          | 方法/控制器 | 声明接口 消费的 Content-Type。(表单上传、文件上传)                                    |
| @ApiCookieAuth()        | 方法/控制器 | 声明接口通过 Cookie 进行身份验证。                                                |
| @ApiExcludeController() | 控制器    | 完全从 Swagger 文档中隐藏整个控制器。                                              |
| @ApiExcludeEndpoint()   | 方法     | 隐藏某一个具体接口。                                                           |
| @ApiExtension()         | 方法     | 向 OpenAPI 文档中注入 自定义扩展字段（x-...）。                                      |
| @ApiExtraModels()       | 方法/控制器 | 显式告诉 Swagger 额外要注册的模型。                                               |
| @ApiHeader()            | 方法/控制器 | 声明接口需要的 自定义 Header。                                                  |
| @ApiHideProperty()      | 模型     | 从 Swagger 模型中 隐藏某个字段。                                                |
| @ApiOAuth2()            | 方法/控制器 | 声明接口使用 OAuth2 授权机制。                                                  |
| @ApiOperation()         | 方法     | 描述接口的 概要与说明。{summary：“...”，description：“...”}                        |
| @ApiParam()             | 方法/控制器 | 声明 路径参数。                                                             |
| @ApiProduces()          | 方法/控制器 | 声明接口 返回的 Content-Type。                                               |
| @ApiSchema()            | 模型     | 为模型定义 Schema 级别描述。（各类DTO）                                            |
| @ApiProperty()          | 模型     | 描述 DTO 中的字段。                                                         |
| @ApiPropertyOptional()  | 模型     | 声明可选字段。                                                              |
| @ApiQuery()             | 方法/控制器 | 声明 查询参数。                                                             |
| @ApiResponse()          | 方法/控制器 | 声明接口 响应结构与状态码。                                                       |
| @ApiSecurity()          | 方法/控制器 | 底层安全声明（通用）。                                                          |
| @ApiTags()              | 方法/控制器 | 接口分组（XX模块）。                                                          |
| @ApiCallbacks()         | 方法/控制器 | 描述 回调接口（Webhook 场景）。                                                 |

### 类型映射

在构建 **CRUD**（创建/读取/更新/删除）等功能时，基于基础实体类型创建变体通常很有用。Nest 提供了几个实用函数来执行类型转换，使这项任务更加便捷。

#### 1. 核心优势

* **减少冗余**：遵循 DRY (Don't Repeat Yourself) 原则，基于基类生成新类。
* **自动继承**：自动继承基类的验证装饰器（如 `class-validator`）和 Swagger 文档装饰器（`@ApiProperty`）。
* **类型安全**：生成的类是完全类型安全的。

#### 2. 四大核心函数

所有函数都需要从 `@nestjs/swagger` 包中导入。

##### 2.1 PartialType (部分类型)

**场景**：用于更新操作（Patch），将基类所有属性变为**可选**。

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateCatDto } from './create-cat.dto';

// UpdateCatDto 拥有 CreateCatDto 的所有属性，但都是可选的
export class UpdateCatDto extends PartialType(CreateCatDto) {}
```

##### 2.2 PickType (挑选类型)

**场景**：只需要基类中的某几个字段。

```typescript
import { PickType } from '@nestjs/swagger';
import { CreateCatDto } from './create-cat.dto';

// 只包含 'name' 和 'age' 字段
export class CatAgeDto extends PickType(CreateCatDto, ['name', 'age'] as const) {}
```

##### 2.3 OmitType (忽略类型)

**场景**：排除基类中的敏感字段或不需要的字段。

```typescript
import { OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// 排除 'password' 字段，保留其他所有字段
export class UserResponseDto extends OmitType(CreateUserDto, ['password'] as const) {}
```

##### 2.4 IntersectionType (交叉类型)

**场景**：合并两个不同的 DTO。

```typescript
import { IntersectionType } from '@nestjs/swagger';

// 合并 CreateCatDto 和 AdditionalCatInfo 的属性
export class CombinedCatDto extends IntersectionType(
  CreateCatDto,
  AdditionalCatInfo,
) {}
```

#### 3. 类型组合 (Composition)

这些映射类型可以相互嵌套组合，以构建更复杂的 DTO 逻辑。

**示例**：创建一个用于更新的 DTO，但排除掉 `id` 字段，且其余字段可选。

```typescript
import { PartialType, OmitType } from '@nestjs/swagger';

// 1. 先排除 'id'
// 2. 再将剩余属性变为可选
export class UpdateCatDto extends PartialType(
  OmitType(CreateCatDto, ['id'] as const),
) {}
```

#### 4. 注意事项

* **依赖包**：如果你不使用 Swagger，可以使用 `@nestjs/mapped-types` 包，用法完全一致，只是不包含 Swagger 专属的元数据处理。
* **Swagger 反射**：如果启用了 NestJS CLI 插件，这些映射类型会自动处理 Swagger 文档生成，无需手动添加 `@ApiProperty`。
