<template>
  <div class="amendement-view">

    <!-- En-tête -->
    <div class="view-header">
      <div>
        <p class="view-eyebrow">Fertilisation</p>
        <h1>Amendements</h1>
        <p class="view-sub">Produits appliqués par planche, triés par date décroissante.</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn-secondary" @click="showCatalogue = true">
          📋 Catalogue produits
        </button>
        <button type="button" class="btn-primary" @click="showForm = true">
          + Nouvel amendement
        </button>
      </div>
    </div>

    <!-- Résumé par planche -->
    <div v-if="boardSummaries.length > 0" class="boards-section">
      <p class="boards-section-title">État par planche</p>
      <div class="boards-grid">
        <div
          v-for="b in boardSummaries"
          :key="b.boardId"
          class="board-card"
          :class="b.daysAgo !== null && b.daysAgo <= 30 ? 'board-card-recent' : 'board-card-old'"
        >
          <div class="board-card-header">
            <span class="board-card-name">{{ b.boardName }}</span>
            <span class="board-card-sole">{{ b.soleName }}</span>
          </div>
          <template v-if="b.lastDate">
            <span class="board-card-product">{{ b.lastProduct }}</span>
            <span class="board-card-date">{{ formatDate(b.lastDate) }}</span>
            <span class="board-card-badge" :class="b.daysAgo! <= 30 ? 'badge-ok' : 'badge-old'">
              {{ b.daysAgo === 0 ? "Aujourd'hui" : `il y a ${b.daysAgo}j` }}
            </span>
          </template>
          <span v-else class="board-card-never">Jamais amendé</span>
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
        <label>Produit</label>
        <select v-model="filterProduct">
          <option value="">Tous</option>
          <option v-for="p in productNames" :key="p" :value="p">{{ p }}</option>
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
      <button v-if="hasFilters" type="button" class="reset-btn" @click="resetFilters">
        Réinitialiser
      </button>
    </div>

    <!-- Chargement / Erreur -->
    <div v-if="store.listLoading" class="state-block">Chargement…</div>
    <div v-else-if="store.listError" class="state-block state-error">{{ store.listError }}</div>

    <!-- Table -->
    <div v-else class="table-wrapper">
      <table v-if="filtered.length > 0" class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Produit</th>
            <th>Quantité</th>
            <th>Planche</th>
            <th>Sole</th>
            <th>Exploitation</th>
            <th>Notes</th>
            <th v-if="auth.isAdmin || auth.isFormateur"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in filtered" :key="a.id_amended" @click="selected = a" class="tr-clickable">
            <td class="td-date">{{ formatDate(a.amendment_date) }}</td>
            <td>
              <span class="product-pill">{{ a.amendement?.amendment_name ?? '—' }}</span>
            </td>
            <td class="td-qty">
              <template v-if="a.quantity">{{ a.quantity }} <span class="unit">{{ a.quantity_unit }}</span></template>
              <span v-else class="text-muted">—</span>
            </td>
            <td>{{ a.board?.board_name ?? '—' }}</td>
            <td>{{ a.board?.sole?.sole_name ?? '—' }}</td>
            <td>{{ a.board?.sole?.exploitation?.exploitation_name ?? '—' }}</td>
            <td class="td-desc">
              <span v-if="a.description" :title="a.description" class="desc-preview">{{ a.description }}</span>
              <span v-else class="text-muted">—</span>
            </td>
            <td v-if="auth.isAdmin || auth.isFormateur" class="td-actions" @click.stop>
              <button type="button" class="delete-btn" :disabled="deleting === a.id_amended" @click="askDelete(a.id_amended)">
                {{ deleting === a.id_amended ? '…' : '✕' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="state-block">Aucun amendement pour les filtres sélectionnés.</div>
    </div>

    <!-- Notice produit (clic sur ligne) -->
    <Teleport to="body">
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal modal-notice">
          <div class="modal-notice-header">
            <span class="product-pill product-pill-lg">{{ selected.amendement?.amendment_name }}</span>
            <button type="button" class="close-x" @click="selected = null">✕</button>
          </div>
          <p v-if="selected.amendement?.notice" class="notice-text">{{ selected.amendement.notice }}</p>
          <p v-else class="notice-empty">Aucune notice pour ce produit.</p>
          <div class="notice-meta">
            <span>📅 {{ formatDate(selected.amendment_date) }}</span>
            <span v-if="selected.quantity">⚖️ {{ selected.quantity }} {{ selected.quantity_unit }}</span>
            <span>🪵 {{ selected.board?.board_name }}</span>
          </div>
          <p v-if="selected.description" class="notice-desc">💬 {{ selected.description }}</p>
        </div>
      </div>

      <!-- Formulaire ajout -->
      <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
        <div class="modal modal-form">
          <h3>Nouvel amendement</h3>

          <div class="form-grid">
            <div class="form-field form-field-full">
              <label>Produit *</label>
              <select v-model="form.catalogueId" class="field-select">
                <option :value="null" disabled>— Sélectionner un produit —</option>
                <option v-for="c in store.catalogue" :key="c.id_amendement" :value="c.id_amendement">
                  {{ c.amendment_name }}
                </option>
              </select>
              <p v-if="selectedProduct?.notice" class="product-notice-hint">
                ℹ️ {{ selectedProduct.notice }}
              </p>
            </div>

            <div class="form-field form-field-full">
              <label>Portée *</label>
              <div class="scope-radios">
                <label class="scope-radio">
                  <input type="radio" v-model="form.scope" value="board" />
                  Une planche
                </label>
                <label class="scope-radio">
                  <input type="radio" v-model="form.scope" value="sole" />
                  Sole entière
                </label>
              </div>
            </div>

            <div class="form-field form-field-full">
              <label>{{ form.scope === 'board' ? 'Planche *' : 'Sole *' }}</label>
              <select v-if="form.scope === 'board'" v-model="form.boardId" class="field-select">
                <option :value="null" disabled>— Sélectionner une planche —</option>
                <optgroup v-for="sole in planStore.soles" :key="sole.id_sole" :label="sole.sole_name">
                  <option v-for="b in sole.boards" :key="b.id_board" :value="b.id_board">
                    {{ b.board_name }}
                  </option>
                </optgroup>
              </select>
              <select v-else v-model="form.soleId" class="field-select">
                <option :value="null" disabled>— Sélectionner une sole —</option>
                <option v-for="sole in planStore.soles" :key="sole.id_sole" :value="sole.id_sole">
                  {{ sole.sole_name }} ({{ sole.exploitation?.exploitation_name }})
                </option>
              </select>
            </div>

            <div class="form-field">
              <label>Date *</label>
              <input v-model="form.date" type="date" :max="todayIso" />
            </div>

            <div class="form-field">
              <label>Quantité</label>
              <input v-model.number="form.quantity" type="number" min="0" step="0.1" placeholder="ex: 2.5" />
            </div>

            <div class="form-field">
              <label>Unité</label>
              <select v-model="form.unit" class="field-select">
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="mL">mL</option>
                <option value="sac">sac(s)</option>
                <option value="brouette">brouette(s)</option>
              </select>
            </div>

            <div class="form-field form-field-full">
              <label>Notes (observations spécifiques)</label>
              <textarea v-model="form.description" rows="2" placeholder="Ex: sol argileux, double dose…" class="field-textarea" />
            </div>
          </div>

          <p v-if="store.submitError" class="form-error">{{ store.submitError }}</p>

          <div class="modal-footer">
            <button type="button" class="btn-primary" :disabled="!canSubmit || store.submitting" @click="submitForm">
              {{ store.submitting ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
            <button type="button" class="btn-cancel" @click="closeForm">Annuler</button>
          </div>
        </div>
      </div>

      <!-- Catalogue produits -->
      <div v-if="showCatalogue" class="modal-overlay" @click.self="showCatalogue = false">
        <div class="modal modal-catalogue">
          <div class="catalogue-header">
            <h3>Catalogue produits</h3>
            <button type="button" class="close-x" @click="showCatalogue = false">✕</button>
          </div>

          <div class="catalogue-list">
            <div v-for="item in store.catalogue" :key="item.id_amendement" class="catalogue-item">
              <div class="catalogue-item-main">
                <span class="catalogue-name">{{ item.amendment_name }}</span>
                <div class="catalogue-actions">
                  <button type="button" class="icon-btn" @click="startEditCatalogue(item)">✎</button>
                  <button type="button" class="icon-btn icon-btn-danger" @click="deleteCatalogueItem(item.id_amendement)">✕</button>
                </div>
              </div>
              <p v-if="item.notice" class="catalogue-notice">{{ item.notice }}</p>
            </div>
            <p v-if="store.catalogue.length === 0" class="catalogue-empty">Aucun produit dans le catalogue.</p>
          </div>

          <!-- Formulaire ajout/édition produit -->
          <div class="catalogue-form">
            <h4>{{ editingCatalogue ? 'Modifier le produit' : 'Ajouter un produit' }}</h4>
            <div class="form-field">
              <label>Nom du produit *</label>
              <input v-model="catalogueForm.name" type="text" placeholder="ex: Compost maison" />
            </div>
            <div class="form-field">
              <label>Notice / composition</label>
              <textarea v-model="catalogueForm.notice" rows="3"
                placeholder="ex: Amendement organique riche en azote. Apporter 2 kg/m² avant binage."
                class="field-textarea" />
            </div>
            <div class="catalogue-form-actions">
              <button type="button" class="btn-primary" :disabled="!catalogueForm.name.trim()" @click="saveCatalogueItem">
                {{ editingCatalogue ? 'Modifier' : 'Ajouter' }}
              </button>
              <button v-if="editingCatalogue" type="button" class="btn-cancel" @click="cancelEditCatalogue">
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirmation suppression -->
      <div v-if="confirmId !== null" class="modal-overlay" @click.self="confirmId = null">
        <div class="modal modal-confirm">
          <p>Supprimer cet amendement ?</p>
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
import { useAmendementStore, type CatalogueItem } from '@/stores/amendement';
import { usePlanningStore } from '@/stores/planning';
import { useAuthStore } from '@/stores/auth';

const store = useAmendementStore();
const planStore = usePlanningStore();
const auth = useAuthStore();

onMounted(async () => {
  await Promise.all([
    store.loadAll(),
    store.loadCatalogue(),
    planStore.soles.length === 0 ? planStore.loadSoles() : Promise.resolve(),
  ]);
});

// ── Résumé par planche ────────────────────────────────────────────────────────
const boardSummaries = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Construire map boardId → dernier amendement
  const map = new Map<number, { lastDate: string; lastProduct: string }>();
  for (const a of store.amendements) {
    if (!a.board) continue;
    const existing = map.get(a.board.id_board);
    if (!existing || a.amendment_date > existing.lastDate) {
      map.set(a.board.id_board, {
        lastDate: a.amendment_date,
        lastProduct: a.amendement?.amendment_name ?? '—',
      });
    }
  }

  // Construire liste depuis les soles/planches connues
  const result: Array<{
    boardId: number;
    boardName: string;
    soleName: string;
    lastDate: string | null;
    lastProduct: string | null;
    daysAgo: number | null;
  }> = [];

  for (const sole of planStore.soles) {
    for (const board of sole.boards) {
      const last = map.get(board.id_board) ?? null;
      let daysAgo: number | null = null;
      if (last) {
        const d = new Date(last.lastDate);
        d.setHours(0, 0, 0, 0);
        daysAgo = Math.round((today.getTime() - d.getTime()) / 86_400_000);
      }
      result.push({
        boardId: board.id_board,
        boardName: board.board_name,
        soleName: sole.sole_name,
        lastDate: last?.lastDate ?? null,
        lastProduct: last?.lastProduct ?? null,
        daysAgo,
      });
    }
  }

  return result.sort((a, b) => {
    // Jamais amendé en dernier, sinon tri par date asc (plus anciens d'abord)
    if (!a.lastDate && !b.lastDate) return a.boardName.localeCompare(b.boardName);
    if (!a.lastDate) return 1;
    if (!b.lastDate) return -1;
    return a.lastDate.localeCompare(b.lastDate);
  });
});

// ── Filtres ───────────────────────────────────────────────────────────────────
const filterExploitation = ref('');
const filterProduct = ref('');
const filterDateFrom = ref('');
const filterDateTo = ref('');

const exploitationNames = computed(() => {
  const set = new Set<string>();
  for (const a of store.amendements) {
    const name = a.board?.sole?.exploitation?.exploitation_name;
    if (name) set.add(name);
  }
  return [...set].sort();
});

const productNames = computed(() => {
  const set = new Set<string>();
  for (const a of store.amendements) {
    if (a.amendement?.amendment_name) set.add(a.amendement.amendment_name);
  }
  return [...set].sort();
});

const hasFilters = computed(
  () => filterExploitation.value || filterProduct.value || filterDateFrom.value || filterDateTo.value,
);

const filtered = computed(() =>
  store.amendements.filter((a) => {
    if (filterExploitation.value) {
      if ((a.board?.sole?.exploitation?.exploitation_name ?? '') !== filterExploitation.value) return false;
    }
    if (filterProduct.value) {
      if ((a.amendement?.amendment_name ?? '') !== filterProduct.value) return false;
    }
    if (filterDateFrom.value && a.amendment_date.slice(0, 10) < filterDateFrom.value) return false;
    if (filterDateTo.value && a.amendment_date.slice(0, 10) > filterDateTo.value) return false;
    return true;
  }),
);

function resetFilters() {
  filterExploitation.value = '';
  filterProduct.value = '';
  filterDateFrom.value = '';
  filterDateTo.value = '';
}

// ── Notice détail ─────────────────────────────────────────────────────────────
const selected = ref<typeof store.amendements[0] | null>(null);

// ── Formulaire ajout ──────────────────────────────────────────────────────────
const showForm = ref(false);
const todayIso = new Date().toISOString().slice(0, 10);

const form = ref({
  catalogueId: null as number | null,
  scope: 'board' as 'board' | 'sole',
  boardId: null as number | null,
  soleId: null as number | null,
  date: todayIso,
  quantity: null as number | null,
  unit: 'kg',
  description: '',
});

const selectedProduct = computed(() =>
  store.catalogue.find((c) => c.id_amendement === form.value.catalogueId) ?? null,
);

const canSubmit = computed(() => {
  if (!form.value.catalogueId || !form.value.date) return false;
  if (form.value.scope === 'board' && !form.value.boardId) return false;
  if (form.value.scope === 'sole' && !form.value.soleId) return false;
  return true;
});

async function submitForm() {
  const f = form.value;
  if (!canSubmit.value) return;

  if (f.scope === 'board') {
    await store.applyToBoard({
      date: f.date,
      catalogueId: f.catalogueId!,
      boardId: f.boardId!,
      quantity: f.quantity ?? undefined,
      unit: f.unit,
      description: f.description || undefined,
    });
  } else {
    await store.applyToSole({
      date: f.date,
      catalogueId: f.catalogueId!,
      soleId: f.soleId!,
      quantity: f.quantity ?? undefined,
      unit: f.unit,
      description: f.description || undefined,
    });
  }

  if (!store.submitError) {
    closeForm();
    await store.loadAll();
  }
}

function closeForm() {
  showForm.value = false;
  form.value = {
    catalogueId: null, scope: 'board', boardId: null, soleId: null,
    date: todayIso, quantity: null, unit: 'kg', description: '',
  };
}

// ── Catalogue ─────────────────────────────────────────────────────────────────
const showCatalogue = ref(false);
const editingCatalogue = ref<CatalogueItem | null>(null);
const catalogueForm = ref({ name: '', notice: '' });

function startEditCatalogue(item: CatalogueItem) {
  editingCatalogue.value = item;
  catalogueForm.value = { name: item.amendment_name, notice: item.notice ?? '' };
}

function cancelEditCatalogue() {
  editingCatalogue.value = null;
  catalogueForm.value = { name: '', notice: '' };
}

async function saveCatalogueItem() {
  const { name, notice } = catalogueForm.value;
  if (!name.trim()) return;
  if (editingCatalogue.value) {
    await store.updateCatalogueItem(editingCatalogue.value.id_amendement, name, notice || undefined);
    cancelEditCatalogue();
  } else {
    await store.createCatalogueItem(name, notice || undefined);
    catalogueForm.value = { name: '', notice: '' };
  }
}

async function deleteCatalogueItem(id: number) {
  await store.deleteCatalogueItem(id);
}

// ── Suppression ───────────────────────────────────────────────────────────────
const confirmId = ref<number | null>(null);
const deleting = ref<number | null>(null);

function askDelete(id: number) { confirmId.value = id; }

async function doDelete() {
  if (confirmId.value === null) return;
  deleting.value = confirmId.value;
  confirmId.value = null;
  await store.deleteAmendement(deleting.value);
  deleting.value = null;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
</script>

<style scoped>
.amendement-view {
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
  color: var(--brand-clay);
  margin: 0 0 0.25rem;
}

.amendement-view h1 {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: var(--brand-deep);
}

.view-sub {
  font-size: 0.88rem;
  color: rgba(39, 65, 53, 0.55);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* Résumé planches */
.boards-section { display: flex; flex-direction: column; gap: 0.75rem; }

.boards-section-title {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(39, 65, 53, 0.5);
  margin: 0;
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}

.board-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.9rem 1rem;
  border-radius: 18px;
  border: 1.5px solid;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 12px rgba(26, 34, 28, 0.06);
}

.board-card-recent {
  border-color: rgba(74, 103, 65, 0.28);
  background: rgba(236, 245, 233, 0.7);
}

.board-card-old {
  border-color: rgba(39, 65, 53, 0.12);
}

.board-card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.4rem;
  margin-bottom: 0.2rem;
}

.board-card-name {
  font-weight: 800;
  font-size: 0.92rem;
  color: var(--brand-deep);
}

.board-card-sole {
  font-size: 0.68rem;
  color: rgba(39, 65, 53, 0.45);
  white-space: nowrap;
}

.board-card-product {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--brand-olive);
}

.board-card-date {
  font-size: 0.75rem;
  color: rgba(39, 65, 53, 0.55);
  font-variant-numeric: tabular-nums;
}

.board-card-badge {
  align-self: flex-start;
  margin-top: 0.15rem;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
}

.badge-ok {
  background: rgba(74, 103, 65, 0.14);
  color: var(--brand-olive);
  border: 1px solid rgba(74, 103, 65, 0.25);
}

.badge-old {
  background: rgba(200, 130, 30, 0.1);
  color: #a05a10;
  border: 1px solid rgba(200, 130, 30, 0.22);
}

.board-card-never {
  font-size: 0.75rem;
  color: rgba(39, 65, 53, 0.38);
  font-style: italic;
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

/* Table */
.table-wrapper {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(39, 65, 53, 0.08);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: var(--shadow-soft);
}

.data-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }

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
.tr-clickable { cursor: pointer; }
.tr-clickable:hover td { background: rgba(74, 103, 65, 0.04); }

.td-date { font-variant-numeric: tabular-nums; white-space: nowrap; font-size: 0.84rem; }
.td-qty { font-variant-numeric: tabular-nums; }
.unit { color: rgba(39, 65, 53, 0.5); font-size: 0.8rem; }
.td-desc { max-width: 200px; }
.desc-preview { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.82rem; color: rgba(39, 65, 53, 0.65); }
.text-muted { color: rgba(39, 65, 53, 0.35); }
.td-actions { width: 48px; text-align: center; }

.product-pill {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
  background: rgba(74, 103, 65, 0.1);
  color: var(--brand-olive);
  border: 1px solid rgba(74, 103, 65, 0.2);
}

.product-pill-lg { font-size: 0.9rem; padding: 0.3rem 0.9rem; }

.delete-btn {
  width: 28px; height: 28px;
  border-radius: 999px;
  border: 1px solid rgba(200, 30, 30, 0.2);
  background: rgba(220, 38, 38, 0.06);
  color: #b91c1c;
  font-size: 0.72rem;
  cursor: pointer;
}
.delete-btn:hover:not(:disabled) { background: rgba(220, 38, 38, 0.15); }
.delete-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* States */
.state-block {
  padding: 2rem;
  text-align: center;
  color: rgba(39, 65, 53, 0.5);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(39, 65, 53, 0.08);
  border-radius: 22px;
}
.state-error { color: #c62828; }

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 27, 22, 0.42);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal {
  background: rgba(255, 252, 246, 0.98);
  border-radius: 24px;
  padding: 1.75rem 2rem;
  box-shadow: 0 24px 60px rgba(26, 34, 28, 0.22);
  border: 1px solid rgba(39, 65, 53, 0.1);
  width: 100%;
}

.modal h3 {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--brand-deep);
  margin: 0 0 1.25rem;
}

