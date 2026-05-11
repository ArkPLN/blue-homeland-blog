---
title: Leetcode Hot100刷题记
tags:
  - data-structures
  - algorithms
  - computer-science
  - cs
categories:
  - cs
abbrlink: 626095156
description: 力扣Hot100刷题记录，沉淀学习算法思想和编码能力。
date: 2026-01-28 10:05:56
index_img: /images/coding.webp
banner_img: /images/coding.webp
---

# Leetcode Hot100刷题记

## JavaScript基础

--待开荒--

## Hot100

### 哈希

#### 1. 两数之和

https://leetcode.cn/problems/two-sum?envType=study-plan-v2&envId=top-100-liked

**思考:**

最简单的想法是直接暴力遍历，结合题干来看，时间复杂度会做到`O(n^2)`，即最多时要遍历n(n-1)次。

为了压低时间复杂度，可以考虑用Map(哈希表)以空间换时间。（想到哈希表的原因是如果可以把数列进行排序，两数之和就可以相当简单的，根据sums和当前遍历的nums[i]的大小比较确认区间，从而快速地的缩小排查范围，但由于题目要求锁死了数组的item和index一一对应的关系，所以要考虑用其他的数据类型来拓展，哈希表则满足这个需要）

除此之外，本体的Map处理还可以继续优化，考虑到可能出现的相同数字的`key`覆盖原有的哈希表的键值对的情况，可以采取“先has看有没有，有就直接掉，没有再set”的策略，可以把遍历次数压到一次以内。

```js

/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    let arrayMap = new Map()
    let res = []
    nums.forEach((item,index)=>{
        arrayMap.set(item,index)
    })
    for (let i=0;i<nums.length;i++){
        res.push(i)
        let remain = target - nums[i]

   // 两个条件:存在数字,且这个数字不与当前选中的nums[i]相同
        if(arrayMap.has(remain) && arrayMap.get(remain) != i){
            res.push(arrayMap.get(remain))
            break
        }
        res = []

    }
    return res
};
```

```js
// 一次遍历的哈希表解法
var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
// 如果哈希对照存在就直接获取值
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
// 每次遍历都更新哈希表,恰好避开两次选取相同位置数字的情况
        map.set(nums[i], i);
    }
    return [];
};
```

#### 49. 字母异位词分组

https://leetcode.cn/problems/group-anagrams?envType=study-plan-v2&envId=top-100-liked

**思考:**

这道题要处理的问题主要是提取出每个字母的“共同之处”作为key，value则为对应同属一种“类型”的数组，返回结果要把这些value数组给拼起来。

最初的设想是将每个字符串`str[i]`的每个字符统计进一个`Map`，再以这个`Map`作为key去归类。

但JavaScript中的Map(**引用类型**)是按值引用的**地址比较**，故，即便两个Map的内容可能完全一致，但由于每次创建Map对象时分配的*地址*不一样，所以怎么找也找不到相同的`key`，因此无论如何也不能将`Map`对象作为键去查找`Map`。

此时转而考虑使用基本类型（字符串）作为Map的键，但要保证每一个字符串都最终可以**化归**成一个大家都一致的“标志”，想到了可以对字符串进行“排序”，每个符合相同异位词格式的字符串，排序处理之后都最后必然满足“同种异位词”的格式，比如`abc`和`bac`最后都可以排序变成`abc`。由此发现了可以作为`Map`的键的参数。对每个`strs[i]`遍历，使之排序后纳入`Map`哈希表中，最后返回这个Map对象的`values()`。

特别注意，`Map.values()`返回的是一个迭代器而非数组，需要通过`Array.from`、展开运算符`...`或`for of`方法自行迭代一下才能得到结果。

```js
/*
 * @lc app=leetcode.cn id=49 lang=javascript
 *
 * [49] 字母异位词分组
 */

// @lc code=start
/**
 * @param {string[]} strs
 * @return {string[][]}
 */
var groupAnagrams = function(strs) {
    let wordsMap = new Map()
    strs.forEach((item)=>{
        const sortedWord = item.split('').sort().join('')
        if(wordsMap.has(sortedWord)){
            const newArr = wordsMap.get(sortedWord)
            newArr.push(item)
            wordsMap.set(sortedWord,newArr)
        }else{
            wordsMap.set(sortedWord,[item])
        }
    })
    return [...wordsMap.values()]
};
// @lc code=end


```



#### 128.最长连续序列

https://leetcode.cn/problems/longest-consecutive-sequence?envType=study-plan-v2&envId=top-100-liked

**思考:**

核心还是找关系，连续序列要考虑**两个子问题**：

1. 如何判断开始元素

2. 如何确保该序列连续

要解答这个问题，必须回答好两个子问题。对于开始元素来说，假设它是一个连续序列的一部分，那么这个元素的`item-1`必然不能存在于这个连续序列，如果存在则说明这个元素并非最小的那个开始元素。

第二个问题是，要确保这个序列连续，那么从开始的第一个元素到这个连续序列的最后一个元素，总是应该满足`arr[-1]-arr[0] = arr.length-1`的条件。毕竟是一个个加1的，开始元素加了多少，最后一定也连续的“跳”了多少步。

综上这两个点，应该考虑使用`Set()`对象先对`nums`做去重的处理，然后依次遍历去重后的`numsSet`，判断`Set`中的每一个元素是否满足`item-1`不存在于`numsSet`的条件，满足这个条件说明它一定是一个存在的连续序列的那个开始元素，随后以这个开始元素为基准，递增直到这个虚构的连续序列的元素在去重后的`numsSet`不存在，说明：`item`存在一个以它自身为开始元素，一直有一个直到`item + x`为止的连续序列，取这个数组的长度，与1一直比较，最后得出那个最大值。

关于JavaScript内置对象的`Set()`有必要后续加以补充......

```js
/*
 * @lc app=leetcode.cn id=128 lang=javascript
 *
 * [128] 最长连续序列
 */

// @lc code=start
/**
 * @param {number[]} nums
 * @return {number}
 */
var longestConsecutive = function(nums) {
    let numsSet = new Set(nums)
    let startArray = []
    let max = 1
    numsSet.forEach((item)=>{
        // 1.连续序列的起始位置
        if(!numsSet.has(item-1)){
            startArray.push(item)
        }
    })
    for(const i of startArray){
        // 对每个可能的起始位置产生的连续序列的探测
        let flag = true
        let acc = i
        let time = 1
        while(flag){
            if(numsSet.has(acc)){
                acc += 1
                time += 1
                continue
            }else{
                flag = false
                break
            }
        }
        max = Math.max(max,time)
    }

    return max-1

};
// @lc code=end

```

