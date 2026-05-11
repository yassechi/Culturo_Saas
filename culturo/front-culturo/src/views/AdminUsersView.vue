<template>
  <div class="admin-users">

    <!-- En-tête ---------------------------------------------------------- -->
    <header class="page-header">
      <div class="page-header-copy">
        <p class="eyebrow">Administration</p>
        <h2>Gestion des utilisateurs</h2>
        <p class="subtitle">Créez, modifiez et désactivez les comptes. Attribuez les rôles.</p>
      </div>

      <div class="stats-row" aria-label="Statistiques utilisateurs">
        <div class="stat-chip">
          <span class="stat-value">{{ store.stats.total }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-chip stat-chip--active">
          <span class="stat-value">{{ store.stats.active }}</span>
          <span class="stat-label">Actifs</span>
        </div>
        <div class="stat-chip stat-chip--inactive">
          <span class="stat-value">{{ store.stats.inactive }}</span>
          <span class="stat-label">Inactifs</span>
        </div>
        <div class="stat-chip stat-chip--admin">
          <span class="stat-value">{{ store.stats.admins }}</span>
          <span class="stat-label">Admins</span>
        </div>
        <div class="stat-chip stat-chip--formateur">
          <span class="stat-value">{{ store.stats.formateurs }}</span>
          <span class="stat-label">Formateurs</span>
        </div>
        <div class="stat-chip stat-chip--stagiaire">
          <span class="stat-value">{{ store.stats.stagiaires }}</span>
          <span class="stat-label">Stagiaires</span>
        </div>
      </div>
    </header>

    <!-- Barre d'outils --------------------------------------------------- -->
    <div class="toolbar">
      <div class="toolbar-filters">
        <div class="search-wrap">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input
            v-model="store.search"
            type="search"
            placeholder="Rechercher par nom ou email…"
            class="search-input"
          />
        </div>

        <div class="filter-group" role="group" aria-label="Filtrer par statut">
          <button
            v-for="opt in STATUS_OPTIONS"
            :key="opt.value"
            type="button"
            class="filter-btn"
            :class="{ active: store.filterStatus === opt.value }"
            @click="store.filterStatus = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="filter-group" role="group" aria-label="Filtrer par rôle">
          <button
            v-for="opt in ROLE_OPTIONS"
            :key="opt.value"
            type="button"
            class="filter-btn"
            :class="[{ active: store.filterRole === opt.value }, `role-btn--${opt.value}`]"
            @click="store.filterRole = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <button type="button" class="primary-button" @click="store.openCreateModal()">
        + Créer un compte
      </button>
    </div>

    <!-- Message d'erreur -------------------------------------------------- -->
    <div v-if="store.error" class="alert-error" role="alert">
      {{ store.error }}
      <button type="button" class="alert-close" @click="store.error = null">✕</button>
    </div>

    <!-- Chargement -------------------------------------------------------- -->
    <div v-if="store.loading" class="loading-state">
      <p>Chargement des utilisateurs…</p>
    </div>

    <!-- Aucun résultat ---------------------------------------------------- -->
    <div v-else-if="!store.filteredUsers.length" class="empty-state">
      <p>Aucun utilisateur ne correspond aux filtres sélectionnés.</p>
    </div>

    <!-- Tableau ----------------------------------------------------------- -->
    <div v-else class="table-wrap">
      <table class="users-table">
        <thead>
          <tr>
            <th scope="col">Utilisateur</th>
            <th scope="col">Email</th>
            <th scope="col">Rôle</th>
            <th scope="col">Statut</th>
            <th scope="col" class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in store.filteredUsers"
            :key="user.id_user"
            :class="{ 'row--inactive': !user.user_active }"
          >
            <!-- Nom -->
            <td class="cell-name">
              <div class="user-avatar" :class="`avatar--${store.resolveRoleName(user)}`">
                {{ initials(user) }}
              </div>
              <span>{{ user.user_first_name }} {{ user.user_last_name }}</span>
            </td>

            <!-- Email -->
            <td class="cell-email">
              <a :href="`mailto:${user.email}`">{{ user.email }}</a>
            </td>

            <!-- Rôle — select inline -->
            <td class="cell-role">
              <select
                :value="store.resolveRoleName(user)"
                class="role-select"
                :class="`role-select--${store.resolveRoleName(user)}`"
                :aria-label="`Rôle de ${user.user_first_name}`"
                @change="onRoleChange(user, $event)"
              >
                <option value="admin">Admin</option>
                <option value="formateur">Formateur</option>
                <option value="stagiaire">Stagiaire</option>
              </select>
            </td>

            <!-- Statut — toggle -->
            <td class="cell-status">
              <button
                type="button"
                class="status-toggle"
                :class="user.user_active ? 'status-toggle--active' : 'status-toggle--inactive'"
                :aria-label="`${user.user_active ? 'Désactiver' : 'Activer'} ${user.user_first_name}`"
                @click="store.toggleStatus(user)"
              >
                <span class="toggle-dot" />
                {{ user.user_active ? 'Actif' : 'Inactif' }}
              </button>
            </td>

            <!-- Actions -->
            <td class="cell-actions">
              <button
                type="button"
                class="action-btn action-btn--edit"
                :aria-label="`Modifier ${user.user_first_name}`"
                @click="store.openEditModal(user)"
              >
                ✏️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Résumé résultats -------------------------------------------------- -->
    <p v-if="!store.loading && store.filteredUsers.length" class="results-count">
      {{ store.filteredUsers.length }} utilisateur(s) affiché(s) sur {{ store.stats.total }}
    </p>

    <!-- Modal Créer / Modifier -------------------------------------------- -->
    <Teleport to="body">
      <div v-if="store.modalOpen" class="modal-overlay" @click.self="store.closeModal()">
        <div class="modal" role="dialog" aria-modal="true" :aria-label="modalTitle">
          <header class="modal-header">
            <h3>{{ modalTitle }}</h3>
            <button type="button" class="close-btn" aria-label="Fermer" @click="store.closeModal()">✕</button>
          </header>

          <form class="modal-body" @submit.prevent="store.submitModal()">
            <div class="form-row">
              <div class="form-field">
                <label for="u-first-name">Prénom *</label>
                <input id="u-first-name" v-model="store.modalForm.user_first_name" type="text" required />
              </div>
              <div class="form-field">
                <label for="u-last-name">Nom *</label>
                <input id="u-last-name" v-model="store.modalForm.user_last_name" type="text" required />
              </div>
            </div>

            <div class="form-field">
              <label for="u-email">Email *</label>
              <input id="u-email" v-model="store.modalForm.email" type="email" required />
            </div>

            <div class="form-field">
              <label for="u-phone">Téléphone</label>
              <input id="u-phone" v-model="store.modalForm.phone" type="tel" />
            </div>

            <div class="form-row">
              <div class="form-field">
                <label for="u-role">Rôle *</label>
                <select id="u-role" v-model="store.modalForm.role">
                  <option value="admin">Admin</option>
                  <option value="formateur">Formateur</option>
                  <option value="stagiaire">Stagiaire</option>
                </select>
              </div>
              <div class="form-field form-field--checkbox">
                <label>
                  <input v-model="store.modalForm.user_active" type="checkbox" />
                  Compte actif
                </label>
              </div>
            </div>

            <div class="form-field">
              <label for="u-password">
                {{ store.modalMode === 'create' ? 'Mot de passe *' : 'Nouveau mot de passe (laisser vide pour ne pas changer)' }}
              </label>
              <input
                id="u-password"
                v-model="store.modalForm.hpassword"
                type="password"
                :required="store.modalMode === 'create'"
                autocomplete="new-password"
                placeholder="••••••••"
              />
            </div>

            <div v-if="store.modalError" class="modal-error" role="alert">
              {{ store.modalError }}
            </div>

            <footer class="modal-footer">
              <button type="submit" class="primary-button" :disabled="store.modalLoading">
                {{ store.modalLoading ? 'Enregistrement…' : store.modalMode === 'create' ? 'Créer le compte' : 'Enregistrer' }}
              </button>
              <button type="button" class="secondary-button" @click="store.closeModal()">
                Annuler
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAdminUsersStore, type RoleName } from '@/stores/adminUsers';
import type { ApiUser } from '@/api/admin';