/* Notice modal */
.modal-notice { max-width: 480px; }
.modal-notice-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.notice-text { font-size: 0.95rem; color: var(--brand-deep); line-height: 1.6; margin: 0 0 1rem; }
.notice-empty { color: rgba(39, 65, 53, 0.45); font-style: italic; margin: 0 0 1rem; }
.notice-meta { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.82rem; color: rgba(39, 65, 53, 0.65); margin-bottom: 0.5rem; }
.notice-desc { font-size: 0.88rem; color: rgba(39, 65, 53, 0.75); margin: 0.5rem 0 0; }

/* Form modal */
.modal-form { max-width: 560px; max-height: 90vh; overflow-y: auto; }

.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.85rem; margin-bottom: 1.25rem; }
.form-field { display: flex; flex-direction: column; gap: 0.35rem; }
.form-field-full { grid-column: 1 / -1; }
.form-field label { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(39, 65, 53, 0.7); }

.form-field input,
.field-select,
.field-textarea {
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(39, 65, 53, 0.14);
  border-radius: 14px;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-primary);
  width: 100%;
  box-sizing: border-box;
}

.field-textarea { resize: vertical; font-family: inherit; }

.product-notice-hint {
  margin: 0.4rem 0 0;
  font-size: 0.78rem;
  color: rgba(39, 65, 53, 0.6);
  background: rgba(74, 103, 65, 0.06);
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  border-left: 3px solid rgba(74, 103, 65, 0.3);
  line-height: 1.5;
}

