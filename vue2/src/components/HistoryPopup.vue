<template>
  <van-popup v-model="dialogVisible" v-bind="$attrs" :lock-scroll="false">
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