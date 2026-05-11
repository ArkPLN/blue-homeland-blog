---
title: Flutter学习笔记
tags: 
- flutter
- dart
- mobile-development
- cross-platform
categories: 
- mobile
abbrlink: 1134849698
description: 'Flutter移动端开发学习笔记，涵盖Dart语言和跨平台开发'
date: 2025-10-23 20:32:40
index_img: /images/flutter.webp
banner_img: /images/flutter.webp

---

# Flutter学习笔记

## 简介

**Flutter** 是由 Google 开发的开源 UI 框架，用于构建跨平台的高性能应用程序。通过一套代码库，开发者可以同时为 **iOS**、**Android**、**Web** 和 **桌面平台** 构建应用。Flutter 的核心特点是其 **“一切皆小部件”** 的设计理念，允许开发者通过组合和定制小部件快速构建用户界面。

Flutter 使用 **Dart 编程语言**，并通过其 **热重载** 功能大幅提升开发效率，开发者可以实时查看代码更改的效果，而无需重新启动应用。

## 安装

<a href="https://docs.flutter.cn/get-started">Flutter 起步教程</a>

*注:若要编译到安卓平台,须安装Android Studio,Android SDK,Android Emulater,Java,Gradle等依赖.*

## Dart语法

### Dart介绍

Dart 是由 Google 开发的一种现代化编程语言，专为客户端优化，支持跨平台开发。它以其简洁的语法、强大的类型系统和高性能编译能力，成为开发者构建高质量应用的理想选择。<a href="https://docs.flutter.cn/get-started/fundamentals/dart">Dart 入门</a>

**Dart 的核心特点**

Dart 提供了静态类型检查和类型推断，确保代码的健壮性，同时支持动态类型，灵活性极高。它内置了空值安全机制，避免了常见的空指针异常问题。此外，Dart 支持 AOT（提前编译）和 JIT（即时编译），既能快速开发，又能生成高效的机器码，适合生产环境。

Dart 的语法类似于 Java 和 JavaScript，易于上手，特别适合有其他语言基础的开发者。它还支持面向对象编程、异步编程（如 Future 和 Stream）以及泛型等高级特性。

**Dart 的应用场景**

Dart 是 Flutter 的唯一编程语言，用于构建跨平台的移动、桌面和 Web 应用。通过 Dart，开发者可以实现代码的高复用性，移动端和 Web 应用的代码共享率可达 70%。此外，Dart 还支持服务器端开发和命令行工具的编写。

### Dart变量声明 - var

`var 变量名 = 值/表达式`

- 第一次赋值后,该变量类型锁定,不允许重新赋值为其他类型的变量

```dart
void main(List<String> arguments) {
  var age = 20;
  print(age);
}
```

### Dart常量声明 - const

`const 常量名 = 值/表达式`

- `const`在代码编译前确认,表达式里不允许变量参与运算.

```dart
void main(List<String> arguments) {
  const age = 20*1.14;
  print(age);
}
```

### Dart常量声明 - final

`final 常量名 = 值/表达式`

- `final`在**运行时**被初始化,其值设定后不可更改

```dart
void main(List<String> arguments) {
  final age = DateTime.now();
  print(age);
}
```

### Dart常用的数据类型

#### String字符串

`String 属性名 = '文本内容'`

- 支持单引号,双引号,拼接和模板字符串`$/${}`

- 当模板字符串的内容是一个表达式的时候用`${}`

```dart
void main(List<String> arguments) {
  final age = DateTime.now();
  String str = '现在是:${age.toString()}';
  print(str);
}
```

#### int/num/double数字类型

`int/num/double 属性名 = 数值`

- `int`:整形数字

- `num`:可整形可小数

- `double`:双精度浮点数
  
  

**注意:** 不同数值类型的赋值关系有时需要使用`toInt()`或`toDouble()`转换,并遵循以下规则:

1. `double`和`int`不能直接复制

2. `num`不能直接给`double`赋值

3. `double`可给`num`赋值

