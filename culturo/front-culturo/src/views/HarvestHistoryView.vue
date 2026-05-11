<template>
  <div class="harvest-view">

    <div class="view-header">
      <div>
        <p class="view-eyebrow">Récoltes</p>
        <h1>Historique des récoltes</h1>
        <p class="view-sub">Toutes les récoltes déclarées, triées par date décroissante.</p>
      </div>
      <div class="header-stats">
        <div class="stat-chip">
          <span class="stat-value">{{ filtered.length }}</span>
          <span class="stat-label">Récoltes</span>
        </div>
        <div class="stat-chip">
          <span class="stat-value">{{ totalKg }}</span>
          <span class="stat-label">Total (kg equiv.)</span>
        </div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>Exploitation</label>
        <select v-model="filterExploitation">
          <option value="">Toutes</option>
          <option v-for="name in exploitationNames" :key="name" :value="name">{{ name }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Légume</label>
        <input v-model="filterVegetable" type="text" placeholder="Filtrer par légume…" />
      </div>
      <div class="filter-group">
        <label>Depuis</label>
        <input v-model="filterDateFrom" type="date" />
      </div>
      <div class="filter-group">
        <label>Jusqu'au</label>
        <input v-model="filterDateTo" type="date" />
      </div>
      <button v-if="hasActiveFilters" type="button" class="reset-btn" @click="resetFilters">
        Réinitialiser
      </button>
    </div>

    <!-- Loading / Error -->
    <div v-if="store.listLoading" class="state-block">Chargement…</div>
    <div v-else-if="store.listError" class="state-block state-error">{{ store.listError }}</div>
    <div v-else-if="filtered.length === 0" class="state-block">Aucune récolte trouvée.</div>

    <!-- Tableau -->
    <div v-else class="table-wrapper">
      <table class="harvest-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Légume</th>
            <th>Variété</th>
            <th>Exploitation</th>
            <th>Sole</th>
            <th>Planche</th>
            <th>Section</th>
            <th>Quantité</th>
            <th>Déclaré par</th>
            <th v-if="canDelete"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in filtered" :key="h.id_harvest">
            <td class="td-date">{{ formatDate(h.harvest_date) }}</td>
            <td class="td-veg">
              <span class="veg-pill">{{ h.section?.vegetable?.vegetable_name ?? '—' }}</span>
            </td>
            <td class="td-variety">{{ h.section?.variety?.variety_name ?? '—' }}</td>
            <td>{{ h.section?.sectionPlan?.board?.sole?.exploitation?.exploitation_name ?? '—' }}</td>
            <td>{{ h.section?.sectionPlan?.board?.sole?.sole_name ?? '—' }}</td>
            <td>{{ h.section?.sectionPlan?.board?.board_name ?? '—' }}</td>
            <td class="td-center">{{ h.section?.section_number ?? '—' }}</td>
            <td class="td-qty">
              <strong>{{ h.quantity }}</strong>
              <span class="unit">{{ h.quantity_unit }}</span>
            </td>
            <td class="td-user">{{ h.user_?.email ?? '—' }}</td>
            <td v-if="canDelete" class="td-action">
              <button
                type="button"
                class="delete-btn"
                :title="`Supprimer la récolte du ${formatDate(h.harvest_date)}`"
                @click="confirmDelete(h)"
              >✕</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Confirm delete modal -->
    <div v-if="pendingDelete" class="modal-overlay" @click.self="pendingDelete = null">
      <div class="modal-card">
        <h3>Supprimer cette récolte ?</h3>
        <p>
          <strong>{{ pendingDelete.section?.vegetable?.vegetable_name }}</strong>
          — {{ formatDate(pendingDelete.harvest_date) }}
          — {{ pendingDelete.quantity }} {{ pendingDelete.quantity_unit }}
        </p>
        <p class="modal-warn">Cette action est irréversible.</p>
        <div class="modal-actions">
          <button type="button" class="btn-danger" @click="doDelete">Supprimer</button>
          <button type="button" class="btn-cancel" @click="pendingDelete = null">Annuler</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useHarvestStore, type HarvestRecord } from '@/stores/harvest';
import { useAuthStore } from '@/stores/auth';

const store = useHarvestStore();
const auth = useAuthStore();

const canDelete = computed(() => auth.isAdmin || auth.isFormateur);

const filterExploitation = ref('');
const filterVegetable = ref('');
const filterDateFrom = ref('');
const filterDateTo = ref('');
const pendingDelete = ref<HarvestRecord | null>(null);

const hasActiveFilters = computed(
  () => filterExploitation.value || filterVegetable.value || filterDateFrom.value || filterDateTo.value,
);

const exploitationNames = computed(() => {
  const names = new Set<string>();
  for (const h of store.harvests) {
    const name = h.section?.sectionPlan?.board?.sole?.exploitation?.exploitation_name;
    if (name) names.add(name);
  }
  return [...names].sort();
});

const filtered = computed(() => {
  return store.harvests.filter((h) => {
    if (filterExploitation.value) {
      const name = h.section?.sectionPlan?.board?.sole?.exploitation?.exploitation_name ?? '';
      if (name !== filterExploitation.value) return false;
    }
    if (filterVegetable.value) {
      const veg = h.section?.vegetable?.vegetable_name ?? '';
      if (!veg.toLowerCase().includes(filterVegetable.value.toLowerCase())) return false;
    }
    if (filterDateFrom.value && h.harvest_date < filterDateFrom.value) return false;
    if (filterDateTo.value && h.harvest_date > filterDateTo.value) return false;
    return true;
  });
});

