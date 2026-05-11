---
title: Node.js学习笔记
tags: 
- nodejs
- javascript
- backend
- npm
- commonjs
- esmodules
categories: 
- backend
abbrlink: 447719203
date: 2025-07-02 20:28:37
description: 'Node.js运行时环境学习笔记，涵盖模块化、全局API和核心模块的全面总结'
---



# Node.js学习笔记

Node.js 是一个开源、跨平台的 JavaScript 运行时环境。

## 概述

适合IO密集型运算(libuv和cpp底层的功劳),不适合CPU密集型计算(单线程)，可用于前后端开发。

前端：Vue Angular React Nuxtjs

后端：

1. Serverless

2. Web应用：Express,Nextjs,koa

3. RPC服务：gRPC

4. 爬虫：Puppeteer

5. BFF层

6. 及时性应用：Socket.io

桌面端：

1. Electron

2. Tauri

3. NW.js

移动端：

1. Weex

2. Ionic

3. React Native

基建端：

1. Webpack Vite

2. less scss

3. babel swc

4. inquire

CI/CD 反代 单元测试等都可以使用Node.js.

*我靠,怎么Nodejs什么都能干啊!*

## npm

**npm**是Nodejs的包管理工具。

### 常用npm命令

1. `npm init`:初始化空白包，创建package.json

2. `npm run script`: 运行npm命令（需要在package.json定义）

3. `npm install`:安装一个包或一组包,并会在当前目录存放一个*node_modules*,简写为`npm i ...`

4. `npm install <package-name> --save`:安装指定包,并将其添加到`package.json`,

5. `npm uninstall <package-name>`:卸载指定包

6. `npm config list` :查看Node npm版本,npm源,runtime目录等信息

7. `npm config registry`:查看npm源

8. `npm config set registry URLs`:设置npm源

9. `npm login`:登录npm

10. `npm publish`:将包发布到npm

### 关于package.json

1. `"version":"1.0.0"`
   
   - 第一位主版本号，针对重大更新或改动
   
   - 第二位次版本号，针对功能更新
   
   - 第三位修订号。针对bug修复

2. `"scripts":{...}`
   运行npm命令

3. `"repository:{...}"`
   设置仓库信息和地址

4. `"author":...`
   作者信息

5. `"license":...`
   项目许可证

6. 关于"dependencies"
   
   1. `"devDependencies":{...}`
      开发所需的依赖，通过`npm i <package-name> -D`添加到package.json，例如`webpack`,`vite`,`rollup`等开发环境需要的依赖
   
   2. `"dependencies:{...}"`
      生产环境所需的依赖
   
   3. `"peerDependencies":{...}`
      给插件编写人员或npm包的开发人员使用

### npm install原理

> 首先安装的依赖都会存放在根目录的node_modules,默认采用扁平化的方式安装，并且排序规则.bin第一个然后@系列，再然后按照首字母排序abcd等，并且使用的算法是广度优先遍历，在遍历依赖树时，npm会首先处理项目根目录下的依赖，然后逐层处理每个依赖包的依赖，直到所有依赖都被处理完毕。在处理每个依赖时，npm会检查该依赖的版本号是否符合依赖树中其他依赖的版本要求，如果不符合，则会尝试安装适合的版本

详细见:<a href="https://juejin.cn/post/7261119531891490877">Npm install原理</a>

![](./Node-js学习笔记/npm-install流程.webp "流程图")

注意:

1. 如果项目中package.json与package-lock.json的依赖和版本不一致,则拉取package.json的依赖为准,并覆盖package-lock.json

2. npm install在检查npm config时,遵循项目级npmrc->用户级npmrc->全局npmrc->npm内置npmrc的顺序

3. package-lock.json中的"name","integrity","version"信息会生产一个key索引,用于比较本地的缓存

### npm run原理

<a href="https://juejin.cn/post/7261235534663368741">npm run原理</a>

当前项目搜索是否存在*node/modules/.bin*,其次是全局,再其次是环境变量,如果没有就报错.

