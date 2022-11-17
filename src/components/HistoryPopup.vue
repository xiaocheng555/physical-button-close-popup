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

<style lang='less' scoped>

</style>