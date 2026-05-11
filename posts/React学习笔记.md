---
title: React学习笔记
categories: 
- frontend
tags: 
- react
- hooks
- components
- state-management
index_img: /images/React.webp
banner_img: /images/React.webp
abbrlink: 303649792
date: 2025-02-06 15:59:34
keywords: react,frontend,web
description: 'React框架学习笔记，涵盖组件、Hooks和状态管理等核心概念'
---



# 1.React介绍

**React** 是一个用于构建用户界面的JavaScript库，它允许开发者以声明式的方式创建交互丰富的Web应用。React不是一个完整的框架，而是专注于构建组件化的UI层。它可以与其他库或框架（如Redux或Angular）配合使用，以构建复杂的应用程序。



# 2.React创建环境（以Vite为例）

在Node环境下输入

```npmignore
npm create vite@latest my-vite-app 
```

按要求选择React+JavaScript配置

**文件目录**

| 文件名           | 用途              |
| ------------- | --------------- |
| package.json  | 核心包，包含核心依赖和关键命令 |
| .src          | 存放项目的源代码。       |
| .src/index.js | 项目入口文件          |
| .src/App.js   | 项目根组件           |

./src/main.jsx

```jsx
// ./src/main.jsx项目入口 从这里开始运行

//React项目核心导入
import { createRoot } from 'react-dom/client'
//导入项目根组件
import App from './App.jsx'
//把App根组件渲染到id为'root'的节点
createRoot(document.getElementById('root')).render(  
    <App />
)


```

./src/App.jsx

```jsx
//项目的根组件
// App -> index.js -> index.html(root)
function App() {
  return (
    <>
      <div>
        This is an App. 
      </div>

    </>
  )
}

export default App


```

# 3.JSX基础

## JSX理论

**概念：** **JSX**是*JavaScript*和*XML*的缩写，表示**JS代码中编写HTML模板结构**，是React中编写UI模板的方法。

**本质：** **JSX**本质是对JS的语法扩展，需要借助*Babel*编译转化成正常的JS。

## JSX语法

### JSX使用JS表达式

使用`{}`传递表达式

**1.传递字符串**

**2.传递JavaScript变量/对象/函数/方法**

```jsx
function App() {
  return (
    <>
      <div>
        This is an App. 
        {'This is a message'}
        {/* 传字符串 */}
        {count}
        {/* 传JavaScript变量 */}
        {getName()}
        {/* 传函数调用 */}
        {new Date().getDate()}
        {/* 传方法调用 */}
        <div style={{color:"red"}}>
          {/* 传js对象 */}
          This is a red div.
        </div>
      </div>

    </>
  )
}
```

**注意：if、Switch、变量声明属于语句而非表达式，因此不能出现在`{}`中。**

### JSX实现列表渲染

**语法：** 在JSX中可以使用原生JS中的*map方法*渲染遍历列表

**`{targetList.map(item=> <dom key={item.key}> </dom>)}`**

```jsx
const list =[{id:101,name:'Vue'},
  {id:102,name:'React'},
  {id:103,name:'Angular'},

]
function App() {
  return (
    <>
        <div>
          <ul>
            {list.map(item => <li key={item.id}>{item.name}</li>)}
          </ul>
        </div>

    </>
  )
}
```

**注意：对应的DOM标签上必须绑定一个独一无二的key值，可以是字符串或number，常用id绑定**

### JSX中实现条件渲染

**语法：** 逻辑运算符 **`&&`** 或三元表达式 **`?:`** 实现条件渲染。

**`{flag && <DOM></DOM>}`**

**`{flag ? <DOM>A</DOM> : <DOM>B</DOM>}`**

```jsx
const isLogin = false
function App() {
  return (
    <>
        <div>
          {isLogin && <span>This is a span.</span>}
          {isLogin ? <span>Welcome</span>:<span>Loading...</span>}
        </div>
    </>
  )
}

export default App


```

**对于复杂情况，可构造核心函数，根据不同类型返回不同的JSX模板**

```jsx
const articleType = 3
function getArticleTem(){
  if (articleType === 0){
    return <div>No image</div>}
    else if(articleType === 1){
      return <div>Single image</div>
    } else{
      return <div>Triple Image</div>
    }
}


{getArticleTem()}
```

# 4.React事件与组件

## React事件

### React基础事件绑定

**语法:** ***`<DOM onEvent={function()}></DOM>`***

例如

```jsx

const handleClick = () =>{
  console.log("button被点击了")

}

function App(){

    <>
        <div>
          <button type="button" onClick={handleClick}>Click Me</button>
        </div>
    </>

}
```

### 使用事件对象参数

**语法:** 在事件回调函数中设置形参 **`e`**

注意在DOM中的格式  `<DOM action={(e) => function(Args,e)}> </DOM> `

其中,事件对象`e` 是可选项。

```jsx

const handleClick = (name,e) =>{
  console.log("button被点击了")

}

function App(){

    <>
        <div>
          <button type="button" onClick={(e) => handleClick('jack'),e}>Click Me</button>
        </div>
    </>

}
```

## React组件

### React组件使用

**概念:** 一个组件就是用户界面的一部分,可以有自己的逻辑和外观,组件之间可以互相嵌套和多次复用。

在React中，一个组件就是一个首字母大写的函数，内部存放了组件的逻辑和视图UI，渲染组件时，以标签的形式书写即可。

**创建组件的方法：**

1.定义组件

```jsx
const Button = () => {
    return <button>Click Me</button>
}
```

2.使用组件

```jsx
function App(){
    return(
    <Button></Button>
)
}
```

### useState基础

useState是一个React Hook,允许我们向组件中添加一个**状态变量**,从而控制影响组件的渲染结果

本质:和普通JS变量不同,状态变量一旦发生变化,组件的视图UI也会发生变化。**（数据驱动视图）**

语法:**`const [Variable,setVariableFunction] = useState(initialValue)`**

1. **useState**是一个函数，返回值是一个数组

2. 数组中的第一个参数是状态变量，第二个参数是set函数，用来修改状态变量

3. useState的参数将作为count的初始量
   
   

**注意:** 1. 需要引用`import { useState } from "react"` 

```jsx

function App() {
  const [count,setCount] = useState(0)
  const handleClick = () =>{
    setCount(count + 1)
  } 
    <button onClick={handleClick}>{count}</button>


}
```