```dart
void main(List<String> arguments) {
  int friendCount = 3;
  double appleCount = 3.4;
  num rest = appleCount % friendCount;
  print(rest);
}
```

#### bool布尔类型

`bool 属性名 = true/false`

- 属性表示当前为真(true)或假(false)

```dart
void main(List<String> arguments) {
  bool isEven = 2 % 2 == 0;
  print(isEven);
}
```

#### List列表类型

##### List变量语法

`List 属性名 = ['学生1','学生2',...];`

##### List操作方法

- 在列表尾部添加`add()`

- 在尾部添加列表`addAll()`  *类似JavaScript的扩展运算符*

- 删除满足内容的第一个列表元素`remove()`

- 删除满足列表索引的第`i+1`个元素`removeAt()`

- 删除列表元素的最后一个`removeLast()`

- 删除列表中所有满足`Function(dynamic)`函数条件的元素`removeWhere((element)=> element=='string')`

- 删除索引范围内数据`removeRange(start,end)`*范围是[start,end)*

- 清空列表`clear()`

- 循环方法`forEach((item){...});`

- 是否**都**满足条件`every((item){return var<bool>});`

- 筛选出所有满足条件的数据`where((item){return ...})`

##### List常用属性

- 列表的长度`length`

- 最后一个元素`last`

- 第一个元素`first`

- 是否为空(布尔值)`isEmpty`

```dart
void main(List<String> arguments) {
  // List变量语法
  // List 属性名 = ['学生1','学生2',...];
  print('=== Dart List 主要语法和属性演示 ===\n');

  // 创建一个List
  List students = ['张三', '李四', '王五'];
  print('1. List变量语法:');
  print('   List students = [\'张三\', \'李四\', \'王五\'];');
  print('   students = $students\n');

  // List操作方法演示
  print('2. List操作方法演示:');

  // 在列表尾部添加add()
  students.add('赵六');
  print('   add() - 在列表尾部添加元素:');
  print('   students.add(\'赵六\');');
  print('   students = $students\n');

  // 在尾部添加列表addAll()
  students.addAll(['钱七', '孙八']);
  print('   addAll() - 在尾部添加列表:');
  print('   students.addAll([\'钱七\', \'孙八\']);');
  print('   students = $students\n');

  // 删除满足内容的第一个列表元素remove()
  students.remove('李四');
  print('   remove() - 删除满足内容的第一个元素:');
  print('   students.remove(\'李四\');');
  print('   students = $students\n');

  // 删除满足列表索引的第i+1个元素removeAt()
  students.removeAt(1);
  print('   removeAt() - 删除指定索引位置的元素:');
  print('   students.removeAt(1); // 删除索引为1的元素');
  print('   students = $students\n');

  // 删除列表元素的最后一个removeLast()
  var lastStudent = students.removeLast();
  print('   removeLast() - 删除并返回最后一个元素:');
  print('   var lastStudent = students.removeLast();');
  print('   lastStudent = $lastStudent');
  print('   students = $students\n');

  // 删除列表中所有满足Function(dynamic)函数条件的元素removeWhere()
  students.removeWhere((element) => element == '赵六');
  print('   removeWhere() - 删除所有满足条件的元素:');
  print('   students.removeWhere((element) => element == \'赵六\');');
  print('   students = $students\n');

  // 删除索引范围内数据removeRange(start,end)
  students.removeRange(0, 2);
  print('   removeRange() - 删除索引范围内的元素:');
  print('   students.removeRange(0, 2); // 删除索引0到1的元素');
  print('   students = $students\n');

  // 重新填充数据以便后续演示
  students = ['张三', '李四', '王五', '赵六', '钱七'];
  print('   重新填充数据:');
  print('   students = $students\n');

  // 循环方法forEach()
  print('   forEach() - 遍历列表:');
  print('   students.forEach((item) { print(\"     学生: \$item\"); });');
  students.forEach((item) { print('     学生: $item'); });
  print('');

  // 是否都满足条件every()
  bool allStartWithZhang = students.every((item) => item.startsWith('张'));
  print('   every() - 检查是否所有元素都满足条件:');
  print('   bool allStartWithZhang = students.every((item) => item.startsWith(\'张\'));');
  print('   allStartWithZhang = $allStartWithZhang\n');

  // 筛选出所有满足条件的数据where()
  var zhangStudents = students.where((item) => item.startsWith('张')).toList();
  print('   where() - 筛选满足条件的元素:');
  print('   var zhangStudents = students.where((item) => item.startsWith(\'张\')).toList();');
  print('   zhangStudents = $zhangStudents\n');

  // List常用属性演示
  print('3. List常用属性演示:');

  // 列表的长度length
  print('   length - 获取列表长度:');
  print('   students.length = ${students.length}\n');

  // 最后一个元素last
  print('   last - 获取最后一个元素:');
  print('   students.last = ${students.last}\n');

  // 第一个元素first
  print('   first - 获取第一个元素:');
  print('   students.first = ${students.first}\n');

  // 是否为空isEmpty
  print('   isEmpty - 检查列表是否为空:');
  print('   students.isEmpty = ${students.isEmpty}\n');

  // 创建一个空列表演示isEmpty属性
  List emptyList = [];
  print('   空列表演示:');
  print('   List emptyList = [];');
  print('   emptyList.isEmpty = ${emptyList.isEmpty}');
  print('   emptyList.length = ${emptyList.length}\n');


}
```