const totalKg = computed(() => {
  return filtered.value
    .filter((h) => h.quantity_unit === 'kg')
    .reduce((sum, h) => sum + h.quantity, 0);
});

function formatDate(value: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function resetFilters() {
  filterExploitation.value = '';
  filterVegetable.value = '';
  filterDateFrom.value = '';
  filterDateTo.value = '';
}

function confirmDelete(h: HarvestRecord) {
  pendingDelete.value = h;
}

async function doDelete() {
  if (!pendingDelete.value) return;
  await store.deleteHarvest(pendingDelete.value.id_harvest);
  pendingDelete.value = null;
}

onMounted(() => store.loadHarvests());
</script>

<style scoped>
.harvest-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0 1.5rem 2rem;
  min-height: 100%;
}

.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.view-eyebrow {
  margin: 0 0 0.2rem;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--brand-clay);
}

.view-header h1 {
  margin: 0 0 0.25rem;
  font-size: clamp(1.5rem, 2.8vw, 2.1rem);
  font-weight: 700;
  color: var(--brand-deep);
}

.view-sub {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.header-stats {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.stat-chip {
  display: grid;
  gap: 0.15rem;
  align-content: start;
  padding: 0.7rem 1.1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(39, 65, 53, 0.08);
  box-shadow: 0 6px 16px rgba(58, 47, 24, 0.06);
  text-align: center;
}

.stat-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--brand-deep);
}

.stat-label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(39, 65, 53, 0.6);
}

/* Filters */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
  padding: 1rem 1.25rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(39, 65, 53, 0.08);
  box-shadow: var(--shadow-soft);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 140px;
}

.filter-group label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(39, 65, 53, 0.6);
}

.filter-group input,
.filter-group select {
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  border: 1.5px solid rgba(39, 65, 53, 0.14);
  background: rgba(255, 255, 255, 0.9);
  font-size: 0.88rem;
  color: var(--brand-deep);
}

.reset-btn {
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  border: 1.5px solid rgba(39, 65, 53, 0.18);
  background: transparent;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--brand-deep);
  cursor: pointer;
  align-self: flex-end;
  transition: background 140ms;
}

.reset-btn:hover {
  background: rgba(39, 65, 53, 0.06);
}

/* States */
.state-block {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  border-radius: 20px;
  border: 1px dashed rgba(39, 65, 53, 0.14);
  background: rgba(255, 251, 244, 0.7);
  color: var(--text-muted);
  font-size: 0.96rem;
}

.state-error {
  color: #c62828;
  border-color: rgba(198, 40, 40, 0.2);
}

/* Table */
.table-wrapper {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(39, 65, 53, 0.08);
  box-shadow: var(--shadow-soft);
}

.harvest-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.9);
  font-size: 0.88rem;
}

.harvest-table thead {
  background: rgba(39, 65, 53, 0.04);
  border-bottom: 1px solid rgba(39, 65, 53, 0.1);
}

.harvest-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(39, 65, 53, 0.6);
  white-space: nowrap;
}

.harvest-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(39, 65, 53, 0.06);
  color: var(--brand-deep);
  vertical-align: middle;
}

.harvest-table tbody tr:last-child td {
  border-bottom: none;
}

.harvest-table tbody tr:hover td {
  background: rgba(39, 65, 53, 0.025);
}

.td-date {
  white-space: nowrap;
  font-weight: 600;
}

.td-center {
  text-align: center;
}

.veg-pill {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: rgba(74, 103, 65, 0.1);
  color: var(--brand-olive, #4a6741);
  font-weight: 700;
  font-size: 0.84rem;
}

.td-variety {
  color: rgba(39, 65, 53, 0.65);
  font-style: italic;
}

.td-qty {
  white-space: nowrap;
}

.td-qty strong {
  font-weight: 700;
  margin-right: 0.25rem;
}

.unit {
  font-size: 0.8rem;
  color: rgba(39, 65, 53, 0.6);
}

.td-user {
  font-size: 0.82rem;
  color: rgba(39, 65, 53, 0.65);
}

.delete-btn {
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 8px;
  border: 1.5px solid rgba(198, 40, 40, 0.22);
  background: rgba(198, 40, 40, 0.06);
  color: #c62828;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 140ms;
}

.delete-btn:hover {
  background: rgba(198, 40, 40, 0.14);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 27, 22, 0.5);
  backdrop-filter: blur(6px);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-card {
  background: #fff;
  border-radius: 24px;
  padding: 2rem 2.25rem;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 24px 56px rgba(22, 35, 29, 0.22);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-card h3 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--brand-deep);
}

.modal-card p {
  margin: 0;
  font-size: 0.92rem;
  color: var(--brand-deep);
}

.modal-warn {
  font-size: 0.82rem !important;
  color: #c62828 !important;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-danger {
  flex: 1;
  padding: 0.65rem 1rem;
  border-radius: 12px;
  border: none;
  background: #c62828;
  color: #fff;
  font-weight: 800;
  font-size: 0.88rem;
  cursor: pointer;
  transition: opacity 140ms;
}

.btn-danger:hover {
  opacity: 0.85;
}

.btn-cancel {
  flex: 1;
  padding: 0.65rem 1rem;
  border-radius: 12px;
  border: 1.5px solid rgba(39, 65, 53, 0.18);
  background: transparent;
  color: var(--brand-deep);
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background 140ms;
}

.btn-cancel:hover {
  background: rgba(39, 65, 53, 0.05);
}
</style>
