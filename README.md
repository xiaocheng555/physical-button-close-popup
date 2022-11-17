# H5完美实现淘宝物理返回键关闭弹窗

## 前言

物理返回键通常是指手机左滑、右滑和机身自带的返回键。在安卓/IOS 端可以通过监听物理返回事件去关闭弹窗，但是在H5是没有这一事件，那应该如何去实现物理返回键关闭弹窗呢？接下来说说我的方案。

## 淘宝效果

![tb.gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6c4c70630f0f42a4b8cb8cda7aefb629~tplv-k3u1fbpfcp-watermark.image?)

操作：商品详情 -->点击购物车进入 购买弹窗 -->点击图片进入 图片预览弹窗

返回操作：-->物理键返回 关闭图片预览弹窗 -->物理键再返回 关闭购买弹窗 --> 回到 商品详情

## h5实现效果

![1.gif](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6c5d783bbd4d4e5a918656a2c2ac84ee~tplv-k3u1fbpfcp-watermark.image?)

vue3预览：[https://xiaocheng555.github.io/physical-button-close-popup](https://xiaocheng555.github.io/physical-button-close-popup)
vue2预览：[https://xiaocheng555.github.io/physical-button-close-popup/v2](https://xiaocheng555.github.io/physical-button-close-popup/v2)

源码（拿来吧你）：[https://github.com/xiaocheng555/physical-button-close-popup](https://github.com/xiaocheng555/physical-button-close-popup)

## 实现原理

物理返回键在H5实际上只是返回上一页的功能，也就是回退上个历史记录。因此我们可以在弹窗打开时，添加一个不会改变当前页面的历史记录，如 `?popyp=true`（或 `#popup`），在触发物理返回键后，浏览器会后退一个历史记录并且自动清除`?popyp=true`（或 `#popup`），而页面不会发生跳转和刷新，最后通过监听url变化，识别出url中 `?popyp=true` 被清除则关闭弹窗。

## 组件实现(Vue3)

将物理返回键关闭弹窗逻辑封装成弹窗组件：HistoryPopup.vue。

### 组件基础结构

``` js
<template>
  <!-- van-popup 如果不设置 :lock-scroll="false"，自动打开弹窗会出现页面锁住不能滚动（vue2版本不会） -->
  <van-popup v-model:show="dialogVisible" v-bind="$attrs" :lock-scroll="false">
    <slot></slot>
  </van-popup>
</template> 

<script setup lang="ts">
import { Popup as VanPopup } from 'vant'
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
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
  // query参数的key值
  queryKey: {
    type: String
  },
  // query参数的value值，弹窗打开会URL上显示`?queryValue=queryValue`
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
    const newQuery = { ... route.query }
    if (props.queryKey) newQuery[props.queryKey] = props.queryValue
    router.push({
      query: newQuery
    })
  }
}

// 移除query参数
function removeQuery () {
  if (props.queryKey && existQueryKey()) {
    const newQuery = { ... route.query }
    delete newQuery[props.queryKey]
    router.replace({
      query: newQuery
    })
  }
}

// 判断路由query上是否存在queryKey
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

![2.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4d0ebddc932a4d6a8f7ac637fd7665f4~tplv-k3u1fbpfcp-watermark.image?)


### 多了一条历史记录的bug

当手动打开弹窗时，url添加 `?popup=true` 参数，同时也增加了一条历史记录；然后手动关闭弹窗，是通过 `router.repalce()` 来移除 `?popup=true` 参数的，而 `router.repalce()` 是不会移除历史记录，那么一开始添加的历史纪录还存在，这就导致打开并关闭弹窗会多了一条历史纪录。那么如果用户打开关闭弹窗10次，就会多产生10条历史记录，用户在详情页返回首页时，就需要点11次返回按钮才能回到首页。

#### 解决方案

用户打开弹窗时，url的变化过程是：`/detail` => `/detail?popup=true`，打开弹窗后如果能知道上一页是 `/detail`的话，那么在弹窗关闭时调用 `router.back()` 就能移除 `?popup=true` 参数和多出的历史纪录了。

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
    
    const backRoute = router.resolve(state.back || '') // 解析出返回的路由
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

``` js
// HistoryPopup.vue
<template>
  <!-- van-popup 如果不设置 :lock-scroll="false"，自动打开弹窗会出现页面锁住不能滚动（vue2版本不会） -->
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

``` js
<HistoryPopup v-model.show="visible" queryKey="popup">
  ...
</HistoryPopup>
```

### 优化

#### 优化多了一条历史记录的解决方案

前面提过，可以通过 `history.state.back` 来解决多了一条历史记录的问题，但是`history.state.back` 是vue3才有的，有些强关联了，是不是还有更优的解决方案呢？如下：

原来解决方案是：上一个url和当前url做对比就能知道弹窗多了 `?popup=true` 历史记录，从而使用 `router.back()` 去关闭弹窗并消除多出的历史记录，否则使用 `router.replace()` 去关闭弹窗并消除 `?popup=true` 参数。

优化方案：弹窗打开并添加 `?popup=true` 参数时，记录 `history.state.popupKey` 为 `popup`, 那么关闭弹窗就使用 `router.back()`；如果在新页签打开地址 `/#/detail?popup=true`，弹窗会自动打开，此时关闭弹窗，可以得知 `history.state.popupKey` 为 `undefined`，那么关闭弹窗就使用 `router.replace()` 去消除 `?popup=true` 参数。

``` js
// ⚠️更改处：设置 history.state 的值 
function setHistoryState (state: any) {
  history.replaceState({
    ...history.state,
    ...state
  }, '')
}

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
    // ⚠️更改处：
    return window.history.state?.popupKey === props.queryKey
  }

  // 添加query参数
  async function addQuery () {
    if (!existQueryKey()) {
      const newQuery = { ... route.query }
      if (props.queryKey) newQuery[props.queryKey] = props.queryValue?.toString?.() || ''
      await router.push({
        query: newQuery
      })
      // ⚠️更改处：
      setHistoryState({
        popupKey: props.queryKey
      })
    }
  }

  // 移除query参数
  function removeQuery () {
    if (props.queryKey && existQueryKey()) {
      const newQuery = { ... route.query }
      delete newQuery[props.queryKey]
      
      router.replace({
        query: newQuery
      })
    }
  }
```


#### 写成hook

返回键关闭弹窗逻辑都写在 `HistoryPopup.vue` 组件的话，如果还有其他弹窗如侧边栏弹窗，actionsheet弹窗等组件的话，有需要封装重复逻辑，所以返回键关闭弹窗逻辑写成hook，方便复用，详细见源码 `src/hooks/useHistoryPopup.js`，组件使用如下：

``` js
<template>
  <!-- van-popup 如果不设置 :lock-scroll="false"，自动打开弹窗会出现页面锁住不能滚动（vue2版本不会） -->
  <van-popup v-model:show="dialogVisible" v-bind="$attrs" :lock-scroll="false">
    <slot></slot>
  </van-popup>
</template>

<script setup lang="ts">
import { Popup as VanPopup } from 'vant'
import useHistoryPopup, { historyPopupProps } from '@/hooks/useHistoryPopup'

defineProps({
  ...historyPopupProps
})
const { dialogVisible } = useHistoryPopup()
</script>
```

## Vue2实现

vue2 实现跟 vue3 实现差不多，唯一的区别就是vue2的 `vue-route` 不会将上一页信息记录在 `window.history.state.back` 中，这就需要自己去扩展 `vue-router`，手动实现`window.history.state.back`。

### 扩展路由

首先重写 `$router.push()`, `$router.replace` 方法，并在跳转后给 `window.history.state` 对象添加 `back`, `current`, `forward` 等信息。除此之外，还需在首次加载、手动输入地址并跳转时，设置 `window.history.state` 信息。

``` js
// router-extend.js
// 扩展路由历史记录的状态信息【支持版本vue-router@3.6.4，版本不能太低】
export function extendHistoryState (router) {
  // 设置history.state的值
  function setHistoryState (state) {
    history.replaceState({
      ...history.state,
      ...state
    }, '')
  }
  
  // 首次进入页面记录当前路由信息
  let once = true
  function setRouteStateAtFirst () {
    // 此处不能销毁afterEach，如果销毁了，在其他地方使用afterEach勾子，首次不会触发改勾子回调
    router.afterEach((route) => {
      if (!once) return
      once = false
      setHistoryState({
        back: history.state?.back || null,
        current: route.fullPath,
        forward: history.state?.forward || null
      })
    })
  }
  
  // 监听popstate，当手动输入地址跳转其他页面时，记录路由信息
  function handlePopstate () {
    if (history.state?.current) return
    
    const from = router.currentRoute
    // 记录跳转后的路由信息
    const destroy = router.afterEach((to) => {
      setHistoryState({
        back: from.fullPath,
        current: to.fullPath,
        forward: null
      })
      destroy()
    })
  }
    
  const { push, replace  } = router
  
  // 重写router.push
  function routerPush (location, onComplete, ...rest) {
    const to = router.resolve(location)
    const fromPath = router.currentRoute.fullPath
    // 记录跳转前的路由信息
    if (to) {
      setHistoryState({
        back: history.state?.back || null,
        current: fromPath,
        forward: to.route.fullPath
      })
    }
    // 记录跳转后的路由信息
    const complete = (...args) => {
      const curPath = router.currentRoute.fullPath
      setHistoryState({
        back: fromPath,
        current: curPath,
        forward: null
      })
      onComplete && onComplete.apply(router, args)
    }
    return push.apply(router, [location, complete, ...rest])
  }
  
  // 重写router.replace
  function routerReplace (location, onComplete, ...rest) {
    // 记录跳转后的路由信息
    const complete = (...args) => {
      const curPath = router.currentRoute.fullPath
      setHistoryState({
        back: history.state?.back || null,
        current: curPath,
        forward: history.state?.forward || null
      })
      onComplete && onComplete.apply(router, args)
    }
    return replace.apply(router, [location, complete, ...rest])
  }
  
  setRouteStateAtFirst()
  window.addEventListener('popstate', handlePopstate)
  router.push = routerPush
  router.replace = routerReplace
}
```

使用 `extendHistoryState`:

``` js
import Router from 'vue-router'
import { extendHistoryState } from './router-extend'

const router = new Router(...)
extendHistoryState(router)
```

### 组件

``` js
<template>
  <van-popup v-model="dialogVisible" v-bind="$attrs">
    <slot></slot>
  </van-popup>
</template>

<script>
export default {
  name: 'HistoryPopup',
  props: {
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
  },
  model: {
    prop: 'modelValue',
    event: 'modelValueChange'
  },
  computed: {
    dialogVisible: {
      get () {
        return this.modelValue
      },
      set (val) {
        this.$emit('modelValueChange', val)
      }
    }
  },
  methods: {
    // 弹窗打开事件
    onOpen () {
      this.addQuery()
    },

    // 弹窗关闭事件
    onClose () {
      if (this.hasBackRecord()) {
        this.$router.back()
      } else {
        this.removeQuery()
      }
    },

    // 判断弹窗是否有返回记录
    hasBackRecord () {
      const state = window.history?.state
      if (state && this.queryKey) {
        if (!state.back) return false
        
        const backRoute = this.$router.resolve(state.back || '') // 解析出返回路由
        if (backRoute.path === this.$routepath) {
          
          const backQuery = backRoute.query || {} // 上一页的query参数
          const curQuery = this.$route.query || {} // 当前页query参数
          return (this.queryKey in curQuery) && !(this.queryKey in backQuery)
        }
        return false
      } else {
        return false
      }
    },

    // 添加query参数
    addQuery () {
      if (!this.existQueryKey()) {
        const newQuery = { ... this.$route.query }
        if (this.queryKey) newQuery[this.queryKey] = this.queryValue?.toString?.()
        this.$router.push({
          query: newQuery
        })
      }
    },

    // 移除query参数
    removeQuery () {
      if (this.queryKey && this.existQueryKey()) {
        const newQuery = { ... this.$route.query }
        delete newQuery[this.queryKey]
        this.$router.replace({
          query: newQuery
        })
      }
    },

    // url上是否存在queryKey
    existQueryKey () {
      const { query } = this.$route 
      return this.queryKey && this.queryKey in query
    }
  },
  watch: {
    dialogVisible (val) {
      val ? this.onOpen() : this.onClose()
    },
    '$route.query': {
      immediate: true,
      handler () {
        if (!this.queryKey) return
  
        const exist = this.existQueryKey()
        // 自动关闭弹窗
        if (!exist && this.dialogVisible) {
          this.dialogVisible = false
        }
        // 自动打开弹窗
        if (exist && !this.dialogVisible) {
          this.dialogVisible = true
        }
      }
    }
  }
}
</script>

<style lang='less' scoped>

</style>
```

#### 优化

vue2优化跟vue3优化同理，详见源码 `根目录/vue2/`：

1、无需采用扩展路由写法
2、返回键关闭弹窗逻辑写为mixin，方便复用

## 结尾

至此，H5实现物理返回键关闭弹窗完成，功能包括：

* 物理返回键关闭弹窗

* 支持多级弹窗嵌套

* 支持弹窗跳转

* 无多余历史记录

## 最后附上地址


vue3预览：[https://xiaocheng555.github.io/physical-button-close-popup](https://xiaocheng555.github.io/physical-button-close-popup)
vue2预览：[https://xiaocheng555.github.io/physical-button-close-popup/v2](https://xiaocheng555.github.io/physical-button-close-popup/v2)

源码：[https://github.com/xiaocheng555/physical-button-close-popup](https://github.com/xiaocheng555/physical-button-close-popup)