npm run也有生命周期,可以在package.json中的"scripts"设置"predev"和"postdev"参数执行相关文件.

### npx

> npx是一个命令行工具，它是npm 5.2.0版本中新增的功能。它允许用户在不安装全局包的情况下，运行已安装在本地项目中的包或者远程仓库中的包。
> 
> npx的作用是在命令行中运行node包中的可执行文件，而不需要全局安装这些包。这可以使开发人员更轻松地管理包的依赖关系，并且可以避免全局污染的问题。它还可以帮助开发人员在项目中使用不同版本的包，而不会出现版本冲突的问题。

**npx的作用**

1. 避免全局安装

2. 总是使用最新版本

3. 执行任意npm包

4. 可以执行Github gist等公开的JavaScript文件

### 发布npm包

**步骤:**

1. 创建npm账号(注意是npm官方源)

2. 登录npm账号

3. `npm publish`发布

### npm私服

好处:

- 可以离线使用,私有化部署

- 提供包的安全性,更好的管理包

- 提高包的下载速度

**步骤:**

1. 安装verdaccio
   
   ```shell
   npm i verdaccio -g
   ```

2. 启动npm私服服务
   
   ```shell
   verdaccio --listen 5000
   ```

3. 创建npm私服账户
   
   ```shell
   npm adduser --registry http://localhost:5000/
   ```

4. 发布到npm私服
   
   ```shell
   npm publish --registry http://localhost:5000/
   ```

注:如果已经设置好registry可以直接切换镜像然后更新



## Nodejs的模块化

Nodejs的模块化规范遵循两套:**`CommonJS`** 和 **`ESModules`**

### CommonJS规范

package.json中设置属性`"type"`为`"commonjs"`

**五种模式**

1. 使用`require()`引入自己编写的模块
   
   ```js
   require('./test.js')
   ```

2. 引入第三方模块
   
   ```js
   const md5 = require("md5")
   ```

3. 引入Nodejs内置模块
   
   ```js
   const fs = require("node:fs")
   ```

4. 引入C++扩展,addon,napi,node-gyp,.node等

5. 引入Json文件
   
   ```js
   const data = require('./data.json')
   ```

使用 **`module.exports`** 导出模块,也可使用ES6的解构赋值

```js
module.exports = {
    success:1,
}
```

### ESModules规范

package.json中设置属性`"type"`为`"module"`

**导入:**

```js
import axios from "axios"
```

ESM不支持引入json,高版本可以强兼容但需要额外的断言且会报警

```js
import json from './data.json' assert {type:"json"}
```

**导出:**

`export default`只能有一个

```js
export default {
    success :1
}
```

要查看某模块导出的所有内容:

```js
import * as all from './module.js'
console.log(all)
```

### CJS和ESM的区别

1. Cjs是基于**运行时**的同步加载,ESM是基于**编译时**的异步加载.一般来说,ESM下的import只能在作用域最顶层,若需要动态加载,可以使用import的函数模式(会返回一个Promise对象).
   
   ```js
   if(true){
       import('./test.js').then(res=>{
       console.log(res)
   })
   }
   ```

2. CJs可以修改值,但ESM不行

3. Cjs不可以Tree Shaking,ESM可以

4. Cjs的顶层`this`指向模块本身,ESM顶层`this`指向`undefined`

## 全局变量&全局API

在浏览器环境下,可以使用`var`的关键词将全局变量绑定到`window`对象上,但是node并不是浏览器环境,因此不存在BOM和DOM,而且使用`var`定义全局变量也会导致状态提升的问题.

### 全局变量

在nodejs中使用global定义全局变量.在ECMA2020中可使用`globalThis`作为全局变量,可以自动切换.

```js
global.name = "xxx";
```

### 全局API

由于nodejs中没有DOM和BOM，除了这些API，其他的ECMAscriptAPI基本都能用,例如`setTimeout`,`Promise`,`Math`,`Console`等

### Nodejs专有API

