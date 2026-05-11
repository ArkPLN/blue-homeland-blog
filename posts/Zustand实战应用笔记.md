---
title: Zustand实战应用笔记
tags: 
- react
- zustand
- state-management
categories: 
- frontend
abbrlink: 2955613371
keywords: 'react,web,nodejs,frontend'
description: 'Zustand状态管理库在React项目中的实战应用笔记'
date: 2025-11-10 22:15:09
index_img: /images/zustand.webp
banner_img: /images/zustand.webp
---

# Zustand实战应用笔记

## 引言(为什么要状态管理/为什么选择Zustand)

在开发项目的过程中,发现随着我项目后期体量的逐步上升,通过针对一个大类创建多个ts文件和类型文件的简单方式已经开始有些力不从心，特别是复杂的类型注解，相互之间的依赖和大量工厂函数需要管理，因此需要适当做出工程优化，对类型系统和涉及项目需要的各自函数加以进一步封装和管理，综合考虑技术栈和操作难度，这里选择了Zustand并尝试使用该状态管理库探索项目的工程优化迭代，原因有三。

1. 与Redux相比更简洁，单模块依赖，不需要额外的RTK等其他库的二次封装

2. 使用方法更简单，语法符合直觉，无须Provider注入，与React的Hooks函数写法相吻合

3. 对TypeScript兼容性好，便于与项目已有的类型注解相衔接

## 全面用法

> 官网文档在此: <a href="https://zustand.docs.pmnd.rs/getting-started/">Zustand Official Docs</a>

### 安装

使用`pnpm`安装到项目中

> 话说真的还有人在用自带的npm吗，速度真的很慢好吗？？

```shell
pnpm install zustand
```

### 创建Store

1. 引入`zustand`

```ts
import { create } from 'zustand'
```

2. 使用`create()` 方法创建`useBoundStore` 对象

```ts
const useTestStore = create((set)=>({
    test: 'test',
    setTest: (test) => set({ test }),
}))
```

*注意:* **`set`** 表示更新状态的函数。它允许你修改store中的状态值，或者接受一个函数，该函数接收当前状态作为参数，返回新的状态，起到一个类似**扳机**的作用。

3. 导出`useStore`对象(**跨文件的情况**)

```ts
// 解构导出
export { useTestStore };


// 如果只有一个useStore对象,那么default也是可以的
export default useTestStore
```

4. 调用`useStore`

```ts
import {useTestStore} from './store/index'


const test = useTestStore((state) => state.test);
```

**特别注意,对TypeScript来说，需要额外的类型注解处理以避免IDE或ts-check爆黄的情况**

1. 创建`storeState` `interface`

```ts
export interface testState {
    // state属性
    test: string;
    // state方法
    setTest: (test: string) => void;
}
```

2. 将类型注解应用于`create()` 方法的泛型上

```ts
const useTestStore = create<testState>((set)=>({
    test: 'test',
    setTest: (test) => set({ test }),
}))
```

3. 使用对象时对`state`类型注解

```ts
import {useTestStore,testState} from './store/index'


const test = useTestStore((state: testState) => state.test);
  console.log(test);
```

### 调用Store
