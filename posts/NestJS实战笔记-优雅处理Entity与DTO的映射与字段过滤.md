---
title: 'NestJS全栈实战笔记:优雅处理Entity与DTO的映射与字段过滤'
tags:
  - nestjs
  - backend
  - nodejs
  - fullstack
abbrlink: 2862114693
categories:
  - backend
index_img: /images/nest-logo.png
banner_img: /images/nest-logo.png
description: 使用TypeORM配合Nest.js开发，维护实体与DTO数据的正确处理
date: 2026-02-08 17:40:24
---

# NestJS全栈实战笔记：序列化与更优雅的响应结果处理

在利用AI完成Nestjs全栈开发中，一个常见但容易被**0后端经验开发者**忽视的问题是：**如何优雅地控制 HTTP 响应体结构，避免手动拼装导致重复、出错以及难以维护？**

传统做法通常是在`service`层或 `controller` 层手动构造返回对象，例如创建一个新的对象、解构赋值某些字段、手动过滤敏感字段等，而且几乎成为了所有AI的**默认做法**，但这种做法真的就是万全之策吗？在项目初期看似简单、符合直觉，甚至AI的上下文也能很好的记忆其属性和字段，但随着业务增长，它带来的问题痛点也愈发明显：

- 需要写大量重复代码；
- 每次实体属性变更都要手动同步响应处理逻辑；
- 容易忘记某些字段导致响应结构不一致；
- 无法利用 ORM 元数据、类型系统带来的优势。

`NestJS` 与 `class-transformer` 结合提供了一套更优雅的响应控制机制，使得序列化（serialization）成为可声明、可复用的过程，从而大幅提升代码质量及开发体验。

### 序列化与反序列化的概念

**想要清晰的解决问题，就必须掌握好扎实的技术基础，否则我们甚至都无法清晰的把自己的想法表述给AI，甚至都不知道我们绞尽脑汁的方案，早有智者给我铺好了路。**

#### 1. 为什么需要序列化？

在 Node.js 服务端，一切数据都以 **内存对象** 的形式存在，这些对象可能来自 ORM、业务逻辑封装、缓存结构等，它们可以有方法、原型链、元数据等复杂特性。

然而，**HTTP 协议是基于文本协议的**，只能在 TCP 连接上发送一串又一串的字符，而不能直接理解内存中的 JavaScript 对象结构。因此必须先把这些对象“变成文本”再发送，这个动作就叫 **序列化（serialization）** 。在 Web 开发里最常用的序列化格式是 JSON，这是因为它轻量、跨语言、与 JavaScript 语法天然契合并被所有浏览器与服务器端环境支持。

#### 2. Node.js 中的序列化过程

在 Node.js 中，JSON 序列化的核心 API 是：

```
JSON.stringify(obj)
```

它以文本格式生成一个符合 JSON 标准的字符串，供网络传输或写入文件等用途。这个函数的基本规则有几点：

- 只输出标准 JSON 支持的类型，如数字、字符串、布尔值、对象、数组、null。
- 忽略 `undefined`、函数、Symbol，或者将它们转换为 `null`。
- 对象的键和值都必须是 JSON 允许的格式，否则会丢失或报错。
- 对于复杂数据类型（如 Date），默认行为是转换为字符串。

举例：

```
const user = { id: 1, name: "Alice", password: "secret" };
const jsonString = JSON.stringify(user);
// 结果 {"id":1,"name":"Alice","password":"secret"}
```

这个字符串才是可以通过 HTTP 响应发送给浏览器的真正“有效载荷”。

在使用现代框架（比如 Express、NestJS）时，这一步通常被框架封装好了：`res.json()` 或者 NestJS 调用的序列化内部流程都在底层执行了 `JSON.stringify()`。

#### 3. HTTP 层如何传输序列化后的 JSON

当服务器准备好 JSON 字符串之后，它会配合 HTTP 头部告诉客户端它发送的数据类型：

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"id":1,"name":"Alice","password":"secret"}
```

在这里：

- `Content-Type: application/json` 告诉浏览器响应体是 JSON；
- HTTP 响应体本质上是一个**文本流**，可以被客户端逐块接收。

HTTP 协议不会检查内部结构是否 JSON，它只是负责把这串字符送达。

#### 4. 浏览器端的反序列化过程

浏览器接收到这个文本响应后，如果我们使用 `fetch` API，一般会这样处理：

```js
fetch('/api/user')
  .then(response => response.json())
  .then(data => {
     // data 就是反序列化后的对象
     console.log(data.name);
  });
