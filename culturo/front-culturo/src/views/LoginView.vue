<template>
  <section class="auth-card">
    <span class="eyebrow">Culturo SaaS</span>
    <h1 class="hero-title">Bienvenue sur Culturo.</h1>
    <p>Connectez-vous pour accéder à votre espace de gestion maraîchère.</p>

    <form class="auth-form" @submit.prevent="handleLogin">
      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="form.email"
          autocomplete="email"
          required
          type="email"
        />
      </div>

      <div class="field">
        <label for="password">Mot de passe</label>
        <input
          id="password"
          v-model="form.password"
          autocomplete="current-password"
          required
          type="password"
        />
      </div>

      <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

      <button class="primary-button" type="submit" :disabled="loading">
        {{ loading ? 'Connexion...' : 'Se connecter' }}
      </button>

      <RouterLink to="/mot-de-passe-oublie" class="forgot-link">
        Mot de passe oublié ?
      </RouterLink>
    </form>

    <p class="auth-hint">
      Accès réservé aux membres de l'exploitation. Contactez votre administrateur en cas de problème de connexion.
    </p>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const form = reactive({
  email: '',
  password: '',
});

const loading = ref(false);
const errorMessage = ref('');

async function handleLogin() {
  loading.value = true;
  errorMessage.value = '';

  try {
    await auth.login(form.email, form.password);
    await router.push({ name: 'dashboard' });
  } catch {
    errorMessage.value =
      'Identifiants incorrects. Verifie ton email et ton mot de passe.';
  } finally {
    loading.value = false;
  }
}
</script>
