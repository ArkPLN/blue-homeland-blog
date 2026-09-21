---
title: NestJS全栈实战笔记：序列化与更优雅的响应结果处理
tags:
  - nestjs
  - backend
  - nodejs
  - fullstack
categories:
  - backend
index_img: /images/nest-logo.png
banner_img: /images/nest-logo.png
description: >-
  AI全栈时代，如何优雅处理API响应？本文直击NestJS中手动拼接响应、DTO冗余与敏感数据泄露痛点。利用类型映射与序列化机制，践行DRY原则实现自动化数据脱敏，结合真实项目代码，提高工程化开发质量
abbrlink: 4238683975
dat: 2026-02-21 21:16:45
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

在服务端的内存中，数据通常以复杂的对象形式存在，例如包含各种方法和数据库元数据的ORM实体类实例。然而，HTTP协议本质上只能传输文本流。

将内存中的对象状态转换为可以存储或传输的格式（如字符串）的过程，称为**序列化**。

反之，将接收到的文本数据还原为内存中对象的实例的过程，称为**反序列化**。

在浏览器环境和HTTP协议的交互中，`JSON`（JavaScript Object Notation）承担了最核心的数据媒介作用。服务端将实体对象序列化为JSON字符串，通过HTTP响应发送给浏览器；浏览器接收后将其解析为JavaScript对象供前端逻辑使用。

### 业务开发中的真实痛点

理解了上述基础后，我们来看看在实际NestJS业务开发中，处理API响应时经常面临的三个真实痛点：

第一，手动构建响应对象不够优雅。在控制器层返回数据时，开发者经常需要手动创建新对象并进行解构赋值，将ORM实例的属性逐一填入。这种做法需要编写大量样板代码，无法利用ORM工具和类本身的特性，且在属性众多时极易发生漏写或错写。

第二，ORM实体与响应结果存在割裂。随着业务迭代，数据库表结构会发生变化，ORM层中的实体类也会随之更新。如果我们在控制器中采用手动赋值的方式，即使实体类增加了新属性，只要控制器代码没有同步修改，新属性就无法自动体现在API响应中。这增加了维护成本，容易导致前后端数据不同步。

第三，DTO与实体的重复声明问题。为了规范接口，我们通常会编写DTO（数据传输对象）来约束请求和响应格式。在很多场景下，我们希望响应数据基于数据库实体，但需要遮蔽部分敏感字段。如果为了实现遮蔽而重新手写一个DTO，会导致DTO类和实体类中存在大量重复的字段声明。这不仅违背了DRY（Don't Repeat Yourself）原则，手动解构赋值也无法从根源上保障数据结构的严谨性。

### 解决方案：类型映射与序列化的结合

为了解决上述问题，最佳实践是引入`class-transformer`库的装饰器，配合NestJS内置的类型映射（`Mapped Types`）功能以及`plainToInstance`序列化方法。

NestJS本身并不直接操作 `JSON.stringify`，而是通过 `class-transformer` 库，通过装饰器在类上声明序列化行为，并在响应时应用这些行为，利用`class-transformer`，我们可以实现对JavaScript类的更深入的操作。

基础概念来自官方文档：
[序列化](https://docs.nestjs.cn/techniques/serialization)
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