```

这里的 `.json()` 方法就是浏览器为我们封装的 **反序列化（deserialization）** 动作。它会：

1. 从 HTTP 响应中读取完整的文本；
2. 使用内部实现的 JSON 解析逻辑（类似 `JSON.parse()`）；
3. 将 JSON 字符串还原成 JavaScript 原生对象（没有方法、原型、Class 等行为，仅是纯数据）。

最终，前端得到的是一个普通的对象：

```json
{
  id: 1,
  name: "Alice",
  password: "secret"
}
```

这时它可以在浏览器逻辑中自由访问，但它**不再是服务端 ORM 的实体实例**，没有方法、没有元数据，仅是一个普通的结构体数据。

#### 5. 为什么反序列化后不是原生对象？

这是因为 JSON 是一种 **纯文本、纯数据格式**，只包含值，不包含行为或函数等：

- 它不包含原型链信息；
- 不包含类方法；
- 不包含私有数据结构。
  所以一旦反序列化后，所有原本对象的行为（包括 ORM 实例方法等）都消失了。浏览器端得到的是一个简单数据容器。

#### 6. 一个完整的端到端过程回顾

1. **内存对象（服务端）**  
   例如一个 ORM 实例，包含方法、属性、元数据等。
2. **序列化为 JSON 字符串**  
   Node.js 使用 `JSON.stringify()`，输出严格的结构化文本。
3. **HTTP 响应发送 JSON 字符串**  
   浏览器通过网络接收这串字符。
4. **浏览器将 JSON 解析回 JavaScript 对象**  
   调用 `.json()` 或 `JSON.parse()`，得到普通对象。
5. **前端使用这个对象作为数据模型或渲染依据**

#### 7. 序列化/反序列化的工程影响

这个过程虽看似简单，但有几个实际需要注意的点：

- 你永远无法把服务端的实例行为“原路还原”到前端；
- JSON 不支持函数或原型，不支持循环引用；
- 提前规划好响应结构，避免发送敏感字段或大量无用数据。
  因此，使用像 NestJS 提供的序列化控制（比如通过 DTO 或 `class-transformer`）来定制最终的 JSON 输出，在工程实践中是非常值得的优化，不仅改善了开发效率，还提高了 API 的一致性和安全性。

### 业务开发中的真实痛点

理解了上述基础后，我们来看看在实际NestJS业务开发中，处理API响应时经常面临的三个真实痛点：

第一，手动构建响应对象不够优雅。在控制器层返回数据时，开发者经常需要手动创建新对象并进行解构赋值，将ORM实例的属性逐一填入。这种做法需要编写大量样板代码，无法利用ORM工具和类本身的特性，且在属性众多时极易发生漏写或错写。

第二，ORM实体与响应结果存在割裂。随着业务迭代，数据库表结构会发生变化，ORM层中的实体类也会随之更新。如果我们在控制器中采用手动赋值的方式，即使实体类增加了新属性，只要控制器代码没有同步修改，新属性就无法自动体现在API响应中。这增加了维护成本，容易导致前后端数据不同步。

第三，DTO与实体的重复声明问题。为了规范接口，我们通常会编写DTO（数据传输对象）来约束请求和响应格式。在很多场景下，我们希望响应数据基于数据库实体，但需要遮蔽部分敏感字段。如果为了实现遮蔽而重新手写一个DTO，会导致DTO类和实体类中存在大量重复的字段声明。这不仅违背了DRY（Don't Repeat Yourself）原则，手动解构赋值也无法从根源上保障数据结构的严谨性。

### 解决方案：类型映射与序列化的结合

为了解决上述问题，最佳实践是引入`class-transformer`库的装饰器，配合NestJS内置的类型映射（`Mapped Types`）功能以及`plainToInstance`序列化方法。

NestJS本身并不直接操作 `JSON.stringify`，而是通过 `class-transformer` 库，通过装饰器在类上声明序列化行为，并在响应时应用这些行为，利用`class-transformer`，我们可以实现对JavaScript类的更深入的操作。

基础概念来自官方文档：
[序列化]("https://docs.nestjs.cn/techniques/serialization")
[类型映射](""https://docs.nestjs.cn/graphql/mapped-types#%E6%98%A0%E5%B0%84%E7%B1%BB%E5%9E%8B)

- **@Exclude**：排除字段，不出现在序列化输出；
- **@Expose**：显式声明字段可序列化；
- **plainToInstance / instanceToPlain**：在 plain object 与 Class 实例之间转换对象；
- **ClassSerializerInterceptor**：拦截器，在控制器返回对象时执行序列化转换。

这种做法带来的好处在于，它把字段控制的逻辑放到了类定义层，而不是分散在每个 API 的手动处理逻辑里。

通过这套组合拳，我们可以将ORM实体作为唯一的真实数据源（Single Source of Truth），让DTO直接继承实体的定义，再通过序列化机制自动过滤敏感信息，从而实现高度复用和自动化的响应处理。

#### 解决方案：结合 class-transformer 的序列化策略

为了解决这些问题，可以借助以下几种 NestJS 级工具：

#### • 利用 `@Expose` 与 `@Exclude` 控制序列化字段

通过在实体类中使用 `class-transformer` 的装饰器，可以精确控制哪些字段最终出现在序列化输出。例如：

```typescript
@Exclude()
password!: string;
```

使得 `password` 字段不会包含在 HTTP 相应响应里。

在你的实体定义中，采用了 `@Expose()` 和 `@Exclude()` 有选择地声明字段：

```typescript
@Expose()
@ApiProperty(...)
id!: number;

@Exclude()
@property()
password!: string;