#### Map字典类型

##### Map变量语法

`Map 属性名 = {key:value};`

`字典名[key] = ...`

##### Map操作方法

- 循环`forEach()`

- 再添加一个字典`addAll()`

- 是否包含某个`key` `containsKey()`

- 删除某个键值对`remove()`

- 清空字典`clear()`

#### dynamic动态类型

- 定义:在Dart语言中,`dynamic`用来声明动态类型

- 特点:运行变量运行时自由改变类型,同时绕过编译时的静态检查

- 语法:`dynamic 属性名 = 值`

*dynamic与var的区别*

- `dynamic`:运行时可自由改变类型,**无编译检查,直接调用属性和方法**

- `var`:根据初始值推断类型,确定类型后,**有编译检查,仅限推断的属性和方法**

#### Dart的空安全机制

- **定义**: 在Dart中，通过编译静态检查将运行时空指针提前暴露。

- **特点：** 将空指针异常从运行时提前至编译时，减少线上崩溃

- 常用空安全操作符:

| 操作符  | 符号  | 作用                 | 示例            |
| ---- | --- | ------------------ | ------------- |
| 可空类型 | ?   | 声明可空变量             | String?       |
| 安全访问 | ?.  | 对象为null跳过操作，返回null | user?.name    |
| 非空断言 | !.  | 开发者保证变量非空(否则运行时崩溃) | name!.length  |
| 空合并  | ??  | 左侧为null时返回右侧默认值    | name??"Guest" |

### Dart中的常用运算符

#### 算数运算符

- +

- -

- *

- /

- ~/ 整除

- % 取余数

#### 赋值运算符

- = 赋值

- += 加等

- -= 减等

- *= 乘等

- /= 除等

#### 比较运算符

- == 值相等

- != 值不等

- \> 大于

- \>= 大于等于

- \< 小于

- \<= 小于等于

#### 逻辑运算符

- && 逻辑与

- || 逻辑或

- ! 逻辑非

注意: 使用逻辑运算符需要保证参与的变量为布尔类型

### Dart的流程控制

#### if分支语句

- 单分支:`if() {}`

- 双分支:`if() {} else{}`

- 多分支:`if(){} else if(){} else{}`

#### 三元运算符

- 定义:简化版本的双分支

- `bool?val1:val2`

#### switch/case

 **语法:** 

```dart
switch(condition ){
    case val1:
        ...
        break;
    case val2:
        ...
        break;
    default:
        ...
}
```

#### while

