<template>
  <van-popup v-model="dialogVisible" v-bind="$attrs">
    <slot></slot>
  </van-popup>
</template>

<script>
import HistoryPopup from '../mixins/history-popup.js'

export default {
  name: 'HistoryPopup',
  mixins: [HistoryPopup]
}
</script>

<style lang='less' scoped>

</style>