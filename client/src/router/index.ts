import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/Login.vue'),
    },
    {
      path: '/',
      redirect: () => {
        const token = localStorage.getItem('token')
        return token ? '/dashboard' : '/login'
      },
    },
    {
      path: '',
      component: () => import('@/components/layout/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/pages/Dashboard.vue'),
        },
        {
          path: 'admin/users',
          name: 'UserManagement',
          component: () => import('@/pages/admin/UserManagement.vue'),
        },
        {
          path: 'admin/employees',
          name: 'EmployeeManagement',
          component: () => import('@/pages/admin/EmployeeManagement.vue'),
        },
        {
          path: 'vacaciones/solicitar',
          name: 'VacationRequest',
          component: () => import('@/pages/vacaciones/VacationRequest.vue'),
        },
        {
          path: 'rh/reportes',
          name: 'Reports',
          component: () => import('@/pages/rh/Reports.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/pages/NotFound.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && token) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
