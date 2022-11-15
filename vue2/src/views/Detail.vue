<template>
  <div class="detail-page">
    <van-nav-bar title="精美挂件" left-arrow @click-left="back" />
    <img class="banner" :src="img1" alt="">
    <h2 class="title">精美挂件</h2>
    <p class="desc">Q版鸡你太美钥匙扣挂件姬霓太美基尼太美钥匙扣ikun</p>
    <!-- <van-goods-action>
  <van-goods-action-icon icon="chat-o" text="客服" />
  <van-goods-action-icon icon="cart-o" text="购物车" />
  <van-goods-action-icon icon="shop-o" text="店铺" />
  <van-goods-action-button
    type="danger"
    text="立即购买"
  />
</van-goods-action> -->
    <van-goods-action>
      <van-goods-action-icon icon="shop-o" text="店铺" />
      <van-goods-action-icon icon="chat-o" text="客服" />
      <van-goods-action-icon icon="star-o" text="收藏" />
      <van-goods-action-button type="danger" text="加入购物车" @click="visible = !visible" />
    </van-goods-action>
    <HistoryPopup queryKey="popup" v-model="visible" position="bottom">
      <div class="popup-content">
        <img class="popup-img" :src="img1" @click="previw = true">
        <span class="popup-price">¥14.80</span>
        <van-cell title="选择地址" is-link :value="addressId ? list[0].address : ''" @click="addressVisible = true" />
        <p>服务保障：7天无理由</p>
        <p>颜色分类：鸡你太美钥匙扣1个 高质量版本  ¥14.80</p>
        <p>购买数量：1</p>
        <router-link style="font-size: 13px;" to="/about">服务说明</router-link>
        <van-button class="popup-btn" color="linear-gradient(to right, #ff6034, #ee0a24)" block round @click="addToCart">确定</van-button>
      </div>
    </HistoryPopup>
    <HistoryPopup :query-extends="{test: true}" queryKey="preview" v-model="previw">
      <div class="preview">
        <img class="preview-img" :src="img1">
        <router-link class="preview-link" to="/about">服务说明</router-link>
      </div>
    </HistoryPopup>
    <HistoryPopup style="top: 0;" queryKey="address" v-model="addressVisible" position="bottom">
      <van-nav-bar title="选择收货地址" left-arrow @click-left="closeAddress" />
      <van-address-list
        v-model="addressId"
        :list="list"
        @select="addressVisible = false"
      />
    </HistoryPopup>
  </div>
</template>

<script>
import HistoryPopup from '@/components/HistoryPopup.vue'
import img1 from '@/assets/imgs/1.jpg'

export default {
  name: 'home',
  components: {
    HistoryPopup
  },
  data () {
    return {
      img1,
      visible: false,
      previw: false,
      addressId: '',
      addressVisible: false,
      list: [
        {
          id: '1',
          name: '张三',
          tel: '13000000000',
          address: '浙江省杭州市西湖区文三路 138 号东方通信大厦 7 楼 501 室',
          isDefault: true,
        }
      ]
    }
  },
  methods: {
    back () {
      this.$router.back()
    },

    addToCart () {
      this.visible = false 
      this.$toast('添加成功')
    },

    closeAddress () {
      if (!window.history.state?.back) {
        this.addressVisible = false
      } else {
        this.$router.back()
      }
    }
  }
}
</script>

<style lang='less' scoped>
.banner {
  width: 100%;
}
.title {
  font-size: 16px;
  padding: 0 15px;
  margin-top: 15px;
  margin-bottom: 10px;
}
.desc {
  font-size: 13px;
  padding: 0 15px;
}
.popup-content {
  padding: 15px;
  p {
    font-size: 14px;
    color: #999;
    margin: 10px 0;
  }
}
.popup-img {
  width: 70px;
  height: 70px;
  margin-bottom: 20px;
}
.popup-price {
  font-size: 18px;
  margin: 20px;
  vertical-align: top;
  color: red;
}
.popup-btn {
  margin-top: 150px;
}
.preview {
  width: 100vw;
  text-align: center;
}
.preview-img {
  width: 100%;
}
.preview-link {
  font-weight: 900; 
  font-size: 16px; 
}
</style>