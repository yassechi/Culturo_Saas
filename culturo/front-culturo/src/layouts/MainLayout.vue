<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': !sidebarOpen }">
    <!-- Fond semi-transparent mobile (tiroir ouvert) -->
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="toggleSidebar" />

    <aside class="sidebar" :class="{ 'sidebar-is-open': sidebarOpen }">
      <!-- Bouton fermer — visible uniquement sur mobile, dans la sidebar -->
      <button class="sidebar-close-btn" type="button" aria-label="Fermer la navigation" @click="toggleSidebar">
        <span class="toggle-bar" />
        <span class="toggle-bar" />
        <span class="toggle-bar" />
      </button>

      <div class="brand-block">
        <span class="eyebrow">Plateforme de planification</span>
        <div class="brand-title">
          <h1>Culturo</h1>
          <img src="/Logo.svg" alt="Logo Culturo" class="brand-logo" />
        </div>
        <span class="role-pill">{{ auth.user?.role ?? 'invite' }}</span>
      </div>

      <nav class="nav-list" aria-label="Navigation principale">
        <RouterLink class="nav-link" to="/dashboard">
          <span class="nav-icon" v-html="navIconMap['/dashboard']" />
          <span class="nav-label">Accueil</span>
        </RouterLink>

        <template v-for="item in navItems" :key="item.to">
          <RouterLink class="nav-link" :to="item.to">
            <span class="nav-icon" v-html="navIconMap[item.to]" />
            <span class="nav-label">{{ item.label }}</span>
            <span v-if="item.badge && item.badge.value > 0" class="nav-badge">
              {{ item.badge.value }}
            </span>
          </RouterLink>
        </template>
      </nav>

      <p class="nav-note">
        Session connectée pour <strong>{{ auth.user?.email ?? 'aucun compte' }}</strong>.
      </p>

      <button class="secondary-button" type="button" @click="handleLogout">
        Déconnexion
      </button>
    </aside>

    <section class="content-shell">
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="sidebar-toggle"
            :class="{ 'sidebar-toggle-hidden-mobile': sidebarOpen }"
            type="button"
            :aria-label="sidebarOpen ? 'Masquer la navigation' : 'Afficher la navigation'"
            :title="sidebarOpen ? 'Masquer la navigation' : 'Afficher la navigation'"
            @click="toggleSidebar"
          >
            <span class="toggle-bar" />
            <span class="toggle-bar" />
            <span class="toggle-bar" />
          </button>
          <div>
            <span class="eyebrow">Culturo SaaS</span>
            <h2>{{ route.meta.title ?? 'Tableau de bord' }}</h2>
          </div>
        </div>
        <div class="topbar-right">
          <Transition name="fade">
            <span v-if="isNavigating" class="nav-spinner" aria-label="Chargement en cours" />
          </Transition>
          <NotificationBell />
        </div>
      </header>

      <slot />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useObservationsStore } from '@/stores/observations';
import NotificationBell from '@/components/NotificationBell.vue';

const route = useRoute();

const router = useRouter();
const auth = useAuthStore();
const observationsStore = useObservationsStore();

onMounted(() => {
  if (auth.isFormateur || auth.isAdmin) {
    void observationsStore.loadPendingCount();
  }
  if (auth.isStagiaire) {
    void observationsStore.loadMyObservations();
  }
});

const pendingValidationCount = computed(() =>
  (auth.isFormateur || auth.isAdmin) ? observationsStore.pendingCount : 0,
);

const reviewedObservationCount = computed(() =>
  auth.isStagiaire ? observationsStore.myStats.unseen : 0,
);

const SIDEBAR_KEY = 'culturo:sidebar-open';

function getInitialSidebarState(): boolean {
  const stored = localStorage.getItem(SIDEBAR_KEY);
  if (stored !== null) return stored !== 'false';
  return window.innerWidth > 920;
}

const sidebarOpen = ref(getInitialSidebarState());

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
  localStorage.setItem(SIDEBAR_KEY, String(sidebarOpen.value));
}

