<template>
  <section class="page-grid">
    <article class="dashboard-card">
      <span class="eyebrow">Session active</span>
      <h3>Bonjour {{ displayName }}</h3>
      <p>
        Le frontend est maintenant autonome dans <code>Culturo_Saas</code> et adapte
        deja la navigation selon le role connecte.
      </p>
    </article>

    <div class="dashboard-grid">
      <article class="dashboard-card">
        <span class="stat-line">{{ auth.user?.role ?? 'inconnu' }}</span>
        <p>Role courant injecte depuis la reponse de connexion.</p>
      </article>

      <article class="dashboard-card">
        <span class="stat-line">{{ auth.token ? 'JWT' : 'N/A' }}</span>
        <p>Token stocke cote client et renvoye sur chaque appel API.</p>
      </article>

      <article class="dashboard-card">
        <span class="stat-line">403</span>
        <p>Les routes interdites redirigent vers la page d'acces refuse.</p>
      </article>
    </div>

    <article class="dashboard-card">
      <h3>Ce que cette base debloque</h3>
      <ul class="feature-list">
        <li>Vue 3 + Pinia + Router dans le repo racine.</li>
        <li>Connexion utilisateur sans modifier le repo API.</li>
        <li>Navigation protegee pour admin, formateur et stagiaire.</li>
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