```js
var longestConsecutive = function(nums) {
    const st = new Set(nums); // 把 nums 转成哈希集合
    let ans = 0;
    for (const x of t) { // 遍历哈希集合
        if (st.has(x - 1)) { // 如果 x 不是序列的起点，直接跳过
            continue;
        }
        // x 是序列的起点
        let y = x + 1;
        while (st.has(y)) { // 不断查找下一个数是否在哈希集合中
            y++;
        }
        // 循环结束后，y-1 是最后一个在哈希集合中的数
        ans = Math.max(ans, y - x); // 从 x 到 y-1 一共 y-x 个数，代表长度
    }
    return ans;
};


```

### 双指针

#### 283. 移动零

https://leetcode.cn/problems/move-zeroes?envType=study-plan-v2&envId=top-100-liked

**思考:** 利用双指针来缓存遍历的情况，每当遇到一个非0的数字，就让它和上一个数字交换位置，直到所有非0的数字都被“推”到前面，最后末尾只剩下了0。

*注意:* 不返回新对象，对原对象的修改不能使用`map`,`concat`等方法。

```js

/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var moveZeroes = function(nums) {

    i0 = 0
    for (let i=0;i<nums.length;i++){
        if(nums[i]!==0){
            [nums[i],nums[i0]]=[nums[i0],nums[i]]
            i0 += 1
        }
    }
}
```

#### 11. 承最多水的容器

https://leetcode.cn/problems/container-with-most-water?envType=study-plan-v2&envId=top-100-liked

**思考：**

双指针，左右代表水桶两端，桶的最大高度取决于两个水桶的长度中较短的一方，容积=长x宽，宽度即`right-left`。

为了确保水桶两端都尽可能的长，可以相互比较，如果右端长于左端，左端向右移动；如果左端更长，那么较短的右端就向左走。

**疑问:**  为什么移动的总是短端？

想象两个人在一条线上，分别从两端向中间走。每次都是较矮的那个人向前走一步，因为：

* 如果让较高的人向前走，容器的高度上限不会增加（因为容器的有效高度总是受较矮者的限制），但宽度减少，面积必然减小。
* 只有让较矮的人向前走，才有可能遇到更高的人，从而提升容器的高度上限。

这个策略保证了我们不会错过任何可能提升面积的机会，符合双指针的算法目标 **淘汰那些确定不可能成为最优解的情况**

```js
/*
 * @lc app=leetcode.cn id=11 lang=javascript
 *
 * [11] 盛最多水的容器
 */

// @lc code=start
/**
 * @param {number[]} height
 * @return {number}
 */
var maxArea = function(height) {
    let n = height.length
    let left = 0
    let right = n - 1
    const getArea = (left,right)=>{
        return Math.min(height[left],height[right]) * (right-left)
    }
    let curArea = getArea(left,right)
    while(left<right){
        curArea = Math.max(curArea,getArea(left,right))
        if(height[left] < height[right]){
        // 较短的左侧向右
            left++
        }else{
         // 较短的右侧向左
            right--
        }
    }
    return curArea

};
// @lc code=end


```

#### 15. 三数之和

https://leetcode.cn/problems/3sum?envType=study-plan-v2&envId=top-100-liked

**思考:** 第一反应是暴力破解，但问题也是非常显然的，暴力破解ijk的三层遍历会把时间复杂度拉到`O(n^3)`的程度。所以要思考其他方案。

联想到之前做的两数之和，想到可以先确认一个数字`nums[i]`作为第一个数字，剩下的两个数字在`nums`里面找，剩下的两个数字-应该满足相关的约束条件，使得最终三个数字相加得到0。

最初的设想是参考两数之和，构建`numsMap`，遍历后两个数字时判断这个搭配是否重复出现，从而避免结果重复的情况。但数组在JavaScript中是按引用的比较方法，这就意味着即便`[1,0,-1]`和`[-1,0,1]`在数组的形式上是一致的，但由于地址不同，不能使用`in`和`Array.prototype.includes()`方法。

尝试使用lodash的严格比较方法`!_.some(res, item => _.isEqual(item, part))`发现会导致运行结果超时，此时时间复杂度来到了更加夸张的`O(n^4)`，因为深度递归比较会占用大量的时间，因此仍需进一步优化。

为了进一步压缩时间，尝试使用双指针的方法来扫描数组`nums`从`i+1`到`n-1`的组合，此处要考虑使用其他方法来跳过可能的重复,尽可能的避免任何可能触发深度遍历比较的方法。

- 对数组按照相对大小进行排序（注意：不能对包含0和负数的数组直接使用`sort` 方法排序，因为这啥子方法是把数列中的元素转换成**字符串**比较，这会导致-1<-2<0的奇观，需要使用`sort((a, b) => a - b)`）

- 对i来说，如果`nums[i]`和`nums[i-1]`是一回事(当然应该确保`i>0`)，直接跳过

- 对双指针的`left`和`right`说，如果`nums[left]`和`nums[left-1]`相等，说明左指针要向右移动直到出现不一样的；右指针同理。

考虑完毕上述点之后，得到一个优化的双指针做法，此时可以A出来。

```js
/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function (nums) {
    const n = nums.length
    const snums = nums.sort((a, b) => a - b)
    let res = []
    for(let i=0;i<n-2;i++){
        if(i > 0 && snums[i] === snums[i-1]) continue
        let first = snums[i]
        let left = i+1
        let right = n-1
        while(left<right){
            const sum = first + snums[left] + snums[right]
            if(sum === 0){
                // 找到解，直接添加（数组已有序）
                res.push([first, snums[left], snums[right]])
                // 移动左右指针，并跳过重复值
                left++
                right--
                // 跳过重复的 left
                while(left < right && snums[left] === snums[left-1]){
                    left++
                }
                // 跳过重复的 right
                while(left < right && snums[right] === snums[right+1]){
                    right--
                }
            }else if(sum < 0){
                left++
            }else{
                right--
            }
        }
    }
    return res
};
```

#### 42.接雨水

https://leetcode.cn/problems/trapping-rain-water?envType=study-plan-v2&envId=top-100-liked

**思考:** 

尝试拆分列，纵向比对不易发现规律，转而注意每一个单独的列的雨水高度，再逐个累加得到总的雨水量。

