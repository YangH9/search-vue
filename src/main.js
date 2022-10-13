import Vue from 'vue'
import App from './App.vue'
import 'element-ui/lib/theme-chalk/index.css'
import { Checkbox, CheckboxGroup, Icon } from "element-ui";

Vue.config.productionTip = false
Vue.use(Checkbox)
Vue.use(CheckboxGroup)
Vue.use(Icon)

new Vue({
  render: h => h(App),
}).$mount('#app')
