import { computed, watch, getCurrentInstance, onMounted, onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface HistoryPopupProps {
  modelValue?: boolean,
  queryKey?: string,
  queryValue?: number | string | boolean,
  queryExtends: object,
  defaultCloseOnNoBack: boolean,
  defaultCloseOnMount: boolean,
  [index: string]: any,
}

export const historyPopupProps = {
  // v-model 控制弹窗显示和隐藏
  modelValue: {
    type: Boolean,
    default: false
  },
  // query的key值（url的 ?querykey=queryValue）
  queryKey: {
    type: String
  },
  // query的value值（url的 ?querykey=queryValue）
  queryValue: {
    type: [Number, String, Boolean],
    default: true
  },
  // 扩展query参数
  queryExtends: {
    type: Object,
    default: {}
  },
  // 没有返回页时，不默认打开弹窗（场景：弹窗打开时的链接在新窗口打开，新页面不需要弹窗打开，则弹窗保持关闭并将链接上的queryKey给去除）
  defaultCloseOnNoBack: {
    type: Boolean,
    default: false
  },
  // 初次挂载时，不默认打开弹窗（场景：弹窗打开时刷新页面，不需要立即打开弹窗，可能需要先获取数据，等获取完数据后，用户再手动去打开弹窗）
  defaultCloseOnMount: {
    type: Boolean,
    default: false
  }
}

// 设置 history.state 的值
function setHistoryState (state: any) {
  history.replaceState({
    ...history.state,
    ...state
  }, '')
}


/* 
 * @params: prefix - 统一前缀
 */
export default function useHistoryPopup (prefix?: string) {
  const instance = getCurrentInstance()
  if (!instance) throw new Error('getCurrentInstance is null')

  const router = useRouter()
  const route = useRoute()
  const { emit } = instance
  const props = instance.props as HistoryPopupProps
  let mounted = false

  // 控制弹窗显示
  const dialogVisible = computed({
    get() {
      return props.modelValue
    },
    set(val) {
      emit('update:modelValue', val)
    }
  })
  // 完整 queryKey
  const fullQueryKey = computed(() => {
    return props.queryKey && (prefix || '') + props.queryKey
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
      if (fullQueryKey.value) newQuery[fullQueryKey.value] = props.queryValue?.toString?.() || ''
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
  function onQueryChange () {
    if (!fullQueryKey.value) return
    
    const exist = existQueryKey()
    // 主动关闭弹窗
    if (!exist && dialogVisible.value) {
      dialogVisible.value = false
    }
    // 主动打开弹窗
    if (exist && !dialogVisible.value) {
      // 没有返回页时，不默认打开弹窗
      if (props.defaultCloseOnNoBack && !window.history.state?.back) {
        removeQuery()
        return
      }
      // 初次挂载时，不默认打开弹窗
      if (props.defaultCloseOnMount && !mounted) {
        return
      }
      dialogVisible.value = true
    }
  }

  watch(dialogVisible, (val) => {
    val ? onOpen() : onClose()
  })

  watch(() => fullQueryKey.value, () => {
    console.warn(`[HistoryPopup] 传入属性值 queryKey: ${fullQueryKey.value} 不建议修改`)
  })
  
  watch(() => route.query, onQueryChange, {
    immediate: true
  })
  
  onBeforeMount(() => {
    dialogVisible.value && onOpen()
  })
  
  onMounted(() => {
    mounted = true
  })
  
  return {
    dialogVisible
  }
}