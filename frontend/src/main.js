import Vue from 'vue'
import VueRouter from 'vue-router'
import ElementPlugin from './plugins/element'
import router from './router'
import App from './App.vue'
import './styles/main.scss'

Vue.use(VueRouter)
Vue.use(ElementPlugin)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
