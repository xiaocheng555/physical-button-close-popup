# H5完美实现淘宝物理返回键关闭弹窗

## 前言

物理返回键通常是指手机左滑、右滑和机身自带的返回键。在安卓/IOS 端可以通过监听物理返回事件去关闭弹窗，但是在H5是没有这一事件，那应该如何去实现物理返回键关闭弹窗呢？接下来说说我的方案。

## 淘宝效果

![1](9.assets/tb.gif)

操作：商品详情 -->点击购物车进入 购买弹窗 -->点击图片进入 图片预览弹窗

返回操作：-->物理键返回 关闭图片预览弹窗 -->物理键再返回 关闭购买弹窗 --> 回到 商品详情

## h5实现效果

![1](9.assets/1.gif)

预览：https://xiaocheng555.github.io/physical-button-close-popup

源码（拿来吧你）：https://github.com/xiaocheng555/physical-button-close-popup

## 实现原理

物理返回键在H5实际上只是返回上一页的功能，也就是回退上个历史记录。因此我们可以在弹窗打开时，添加一个不会改变当前页面的历史记录，如 `?popyp=true`（或 `#popup`），在触发物理返回键后，浏览器会自动清除`?popyp=true`（或 `#popup`），而页面不会发生跳转和刷新，最后通过监听url变化，识别出url中 `?popyp=true` 被清除则关闭弹窗。

## 组件实现(Vue3)

将物理返回键关闭弹窗逻辑封装成弹窗组件：HistoryPopup.vue。

### 组件基础结构

``` vue
<template>
  <van-action-sheet v-if="!overlay" v-model:show="dialogVisible" v-bind="$attrs" :close-on-popstate="false">
    <slot></slot>
  </van-action-sheet>
  <van-overlay v-else :show="dialogVisible" v-bind="$attrs" @click="dialogVisible = false">
    <slot></slot>
  </van-overlay>
</template>

<script setup lang="ts">
import { ActionSheet as VanActionSheet, Overlay as VanOverlay } from 'vant'
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  overlay: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits([
  'update:modelValue'
])

const dialogVisible = computed({
  get () {
    return props.modelValue
  },
  set (val) {
    emit('update:modelValue', val)
  }
})
</script>
```

通过 `v-model` 来控制弹窗显示隐藏

### 添加/删除历史记录

弹窗打开时，添加 `?key=value` 记录；弹窗关闭时，移除 `?key=value` 记录

```ts
const props = defineProps({
  ...
  queryKey: {
    type: String
  },
  queryValue: {
    type: [Number, String, Boolean],
    default: true
  }
})

watch(dialogVisible, (val) => {
  if (val) {
    onOpen()
  } else {
    onClose()
  }
})

// 弹窗打开事件
function onOpen () {
  addQuery()
}

// 弹窗关闭事件
function onClose () {
  removeQuery()
}

// 添加query参数
function addQuery () {
  if (!existQueryKey()) {
    const newQuery: any = { ... route.query }
    if (props.queryKey) newQuery[props.queryKey] = props.queryValue
    router.push({
      query: newQuery
    })
  }
}

// 移除query参数
function removeQuery () {
  if (props.queryKey && existQueryKey()) {
    const newQuery: any = { ... route.query }
    delete newQuery[props.queryKey]
    router.replace({
      query: newQuery
    })
  }
}

function existQueryKey () {
  const { query } = route 
  return props.queryKey && props.queryKey in query
}
```

### 自动打开/关闭弹窗

* 弹窗处于打开时，点击浏览器的后退键，则主动关闭弹窗

* 弹窗处于关闭时，点击浏览器的前进键，则主动打开弹窗

``` ts
watch(() => route.query, () => {
  if (!props.queryKey) return
  
  const exist = existQueryKey()
  // 主动关闭弹窗
  if (!exist && dialogVisible.value) {
    dialogVisible.value = false
  }
  // 主动打开弹窗
  if (exist && !dialogVisible.value) {
    dialogVisible.value = true
  }
})
```

效果如图：

![1](9.assets/2.gif)

### 多了一条历史记录的bug

手动打开弹窗时，url为 `?popup=true`，添加一条历史记录；然后手动关闭弹窗，通过 `router.repalce` 来删除 `?popup=true`，但刚刚添加的历史记录仍然存在，这就多出了一条历史纪录。如果用户打开关闭弹窗10次，就会多产生10条历史记录，那么用户在详情页返回首页时，就需要点11次的返回按钮才能回到首页。

