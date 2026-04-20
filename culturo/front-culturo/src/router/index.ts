import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore, type UserRole } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false, layout: 'auth' },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true, layout: 'main', title: 'Tableau de bord' },
    },
    {
      path: '/admin/utilisateurs',
      name: 'admin-users',
      component: () => import('@/views/AdminUsersView.vue'),
      meta: { requiresAuth: true, roles: ['admin'], layout: 'main', title: 'Gestion des utilisateurs' },
    },
    {
      path: '/admin/botanique',
      name: 'admin-botanique',
      component: () => import('@/views/BotanicalCatalogView.vue'),
      meta: { requiresAuth: true, roles: ['admin'], layout: 'main', title: 'Référentiel botanique' },
    },
    {
      path: '/admin/sol-planches',
      name: 'admin-soil-boards',
      component: () => import('@/views/SoilBoardsView.vue'),
      meta: { requiresAuth: true, roles: ['admin'], layout: 'main', title: 'Sol & Planches' },
    },
    {
      path: '/historique',
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
      meta: { requiresAuth: true, roles: ['admin', 'formateur'], layout: 'main', title: 'Historique' },
    },
    {
      path: '/admin/configuration',
      name: 'admin-config',
      component: () => import('@/views/ConfigurationView.vue'),
      meta: { requiresAuth: true, roles: ['admin'], layout: 'main', title: 'Configuration' },
    },
    {
      path: '/plan',
      alias: ['/planification'],
      name: 'planning',
      component: () => import('@/views/PlanningView.vue'),
      meta: { requiresAuth: true, roles: ['admin', 'formateur'], layout: 'main', title: 'Planification' },
    },
    {
      path: '/validation',
      name: 'validation',
      component: () => import('@/views/ValidationView.vue'),
      meta: { requiresAuth: true, roles: ['formateur'], layout: 'main', title: 'Validation des saisies' },
    },
    {
      path: '/formateur/tableau-de-bord',
      name: 'trainer-dashboard',
      component: () => import('@/views/TrainerDashboardView.vue'),
      meta: { requiresAuth: true, roles: ['formateur'], layout: 'main', title: 'Tableau de bord formateur' },
    },
    {
      path: '/plan-culture',
      name: 'culture-plan',
      component: () => import('@/views/CulturePlanView.vue'),
      meta: { requiresAuth: true, roles: ['stagiaire'], layout: 'main', title: 'Plan de culture' },
    },
    {
      path: '/observations',
      name: 'observations',
      component: () => import('@/views/ObservationsView.vue'),
      meta: { requiresAuth: true, roles: ['stagiaire'], layout: 'main', title: 'Mes observations' },
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/views/ForbiddenView.vue'),
      meta: { requiresAuth: false, layout: 'auth' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' };
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' };
  }

  if (to.meta.requiresAuth && auth.isAuthenticated && !auth.user) {
    try {
      await auth.fetchCurrentUser();
    } catch {
      auth.logout();
      return { name: 'login' };
    }
  }

  const requiredRoles = to.meta.roles as UserRole[] | undefined;

  if (requiredRoles && auth.user && !requiredRoles.includes(auth.user.role)) {
    return { name: 'forbidden' };
  }

  return true;
});

export default router;