2. **状态不可变**
   在React中,状态被认为是只读的,因此始终要使用匹配的`setVariableFunction()` 来替换原状态变量，直接的修改状态并不能引发视图更新。

3. **修改对象状态**
   对于对象类型的状态变量，应该始终要使用匹配的`setVariableFunction()` 来替换原状态对象。

```jsx
function App(){
    const [form,setForm] = useState({name:'jack'})
    const changeForm = () =>{
    setForm({
      ...form,
      name:'john'
    })
    return(
      <button type="button" onClick={changeForm}>{form.name}</button>

)
}
```

*注:*

**扩展运算符（Spread Operator）:"..."**

* 用于数组或对象的展开。例如，在数组中：
  JavaScript复制
     let arr1 = [1, 2, 3];
     let arr2 = [0, ...arr1, 4];
  这里“...arr1”将arr1数组中的元素1、2、3展开，最终arr2的值为[0, 1, 2, 3, 4]。它能够将一个数组的元素逐个添加到另一个数组中。

* 对于对象，可以用于复制对象的属性。例如：
  JavaScript复制
     let obj1 = {a: 1, b: 2};
     let obj2 = {...obj1, c: 3};
  “...obj1”将obj1对象的属性a和b复制到obj2中，obj2的结构为{a: 1, b: 2, c: 3}。它能够将一个对象的可枚举属性复制到另一个对象中。

### 组件样式控制

1. 行内样式
   `<DOM style={color:'red'}></DOM>`
   
   ```jsx
   //index.css
   .foo{
       color:"red";
       fontSize:"50px"
   }
   //App.jsx
   import './index.css'
   function App(){
       return(
       <div>
           <span classname='foo'></span>
       </div>
   )
   }
   ```
   
   2. class类名控制
      **语法:** `<DOM className=""></DOM>`
      
      

*注:* 

1. 写行内样式时,CSS属性名要使用驼峰命名法.

2. 需在App.js下引用对应的CSS文件.

**classname优化类名控制**

1. 安装
   
   ```npmignore
   npm install classnames
   ```

2. 引用

```jsx
const classNames = require('classnames')
//ES6
import classNames from 'classnames'
//import
```

3. 使用
   语法:`classNames('objclassName1','2...',{conditionalClassName:Condition})`

```jsx
<span 
{key=item.type}
className={classNames('nav-item',{active:type === item.type})}
```



### 受控表单绑定

**概念:** 使用React组件的状态(useState)控制表单的状态,即双向绑定

