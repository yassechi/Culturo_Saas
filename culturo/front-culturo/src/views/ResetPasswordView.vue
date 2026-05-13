<template>
  <section class="auth-card">
    <span class="eyebrow">Culturo SaaS</span>
    <h1 class="hero-title">Nouveau mot de passe</h1>

    <!-- Token manquant -->
    <template v-if="!token">
      <p class="error-banner">
        Lien invalide. Veuillez refaire une demande de réinitialisation.
      </p>
      <p class="auth-hint">
        <RouterLink to="/mot-de-passe-oublie">Demander un nouveau lien</RouterLink>
      </p>
    </template>

    <!-- Formulaire -->
    <template v-else-if="!done">
      <p>Choisissez un nouveau mot de passe pour votre compte.</p>
      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="password">Nouveau mot de passe</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="6"
            placeholder="Au moins 6 caractères"
          />
        </div>

        <div class="field">
          <label for="confirm">Confirmer le mot de passe</label>
          <input
            id="confirm"
            v-model="confirm"
            type="password"
            autocomplete="new-password"
            required
            placeholder="Répétez le mot de passe"
          />
        </div>

        <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? 'Enregistrement...' : 'Enregistrer le mot de passe' }}
        </button>
      </form>
    </template>

    <!-- Succès -->
    <template v-else>
      <div class="success-block">
        <div class="success-icon">✅</div>
        <p class="success-msg">Votre mot de passe a bien été mis à jour.</p>
      </div>
      <p class="auth-hint">
        <RouterLink to="/login">Se connecter</RouterLink>
      </p>
    </template>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'ResetPasswordView' });
import { ref } from 'vue';
import { usersApi } from '@/api/users';

// Lecture directe depuis l'URL — synchrone, avant tout rendu, sans dépendre du router
const token = ref(new URLSearchParams(window.location.search).get('token') ?? '');
const password = ref('');
const confirm = ref('');
const loading = ref(false);
const errorMessage = ref('');
const done = ref(false);

async function handleSubmit() {
  errorMessage.value = '';

  if (password.value !== confirm.value) {
    errorMessage.value = 'Les mots de passe ne correspondent pas.';
    return;
  }
  if (password.value.length < 6) {
    errorMessage.value = 'Le mot de passe doit contenir au moins 6 caractères.';
    return;
  }

  loading.value = true;
  try {
    await usersApi.resetPassword(token.value, password.value);
    done.value = true;
  } catch (err: any) {
    const msg = err?.response?.data?.message;
    errorMessage.value = msg ?? 'Lien invalide ou expiré. Faites une nouvelle demande.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.success-block {
  text-align: center;
  padding: 1.5rem 0;
}
.success-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}
.success-msg {
  font-size: 1rem;
  color: #2d5a27;
}
</style>