.scope-radios { display: flex; gap: 1.5rem; padding: 0.35rem 0; }
.scope-radio { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer; }

.modal-footer { display: flex; gap: 0.75rem; justify-content: flex-end; }
.form-error { color: #c62828; font-size: 0.84rem; margin: 0 0 0.75rem; }

/* Catalogue modal */
.modal-catalogue { max-width: 520px; max-height: 90vh; overflow-y: auto; padding: 0; }
.catalogue-header { display: flex; align-items: center; justify-content: space-between; padding: 1.5rem 1.75rem 1rem; border-bottom: 1px solid rgba(39, 65, 53, 0.08); }
.catalogue-header h3 { margin: 0; font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: var(--brand-deep); }
.catalogue-list { padding: 0.75rem 1.75rem; display: flex; flex-direction: column; gap: 0.65rem; max-height: 300px; overflow-y: auto; }
.catalogue-item { padding: 0.75rem 0.9rem; border-radius: 14px; border: 1px solid rgba(39, 65, 53, 0.08); background: rgba(255, 255, 255, 0.7); }
.catalogue-item-main { display: flex; align-items: center; justify-content: space-between; }
.catalogue-name { font-weight: 800; font-size: 0.9rem; color: var(--brand-deep); }
.catalogue-actions { display: flex; gap: 0.4rem; }
.catalogue-notice { margin: 0.35rem 0 0; font-size: 0.78rem; color: rgba(39, 65, 53, 0.6); line-height: 1.45; }
.catalogue-empty { color: rgba(39, 65, 53, 0.4); font-style: italic; text-align: center; padding: 1rem 0; }
.catalogue-form { padding: 1.25rem 1.75rem 1.5rem; border-top: 1px solid rgba(39, 65, 53, 0.08); display: flex; flex-direction: column; gap: 0.75rem; }
.catalogue-form h4 { margin: 0 0 0.5rem; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(39, 65, 53, 0.6); }
.catalogue-form-actions { display: flex; gap: 0.65rem; }

/* Confirm modal */
.modal-confirm { max-width: 320px; text-align: center; }
.modal-confirm p { font-size: 1rem; font-weight: 700; color: var(--brand-deep); margin: 0 0 1.25rem; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: center; }

/* Buttons */
.btn-primary {
  padding: 0.7rem 1.25rem;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, var(--brand-olive), var(--brand-deep));
  color: #fffdf8;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 160ms, transform 160ms;
}
.btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-secondary {
  padding: 0.7rem 1.1rem;
  border-radius: 14px;
  border: 1px solid rgba(39, 65, 53, 0.18);
  background: rgba(255, 255, 255, 0.85);
  color: var(--brand-deep);
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-secondary:hover { background: rgba(39, 65, 53, 0.06); }

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

.icon-btn {
  width: 28px; height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(39, 65, 53, 0.14);
  background: rgba(255, 255, 255, 0.85);
  color: var(--brand-deep);
  font-size: 0.8rem;
  cursor: pointer;
}
.icon-btn:hover { background: rgba(39, 65, 53, 0.08); }
.icon-btn-danger { border-color: rgba(200, 30, 30, 0.2); color: #b91c1c; }
.icon-btn-danger:hover { background: rgba(220, 38, 38, 0.08); }

.close-x {
  width: 30px; height: 30px;
  border-radius: 999px;
  border: 1px solid rgba(39, 65, 53, 0.12);
  background: rgba(39, 65, 53, 0.06);
  color: var(--brand-deep);
  font-size: 0.8rem;
  cursor: pointer;
}

@media (max-width: 720px) {
  .amendement-view { padding: 1.25rem 1rem; }
  .form-grid { grid-template-columns: 1fr; }
  .header-actions { flex-direction: column; width: 100%; }
}
</style>
