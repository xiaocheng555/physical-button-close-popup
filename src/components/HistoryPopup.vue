<template>
  <van-popup v-model:show="dialogVisible" v-bind="$attrs" :lock-scroll="false">
    <slot></slot>
  </van-popup>
</template>

<script setup lang="ts">
import { Popup as VanPopup } from 'vant'
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

<style lang='less' scoped>

</style>