import Vue from 'vue'
import App from '../view/popup.vue'
import '../assets/css/app.scss'
import '../assets/css/style.css'

Vue.config.productionTip = false

new Vue({
  render: (h) => h(App)
}).$mount('#app')
