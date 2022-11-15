<template>
  <van-popup v-model="dialogVisible" v-bind="$attrs">
    <slot></slot>
  </van-popup>
</template>

<script>
function setHistoryState (state) {
  history.replaceState({
    ...history.state,
    ...state
  }, '')
}

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
    },
    // 扩展query参数
    queryExtends: {
      type: Object
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
          this.dialogVisible = true
        }
      }
    }
  }
}
</script>

<style lang='less' scoped>

</style>