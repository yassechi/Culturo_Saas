<template>
  <div class="botanical-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-title">
        <h1>Référentiel botanique</h1>
        <p class="header-sub">Familles, légumes et variétés cultivés dans les exploitations</p>
      </div>
      <div class="header-stats">
        <div class="stat-chip">
          <span class="stat-value">{{ store.stats.families }}</span>
          <span class="stat-label">Familles</span>
        </div>
        <div class="stat-chip">
          <span class="stat-value">{{ store.stats.vegetables }}</span>
          <span class="stat-label">Légumes</span>
        </div>
        <div class="stat-chip">
          <span class="stat-value">{{ store.stats.varieties }}</span>
          <span class="stat-label">Variétés</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Global error -->
    <div v-if="store.error" class="global-error">{{ store.error }}</div>

    <!-- Loading skeleton -->
    <div v-if="store.loading" class="loading-state">
      <div v-for="n in 4" :key="n" class="skeleton-row" />
    </div>

    <template v-else>
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- TAB: FAMILLES                                                      -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <section v-if="activeTab === 'families'" class="tab-panel">
        <div class="panel-toolbar">
          <span class="panel-count">{{ store.families.length }} famille(s)</span>
          <button class="btn-primary" @click="store.openCreateFamily()">+ Nouvelle famille</button>
        </div>

        <div class="family-grid">
          <div
            v-for="fam in store.families"
            :key="fam.id_family"
            class="family-card"
          >
            <div class="family-card-header">
              <span class="family-name">{{ fam.family_name }}</span>
              <span
                class="importance-badge"
                :class="importanceClass(fam.family_importance?.importance_name)"
              >
                {{ fam.family_importance?.importance_name ?? '—' }}
              </span>
            </div>
            <div class="family-card-body">
              <span class="veg-count">{{ fam.vegetables?.length ?? 0 }} légume(s)</span>
              <div class="veg-pills">
                <span
                  v-for="v in (fam.vegetables ?? []).slice(0, 5)"
                  :key="v.id_vegetable"
                  class="veg-pill"
                >
                  {{ v.vegetable_name }}
                </span>
                <span v-if="(fam.vegetables?.length ?? 0) > 5" class="veg-pill more">
                  +{{ (fam.vegetables?.length ?? 0) - 5 }}
                </span>
              </div>
            </div>
            <div class="family-card-actions">
              <button class="btn-icon" title="Modifier" @click="store.openEditFamily(fam)">✏️</button>
              <button
                class="btn-icon btn-danger"
                title="Supprimer"
                @click="confirmDeleteFamily(fam.id_family, fam.family_name)"
              >🗑️</button>
            </div>
          </div>
        </div>

        <div v-if="store.families.length === 0" class="empty-state">
          Aucune famille enregistrée. Créez-en une pour commencer.
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- TAB: LÉGUMES                                                       -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <section v-if="activeTab === 'vegetables'" class="tab-panel">
        <div class="panel-toolbar">
          <div class="toolbar-filters">
            <input
              v-model="store.vegSearch"
              class="search-input"
              placeholder="Rechercher un légume…"
            />
            <select v-model.number="store.vegFamilyFilter" class="filter-select">
              <option :value="null">Toutes les familles</option>
              <option
                v-for="fam in store.families"
                :key="fam.id_family"
                :value="fam.id_family"
              >{{ fam.family_name }}</option>
            </select>
          </div>
          <button class="btn-primary" @click="store.openCreateVegetable()">+ Nouveau légume</button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Légume</th>
                <th>Famille</th>
                <th>Plantation</th>
                <th>Récolte</th>
                <th>Durée (j)</th>
                <th>Espacement</th>
                <th>Rendement</th>
                <th>Variétés</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="veg in store.filteredVegetables" :key="veg.id_vegetable">
                <tr class="veg-row">
                  <td class="veg-name-cell">
                    <button
                      class="expand-btn"
                      :class="{ expanded: store.expandedVegetableId === veg.id_vegetable }"
                      @click="store.toggleVarieties(veg.id_vegetable)"
                    >▶</button>
                    {{ veg.vegetable_name }}
                  </td>
                  <td>
                    <span
                      class="importance-badge sm"
                      :class="importanceClass(veg.family?.family_importance?.importance_name)"
                    >
                      {{ veg.family?.family_name ?? '—' }}
                    </span>
                  </td>
                  <td>{{ veg.planting_season }}</td>
                  <td>{{ veg.harvest_season }}</td>
                  <td>{{ veg.harvest_duration_min }}–{{ veg.harvest_duration_max }}</td>
                  <td>{{ veg.inrow_distance }} / {{ veg.in_row_spacing }} cm</td>
                  <td>{{ veg.estimated_yield }} kg</td>
                  <td>
                    <span class="variety-count">{{ veg.varieties?.length ?? 0 }}</span>
                  </td>
                  <td class="actions-cell">
                    <button class="btn-icon" title="Modifier" @click="store.openEditVegetable(veg)">✏️</button>
                    <button
                      class="btn-icon btn-danger"
                      title="Supprimer"
                      @click="confirmDeleteVeg(veg.id_vegetable, veg.vegetable_name)"
                    >🗑️</button>
                  </td>
                </tr>

                <!-- Variety inline panel -->
                <tr
                  v-if="store.expandedVegetableId === veg.id_vegetable"
                  class="variety-row"
                >
                  <td colspan="9">
                    <div class="variety-panel">
                      <div v-if="store.varietiesLoading[veg.id_vegetable]" class="variety-loading">
                        Chargement des variétés…
                      </div>
                      <template v-else>
                        <div class="variety-list">
                          <div
                            v-for="vr in store.varietiesMap[veg.id_vegetable] ?? []"
                            :key="vr.id_variety"
                            class="variety-chip"
                          >
                            {{ vr.variety_name }}
                            <button
                              class="variety-del"
                              title="Supprimer"
                              @click="store.deleteVariety(veg.id_vegetable, vr.id_variety)"
                            >×</button>
                          </div>
                          <span
                            v-if="!(store.varietiesMap[veg.id_vegetable]?.length)"
                            class="no-variety"
                          >Aucune variété enregistrée.</span>
                        </div>
                        <div class="variety-add">
                          <input
                            v-model="store.newVarietyName[veg.id_vegetable]"
                            class="variety-input"
                            placeholder="Nouvelle variété…"
                            @keydown.enter="store.addVariety(veg.id_vegetable)"
                          />
                          <button
                            class="btn-sm-primary"
                            @click="store.addVariety(veg.id_vegetable)"
                          >Ajouter</button>
                        </div>
                        <p v-if="store.varietyError" class="variety-err">{{ store.varietyError }}</p>
                      </template>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div v-if="store.filteredVegetables.length === 0" class="empty-state">
          Aucun légume trouvé. Modifiez les filtres ou créez-en un.
        </div>
      </section>
    </template>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Famille                                                         -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="store.familyModalOpen" class="modal-backdrop" @click.self="store.closeFamilyModal()">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ store.familyModalMode === 'create' ? 'Nouvelle famille' : 'Modifier la famille' }}</h2>
            <button class="modal-close" @click="store.closeFamilyModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="field-group">
              <label>Nom de la famille</label>
              <input v-model="store.familyForm.family_name" placeholder="Ex: Solanacées" />
            </div>
            <div class="field-group">
              <label>Importance agronomique</label>
              <select v-model.number="store.familyForm.id_family_importance">
                <option :value="null" disabled>Choisir…</option>
                <option
                  v-for="imp in store.importances"
                  :key="imp.id_family_importance"
                  :value="imp.id_family_importance"
                >{{ imp.importance_name }}</option>
              </select>
            </div>
            <p v-if="store.familyModalError" class="modal-error">{{ store.familyModalError }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="store.closeFamilyModal()">Annuler</button>
            <button
              class="btn-primary"
              :disabled="store.familyModalLoading"
              @click="store.submitFamilyModal()"
            >
              {{ store.familyModalLoading ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Légume                                                           -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="store.vegModalOpen" class="modal-backdrop" @click.self="store.closeVegModal()">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h2>{{ store.vegModalMode === 'create' ? 'Nouveau légume' : 'Modifier le légume' }}</h2>
            <button class="modal-close" @click="store.closeVegModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-grid-2">
              <div class="field-group">
                <label>Nom du légume</label>
                <input v-model="store.vegForm.vegetable_name" placeholder="Ex: Tomate" />
              </div>
              <div class="field-group">
                <label>Famille</label>
                <select v-model.number="store.vegForm.id_family">
                  <option :value="null" disabled>Choisir…</option>
                  <option
                    v-for="fam in store.families"
                    :key="fam.id_family"
                    :value="fam.id_family"
                  >{{ fam.family_name }}</option>
                </select>
              </div>
              <div class="field-group">
                <label>Saison de plantation</label>
                <input v-model="store.vegForm.planting_season" placeholder="Ex: Printemps" />
              </div>
              <div class="field-group">
                <label>Saison de récolte</label>
                <input v-model="store.vegForm.harvest_season" placeholder="Ex: Été" />
              </div>
              <div class="field-group">
                <label>Durée min récolte (jours)</label>
                <input v-model.number="store.vegForm.harvest_duration_min" type="number" min="1" />
              </div>
              <div class="field-group">
                <label>Durée max récolte (jours)</label>
                <input v-model.number="store.vegForm.harvest_duration_max" type="number" min="1" />
              </div>
              <div class="field-group">
                <label>Distance dans rangée (cm)</label>
                <input v-model.number="store.vegForm.inrow_distance" type="number" min="1" />
              </div>
              <div class="field-group">
                <label>Espacement entre rangées (cm)</label>
                <input v-model.number="store.vegForm.in_row_spacing" type="number" min="1" />
              </div>
              <div class="field-group">
                <label>Rendement estimé (kg)</label>
                <input v-model.number="store.vegForm.estimated_yield" type="number" min="1" />
              </div>
            </div>
            <p v-if="store.vegModalError" class="modal-error">{{ store.vegModalError }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="store.closeVegModal()">Annuler</button>
            <button
              class="btn-primary"
              :disabled="store.vegModalLoading"
              @click="store.submitVegModal()"
            >
              {{ store.vegModalLoading ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useBotanicalStore } from '@/stores/botanical';

const store = useBotanicalStore();
const activeTab = ref<'families' | 'vegetables'>('families');

const tabs = [
  { key: 'families' as const, label: 'Familles' },
  { key: 'vegetables' as const, label: 'Légumes & Variétés' },
];

onMounted(() => store.loadAll());

const IMPORTANCE_CLASSES: Record<string, string> = {
  principal: 'imp-principal',
  principale: 'imp-principal',
  secondaire: 'imp-secondary',
  neutre: 'imp-neutral',
  faible: 'imp-neutral',
};

function importanceClass(name?: string): string {
  if (!name) return 'imp-neutral';
  return IMPORTANCE_CLASSES[name.toLowerCase()] ?? 'imp-neutral';
}

function confirmDeleteFamily(id: number, name: string) {
  if (confirm(`Supprimer la famille "${name}" ?`)) store.deleteFamily(id);
}

function confirmDeleteVeg(id: number, name: string) {
  if (confirm(`Supprimer le légume "${name}" ? Ses variétés seront également supprimées.`)) {
    store.deleteVegetable(id);
  }
}
</script>

<style scoped>
/* ── Layout ───────────────────────────────────────────────────────────────── */
.botanical-view {
  padding: 1.5rem 2rem;
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
}

.header-sub {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: rgba(39, 65, 53, 0.6);
}

.header-stats {
  display: flex;
  gap: 0.75rem;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.6rem 1.1rem;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(251,246,236,0.86));
  border: 1px solid rgba(39,65,53,0.1);
  box-shadow: 0 2px 8px rgba(39,65,53,0.06);
  min-width: 64px;
}

.stat-value {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(39,65,53,0.55);
  margin-top: 0.25rem;
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */
.tab-bar {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid rgba(39,65,53,0.1);
  padding-bottom: 0;
}

.tab-btn {
  padding: 0.65rem 1.4rem;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(39,65,53,0.5);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 160ms, border-color 160ms;
  border-radius: 8px 8px 0 0;
}

.tab-btn:hover { color: var(--text-primary); }
.tab-btn.active {
  color: var(--text-primary);
  border-bottom-color: rgba(74, 103, 65, 0.8);
  background: rgba(74,103,65,0.06);
}

/* ── Panel toolbar ────────────────────────────────────────────────────────── */
.panel-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.panel-count {
  font-size: 0.85rem;
  color: rgba(39,65,53,0.55);
  font-weight: 600;
}

/* ── Buttons ──────────────────────────────────────────────────────────────── */
.btn-primary {
  padding: 0.65rem 1.2rem;
  border-radius: 12px;
  border: none;
  background: rgba(74,103,65,0.88);
  color: #fff;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background 160ms, transform 120ms;
}
.btn-primary:hover { background: rgba(74,103,65,1); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.btn-secondary {
  padding: 0.65rem 1.2rem;
  border-radius: 12px;
  border: 1px solid rgba(39,65,53,0.18);
  background: rgba(255,255,255,0.9);
  color: var(--text-primary);
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
}

.btn-icon {
  padding: 0.3rem 0.55rem;
  border: 1px solid rgba(39,65,53,0.12);
  border-radius: 8px;
  background: rgba(255,255,255,0.85);
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 120ms;
}
.btn-icon:hover { background: rgba(255,255,255,1); }
.btn-icon.btn-danger:hover { background: rgba(255,80,80,0.08); border-color: rgba(200,50,50,0.2); }

.btn-sm-primary {
  padding: 0.4rem 0.9rem;
  border-radius: 10px;
  border: none;
  background: rgba(74,103,65,0.85);
  color: #fff;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

/* ── Inputs ───────────────────────────────────────────────────────────────── */
.search-input,
.filter-select {
  padding: 0.6rem 0.9rem;
  border: 1px solid rgba(39,65,53,0.14);
  border-radius: 12px;
  font-size: 0.88rem;
  background: rgba(255,255,255,0.94);
  color: var(--text-primary);
  min-width: 180px;
}

/* ── Family grid ──────────────────────────────────────────────────────────── */
.family-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.family-card {
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(251,246,236,0.88));
  border: 1px solid rgba(39,65,53,0.1);
  box-shadow: 0 2px 12px rgba(39,65,53,0.06);
  padding: 1.1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.family-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.family-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.family-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.veg-count {
  font-size: 0.78rem;
  color: rgba(39,65,53,0.55);
  font-weight: 600;
}

.veg-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.veg-pill {
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: rgba(74,103,65,0.1);
  color: rgba(39,65,53,0.8);
  font-size: 0.74rem;
  font-weight: 600;
}
.veg-pill.more {
  background: rgba(39,65,53,0.07);
  color: rgba(39,65,53,0.5);
}

.family-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
}

/* ── Importance badges ────────────────────────────────────────────────────── */
.importance-badge {
  padding: 0.22rem 0.7rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.importance-badge.sm {
  font-size: 0.7rem;
  padding: 0.18rem 0.6rem;
}

.imp-principal {
  background: rgba(74,140,65,0.14);
  color: #2d6b30;
}
.imp-secondary {
  background: rgba(200,140,30,0.14);
  color: #8a6010;
}
.imp-neutral {
  background: rgba(100,100,100,0.1);
  color: rgba(39,65,53,0.6);
}

/* ── Table ────────────────────────────────────────────────────────────────── */
.table-wrap {
  overflow-x: auto;
  border-radius: 20px;
  border: 1px solid rgba(39,65,53,0.1);
  background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(251,246,236,0.88));
  box-shadow: 0 2px 12px rgba(39,65,53,0.06);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table thead tr {
  border-bottom: 1px solid rgba(39,65,53,0.1);
}

.data-table th {
  padding: 0.8rem 1rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(39,65,53,0.55);
  white-space: nowrap;
}

.data-table td {
  padding: 0.7rem 1rem;
  color: var(--text-primary);
  white-space: nowrap;
}

.veg-row { border-bottom: 1px solid rgba(39,65,53,0.07); }
.veg-row:hover { background: rgba(74,103,65,0.03); }

.veg-name-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
}

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.65rem;
  color: rgba(39,65,53,0.45);
  transition: transform 200ms;
  padding: 0.15rem;
  line-height: 1;
}
.expand-btn.expanded { transform: rotate(90deg); color: rgba(74,103,65,0.85); }

.variety-count {
  display: inline-block;
  min-width: 1.4rem;
  text-align: center;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: rgba(74,103,65,0.1);
  color: rgba(39,65,53,0.75);
  font-weight: 700;
  font-size: 0.78rem;
}

.actions-cell {
  display: flex;
  gap: 0.35rem;
}

/* ── Variety inline panel ─────────────────────────────────────────────────── */
.variety-row td {
  padding: 0;
  border-bottom: 1px solid rgba(39,65,53,0.08);
}

.variety-panel {
  padding: 0.9rem 1.5rem 1rem 2.8rem;
  background: rgba(74,103,65,0.03);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.variety-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.variety-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba(39,65,53,0.12);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
}

.variety-del {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(180,60,60,0.65);
  font-size: 1rem;
  line-height: 1;
  padding: 0 0.1rem;
  font-weight: 700;
}
.variety-del:hover { color: rgba(180,60,60,1); }

.no-variety {
  font-size: 0.8rem;
  color: rgba(39,65,53,0.4);
  font-style: italic;
}

.variety-add {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.variety-input {
  padding: 0.4rem 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(39,65,53,0.14);
  font-size: 0.84rem;
  background: rgba(255,255,255,0.94);
  min-width: 200px;
}

.variety-loading {
  font-size: 0.82rem;
  color: rgba(39,65,53,0.5);
  font-style: italic;
}

.variety-err {
  font-size: 0.8rem;
  color: #b94040;
  margin: 0;
}

/* ── States ───────────────────────────────────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(39,65,53,0.45);
  font-size: 0.9rem;
}

.global-error {
  padding: 0.8rem 1.2rem;
  border-radius: 12px;
  background: rgba(200,60,60,0.08);
  border: 1px solid rgba(200,60,60,0.2);
  color: #b94040;
  font-size: 0.88rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-row {
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(39,65,53,0.06) 0%, rgba(39,65,53,0.03) 50%, rgba(39,65,53,0.06) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Modal ────────────────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20,35,25,0.45);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: linear-gradient(180deg, rgba(255,255,255,0.97), rgba(251,246,236,0.96));
  border-radius: 24px;
  border: 1px solid rgba(39,65,53,0.1);
  box-shadow: 0 24px 60px rgba(20,35,25,0.22);
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.modal.modal-lg { max-width: 700px; }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.3rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(39,65,53,0.09);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: rgba(39,65,53,0.45);
  line-height: 1;
  padding: 0.1rem 0.3rem;
}

.modal-body {
  padding: 1.2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.3rem;
  border-top: 1px solid rgba(39,65,53,0.09);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-group label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(39,65,53,0.6);
}

.field-group input,
.field-group select {
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(39,65,53,0.14);
  border-radius: 12px;
  font-size: 0.92rem;
  background: rgba(255,255,255,0.94);
  color: var(--text-primary);
  width: 100%;
  box-sizing: border-box;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.9rem;
}

.modal-error {
  color: #b94040;
  font-size: 0.84rem;
  margin: 0;
  background: rgba(200,60,60,0.07);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .botanical-view { padding: 1rem; }
  .view-header { flex-direction: column; }
  .header-stats { flex-wrap: wrap; }
  .panel-toolbar { flex-direction: column; align-items: stretch; }
  .form-grid-2 { grid-template-columns: 1fr; }
  .data-table th:nth-child(n+5),
  .data-table td:nth-child(n+5) { display: none; }
}
</style>
