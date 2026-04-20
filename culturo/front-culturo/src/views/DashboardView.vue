<template>
  <section class="page-grid">
    <article class="dashboard-card">
      <span class="eyebrow">Tableau de bord</span>
      <h3>Bienvenue, {{ displayName }}</h3>
      <p>Role : <strong>{{ auth.user?.role ?? 'inconnu' }}</strong></p>
      <p>
        La session est ouverte avec un token JWT et la navigation s'adapte
        automatiquement au role connecte.
      </p>
    </article>

    <div class="dashboard-grid">
      <article class="dashboard-card">
        <span class="stat-line">{{ auth.user?.role ?? 'inconnu' }}</span>
        <p>Role courant injecte depuis la reponse de connexion.</p>
      </article>

      <article class="dashboard-card">
        <span class="stat-line">{{ auth.token ? 'JWT actif' : 'N/A' }}</span>
        <p>Le token est stocke cote client et renvoye sur chaque appel API.</p>
      </article>

      <article class="dashboard-card">
        <span class="stat-line">403</span>
        <p>Les routes interdites redirigent vers la page d'acces refuse.</p>
      </article>
    </div>

    <article class="dashboard-card">
      <h3>Actions disponibles</h3>

      <ul v-if="auth.isAdmin" class="feature-list">
        <li><RouterLink to="/admin/utilisateurs">Gerer les utilisateurs</RouterLink></li>
        <li><RouterLink to="/plan">Planification</RouterLink></li>
      </ul>

      <ul v-else-if="auth.isFormateur" class="feature-list">
        <li><RouterLink to="/plan">Planification</RouterLink></li>
      </ul>

      <ul v-else-if="auth.isStagiaire" class="feature-list">
        <li><RouterLink to="/observations">Mes observations</RouterLink></li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

const displayName = computed(() => {
  const firstName = auth.user?.firstName?.trim();

  if (firstName) {
    return firstName;
  }

  return auth.user?.email ?? 'a toi';
});
</script>
