import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'projects',
      component: () => import('@/pages/ProjectListPage.vue'),
    },
    {
      path: '/projects/:id',
      name: 'editor',
      component: () => import('@/pages/ProjectEditorPage.vue'),
      props: true,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/pages/DashboardPage.vue'),
    },
    {
      path: '/marketplace',
      name: 'marketplace',
      component: () => import('@/pages/MarketplacePage.vue'),
    },
  ],
});

export default router;