首先，如果按照列来计算的话，宽度一定是1了，我们再把每一列的雨水的高度求出来就可以了。

可以看出每一列雨水的高度，取决于，该列**左侧最高的柱子**和**右侧最高的柱子**中最矮的那个柱子的高度。

`water = Math.min(leftH,rightH) - height[i]`

一样的方法，只要从头遍历一遍所有的列，然后求出每一列雨水的体积，相加之后就是总雨水的体积了。这里可以使用双指针。

```js
/**
 * @param {number[]} height
 * @return {number}
 */
var trap = function(height) {
    let sum = 0
    let n = height.length
    for(let i =0;i<n;i++){
        let right = i + 1
        let left = i - 1
        if(i==0 || i== n-1){
            continue
        }
        let leftH = height[i]
        let rightH = height[i]
        for(left;left>=0;left--){
            if(height[left]>leftH){
                leftH = height[left]
            }
        }
        for(right;right<n;right++){
            if(height[right]>rightH){
                rightH = height[right]
            }
        }
        let water = Math.min(leftH,rightH) - height[i]
        if(water > 0){
            sum += water
        }
    }
    return sum
};
```

但是发现这种解法会超时，思考其他的解决方案。

在暴力解法中，我们可以看到只要记录左边柱子的最高高度 和 右边柱子的最高高度，就可以计算当前位置的雨水面积，这就是通过列来计算。

当前列雨水面积：min(左边柱子的最高高度，记录右边柱子的最高高度) - 当前柱子高度。

为了得到两边的最高高度，使用了双指针来遍历，每到一个柱子都向两边遍历一遍，这其实是有重复计算的。我们把每一个位置的左边最高高度记录在一个数组上（maxLeft），右边最高高度记录在一个数组上（maxRight），这样就避免了重复计算。

当前位置，左边的最高高度是前一个位置的左边最高高度和本高度的最大值。

得到优化后的解放，A出答案。

```js

/**
 * @param {number[]} height
 * @return {number}
 */
var trap = function(height) {
    let n = height.length
    let leftHeight = new Array(n).fill(0)
    let rightHeight = new Array(n).fill(0)

    leftHeight[0] = height[0]
    for(let i=1;i<n;i++){
        leftHeight[i] = Math.max(leftHeight[i-1],height[i])
    }
    rightHeight[n-1] = height[n-1]
    for(let i=n-2;i>=0;i--){
        rightHeight[i] = Math.max(rightHeight[i+1],height[i])
    }
    let sum = 0
    for(let i=0;i<n;i++){
        let water = Math.min(leftHeight[i],rightHeight[i]) - height[i]
        if(water>0){
            sum += water
        }
    }
    return sum
};
```

### 滑动窗口

#### 3. 无重复字符的最长子串

https://leetcode.cn/problems/longest-substring-without-repeating-characters?envType=study-plan-v2&envId=top-100-liked

**思考：** 要体现无重复的题意，说明在动态的框选子字符串的时候，应该确保每当扫到一个新的字符的时候，应该确保这个新扫入的字符既不能出现两次，同时要更新起始段，考虑使用滑动窗口来解决问题。

为了统计每个字符，使用`Map`来储存字符和出现次数。

```js

/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
    let ans = 0
    let left = 0
    let charMap = new Map()
    for(let right = 0;right<s.length;right++){
        let char = s[right]
        //  更新每个字符串的出现次数
        if(charMap.has(char)){
            charMap.set(char,charMap.get(char)+1)
        }else{
            charMap.set(char,1)
        }
        //  如果新的字符串有重复,就更新滑动窗口
        while(charMap.get(char)>1){
            charMap.set(s[left],charMap.get(s[left])-1)
            left++
        }
        ans = Math.max(right-left+1,ans)
    }
    return ans

};
```



#### 438.找到字符串中所有字母异位词

https://leetcode.cn/problems/find-all-anagrams-in-a-string?envType=study-plan-v2&envId=top-100-liked

**思考:** 首先想到的是异位词，参考49题，但这道题中的条件不允许使用排序后字符串作为键，因为对字符串的排序的时间复杂度太高：

* 假设 `s` 长度 `n`，`p` 长度 `m`
* 你大约需要检查 `n-m+1` 个窗口
* 每个窗口：获取子串 O(m) + 拆分为数组 O(m) + 排序 O(m log m) + 合并 O(m)
* 总复杂度 ≈ **O(n × m log m)**，在最大数据规模下可能达到 10^8 量级操作

转而考虑用其他方式来统计异位词，联想到可以使用频率数组，使用26个长度的的数组来记录一个字符串包含的全部字符频率。将字符映射到数组的方法是`String.prototype.charCodeAt()`,这个方法会返回传入字符的在`utf-16`内对应的码元(数字索引)，用相对值减去便可以得到其在数组内的索引，例如`char.charCodeAt(0)-'a'.charCodeAt(0)`。

首先扫描一遍p字符串，得到其频率数组`pArr`。

问题的关键在于滑动窗口的确认，数组已经定长，不便于直接用数字再记录当前滑动窗口的长度，可以先遍历前p个的字符串长度的s串，判断是否符合要求，然后再从`s[p.length]`开始遍历剩余部分，每遍历一次，代表right向右移动一格，添加进`sArr`的频率数组，与此同时，就把维护的`sArr`中的第`left`号元素自减，表示滑动窗口的左侧移出一位，然后检查新的窗口`JSON.stringify(sArr)`是否与参考的频率数值`pArr`一致，如果一致，说明`right - p.length + 1`号索引是符合要求的索引。

```js
/**
 * @param {string} s
 * @param {string} p
 * @return {number[]}
 */
// 超时原因是split('').sort().join('')的方法占据了大量的时间,直接用异位词的方法做不合适
var findAnagrams = function(s, p) {
    const sp = p.split('').sort().join('')
    let left = 0
    let res = []
    for(let right = 0;right<s.length;right++){
        let window = s.slice(left,right+1)
        if(window.length<p.length){
            continue
        }
        if(window.length===p.length){
            // 每个窗口都要比较浪费了大量的时间`
            if(window.split('').sort().join('')===sp){
                res.push(left)
                left++
            }else{
                left++
            }
        }
    }
    return res
};
```

```js
/**
 * @param {string} s
 * @param {string} p
 * @return {number[]}
 */
