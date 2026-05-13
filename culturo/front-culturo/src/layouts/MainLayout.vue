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
        <RouterLink class="nav-link" to="/dashboard">Accueil</RouterLink>

        <template v-for="item in navItems" :key="item.to">
          <RouterLink class="nav-link" :to="item.to">{{ item.label }}</RouterLink>
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
import { computed, ref, watch, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import NotificationBell from '@/components/NotificationBell.vue';

const route = useRoute();

const router = useRouter();
const auth = useAuthStore();

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
      { to: '/admin/botanique', label: 'Référentiel botanique' },
      { to: '/admin/sol-planches', label: 'Sol & planches' },
      { to: '/plan', label: 'Planification' },
      { to: '/recoltes', label: 'Récoltes' },
      { to: '/arrosages', label: 'Arrosages' },
      { to: '/amendements', label: 'Fertilisations' },
      { to: '/traitements', label: 'Traitements' },
      { to: '/historique', label: 'Historique' },
      { to: '/observations', label: 'Observations' },
      { to: '/validation', label: 'Validation' },
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
    { to: '/observations', label: 'Mes observations' },
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
