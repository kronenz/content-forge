import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import DashboardPage from './DashboardPage.vue'
import PipelineListPage from './PipelineListPage.vue'
import MaterialDetailPage from './MaterialDetailPage.vue'
import StyleSelector from './StyleSelector.vue'
import StyleA_Dashboard from './StyleA_Dashboard.vue'
import StyleB_Dashboard from './StyleB_Dashboard.vue'
import StyleC_Dashboard from './StyleC_Dashboard.vue'
import StyleD_Dashboard from './StyleD_Dashboard.vue'
import StyleE_Dashboard from './StyleE_Dashboard.vue'
import StyleF_Dashboard from './StyleF_Dashboard.vue'
import StyleG_Dashboard from './StyleG_Dashboard.vue'
import StyleH_Dashboard from './StyleH_Dashboard.vue'
import StyleI_Dashboard from './StyleI_Dashboard.vue'
import StyleJ_Dashboard from './StyleJ_Dashboard.vue'
import StyleK_Dashboard from './StyleK_Dashboard.vue'
import StyleL_Dashboard from './StyleL_Dashboard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: DashboardPage },
    { path: '/pipelines', component: PipelineListPage },
    { path: '/materials/:id', component: MaterialDetailPage },
    { path: '/styles', component: StyleSelector },
    { path: '/style-a', component: StyleA_Dashboard },
    { path: '/style-b', component: StyleB_Dashboard },
    { path: '/style-c', component: StyleC_Dashboard },
    { path: '/style-d', component: StyleD_Dashboard },
    { path: '/style-e', component: StyleE_Dashboard },
    { path: '/style-f', component: StyleF_Dashboard },
    { path: '/style-g', component: StyleG_Dashboard },
    { path: '/style-h', component: StyleH_Dashboard },
    { path: '/style-i', component: StyleI_Dashboard },
    { path: '/style-j', component: StyleJ_Dashboard },
    { path: '/style-k', component: StyleK_Dashboard },
    { path: '/style-l', component: StyleL_Dashboard },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

createApp(App).use(router).mount('#app')