var findAnagrams = function(s, p) {
    if (s.length < p.length) return [];

    let pArr = new Array(26).fill(0);
    for (let i = 0; i < p.length; i++) {
        let charI = p.charCodeAt(i) - 97;
        pArr[charI]++;
    }

    let left = 0;
    let res = [];
    let wArr = new Array(26).fill(0);

    // 先初始化第一个窗口
    for (let i = 0; i < p.length; i++) {
        let charI = s.charCodeAt(i) - 97;
        wArr[charI]++;
    }

    // 检查第一个窗口
    if (JSON.stringify(wArr) === JSON.stringify(pArr)) {
        res.push(0);
    }

    // 滑动窗口
    for (let right = p.length; right < s.length; right++) {
        // 移除离开窗口的字符
        let leftCharI = s.charCodeAt(right - p.length) - 97;
        wArr[leftCharI]--;

        // 添加进入窗口的字符
        let rightCharI = s.charCodeAt(right) - 97;
        wArr[rightCharI]++;

        // 检查当前窗口
        if (JSON.stringify(wArr) === JSON.stringify(pArr)) {
            res.push(right - p.length + 1);
        }
    }

    return res;
};
```

#### 560. 和为K的子数组

https://leetcode.cn/problems/subarray-sum-equals-k?envType=study-plan-v2&envId=top-100-liked

本题要使用前缀和来解决，应该先做303 https://leetcode.cn/problems/range-sum-query-immutable

> **前缀和:** 比如 nums=[1,2,3,4,5,6]，要想计算子数组 [3,4,5] 的元素和，可以用前缀 [1,2,3,4,5] 的元素和，减去另一个前缀 [1,2] 的元素和，就得到了子数组 [3,4,5] 的元素和，即
> 
> 3+4+5=(1+2+3+4+5)−(1+2)
> 换句话说，把前缀 [1,2,3,4,5] 的前缀 [1,2] 去掉，就得到了子数组 [3,4,5]。
> 
> 一般地，任意子数组都是一个前缀去掉前缀后的结果。所以任意子数组的和，都可以表示为两个前缀和的差。
> 
> nums 的子数组有 O(n^2) 个，但只有 O(n) 个前缀。那么，预处理 nums 的所有前缀和，就可以 O(1) 计算任意子数组的元素和。
> 
> 通过前缀和，我们可以把子数组的元素和转化成两个前缀和的差，下标区间 [left,right] 的元素和等于前缀 [0,right] 的元素和减去另一个前缀 [0,left−1] 的元素和，即`s[right+1]−s[left]`。

该问题可以转化为前缀和，即查找`nums`中是否存在`i,k`满足`s[j]-s[i]=k`，为了便于使用Map加速查找，可以转化为`s[i]=s[j]−k`。

1. 问题转化
* 子数组 `nums[i...j]` 的和 = `prefix[j] - prefix[i-1]`

* 我们要找 `prefix[j] - prefix[i-1] = k`

* 即：`prefix[j] - k = prefix[i-1]`
2. 哈希表的作用
* 遍历时，当前位置的前缀和是 `prefix[j]`

* 我们需要知道之前有多少个位置的前缀和等于 `prefix[j] - k`

* 哈希表 `prefixMap` 记录：`{前缀和值: 出现次数}`
3. 为什么要初始化 `prefixMap.set(0,1)`？

考虑这种情况：从数组开头到当前位置的和正好等于 k。  
这时 `s - k = 0`，我们需要知道前缀和为 0 的情况（即空数组），所以初始化为 1。

```js

var subarraySum = function(nums, k) {
    const prefixMap = new Map()      // 1. 哈希表：记录每个前缀和出现的次数
    prefixMap.set(0,1)               // 2. 初始化：前缀和为0出现了1次（空数组）
    let sum = 0                      // 3. 记录满足条件的子数组总数
    let s = 0                        // 4. 当前的前缀和

    for(const i of nums){            // 5. 遍历数组
        s += i                       // 6. 更新前缀和：加上当前元素
        sum += (prefixMap.get(s-k) ?? 0)  // 7. 关键：查找 s-k 是否存在
        prefixMap.set(s,(prefixMap.get(s) ?? 0) + 1)  // 8. 更新当前前缀和的计数
    }
    return sum                       // 9. 返回结果
};
```

### 数组

#### 53. 最大子数组和

https://leetcode.cn/problems/maximum-subarray?envType=study-plan-v2&envId=top-100-liked

**思考:** 使用动态规划，维护数组`dp`，根据题意可知，第i位的最大和的连续子数组的和总是`Math.max(dp[i-1]+nums[i],nums[i])`

，得到了状态转移方程，注意同步维护最大值`max`，因为我们最终要返回的结果`dp[nums.length-1]`可能并非是这个数组的最大值。

```js

/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
    let dp = new Array(nums.length).fill(0)
    dp[0] = nums[0]
    let max = dp[0]
    for(let i=1;i<nums.length;i++){
        dp[i] = Math.max(dp[i-1]+nums[i],nums[i])
        max = Math.max(max,dp[i])
    }
    return max
};
```

#### 56. 合并区间

https://leetcode.cn/problems/merge-intervals?envType=study-plan-v2&envId=top-100-liked

**思考:** 使用贪心思想，关键在于判断`[a,b] [c,d]`的合并条件，简单画图可知其关键条件应该是`b>c`,但考虑到包含的情况，应该确保合并后的结果`[x,y]`，x总是在a，c中的最小值；y总是在b，d中的最大值。

为了确保每次合并比较的过程总是单调，需要先对`intervals`先做一次排序,确保`a<c`的单调递增，这里使用到了`Array.prototype.sort()`方法。在不断比较的过程中，对于满足合并条件的`cur`不断合并，如果条件不满足，说明在这个区间内的`cur`可合并区间已经达到了最大，将其更新到`res`，并更新`cur`为当前正在遍历的`intervals`，遍历结束后再把剩下的`cur`塞进`res`，得到最终结果。

```js
/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
var merge = function(intervals) {
    // 排序
    const sortedInterval = intervals.sort((a,b)=>a[0]-b[0])
    // 初始比较对象
    let cur = sortedInterval[0]
    let res = []
    // 只有一个子数组的情况
    if(sortedInterval.length===1){
        return [cur]
    }
    // 从第二个数组开始遍历
    for (let i=1;i<sortedInterval.length;i++){
        //如果满足合并条件
        if(cur[1]>=sortedInterval[i][0]){
            let right = Math.max(cur[1],sortedInterval[i][1])
            //得到更大的合并区间
            cur = [cur[0],right]
        }else{
            res.push(cur)
            cur = sortedInterval[i]
        }
    }
    res.push(cur)

    return res
};
```

#### 189.轮转数组

**思考:** 题干要求只能在数组内部完成修改，不能返回新的数组。想到`Array.prototype`下在内部修改的方法有`slice`,`push`,`pop`。

其中`Array.splice`方法可以在数组内部指定一个开始索引,[就地](https://zh.wikipedia.org/wiki/%E5%8E%9F%E5%9C%B0%E7%AE%97%E6%B3%95)移除或者替换已存在的元素和/或添加新的元素。

```js