1. **`__dirname`**
   表示当前模块的所在目录的绝对路径,**ESM模式下不可使用,可用process.cwd()代替**

2. **`__filename`**

      表示当前模块文件的绝对路径，包括文件名和文件扩展名

> **`__dirname`  `__filename` 只能在cjs使用 esm规范没有这两个全局变量**

3. **`process`**
   处理进程相关的内容
   
   1. `process.argv`: 这是一个包含命令行参数的数组。第一个元素是Node.js的执行路径，第二个元素是当前执行的JavaScript文件的路径，之后的元素是传递给脚本的命令行参数。 
   
   2. `process.env`: 这是一个包含当前环境变量的对象。您可以通过`process.env`访问并操作环境变量。
   
   3. `process.cwd()`: 这个方法返回当前工作目录的路径。
   
   4. `process.on(event, listener)`: 用于注册事件监听器。您可以使用`process.on`监听诸如`exit`、`uncaughtException`等事件，并在事件发生时执行相应的回调函数。      
   
   5. `process.exit([code])`: 用于退出当前的Node.js进程。您可以提供一个可选的退出码作为参数。
   
   6. `process.pid`: 这个属性返回当前进程的PID（进程ID）。
   
   这些只是`process`对象的一些常用属性和方法，还有其他许多属性和方法可用于监控进程、设置信号处理、发送IPC消息等。
   需要注意的是，`process`对象是一个全局对象，可以在任何模块中直接访问，无需导入或定义。

4. **`Buffer`**
   
   1. 创建 `Buffer` 实例：
   * `Buffer.alloc(size[, fill[, encoding]])`: 创建一个指定大小的新的`Buffer`实例，初始内容为零。`fill`参数可用于填充缓冲区，`encoding`参数指定填充的字符编码。
   * `Buffer.from(array)`: 创建一个包含给定数组的`Buffer`实例。
   * `Buffer.from(string[, encoding])`: 创建一个包含给定字符串的`Buffer`实例。
   2. 读取和写入数据：
   * `buffer[index]`: 通过索引读取或写入`Buffer`实例中的特定字节。
   * `buffer.length`: 获取`Buffer`实例的字节长度。
   * `buffer.toString([encoding[, start[, end]]])`: 将`Buffer`实例转换为字符串。
   3. 转换数据：
   * `buffer.toJSON()`: 将Buffer实例转换为JSON对象。
   * `buffer.slice([start[, end]])`: 返回一个新的Buffer实例，其中包含原始Buffer实例的部分内容。
   4. 其他：
   * `Buffer.isBuffer(obj)`: 检查一个对象是否是Buffer实例。
   * `Buffer.concat(list[, totalLength])`: 将一组Buffer实例或字节数组连接起来形成一个新的Buffer实例。

## CSR SSR SEO

### 概述

在node环境下无法直接操作DOM和BOM,可以通过`jsdom`实现,模拟浏览器的环境

```js
const fs = require('node:fs')
const { JSDOM } = require('jsdom')

const dom = new JSDOM(`<!DOCTYPE html><div id='app'></div>`)

const document = dom.window.document

const window = dom.window

fetch('https://api.thecatapi.com/v1/images/search?limit=10&page=1').then(res => res.json()).then(data => {
    const app = document.getElementById('app')
    data.forEach(item=>{
       const img =  document.createElement('img')
       img.src = item.url
       img.style.width = '200px'
       img.style.height = '200px'
       app.appendChild(img)
    })
    fs.writeFileSync('./index.html', dom.serialize())
})


```

### CSR/SSR

我们上面的操作属于SSR `（Server-Side Rendering）`服务端渲染请求数据和拼装都在服务端完成，而我们的Vue,react 等框架这里不谈(nuxtjs,nextjs)，是在客户端完成渲染拼接的属于CSR`（Client-Side Rendering）`客户端渲染.

CSR 和 SSR 区别

