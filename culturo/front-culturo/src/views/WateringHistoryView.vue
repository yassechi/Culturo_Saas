<template>
  <div class="watering-view">

    <div class="view-header">
      <div>
        <p class="view-eyebrow">Arrosages</p>
        <h1>Historique des arrosages</h1>
        <p class="view-sub">Tous les arrosages enregistrés, triés par date décroissante.</p>
      </div>
      <div class="header-stats">
        <div class="stat-chip">
          <span class="stat-value">{{ filtered.length }}</span>
          <span class="stat-label">Arrosages</span>
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

    <!-- Table -->
    <div v-else class="table-wrapper">
      <table v-if="filtered.length > 0" class="data-table">
        <thead>
          <tr>
            <th>Date et heure</th>
            <th>Section</th>
            <th>Légume</th>
            <th>Planche</th>
            <th>Sole</th>
            <th>Exploitation</th>
            <th v-if="auth.isAdmin || auth.isFormateur"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="w in filtered" :key="w.id_watering">
            <td class="td-datetime">{{ formatDatetime(w.watering_date) }}</td>
            <td>
              <span class="section-pill">Section {{ w.section.section_number }}</span>
            </td>
            <td>
              <span v-if="w.section.vegetable" class="veg-pill">
                {{ w.section.vegetable.vegetable_name }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td>{{ w.section.sectionPlan?.board?.board_name ?? '—' }}</td>
            <td>{{ w.section.sectionPlan?.board?.sole?.sole_name ?? '—' }}</td>
            <td>{{ w.section.sectionPlan?.board?.sole?.exploitation?.exploitation_name ?? '—' }}</td>
            <td v-if="auth.isAdmin || auth.isFormateur" class="td-actions">
              <button
                type="button"
                class="delete-btn"
                :disabled="deleting === w.id_watering"
                @click="askDelete(w.id_watering)"
              >
                {{ deleting === w.id_watering ? '…' : '✕' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="state-block">Aucun arrosage trouvé pour les filtres sélectionnés.</div>
    </div>

    <!-- Confirmation suppression -->
    <Teleport to="body">
      <div v-if="confirmId !== null" class="modal-overlay" @click.self="confirmId = null">
        <div class="modal">
          <p>Supprimer cet arrosage ?</p>
          <div class="modal-actions">
            <button type="button" class="btn-danger" @click="doDelete">Supprimer</button>
            <button type="button" class="btn-cancel" @click="confirmId = null">Annuler</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWateringStore } from '@/stores/watering';
import { useAuthStore } from '@/stores/auth';

const store = useWateringStore();
const auth = useAuthStore();

onMounted(() => store.loadAll());

// ── Filtres ──────────────────────────────────────────────────────────────────
const filterExploitation = ref('');
const filterDateFrom = ref('');
const filterDateTo = ref('');

const exploitationNames = computed(() => {
  const set = new Set<string>();
  for (const w of store.waterings) {
    const name = w.section.sectionPlan?.board?.sole?.exploitation?.exploitation_name;
    if (name) set.add(name);
  }
  return [...set].sort();
});

const hasActiveFilters = computed(
  () => filterExploitation.value || filterDateFrom.value || filterDateTo.value,
);

const filtered = computed(() => {
  return store.waterings.filter((w) => {
    if (filterExploitation.value) {
      const name = w.section.sectionPlan?.board?.sole?.exploitation?.exploitation_name ?? '';
      if (name !== filterExploitation.value) return false;
    }
    if (filterDateFrom.value) {
      if (w.watering_date.slice(0, 10) < filterDateFrom.value) return false;
    }
    if (filterDateTo.value) {
      if (w.watering_date.slice(0, 10) > filterDateTo.value) return false;
    }
    return true;
  });
});

function resetFilters() {
  filterExploitation.value = '';
  filterDateFrom.value = '';
  filterDateTo.value = '';
}

// ── Suppression ───────────────────────────────────────────────────────────────
const confirmId = ref<number | null>(null);
const deleting = ref<number | null>(null);

function askDelete(id: number) {
  confirmId.value = id;
}

async function doDelete() {
  if (confirmId.value === null) return;
  deleting.value = confirmId.value;
  confirmId.value = null;
  await store.deleteWatering(deleting.value);
  deleting.value = null;
}

// ── Format ────────────────────────────────────────────────────────────────────
function formatDatetime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style scoped>
.watering-view {
  padding: 2rem 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.view-eyebrow {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 800;
  color: #1a5aab;
  margin: 0 0 0.25rem;
}

.watering-view h1 {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.35rem;
  color: var(--brand-deep);
}

.view-sub {
  font-size: 0.88rem;
  color: rgba(39, 65, 53, 0.55);
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 0.85rem;
  flex-shrink: 0;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 1.25rem;
  border-radius: 18px;
  background: rgba(26, 90, 171, 0.08);
  border: 1px solid rgba(26, 90, 171, 0.18);
  min-width: 80px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a4a8a;
  line-height: 1;
}

.stat-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(26, 74, 138, 0.65);
  margin-top: 0.2rem;
}

/* Filtres */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  align-items: flex-end;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(39, 65, 53, 0.08);
  border-radius: 20px;
  box-shadow: var(--shadow-soft);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 140px;
}

.filter-group label {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(39, 65, 53, 0.6);
}

.filter-group input,
.filter-group select {
  padding: 0.55rem 0.85rem;
  border: 1px solid rgba(39, 65, 53, 0.14);
  border-radius: 12px;
  font-size: 0.88rem;
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-primary);
}

