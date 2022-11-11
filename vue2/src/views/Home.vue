<template>
  <div>
    <van-nav-bar title="首页">
      <template #right>
        <van-icon name="search" size="18" />
      </template>
    </van-nav-bar>
    <div>
      <router-link to="/detail">
        <van-card
          price="12.80"
          desc="Q版鸡你太美钥匙扣挂件姬霓太美基尼太美钥匙扣ikun"
          title="精美挂件"
          :thumb="img1"
        />
      </router-link>
    </div>
  </div>
</template>

<script>
import img1 from '@/assets/imgs/1.jpg'

export default {
  name: 'home',
  data () {
    return {
      img1
    }
  }
}
</script>

<style lang='less' scoped>
</style>