1. 页面加载方式：
   
   * CSR：在 CSR 中，服务器返回一个初始的 HTML 页面，然后浏览器下载并执行 JavaScript 文件，JavaScript 负责动态生成并更新页面内容。这意味着初始页面加载时，内容较少，页面结构和样式可能存在一定的延迟。
   * SSR：在 SSR 中，服务器在返回给浏览器之前，会预先在服务器端生成完整的 HTML 页面，包含了初始的页面内容。浏览器接收到的是已经渲染好的 HTML 页面，因此初始加载的速度较快。

2. 内容生成和渲染：
   
   * CSR：在 CSR 中，页面的内容生成和渲染是由客户端的 JavaScript 脚本负责的。当数据变化时，JavaScript 会重新生成并更新 DOM，从而实现内容的动态变化。这种方式使得前端开发更加灵活，可以创建复杂的交互和动画效果。
   * SSR：在 SSR 中，服务器在渲染页面时会执行应用程序的代码，并生成最终的 HTML 页面。这意味着页面的初始内容是由服务器生成的，对于一些静态或少变的内容，可以提供更好的首次加载性能。

3. 用户交互和体验：
   
   * CSR：在 CSR 中，一旦初始页面加载完成，后续的用户交互通常是通过 AJAX 或 WebSocket 与服务器进行数据交互，然后通过 JavaScript 更新页面内容。这种方式可以提供更快的页面切换和响应速度，但对于搜索引擎爬虫和 SEO（搜索引擎优化）来说，可能需要一些额外的处理。
   * SSR：在 SSR 中，由于页面的初始内容是由服务器生成的，因此用户交互可以直接在服务器上执行，然后服务器返回更新后的页面。这样可以提供更好的首次加载性能和对搜索引擎友好的内容。

CSR 应用例如 ToB 后台管理系统 大屏可视化 都可以采用CSR渲染不需要很高的SEO支持

SSR 应用例如 内容密集型应用大部分是ToC 新闻网站 ，博客网站，电子商务，门户网站需要更高的SEO支持

## Path-路径模块

> path模块在不同的操作系统是有差异的(Windows/POSIX)

### POSIX

Unix,like-unix,macOS,Linux,WSL都遵循POSIX标准,使用正斜杠`/`

### Win32

使用双反斜杠`\\`

### 兼容性处理方法

```js
const path = require('path')

console.log(path.win32.basename('\\foo\\bar\\baz\\xm.html'))
```

### Path模块常用方法

1. `basename` :返回给定路径的文件名(含文件扩展名)

2. `dirname`:返回路径的目录名

3. `extname`:返回路径的扩展名(带点,形如`.html`)
   *如果没有,返回空字符串;如果有多个点,返回最后一个点后面的内容*

4. `path.join(params)`:将多个路径字符串合并为一个字符串

5. `path.resolve(params)`:解析路径,返回绝对路径;若有多个路径参数则返回最后一个;若只有一个相对路径,返回当前工作目录的绝对路径.
   
   ```js
   const path = require('path')
   
   console.log(path.resolve('/a'))
   // D:\a
   console.log(path.resolve('./index.js'))
   // D:\Project\Program\Node\index.js
   console.log(path.resolve('D:/Project/Program/Node','./node_modules','./.bin/tldts'))
   // D:\Project\Program\Node\node_modules\.bin\tldts
   ```

6. `path.parse()`:解析路径,返回对象

7. `path.format()`:根据传入的对象解析路径

## OS-系统模块

OS模块主要是和操作系统交互的模块

