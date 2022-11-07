import { createApp } from 'vue'
import Router from './router'
import App from './App.vue'
import 'vant/lib/index.css'
import { Cell, CellGroup, Overlay, NavBar, Button, Icon, Card, ActionBar, ActionBarIcon, ActionBarButton, AddressList, AddressEdit } from 'vant'

const app = createApp(App)
app.use(Router)
app.use(NavBar)
app.use(ActionBar)
app.use(ActionBarIcon)
app.use(ActionBarButton)
app.use(Icon)
app.use(Card)
app.use(Button)
app.use(Overlay)
app.use(Cell)
app.use(CellGroup)
app.use(AddressList)
app.use(AddressEdit)

app.mount('#app')