- 定义：在Dart中，循环主要使用`while`和`for`循环

```dart

while(condition){

    ...;

}
```

- `break`跳出整个while循环,`continue`跳出当前迭代,进入下一次迭代。

#### for

- 定义：对列表类型进行遍历

```dart
for(int i=0;i<10;i++){
    ...;
}
```

- 特点: 只有小括号逻辑满足,大括号一直执行,断开可以用`break`或`continue`

### Dart的函数

#### Dart的函数定义

- **定义:** 在Dart语言中，函数是代码组合和复用的核心单元

- 使用函数组织代码

```dart
int add(int a,int b){
    return a + b;
}
```

#### Dart的函数返回值

- 有返回值: 具体类型 函数名称() {}

- 无返回值: void 函数名称() {}

#### Dart的函数形参

- 分类:函数的形参分为:**必传参数**,**可选位置参数**,**可选命名参数**

- 必传参数不能为空

- 可选参数使用中括号包裹，必须位于必传参数后面，可选参数可以设置默认值`函数名(String a,[String?b,...])`

- 可选命名参数必须位于必传参数后面，使用花括号包裹，传递参数时按{params：value}传递，不关注顺序（适合参数多且含义明确的情况）`函数名 (String a,{String?b,...})`

#### Dart的匿名函数

**匿名函数:**

可以声明一个没有名称的函数赋值给变量进行调用

`Function 变量名 = (){}`

**箭头函数:**

当函数体只有一行代码时可以使用，使用箭头函数可以省略return关键字

`函数名 () => 代码逻辑`

### Dart中的类

- 定义： Dart语言中，类是面向对象编程的核心，包含属性和方法来定义对象的行为和状态。

- 定义类语法`class Person { }`

- 实例化对象`Person 变量 = Person()`

- 属性和方法`变量.属性/方法()`

## Flutter开发

### 创建Flutter项目

在VS Code上安装`Flutter`和`Awesome Flutter Snippets`

使用Flutter CLI创建工程

```bash
flutter create --platform web <project_name>
```

### 应用目录

- .dart_tool:Dart工具生成的缓存和文件

- .idea IDEA生成的配置文件

- build 生成构建的产物

- lib 项目的主要源代码目录
  
  - main.dart 应用程序入点

- test 测试文件

- web web平台的特定配置和资源文件

- .gitgnore

- metadata Flutter项目标志文件

- analysis_options.yaml 配置静态代码分析工具

- flutter_core.iml 存储模块的特定设置

- pubspec.lock 依赖锁定文件

- pubspec.yaml 项目依赖和配置文件

- README.md 项目说明文件

### 启动文件

- `runApp`函数是Flutter内部提供的函数

- Widget表示组件,Flutter中万物皆组件

Flutter使用的默认组件库是Material，包含了很多的规范设计，如颜色、文字排版、动画等。 

```dart
import 'package:flutter/material.dart'; // Imports Flutter.

void main() {
  // 运行应用程序
  runApp(const MainApp());
}
// ...
class MainApp extends StatelessWidget {
  // 组件构造函数
  const MainApp({super.key});

  // 构建组件
  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Arona Agent',
      home: Scaffold(
        body: Center(
          child: Text('Hello, Arona Agent!'),
        ),
      )
    );
  }
}

```

### Flutter组件

#### MaterialApp

- **特性：** 应用被整个MaterialApp包裹，方便我们对整个应用的属性进行设计。

- 常见属性
  
  - `title`: 用来展示窗口的标题
  
  - `theme`: 用来展示应用主题`ThemeData()`
  
  - `home`: 用来展示窗口的主题内容

#### Scaffold组件

- **特性:**  用于构建Material Design风格页面的核心布局组件，提供标准、灵活配置的页面骨架。

- **属性：** 
  
  - `appBar`: 页面顶部的应用浏览，用于显示不同，导航按钮和操作菜单
  
  - `body`： 页面的主要内容，可以放置任何其他组件
  
  - `bottomNavigationBar`：底部导航栏，方便用户在不同核心功能页面之间切换
  
  - `backgroundColor`：设置Scaffold的背景颜色
  
  - `floatingActionButtom`：悬浮操作按钮，常用于触发页面的主要动作