| 序号  | API                        | 作用                                                                                                                             |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **os.type()**              | 它在 Linux 上返回 `'Linux'`，在 macOS 上返回 `'Darwin'`，在 Windows 上返回 `'Windows_NT'`                                                     |
| 2   | **os.platform()**          | 返回标识为其编译 Node.js 二进制文件的操作系统平台的字符串。 该值在编译时设置。 可能的值为 `'aix'`、`'darwin'`、`'freebsd'`、`'linux'`、`'openbsd'`、`'sunos'`、以及 `'win32'` |
| 3   | **os.release()**           | 返回操作系统的版本例如10.xxxx win10                                                                                                       |
| 4   | **os.homedir()**           | 返回用户目录 例如c:\user\xiaoman 原理就是 windows `echo %USERPROFILE%` posix $HOME                                                         |
| 5   | **os.arch()**              | 返回cpu的架构 可能的值为 `'arm'`、`'arm64'`、`'ia32'`、`'mips'`、`'mipsel'`、`'ppc'`、`'ppc64'`、`'s390'`、`'s390x'`、以及 `'x64'`                  |
| 6   | **os.cpus()**              | 返回CPU的线程及详细信息                                                                                                                  |
| 7   | **os.networkInterfaces()** | 返回网络信息                                                                                                                         |

## Process-进程模块

1. `process.arch()`:返回操作系统CPU架构

2. `process.cwd()`:返回当前的工作目录,可代替`__dirname`使用

3. `process.argv()`:获取执行进程后面的参数 返回是一个数组 后面我们讲到命令行交互工具的时候会很有用，各种cli脚手架也是使用这种方式接受配置参数例如webpack

4. `process.memoryUsage()`:用于获取当前进程的内存使用情况。该方法返回一个对象，其中包含了各种内存使用指标，如 rss（Resident Set Size，常驻集大小）、heapTotal（堆区总大小）、heapUsed（已用堆大小）和 external（外部内存使用量）等
   
   ```js
   {
       rss: 30932992, // 常驻集大小 这是进程当前占用的物理内存量，不包括共享内存和页面缓存。它反映了进程实际占用的物理内存大小
       heapTotal: 6438912, //堆区总大小 这是 V8 引擎为 JavaScript 对象分配的内存量。它包括了已用和未用的堆内存
       heapUsed: 5678624,  //已用堆大小
       external: 423221, //外部内存使用量 这部分内存不是由 Node.js 进程直接分配的，而是由其他 C/C++ 对象或系统分配的
       arrayBuffers: 17606 //是用于处理二进制数据的对象类型，它使用了 JavaScript 中的 ArrayBuffer 接口。这个属性显示了当前进程中 ArrayBuffers 的数量
     }
   
   ```

5. `process.exit()`:退出进程

6. `process.kill(pid)`:杀死进程

7. `process.env()`:获取或修改当前操作系统的环境变量,但修改只在当前进程生效,不会真正影响系统的环境变量.

**注:** 可以使用第三方库`cross-env`实现环境变量的切换

## child_process-子进程模块

1. `exec('command',(err,stdout,stderr)=>{})`在shell执行命令,异步方法,有回调函数,`stdout`是输出,`stderr`是错误信息.

2. `execSync()`:功能同上,但是同步方法,不需要回调函数.

3. `spawn()`:执行命令(shell命令无上限,返回流,实时返回)

4. `spawnSync()`:执行命令(同步方法)
   cwd \<string> 子进程的当前工作目录。
   env \<Object> 环境变量键值对。
   encoding \<string> 默认为 'utf8'。
   shell \<string> 用于执行命令的 shell。 在 UNIX 上默认为 '/bin/sh'，在 Windows 上默认为 process.env.ComSpec。 详见 Shell Requirements 与 Default Windows Shell。
   timeout \<number> 默认为 0。
   maxBuffer \<number> stdout 或 stderr 允许的最大字节数。 默认为 200\*1024。 如果超过限制，则子进程会被终止。 查看警告： maxBuffer and Unicode。
   killSignal \<string> | \<integer> 默认为 'SIGTERM'。
   uid \<number> 设置该进程的用户标识。（详见 setuid(2)）
   gid \<number> 设置该进程的组标识。（详见 setgid(2)）

```js
const {spawn} = require('child_process')

const {stdout} = spawn('netstat')

stdout.on('data',(msg)=>{
    console.log(msg.toString())
})

stdout.on('close',(msg)=>{
    console.log("End")
})
```

