---
title: Vue学习笔记
categories: 
- frontend
tags: 
- vue
- frontend
- javascript-framework
- components
abbrlink: 1901149387
date: 2024-10-06 16:44:00
keywords: vue,nodejs,frontend,vuejs
description: 'Vue.js渐进式JavaScript框架学习笔记，涵盖模板语法和组件化开发'
---

# Vue框架学习

渐进式JavaScript框架

官方文档：

> https://cn.vuejs.org/



## Vue API风格

#### 选项式API/组合式API

## Vue安装

在NodeJS命令行中键入

```npmignore
npm init vue@latest
```

或者引入CDN(Vue3)

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
```



## Vue 目录

1. .vscode ---VSC工具配置文件

2. node_module ---Vue项目运行依赖

3. public ---资源文件夹

4. src --- 源代码

5. .gitgnore ---git忽略文件

6. index.html ---入口HTML文件

7. package.json ---信息描述文件

8. README.md ---注释文件

9. vite.config.js ---vue配置文件
   
   

## Vue.js对象

每个Vue.js应用都是通过Vue.js函数创建一个新的Vue.js实例开始的，此处为Vue3版。

```js
const { createApp } = Vue;

// 创建一个新的 Vue 应用
const app = createApp({
    // 组件的状态数据
    data() {
        return {
            // 在这里定义响应式数据
            message: 'Hello, Vue!'
        };
    },
    // 组件的方法
    methods: {
        // 定义一个方法
        greet() {
            alert(this.message); // 弹出当前的 message 内容
        }
    },
    // 组件的生命周期钩子
    mounted() {
        console.log('组件已挂载！'); // 在组件挂载后执行的代码
    }
});

// 挂载 Vue 应用到目标 DOM 元素
app.mount('#app'); // 将 Vue 应用挂载到 id 为 'app' 的元素上
```

可以在创建的Vue对象内定义实例property（属性），包括data等,可以在data内写入JSON对象。但只有**在实例被创建时就已经存在于data中的`property`** 才是响应式的。

```jsx
var data = {a:1}
var vm = new Vue({
    data:data
})
vm.b="hi"  //没用
```

使用 **`Object.freeze()`** 会解除Vue.js的响应式效果，再度改变property不会渲染到视图上。

## Vue模板语法

#### 文本插值

```js
# app.vue

<template>
    <p> {{ msg }} </p>
    //表达式
</template>




<script>

export default {
    data(){
        return{
            msg:"神奇的魔法"
    }
}
}

</script>
```



#### 使用JavaScript表达式

每个绑定只支持**单一表达式**，即一段能够被求值的JavaScript代码，if语句等逻辑操作语句不可以加入模板。

```js
# app.vue


<template>
    <p>{{ msg }}</p>
    <p>{{ num + 1}}</p>
    <p>{{ok ? 'YES' : 'NO '}}</p>
</template>

<script>
export default {
    data(){
        return{
           msg:"神奇的语法",
           num:10,
           ok:true
}
}    

}
</script>


```



#### 原始HTML

双大括号会将数据插值为纯文本而非HTML，需要使用`v-html`指令插入HTML

```html
#app.vue

<template>
    <p>{{rawHtml}}</p>
    # 纯文本属性
    <p>html属性：<span v-html="rawHtml"></span></p>
</template>


<script>
export default {
    data(){
        return{
        rawHtml:"<a href="https://kivo.wiki/data/character/373">百战星野</a>"
}
}
}
</script>
```



## Vue属性绑定

#### v-bind绑定

双大括号并不能在HTML attributes中直接使用，想要响应式绑定attribute需要使用`v-bind`指令

`v-bind:attribute`指令将元素的特定attribute（即属性）与组件的属性保持一致，若绑定值为  `null`或者`undefined`则将该属性从渲染的元素上移除

```html
#app.vue
<template>
    <div v-bind:id="dynamicId" v-bind:class="dynamicClass">AppID</div>
