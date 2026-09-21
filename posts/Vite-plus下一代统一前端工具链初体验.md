---
title: Vite-plus下一代统一前端工具链初体验
tags:
  - frontend
  - dev
  - web
  - vue
  - react
abbrlink: 482054044
categories:
  - frontend
description: 初探下一代前端工具链VitePlus
date: 2026-03-14 19:16:11
---

# Vite-Plus 剑指前端工具链的"秦始皇"初体验

## 为什么是Vite?Plus在哪?

去年年中的时候就已经听说过尤佬宣布要推出**VitePlus**以一举统一前端工具链，这我当然要拍手称快，但就如同过去近10年不断折腾的前端一样，就连统一也要不停的折腾。**Vite**，**Turbopack**，**Rspack**...CLI作为开发的入口，自然是兵家必争之地，虽然大家都心知肚明，CLI背后当然是各自的生态，VitePlus要寻求稳健的商业化路径，Turbopack是Vercel的潜在流量池，Rspack背后自然是字节跳动在开发框架上的巨大野心。

所以，**VitePlus**到底**Plus**在哪，我阅读了VitePlus官网的[原文](https://voidzero.dev/posts/announcing-vite-plus?utm_source=vite&utm_content=top_banner)，试图找出答案：

> **Vite+致力于解决的问题**
> 
> 多年来，JavaScript 工具生态系统经历了相当程度的碎片化与动荡。作为一种最初仅用 10 天设计的语言，没人能想象如今我们会用 JavaScript 构建如此规模和复杂度的应用程序。对于面临日益庞大的网络项目却内部工具资源有限的企业而言，工具链的复杂性和性能已成为切实的瓶颈。
> 
> 对于拥有多个团队且各自采用独特工具链选择的公司来说，这些瓶颈问题尤为突出。依赖管理或安全审查等任务必须为每个团队单独处理。不同项目间的依赖组合逐渐失去同步，随着时间的推移越来越难以协调。如果团队或项目合并，开发者就必须投入时间迁移工具，否则最终会形成一套错综复杂、拼凑而成的工具栈。
> 
> 通过 Vite+，我们致力于为 JavaScript 工具链提供统一解决方案——让面临这些挑战的团队能够专注于产品交付，而非将时间浪费在工具栈的评估、琐碎争论、配置和调试上。

**VitePlus**剑指**前端生态的大一统**，具体来说，VitePlus承担了以下功能：

* **`vite new`** —— 用于快速搭建新项目（特别是单体仓库），提供与 Vite+最适配的推荐项目结构。同时支持代码生成功能，例如向单体仓库添加新包，或调用自定义生成器。

* **`vite test`** —— 运行由 [Vitest](https://vitest.dev/) 驱动的单元测试。它提供兼容 [Jest](https://jestjs.io/) 的 API，可与您的主应用开箱即用，并包含浏览器模式、分片测试、视觉回归测试等完整功能集。

* **`vite lint`** — 使用 [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) 对代码进行静态检查，它内置 600 多项 ESLint 兼容规则，速度比 ESLint 快达 100 倍。同时支持类型感知的代码检查，以及通过 ESLint 兼容 API 编写的 JavaScript 插件。

* **`vite fmt`** — 使用即将发布的 Oxfmt 格式化代码，其目标是与 Prettier 保持 99% 以上的兼容性，同时提供更强的控制力和灵活性，例如对换行规则进行更精细的调控。

* **`vite lib`** — 通过内置最佳实践的方案打包库项目，由 [tsdown](https://tsdown.dev/) 和 [Rolldown](https://rolldown.rs/) 提供支持。包含通过 `isolatedDeclarations` 转换实现的极速捆绑式 DTS 生成功能。

* **`vite run`** — 内置的智能缓存型单体仓库任务执行器。我们实现了复杂的任务输入推断机制，使得大多数任务无需显式配置即可获得缓存效果——其缓存粒度通常比手动设置更加精细。可将其视为无需告知系统缓存失效规则的 [Turborepo](https://turborepo.com/)。

* **`vite ui`** —— 提供模块解析/转换行为洞察、打包体积/摇树优化分析，并与框架专属开发工具集成的图形界面开发工具。

换言之，VitePlus几乎彻底的绝大多数前端工程化要考虑的工程选型问题，其中，我也早已深度体验了当中不少的工具，其中Vite和Vitest的体验还是非常不错的，Vite几乎是Vue3、React（不考虑SSR）的默认构建工具链，即便是默认配置，其HMR和编译速度也是相当的快，这也是得益于Rollup和基于Golang编写的esbuild。而在Turbopack和Rspack不约而同的转向"锈化"的Rust生态,Vite也适时的跟进了Rust的步伐,推出了可选的Rolldown的js打包工具,提供了绝对凶猛的性能，太恐怖了Rust大人。

同时，我也非常青睐使用Vitest执行可视化的视觉测试功能，这是Jest无法提供的，在此之前往往需要使用Storybook这种专门的UI框架，无疑增加了开发和测试验证的负担，而Jest作为老牌测试框架已有些力不从心；而且Jest的配置对新手不太友好，需要适当的修改jest配置，使用babel转译也是不可忽视的速度硬伤，在这一点上，Vitest选择兼容Jest的语法无疑是及其明知的选择。

同时，VitePlus也统一了Lint和Check的问题，在此之前的默认配置都是`ESLint`+`Prettier`，现在有了更加统一的组合，当然是好事。

除此之外，VitePlus还解决了一个很重要的问题**Monorepo**，在此之前，往往是`pnpm workspace + turbopack `的方案，无疑造成的巨大的学习成本，而且在配合**Github Workflows** 执行CI/CD流水线时,pnpm和其他包管理工具混用又会造成额外的适配成本,VitePlus解决了这个问题.

## 快速使用

[Getting Started | The Unified Toolchain for the Web](https://viteplus.dev/guide/)

### Windows

```powershell
irm https://vite.plus/ps1 | iex
```

### MacOS/Linux

```bash
curl -fsSL https://vite.plus | bash
```

> Vite+ 会管理全局 Node.js 运行时和包管理器。如需禁用此功能，请运行 `vp env off`。若您认为 Vite+ 不适合您，请输入 `vp implode`

## 创建项目

```bash
vp create
vp create <template>
vp create <template> -- <template-options>
```

Vite+ 内置了以下模板：

* `vite:monorepo` 创建一个新的单体仓库
* `vite:application` 创建一个新的应用程序
* `vite:library` 创建一个新的库

## 运行项目

```bash
vp run
```

## 构建项目

```bash
vp build
vp build --watch
vp build --sourcemap
```

## 打包项目

```bash
vp pack
vp pack src/index.ts --dts
vp pack --watch
```

## 迁移项目

```bash
vp migrate
vp migrate <path>
vp migrate --no-interactive
```

## 测试项目

```bash
vp test
```