const store = useAdminUsersStore();

onMounted(() => store.loadUsers());

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'inactive', label: 'Inactifs' },
] as const;

const ROLE_OPTIONS = [
  { value: 'all', label: 'Tous les rôles' },
  { value: 'admin', label: 'Admin' },
  { value: 'formateur', label: 'Formateur' },
  { value: 'stagiaire', label: 'Stagiaire' },
] as const;

const modalTitle = computed(() =>
  store.modalMode === 'create' ? 'Créer un compte utilisateur' : 'Modifier le compte',
);

function initials(user: ApiUser): string {
  return `${user.user_first_name?.[0] ?? ''}${user.user_last_name?.[0] ?? ''}`.toUpperCase();
}

function onRoleChange(user: ApiUser, event: Event) {
  const role = (event.target as HTMLSelectElement).value as RoleName;
  store.changeRole(user, role);
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────────── */
.admin-users {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  min-height: 100%;
}

/* ── Header ─────────────────────────────────────────────────────────────── */
.page-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem 2rem;
  align-items: start;
}

.page-header-copy {
  display: grid;
  gap: 0.3rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--brand-clay, #7a4c32);
}

.page-header h2 {
  margin: 0;
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 700;
}

.subtitle {
  margin: 0;
  font-size: 0.92rem;
  color: #666;
}

