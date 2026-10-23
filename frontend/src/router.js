import VueRouter from 'vue-router'
import ItemDetailView from './views/ItemDetailView.vue'
import QueueView from './views/QueueView.vue'
import SubmitItemView from './views/SubmitItemView.vue'

export const routes = [
  {
    path: '/',
    name: 'queue',
    component: QueueView,
    children: [
      {
        path: 'items/:id(\\d+)',
        name: 'item',
        component: ItemDetailView,
        props: route => ({ id: Number(route.params.id) })
      }
    ]
  },
  { path: '/submit', name: 'submit', component: SubmitItemView },
  { path: '*', redirect: '/' }
]

export default new VueRouter({ mode: 'history', routes })
