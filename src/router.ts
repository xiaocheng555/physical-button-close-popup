import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
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

export default createRouter({
  history: createWebHashHistory(),
  routes
})