5. `execFile()`执行脚本文件
6. `execFileSync()`:同上,同步方法
7. `fork()`:创建子进程,但仅限于js模块,父子进程可相互通信

## Events-事件模块

Node.js核心API都采用异步事件驱动架构,通过有效的方法监听事件状态的变化,在变化时做出相应的动作.

### 事件模型

`发布-订阅设计模式`

<img title="" src="./Node-js学习笔记/re-sub.webp" alt="">

当一个发布者有新消息时，就将这个消息发布到调度中心。调度中心就会将这个消息通知给所有订阅者。这就实现了发布者和订阅者之间的解耦，发布者和订阅者不再直接依赖于彼此，他们可以独立地扩展自己.

```js

const eventEmitter = require('events')

// 发布订阅模式 off on emit once

const bus = new eventEmitter()

const fn = (name)=>{
    console.log(name)
}


//订阅一个事件
bus.on('test',fn)
//移除一个事件订阅
bus.off('test',fn)
//仅执行一次
bus.once('testonce',()=>{
    console.log("Only run once.")
})

//发布事件
bus.emit('test',"xm")

bus.emit('testonce')
bus.emit('testonce')
```

监听消息数量默认是**10**个,可以通过调用`setMaxListeners`传入数量.

## Util-工具模块

util是Nodejs内部提供的实用工具类API.

1. **`util.promisify()`** :将回调函数包装为Promise类型

*注:* 如果有多个返回值,res为js对象;若只有一个返回值,res即是本身

```js
import { exec } from 'node:child_process'
import util from 'node:util'

const execPromise = util.promisify(exec)

execPromise('node -v').then(res=>{
    console.log(res,'res')
}).catch(err=>{
    console.log(err,'err')
})

```

2. **`util.callbackify`** :将promise类型的方法变成 回调函数。
3. **`util.format`**:输入格式化
   * `%s`: `String` 将用于转换除 `BigInt`、`Object` 和 `-0` 之外的所有值。 `BigInt` 值将用 `n` 表示，没有用户定义的 `toString` 函数的对象使用具有选项 `{ depth: 0, colors: false, compact: 3 }` 的 `util.inspect()` 进行检查。
   * `%d`: `Number` 将用于转换除 `BigInt` 和 `Symbol` 之外的所有值。
   * `%i`: `parseInt(value, 10)` 用于除 `BigInt` 和 `Symbol` 之外的所有值。
   * `%f`: `parseFloat(value)` 用于除 `Symbol` 之外的所有值。
   * `%j`: JSON。 如果参数包含循环引用，则替换为字符串 `'[Circular]'`。
   * `%o`: `Object`. 具有通用 JavaScript 对象格式的对象的字符串表示形式。 类似于具有选项 `{ showHidden: true, showProxy: true }` 的 `util.inspect()`。 这将显示完整的对象，包括不可枚举的属性和代理。
   * `%O`: `Object`. 具有通用 JavaScript 对象格式的对象的字符串表示形式。 类似于没有选项的 `util.inspect()`。 这将显示完整的对象，但不包括不可枚举的属性和代理。
   * `%c`: `CSS`. 此说明符被忽略，将跳过任何传入的 CSS。
   * `%%`: 单个百分号 (`'%'`)。 这不消费参数。

## Fs-文件模块

### 1. 读取文件

  `fs.readFile()`:异步方法

```js
const fs = require('node:fs')

// 异步方法
fs.readFile('./index.txt',{
    encoding:'utf-8',
    flag:'r'
},(err,data)=>{
    if(err){
        throw err
    }
    console.log(data)
})


```

`fs.readFileSync()`:同步方法

```js
const fs = require('node:fs')

// 同步方法,会导致代码阻塞
const res = fs.readFileSync('./index.txt')
// sync方法的返回值都是buffer流,需要toString方法处理后才能得到原始值
console.log(res.toString())
```

`fs2.readFile().then()`:Promise包装方法

```js
const fs2 = require('node:fs/promises')

//Promise方法
fs2.readFile('./index.txt').then(res=>{
    console.log(res.toString('utf-8'))
})
```