</template>

<script>
    export default {
        data(){
            return{
                dynamicId:"appid",
                dynamicClass:"appclass"
}
}
}
</script>



```

#### v-bind简写

简写如下

```html
<div :id="dynamicId" :class="dynamicClass"></div>
```

#### 布尔值Attribute

依据true/false值来决定attribute是否存在于该元素之上，例如**disabled**

```html
#app.vue
<template>
    <button :disabled="isButtonDisabled">Click me</button>
</template>

<script>
    export default {
        data(){
            return{
                isButtonDisabled:true,
}
}
}
</script>
```

#### 动态绑定多个值

```html
#app.vue
<template>
    <p v-bind="objectOfAttrs">百战星野</p>
</template>

<script>
    export default {
        data(){
            return{
                objectOfAttrs:{
                               id:"appId",
                               class:"appClass"
}
}
}
}
</script>
```



## 条件渲染

#### v-if

`v-if`指令用于条件性的渲染一块内容，只有在指令的表达式为真值时才被渲染。

```html
# ./componets/if-vue.vue
<template>
    <div v-if="flag">你能看见我吗</div>
</template>

<script>
    export default{
       data(){
            return{
                  flag:true,
}
}
}    
</script>


```



#### v-else-if

`v-else-if`提供了相应于`v-if`的“else-if区块”，可以连续多次使用



```html
# ./componets/if-vue.vue
<template>
    <div v-if="type === 'A'">A</div>
    <div v-else-if="type === 'B'">B</div>
    <div v-else-if="type === 'C'">C</div>
    <div v-else>Not A/B/C</div>
</template>

<script>
    export default{
       data(){
            return{
                  type:"D",
}
}
}    
</script>
```

`v-if`与`v-show`

`v-if`“真实的”按条件渲染，在切换时，条件区块内的事件监听器和子组件都会被销毁和重建。

`v-show`无论元素初始条件如何都会被渲染，只是切换了css的`display`属性。

**需要频繁切换**使用`v-show`，**在运行时绑定条件很少改变**使用`v-if`



## 列表渲染

#### v-for

可以使用`v-for`指令基于一个数组来渲染列表。`v-for`指令使用`item in items`的语法，即迭代元素 in 遍历列表

```html
# for-vue.vue


<template>
    <div>
        <p v-for="item in names">{{ item }}</p>
    </div>

</template>
<script>
    export default{
        data(){
        return {
                names:["1","2","3"]
}
}    

}
</script>

```



#### 复杂访问

```html
# for-vue.vue


<template>
    <div v-for="item in/of result">
        <p>{{ item.title }}</p>
        <img :src="item.avator">
        #标签属性绑定使用"v-bind或者:attribute"
    </div>
</template>


<script>
    export default{
        data() {
            return {
                    result:[
    {
        "title":Title,
        "avator":"./img/01.jpg"
    }
]
}
}
}
</script>
```



#### 数组下标

`v-for`也支持使用可选的第二个参数表示当前项的位置索引

```html
<template>
    <div>
        <p v-for="(item,index) in names">{{ index}:{{}}}</p>
    </div>
</template>


<script>
    export default{
    data() {
        return {
                names:["1","2","3"]
}
}
}
</script>
```



#### v-for与对象

```html
<template>
    <div>
        <p v-for="(value,key,index)">
        {{value}}-{{key}}-{{index}}
        </p>        
    </div>
</template>


<script>
export default{
    data(){
        return {
                userInfo:{
                            name:"iwen",
                            age:20,
                           # key:value,
                          }
                }
        }    

}
<script>
```



## 通过Key管理状态

Vue渲染元素列表时，当数据项的顺序改变时，Vue不会移动DOM元素的顺序而是就地更新每个元素以确保它们在原本指定的位置渲染。

为了给Vue一个提示以跟踪节点标识，可以为每个元素对应的标签提供唯一的` key`属性，以v-bind形式绑定

```html
<script >
  export default {
    data(){
      return {
        names: ['1', '2', '3', '4', '5']
      }
    }
  }
