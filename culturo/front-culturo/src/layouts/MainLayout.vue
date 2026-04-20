<template>
  <div class="app-shell">
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
        <div>
          <span class="eyebrow">Culturo SaaS</span>
          <h2>{{ route.meta.title ?? 'Tableau de bord' }}</h2>
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
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();

const router = useRouter();
const auth = useAuthStore();

const navItems = computed(() => {
  if (auth.isAdmin) {
    return [
      { to: '/admin/utilisateurs', label: 'Utilisateurs', caption: 'Phase 6' },
      { to: '/admin/botanique', label: 'Referentiel botanique', caption: 'Phase 2' },
      { to: '/admin/sol-planches', label: 'Sol & planches', caption: 'Phase 3' },
      { to: '/plan', label: 'Planification', caption: 'Phase 4' },
      { to: '/historique', label: 'Historique', caption: 'Phase 5' },
      { to: '/admin/configuration', label: 'Configuration', caption: 'Fondation' },
    ];
  }

  if (auth.isFormateur) {
    return [
      { to: '/plan', label: 'Planification', caption: 'Phase 4' },
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
