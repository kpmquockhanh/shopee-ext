import Vue from 'vue'
import App from '../view/popup.vue'
import Antv from 'antv'
import 'antv/dist/antv.css'
import 'antd-css-utilities/utility.min.css'

Vue.use(Antv)
Vue.config.productionTip = false

new Vue({
  render: (h) => h(App)
}).$mount('#app')