const months = ["Jan", "March", "April", "June"];
months.splice(1, 0, "Feb");
// Inserts at index 1
console.log(months);
// Expected output: Array ["Jan", "Feb", "March", "April", "June"]

months.splice(4, 1, "May");
// Replaces 1 element at index 4
console.log(months);
// Expected output: Array ["Jan", "Feb", "March", "April", "May"]

```

本题的难绷点在于可能出现`k>nums.length`的情况，此时需要使用`%`取模。

```js
/**
 * @param {number[]} nums
 * @param {number} k
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var rotate = function(nums, k) {
    let spliced = nums.splice(nums.length - (k % nums.length))
    nums.splice(0, 0, ...spliced)
};
```

#### 238. 除了自身以外数组的乘积

https://leetcode.cn/problems/product-of-array-except-self?envType=study-plan-v2&envId=top-100-liked

**思考:** 联想到我们之前**T560**中的做法，且题目要求不允许使用除法，故从前缀和联想到前缀积，再由前缀积联想到后缀积。那么，可以列出式子`answer[i] = prefixAcc[i]*suffixAcc[i]`，从而得出答案。

```js
/**
 * @param {number[]} nums
 * @return {number[]}
 */
var productExceptSelf = function(nums) {
    const n = nums.length
    // 初始化前缀积
    let prefixAcc = new Array(n+1).fill(1)
    // 初始化后缀积
    let suffixAcc = new Array(n+1).fill(1)
    let answer = []
    // 遍历求得前缀积数组
    for(let i = 1;i<n;i++){
        prefixAcc[i] = prefixAcc[i-1] * nums[i-1]
    }
    // 遍历求得后缀积数组
    for(let i = n-2;i>=0;i--){
        suffixAcc[i] = suffixAcc[i+1] * nums[i+1]
    }
    // 得到答案
    for(let i = 0;i<n;i++){
        answer.push(prefixAcc[i]*suffixAcc[i])
    }
    return answer
};
```

#### 41. 缺失的第一个正数

https://leetcode.cn/problems/first-missing-positive?envType=study-plan-v2&envId=top-100-liked

**思考:** 题目要求时间复杂度为`O(n)`且不允许使用额外的空间来，故只能从题目要求和数组本身下手。考虑到传统的排序方法(`O(nlogn)`)和哈希表都会产生额外的时间和空间，故采用**原地哈希**的做法，通过即时的在数组内交换位置，使得数组的索引即元素的哈希，而题目恰好要求我们得出缺失的第一个正整数，故可以忽略负数的情况，通过条件遍历使得数组内的数字k应该出现在k-1的位置上,如果不满足,就说明正在遍历的索引`i+1`即是对应缺失的最小正数。

```ts
function firstMissingPositive(nums: number[]): number {
    const n: number = nums.length;
    for (let i = 0; i < n; i++) {
        while (nums[i] >= 1 && nums[i] <= n && nums[i] !== nums[nums[i] - 1]) {
            const index: number = nums[i] - 1;
            [nums[i], nums[index]] = [nums[index], nums[i]];
        }
    }
    for (let i = 0; i < n; i++) {
        if (nums[i] !== i + 1) {
            return i + 1;
        }
    }
    return n + 1;

};
```

### 矩阵

#### 73. 矩阵置零

**思考:** 本体不便于直接修改,因为每次遇到0后立即修改会导致无法区分下一个遍历的数字到底是自身为0还是被替换为0的情况。

可以记录把`matrix[i][j]`记录进`zeroArray`，再遍历`zeroArray`，对每一个`item`，在x方向上的就替换为对应长度`m`的0数组（`new Array(m).fill(0)`），在y方向就遍历n次，使得`matrix[i][item[1]] = 0`

```js
/**
 * @param {number[][]} matrix
 * @return {void} Do not return anything, modify matrix in-place instead.
 */
var setZeroes = function(matrix) {
    const m = matrix[0].length
    const n = matrix.length
    let zeroArray = []
    for(let i = 0;i<n;i++){
        for(let j=0;j<m;j++){
            if(matrix[i][j] === 0){
                zeroArray.push([i,j])
            }
        }
    }
    zeroArray.forEach((item)=>{
        matrix[item[0]] = new Array(m).fill(0)
        for(let i=0;i<n;i++){
            matrix[i][item[1]] = 0
        }
    })

};
```

### 链表

#### 160. 相交链表

https://leetcode.cn/problems/intersection-of-two-linked-lists?envType=study-plan-v2&envId=top-100-liked

**思考:** 同时遍历访问不同列表的节点，如果它们存在一个共同的节点，最后总是能相遇，因此在A链的全部节点遍历完毕后，就将`p.next`设置为`headB`，B链条同理，只要存在共同点就总能相遇，否则说明不相交。

```js
/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */

/**
 * @param {ListNode} headA
 * @param {ListNode} headB
 * @return {ListNode}
 */
var getIntersectionNode = function(headA, headB) {
    let p = headA
    let q = headB
    while(p!==q){
        if(p !== null){
            p = p.next
        }else{
            p = headB
        }
        if(q !== null){
            q = q.next
        }else{
            q = headA
        }
    }
    return p
};
```

#### 206. 反转链表

https://leetcode.cn/problems/reverse-linked-list?envType=study-plan-v2&envId=top-100-liked

**思考:** 可以创建一个新的链表，在这个链表中，把每个遍历的元素加到新列表节点的头部，然后更新新的待处理头部。

```js
var reverseList = function(head) {
    // 1. 初始化两个指针
    let pre = null     // pre指向已反转部分的头节点（初始为空）
    let cur = head     // cur指向当前待处理的节点（从原链表头开始）

    // 2. 遍历原链表
    while(cur != null) {
        // 3. 保存当前节点的下一个节点
        const curN = cur.next  // 临时保存，防止链表断裂

        // 4. 核心：头插操作
        cur.next = pre  // 将当前节点的next指向前一个节点（反转指向）

        // 5. 更新指针位置
        pre = cur  // pre移动到当前节点，成为新反转部分的头
        cur = curN // cur移动到原链表的下一个节点
    }

    // 6. 返回反转后的头节点
    return pre  // 当cur为null时，pre就是新链表的头
}
```

#### 234. 回文链表

https://leetcode.cn/problems/palindrome-linked-list?envType=study-plan-v2&envId=top-100-liked

**思考:** 单向链表不能直接回溯，且单次链表遍历完毕前不能确认该链表的长度，故考虑**转化**为已知问题，在链表遍历时记录`cur.val`

，存入`arr`，再在`arr`中使用双指针的做法求得数组是否为回文。

*注意：* 遍历数组的条件是`while(cur!=null)`，因为在更新`cur.next`的时候已经挂上了下一个节点,即便下一个节点不存在，也应该以`cur`是否为空为判断条件，否则总是会少一个。

```js
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {boolean}
 */