[![pEkBICq.png](https://s21.ax1x.com/2025/01/19/pEkBICq.png)](https://imgse.com/i/pEkBICq)

**步骤:**

```jsx
const [value,setValue] = useState('')
// 1.准备一个React状态值
<input 
type="text"
value={value}
// 2.通过value属性绑定React状态变量
onChange={(e) => setValue(e.target.value)}
// 3.绑定onChange事件 通过参数e拿到输入框的值 反向修改到React状态中
/>
```

### React中获取DOM

**概念:** 在React组件中**获取/操作** DOM,需要使用**useRef** 钩子函数,分为两步:

1. 使用useRef创建Ref对象,并与JSX绑定
   
   ```jsx
   const inputRef = useRef(null)
   <input type="text" ref={inputRef} />
   ```

2. 在DOM可用时(组件渲染完毕),通过`inputRef.current`获取DOM对象
   
   ```jsx
   console.log(inputRef.current)
   ```

## React组件通信

### 理解组件通信

**概念:** 组件通信就是*组件之间的数据传递*,根据组件嵌套关系的不同,有着不同的通信方法.

#### 父传子-基础实现

**实现步骤:** 

1. 父组件传递数据,在子组件标签上绑定属性

2. 子组件接收数据,子组件通过**props参数** 接收数据

```jsx
const name = 'This is app name.'
  function Son(props){
    // props:对象里面包含了父组件传递过来的所有数据
    // eslint-disable-next-line react/prop-types

    return <div>this is son {props.name}</div>
  }
{/* 父传子通信 */}
        <div>
          <Son name={name}></Son>
        </div>


```

#### 父传子-props

1. props可传递任意的数据
   数字、字符串、布尔值、数组、对象、函数、JSX

2. props是**只读对象** 
   子组件**只能读取props中的数据**,不能直接进行修改,父组件的数据只能由父组件修改

#### 父传子-props children

场景:当我们把内容嵌套在子组件中时,父组件会自动在名为prop.children属性中接收内容

```jsx
function Son(props){
    // props:对象里面包含了父组件传递过来的所有数据
    console.log(props)
    // eslint-disable-next-line react/prop-types
    return <div>this is son {props.children}</div>

  }



```

#### 父子组件通信-子传父

核心思路:在子组件中调用父组件中的函数并传递数据

```jsx
function Son({onGetMsg}){
  const sonMsg = "This is son msg."
  return (
    <div>
      {/* 在子组件中调用父组件的形参 */}
      <button onClick={()=>onGetMsg(sonMsg)}>send</button>
    </div>
  )
}

function App() {
  const getMsg = (msg) => console.log(msg)

  return (
    <>
      <Son onGetMsg={getMsg}></Son>
    </>
  )
}
```

#### 使用状态提升实现兄弟组件通信

**实现思路:** 借助*状态提升* 机制,通过父组件进行兄弟组件之间的数据传递

1. A组件先通过子传父的方式把数据传给父组件App

2. App拿到数据后通过父传子的方式传递给B组件

```jsx
function A({ onGetAname }){
  // {onGetAname}是组件A的参数解构,意味着函数接受同名函数作为props在组件内调用
  const name = 'This is A name'
  return(
    <div>
      This is A component
      <button onClick={() => onGetAname(name)}>Send</button>
    </div>

  )
}
function B({name}){
  return(
    <div>
      This is B component.
      {name}
    </div>

  )
}
function App() {
  const [name,setName] = useState('')
  const getAname = (name) =>{
    console.log(name)
    setName(name)
  }
 return(
  <div>
    This is app.
    <A onGetAname={getAname}/>
    <B name={name}/>
  </div>

 )
}
```

#### 使用Context机制跨层级组件通信

**实现步骤:** 

1. 使用**createContext**方法创建上下文对象Ctx

2. 在顶层组件(App)中通过**Ctx.Provider**组件提供数据

3. 在底层组件中通过**useContext**钩子函数获取数据

```jsx
// 1.创建上下文对象
const MsgContext = createContext()

function A(){

  return(
    <div>
      This is A component
      <B/>
    </div>

  )
}
function B(){
  // 3.使用useContext钩子函数获取数据
  const msg = useContext(MsgContext)
  return(
    <div>
      This is B component.
      {msg}
    </div>

  )
}
function App() {
 const msg = "This is app msg."
 return(
  <div>
    {/* 2. 在顶层创建Ctx.Provider组件 */}
    <MsgContext.Provider value={msg}>
    <A/>
    </MsgContext.Provider>
    This is app.

  </div>

 )
}
```

### useEffect

#### useEffect的使用

useEffect是一个React Hook函数,用于在React组件中创建*不是由于事件引起*而是**渲染本身引起的操作** ,例如*发送AJAX请求,更改DOM*

**需求:** 在组件渲染完毕后,立刻从服务器获取频道数据并显示到页面上

**语法:**

`useEffect(() = {Function()},[Array])`

参数1为**副作用函数** ,在函数内放置要执行的操作

参数2为数组(*可选*),数组内的依赖项会影响第一个参数函数的执行,若为空,**副作用函数只会在组件渲染完毕后执行一次**

```jsx
const URL = "http://geek.itheima.net/v1_0/channels"
function App() {
  const [list,setList] = useState([])
 useEffect(()=>{
//  获取频道列表
 async function getList(){
  const res = await fetch(URL)
  const jsonRes = await res.json()
  console.log(jsonRes)
  setList(jsonRes.data.channels)
 }
 getList()
 },[])
 return(
  <div>
    <ul>
      {list.map(item => <li key={item.id}>{item.name} </li>)}
    </ul>

  </div>
 )
}

```

#### useEffect依赖项参数

| 依赖项     | 副作用函数执行时机         |
| ------- | ----------------- |
| 没有依赖项   | 组件初始渲染+组件更新时执行    |
| 空数组依赖   | 只在初始渲染时执行一次       |
| 添加特定依赖项 | 组件初始渲染+特性依赖项变化时执行 |

```jsx

import { useEffect, useState } from "react"

function App() {
  // 无依赖项 初始+组件更新
  const [count,setCount] = useState(0)
  useEffect(()=>{
    console.log('副作用函数执行了')
  })

  // 空数组依赖 仅在初始时执行一次
  useEffect(()=>{
    console.log('空数组依赖')
  },[])
  // 传入特定依赖项 初始 + 依赖项变化时执行
  useEffect(()=>{
    console.log('含依赖项')
  },[count])
 return(
  <div>

    <button onClick={()=> setCount(count+1)}>{count}</button>
  </div>
 )
}
```

#### useEffect-清除副作用

在useEffect中编写的副作用操作,想在组件卸载时再清理掉,该过程即为**清理副作用**

**语法:** 

```jsx
useEffect(() =>{
    //实现副作用的操作
    return () => {
      //清除副作用逻辑
}

},[])
```

示例

```jsx
function Son(){
  useEffect(()=>{
    const timer = setInterval(()=>{
      console.log('定时器执行中')
    },1000)

    return ()=>{
      // 清除副作用
      clearInterval(timer)
    }
  })
  return <div>This is son</div>
}
function App() {
  const [show,setShow] = useState(true)
 return(
  <div>
    {show && <Son/>}
    <button onClick={()=>setShow(false)}>卸载Son组件</button>
  </div>
 )
}

```

### 其他useHooks函数

#### useReducer

**作用：** 和useState类似，用于管理相对复杂的状态数据，对于需要复杂操作的状态变量，该函数比`useState`更具优势。

**语法：**

reducer函数：`reducer(state,action)`

管理状态变量：`switch(action.type){case:...}`

调起useHooks方法 注册状态变量：`const [state,dispatch] = useReducer(reducer,defaultValue)`

使用dispatch方法操作状态变量：`dispatch({type:'ACTION'})`

###### useReducer-基础用法

1. 定义一个reducer函数（*根据不同的action返回不同的状态*）

2. 在组件中调用useReducer，并传入reducer函数和状态的初始值

3. 事件发生时，通过dispatch函数分派一个action对象（通知reducer要返回哪个新状态并渲染UI）

```jsx

// 1.定义reducer函数，根据不同的action返回不同的状态
 function reducer(state,action){
  switch(action.type){
    case 'INC':
      return state + 1
    case 'DEC':
      return state - 1
    default:
      return state
  }

}
function App() {

  // 2.组件中调用useReducer(reducer,0) =>[state,dispatch]
  const [state,dispatch] = useReducer(reducer,0)
  // 3.调用dispa tch({type:'INC'}) =>通知reducer产生新的状态来更新UI

  return (
    <>

      <div className="card">

        <button onClick={()=>{dispatch({ type:'INC' })}}>
          count is {state}
        </button>
        <button onClick={()=>{dispatch({ type:'DEC' })}}>
          count is {state}
        </button>

      </div>
    </>
  )
}
```

##### useReducer-分派action时传参

在`dispatch({...,payload:value})`中传参时，需要在`reducer`函数中使用`action.payload`接收

```jsx
function reducer(state,action){
  switch(action.type){
    case 'SET':
      return action.payload
    default:
      return state
  }
// ...
        <button onClick={()=>{dispatch({ type:'SET',payload:100 })}}>
          Update count to 100
        </button>
```

[![pE8R458.png](https://s21.ax1x.com/2025/03/01/pE8R458.png)](https://imgse.com/i/pE8R458)

#### useMemo

**作用：** 在组件每次重新渲染时**缓存计算的结果**，由此保证只有列表内的依赖项（即需要改变的状态变量）改变时再重新计算，从而避免不必要的组件重复渲染

**语法：** `useMemo(()=>{},[state])`

**备注：** 消耗非常大的计算



#### useCallback

**作用：** 在组件多次重新渲染的时候*缓存函数*

**语法：** `const changeHandler = useCallback((value) => console.log(),[])`

**作用：** 使用useCallback包裹函数后，函数可以保证在app*重新渲染时保持稳定*



### 自定义Hook函数

#### 自定义Hook

**概念:** 自定义Hook是以*use* 打头的函数,通过自定义Hook函数可以实现逻辑的封装和复用

**思路:**

1. 声明一个以use打头的函数

2. 在函数体内封装可复用的逻辑

3. 把组件中用到的状态或者回调return出去

4. 在哪个组件中要用到这个逻辑,就执行这个函数,解构出状态和相应的回调

```jsx
import { useState } from "react"

function useToggle(){
  const [value,setValue] = useState(true)
  const toggle = () => setValue(!value)
  // 哪些状态和回调函数需要就在其他组件中使用return
  return{
    value,toggle
  }
}

function App() {
  const {value,toggle} = useToggle()
 return(
  <div>
    {value && <div>This is div</div>}
    <button onClick={toggle}>toggle</button>
  </div>
 )
}


```

#### React Hooks函数使用规则

1. 只能在组件中或者其他自定义Hook函数中调用

2. 只能在组件的顶层调用,不能嵌套在if/for/其他函数等
   
   

## React方法

### React.memo

#### React.memo-基本用法

**背景：** React默认渲染机制，只要父组件重新渲染，子组件就会重新渲染

**作用：** 经过memo函数包裹生产的缓存组件会在**Props没有改变**的情况下跳过渲染

**语法：** `const MemoComponet = memo(function SomeComponent (props){...})`

#### React.memo-props的比较机制

**机制：** React会对每一个prop使用`Object.is`比较新值和老值，返回true表示无变化

- props是简单类型
  `Object.is(3,3)=>true`
  没变化

- props是引用类型（数组/对象）
  `Object.is([],[])=>false`
  有变化，当父组件的函数重新执行时，实际上形成的新的数组引用

为了保证引用稳定，可以使用useMemo组件渲染过程中缓存一个值



### React.forwardRef

#### React.fowardRef基本用法

```jsx

const Input = forwardRef((props,ref) => {
  return (
    <input type="text" ref={ref} />
  )
})



function App() {

  // 2.组件中调用useReducer(reducer,0) =>[state,dispatch]

  // 3.调用dispatch({type:'INC'}) =>通知reducer产生新的状态来更新UI
  const inputRef = useRef(null)
  const showRef = () =>{
    console.log(inputRef)  
  }
  return (
    <>

      <div className="card">
        <Input ref={inputRef} />
        <button onClick={showRef}>获取ref</button>
      </div>
    </>
  )
}
```



#### React.useInperativeHandle

**作用：** 在子组件内部实现对ref方法的暴露，以便于调用

**语法：** 

```jsx
const Input = forwardRef((props,ref)=>
{
    const inputref = useRef(null)
    const focusHandler = () =>{
    inputRef.current.focus()
}

useImperativeHandle(ref,() =>{
    return {
    focusHandler
}
} )
}
return <input type="text" ref={inputRef} />

})
```





# 5.Redux

## Redux上手

### Redux快速体验

Redux 是 JavaScript 应用的状态容器，提供可预测的状态管理。

[![pEAsEzq.png](https://s21.ax1x.com/2025/01/22/pEAsEzq.png)](https://imgse.com/i/pEAsEzq)



**使用步骤:**

1. 定义一个*reducer函数*(根据当前想要做的修改返回一个新的状态)

2. 使用createStore方法传入*reducer函数* 生成一个*reducer实例*

3. 使用*store实例*的**subscribe方法** 订阅数据的变化(数据一旦变化,可以得到通知)

4. 使用*store实例*的**dispatch方法提交action对象** 触发数据变化(告诉*reducer* 你如何修改数据)

5. 使用store实例的**getState方法** 获取最新的状态数据更新到视图中

### Redux与React配套

#### 配套工具:

1.Redux Tookit

2.react-redux

```npmignore

npm install react-redux

npm install redux-toolkit
```

**store目录**

1. 通常集中状态管理部分单独创建一个`store`目录

2. 应用通常会有很多个子store模块,所以会创建一个`modules`目录,在文件夹内编写业务分类的子store

3. store中的入口文件`index.js`的作用是组合modules中的所有子模块,并导出store
   
   

### Redux+React =>实现counter

#### 整体路径

[![pEEuD1I.png](https://s21.ax1x.com/2025/01/24/pEEuD1I.png)](https://imgse.com/i/pEEuD1I)

#### 创建Redux的store对象

```jsx
// ./modules/counterStore.js
import {createSlice} from '@reduxjs/toolkit'

const counterStore = createSlice({
    name:'counter',
    // 初始状态数据
    initialState:{
        count:0
    },
    // 修改数据同步的方法
    reducers:{
        increment(state){
            state.count++
        },
        decrement(state){
            state.count--
        },
    },

})
// 解构创建action对象的函数
const {increment,decrement} = counterStore.actions
// 获取reducer函数
const counterReducer = counterStore.reducer
// 导出action对象的函数和reducer函数
export{increment,decrement}
export default counterReducer
```

```jsx
// index.js
import { configureStore } from "@reduxjs/toolkit";
import counterReducer  from "./modules/counterStore";

const store = configureStore({
    reducer:{
        counter:counterReducer
    }
})

export default store
```



#### 为React注入store

react-redux负责把Redux和React链接起来,内置的Provider组件通过store参数把创建好的store实例注入到应用程序中,链接正式建立

```jsx

import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import store from './store/index.js'
import {Provider} from 'react-redux'
createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
    ,
)

```

#### React组件中使用store中的数据

在React组件中使用`store`中的数据,需要用到一个钩子函数`useSelector(state => state.Variable)`

**作用:** 将store中的数据映射到组件中

```jsx
//App.jsx
import { useSelector } from "react-redux"
function App() {
  const {count} = useSelector(state => state.counter)

  return (
    <>
      <div className="App">
        {count}
      </div>
    </>
  )
}

export default App

```

*注意:* 该例子中App.jsx中的counter实际定义在store中的入口,即`index.js`

#### React组件中修改store的数据

React组件中修改store中的数据需要借助`useDispatch()`的hook函数

**作用:** 生成提交*action对象*的函数

### Redux+React - 提交action传参

#### 提交action传参实现需求

在reduers的同步修改方法中添加action对象参数,在调用`actionCreater`时传递参数,参数会被传递到`action`对象的`payload`属性上.

### Redux+React - 异步状态管理

#### 异步操作样板写法

1. 创建store的写法保持不变,配置好同步修改状态的方法

2. 单独封装一个函数,在函数内return一个新函数,在新函数中
   2.1 封装异步请求获取数据
   2.2 调用**同步actionCreater** 传入异步数据生成action对象,使用dispatch提交

3. 组件中`dispatch`的写法不变

```jsx
//chaannelStore.js
import { createSlice } from "@reduxjs/toolkit";
import axios from 'axios'
const channelStore =  createSlice({
    name:'channel',
    initialState:{
        channelList:[]
    },
    reducers:{
        setChannels(state,action){
            state.channelList = action.payload
        }
    }
})

// 异步请求
const {setChannels} = channelStore.actions
const fetchChannelList = () =>{
    return async (dispatch)=>{
        const res = await axios.get('http://geek.itheima.net/v1_0/channels')
        dispatch(setChannels(res.data.data.channels))
    }
}

export {fetchChannelList,setChannels}
const channelReducer = channelStore.reducer
export default channelReducer
```



```js
//index.js
import { configureStore } from "@reduxjs/toolkit";
import counterReducer  from "./modules/counterStore";
import channelReducer from "./modules/channelStore";
const store = configureStore({
    reducer:{
        counter:counterReducer,
        channel:channelReducer,
    }
})

export default store
```

```js
//App.jsx
import { useDispatch, useSelector } from "react-redux"
import { decrement, increment,addToNum} from "./store/modules/counterStore"
import { useEffect } from "react"
import { fetchChannelList } from "./store/modules/channelStore"
function App() {
  const {count} = useSelector(state => state.counter)
  const {channelList} = useSelector(state => state.channel)
  const dispatch = useDispatch()
  // 使用useEffect触发异步
  useEffect(()=>{
    dispatch(fetchChannelList())
  },[dispatch])
  return (
    <>
      <div className="App">
        <button onClick={()=>dispatch(decrement())}>-</button>
        {count}
        <button onClick={()=>dispatch(increment())}>+</button>
        <button onClick={()=>dispatch(addToNum(20))}>+20</button>
        <ul>
          {channelList.map(item=> <li key={item.id}>{item.name}</li>)}
        </ul>
      </div>
    </>
  )
}
```

# 6.ReactRouter

## ReactRouter应用

### 快速开始

**前端路由**:一个path对应一个组件component,当我们在浏览器中访问一个path时,path对应的组件会在页面中进行渲染

#### 创建路由开发环境

```powershell
npm create vite@latest
...
npm i react-router-dom
...
npm run dev
```

#### 基本实现

```jsx
// 调包
import {createBrowserRouter ,RouterProvider } from 'react-router-dom'

// 1.创建Router实例对象,配置路由对应关系
const router = createBrowserRouter([
  {
    path:'/login',
    element:<div>我是登录</div>
  },
  {
    path:'/article',
    element:<div>我是文章页</div>
  }
])
// 2.在渲染DOM中通过RouterProvider组件的router属性传入router对象
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}>

    </RouterProvider>
  </StrictMode>,
)


```

### 抽象路由模块

**在实际工程项目中的配置:**

[![ReactRouter配置](https://s21.ax1x.com/2025/02/05/pEelZ6J.png)](https://imgse.com/i/pEelZ6J)

```jsx

// ./router/index.js

import Login from "../page/login";
import Article from "../page/article";

import {createBrowserRouter} from 'react-router-dom'

const router = createBrowserRouter([{
    path:'/login',
    element:<Login/>,
},
{
    path:'/article',
    element:<Article/>,
}
])

export default router


```

**注意:** 

在router注册组件时,**组件名一定要首字母大写!!!**

### 路由导航跳转

**概念:** 路由系统中的多个路由之间需要进行*路由跳转*,并且在跳转的同时有可能需要传递参数进行通信.

#### 声明式导航

在模板中通过`<Link to=""/>`组件描述要跳转的路由.

其中,`to=''`属性指定要跳转的路由path,也可使用模板字符串拼接.

#### 命令式导航

在模板中通过`useNavigate()`的hooks函数绑定在需要的DOM事件上.

```jsx
// ./page/login/index.jsx


import {Link,useNavigate} from 'react-router-dom'
const Login = ()=>{
    const navigate = useNavigate()
    return (
        <div>
        {/* 声明式写法 调用Link组件 编译为超链接 */}
        <Link to="/article"> 跳转到文章页</Link>
        {/* 命令式写法 调用useNavigate的hooks函数 绑定在DOM的事件上 */}
        <button onClick={() => navigate('/article')}>跳转到文章页</button>
        </div>

    )
}
export default Login


```

### 路由导航传参

#### searchParams传参

**格式:**`/router?id=111&name=222`

取参函数:`useSearchParams()`

```jsx
// login.jsx
<button onClick={() => navigate('/article?id=1001&name=jack')}>searchParams传参</button>

//article.jsx
const [params] = useSearchParams()
    const id = params.get('id')
    const name = params.get('name')
```

#### Params传参

**格式:**`/router/:id/:name`

取参函数:`useParams()`

```jsx

// ./router/index.jsx

const router = createBrowserRouter([
{
    path:'/article/:id/:name',
    element:<Article/>,
}
])

//login.jsx

<button onClick={() => navigate('/article/1001/jack')}>Params传参</button>


//article.jsx
const params = useParams()
const id = params.id
const name = params.name
    return <div>我是文章{id}-{name}</div>
}



```

**注意:** 使用Params传参时,需要预先在路由文件下指定好匹配的对象名

### 嵌套路由

#### 什么是嵌套路由

在一级路由中嵌套其他路由,这种关系叫做嵌套路由.嵌套至一级路由内的路由称作二级路由

#### 嵌套路由配置

**实现步骤**

1. 使用`children`属性

2. 使用`<Outlet/>` 组件渲染二级路由渲染位置

```jsx

// ./router/index.jsx
// react路由组件注册


const router = createBrowserRouter([{
    path:'/login',
    element:<Login/>,
},
{
    path:'/article/:id',
    element:<Article/>,
},{
    path:'/',
    element:<Layout />,
    children:[
        {
            path:'board',
            element:<Board/>
        },
        {
            path:'about',
            element:<About />
        }
    ]
}
])

// ./page/Layout/index.jsx

import { Link, Outlet } from "react-router-dom"

const Layout = () =>{
    return(
        <div>
            瓦塔西一级路由Layout组件
            <Link to="/board">面板1</Link>
            <Link to="/about">关于</Link>
            {/*  二级路由出口     */}
            <Outlet/>
        </div>
    )
}
export default Layout
```



### 默认二级路由

#### 配置方式

在二级路由的位置去掉`path`,设置`index`属性为`true`

```jsx
// ./router/index.jsx


const router = createBrowserRouter([{
    path:'/login',
    element:<Login/>,
},
{
    path:'/article/:id',
    element:<Article/>,
},{
    path:'/',
    element:<Layout />,
    children:[
        // 设置为默认二级路由
        {
            index: true,
            element:<Board/>
        },
        {
            path:'about',
            element:<About />
        }
    ]
}
])
```



### 404路由

场景:找不到对应path时,提示404页面

**实现步骤:** 

1. 准备NotFound组件

2. 在路由表尾注册`*`为path的路由

形如:

`{

    path:'*',

    element:<NotFound/>

}`

### 两种路由模式

主流框架常见的路由方式有两种,**history模式和hash模式**.

在React中分别由`createBrowerRoute`和`createHsahRouter`函数负责创建

| 路由模式    | url表现       | 底层原理                  | 是否需要后端支持 |
| ------- | ----------- | --------------------- | -------- |
| history | url/login   | history对象+pushState事件 | 需要       |
| hash    | url/#/login | 监听hashChange事件        | 不需要      |

# 7.项目实战-记账本

## 项目初始化

### 项目依赖安装

```npmignore
npm create vite@latest
...
npm i react-router-dom dayjs classnames antd-mobile axios
```

### git提交

```git
git init
// 仓库初始化
git add .
// 仓库更新
git commit -m ""
// 仓库提交 -m后跟提交内容的备注
```

### Vite实现配置别名路径

```js
import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve:{
    alias:{
      // eslint-disable-next-line no-undef
      '@': path.resolve(__dirname,'src'),
    },
  },
})

```

### VS Code配置别名路径高亮

```json
// ./jsconfig.json
{
    "compilerOptions": {
      "target": "ES6",
      "jsx": "react",
      // 基础目录作为项目根目录, 这应该指向包含 `src` 目录的路径
      "baseUrl": "./",
      "paths": {
        // @ 作为 src目录别名
        "@/*": ["src/*"], // VS Code 将 `@` 解析为 `src` 目录

      }
    },
    "exclude": ["node_modules", "dist"], // "...其他要排除的目录"
    "include": ["src/**/*"]
  }

```



### 数据Mock

数据Mock是指通过模拟真实数据来测试系统功能，确保系统在无真实数据或无法获取真实数据时仍能正常运行。Mock数据通常用于开发、测试和演示，帮助开发者在早期阶段验证逻辑和接口。

#### 在前端开发中常见的数据Mock种类

1. **静态Mock数据**：
   
   * 预先定义好的固定数据，通常存储在JSON、XML或CSV文件中。
   
   * 适用于简单的测试场景。

2. **动态Mock数据**：
   
   * 在运行时生成的数据，模拟真实数据的动态变化。
   
   * 适用于复杂场景，如模拟用户行为或实时数据流。

3. **接口Mock**：
   
   * 模拟API接口的响应，用于测试API调用。
   
   * 适用于前后端分离开发或第三方API不可用时的测试。

#### 在前端开发中常见的Mock工具

1. **静态Mock数据工具**：
   
   * **JSON Server**：基于JSON文件的REST API模拟工具，可以快速搭建一个本地的Mock服务器。
   
   * **Faker.js**：生成虚假数据的JavaScript库，可以生成各种类型的虚假数据，如姓名、地址、电话号码等。

2. **动态Mock数据工具**：
   
   * **Mock.js**：生成随机数据的JavaScript库，支持生成各种类型的随机数据，并且可以定义数据模板。
   
   * **Faker**（Python）：生成虚假数据的Python库，适用于需要在Python环境中生成Mock数据的场景。

3. **接口Mock工具**：
   
   * **Postman Mock Server**：Postman提供的API模拟服务，可以快速创建Mock服务器并定义API响应。
   
   * **WireMock**：用于HTTP API的模拟工具，支持Java，适用于需要在Java环境中进行API Mock的场景。

#### 配置json-server

1. **在项目中安装json-server**
   
   ```npmignore
   npm i -D json-server
   ```

2. 准备json文件

3. 添加启动命令

4. 访问接口并调试

### 整体路由设计

[![pEnJsw4.png](https://s21.ax1x.com/2025/02/10/pEnJsw4.png)](https://imgse.com/i/pEnJsw4)

1. 2个一级路由(Layout/New)

2. 2个二级路由(Layout-month/year)

```jsx
// @/router/index.jsx
// 创建路由实例

import Layout from '@/pages/Layout/index'
import Month from '@/pages/Month/index'
import New from '@/pages/New/index'
import Year from '@/pages/Year/index'
import {createBrowserRouter} from 'react-router-dom'

const router = createBrowserRouter([{
    path:'/',
    element:<Layout/>,
    children:[
        {
            path:'month',
            element:<Month/>
        },
        {
            path:'year',
            element:<Year/>
        }
    ]
},{
    path:'/new',
    element:<New/>
}
])

export default router


```

### antD-mobile主题定制

**定制方案:**

1. 全局定制

2. 局部定制
   
   ```jsx
   <div className="purple-theme">
       <Button color="primary">局部测试</Button>
   </div>
   <Button color="primary">测试</Button>
   ```
   
   

# Zustand

## Zustand快速上手

### 创建store

**语法：** `const useStore = create((set)=>{return{...})`

### 创建状态方法：

**语法：**`action:()=>{set((state)=>({count:state.count + 1}))}`

**注意：**

1. 函数参数必须返回一个对象 对象内部编写状态数据和方法

2. set是用来修改数据的专门方法，必须调用它来修改数据
   语法1：参数是函数 需要使用老数据 需要用箭头函数的块内操作
   `set((state)=>({count:state.count + 1}))`
   语法2：参数直接是一个对象
   `set({count:100})`

### zustand-异步支持

对于异步的支持不需要特殊的操作,直接在函数中编写异步逻辑,最后调用set方法传入新状态即可,记得解构并在主函数中使用useEffect调起该异步方法



### zustand-切片模式

当单个store较大时,可以采用**切片模式**组合各个模块

```jsx

const createCounterStore = (set) => {
  return {
    // 状态数据
    count: 0,
    // 修改状态数据的方法
    inc: () => {
      set((state) => ({ count: state.count + 1 }))
    },
  }
}

const createChannelStore = (set) => {
  return {
    channelList: [],
    fetchGetList: async () => {
      const res = await fetch(URL)
      const jsonRes = await res.json()
      console.log(jsonRes)
      set({
        channelList: jsonRes.data.channels
      })
    }
  }
}

const useStore = create((...a) => {
  return {
    ...createCounterStore(...a),
    ...createChannelStore(...a)
  }
})


function App () {
  // 2. 组件使用
  const { count, inc, fetchGetList, channelList } = useStore()
  useEffect(() => {
    fetchGetList()
  }, [fetchGetList])
  return (
    <>
      <button onClick={inc}>{count}</button>
      <ul>
        {
          channelList.map(item => <li key={item.id}>{item.name}</li>)
        }
      </ul>
    </>
  )
}

```



```jsx


import {create} from 'zustand'
import './App.css'
// 创建store
const useStore = create((set)=>{
  return {
    count:0,
    inc:() =>{
      set((state)=>({
        count: state.count + 1
      }))
    }
  }
})



function App() {

  const {count,inc} = useStore()
  return (
    <>
     This is app.
    <button onClick={inc}>{count}</button>
    </>
  )
}
```



# React+TS

## 创建项目

### 使用Vite创建TS的React项目

```bash
npm create vite@latest my-vue-app -- --template react-ts
npm install
npm run dev
```

## useState与TS

### useState-自动推导

通常React会根据传入的useState的默认值来自动推导类型，并不需要显式标注类型

```tsx

const [value,toogle] = useState(false)

const changeValue = () =>{
    toogle(true)
  }
```



### useState- 传递泛型参数

useState本身是一个泛型函数，可以传入具体的自定义类型。

> **关于泛型的含义：** [TypeScript 泛型](https://typescript.p6p.net/typescript-tutorial/generics.html)
> 
> [TypeScript 泛型 | 菜鸟教程](https://www.runoob.com/typescript/ts-generics.html)
> 
> **简单来说：** 泛型（Generics）是一种编程语言特性，允许在定义函数、类、接口等时使用占位符来表示类型，而不是具体的类型。
> 
> **泛型函数:**
> 
> ```tsx
> function identity<T>(arg: T): T {
>     return arg;
> }
> 
> // 使用泛型函数
> let result = identity<string>("Hello");
> console.log(result); // 输出: Hello
> 
> let numberResult = identity<number>(42);
> console.log(numberResult); // 输出: 42
> ```
> 
> **泛型接口:**
> 
> ```tsx
> // 基本语法
> interface Pair<T, U> {
>     first: T;
>     second: U;
> }
> 
> // 使用泛型接口
> let pair: Pair<string, number> = { first: "hello", second: 42 };
> console.log(pair); // 输出: { first: 'hello', second: 42 }
> ```
> 
> **泛型类:**
> 
> ```tsx
> // 基本语法
> class Box<T> {
>     private value: T;
> 
>     constructor(value: T) {
>         this.value = value;
>     }
> 
>     getValue(): T {
>         return this.value;
>     }
> }
> 
> // 使用泛型类
> let stringBox = new Box<string>("TypeScript");
> console.log(stringBox.getValue()); // 输出: TypeScript
> ```



**说明:**

1. 限制useState函数参数的初始值类型必须满足`User | () => User`

2. 限制setUser函数的参数必须满足类型为`User | () => User | undefined`

3. User状态数据必须具备User类型相关的类型提示

4. 若不知道状态变量的初始值，可设置为null

```tsx

type User = {
    name:String
    age:number
  }

  const [user,setUser] = useState<User>(
    {
      name:'Jack',
      age:12
    }
  )
  const [users,setUsers] = useState<User| null>(null)


```



## props与TypeScript

### props - 基础使用

为组件prop添加类型，本质上是个函数的参数做**类型注解**，可以使用**type**对象类型或者**interface**接口来做注解

> **关于interface接口：**
> 
> [TypeScript 接口 | 菜鸟教程](https://www.runoob.com/typescript/ts-interface.html)
> 
> [TypeScript 的 interface 接口 ](https://typescript.p6p.net/typescript-tutorial/interface.html)
> 
> interface 是对象的模板，可以看作是一种类型约定，中文译为“接口”。使用了某个模板的对象，就拥有了指定的类型结构。
> 
> ```ts
> interface Person {
>   firstName: string;
>   lastName: string;
>   age: number;
> }
> ```
> 
> **关于type类型：**
> 
> [TypeScript 的类型系统](https://typescript.p6p.net/typescript-tutorial/types.html)
> 
> `type`命令用来定义一个类型的别名。别名可以让类型的名字变得更有意义，也能增加代码的可读性，还可以使复杂类型用起来更方便，便于以后修改变量的类型。
> 
> ```ts
> type Age = number;
> let age: Age = 55;
> ```
> 
>  主要区别如下：
> 
> ---
> 
> ### 1. **声明合并（Declaration Merging）**
> 
> - **`interface`**：支持声明合并。同一个名称的多个 `interface` 会自动合并。
>   
>   ```ts
>   interface User { name: string; }
>   interface User { age: number; }
>   // 合并为 { name: string; age: number; }
>   ```
> 
> - **`type`**：不支持声明合并。同名 `type` 会报错。
>   
>   ```ts
>   type User = { name: string; };  
>   type User = { age: number; }; // Error: Duplicate identifier 'User'.
>   ```
> 
> ---
> 
> ### 2. **扩展方式**
> 
> - **`interface`**：用 `extends` 继承其他接口或对象类型。
>   
>   ```ts
>   interface A { x: number; }
>   interface B extends A { y: string; }
>   ```
> 
> - **`type`**：用 `&` 交叉类型扩展。
>   
>   ```ts
>   type A = { x: number; };
>   type B = A & { y: string; };
>   ```
> 
> ---
> 
> ### 3. **灵活性**
> 
> - **`interface`**：只能定义对象类型（包括函数、类等）。
>   
>   ```ts
>   interface User { name: string; }
>   interface Func { (x: number): void; }
>   ```
> 
> - **`type`**：可以定义任意类型，包括原始类型、联合类型、元组等。
>   
>   ```ts
>   type Name = string; // 原始类型
>   type Value = string | number; // 联合类型
>   type Point = [number, number]; // 元组
>   ```
> 
> ---
> 
> ### 4. **性能与工具提示**
> 
> - **工具提示（IntelliSense）**：  
>   `interface` 在 VS Code 等工具中的提示更清晰（显示为 `interface`），而 `type` 会直接展开具体类型。
> - **性能**：  
>   对于复杂类型，`interface` 的检查可能略快（但实际差异很小）。
> 
> ---
> 
> ### 5. **类实现（`implements`）**
> 
> - **`interface`**：可以被类直接 `implements`。
>   
>   ```ts
>   interface IUser { name: string; }
>   class User implements IUser { name: string; }
>   ```
> 
> - **`type`**：如果 `type` 是对象类型，类也可以实现它。
>   
>   ```ts
>   type TUser = { name: string; };
>   class User implements TUser { name: string; }
>   ```
> 
> ---
> 
> ### 何时用哪个？
> 
> - **用 `interface`**：  
>   - 需要声明合并（如扩展第三方库类型）。  
>   - 定义对象类型且需要清晰的工具提示。  
>   - 面向对象的类结构（`implements`）。
> - **用 `type`**：  
>   - 需要联合类型、元组、映射类型等高级功能。  
>   - 定义非对象类型（如 `type Status = "open" | "closed"`）。
> 
> ---
> 
> ### 总结
> 
> 两者功能高度重叠，但 `interface` 更适合对象类型的扩展，而 `type` 更灵活。大型项目推荐优先用 `interface`，需要复杂类型时再用 `type`。



**注意：** 对于children这种比较特殊的prop,若需要传入多种不同的数据类型，可以通过内置的`React.ReactNode`类型注解

```tsx
function App() {
  type Props = {
    className :string
    children: React.ReactNode
  }

function Button(props:Props)
{
  const {className,children} =  props
  return <button className={className}>{children}</button>
}

  return (
    <>
      This is an app.
      <Button className="Test">Click Me</Button>
    </>
  )
}

```

### props - 组件props注解

组件经常执行类型为函数的prop实现父传子，这类prop重点在于函数参数类型的注解

一般绑定事件时，事件函数的命名规范是 **"on"+驼峰命名法**

在调用组件时，将触发事件绑定到组件的props上时，可以选择内联或函数的方式绑定，若单独定义函数，须对单独匹配参数类型。

**注意：**

1. 在组件内部调用时需要遵守类型约束，参数传递需要满足要求

2. 绑定prop时如果绑定内联函数，可以直接推断出数据类型，否则需要单独注解匹配参数类型。

```tsx
type Props = {
  className?:string
  children?: React.ReactNode
  onGetMsg?: (msg:string)=>void
}

function Button(props:Props)
{
  const {className,children} =  props
  return <button className={className}>{children}</button>
}

function Son(props:Props){
  const {onGetMsg} = props
  const clickHandler = () =>{
    onGetMsg?.('This is a msg')
  }
  return <button onClick={clickHandler}>Click Me</button>

}
function App() {
  const getMsgHandler = (msg:string) =>{
    console.log(msg)
  }

  return (
    <>
      This is an app.
      <Button className="Test">Click Me</Button>
      <Son onGetMsg={getMsgHandler} />
    </>
  )
}

```



## useRef与TypeScript

### useRef - 获取DOM

获取dom的场景，可以直接把要获取的dom元素的类型当成泛型参数传递给useRef,可以推导出.current属性的类型

```tsx
function App() {

  const domRef = useRef<HTMLInputElement>(null)

  useEffect(()=>{
    // 可选链 前面值不为空(null/ undefined)执行链式调用
    domRef.current?.focus()
  },[])

  return (
    <>
      This is an app.
      <input ref={domRef}>Input</input>
    </>
  )
}
```

### useRef - 引用稳定的储存器

把useRef当成引用稳定的储存器使用的场景，可以通过泛型传入联合类型来做。



# React理论和设计思想

## Babel & SWC

### 使用babel编译JS JSX代码

Babel 是一个 JavaScript 编译器,提供了JavaScript的编译过程，能够将源代码转换为目标代码。

对于ES6+的新特性，可通过corejs引入的方式实现向下兼容

AST -> Transform -> Generate

```js
// test.js
//语法
const a = (params = 2) => 1 + params;
const b = [1, 2, 3]
const c = [...b, 4, 5]
class Babel {

}
new Babel()
//API
const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((x) => x % 2 === 0)
const y = Object.assign({}, { name: 1 })

// index.js
// 记得设置package.json的type为module
import Babel from '@babel/core'
import presetEnv from '@babel/preset-env'
import fs from 'node:fs'
const file = fs.readFileSync('./test.js', 'utf8')
const result = Babel.transform(file, {
    presets: [presetEnv]
})
console.log(result.code)

```

### 使用swc编译JS JSX

SWC 既可用于编译，也可用于打包。对于编译，它使用现代 JavaScript 功能获取 JavaScript / TypeScript 文件并输出所有主流浏览器支持的有效代码。

**`SWC在单线程上比 Babel 快 20 倍，在四核上快 70 倍。`**

简单点来说swc实现了和babel一样的功能，但是它比babel快。

*唉唉，编程原神`rust`发力了*

```js
// index.js
import swc from '@swc/core'

const result = swc.transformFileSync('./test.js', {
   jsc: {
       target: "es5", //代码转换es5
       parser: {
           syntax: 'ecmascript'
       }
   }
})
console.log(result.code)
```

**swc转JSX**

```js
import swc from '@swc/core'
console.time()
const result = swc.transformFileSync('./test.jsx', {
    jsc: {
        target: "es5", //代码转换es5
        parser: {
            syntax: 'ecmascript',
            jsx: true
        },
        transform:{
            react: {
                runtime: 'automatic'
            }
        }
    }
})
console.log(result.code)
console.timeEnd()
```

## VDOM (虚拟DOM)

Virtual DOM 就是用JavaScript对象去描述一个DOM结构，虚拟DOM不是直接操作浏览器的真实DOM，而是首先对 UI 的更新在虚拟 DOM 中进行，再将变更高效地同步到真实 DOM 中。