```dart

import 'package:flutter/material.dart'; // Imports Flutter.

void main() {
  // 运行应用程序
  runApp(const MainApp());
}

// ...
class MainApp extends StatelessWidget {
  // 组件构造函数
  const MainApp({super.key});

  // 构建组件
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Arona Agent',
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.blueAccent,
      ),
      home: Scaffold(
        // 应用程序的主界面
        appBar: AppBar(
          title: const Text('Arona Agent'),
        ),
        // 主体内容
        body: const Center(
          child: Text(
            'Welcome to Arona Agent!',
            style: TextStyle(fontSize: 24, color: Colors.white),
          ),
        ),
        // 底部导航栏
        bottomNavigationBar: BottomAppBar(
          color: Colors.blueGrey,
          child: Container(
            height: 50,
            alignment: Alignment.center,
            child: const Text(
              '© 2024 Arona Agent',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ),

      ),
    );
  }
}

```

#### 无状态组件与有状态组件

- **定义:** 根据自己特定的需求创建Widget

- **分类：** 分为无状态组件与有状态组件

| 特性   | StatelessWidget   | StatefulWidget        |
| ---- | ----------------- | --------------------- |
| 核心特征 | 一旦创建,内部状态不可变      | 持有可在其生命周期内改变的方式       |
| 使用场景 | 静态内容展示,外观仅由配置参数决定 | 交互式组件                 |
| 生命周期 | 相对简单,主要是build     | 更为复杂,包含状态管理,更新和销毁     |
| 代码结构 | 单个类               | 两个关联类:Widget本身和State类 |

#### StatelessWidget无状态组件

- 定义:创建一个新的类，继承`StatelessWidget`类并实现`build`方法

- 要点: build方法返回`Widget`

- 场景:纯展示型组件,没有用户交互操作

- 生命周期: build

当组件被创建或父组件状态变化导致其需要被重新构建时,build方法会被调用

在`Awesome Flutter Snippets`中使用`statelessW`

#### StatefulWidget有状态组件

- 生命周期:
  
  1. 创建阶段
  - `StatefulWidget`被创建
  
  - `createState`
  
  - `State`对象创建
  
  - `initState`
  
  - `didChangeDependencies`
  
  - `build`
  2. 更新阶段
  - 父组件重建-配置变更
  
  - `didUpdateWidget` -> `build`
  3. 销毁阶段
  - 组件被移除
  
  - `deactive`
  
  - `dispose`
    
    

| 生命周期阶段      | 函数名                       | 调用时机与核心任务                                          |
| ----------- | ------------------------- | -------------------------------------------------- |
| **创建阶段**    | `createState()`           | Widget初始化调用,创建State对象                              |
|             | `initState()`             | State对象插入Widget树立刻执行,只执行一次                         |
|             | `didChangeDependencies()` | `initState`后立即执行,当依赖的`inheritedWidget`更新时立即调用,可能多次 |
| **构建与更新阶段** | `build()`                 | 构建UI方法,初始化或更新后多次调用                                 |
|             | `didUpdateWeiget()`       | 父组件传入新配置时调用,用于比较新旧配置                               |
| **销毁阶段**    | `deactiveate()`           | 当State对象从Widget树中暂时移除时被调用                          |
|             | `dispose()`               | 当State对象被永久移除时被调用,释放资源,仅执行一次                       |

**总结:**

- 无状态组件:build

- 有状态组件(创建):createState -> initState -> didChangeDependencies -> build

- 有状态组件(更新):didUpdateWiget -> build

- 有状态组件更新(销毁):deactivate -> dispose

- 执行一次的函数: createState、initState、dispose

- `InheritedWidget`专门用于Widget树中自顶向下高效地共享数据,顶层组件提供数据,子孙节点直接获取。
