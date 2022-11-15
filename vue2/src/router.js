import Vue from 'vue'
import Router from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('./views/Home.vue')
  },
  {
    path: '/detail',
    name: 'detail',
    component: () => import('./views/Detail.vue')
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('./views/About.vue')
  }
]

Vue.use(Router)

const router = new Router({
  // mode: 'history',
  routes
})

export default router