</script>

<template>
  <h3>key属性添加到v-for中</h3>
  <p v-for="(item,index) in names" :key="index">{{item}}</p>
</template>
```



## 事件处理



可以使用`v-on`指令（简写为`@`）来监听DOM事件，在事件触发时执行JavaScript。

用法：`v-on:click="methodName"`或者`@click="handler"`

事件处理器可以是：

1. **内联事件处理器**：触发内联JavaScript语句

2. **方法事件处理器**：指向组件定义的属性名或者路径
   
   

#### 内联事件处理器

用于简单场景

```html
<script>
  export default {
    data() {
      return {
        count: 0,
      }
    }
  }
</script>

<template>
  <h3>内联事件处理器</h3>
  <button v-on:click="count++">Add</button>
  <p>{{ count }}</p>
</template>
```



#### 方法事件处理器

```html
<script>
export default {
  data() {
    return {
      count: 0
} },
  methods: {
    addCount() {
      this.count++;}
  }
  //所有方法和函数放在这里
}
</script>

<template>
  <h3>方法事件处理器</h3>
  <button @click="addCount">Add</button>
  <p>Count: {{ count }}</p>
</template>

<style scoped>

</style>
```



## 事件参数

事件参数可以获取`event`对象和通过事件传递参数



#### 获取`event`对象

```html
<script>
export default {
  data() {
    return {
      count: 0
    } },
  methods: {
    addCount(e) {
// Vue中的event对象与JavaScript中的对象相同
      e.target.innerHTML ="Add" + this.count
      this.count++;}
  }
  //所有方法和函数放在这里
}
</script>

<template>
  <h3>方法事件处理器</h3>
  <button @click="addCount">Add</button>
  <p>Count: {{ count }}</p>
</template>

```



#### 事件传参

```html
<script>
export default {
  data() {
    return {
      names:["iwen","ime","frank"]
    } },
  methods: {
    getNameHandler(name){
      console.log(name);
    }
  }
  //所有方法和函数放在这里
}
</script>

<template>
  <h3>事件传参</h3>
  <p v-for="(item,index) of names" :key="index" @click="getNameHandler(item)">{{item}}</p>
</template>

```

如果需要同时传递参数和Event对象，可以采用形如`@click="handler(item,$event)"`的格式来传递Event对象，且**顺序不可随意调换**。



## 事件修饰符

在处理事件时调用`event.preventDefault()`等很常见，但为了避免反复的处理DOM事件的琐事可以使用**事件修饰符**，方便开发者专注于数据逻辑。

1. `.stop`

2. `.prevent`

3. `.once`

4. `.enter`

5. ...

> 参考链接：[[事件处理 | Vue.js]]((https://cn.vuejs.org/guide/essentials/event-handling.html#event-modifiers))



#### 阻止默认事件

```html
<script >
export default {
  data() {
    return {
    }
  },
  methods: {
    clickHandle(e) {
      console.log('点击了')}
  }
}
</script>

<template>
  <h3>事件修饰符</h3>
  <a href="https://www.baidu.com" @click.prevent="clickHandle">百度</a>
</template>


```



#### 阻止事件冒泡

```html
<script >
export default {
  data() {
    return {

    }
  },
  methods: {
    clickHandle(e) {
      console.log('点击了')},

  clickDiv(){
    console.log('点击了div')},

  clickP(){
    console.log('点击了p')},
  },
}
</script>

<template>
  <h3>事件修饰符</h3>
  <a href="https://www.baidu.com" @click.prevent="clickHandle">百度</a>
  <div @click="clickDiv">
    <p @click.stop="clickP">测试冒泡</p>
  </div>
</template>