var isPalindrome = function(head) {
    let arr = []
    let cur = head
    // 遍历链表
    while(cur != null){
        // 化归,存入数组
        arr.push(cur.val)
        cur = cur.next
    }
    // 熟悉的双指针
    let left = 0
    let right = arr.length - 1
    while(left<right){
        // 回文的条件判断
        if(arr[left]!=arr[right]){
            return false
        }
        // 更新指针
        left++
        right--
    }
    return true
};
```

#### 141. 环形链表

https://leetcode.cn/problems/linked-list-cycle?envType=study-plan-v2&envId=top-100-liked

**思考:** 成环的条件意味着有一个节点的`next` 指针会指向这个链表中已经存在的链表节点，考虑到不需要使用额外的信息来记录重复多少次，`Set`比`Map` 用于存储节点的引用信息更合适，由此想到使用哈希表来判断，注意存的是节点引用而非节点值，因为后者可能重复，但引用地址总是不变的。

```js
/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */

/**
 * @param {ListNode} head
 * @return {boolean}
 */
var hasCycle = function(head) {
    // 初始化集合
    let set = new Set()
    let cur = head
    // 遍历链表
    while(cur != null){
        // 存入链表节点的引用而非值
       if(set.has(cur)){
            return true
       }else{
           set.add(cur)
       }
       cur = cur.next
    }
    return false
};
```

#### 142. 链表节点II

https://leetcode.cn/problems/linked-list-cycle-ii?envType=study-plan-v2&envId=top-100-liked

**思考:** 本体要求返回链表开始入环的第一个节点，再度祭出`Set`大法，如果存在就返回该节点，否则就加入集合对象中，利用Set实现链表节点遍历情况的记录。

```js
/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */

/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var detectCycle = function(head) {
    // 初始化集合
    let set = new Set()
    let cur = head
    // 遍历链表
    while(head != null){
        if(set.has(head)){
            // 返回链表节点
            return head
        }else{
            set.add(head)
        }
        head = head.next
    }
    return null
};
```

#### 21. 合并两个有序链表

https://leetcode.cn/problems/merge-two-sorted-lists?envType=study-plan-v2&envId=top-100-liked

**思考:** 本题的关键在于正确的处理两类情况：如果是公共部分的长度，就要比较大小，将较短值所在的节点拼接到正在遍历的指针节点p上,继续比较；如果公共长度比较完毕，就看谁还剩的多，就把剩余链表的节点挂到`p.next`上。

```js

/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
var mergeTwoLists = function(list1, list2) {
    const dummy = new ListNode(); // 用哨兵节点简化代码逻辑
    let cur = dummy; // cur 指向新链表的末尾
    while (list1 && list2) {
        if (list1.val < list2.val) {
            cur.next = list1; // 把 list1 加到新链表中
            list1 = list1.next;
        } else { // 注：相等的情况加哪个节点都是可以的
            cur.next = list2; // 把 list2 加到新链表中
            list2 = list2.next;
        }
        cur = cur.next;
    }
    cur.next = list1 ?? list2; // 拼接剩余链表
    return dummy.next;

};
```

#### 2. 两数相加

https://leetcode.cn/problems/add-two-numbers?envType=study-plan-v2&envId=top-100-liked

**思考:** 考察对链表的理解，本体的难点在于考量进位的情况，使用链表模拟实现进位加法，需要分配一个变量用于存储进位的情况，无论l1，l2链表是否遍历完毕，都要确保最后进位一定是0，创建对应的链表节点，从而实现最终结果与预期一致。本题依然采用哨兵节点+指针遍历的思路，需要牢牢掌握。

```js
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
var addTwoNumbers = function(l1, l2) {
    // 处理进位
    let upper = 0
    // 哨兵节点
    let dummy = new ListNode(0)
    // 链表节点指针
    let cur = dummy
    while(l1 != null || l2!=null || upper!== 0){
        // 三元运算符
        const val1 = l1 ? l1.val : 0;
        const val2 = l2 ? l2.val : 0;
        let sum = upper + val1 + val2
        cur.next = new ListNode(sum % 10)
        cur = cur.next
        // 记录进位信息
        upper = Math.floor(sum/10)
        // 链表节点移动
        if (l1) l1 = l1.next;
        if (l2) l2 = l2.next;
    }
    return dummy.next
};
```

#### 19. 删除链表中的倒数第N个节点

https://leetcode.cn/problems/remove-nth-node-from-end-of-list?envType=study-plan-v2&envId=top-100-liked

**思考:** 两次遍历法解决，首次遍历时记录节点顺序和节点值。第二次遍历前，先计算得到待删除的节点顺序，然后利用伪节点从头开始创建新的节点，最后返回伪头结点`dummy.next`。要注意遍历的次数与链表长度一致。

```js
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @param {number} n
 * @return {ListNode}
 */
var removeNthFromEnd = function (head, n) {
    // 储存遍历过的节点
    let map = new Map()
    let p = head
    let i = 0
    // 遍历链表，储存节点
    while (p != null) {
        map.set(i, p.val)
        p = p.next
        i++
    }
    let target = i - n
    // 伪头节点
    let dummy = new ListNode(0)
    let q = dummy
    let j = 0
    // 指针从头开始遍历，跳过目标节点
    while (j < i) {
        if (j == target) {
            j++
            continue
        } else {
            // 创建新节点并连接
            let node = new ListNode(map.get(j))
            q.next = node
        }
        q = q.next
        j++
    }
    // 返回新链表的头节点
    return dummy.next
};
```

#### 24. 两两交换链表中的节点

**思考:**   两两交换节点的前提条件是不可少于两个节点，可以先从最简单的模型开始，同时，鉴于题目要求就地修改，为了便于操作需要创建一个伪头节点。

假定一个含有四个节点的列表分别命名为node0123，如果要交换`node1`和`node2`那么对链表的操作应该如下：

1. `node0`指向`node2`

2. `node2`指向`node1`

3. `node1`指向`node3`

此时完成了`node1`和`node2`链表节点的交换，拓展后，对于下一轮交换，原本的`node0`更新为`node1`，原本的`node1`更新为`node3`。

![](./images/hot100/24.png)



```js
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @param {number} n
 * @return {ListNode}
 */