.reset-btn {
  padding: 0.55rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(39, 65, 53, 0.18);
  background: rgba(255, 255, 255, 0.85);
  color: var(--brand-deep);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  align-self: flex-end;
}

.reset-btn:hover { background: rgba(39, 65, 53, 0.06); }

/* Table */
.table-wrapper {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(39, 65, 53, 0.08);
  border-radius: 22px;
  overflow-x: auto;
  box-shadow: var(--shadow-soft);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.data-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(39, 65, 53, 0.55);
  background: rgba(39, 65, 53, 0.04);
  border-bottom: 1px solid rgba(39, 65, 53, 0.08);
}

.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(39, 65, 53, 0.06);
  color: var(--text-primary);
}

.data-table tr:last-child td { border-bottom: none; }

.data-table tr:hover td {
  background: rgba(39, 65, 53, 0.02);
}

.td-datetime {
  font-variant-numeric: tabular-nums;
  font-size: 0.84rem;
  white-space: nowrap;
}

.section-pill {
  display: inline-block;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
  background: rgba(26, 90, 171, 0.1);
  color: #1a4a8a;
  border: 1px solid rgba(26, 90, 171, 0.2);
}

.veg-pill {
  display: inline-block;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
  background: rgba(74, 103, 65, 0.1);
  color: var(--brand-olive);
  border: 1px solid rgba(74, 103, 65, 0.2);
}

.text-muted { color: rgba(39, 65, 53, 0.38); }

.td-actions { width: 48px; text-align: center; }

.delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid rgba(200, 30, 30, 0.2);
  background: rgba(220, 38, 38, 0.06);
  color: #b91c1c;
  font-size: 0.72rem;
  cursor: pointer;
  transition: background 140ms;
}

.delete-btn:hover:not(:disabled) { background: rgba(220, 38, 38, 0.15); }
.delete-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* State */
.state-block {
  padding: 2rem;
  text-align: center;
  color: rgba(39, 65, 53, 0.5);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(39, 65, 53, 0.08);
  border-radius: 22px;
}

.state-error { color: #c62828; background: rgba(220, 38, 38, 0.05); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 27, 22, 0.42);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: rgba(255, 252, 246, 0.98);
  border-radius: 22px;
  padding: 1.75rem 2rem;
  box-shadow: 0 24px 60px rgba(26, 34, 28, 0.22);
  min-width: 300px;
  text-align: center;
  border: 1px solid rgba(39, 65, 53, 0.1);
}

.modal p {
  font-size: 1rem;
  font-weight: 700;
  color: var(--brand-deep);
  margin: 0 0 1.25rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-danger {
  padding: 0.65rem 1.25rem;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  font-weight: 800;
  font-size: 0.88rem;
  cursor: pointer;
}

.btn-cancel {
  padding: 0.65rem 1.25rem;
  border-radius: 14px;
  border: 1px solid rgba(39, 65, 53, 0.14);
  background: rgba(255, 255, 255, 0.85);
  color: var(--brand-deep);
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
}

@media (max-width: 720px) {
  .watering-view { padding: 1.25rem 1rem; }
  .data-table { font-size: 0.8rem; }
  .data-table th, .data-table td { padding: 0.6rem 0.65rem; }
}

@media (max-width: 640px) {
  .watering-view { padding: 0 0.75rem 1.5rem; }

  /* Masquer : Sole(5), Exploitation(6) */
  .data-table th:nth-child(5),
  .data-table td:nth-child(5),
  .data-table th:nth-child(6),
  .data-table td:nth-child(6) {
    display: none;
  }

  .filter-group { min-width: 0; flex: 1 1 140px; }
}
</style>
