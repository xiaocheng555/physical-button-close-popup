function setHistoryState (state) {
  history.replaceState({
    ...history.state,
    ...state
  }, '')
}

let mounted = false

export default {
  props: {
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
      type: Object
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
      return window.history.state?.popupKey === this.queryKey
    },
    // 添加query参数
    async addQuery () {
      if (!this.existQueryKey()) {
        const newQuery = { ... this.$route.query, ...this.queryExtends }
        if (this.queryKey) newQuery[this.queryKey] = this.queryValue?.toString?.()
        await this.$router.push({
          query: newQuery
        })
        setHistoryState({
          popupKey: this.queryKey
        })
      }
    },
    // 移除query参数
    removeQuery () {
      if (this.queryKey && this.existQueryKey()) {
        const newQuery = { ... this.$route.query }
        delete newQuery[this.queryKey]
        for (let key in this.queryExtends) {
          delete newQuery[key]
        }
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
          // 没有返回页时，不默认打开弹窗
          if (this.defaultCloseOnNoBack && !window.history.state?.popupKey) {
            this.removeQuery()
            return
          }
          // 初次挂载时，不默认打开弹窗
          if (this.defaultCloseOnMount && !mounted) {
            return
          }
          this.dialogVisible = true
        }
      }
    }
  },
  created () {
    this.dialogVisible && this.onOpen()
  },
  mounted () {
    mounted = true
  }
}