```



## 数组变化侦测

#### 变更方法

Vue能够侦听响应式数组的变更方法，并在它们被调用时触发相关更新，变更方法包括：

- `push()`

- `pop()`

- `shift()`

- `unshift()`

- `splice()`

- `sort()`

- `reverse()`

```html
<script>
export default {
  data(){
    return{
      names:["John","Mary","Tom"]
    }
  },
  methods:{
    addListHandler(){
      this.names.push("HOSHINO");
    }
  }
}
</script>

<template>
<h3>数组变化</h3>
  <button @click="addListHandler">添加数据</button>
  <ul>
    <li v-for="(item,index) of names" :key="index">{{item}}</li>
  </ul>
</template>

```



#### 替换一个数组

在数组的操作过程中，存在一些不可变(immutable)的方法，例如`filter()`,`concat()`,`slice()`，这些方法不会改变原数组，而是返回一个新的数组，因此遇到非变更方法时，需要将**旧数组替换为新数组**。

```html
<script>
export default {
  data(){
    return{
      names:["John","Mary","Tom"]
    }
  },
  methods:{
    addListHandler(){
      this.names = this.names.concat(["sakura"]);
    }
  }
}
</script>

<template>
<h3>数组变化</h3>
  <button @click="addListHandler">添加数据</button>
  <ul>
    <li v-for="(item,index) of names" :key="index">{{item}}</li>
  </ul>
</template>

```



## 计算属性

在模板中编写太多逻辑会使得模板变得臃肿，因此可以使用**计算属性**来描述响应式状态的逻辑。

```html
<script>
  export default {
    data() {
      return {
        tableData: {
          name: 'John',
          content:['a', 'b', 'c']
        }

      }
    },
    computed: {
      namesContent(){
        return this.tableData.content.length > 0? "Yes" : "No";

      }
    }
    //在此编写计算属性
  }
</script>

<template>
  <h3>{{tableData.name}}</h3>
  <p>{{namesContent}}</p>
</template>


```

> **重点区别**
> 
> 计算属性：计算属性值会基于其响应式依赖被缓存，仅在依赖更新时再重新计算
> 
> 方法：方法调用总是在重渲染发生再次执行



## Class绑定

在Vue中可以使用功能更加强大的`v-bind`，除了字符串，表达式也可以对象或者数组，此处为class属性插值表达式。

#### 绑定对象

```html
<script>
  export default {
    data() {
      return {
        isActive: true,
        classObject: {
          'active': true,
        },
      }
    }
  }
</script>

<template>
  <h3 :class="classObject" >Class样式绑定</h3>
//也可以是数组[atrriVar1,attriVar2...]
</template>

<style>
.active {
  color: red;
  font-size: 20px;}

</style>
```

> **温馨提示**
> 
> 数组和对象嵌套过程中，只能在数组内嵌套对象，反之不行。



## Style绑定

在Vue中可以使用功能更加强大的`v-bind`，除了字符串，表达式也可以对象或者数组，此处为内嵌样式表达式。

#### 绑定对象

```html
<template>
<div :style="{color:activeColor,fontSize:fontSize + 'px'}">Style绑定</div>
</template>
// :style="styleObj"

<script>
export default{
    data(){
        return{
            activeColor:"red",
            fontSize: 30,
        //styleObj:{color:'red',fontSize:30}
}    

}

}

</script>
```



## 侦听器

我们可以使用`watch`选项在每次响应式属性发生变化时触发一个函数。

*watch下的函数名必须与被侦听的数据对象保持一致*



```html
<script>
export default {
  data() {
    return {
      message: 'Hello'
    }
  },
  methods: {
    updateHandler() {
      this.message = 'World'
    }
  },
  watch: {
    //newVal改变之后
    message(newVal, oldVal){
      //数据发生变化时执行
      console.log('newVal:', newVal, 'oldVal:', oldVal)
    }
  }
}
</script>

<template>
  <h3>侦听器</h3>
  <p>{{ message }}</p>
  <button @click="updateHandler">修改数据</button>
</template>

