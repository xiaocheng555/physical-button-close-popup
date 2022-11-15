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
import useHistoryPopup from './useHistoryPopup'

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
const { popupKeyPrev } = useHistoryPopup()


// 控制弹窗显示
const dialogVisible = computed({
  get () {
    return props.modelValue
  },
  set (val) {
    emit('update:modelValue', val)
  }
})

const fullQueryKey = computed(() => {
  return props.queryKey && popupKeyPrev + props.queryKey 
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
  return window.history.state?.popupKey === fullQueryKey.value
}

// 添加query参数
async function addQuery () {
  if (!existQueryKey()) {
    const newQuery = { ... route.query, ...props.queryExtends }
    if (fullQueryKey.value) newQuery[fullQueryKey.value] = props.queryValue?.toString?.()
    await router.push({
      query: newQuery
    })
    setHistoryState({
      popupKey: fullQueryKey.value
    })
  }
}

// 移除query参数
function removeQuery () {
  if (fullQueryKey.value && existQueryKey()) {
    const newQuery = { ... route.query }
    delete newQuery[fullQueryKey.value]
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
  return fullQueryKey.value && fullQueryKey.value in query
}

// 根据query参数变化，主动打开或关闭弹窗
function syncPopupState () {
  if (!fullQueryKey.value) return
  
  const exist = existQueryKey()
  // 主动关闭弹窗
  if (!exist && dialogVisible.value) {
    dialogVisible.value = false
  }
  // 主动打开弹窗
  if (exist && !dialogVisible.value) {
    dialogVisible.value = true
  }
}

watch(dialogVisible, (val) => {
  val ? onOpen() : onClose()
})

watch(() => fullQueryKey.value, () => {
  console.warn(`[HistoryPopup] 传入属性值 queryKey: ${fullQueryKey.value} 不建议修改`)
})

watch(() => route.query, syncPopupState, {
  immediate: true
})
// setTimeout(() => {
//   watch(() => route.query, syncPopupState, {
//     immediate: true
//   })
// })
</script>

<style lang='less' scoped>

</style>