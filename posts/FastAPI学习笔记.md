---
title: FastAPI学习笔记
tags: 
- fastapi
- python
- web-framework
- api
- backend
categories: 
- backend
abbrlink: 668889422
date: 2025-10-18 13:26:51
description: 'FastAPI高性能Python Web框架学习笔记，涵盖快速开发和类型提示特性'
---

# FastAPI学习笔记

**FastAPI** 是一个现代、快速（高性能）的 Web 框架，用于使用基于标准 Python 类型提示的 Python 构建 API。

文档:[FastAPI档案]("https://fastapi.org.cn/")

## 介绍

FastAPI 是一个现代、快速（高性能）的 Web 框架，用于使用基于标准 Python 类型提示的 Python 构建 API。

主要特点是:

* **快速**：性能极高，与 **NodeJS** 和 **Go** 不相上下（得益于 Starlette 和 Pydantic）。
* **编码快速**：开发功能的速度提升约 200% 到 300%。*
* **更少 Bug**：减少约 40% 的人为（开发者）错误。*
* **直观**：出色的编辑器支持。自动完成无处不在。调试时间更少。
* **简单**：设计为易于使用和学习。阅读文档的时间更少。
* **简洁**：最小化代码重复。每个参数声明提供多项功能。Bug 更少。
* **健壮**：获得生产就绪的代码。带有自动交互式文档。
* **基于标准**：基于（并完全兼容）API 开放标准：OpenAPI（以前称为 Swagger）和 JSON Schema.

## 安装

1. 安装Python 3.10+ 和 pip

2. 安装`fastapi`

```powershell
pip install "fastapi[standard]"
```

3. 编写文件`main.py`

```python
from typing import Union

from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}
```

4. 运行项目

```powershell
fastapi dev main.py
```

## 路径参数

使用 Python 格式字符串的相同语法声明路径“参数”或“变量”

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/items/{item_id}")
async def read_item(item_id):
    return {"item_id": item_id}
```

路径参数 `item_id` 的值将作为参数 `item_id` 传递给你的函数。

此时输入`localhost:8000/item_id/1000`,则返回`{"item_id":1000}`



### 带参数的路径参数

可以使用标准的 Python 类型注解在函数中声明路径参数的类型

在此示例中，`item_id` 被声明为 `int` 类型，python将提供类型检查和自动补全

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id}
```



### 相同路径的顺序问题

在创建路径操作时，你可能会遇到固定路径的情况。

比如 `/users/me`，我们假设它是用来获取当前用户数据的。

然后你可能还有一个路径 `/users/{user_id}`，通过某个用户 ID 获取特定用户的数据。

由于路径操作是按顺序评估的，你需要确保 `/users/me` 的路径在 `/users/{user_id}` 之前声明

**简单来说:** 相同路径参数,常量优先

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/users/me")
async def read_user_me():
    return {"user_id": "the current user"}


@app.get("/users/{user_id}")
async def read_user(user_id: str):
    return {"user_id": user_id}
```

否则，`/users/{user_id}` 的路径也会匹配 `/users/me`，它会“认为”收到了一个值为 `"me"` 的 `user_id` 参数。

**注意:** 不能重新定义同一个路径参数

### 预定值(Enum)

导入 `Enum` 并创建一个继承自 `str` 和 `Enum` 的子类。

通过继承 `str`，API 文档将能够知道这些值必须是 `string` 类型，并能够正确渲染。

**参考文档：**<a href="https://docs.python.org/zh-cn/3.12/howto/enum.html">Python Enum Docs</a>

>  **枚举类**是 Python 提供的一种数据类型，用于定义一组固定的常量。它可以提高代码的可读性和安全性，避免值的误用。枚举类通过 _enum_ 模块实现，支持多种功能，如成员访问、值比较、自定义属性等。

```python
from enum import Enum

class ModelName(str, Enum):
    alexnet = "alexnet"
    resnet = "resnet"
    lenet = "lenet"