```



## 表单输入绑定

在前端处理表单时，我们常常将表单输入框的内容同步给JavaScript中的相应变量。手动连接值绑定和更改事件监听器会比较麻烦，使用`v-model`简化了这一步骤，`v-model`负责监听用户输入事件并更新数据。

```html
<script>
  export default {

    data() {
      return {
        message: '',
        checked: false
      }
    }
  }
</script>

<template>
  <h3>表单输入绑定</h3>
  <form>
    <input type="text" v-model="message">
    <p>{{ message }}</p>
    <input type="checkbox" id="checkbox" v-model="checked">
    <label for="checkbox">{{ checked }}</label>
  </form>
</template>

```

#### 常见表单输入绑定

```html
<div id="app">
<h2>单行文本输入框绑定</h2>
    <input type="text" v-model="singleMessage" placeholder="请输入内容">
    <div>
        输入的内容：{{ singleMessage }}
    </div>
<h2>多行文本输入框绑定</h2>
    <textarea v-model="multiMessage" placeholder="请输入内容"></textarea>
    <div>
        输入的内容：{{ multiMessage }}
    </div>
<h2>复选框绑定</h2>
    <input type="checkbox" v-model="checkboxValue" id="checkbox"></input/>
    <label for="checkbox">{{ checkboxValue }}</label>
<h2>单选框绑定</h2>
    <input type="radio" id="one" value="one" v-model="radioPicked">
    <label for="one">One</label>
    <input type="radio" id="two" value="two" v-model="radioPicked">
    <label for="two">Two</label>
    <span>选中的值：{{ radioPicked }}</span>
<h2>下拉列表绑定</h2>
    <select v-model="selectValue" multiple style="width: 150px">
        <option disabled value="">请选择</option>
        <option value="option1">选项1</option>
        <option value="option2">选项2</option>
        <option value="option3">选项3</option>
    </select>
    <span>选中的值：{{ selectValue }}</span>
</div>


<script>
    const app = Vue.createApp({
        data() {
            return {
                singleMessage: '',
                multiMessage: '',
                checkboxValue: false,
                radioPicked: '',
                selectValue: [],
            }
        }
    });

    app.mount('#app');  // 在这里挂载应用到 #app
</script>
```

#### 值绑定

对复选框有`true-value`和`false-value`属性，分别表示选中和未选中的绑定值，此时可动态绑定到v-model的数据属性。

对单选框有`v-bind:value`

对选择框有`v-bind:value="{}"`,动态属性为object类型

#### 修饰符

`v-model`也提供了形如`.lazy`,`.number`,`.trim`的修饰符

默认情况下，`v-model`会在每次`input`事件后更新数据，可以添加`.lazy`修饰符来改为在每次`change`事件后再更新数据

```html
<script>
  export default {

    data() {
      return {
        message: '',
        checked: false
      }
    }
  }
</script>

<template>
  <h3>表单输入绑定</h3>
  <form>
    <input type="text" v-model.lazy="message">
    <p>{{ message }}</p>
    <input type="checkbox" id="checkbox" v-model="checked">
    <label for="checkbox">{{ checked }}</label>
  </form>
</template>

```

如果想将用户的输入转换为数值类型，则可以给v-model添加`.number`修饰符

```html
<input v-model.number="age"></input>
```

如果要自动过滤用户输入的首尾空白字符，可以添加`.trim`修饰符

```html
<input v-model.trim="msg"></input>
```

## Ref全家桶

### ref

类似Vue2的`data`  ，深层次响应

```jsx
<template>
    {{ data }}
</template>

<script setup lang="ts">
import { ref,type Ref } from "vue"
const man:Ref<Object> = ref({name:"123"})

</script>
```

注: 可使用`isRef`判断是否为响应式对象

### shallowRef

```ts

function shallowRef<T>(value: T): ShallowRef<T>

