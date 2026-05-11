<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': !sidebarOpen }">
    <aside class="sidebar">
      <div class="brand-block">
        <span class="eyebrow">Plateforme de planification</span>
        <h1>Culturo</h1>
        <span class="role-pill">{{ auth.user?.role ?? 'invite' }}</span>
      </div>

      <nav class="nav-list" aria-label="Navigation principale">
        <RouterLink class="nav-link" to="/dashboard">Accueil</RouterLink>

        <template v-for="item in navItems" :key="item.to">
          <RouterLink class="nav-link" :to="item.to">
            <span>{{ item.label }}</span>
            <small>{{ item.caption }}</small>
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
        <button class="ghost-button" type="button" @click="handleRefresh">
          Rafraîchir le profil
        </button>
      </header>

      <slot />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

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
      { to: '/admin/utilisateurs', label: 'Utilisateurs', caption: 'Phase 6' },
      { to: '/admin/botanique', label: 'Referentiel botanique', caption: 'Phase 2' },
      { to: '/admin/sol-planches', label: 'Sol & planches', caption: 'Phase 3' },
      { to: '/plan', label: 'Planification', caption: 'Phase 4' },
      { to: '/recoltes', label: 'Récoltes', caption: 'Phase 4' },
      { to: '/arrosages', label: 'Arrosages', caption: 'Phase 4' },
      { to: '/amendements', label: 'Amendements', caption: 'Phase 4' },
      { to: '/traitements', label: 'Traitements', caption: 'Phase 4' },
      { to: '/historique', label: 'Historique', caption: 'Phase 5' },
      { to: '/admin/configuration', label: 'Configuration', caption: 'Fondation' },
    ];
  }

  if (auth.isFormateur) {
    return [
      { to: '/plan', label: 'Planification', caption: 'Phase 4' },
      { to: '/recoltes', label: 'Récoltes', caption: 'Phase 4' },
      { to: '/arrosages', label: 'Arrosages', caption: 'Phase 4' },
      { to: '/amendements', label: 'Amendements', caption: 'Phase 4' },
      { to: '/traitements', label: 'Traitements', caption: 'Phase 4' },
      { to: '/validation', label: 'Validation', caption: 'Phase 6' },
      { to: '/historique', label: 'Historique', caption: 'Phase 5' },
      {
        to: '/formateur/tableau-de-bord',
        label: 'Tableau de bord formateur',
        caption: 'Phase 6',
      },
    ];
  }

  return [
    { to: '/plan-culture', label: 'Plan de culture', caption: 'Phase 4' },
    { to: '/arrosages', label: 'Arrosages', caption: 'Phase 4' },
    { to: '/observations', label: 'Mes observations', caption: 'Phase 5' },
  ];
});

function handleLogout() {
  auth.logout();
  router.push({ name: 'login' });
}

async function handleRefresh() {
  try {
    await auth.fetchCurrentUser();
  } catch {
    auth.logout();
    router.push({ name: 'login' });
  }
}
</script>
