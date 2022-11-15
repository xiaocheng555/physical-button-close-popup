<template>
  <!-- van-popup 如果不设置 :lock-scroll="false"，自动打开弹窗会出现页面锁住不能滚动（vue2版本不会） -->
  <van-popup v-model:show="dialogVisible" v-bind="$attrs" :lock-scroll="false">
    <slot></slot>
  </van-popup>
</template>

<script setup lang="ts">
import { Popup as VanPopup } from 'vant'
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

function setHistoryState (state: any) {
  history.replaceState({
    ...history.state,
    ...state
  }, '')
}

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
  },
  // 扩展query参数
  queryExtends: {
    type: Object
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
  return window.history.state?.popupKey === props.queryKey
}

// 添加query参数
async function addQuery () {
  if (!existQueryKey()) {
    const newQuery = { ... route.query, ...props.queryExtends }
    if (props.queryKey) newQuery[props.queryKey] = props.queryValue?.toString?.()
    await router.push({
      query: newQuery
    })
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
    for (let key in props.queryExtends) {
      delete newQuery[key]
    }
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