```

### 包含路径的路径参数

假设你有一个路径为 `/files/{file_path}` 的_路径操作。

但是你需要 `file_path` 本身包含一个路径，例如 `home/johndoe/myfile.txt`。

因此，该文件的 URL 将类似于：`/files/home/johndoe/myfile.txt`。

**解决方案:** 直接使用`Starlette`的一个选项，你可以使用如下 URL 声明一个**包含路径的**路径参数.

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/files/{file_path:path}")
async def read_file(file_path: str):
    return {"file_path": file_path}
```

## 查询参数

当你声明不属于路径参数的其他函数参数时，它们会自动被解释为“查询”参数。

```python
from fastapi import FastAPI

app = FastAPI()

fake_items_db = [{"item_name": "Foo"}, {"item_name": "Bar"}, {"item_name": "Baz"}]


@app.get("/items/")
async def read_item(skip: int = 0, limit: int = 10):
    return fake_items_db[skip : skip + limit]
```

### 格式

**查询**是一组键值对，位于 URL 中的 `?` 之后，并用 `&` 字符分隔，形如`http://127.0.0.1:8000/items/?skip=0&limit=10`

其中，查询参数是

- `skip`:`0`

- `limit`:`0`

在Pydantic中，使用类型注解后会自动转换获取的查询参数为对应的格式。

### 默认值

查询参数不是路径的固定部分，因此它们可以是**可选**的并可以有**默认值**。

### 可选参数

通过将默认值设置为 `None` 来声明可选查询参数

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/items/{item_id}")
async def read_item(item_id: str, q: str | None = None):
    if q:
        return {"item_id": item_id, "q": q}
    return {"item_id": item_id}
```

**注：**

- 参数可声明`bool`类型，任何其他大小写变体（大写、首字母大写等），函数会将形参视为 `True` 的 `bool` 值。否则为 `False`。

- 可同时声明多个路径参数和查询参数

## 请求体

客户端向 API 发送的数据称为**请求体**，API 返回的数据称为**响应体**。API 通常需要返回响应体，但客户端不一定总是需要发送请求体，有时仅请求路径和查询参数即可。

**要声明请求体，需要使用`pydantic`模型**

### 导入BaseModel

```python
from fastapi import FastAPI
from pydantic import BaseModel


class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None


app = FastAPI()


@app.post("/items/")
async def create_item(item: Item):
    return item
```

### 将`BaseModel`导入参数注解

语法：`item: Item`

**注：** 可使用`type | None =none`表示可选参数

```python
from fastapi import FastAPI
from pydantic import BaseModel


class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None


app = FastAPI()


@app.post("/items/")
async def create_item(item: Item):
    return item
```

### 访问请求体模型

在函数内部，可以直接访问模型对象的所有属性  

使用`item.dict()`或`item.model_dump()`方法赋值

```python
from fastapi import FastAPI
from pydantic import BaseModel


class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None


app = FastAPI()


@app.post("/items/")
async def create_item(item: Item):
    item_dict = item.dict()
    if item.tax is not None:
        price_with_tax = item.price + item.tax
        item_dict.update({"price_with_tax": price_with_tax})
    return item_dict
```

### 请求体+路径参数

**FastAPI** 将识别与路径参数匹配的函数参数应 **从路径中获取**，而声明为 Pydantic 模型的函数参数应 **从请求体中获取**。

```python
from fastapi import FastAPI
from pydantic import BaseModel


class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None


app = FastAPI()


@app.put("/items/{item_id}")
async def update_item(item_id: int, item: Item):
    return {"item_id": item_id, **item.dict()}
```

### 请求体+路径+查询参数

同上。

```python
from fastapi import FastAPI
from pydantic import BaseModel


class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None


app = FastAPI()


@app.put("/items/{item_id}")
async def update_item(item_id: int, item: Item, q: str | None = None):
    result = {"item_id": item_id, **item.dict()}
    if q:
        result.update({"q": q})
    return result
```


