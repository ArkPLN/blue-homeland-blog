---
title: Expo React Native + EAS 本地/云端实战真实构建避坑指南
tags:
  - react
  - frontend
  - compile-issue
  - mobile-development
  - cross-platform
abbrlink: 2379479118
categories:
  - mobile
index_img: /images/rn.webp
banner_img: /images/rn.webp
date: 2026-01-30 16:40:33
description:
---

# Expo React Native + EAS 本地/云端构建避坑指南 (Windows/Android篇)

> 在 React Native (特别是 Expo) 开发中，**版本依赖一致性**和**网络连通性**是最大的拦路虎。报错时，我们一定要先看环境和配置，最后再怀疑代码。

[![pZf6aJH.png](https://s41.ax1x.com/2026/01/30/pZf6aJH.png)](https://imgchr.com/i/pZf6aJH)

[![pZf6UFe.png](https://s41.ax1x.com/2026/01/30/pZf6UFe.png)](https://imgchr.com/i/pZf6UFe)

## 一、善用 Expo CLI 和 Doctor (版本对齐是生命线)

很多编译错误（如 NDK 版本不匹配、Kotlin 版本过低、Reanimated 编译失败）的根源，都是因为我们安装的依赖版本和 Expo SDK 不兼容。

### 1. 永远不要手动 npm install 原生库

**错误做法**：

```bash
npm install react-native-reanimated`
```

**正确做法**：

```bash
npx expo install react-native-reanimated
```

**原因**：
`npx expo install` 会自动查找当前 Expo SDK 版本（如 SDK 52）对应的、经过验证的依赖版本。手动安装容易装上最新的（尚未适配的）版本，导致Gradle编译时疯狂窜稀。

### 2. 构建前必须运行npx expo-doctor

在开始折腾编译相关的事情前，先运行：

```bash
npx expo-doctor
```

`expo-doctor`
**关注点**：

* **Check dependencies for packages that should match Expo SDK**：如果有红叉，必须修。
* **React Native Version**：确保 RN 版本完全符合 Expo 要求。

**解决方法:**
在Expo项目的根目录下执行:

```bash
npx expo install --check
```

直到命令行提示`17/17 checks passed. No issues detected!`为止，说明彻底解决了Expo依赖可能导致的问题。
[![pZf6toD.md.png](https://s41.ax1x.com/2026/01/30/pZf6toD.md.png)](https://imgchr.com/i/pZf6toD)

## 二、依赖管理：无条件锁死你的依赖

### 1. 必须提交 Lock 文件

EAS Build (云端) 和本地构建都严格依赖 `yarn.lock`。

* **切忌**：本地删了 lock 文件跑通了，却不提交 lock 文件。
* **后果**：云端构建时会根据 `package.json` 拉取最新小版本，导致云端和本地环境不一致。
* **操作建议**：考虑到EAS Build使用`yarn`作为默认的包管理工具，强烈建议Expo项目保持一致，同样使用`yarn install`管理依赖，记得`git add yarn.lock -f`添加到代码仓库。

### 2. 清理缓存的“三板斧”

当你感觉环境脏了（改了 NDK、换了源但没生效），按顺序执行：

1. **项目级清理**：`cd android && ./gradlew clean` (最重要，必须做)
2. **依赖清理**：`rm -rf node_modules` (Windows下手动删)
3. **构建缓存**：如果改了 `init.gradle`，建议重启终端。

***

## 三、关键配置文件 (`app.json` & `eas.json`)

### app.json (核心配置)

不要把原生代码里的修改（如 AndroidManifest.xml）写死在 `android` 文件夹里（Prebuild 模式下会被覆盖），而是用 Config Plugin。

```json
{
  "expo": {
    "name": "MyApp",
    "android": {
      "package": "com.company.myapp",
      "versionCode": 1
    },
    "plugins": [
      // 在这里配置原生插件，保证每次 prebuild 都能生成正确的原生代码
      "expo-router"
    ]
  }
}
```

### eas.json (构建配置)

本地构建（Local Build）是调试神器。

同时**强烈建议写死`node`版本号**：

本人使用`EAS Build`编译时发现未设置Node版本号可能导致意外的编译失败。

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "node": "22.15.1",
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

**调试命令**：`eas build --platform android --profile development --local`

***

## 四、Android 环境配置 (Windows本地编译必读)

这是作者踩坑报错最多的地方。

### 1. local.properties (路标)

确保 `android/local.properties` 存在，且路径写法正确（Windows下转义冒号和反斜杠）。

**推荐配置（最好全都写清楚）**：

```properties
sdk.dir=D\:\\dev\\Android\\Sdk
ndk.dir=\\path\\to\\ndk
cmake.dir=\\path\\to\\cmake
# 除非特定版本死活找不到，否则尽量写清楚
```

### 2. NDK 版本管理 (重灾区)

Gradle 报错 `NDK version defined in... disagrees with...` 时：

* **方案 A (推荐)**：修改 `android/build.gradle` 中的 `ndkVersion`，改成你电脑上**实际已安装**的版本（如 `27.3.13750724`）。
* **方案 B (保守)**：去 Android Studio SDK Manager 下载报错信息中要求的精确版本（如 `27.1.12297006`）。

### 3. CMake

通常不需要手动配置，但如果报错 `CMake not found`，在 SDK Manager 里安装 `CMake 3.22.1` 即可。

## 五、Gradle 网络救灾指南 (中国区特供)

即便配置了阿里云镜像，依然可能因为 **Gradle Wrapper 下载**、**插件依赖**、**特殊 aar 包** 而失败。

### 1. 终极 `init.gradle` (全局镜像)

不要在每个项目里改 `build.gradle`，直接在 `USER_HOME/.gradle/init.d/init.gradle` (gradle所在目录下) 放置此脚本。

**核心逻辑**：不是 `remove`（会报错），而是 `setUrl`（劫持替换）。

```groovy
def ALIYUN_PUBLIC = 'https://maven.aliyun.com/repository/public'
def ALIYUN_GOOGLE = 'https://maven.aliyun.com/repository/google'
def ALIYUN_PLUGIN = 'https://maven.aliyun.com/repository/gradle-plugin'

def replaceRepositoryUrl = { repo ->
    if (repo instanceof MavenArtifactRepository) {
        def url = repo.url.toString()
        if (url.contains('dl.google.com') || url.contains('android/maven2')) {
            repo.setUrl(ALIYUN_GOOGLE)
        } else if (url.contains('repo1.maven.org') || url.contains('jcenter')) {
            repo.setUrl(ALIYUN_PUBLIC)
        } else if (url.contains('plugins.gradle.org')) {
            repo.setUrl(ALIYUN_PLUGIN)
        }
    }
}

allprojects {
    buildscript { repositories { all { replaceRepositoryUrl(it) } } }
    repositories { all { replaceRepositoryUrl(it) } }
}
gradle.settingsEvaluated { settings ->
    settings.pluginManagement { repositories { all { replaceRepositoryUrl(it) } } }
}
```

### 2. 只有镜像是不够的：HTTP 代理

阿里云镜像无法覆盖 100% 的 Google 资源（尤其是最新的 NDK 或某些冷门库）。
**必须配置 Gradle 走本地代理**。
强烈建议全程挂载相关的**网络工具**并开启**全局代理**。（原因是部分网络工具可能不支持JDK SSL协议）

修改 `android/gradle.properties` (或全局 `.gradle/gradle.properties`)：

```properties
# 假设你的网络工具已经打开了HTTP/HTTPS代理，假设端口是 7890
systemProp.http.proxyHost=127.0.0.1
systemProp.http.proxyPort=7890
systemProp.https.proxyHost=127.0.0.1
systemProp.https.proxyPort=7890
```

## 六、日志分析心法

当构建失败（BUILD FAILED）时，不要慌，按以下顺序看日志：

1. **看最下面**：`FAILURE: Build failed with an exception.`
2. **找 What went wrong**：
   * 如果是 `Could not resolve ...` -> **网络问题**（检查代理、镜像）。
   * 如果是 `NDK version ... disagrees` -> **版本不匹配**（改 build.gradle）。
   * 如果是 `No signature of method: remove()` -> **Gradle脚本写错**（不要删集合，要改属性）。
   * 如果是 `Task :app:compileReleaseJavaWithJavac failed` -> **代码语法错误**（检查 RN 代码）。
3. **看 Caused by**：通常藏在堆栈中间，特别是 `SSLHandshakeException` (被墙) 或 `EOFException` (网络中断)。

## 七、总结

想要在 Windows 上顺畅开发 React Native Android：

1. **网络是爹**：准备好魔法，Gradle 配好镜像。
2. **环境是妈**：Expo Doctor 没病再开工。
3. **配置是命**：NDK 版本要对齐，`local.properties` 路径要对。

祝各位开发老师编译顺利!
