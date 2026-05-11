---
title: TypeScript学习笔记
tags: 
- typescript
- javascript
- typing
- frontend
categories: 
- frontend
abbrlink: 1251921997
date: 2025-08-02 13:14:31
keywords: typescript,javascript,ts,js,web
description: 'TypeScript类型系统学习笔记，从基础到高级类型应用'
---

# TypeScript学习笔记

## 一.TypeScript简介

TypeScript 是 JavaScript 的一个超集，支持 ECMAScript 6 标准（[ES6 教程](https://www.runoob.com/w3cnote/es6-tutorial.html)）。

TypeScript 由微软开发的自由和开源的编程语言，在 JavaScript 的基础上增加了静态类型检查的超集，添加了诸多现代开发特性。

TypeScript 设计目标是开发大型应用，它可以编译成纯 JavaScript，编译出来的 JavaScript 可以运行在任何浏览器上。

## 二.为什么需要TypeScript

1. 数据类型问题

2. 逻辑漏洞问题

3. 访问不存在的属性

4. 拼写错误

## 三.编译TypeScript

### 1.命令行编译

1. 创建`.ts`文件

2. 全局安装`TypeScript`(此处为使用的包管理工具是pnpm,pnpm较npm速度有显著提升且节约空间)

```shell
pnpm add -g typescript
```

3. 使用`tsc`命令编译

```shell
pnpm exec tsc demo.ts
```

### 2.自动化编译

1. 全局安装

```shell
pnpm init
pnpm i ts-node 
pnpm i typescript 
pnpm i tsc 
```

2. 创建编译控制文件

```shell
pnpm exec tsc --init
```

3. 监视目录中`.ts`的文件变化

```shell
pnpm exec tsc --w
```

### 3.Code Runner插件(适用VSCode等平台)

1. 在VS Code下安装`Code Runner`插件
2. 进入插件设置,勾选`File Directory As Cwd`
3. 创建`.ts`文件
4. 在目录所在终端下依次执行

```shell
pnpm init
pnpm add typescript
pnpm exec tsc --init
```

5. 点击右上角执行按钮

## 四.类型声明

使用 `:`﻿来对变量或函数形参，进行类型声明。

```ts
let a: string = "StringType"
const add = (numOne:number,numTwo:number) =>{
    return numOne + numTwo
}

const res = add(1,2)
```

`:`也可以给变量附加上字面量类型,但不常见。

```ts
let s:'TS你好'
```

## 五.类型推断

TypeScript 能够自动推断变量的类型。比如当你声明一个变量并赋值时，TypeScript 会根据赋值来推断这个变量的类型，不需要每次都显式声明类型。

## 六.类型总览

### JavaScript数据类型

#### 基本数据类型

| 数据类型        | 描述                 | 示例                   | 特点                                               |
| ----------- | ------------------ | -------------------- | ------------------------------------------------ |
| `Number`    | 数字类型，包括整数和浮点数      | `42`, `3.14`         | 所有数字都是64位浮点数存储，包含特殊值`Infinity`、`-Infinity`和`NaN` |
| `String`    | 字符串类型，表示文本数据       | `"hello"`, `'world'` | 不可变，可以使用单引号或双引号表示                                |
| `Boolean`   | 布尔类型，表示逻辑值         | `true`, `false`      | 只有两个值：`true`和`false`                             |
| `Undefined` | 表示未定义的值            | `undefined`          | 变量声明但未赋值时的默认值                                    |
| `Null`      | 表示空值               | `null`               | 表示有意设置的空值                                        |
| `Symbol`    | ES6新增，表示唯一的、不可变的值  | `Symbol('desc')`     | 主要用于对象属性的唯一标识符                                   |
| `BigInt`    | ES2020新增，表示任意精度的整数 | `123n`               | 用于表示大于2^53-1的整数                                  |

#### 引用数据类型

| 数据类型       | 描述                                    | 示例               |
| ---------- | ------------------------------------- | ---------------- |
| `Object`   | 对象类型，用于存储键值集合                         | `{name: 'John'}` |
| `Array`    | 数组类型，特殊类型的对象                          | `[1, 2, 3]`      |
| `Function` | 函数类型，也是对象的一种                          | `function() {}`  |
| `Date`     | 日期类型                                  | `new Date()`     |
| `RegExp`   | 正则表达式类型                               | `/pattern/flags` |
| ...其他对象    | 包括`Map`, `Set`, `WeakMap`, `WeakSet`等 | `new Map()`      |

#### 特殊情况

##### 1. `Undefined`

* **特点**：
  
  * 表示变量已声明但未赋值时的默认值
  
  * 类型为`"undefined"`
  
  * 使用`typeof`检测未声明变量也会返回`"undefined"`
  
  * 通常表示"缺少值"，即应该有值但未定义
  
  * 不建议手动赋值为`undefined`，应使用`null`表示有意空值

```js
let x;
console.log(x); // undefined
console.log(typeof x); // "undefined"
console.log(typeof y); // "undefined" (y未声明)
```



##### 2. `Null`

* **特点**：
  
  * 表示"无"的对象，即该处不应该有值
  
  * 类型为`"object"`（这是历史遗留bug）
  
  * 使用`=== null`可以准确检测`null`值
  
  * 通常用于主动释放对象引用
  
  * 是原型链的终点（`Object.prototype.__proto__ === null`）

```js
let x = null;
console.log(typeof x); // "object" (注意这是历史遗留问题)
console.log(x === null); // true
```

##### `undefined` vs `null`

| 比较点    | `undefined`                        | `null`                   |
| ------ | ---------------------------------- | ------------------------ |
| 含义     | 表示未定义                              | 表示空值                     |
| 类型     | `"undefined"`                      | `"object"`               |
| 产生方式   | 变量未赋值时的默认值                         | 必须显式赋值                   |
| 转换为数值  | `NaN`                              | `0`                      |
| 使用场景   | 表示"缺少值"                            | 表示"无对象"                  |
| 严格相等比较 | `undefined === undefined` → `true` | `null === null` → `true` |

#### 类型检测方法

1. `typeof` 操作符
   
   * 返回类型字符串
   
   * `null`返回`"object"`（历史遗留问题，底层是32为）
   
   * 函数返回`"function"`

2. `instanceof` 操作符
   
   * 检测对象是否属于特定构造函数

3. `Object.prototype.toString.call()`
   
   * 最准确的类型检测方法

### TypeScript数据类型

包含全部JavaScript数据类型

#### 新增基本数据类型

| 类型        | 描述          | 示例                           | 特点                                         |
| --------- | ----------- | ---------------------------- | ------------------------------------------ |
| `any`     | 任意类型，跳过类型检查 | `let x: any = 'hello';`      | 1. 可以赋值为任何值<br>2. 可以访问任何属性/方法<br>3. 尽量避免使用 |
| `unknown` | 类型安全的`any`  | `let y: unknown = 4;`        | 1. 可以赋值为任何值<br>2. 不能直接操作，需先类型断言或收窄         |
| `never`   | 表示永不存在的值的类型 | `function error(): never {}` | 1. 用于总是抛出异常的函数<br>2. 无限循环函数的返回类型           |
| `void`    | 表示没有返回值的函数  | `function fn(): void {}`     | 1. 与`undefined`兼容<br>2. 常用于函数无显式返回值        |

#### 新增复合类型

| 类型      | 描述         | 示例                         | 特点                                         |
| ------- | ---------- | -------------------------- | ------------------------------------------ |
| `tuple` | 固定长度和类型的数组 | `let x: [string, number];` | 1. 长度固定<br>2. 每个位置类型固定<br>3. 越界元素使用联合类型    |
| `enum`  | 枚举类型       | `enum Color {Red, Green}`  | 1. 默认从0开始编号<br>2. 可手动赋值<br>3. 支持反向映射(数字枚举) |

#### 新增类型定义方式

| 方式          | 描述             | 示例                      | 区别                                                |
| ----------- | -------------- | ----------------------- | ------------------------------------------------- |
| `type`      | 类型别名，可定义各种类型组合 | `type Point = {...}`    | 1. 更灵活，支持联合类型、交叉类型等高级类型<br>2. 不能重复声明              |
| `interface` | 接口，主要用于定义对象形状  | `interface Point {...}` | 1. 更适合定义对象结构<br>2. 支持声明合并<br>3. 可被类实现(implements) |

#### 类型对比

##### `any` vs `unknown`

| 比较点  | `any`      | `unknown`            |
| ---- | ---------- | -------------------- |
| 类型安全 | 不安全，编译时不检查 | 安全，使用时需类型断言或收窄       |
| 赋值   | 可赋值给任意类型   | 只能赋值给`unknown`或`any` |
| 属性访问 | 可直接访问任意属性  | 不能直接访问属性             |
| 使用建议 | 尽量避免使用     | 优先使用替代`any`          |

##### `void` vs `undefined` vs `never`

| 比较点  | `void`                    | `undefined`       | `never`    |
| ---- | ------------------------- | ----------------- | ---------- |
| 含义   | 函数无返回值                    | 未定义的值             | 永不存在的值     |
| 变量使用 | 不能作为变量类型                  | 可以作为变量类型          | 不能作为变量实际类型 |
| 函数返回 | 函数无`return`或返回`undefined` | 必须显式返回`undefined` | 函数无法正常返回   |
| 赋值兼容 | 可接受`undefined`            | 不能赋值给`void`变量     | 是所有类型的子类型  |

#### 原始类型与包装类型

在JavaScript﻿中的这些内置构造函数：` ﻿Number`﻿、`﻿String`﻿、﻿`Boolean﻿`，用于创建对应的包装对象， 在日常开发时很少使用，在﻿TypeScript﻿中也是同理，所以在TypeScript﻿中进行类型声明时，通常都是用小写的`﻿number`﻿、﻿`string﻿`、`﻿bo
olean﻿`。

1. **原始类型 VS 包装对象：**
   原始类型：如number﻿、﻿string﻿、﻿boolean﻿，在 JavaScript 中是简单数据
   类型，它们在内存中占用空间少，处理速度快。
   包装对象：如Number﻿对象、﻿String﻿对象、﻿Boolean﻿对象，是复杂类型，在
   内存中占用更多空间，在日常开发时很少由开发人员自己创建包装对象。

2. **自动装箱：** JavaScript 在必要时会自动将原始类型包装成对象，以便调用方法或访问属性。
   
   

## 七.常用类型

### 1. any

`any`:放弃对该变量的类型检查,可赋值给任意类型的变量

```ts
let a: any 
a = 100
a = 'TS你好'
a = false
```

### 2. unknown

`unknown:`未知类型

1. `unknown`可以理解为类型安全的具体类型

```ts
let a:unknown
a = 99
```

2. `unknown`会强制开发者在使用前进行类型检查,可以通过**类型判断**或**类型断言**的方式实现安全操作变量。

```ts
// 设置a的类型为unknown
let a: unknown
a = 'hello'
//第一种方式：加类型判断
if(typeof a === 'string'){
x = a
console.log(x)
}
//第二种方式：加断言
x = a as string
//第三种方式：加断言
x = <string>a
```

3. 读取`any`属性的任何属性都不会报错，而`unknown`则会。

### 3. never

`never`:任何值都不是,不能有值。

1. 几乎不使用`never`,对变量赋值无意义。

```ts
let a :never
// 任何赋值都无意义
```

2. `never`﻿一般是﻿TypeScript﻿主动推断出来的

3. `never`可用于限制函数的返回值(如抛出错误的情况)，表示函数不能结束，或者不能正常结束。

```ts
function throwError(str:string):never{
    throw new Error('程序异常退出'+str)
}
```

### 4. void

`void`:用于函数返回值声明，表示函数返回值为空。

1. 函数返回值为空，调用者也不应该依赖其返回值进行任何操作。

```ts

const logMsg = (msg:string):void =>{
    console.log(msg)
}
logMsg('TS你好')
```

> 注意：编码者没有编写return﻿指定函数返回值，所以﻿logMessage﻿函数是没有显式返回值的，但会有一个隐式返回值 ，是`﻿undefined`﻿。虽然函数返回类型为﻿`void﻿`，但也是可以接受undefined﻿的，简单记： ﻿`undefined﻿`是﻿`void`﻿可以接受的一种“空”。

2. 对函数返回值声明为`void`的函数，TS接受如下写法

```ts
// 无警告
function logMessage(msg:string):void{
console.log(msg)
}
// 无警告
function logMessage(msg:string):void{
console.log(msg)
return;
}
// 无警告
function logMessage(msg:string):void{
console.log(msg)
return undefined
}
```

3. **返回值类型为﻿void﻿的函数，调用者不应依赖其返回值进行任何操作！**:理解来说,被`void`声明的函数返回值,TS希望开发者从语义层面上不要关注其返回值,不期望依赖该函数用于其他的操作。

```ts
function logMessage(msg:string):void{
console.log(msg)
}
let result = logMessage('你好')
if(result){ // 此行报错：无法测试 "void" 类型的表达式的真实性
console.
```

```ts
function logMessage(msg:string):undefined{
console.log(msg)
}
let result = logMessage('你好')
if(result){ // 此行无警告
console.log('logMessage')
```

**理解 void 与 undefined:**
`void﻿`是一个广泛的概念，用来表达“空”，而 ﻿`undefined﻿`则是这种“空”的具体实现。
因此可以说 `﻿undefined`﻿是﻿`void﻿`能接受的一种“空”的状态。也可以理解为： `void`﻿包含`﻿undefined`﻿，但﻿`void﻿`所表达的语义超越了﻿`undefined﻿`， ﻿`void﻿`是一种意图上的约定，而不仅仅是特定值的限制。

**总结:**

如果一个函数返回类型为`void`﻿，那么：

1. 从语法上讲：函数是可以返回`undefined﻿`的，至于显式返回，还是隐式返回，这无所谓！
2. 从语义上讲：函数调用者不应关心函数返回的值，也不应依赖返回值进行任何操作！即使我们知道它返回了`undefined﻿`。

### 5.object

#### object与Object

- `object`:所有非原始类型，可存储对象，函数，数组等。

- `Object`:所有可以调用 Object﻿方法的类型，即除了`undefined`和`null`的任何值

```ts
let a:object //a的值可以是任何【非原始类型】，包括：对象、函数、数组等
// 以下代码，是将【非原始类型】赋给a，所以均符合要求
a = {}
a = {name:'张三'}
a = [1,3,5,7,9]
a = function(){}
a = new String('123')
class Person {}
a = new Person()
// 以下代码，是将【原始类型】赋给a，有警告
a = 1 // 警告：不能将类型“number”分配给类型“object”
a = true // 警告：不能将类型“boolean”分配给类型“object”
a = '你好' // 警告：不能将类型“string”分配给类型“object”
a = null // 警告：不能将类型“null”分配给类型“object”
a = undefined // 警告：不能将类型“undefined”分配给类型“object”


let b:Object //b的值必须是Object的实例对象（除去undefined和null的任何值）
// 以下代码，均无警告，因为给a赋的值，都是Object的实例对象
b = {}
b = {name:'张三'}
b = [1,3,5,7,9]
b = function(){}
b = new String('123')
class Person {}
b = new Person()
b = 1 // 1不是Object的实例对象，但其包装对象是Object的实例
b = true // truue不是Object的实例对象，但其包装对象是Object的实例
b = '你好' // “你好”不是Object的实例对象，但其包装对象是Object的实例
// 以下代码均有警告
b = null // 警告：不能将类型“null”分配给类型“Object”
b = undefined // 警告：不能将类型“undefined”分配给类型“Object”
```

#### 声明类型

##### 声明对象类型

1. 对象类型字面量

```ts
// 限制person1对象必须有name属性，age为可选属性
let person1: { name: string, age?: number }
// 含义同上，也能用分号做分隔
let person2: { name: string; age?: number }
// 含义同上，也能用换行做分隔
let person3: {
name: string
age?: number
}
// 如下赋值均可以
person1 = {name:'李四',age:18}
person2 = {name:'张三'}
person3 = {name:'王五'}
// 如下赋值不合法，因为person3的类型限制中，没有对gender属性的说明
person3 = {name:'王五',gender:'男'}
```

2. 索引签名：允许定义对象可以具有**任意数量**的属性，这些属性的键和类型是**可变的**。常用于：描述类型不确定的属性，（具有动态属性的对象）。

```ts
// 限制person对象必须有name属性，可选age属性但值必须是数字，同时可以有任意数
量、任意类型的其他属性
let person: {
name: string
age?: number
[key: string]: any // 索引签名，完全可以不用key这个单词，换成其他的也可以
}
// 赋值合法
person = {
name:'张三',
age:18,
gender:'男'
}
```

##### 声明函数类型

**函数类型注解**

```ts
let count: (a: number, b: number) => number
count = function (x, y) {
return x + y
}
```

> - TypeScript 中的﻿=>﻿在函数类型声明时表示函数类型，描述其参数类型和返回类型。
> 
> - JavaScript 中的﻿=>﻿是一种定义函数的语法，是具体的函数实现。

##### 声明数组类型

```ts
//类型声明
let arr: string[]
//泛型定义
let arr2: Array<string>
```

### 6.tuple

`Tuple`是一种特殊的数组类型，可以存储**固定数量**的元素，并且每个元素的类型是**已知**的且**可以不同**。元组用于精确描述一组值的类型，` ?`﻿表示可选元素。

```ts
// 第一个元素必须是 string 类型，第二个元素必须是 number 类型。
let arr1: [string,number]
// 第一个元素必须是 number 类型，第二个元素是可选的，如果存在，必须是 boolean 类型。
let arr2: [number,boolean?]
// 第一个元素必须是 number 类型，后面的元素可以是任意数量的 string 类型
let arr3: [number,...string[]]
// 可以赋值
arr1 = ['hello',123]
arr2 = [100,false]
arr2 = [200]
arr3 = [100,'hello','world']
arr3 = [100]
// 不可以赋值，arr1声明时是两个元素，赋值的是三个
arr1 = ['hello',123,false]
```

### 7.enum

 `enum﻿`:枚举，定义一组命名常量，它能增强代码的可读性，也让代码更好维护。也可以指定枚举成员的初始值，其后的成员值会自动递增。

```ts
enum Direction {
    Up,
    Down,
    Left,
    Right
}
```

- **数字枚举**:数字枚举一种最常见的枚举类型，其成员的值会自动递增，且数字枚举还具备反向映射的特点，在下面代码的打印中，不难发现：可以通过值来获取对应的枚举成员名称 。好处是语义性更强，便于维护。

```ts
// 定义一个描述【上下左右】方向的枚举Direction
enum Direction {
Up,
Down,
Left,
Right
}
console.log(Direction) // 打印Direction会看到如下内容
/*
{
0:'Up',
1:'Down',
2:'Left',
3:'Right',
Up:0,
Down:1,
Left:2,
Right:3
}
*/
// 反向映射
console.log(Direction.Up)
console.log(Direction[0])
// 此行代码报错，枚举中的属性是只读的
Direction.Up = 'shang'
```

- **字符串枚举**:同理,枚举成员的值是字符串
- **常量枚举:** 常量枚举是一种特殊枚举类型，它使用 const﻿关键字定义，在编译时会被内联，避免生成一些额外的代码，推荐使用。

> **何为编译时内联？**
> 所谓“内联”其实就是 TypeScript 在编译时，会将枚举成员引用替换为它们的实际值，而不是生成额外的枚举对象。这可以减少生成JavaScript 代码量，并提高运行时性能。

```ts
enum Directions {
Up,
Down,
Left,
Right
}
let x = Directions.Up;


"use strict";
let x = 0 /* Directions.Up */;
```

### 8.type

`type`:为任何类型创建别名,让代码更简洁,可读性更强；同时更方便的进行类型复用和扩展。

1. **类型别名**:使用 type﻿关键字定义， ﻿type﻿后跟类型名称，即类型别名。

```ts
type num = number;
let price: num
price = 100
```

2. **联合类型**:联合类型是一种高级类型，它表示一个值可以是几种不同类型之一。

```ts
type Status = number | string
type Gender = '男' | '女'
function printStatus(status: Status) {
console.log(status);
}
function logGender(str:Gender){
console.log(str)
}
printStatus(404);
printStatus('200');
printStatus('501');
logGender('男')
logGender('女')
```

3. **交叉类型**:允许将多个类型合并为一个类型。合并后的类型将拥有所有被合并类型的成员。交叉类型通常用于对象类型。

```ts
//面积
type Area = {
height: number; //高
width: number; //宽
};
//地址
type Address = {
num: number; //楼号
cell: number; //单元号
room: string; //房间号
};
// 定义类型House，且House是Area和Address组成的交叉类型
type House = Area & Address;
const house: House = {
height: 180,
width: 75,
num: 6,
cell: 3,
room: '702'
};
```

### 9.特殊情况

使用**类型声明**限制函数返回值为void﻿时， ﻿TypeScript﻿并不会严格要求函数返回空。

- 为什么?

- 是为了确保如下代码成立，我们知道 ﻿`Array.prototype.push`﻿ 的返回值是一个数字，而 `Array.prototype.forEach`﻿方法期望其回调的返回类型是﻿`void`﻿。
  
  

### 10.属性修饰符

| 修饰符         | 含义   | 具体规则                |
| ----------- | ---- | ------------------- |
| `public`    | 公开的  | 可以被**类内部、子类、类外部**访问 |
| `protected` | 受保护的 | 可以被**类内部、子类**访问     |
| `private`   | 私有的  | 可以被**类内部**访问        |
| `readonly`  | 只读属性 | 属性无法修改              |

#### 属性的简写形式

在构造器写类型注解和属性修饰符即可。

```ts
class Person {
    constructor(
    public name:string,
    public age:number    
){
    ...
}
}
```

#### public修饰符

```ts

class Person {
// name写了public修饰符，age没写修饰符，最终都是public修饰符
public name: string
age: number
constructor(name: string, age: number) {
this.name = name
this.age = age
}
speak() {
// 类的【内部】可以访问public修饰的name和age
console.log(`我叫：${this.name}，今年${this.age}岁`)
}
}
const p1 = new Person('张三', 18)
// 类的【外部】可以访问public修饰的属性
console.log(p1.name)

class Student extends Person {
constructor(name: string, age: number) {
super(name, age)
}
study() {
// 【子类中】可以访问父类中public修饰的：name属性、age属性
console.log(`${this.age}岁的${this.name}正在努力学习`)
}


```

#### protected修饰符

```ts

class Person {
// name和age是受保护属性，不能在类外部访问，但可以在【类】与【子类】中访问
constructor(
protected name: string,
protected age: number
) {}
// getDetails是受保护方法，不能在类外部访问，但可以在【类】与【子类】中访问
protected getDetails(): string {
// 类中能访问受保护的name和age属性
return `我叫：${this.name}，年龄是：${this.age}`
}
// introduce是公开方法，类、子类、类外部都能使用
introduce() {
// 类中能访问受保护的getDetails方法
console.log(this.getDetails());
}
}
const p1 = new Person('杨超越',18)
// 可以在类外部访问introduce
p1.introduce()
// 以下代码均报错
// p1.getDetails()
// p1.name
// p1.age
```

#### private修饰符

```ts
class Person {
constructor(
public name: string,
public age: number,
// IDCard属性为私有的(private)属性，只能在【类内部】使用
private IDCard: string
) { }
private getPrivateInfo(){
// 类内部可以访问私有的(private)属性 —— IDCard
return `身份证号码为：${this.IDCard}`
}
getInfo() {
// 类内部可以访问受保护的(protected)属性 —— name和age
return `我叫: ${this.name}, 今年刚满${this.age}岁`;
}
getFullInfo(){
// 类内部可以访问公开的getInfo方法，也可以访问私有的getPrivateInfo方法
return this.getInfo() + '，' + this.getPrivateInfo()
}
}
const p1 = new Person('张三',18,'110114198702034432')
console.log(p1.getFullInfo())
console.log(p1.getInfo())
// 以下代码均报错
// p1.name
// p1.age
// p1.IDCard
// p1.getPrivateInfo()
```

#### readonly修饰符

```ts
class Car {
constructor(
public readonly vin: string, //车辆识别码，为只读属性
public readonly year: number,//出厂年份，为只读属性
public color: string,
public sound: string
) { }
// 打印车辆信息
displayInfo() {
console.log(`
识别码：${this.vin},
出厂年份：${this.year},
颜色：${this.color},
音响：${this.sound}
`);
}
}
const car = new Car('1HGCM82633A123456', 2018, '黑色', 'Bose音响');
car.displayInfo()
// 以下代码均错误：不能修改 readonly 属性
// car.vin = '897WYE87HA8SGDD8SDGHF';
// car.year = 2020;
```

### 11.抽象类

**定义:** 抽象类是一种无法被实例化的类，专门用来定义类的结构和行为，类中可以写抽象方法，也可以写具体实现。抽象类主要用来为其派生类提供一个基础结构，要求其派生类必须实现其中的抽象方法。

**简单来说:** 抽象类不能实例化，其意义是可以被继承，抽象类里可以有普通方法、也可以有抽象方法。



```ts
abstract class Package{
    // 构造方法
    constructor(
        public weight:number
    ){

    }
    // 抽象方法
    abstract calculate():number
    // 具体方法
    printPackage(){
        console.log(`包裹重量为:${this.weight}\n运费为:${this.calculate()}`)
    }
}

class StandardPackage extends Package{
    constructor(
        weight:number,
        public unitPrice:number

    ){
        super(weight)
    }
    calculate(): number {
        return (this.weight * this.unitPrice)
    }
}

const pkg1 = new StandardPackage(10,5)
pkg1.printPackage()
```

**总结:何时使用抽象类**

1. **定义通用接口**:为一组相关的类定义通用的行为（方法或属性）时。

2. **提供基础实现:** 在抽象类中提供某些方法或为其提供基础实现，这样派生类就可以继承这些实现。

3. **确保关键实现:** 强制派生类实现一些关键行为。

4. **共享代码和逻辑:** 当多个类需要共享部分代码时，抽象类可以避免代码重复。

### 12.interface

`interface`﻿:一种定义结构的方式，主要作用是为：类、对象、函数等规定一种契约，这样可以确保代码的一致性和类型安全，但要注意interface﻿只能定义格式，不能包含任何实现 ！

- 定义类结构

```ts
interface PersonInterface {
name: string
age: number
speak(n: number): void
}
// 定义一个类 Person，实现 PersonInterface 接口
class Person implements PersonInterface {
constructor(
public name: string,
public age: number
) { }
// 实现接口中的 speak 方法
speak(n: number): void {
for (let i = 0; i < n; i++) {
// 打印出包含名字和年龄的问候语句
console.log(`你好，我叫${this.name}，我的年龄是${this.age}`);
}
}
}
// 创建一个 Person 类的实例 p1，传入名字 'tom' 和年龄 18
const p1 = new Person('tom', 18);
p1.speak(3)
```

- 定义对象结构

```ts
interface UserInterface {
name: string
readonly gender: string // 只读属性
age?: number // 可选属性
run: (n: number) => void
}
const user: UserInterface = {
name: "张三",
gender: '男',
age: 18,
run(n) {
console.log(`奔跑了${n}米`)
}
};
```

- 定义函数结构

```ts
interface CountInterface {
(a: number, b: number): number;
}
const count: CountInterface = (x, y) => {
return x + y
}
```

- **接口继承:** 使用`extends`关键字实现接口继承

- 接口自动合并

```ts
// PersonInterface接口
interface PersonInterface {
// 属性声明
name: string
age: number
}
// 给PersonInterface接口添加新属性
interface PersonInterface {
// 方法声明
speak(): void
}
// Person类实现PersonInterface
class Person implements PersonInterface {
name: string
age: number
// 构造器
constructor(name: string, age: number) {
this.name = name
this.age = age
}
// 方法
speak() {
console.log('你好！我是老师:', this.name)
}
}
```

> **何时使用接口**:
> 
> 1. **定义对象格式:** 描述数据类型、API响应格式、配置对象......
> 
> 2. **类的契约:** 规定一个类需要视线的哪些方法和属性
> 
> 3. **扩展已有接口:** 一般用于扩展第三方库的类型

### 13.相似概念的区别

#### 13.1 interface 与 type 的区别

- **相同点:** interface﻿和﻿type﻿ 都可以用于定义对象结构，在定义对象结构时两者可以互换。

- **不同点:**
  
  1. `interface`:更专注于定义对象和类的结构，支持继承、合并。
  
  2. `type`:可以定义**类型别名**、**联合类型**、**交叉类型**，但不支持继承和自动合并。

简言之，对于需要复杂继承和扩展的类型，推荐使用`interface`&`extends`实现继承。

#### 13.2 interface与抽象类的区别

- **相同点:** 都用于定义一个类的格式

- **不同点:**

        1. 接口:只能描述结构,不能有任何实现代码，一个类可以有多个接口。

        2. 抽象类:既可以包含抽象方法，也可以包含具体方法，一个类只能继承一个抽象类。

## 八.泛型

**定义：** 泛型运行我们在定义函数，类或接口时，使用类型参数来表示未指定的类型，这些参数在具体使用时，才被指定具体的类型，泛型能让同一段代码适用于多种类型，同时仍然保持类型的安全性。

### 泛型函数

```ts

function logData<T>(data:T){
    console.log(data)
}
logData<number>(100)
logData<string>('Hi')
```

注:泛型可以有多个

### 泛型接口

```ts
interface PersonInterface<T>{
    name:string,
    age:number,
    extraInfo:T
}
let p:PersonInterface<string>
```

注:泛型接口本身也可以嵌套

### 泛型类

```ts

class Person<T> {
constructor(
public name: string,
public age: number,
public extraInfo: T
) { }
speak() {
console.log(`我叫${this.name}今年${this.age}岁了`)
console.log(this.extraInfo)
}
}
// 测试代码1
const p1 = new Person<number>("tom", 30, 250);
// 测试代码2
type JobInfo = {
title: string;
company: string;
}
const p2 = new Person<JobInfo>("tom", 30, { title: '研发总监', company: '发发发
科技公司' });
```

### 泛型约束

```ts
interface LengthInterface {
length: number
}
// 约束规则是：传入的类型T必须具有 length 属性
function logPerson<T extends LengthInterface>(data: T): void {
console.log(data.length)
}
logPerson<string>('hello')
// 报错：因为number不具备length属性
// logPerson<number>(100)
```

## 九.类型声明文件

类型声明文件是 TypeScript 中的一种特殊文件，通常以﻿.d.ts﻿ 作为扩展名。它的主要作用
是为现有的 JavaScript 代码提供类型信息，使得 TypeScript 能够在使用这些 JavaScript 库
或模块时进行类型检查和提示。

在浏览器引入脚本时,注明类型`type:module`

```ts
// demo.js
export function add(a, b) {
return a + b;
}
export function mul(a, b) {
return a * b;
}
```