`fs.createReadStream()`:流式读取文件(适合大文件)

```js
//流式读取-大文件处理

const readStream = fs.createReadStream('./index.txt')

readStream.on('data',(chunk)=>{
    console.log(chunk.toString('utf-8'))
})

readStream.on('end',()=>{
    console.log("读取完成")
})
```

### 2. 文件夹操作

`fs.mkdirSync()`:创建文件夹,`recursive:true`允许多层文件夹嵌套

```js
// 创建文件夹
fs.mkdirSync('./works/native',{
    recursive:true
})
```

`fs.rmdirSync()`:删除文件夹,若要删除单文件可用`fs.rmSync()`

### 3.重命名

`fs.renameSync('old','new')`:重命名文件

### 4.文件监听

`fs.watch(filePath,(event,filename)=>{})`:监听文件事件变化 

```js
const fs = require('node:fs')

fs.watchFile('./index.txt',(event,filename)=>{
    console.log(event)
    console.log(filename)
})
```

`fs.watchFile(filePath,(cur,pre)=>{})`:监听文件的元数据信息变化

### 5.写入文件

`fs.writeFileSync(fileName,contentString)`:向指定路径下文件写入内容(默认覆盖方法)

*注:*,第三个参数`{flag:'a'}`表示追加,`fs.appendFileSync()`也可实现相同功能

* `'a'`: 打开文件进行追加。 如果文件不存在，则创建该文件。

* `'ax'`: 类似于 `'a'` 但如果路径存在则失败。

* `'a+'`: 打开文件进行读取和追加。 如果文件不存在，则创建该文件。

* `'ax+'`: 类似于 `'a+'` 但如果路径存在则失败。

* `'as'`: 以同步模式打开文件进行追加。 如果文件不存在，则创建该文件。

* `'as+'`: 以同步模式打开文件进行读取和追加。 如果文件不存在，则创建该文件。

* `'r'`: 打开文件进行读取。 如果文件不存在，则会发生异常。

* `'r+'`: 打开文件进行读写。 如果文件不存在，则会发生异常。

* `'rs+'`: 以同步模式打开文件进行读写。 指示操作系统绕过本地文件系统缓存。
  这主要用于在 NFS 挂载上打开文件，因为它允许跳过可能过时的本地缓存。 它对 I/O 性能有非常实际的影响，因此除非需要，否则不建议使用此标志。
  这不会将 `fs.open()` 或 `fsPromises.open()` 变成同步阻塞调用。 如果需要同步操作，应该使用类似 `fs.openSync()` 的东西。

* `'w'`: 打开文件进行写入。 创建（如果它不存在）或截断（如果它存在）该文件。

* `'wx'`: 类似于 `'w'` 但如果路径存在则失败。

* `'w+'`: 打开文件进行读写。 创建（如果它不存在）或截断（如果它存在）该文件。

* `'wx+'`: 类似于 `'w+'` 但如果路径存在则失败。

`fs.createWriteStream(filePath)`:创建可写流,适合大量数据的写入.

```js
const fs = require('node:fs')
const verse = [
    '你若三冬来',
    '换我一城雪白',
    '相思风中开',
]
const writeStream = fs.createWriteStream('./index.txt')

verse.forEach(item=>{
    writeStream.write(item + '\n')
})

writeStream.end()
```

### 6.软连接/硬链接

`fs.linkSync(filePath,newFilePath)`:创建硬链接文件,类似共享文件,可用于文件备份

`fs.symlinkSync(filePath,newFilePath)`:创建硬链接,类似win的快捷方式,源文件删除后无效.



## Zlib-解压缩

在 Node.js 中，`zlib` 模块提供了对数据压缩和解压缩的功能，以便在应用程序中减少数据的传输大小和提高性能。该模块支持多种压缩算法，包括 Deflate、Gzip 和 Raw Deflate。

Gzip流式压缩:

