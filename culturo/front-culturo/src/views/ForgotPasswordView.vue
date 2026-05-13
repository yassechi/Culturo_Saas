<template>
  <section class="auth-card">
    <span class="eyebrow">Culturo SaaS</span>
    <h1 class="hero-title">Mot de passe oublié ?</h1>
    <p>Saisissez votre adresse email. Nous vous enverrons un lien pour créer un nouveau mot de passe.</p>

    <template v-if="!sent">
      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            placeholder="votre@email.com"
          />
        </div>

        <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? 'Envoi en cours...' : 'Envoyer le lien' }}
        </button>
      </form>
    </template>

    <template v-else>
      <div class="success-block">
        <div class="success-icon">✉️</div>
        <p class="success-msg">
          Si un compte existe pour <strong>{{ email }}</strong>, un email contenant le lien de réinitialisation vient d'être envoyé.
        </p>
        <p class="success-hint">Pensez à vérifier vos spams.</p>
      </div>
    </template>

    <p class="auth-hint">
      <RouterLink to="/login">← Retour à la connexion</RouterLink>
    </p>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'ForgotPasswordView' });
import { ref } from 'vue';
import { usersApi } from '@/api/users';

const email = ref('');
const loading = ref(false);
const errorMessage = ref('');
const sent = ref(false);

async function handleSubmit() {
  loading.value = true;
  errorMessage.value = '';
  try {
    await usersApi.forgotPassword(email.value);
    sent.value = true;
  } catch {
    errorMessage.value = 'Une erreur est survenue. Veuillez réessayer.';
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
  margin-bottom: 0.5rem;
}
.success-hint {
  font-size: 0.875rem;
  color: #888;
}
</style>
