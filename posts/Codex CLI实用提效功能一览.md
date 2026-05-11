---
title: 'Codex CLI实用提效功能一览'
date: '2026-05-11 14:18:30'
categories:
  - 'coding'
tags:
  - 'ai'
  - 'ai-coding'
  - 'coding'
  - 'dev'

description: 'Codex CLI在真实开发环境使用的实用功能技巧总结,含快捷键一览,高频命令,常见问题排查等'
---

# Codex CLI实用提效功能速查速用

Codex是OpenAI推出的AI辅助编程工具,在真实的工作场景下体验几个月后,发现各方面来说,Codex都比Claude Code更符合真实场景下的开发需要.ChatGPT-Codex系列的模型强大不必多少,其CLI在功能上的设计也更贴近开发者的真实需要,相比之下感觉Claude Code对Vibe-Coder更"友好"一些,那么Codex则更加适合真实业务流程的开发,以下是我在开发过程中总结的使用功能,包含快捷键,高频命令,使用技巧,常见问题处理等.

注意:本文所指的**Codex**若无特别强调,均特指为Codex CLI命令行AI辅助编码工具,Codex APP,Codex Plugin的操作可能与Codex CLI有较大差异,请以对应版本为准.

## Codex本体功能

### 花式启动CLI
- 常规启动:

``` shell
codex
```

- 恢复上次聊天的历史记录:
``` shell
codex resume <"可选参数log-hash">
```

### Codex高频命令

- **先让AI写计划后编码** :`/plan`
- **让AI审阅你变更的代码** : `/review`
- **查看当前账号额度:** :`/status`
- **项目摘要初始化** : `/init`
- **开启新对话**: `/new`
- **清屏命令行,开启新对话** :`clear`
- **临时岔开,创建一个暂时的对话**: `/side`
- **开启快速模式(1.5倍速,但也会增加用量)** `/fast`
- **切换模型** :`/model`
- **查看和使用Skills**: `/skills`
- **查看和使用MCP**: `/mcp`
- **退出Codex**: `/exit`

## Codex快捷键

在不提交命令的情况下换行: **`Alt+Enter`**

切换`Plan`/`Agent`模式: **`Shift+Tab`**

快速引用Skills: 命令行输入 **`$`**

快速引用项目内文件/文件夹: 命令行输入 **`@`**