```js
const zlib = require('node:zlib')
const fs = require('node:fs')

const readStream = fs.createReadStream('./index.txt')
const writeStream = fs.createWriteStream('./index.txt.gz') //gz后缀
readStream.pipe(zlib.createGzip()).pipe(writeStream)
```



Gzip流式解压:

```js
const zlib = require('node:zlib')
const fs = require('node:fs')

const readStream = fs.createReadStream('./index.txt')
const writeStream = fs.createWriteStream('./index.txt.gz') //gz后缀
readStream.pipe(zlib.createGunzip()).pipe(writeStream)
```

Defalte同理,改为`createDefalte()`压缩,`createInfalte()`解压即可.

Gzip文件解压:

```js
const zlib = require('node:zlib')
const fs = require('node:fs')


let content = '...'
const res = zlib.gzipSync() //同步方法
```

## Http-http服务

"http" 模块是 Node.js 中用于创建和处理 HTTP 服务器和客户端的核心模块。它使得构建基于 HTTP 协议的应用程序变得更加简单和灵活。

1. 创建 Web 服务器：你可以使用 "http" 模块创建一个 HTTP 服务器，用于提供 Web 应用程序或网站。通过监听特定的端口，服务器可以接收客户端的请求，并生成响应。你可以处理不同的路由、请求方法和参数，实现自定义的业务逻辑。
2. 构建 RESTful API："http" 模块使得构建 RESTful API 变得简单。你可以使用 HTTP 请求方法（如 GET、POST、PUT、DELETE 等）和路径来定义 API 的不同端点。通过解析请求参数、验证身份和权限，以及生成相应的 JSON 或其他数据格式，你可以构建强大的 API 服务。
3. 代理服务器："http" 模块还可以用于创建代理服务器，用于转发客户端的请求到其他服务器。代理服务器可以用于负载均衡、缓存、安全过滤或跨域请求等场景。通过在代理服务器上添加逻辑，你可以对请求和响应进行修改、记录或过滤。
4. 文件服务器："http" 模块可以用于创建一个简单的文件服务器，用于提供静态文件（如 HTML、CSS、JavaScript、图像等）。通过读取文件并将其作为响应发送给客户端，你可以轻松地构建一个基本的文件服务器。

```js
const http = require('node:http'); // 引入 http 模块
const url = require('node:url'); // 引入 url 模块

// 创建 HTTP 服务器，并传入回调函数用于处理请求和生成响应
http.createServer((req, res) => {
  const { pathname, query } = url.parse(req.url, true); // 解析请求的 URL，获取路径和查询参数

  if (req.method === 'POST') { // 检查请求方法是否为 POST
    if (pathname === '/post') { // 检查路径是否为 '/post'
      let data = '';
      req.on('data', (chunk) => {
        data += chunk; // 获取 POST 请求的数据
        console.log(data);
      });
      req.on('end', () => {
        res.setHeader('Content-Type', 'application/json'); // 设置响应头的 Content-Type 为 'application/json'
        res.statusCode = 200; // 设置响应状态码为 200
        res.end(data); // 将获取到的数据作为响应体返回
      });
    } else {
      res.setHeader('Content-Type', 'application/json'); // 设置响应头的 Content-Type 为 'application/json'
      res.statusCode = 404; // 设置响应状态码为 404
      res.end('Not Found'); // 返回 'Not Found' 作为响应体
    }
  } else if (req.method === 'GET') { // 检查请求方法是否为 GET
    if (pathname === '/get') { // 检查路径是否为 '/get'
      console.log(query.a); // 打印查询参数中的键名为 'a' 的值
      res.end('get success'); // 返回 'get success' 作为响应体
    }
  }
}).listen(98, () => {
  console.log('server is running on port 98'); // 打印服务器启动的信息
});

```

Http请求

```http
POST http://localhost:98/post/xxx HTTP/1.1

Content-Type: application/json

{
     "name":"小满zs"
}


GET http://localhost:98/get?a=1&b=2 HTTP/1.1


```