interface ShallowRef<T> {
  value: T
}
```

和 `ref()` 不同，浅层 ref 的内部值将会原样存储和暴露，并且不会被深层递归地转为响应式。只有对 `.value` 的访问是响应式的。

`shallowRef()` 常常用于对大型数据结构的性能优化或是与外部的状态管理系统集成。

`ref`和`shallowRef`不能同时出现在一个组件,`ref`会影响`shallowRef`导致视图更新，因为`ref`调用了`triggerRef`导致强制更新，但`shallowRef`也可以使用`triggerRef`实现强制响应式更新。

### customRef

自行的实现Ref，在回调函数内需要手动处理`tract`追踪和`trigger`触发更新

```tsx
<script setup lang="ts">
import { customRef } from 'vue';
function myRef<T>(value:T){
  return customRef((track,trigger)=>{
    return {
      get() {
        track()
        return value
      },
      set(newVal:T){
        value = newVal
        trigger()
      }
    }
  })
}

const content3 = myRef(0)
const toggle = () =>{
  content3.value++
  console.log(content3)
}


</script>

<template>
  <div class="container">
    {{ content3 }}
  </div>
  <button @click="toggle">修改</button>
</template>
<style lang="css">
.container{
  width: 800px;
  height: 600px;
  margin: 0 auto;
  padding: 10px;
  border: 1px solid gray;
}
</style>
```

- 获取DOM可以使用`const dom = ref<HTMLDivElement>('')`

## Reactive全家桶

### reactive

- `ref`支持所有类型,`reactive`支持所有引用类型

- `ref`取值赋值都需要先访问`.value`，但`reactive`不需要

- `reactive`是通过`Proxy`实现的，不能直接赋值，这会破坏响应式对象，需要通过`reactiveObj.push(...args)`或添加一个对象,把数组作为一个属性传入。

```tsx
<script setup lang="ts">
import { reactive, type Reactive } from 'vue';

interface formType{
  name:string,
  age:number
}
let form:Reactive<formType> = reactive({
  name:'abc',
  age:18
})
let formList:Reactive<Array<formType>> = reactive([])

const pushFormList = () =>{
  console.log(form)
  formList.push(form)
  form = {
    name:'',
    age:18
  }

}

</script>

<template>
  <div class="container">
    <ul>
      <li v-for="el in formList">
        <strong>姓名:</strong>
        {{ el.name }}

        <strong>年龄:</strong>
        {{ el.age }}
      </li>
    </ul>
  </div>
  <input type="number" name="age" placeholder="年龄" v-model="form.age">
  <input type="text" name="name" id="nameid" placeholder="名称" v-model="form.name">
  <button @click.prevent="pushFormList"></button>
</template>
<style lang="css">
.container{
  width: 800px;
  height: 600px;
  margin: 0 auto;
  padding: 10px;
  border: 1px solid gray;
}
</style>
```

### readonly

使得`reactive`声明的引用类型只读。

### shallowReactive

和 `reactive()` 不同，这里没有深层级的转换：一个浅层响应式对象里只有根级别的属性是响应式的。属性的值会被原样存储和暴露，这也意味着值为 ref 的属性**不会**被自动解包了。

## to全家桶

### toRef

只能修改响应式对象的值，实现对`reactive`对象内的属性值精细化管理，而非响应式变量则不会改变。

```html
<script setup lang="ts">
import { reactive, toRef } from 'vue';

let commentData = reactive({
  commentText:"马嘉祺我们喜欢你",
  isLike:false
})


const isLikeRef = toRef(commentData,'isLike')
const toggleLike = () =>{
  if(isLikeRef.value === true){
    isLikeRef.value = false
  }else{
    isLikeRef.value = true
  }
}
</script>

<template>
  <strong>评论:</strong>
  {{ commentData.commentText }}
  <hr/>
  <strong>点赞:</strong>
  {{ isLikeRef ? "👍" : "👎" }}
  <button @click.prevent="toggleLike">Like</button>
