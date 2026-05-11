---
title: 'Express:轻量化的Web开发框架'
tags: 
- express
- nodejs
- web-framework
- backend
categories: 
- backend
abbrlink: 1742893792
date: 2024-10-27 22:37:23
keywords: express,nodejs,frontend
description: 'Express轻量化Node.js Web开发框架学习笔记，涵盖路由、中间件和模板引擎'
---



# Express：轻量化的Web开发框架学习笔记

## Vol1.安装和使用Express

### 1.1 安装Express

```shell
$ npm install -g express-generator
//在nodejs下安装Express
express ${targetProjectName}
//创建Express项目
npm install
//在项目文件夹内安装依赖
npm start
//启动项目，于http://localhost:3000
```

### 1.2 项目结构

#### Express默认应用中文件及其作用

| 目录名/文件名           | 类型  | 作用              |
| ----------------- | --- | --------------- |
| bin               | 目录  | 服务器脚本默认目录       |
| bin/www.js        | 文件  | 服务器默认脚本，即启动服务脚本 |
| node_modules      | 目录  | 依赖包安装目录，用于存放依赖包 |
| public            | 目录  | 静态资源目录，用于存放静态资源 |
| routes            | 目录  | 路由目录，用于存放路由文件   |
| routes/index.js   | 文件  | 首页路由文件          |
| routes/users.js   | 文件  | 用户路由文件          |
| views             | 目录  | 页面目录，用于存放页面文件   |
| views/error.jade  | 文件  | 错误页面            |
| views/index.jade  | 文件  | 首页              |
| views/layout.jade | 文件  | 页面共用布局          |
| app.js            | 文件  | 应用主文件           |
| package.json      | 文件  | 项目配置文件          |
| package-lock.json | 文件  | 锁定的项目配置文件       |

### 1.3 Express路由

#### 1.3.1 GET请求

route/index.js路由文件，即首页路由文件，是一个GET请求路由，格式如下：

```js
var express = require('express') //引入
var router = express.Router() //引入Express路由对象

//首页路由

router.get('/',function(req,res,next){
    res.render('index',{title:'Express'});
});
moudule.exports = router
//导出路由
```



#### 1.3.2 自定义路由

```js
//定义一个GET请求‘/world’的路由，执行方法
router.get('/world',function (req, res, next) {
  res.render('index',{title: 'Hello World!'});
})
```

#### 1.3.3 其他请求方式的路由

```js
//router.post()
//router.put()
//router.delete()
```

#### 1.3.4 路由匹配规则

**模糊匹配符**

| 符号         | 含义         | 效果                   |
| ---------- | ---------- | -------------------- |
| +          | 紧接着前一个字母重复 | we+st ->weest weeest |
| (element)? | 括号内元素缺失    | w(es)?t ->wt         |
| *          | 两端之间插入任意元素 | we * st ->we123st    |

同时支持了正则表达式，[正则表达式 – 教程 | 菜鸟教程](https://www.runoob.com/regexp/regexp-tutorial.html)

#### 1.3.5 中间件

在项目开发过程中，有时需要使用共同的方法来完成请求，为了提高效率，可以将这些共同的方法单独提出来，即中间件。

当前端使用GET方法请求根路径的时候，会进入第二个参数function中，这个路由处理方法就是Express中的中间件。

在Express中，中间件会被传入三个形参。

| 参数顺序 | 形参名  | 描述             |
| ---- | ---- | -------------- |
| 1    | req  | 请求数据对象Request  |
| 2    | res  | 返回数据对象Response |
| 3    | next | 下一步函数          |

例如，实现验证功能，可以在路由处理方法前再加一个方法

```js
router.get('/car',function(req,res,next){
    console.log('这里是中间件');
    next();
},function(req,res,next){
    res.send('这里是返回');
});
```



### 1.4 Express页面

#### 1.4.1 更换模板引擎

Express的默认引擎是jade，为了便于开发，可以换成更简洁的art-template。

安装依赖

```shell
npm install -S art-template
npm install -S express-art-template
```

修改项目根目录下的`app.js`，切换模板引擎。

```js
app.set('view engine','jade');
//原
app.engine('.html',require('express-art-template'));
app.set('view engine','html')
```



#### 1.4.2 渲染数据到页面上

在Express中将数据渲染到页面上的方法是Response对象的render方法，例如：

```js
router.get('/', function(req, res, next) {
  res.render('index', { title: 'hello'});
});
```

这段代码向index.html传入了一个键值对{ title: 'hello'}，在html界面可以使用双花括号来接收字段：

```html
<p>This is the value of title variable: {{ title }}</p>
```

#### 1.4.3 条件渲染

##### 1.基本条件渲染

*Vue.js:在想我的事情？*

```html
<p>This is the value of title variable: {{ title }}</p>
{{if age < 30}}
<p>今年{{ age }}岁了，还没到30岁生日，加油！</p>
{{/if}}
{{if age > 30}}
<p>今年{{ age }}岁了，30岁生日已经过了</p>
{{/if}}


//格式为{{if CONDITION}} </> {{/if}}
```

##### 2.嵌套条件渲染

同理，略。

#### 1.4.4 渲染循环

##### 基本渲染循环

```html
<!-- index.html -->
<h2>循环渲染</h2>
{{each list as item}}
<p>数据id{{item.id}}，内容{{item.content}}</p>
{{/each}}
```

在art-template中,循环渲染的固定写法是`{{each LIST as ITEM}}`

### 1.5 请求对象Request

#### 1.5.1 Request.url属性

Request.url属性可以获得请求地址。

```js
#./routes/index.js
router.get('/abcd',function (req, res, next) {
  console.log(req.url);
  res.render('index',{title:'Express'})
})

```

#### 1.5.2 Request.query属性

Request.query常用来获取GET请求参数，它是一个对象，包含路由中每个查询字符串参数的属性。**只能获得GET请求方式**

```js
router.get('/book',function (req, res, next) {
  console.log(req.query);
  res.render('index',{title:'Express'});
})
```

#### 1.5.3 Request.body属性

Express将POST请求参数封装在了Request.body对象中，以键值对形式存在。

```js
router.get('/abc',function (req, res, next) {
  console.log(req.body);
  res.render('index',{title:'Express'});
})
```

#### 1.5.4 Request.params属性

```js
router.get('/book/:id',function(req,res,next){
    res.send(req.params)
    // 此时返回{id:2}
    res.render('index',{title:'Express'});
})
```

Express通过URL传入的参数存到了Request.params属性，同时也是一个对象，可以获取自定义URL的任意一个参数。

#### 1.5.5 Request.headers属性

```js
router.post('/abc',function(req,res,next){
    res.send(req.headers);
})
```

Express也可以获取到请求头的数据，存在Request.header中。

#### 1.5.6 Request.cookies属性

```js
router.post('/abc',function(req,res,next){
    res.send(req.cookies);
})
```

Express提供了简单的获取客户端cookies的方式，并以对象方式储存。

### 1.6 返回对象Response

#### 1.6.1 Response.render()方法

`Response.render(#view:String,locals:Object,callback:Function)`

**#view:** 必选项，页面文件，用于渲染的文件路径。

**locals:** 属性定义页面的局部变量。

**callback:** 回调函数，返回困难的错误和呈现的字符串，但不执行自动响应。发生错误时在`next(err)`中内部调用。

```js
res.render('index') //渲染一个页面文件到客户端


res.render('index',function(err,html){
    res.send(html);
    //回调函数，明确指定发送的HTML字符串
})

res.render('user',{name:'Tobi'},function(err,html))
//渲染完毕的回调函数

```