#### 解决方案

用户打开弹窗时，url的变化过程是：`/detail` => `/detail?popup=true`，打开弹窗后如果知道上一页是 `/detail`，那么在弹窗关闭时调用 `router.back()` 就能删除 `?popup=true` 和多出的历史纪录了。

恰好，vue3 的 `vue-router` 会将上一页的地址记录在 `window.history.state.back` 上。实现如下：

``` ts
// 弹窗关闭事件
function onClose () {
  if (hasBackRecord()) {
    router.back()
  } else {
    removeQuery()
  }
}

// 判断弹窗是否有返回记录
function hasBackRecord () {
  const state = window.history?.state
  if (state && props.queryKey) {
    if (!state.back) return false
    
    const backRoute = router.resolve(state.back || '') // 解析出返回路由
    if (backRoute.path === route.path) {
      
      const backQuery = backRoute.query // 上一页的query参数
      const curQuery = route.query // 当前页query参数
      return (props.queryKey in curQuery) && !(props.queryKey in backQuery)
    }
    return false
  } else {
    return false
  }
}
```

### 完整代码

``` vue
// HistoryPopup.vue
<template>
  <van-popup v-model:show="dialogVisible" v-bind="$attrs" :lock-scroll="false">
    <slot></slot>
  </van-popup>
</template>

<script setup lang="ts">
import { Popup as VanPopup, Overlay as VanOverlay } from 'vant'
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  queryKey: {
    type: String
  },
  queryValue: {
    type: [Number, String, Boolean],
    default: true
  }
})
const emit = defineEmits([
  'update:modelValue'
])

const router = useRouter()
const route = useRoute()

// 控制弹窗显示
const dialogVisible = computed({
  get () {
    return props.modelValue
  },
  set (val) {
    emit('update:modelValue', val)
  }
})

// 弹窗打开事件
function onOpen () {
  addQuery()
}

// 弹窗关闭事件
function onClose () {
  if (hasBackRecord()) {
    router.back()
  } else {
    removeQuery()
  }
}

// 判断弹窗是否有返回记录
function hasBackRecord () {
  const state = window.history?.state
  if (state && props.queryKey) {
    if (!state.back) return false
    
    const backRoute = router.resolve(state.back || '') // 解析出返回路由
    if (backRoute.path === route.path) {
      
      const backQuery = backRoute.query // 上一页的query参数
      const curQuery = route.query // 当前页query参数
      return (props.queryKey in curQuery) && !(props.queryKey in backQuery)
    }
    return false
  } else {
    return false
  }
}

// 添加query参数
function addQuery () {
  if (!existQueryKey()) {
    const newQuery: any = { ... route.query }
    if (props.queryKey) newQuery[props.queryKey] = props.queryValue
    router.push({
      query: newQuery
    })
  }
}

// 移除query参数
function removeQuery () {
  if (props.queryKey && existQueryKey()) {
    const newQuery: any = { ... route.query }
    delete newQuery[props.queryKey]
    router.replace({
      query: newQuery
    })
  }
}

// url上是否存在queryKey
function existQueryKey () {
  const { query } = route 
  return props.queryKey && props.queryKey in query
}

watch(dialogVisible, (val) => {
  val ? onOpen() : onClose()
})

watch(() => route.query, () => {
  if (!props.queryKey) return
  
  const exist = existQueryKey()
  // 自动关闭弹窗
  if (!exist && dialogVisible.value) {
    dialogVisible.value = false
  }
  // 自动打开弹窗
  if (exist && !dialogVisible.value) {
    dialogVisible.value = true
  }
}, {
  immediate: true
})
</script>
```

### 组件用法

``` vue
<HistoryPopup v-model.show="visible" queryKey="popup">
  ...
</HistoryPopup>
```

## 结尾

至此，H5实现物理返回键关闭弹窗完成，功能包括：

* 物理返回键关闭弹窗

* 支持多级弹窗嵌套

* 支持弹窗跳转

* 无多余历史记录

## 最后附上地址

预览：https://xiaocheng555.github.io/physical-button-close-popup

源码：https://github.com/xiaocheng555/physical-button-close-popup