@Exclude()
@property()
hashedRefreshToken?: string;
```

这种方式避免了每次显式构造返回对象的必要，序列化过程可以自动过滤敏感字段。

#### • 使用 mapped-types 简化 DTO 定义

NestJS 官方提供的映射类型工具（如 `OmitType`、`PartialType` 等）可以在已有类上派生新的 DTO，而不需要重复声明字段。

在用户模块中，我们就定义了多个基于实体的 DTO：

```typescript
export class UserResponseDto extends OmitType(User, [
  'password',
  'hashedRefreshToken',
] as const) {}
```

这样定义后，响应 DTO 自动继承了实体的字段，排除了敏感项。

#### • 使用 `plainToInstance` 进行纯净转换

在 controller 层，我们调用进来 ORM 查询的实体对象通常是一个模型实例。为了确保最终输出符合 DTO 声明的序列化规则，需要显式执行转换：

```typescript
return plainToInstance(MeResponseDto, user, {
  excludeExtraneousValues: true,
});
```

这里:

- `MeResponseDto` 是基于实体定义但排除了敏感字段的响应模型；
- `excludeExtraneousValues: true` 确保只输出有 `@Expose()` 或在 DTO 中声明的字段。

### 业务场景实战解析

接下来，我们将结合真实场景的代码，逐步解析这套方案的落地过程。在我遇到的真实开发场景中，项目要求我开发`GET user/me`的RESTful API，在这个API下，我们需要实现获取当前用户信息的API，并且要求在返回结果中严格剔除用户的密码和哈希处理后的刷新令牌。

#### 1. 实体类的基础定义与装饰器配置

首先，我们查看数据库实体类的定义。在这个类中，我们不仅定义了数据库映射关系，同时引入了`class-transformer`的`Expose`和`Exclude`装饰器。

```typescript
// user.entity.ts
import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Entity({ tableName: 'users' })
export class User {
  @Expose()
  @ApiProperty({ description: '用户唯一标识ID' })
  @PrimaryKey()
  id!: number;

  @Expose()
  @ApiProperty({ description: '学校学号' })
  @Unique()
  @Property({ nullable: false })
  schoolId!: string;

  // 关键点：使用Exclude标记敏感字段
  @Exclude()
  @Property()
  password!: string;

  // 关键点：同样使用Exclude标记刷新令牌
  @Exclude()
  @Property({ nullable: true })
  hashedRefreshToken?: string;

  // ... 其他属性省略
}
```

在这里，`@Expose`表示该字段在序列化时应该被暴露（保留），而`@Exclude`则明确指示该字段在序列化过程中必须被剔除。这就在数据源头确立了序列化规则。

#### 2. 使用类型映射构建DTO

确立了实体类后，我们不需要重新编写一个包含几十个字段的响应DTO。借助NestJS提供的`OmitType`（也可以是`PickType`等），我们可以直接从User实体中派生出新的DTO类。

```typescript
// user-response.dto.ts
import { OmitType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class MeResponseDto extends OmitType(User, [
  'password',
  'hashedRefreshToken',
  'avatarUrl',
  'createdAt',
  'updatedAt',
] as const) {}
```

OmitType在类型层面去除了User类中的指定字段，生成了MeResponseDto。这种做法完全遵循DRY原则，当User实体新增了普通业务字段（如age）并标记为Expose时，MeResponseDto会自动继承该字段，无需任何额外修改，直接解决了上文提到的维护割裂问题。

#### 3. 控制器层的数据处理与转换

最后一步是在控制器中应用这些规则。我们获取到ORM返回的用户实例后，不再手动拼接对象，而是使用plainToInstance进行转换。

```typescript
// user.controller.ts
import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { MeResponseDto } from './dto/user-response.dto';
// ... 其他导入省略

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request): Promise<MeResponseDto> {
    const userPayload = req['user'];

    // 从数据库获取ORM实体实例
    const user = await this.userService.findOneBySchoolId(userPayload.schoolId);

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 关键点：使用plainToInstance进行序列化转换
    return plainToInstance(MeResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
```

在这里，`plainToInstance`接收目标类`MeResponseDto`和原始数据`user`。配置项`excludeExtraneousValues`设为`true`是核心所在，它告诉转换器：只保留目标类中带有`@Expose`装饰器的属性，其余属性一律丢弃。

由于我们在`User`实体中对`password`等字段使用了`@Exclude`（未带有`@Expose`），在转换过程中这些敏感信息会被彻底剥离。最终返回给前端的JSON数据完全符合我们期望的安全结构。

### 总结

通过在实体类中使用`@Expose`和`@Exclude`，结合NestJS的`Mapped Types`复用类型定义，并在控制器端通过`plainToInstance`进行数据清洗，我们建立了一套清晰且健壮的响应处理机制。这种做法消除了冗余代码，降低了因遗忘导致的敏感数据泄露风险。

即便是在AI时代，提高项目的工程化质量不仅使NestJS后端的开发体验更加工程化和优雅，也可以变相促进AI更好的利用仓库代码已有的最佳实践，从而提升整体项目的健壮性和可维护性。