</template>
<style lang="css">
.container{
  width: 800px;
  height: 600px;
  margin: 0 auto;
  padding: 10px;
  border: 1px solid gray;
}
</style>
```

### toRefs

将一个响应式对象转换为一个普通对象，这个普通对象的每个属性都是指向源对象相应属性的 ref。每个单独的 ref 都是使用 [`toRef()`](https://cn.vuejs.org/api/reactivity-utilities.html#toref) 创建的，特别适合对`reactive`创建的响应式对象。

## Computed计算属性

接受一个 [getter 函数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/get#description)，返回一个只读的响应式 [ref](https://cn.vuejs.org/api/reactivity-core.html#ref) 对象。该 ref 通过 `.value` 暴露 getter 函数的返回值。它也可以接受一个带有 `get` 和 `set` 函数的对象来创建一个可写的 ref 对象。

```html
<script setup lang="ts">

import {computed, reactive} from 'vue'

const nameObj = reactive({
  first:'',
  last:''
})

const fullName = computed({
  get(){
    return nameObj.first + ' - ' + nameObj.last
  },
  set(){

  }
})

</script>

<template>
  <strong>FirstName:</strong>
  <input type="text" name="firstname" id="first" v-model="nameObj.first">
  <hr/>
  <strong>LastName:</strong>
  <input type="text" name="lastname" id="last" v-model="nameObj.last">
  <hr/>
  <strong>FullName:</strong>
  {{ fullName }}


</template>
<style lang="css">
.container{
  width: 800px;
  height: 600px;
  margin: 0 auto;
  padding: 10px;
  border: 1px solid gray;
}
</style>
```

## Watch

```html
<script setup lang="ts">

import {computed, reactive, watch} from 'vue'

const nameObj = reactive({
  first:'',
  last:''
})

const fullName = computed({
  get(){
    return nameObj.first + ' - ' + nameObj.last
  },
  set(){

  }
})
watch(fullName,(newVal,oldVal)=>{
  console.log(newVal,oldVal)
})

</script>

<template>
  <strong>FirstName:</strong>
  <input type="text" name="firstname" id="first" v-model="nameObj.first">
  <hr/>
  <strong>LastName:</strong>
  <input type="text" name="lastname" id="last" v-model="nameObj.last">
  <hr/>
  <strong>FullName:</strong>
  {{ fullName }}


</template>
<style lang="css">
.container{
  width: 800px;
  height: 600px;
  margin: 0 auto;
  padding: 10px;
  border: 1px solid gray;
}
</style>
```

注: 

- `option`中设置`deep:true`开启深度监听

- `immediate:true`立即执行一次

- `flush:"pre"` 组件更新之前调用

- `flush:"sync"`同步执行

- `flush:"post"`组件更新后执行

## watchEffect

watchEffect 也是一个帧听器，是一个副作用函数。 它会监听引用数据类型的所有属性，不需要具体到某个属性，一旦运行就会立即监听，组件卸载的时候会停止监听。

```html
<script setup lang="ts">

import {computed, reactive, toRefs, watch, watchEffect} from 'vue'

const nameObj = reactive({
  first:'123',
  last:'456'
})

const fullName = computed({
  get(){
    return nameObj.first + ' - ' + nameObj.last
  },
  set(){

  }
})
watchEffect((onBefore)=>{
  console.log(nameObj.first,nameObj.last)
  onBefore(()=>{
    console.log("Clean Up")
  })
})

</script>

<template>
  <strong>FirstName:</strong>
  <input type="text" name="firstname" id="first" v-model="nameObj.first">
  <hr/>
  <strong>LastName:</strong>
  <input type="text" name="lastname" id="last" v-model="nameObj.last">
  <hr/>
  <strong>FullName:</strong>
  {{ fullName }}