var removeNthFromEnd = function (head, n) {
    // 储存遍历过的节点
    let map = new Map()
    let p = head
    let i = 0
    // 遍历链表，储存节点
    while (p != null) {
        map.set(i, p.val)
        p = p.next
        i++
    }
    let target = i - n
    // 伪头节点
    let dummy = new ListNode(0)
    let q = dummy
    let j = 0
    // 指针从头开始遍历，跳过目标节点
    while (j < i) {
        if (j == target) {
            j++
            continue
        } else {
            // 创建新节点并连接
            let node = new ListNode(map.get(j))
            q.next = node
        }
        q = q.next
        j++
    }
    // 返回新链表的头节点
    return dummy.next
};
```

### 二叉树

#### 理论基础

https://www.bilibili.com/video/BV1Hy4y1t7ij/?share_source=copy_web&vd_source=75123c5d6ddf7add04ab0e96d5ddb1f7

**种类:** 

- 满二叉树:节点数量是$2^k-1$,k是深度

- 完全二叉树:底层从左到右**连续**的二叉树.

- 二叉搜索树:元素有顺序的二叉树

- 平衡二叉搜索树:左子树与右子树的高度的差的绝对值不能超过1

**储存方式:**

- 链式存储(双向链表)

- 字符数组(适用完全二叉树)

**二叉树遍历:** 

DFS/BFS

前/中/后序遍历都是深度优先遍历:递归/迭代法

层序遍历是广度优先遍历.

前序遍历: 中左右

中序遍历: 左中右

后序遍历: 左右中

#### 102. 二叉树的层序遍历(BFS)

【二叉树的层序遍历【基础算法精讲 13】】 https://www.bilibili.com/video/BV1hG4y1277i/?share_source=copy_web&vd_source=75123c5d6ddf7add04ab0e96d5ddb1f7

**双数组做法**

1. 创建一个数组`cur`

2. 将根节点放入`cur`，开始遍历`cur`

3. 创建`nxt`数组

4. 将左右儿子记录到下一层节点数组`nxt`，把节点值记录到数组`vals`中

5. 遍历结束后，把`cur`替换成`nxt`,开启下一轮循环

6. 重复循环直到`cur`为空，此时可终止循环。

```js
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number[][]}
 */
var levelOrder = function(root) {
    if(root == null){
        return []
    }
    let ans = []
    let cur = [root]
    while(cur.length != 0){
        let nxt = []
        let vals = []
        for(const node of cur){
            vals.push(node.val)
            if(node.left){
                nxt.push(node.left)
            }
            if(node.right){
                nxt.push(node.right)
            }
        }
        cur = nxt
        ans.push(vals)
    }
    return ans
};
```

#### 108. 将有序数组转换为二叉搜索树

https://leetcode.cn/problems/convert-sorted-array-to-binary-search-tree?envType=study-plan-v2&envId=top-100-liked

**思考:** 使用递归处理，问题的关键在于选择正确的数组元素和处理左儿子和右儿子。解决这个问题的方法是使用递归,将二叉树拆解成子问题，即子二叉树的`dfs`函数。

```js
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {number[]} nums
 * @return {TreeNode}
 */
var sortedArrayToBST = function(nums) {
    let dfs = (left,right) => {
        if(left === right){
            return null
        }
        const mid = Math.floor((left+right) / 2)
        return new TreeNode(nums[mid],dfs(left,mid),dfs(mid+1,right))
    }
    return dfs(0,nums.length)

};
```

#### 94. 二叉树的中序遍历

https://leetcode.cn/problems/binary-tree-inorder-traversal?envType=study-plan-v2&envId=top-100-liked

**思考:** DFS+左中右，得补一下DFS和BFS的功课。

```js
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number[]}
 */
var inorderTraversal = function(root) {
    const ans = [];
    const dfs = (root) => {
        if (!root) {
            return;
        }
        dfs(root.left);
        ans.push(root.val);
        dfs(root.right);
    };
    dfs(root);
    return ans;

};
```

### 二分查找

#### 35. 搜索插入位置

https://leetcode.cn/problems/search-insert-position?envType=study-plan-v2&envId=top-100-liked

**思考:** 二分查找，如果`target`落在中间值`mid`左侧，移动`right=mid-1`，如果`target`落在中间值`mid`右侧，移动`left=mid+1`。

```js
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var searchInsert = function(nums, target) {
    const n = nums.length
    // 双指针
    let left = 0
    let right = n-1
    while(left <= right){
        // 中间值
        let mid = Math.floor((left+right)/2) 
        if(nums[mid]<target){
            left = mid+1
        }
        if(nums[mid]>target){
            right = mid-1
        }
        if(nums[mid]==target){
            return mid
        }
    }
    return left
};
```

#### 74. 搜索二维矩阵

**思考:** 二维矩阵也可以转换为一个长长的数组,问题的关键在于如何获取`matrix`的`matrix[mid]`，根据二维数组的特性，应该如`matrix[Math.floor(mid/2)][mid%n]`，剩余操作与搜索插入位置一致。

```js
/**
 * @param {number[][]} matrix
 * @param {number} target
 * @return {boolean}
 */
var searchMatrix = function(matrix, target) {
    const m = matrix.length, n = matrix[0].length;
    let left = -1, right = m * n;
    while (left + 1 < right) {
        // 中间值
        const mid = Math.floor((left + right) / 2);
        // 取得中间数
        const x = matrix[Math.floor(mid / n)][mid % n];
        if (x === target) {
            return true;
        }
        // mid右侧
        if (x < target) {
            left = mid;
        } else {
            // mid左侧
            right = mid;
        }
    }
    return false;
};