.stats-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.85rem;
  border-radius: 14px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  min-width: 60px;
}

.stat-chip--active   { background: #e8f5e9; border-color: #a5d6a7; }
.stat-chip--inactive { background: #fafafa; border-color: #ccc; }
.stat-chip--admin    { background: #fce4ec; border-color: #f48fb1; }
.stat-chip--formateur { background: #e3f2fd; border-color: #90caf9; }
.stat-chip--stagiaire { background: #fff8e1; border-color: #ffe082; }

.stat-value {
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1;
  color: #222;
}

.stat-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #888;
  margin-top: 0.1rem;
}

/* ── Toolbar ─────────────────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.7rem;
  font-size: 0.85rem;
  pointer-events: none;
}

.search-input {
  padding: 0.5rem 0.75rem 0.5rem 2.1rem;
  border: 1px solid #ddd;
  border-radius: 99px;
  font-size: 0.875rem;
  min-width: 220px;
  background: white;
}

.filter-group {
  display: flex;
  gap: 0.25rem;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 0.2rem;
}

.filter-btn {
  padding: 0.35rem 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  background: transparent;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-btn.active {
  background: white;
  color: #222;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

/* ── Alertes ─────────────────────────────────────────────────────────────── */
.alert-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #fce4ec;
  border: 1px solid #f48fb1;
  border-radius: 10px;
  color: #880e4f;
  font-size: 0.875rem;
}

.alert-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #880e4f;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #888;
}

/* ── Tableau ─────────────────────────────────────────────────────────────── */
.table-wrap {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 0.9rem;
}

.users-table th {
  padding: 0.8rem 1rem;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #888;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.users-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f5f5f5;
  vertical-align: middle;
}

.users-table tr:last-child td {
  border-bottom: none;
}

.users-table tr.row--inactive td {
  opacity: 0.55;
}

.col-actions { width: 80px; text-align: center; }

/* ── Cellules ────────────────────────────────────────────────────────────── */
.cell-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 800;
  flex-shrink: 0;
  color: white;
}

.avatar--admin     { background: #e91e63; }
.avatar--formateur { background: #1565c0; }
.avatar--stagiaire { background: #e65100; }

.cell-email a {
  color: #1565c0;
  text-decoration: none;
  font-size: 0.875rem;
}

.role-select {
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  appearance: auto;
}

.role-select--admin     { background: #fce4ec; border-color: #f48fb1; color: #880e4f; }
.role-select--formateur { background: #e3f2fd; border-color: #90caf9; color: #0d47a1; }
.role-select--stagiaire { background: #fff8e1; border-color: #ffe082; color: #e65100; }

.status-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  border-radius: 99px;
  border: 1px solid;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.status-toggle--active {
  background: #e8f5e9;
  border-color: #a5d6a7;
  color: #1b5e20;
}

.status-toggle--inactive {
  background: #f5f5f5;
  border-color: #ccc;
  color: #888;
}

.toggle-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.cell-actions {
  text-align: center;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.25rem 0.4rem;
  border-radius: 6px;
  transition: background 0.15s;
}

.action-btn:hover { background: #f5f5f5; }

.results-count {
  font-size: 0.8rem;
  color: #aaa;
  text-align: right;
  margin: 0;
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18);
  width: min(520px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
  padding: 0.2rem;
  line-height: 1;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-field label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #555;
}

.form-field input,
.form-field select {
  padding: 0.55rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 0.9rem;
}

.form-field input:focus,
.form-field select:focus {
  outline: 2px solid rgba(74,103,65,0.3);
  border-color: rgba(74,103,65,0.4);
}

.form-field--checkbox {
  justify-content: flex-end;
}

.form-field--checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}

.modal-error {
  padding: 0.7rem 0.9rem;
  background: #fce4ec;
  border: 1px solid #f48fb1;
  border-radius: 8px;
  color: #880e4f;
  font-size: 0.875rem;
}

.modal-footer {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

/* ── Boutons partagés ────────────────────────────────────────────────────── */
.primary-button {
  padding: 0.6rem 1.25rem;
  background: #274135;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}

.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }

.secondary-button {
  padding: 0.55rem 1rem;
  background: transparent;
  color: #555;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 640px) {
  .page-header { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .toolbar { flex-direction: column; align-items: stretch; }
}
</style>