</template>
<style lang="css">
.container{
  width: 800px;
  height: 600px;
  margin: 0 auto;
  padding: 10px;
  border: 1px solid gray;
}
</style>
```

## 组件

通过`import Component from './xx.vue'`实现引入

### 父子组件传参

通过`defineProps`定义子组件的`props`，通过`v-bind`传入参数。

子组件通过`props.attri` 获取父组件传递的参数

通过`withDefaults(defineProps({}),{})`实现传参的默认值设置

```html
<!-- 父组件-->
<script setup lang="ts">
import son from './son.vue'

const title = "示例文本"


</script>

<template>
  <son :title="title"/>

</template>
<style lang="css">
.container{
  width: 800px;
  height: 600px;
  margin: 0 auto;
  padding: 10px;
  border: 1px solid gray;
}
</style>
<!-- 子组件-->
<template>
 <p>Sub</p>
 <p>{{ props.title }}</p>
</template>

<script setup lang="ts">
import { ref,reactive } from 'vue';
const props<T> = defineProps({
    title:{
        type:String,
        default:"默认值"
    }
})

</script>
```

### 子组件传递父组件

通过`defineEmits`子组件传递父组件的方法，父组件通过`@onEmits`动作获取回调函数

```html

<!-- 父组件 -->

<script setup lang="ts">
import { ref } from 'vue';
import son from './son.vue'

const title = "示例文本"

let callName = ref('')
const getName = (name:string) =>{
  callName.value = name
}

</script>

<template>
  <son :title="title" @on-click="getName"/>
  {{ callName }}
</template>
<style lang="css">
.container{
  width: 800px;
  height: 600px;
  margin: 0 auto;
  padding: 10px;
  border: 1px solid gray;
}
</style>




```

## 生命周期

- `onBeforeMount`:在组件**挂载开始之前**被调用，访问组件的响应式数据、方法等

- `onMounted`:组件**挂载完成后**立即调用
  
  * **访问和操作 DOM**：例如获取元素尺寸、绑定第三方库、手动操作 DOM 属性。
  
  * **发起异步请求**：通常在此钩子中调用接口获取数据，然后更新响应式状态。
  
  * **添加事件监听**：如 `window` 的滚动、resize 事件。
  
  * **使用 `ref`**：此时通过模板 `ref` 注册的 DOM 元素或子组件实例已经可用。

- `onUpdated`:在组件**因为响应式状态变更而导致的 DOM 更新完成之后**调用。
  
  * **可以**：执行依赖于更新后 DOM 的操作，例如获取更新后的元素尺寸。
  
  * **尽量避免**：在此钩子中**修改响应式状态**，因为这可能引发无限更新循环（除非你精确控制条件）。
  
  * **替代方案**：如果需要侦听特定数据的变化并执行副作用，通常使用 `watch` 或 `watchEffect` 更合适，它们能更细粒度地控制触发时机。

- `onBeforeUnmounted`:在组件**卸载之前**立即调用
  
  * **清理副作用**：清除定时器、取消网络请求、移除手动添加的事件监听（如 `window.removeEventListener`）、清理第三方库实例等。
  
  * **保存临时状态**：如果需要在卸载前保存一些数据到外部（如 `localStorage`），可以在此进行。

- `onUnmounted`:在组件**卸载完成后**调用。
  
  * **最后的清理**：可以执行一些与组件实例无关的清理，但通常 `onBeforeUnmount` 已经足够。有时用于调试或统计。
  
  * **注意**：此时组件实例已被销毁，无法访问实例上的数据和方法。

## BEM命名法

- `Block`:命名空间

- `Element`:DOM元素

- `Modifier`:修饰器

## Scss

### 嵌套规则

```scss
#main p {
  color: #00ff00;
  width: 97%;

  .redbox {
    background-color: #ff0000;
    color: #000000;
  }
}
```

### 变量定义

```scss
#main {
  $width: 5em !global;
  width: $width;
}

#sidebar {
  width: $width;
}
```

### 插值语句

```scss
@mixin firefox-message($selector) {
  body.firefox #{$selector}:before {
    content: "Hi, Firefox users!";
  }
}
@include firefox-message(".header");
```