```

#### 104. 二叉树的最大深度

https://leetcode.cn/problems/maximum-depth-of-binary-tree?envType=study-plan-v2&envId=top-100-liked

**思考:**   要解决这个问题，仍然需要掌握DFS和递归的思想。问题的关键在于：

1. 深度信息如何传递和更新？

2. 对子树的处理（左子树和右子树）

解决方法是使用闭包，`dfs(root,cur)`，`root`表示传入的子树节点,`cur`表示当前递归得到的最大深度。但要获得最大的深度,应该将最大值与`cur`比较并更新，从而确保最后得到的结果总是最大值。

```js
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number}
 */
var maxDepth = function(root) {
    let maxdepth = 0
    // 深度遍历
    let dfs = (root,cur) =>{
        if(!root){
            return
        }
        maxdepth = Math.max(maxdepth,cur)
        // 左子树递归
        dfs(root.left,cur+1)
        // 右子树递归
        dfs(root.right,cur+1)
    }
    dfs(root,1)
    return maxdepth
};
```

#### 226. 翻转二叉树

https://leetcode.cn/problems/invert-binary-tree?envType=study-plan-v2&envId=top-100-liked

**思考:** 为了翻转二叉树,需要交换左子树与右子树，然后执行`dfs`深度优先遍历。

```js
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {TreeNode}
 */
var invertTree = function(root) {
    const dfs = (root) =>{
        if(!root){
            return
        }
        let tmp = root.right
        // 右子树更新
        root.right = root.left
        // 左子树更新
        root.left = tmp
        // 左子树递归
        dfs(root.left)
        // 右子树递归
        dfs(root.right)
    }
    dfs(root)
    return root
};
```

#### 101. 对称二叉树

**思考:** 将对称二叉树的判定拆分为子问题:*左子树与右子树是否对称*，构造子函数通过递归方法解决。

1. **转化为子树问题**：一颗树对称，意味着它的**左子树**和**右子树**是镜像关系。
2. **镜像的定义**：对于两个节点（比如左子树的根 A 和右子树的根 B），它们互为镜像需要满足什么条件？
   * 首先，它们的值必须相等。
   * 其次，A 的左子树必须和 B 的右子树镜像。
   * 最后，A 的右子树必须和 B 的左子树镜像。
3. **递归终止条件**：
   * 如果两个节点都为空（`null`）或者任意一个为空

```js

/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {boolean}
 */
var isSymmetric = function(root) {

    // 相同子树
    const isSameTree = (left,right) =>{
        // 结束递归
        if(left==null || right==null){
            return left == right
        }
        // 值相等,两个条件
        return left.val === right.val && isSameTree(left.left,right.right) && isSameTree(left.right,right.left)
    }

    return isSameTree(root.left,root.right)
};
```

#### 543. 二叉树的直径

**思考:** 子问题是求得子树的最大链长，子树的最大链长是左子树最大链长与右子树最大链长的最大值。

```js

/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number}
 */
var diameterOfBinaryTree = function(root) {
    let ans = 0
    const dfs = (node) =>{
        if(!node){
            return -1 // 对于叶子来说，链长就是 -1+1=0
        } 
        const left = dfs(node.left) + 1 // 左子树最大链长+1
        const right = dfs(node.right)+1 // 右子树最大链长+1
        ans = Math.max(ans,left+right) // 更新结果
        return Math.max(left,right) // 当前子树最大链长
    }
    dfs(root)
    return ans
};
```

### 动态规划

**题单:** https://leetcode.cn/discuss/post/3581838/fen-xiang-gun-ti-dan-dong-tai-gui-hua-ru-007o/ 

时间紧任务重，先做Hot100...

**思路：**

1. 明确状态定义

2. 推导状态转移方程

3. 确认边界条件

4. 确定计算顺序

5. 返回计算结果

#### 70. 爬楼梯

https://leetcode.cn/problems/climbing-stairs?envType=study-plan-v2&envId=top-100-liked

**思考:** 观察可知道这道题实际上是在考察斐波那契数列，易推得状态转移方程`dp[i]=dp[i-1]+dp[i-2](i>=2)`

```js
/**
 * @param {number} n
 * @return {number}
 */
var climbStairs = function(n) {
    // n==1特判
    if(n==1){
        return 1
    }
    // 初始化dp
    let dp = new Array(n+1).fill(1)
    // dp初始化
    dp[0] = 1
    dp[1] = 1
    for(let i=2;i<=n;i++){
        // 状态转移方程
        dp[i] = dp[i-1] + dp[i-2]
    }
    return dp[n]
};
```

#### 118. 杨辉三角

https://leetcode.cn/problems/pascals-triangle?envType=study-plan-v2&envId=top-100-liked

**思考:** 三角形不便于观察,可以将每一行从左侧开始对齐,此时更容易观察规律,可见到中间数组由上一排数组内的相邻两个数组相加`dp[i-1][j-1]+dp[i-1][j-1]` 得到，由此发现了状态转移方程：`part[j] = dp[i-1][j-1] + dp[i-1][j] (i>=2,j>=1)`



```js
/**
 * @param {number} numRows
 * @return {number[][]}
 */
var generate = function(numRows) {
    // 特判1/2
    if(numRows === 1){
        return[[1]]
    }
    if(numRows === 2){
        return [[1],[1,1]]
    }
    // dp初始化
    let dp = new Array(numRows).fill([])
    dp[0] = [1]
    dp[1] = [1,1]
    // 从第三行dp[2]开始递推
    for(let i=2;i<numRows;i++){
        // dp[i] 初始化 头尾是1
        let part = new Array(i+1).fill(1)
        for(let j = 1;j<i;j++){
            // 状态转移方程
            part[j] = dp[i-1][j-1] + dp[i-1][j]
        }
        // 更新dp
        dp[i] = part
    }
    return dp
    
};
```



#### 198. 打家劫舍

https://leetcode.cn/problems/house-robber?envType=study-plan-v2&envId=top-100-liked

**思考:** 状态转移方程`dp[i] = Math.max(nums[i-1]+dp[i-2],dp[i-1]) (i>=2)`

```js
/**
 * @param {number[]} nums
 * @return {number}
 */
var rob = function(nums) {
    // 特判
    if(nums.length===1){
        return nums[0]
    }
    if(nums.length===2){
        return Math.max(nums[0],nums[1])
    }
    // 初始化dp
    const n = nums.length
    let dp = new Array(n).fill(0)
    dp[1] = nums[0]
    for(let i=2;i<=n;i++){
        // 状态转移方程
        dp[i] = Math.max(nums[i-1]+dp[i-2],dp[i-1])
    }
    return dp[n]

};
```
