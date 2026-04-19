<template>
  <section class="placeholder-card forbidden-card">
    <span class="placeholder-meta">403</span>
    <h3>Acces refuse</h3>
    <p>
      Cette page existe bien, mais ton role actuel ne possede pas les permissions
      necessaires pour y acceder.
    </p>
    <p>
      Role detecte : <strong>{{ auth.user?.role ?? 'non connecte' }}</strong>
    </p>
    <RouterLink class="primary-button" to="/dashboard">Retour au tableau de bord</RouterLink>
  </section>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>