const navIconMap: Record<string, string> = {
  '/dashboard':
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  '/admin/utilisateurs':
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  '/admin/botanique':
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C12 7 7 4 3 6c0 4 3 8 9 6"/><path d="M12 12c0-5 5-8 9-6 0 4-3 8-9 6"/></svg>',
  '/admin/sol-planches':
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  '/plan':
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  '/recoltes':
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>',
  '/arrosages':
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
  '/amendements':
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 3v5L4 19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1L14 8V3"/><line x1="6" y1="14" x2="18" y2="14"/></svg>',
  '/traitements':
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  '/historique':
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  '/observations':
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  '/validation':
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  '/formateur/tableau-de-bord':
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  '/admin/configuration':
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 19.07l-1.41 1.41M22 12h-2M4 12H2M19.07 19.07l-1.41-1.41M4.93 4.93l-1.41 1.41M12 22v-2M12 4V2"/></svg>',
};

const navItems = computed(() => {
  if (auth.isAdmin) {
    return [
      { to: '/admin/utilisateurs', label: 'Utilisateurs' },
      { to: '/admin/botanique', label: 'Référentiel botanique' },
      { to: '/admin/sol-planches', label: 'Sol & planches' },
      { to: '/plan', label: 'Planification' },
      { to: '/recoltes', label: 'Récoltes' },
      { to: '/arrosages', label: 'Arrosages' },
      { to: '/amendements', label: 'Fertilisations' },
      { to: '/traitements', label: 'Traitements' },
      { to: '/historique', label: 'Historique' },
      { to: '/admin/configuration', label: 'Configuration' },
    ];
  }

  if (auth.isFormateur) {
    return [
      { to: '/admin/utilisateurs', label: 'Utilisateurs' },
      { to: '/admin/botanique', label: 'Référentiel botanique' },
      { to: '/admin/sol-planches', label: 'Sol & planches' },
      { to: '/plan', label: 'Planification' },
      { to: '/recoltes', label: 'Récoltes' },
      { to: '/arrosages', label: 'Arrosages' },
      { to: '/amendements', label: 'Fertilisations' },
      { to: '/traitements', label: 'Traitements' },
      { to: '/historique', label: 'Historique' },
      { to: '/observations', label: 'Observations' },
      { to: '/validation', label: 'Validation', badge: pendingValidationCount },
      { to: '/formateur/tableau-de-bord', label: 'Tableau de bord formateur' },
    ];
  }

  return [
    { to: '/admin/botanique', label: 'Référentiel botanique' },
    { to: '/plan', label: 'Planification' },
    { to: '/recoltes', label: 'Récoltes' },
    { to: '/arrosages', label: 'Arrosages' },
    { to: '/amendements', label: 'Fertilisations' },
    { to: '/traitements', label: 'Traitements' },
    { to: '/historique', label: 'Historique' },
    { to: '/observations', label: 'Mes observations', badge: reviewedObservationCount },
  ];
});

const isNavigating = ref(false);
let hideTimer: ReturnType<typeof setTimeout>;
const removeBeforeHook = router.beforeEach(() => {
  clearTimeout(hideTimer);
  isNavigating.value = true;
});
const removeAfterHook = router.afterEach(() => {
  hideTimer = setTimeout(() => { isNavigating.value = false; }, 300);
});
onUnmounted(() => { removeBeforeHook(); removeAfterHook(); clearTimeout(hideTimer); });

// Fermer le tiroir automatiquement après navigation sur mobile
watch(() => route.fullPath, () => {
  if (window.innerWidth <= 920) {
    sidebarOpen.value = false;
    localStorage.setItem(SIDEBAR_KEY, 'false');
  }
});


function handleLogout() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>

<style scoped>
.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-spinner {
  display: inline-block;
  width: 1.35rem;
  height: 1.35rem;
  border: 2.5px solid rgba(39, 65, 53, 0.15);
  border-top-color: var(--brand-olive);
  border-radius: 50%;
  animation: nav-spin 0.65s linear infinite;
  flex-shrink: 0;
}

@keyframes nav-spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.nav-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 160ms;
}

.nav-label {
  flex: 1;
}

.nav-link:hover .nav-icon,
.nav-link.router-link-active .nav-icon {
  opacity: 1;
}

.nav-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #e53935;
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  line-height: 1;
  margin-left: auto;
  flex-shrink: 0;
}

.sidebar .secondary-button {
  color: rgba(248, 242, 227, 0.88);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  width: 100%;
}

.sidebar .secondary-button:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}
</style>
