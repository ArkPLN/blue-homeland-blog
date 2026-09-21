---
title: Moetalk桌面端无法正常使用的问题技术报告和解决方案
tgs: 
- nginx
- technical-report
- problem-solving
- Moetalk
categories: 
- dev
abbrlink: 1331204612
description: 'Moetalk桌面端技术问题报告与Nginx解决方案，详细记录问题排查和修复过程'
date: 2025-09-22 21:09:22
---

# Moetalk桌面端无法正常使用的问题技术报告和解决方案

**作者:** ArkPln [github](https://github.com/arkpln) [个人博客](https://arkpln.github.io)

本文旨在分析和尝试解决Moetalk(Windows桌面端)始终无法正常使用的问题;初步剖析了可能的技术原因,并通过使用Nginx反代和重构bat脚本的方式解决了这个问题,本人愿意尽自己的绵薄之力,希望该技术报告和改进方案可以被采纳,以充分解决长期以来Moetalk桌面离线端无法正常使用的问题,也利好各位广大热爱BA却苦于各种原因不善技术操作的二创老师们!



## 背景介绍(给不知道BA的技术用户)

Moetalk是一款基于电子游戏《碧蓝档案》的同人剧情编辑器，集成了对话编辑、存档读取、在线预览、导入导出等功能。作为继Yuzutalk后目前使用最广泛的同人剧情编辑工具，它支持多平台使用，包括在线网页、PC桌面端和手机端，深受游戏和二创爱好者欢迎。

## 排查过程

    在确认客户端无法正常使用,且确认为本地服务器(主要是**EasyWebSvr** 启动的后端服务器)导致的问题，我开始围绕后端Web服务器程序本身开始排查。

    首先我检查了**EasyWebSvr** 配置文件,在确认配置文件**本身**无误后，我转向阅读浏览器提示。

```editorconfig
# EasyWebSvr.ini
[WebServer]
RootDir=.\
ListenPort=80
MaxThreadNum=100
Timeout=5000
bAutoRun=0
bIconStartStop=0
MaxContentLength=16777216
MaxHeaderLength=4096
[Cgi]
EnableCgi=1
EnableIsapi=1
IsapiCache=1
EnablePhp=1
[Docs]
DefaultHtml=index.htm,index.html,default.htm,index.php
EnableDirBrowse=1
ShowDirAlways=0
[ScriptEngine]
[Log]
LogToWindow=1
LogWndMaxLine=50
LogToFile=0
LogFileName=
[StartParam]
bShowWnd=0
bStartRun=0

```

    使用默认配置启动浏览器输入地址`localhost`(http/https协议 80端口),均显示错误`ERR_SSL_PROTOCOL_ERROR`,进一步查询得知,这种错误一般由于SSL 连接问题,且据称主要是因为**系统时间异常导致**,但检查系统时间并无问题,此时转向**EasyWebSvr**,猜测有可能是因为该后端Web服务器程序**不支持SSL/TLS协议**,导致**SSL/TLS**握手失败，由此导致现代浏览器无法正常访问，且确认强制http协议或IE模式下这个问题依然存在。

    因此，我尝试更换了`nginx`后端作为Web服务器,并写入配置，编写配套一键启动、关闭bat脚本，最终妥善解决了该问题,以下是部署实施中遇到的问题和经验。

1. 文件目录问题

在编写`nginx`配置文件时，初步阅读项目文件目录后，我选择以'.\MoeTalk\MoeData'作为根目录，但在实际部署运行时发现，显示前端的浏览器会反复跳转卡死，通过F12开发者工具检查源代码和网络请求，可能是因为这个目录下的`index.html`下HTML内嵌的js代码`window.location.replace('../');`没有正常工作，导致路由跳转失效，页面会卡死。在更换根目录为`.\MoeTalk`后，这个问题得到解决。

2. SSL证书签名问题

在编写`nginx`配置文件时，我希望可以尽可能的直接访问本地的https端口，但实际部署时发现浏览器的`ERR_SSL_PROTOCOL_ERROR`错误依然存在，后经查询资料确认，若要使用https协议，Web服务器需要提供SSL数字证书签名，此处使用了`openssl`软件完成了SSL证书自签名（尽管网页会显示非可信CA），暂定有效期至2026/9/16（后续也可自行续期或重新签发证书），由此保证了在默认https协议下网页可以正常访问。

3. 本地端口占用问题

在早期尝试运行`nginx`后端Web服务时，经常会出现nginx配置项正常，但网页无法正常打开的情况。在友人的协助下,通过`netstat`等工具，最终排查结果为可能是本地端口被其他程序占用，从而出现页面无响应或返回`{'status':404}`的情况。其中，已经查证的有：`steamcommuity302.exe`会占用80端口,`kook.exe`会占用8443端口,此外还有其他可能的各种联网应用或网络代理工具.....由此导致了各种可能的Web后端服务器运行正常但网页显示异常的情况。此处为nginx重新分配了http和https协议端口,确保浏览器可正常访问。





## 解决方案

对原Moetalk（Windows桌面端）重写了Web后端服务器实现方式和bat批处理启动/关闭脚本.

以下是更新后的部分脚本/配置代码(略去Nginx程序本体和其他无关文档)

1. `StartNginx.bat`:双击启动服务器,待命令行弹出后可按住`Ctrl`,鼠标左键点击任意一网页

```batch
@echo off
setlocal

set NGINX_DIR=%~dp0nginx

chcp 65001 >nul
echo Starting Nginx...
echo 启动后端服务...
cd /d %NGINX_DIR%
start "" nginx.exe

echo ==============================
echo Nginx started.
echo Root: %~dp0MoeData
echo Visit: http://localhost:8880
echo Vist: https://localhost:44300
echo ==============================
pause

```



2. `ShutNginx.bat`:双击关闭服务器,待命令行弹出关闭Nginx后,按任意键即可完成Nginx服务器关闭

```batch
@echo off
chcp 65001 >nul
set NGINX_DIR=%~dp0nginx
cd  /d %NGINX_DIR% 
taskkill /F /IM nginx.exe
echo Nginx stopped.
echo Nginx已关闭.
pause

```



3. `nginx.conf`:位于`.\nginx\conf`下,是Nginx的配置文件,一般不需要修改.

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    # HTTP 80
    server {
        listen       8880;
        server_name  localhost;

        root   ../../MoeTalk;
        index  index.htm index.html default.htm;

        location / {
            autoindex on;
        }
    }

    # HTTPS 443
    server {
        listen              44300 ssl;
        server_name         localhost;
`   # SSL Config
        ssl_certificate     server.crt;
        ssl_certificate_key server.key;

        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;

        root   ../../MoeTalk;
        index  index.htm index.html default.htm;

        location / {
            autoindex on;
        }
    }
}


```

## 使用方法

**启动:** 完全解压后双击`StartNginx.bat`,待命令行弹出后可按住`Ctrl`,鼠标左键点击任意一网页即可.

**关闭:** 双击`ShutNginx.bat`关闭服务器,待命令行弹出关闭Nginx后,按任意键即可完成Nginx服务器关闭.



## 鸣谢

在此感谢Moetalk开发和维护人(团队)的持续支持,感谢友人和Deepseek提供的技术支持和问题排查协助,感谢Nginx和openssl开发和开源团队.
