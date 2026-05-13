<template>
  <div class="vsearch-backdrop" @click.self="store.closeVegetableSearch()">
    <aside class="vsearch-panel" role="dialog" aria-modal="true" aria-label="Recherche par légume">

      <header class="vsearch-header">
        <div>
          <p class="vsearch-eyebrow">Recherche par légume</p>
          <h3 class="vsearch-title">Trouver des sections disponibles</h3>
        </div>
        <button type="button" class="close-btn" aria-label="Fermer" @click="store.closeVegetableSearch()">✕</button>
      </header>

      <!-- Step 1: Vegetable + dates -->
      <div class="vsearch-body">
        <section class="vsearch-section">
          <h4>1. Choisissez un légume</h4>
          <input
            v-model="vegetableSearch"
            class="veg-search-input"
            type="search"
            placeholder="Filtrer…"
            autocomplete="off"
          />
          <div v-if="botanical.loading" class="state-info">Chargement du catalogue…</div>
          <div v-else-if="groupedVegetables.length === 0" class="state-info">Aucun légume trouvé.</div>
          <div v-else class="veg-groups">
            <div
              v-for="group in groupedVegetables"
              :key="group.familyId"
              class="veg-group"
            >
              <div class="group-header">
                <span class="family-name">{{ group.familyName }}</span>
                <span
                  class="importance-badge"
                  :class="group.importance === 'primaire' ? 'imp-primary' : 'imp-secondary'"
                >{{ group.importance }}</span>
              </div>
              <div class="veg-list">
                <button
                  v-for="veg in group.vegetables"
                  :key="veg.id_vegetable"
                  type="button"
                  class="veg-btn"
                  :class="{ selected: selectedVegetableId === veg.id_vegetable }"
                  @click="selectedVegetableId = veg.id_vegetable"
                >
                  {{ veg.vegetable_name }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="vsearch-section">
          <h4>2. Périmètre de recherche</h4>
          <div class="date-grid">
            <div class="form-field">
              <label for="vsearch-exp">Exploitation</label>
              <select
                id="vsearch-exp"
                v-model.number="selectedExploitationId"
                class="vsearch-select"
                @change="selectedSoleId = null"
              >
                <option :value="null">Toutes</option>
                <option
                  v-for="exp in store.uniqueExploitations"
                  :key="exp.id_exploitation"
                  :value="exp.id_exploitation"
                >{{ exp.exploitation_name }}</option>
              </select>
            </div>
            <div class="form-field">
              <label for="vsearch-sole">Sole</label>
              <select
                id="vsearch-sole"
                v-model.number="selectedSoleId"
                class="vsearch-select"
                :disabled="solesForExploitation.length === 0"
              >
                <option :value="null">Toutes</option>
                <option
                  v-for="s in solesForExploitation"
                  :key="s.id_sole"
                  :value="s.id_sole"
                >{{ s.sole_name }}</option>
              </select>
            </div>
          </div>
        </section>

        <section class="vsearch-section">
          <h4>3. Période de plantation</h4>
          <div class="date-grid">
            <div class="form-field">
              <label for="vsearch-start">Début</label>
              <input id="vsearch-start" v-model="searchStartDate" type="date" />
            </div>
            <div class="form-field">
              <label for="vsearch-end">Fin</label>
              <input id="vsearch-end" v-model="searchEndDate" type="date" :min="searchStartDate" />
            </div>
          </div>

          <button
            type="button"
            class="search-btn"
            :disabled="!canSearch || store.plantableSectionsLoading"
            @click="runSearch"
          >
            {{ store.plantableSectionsLoading ? 'Recherche…' : 'Rechercher les sections disponibles' }}
          </button>
        </section>

        <!-- Results -->
        <section v-if="hasSearched" class="vsearch-section results-section">
          <h4>4. Sections disponibles</h4>

          <div v-if="store.plantableSectionsLoading" class="state-info">Recherche en cours…</div>

          <div v-else-if="store.plantableSectionsError" class="state-error">
            {{ store.plantableSectionsError }}
          </div>

          <div v-else-if="filteredSectionsByBoard.length === 0" class="state-empty">
            Aucune section disponible pour ce légume sur cette période.<br>
            <small>Vérifiez les règles de rotation (5 ans) ou choisissez d'autres dates.</small>
          </div>

          <div v-else class="results-list">
            <div
              v-for="boardGroup in filteredSectionsByBoard"
              :key="boardGroup.boardName"
              class="result-board"
            >
              <div class="result-board-name">
                {{ boardGroup.boardName }}
                <span v-if="boardGroup.soleName" class="result-sole-name">— {{ boardGroup.soleName }}</span>
              </div>
              <div class="result-sections">
                <div
                  v-for="section in boardGroup.sections"
                  :key="`${section.boardId}-${section.sectionNumber}`"
                  class="result-section"
                  :class="{ 'never-planted': section.neverPlanted }"
                >
                  <div class="section-info">
                    <span class="section-label">Section {{ section.sectionNumber }}</span>
                    <span v-if="section.neverPlanted" class="badge-never">Jamais planté</span>
                    <span v-else-if="section.lastPlantedVegetable" class="badge-last">
                      Dernier : {{ section.lastPlantedVegetable }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePlanningStore } from '@/stores/planning';
import { useBotanicalStore } from '@/stores/botanical';
import type { PlantableSection } from '@/types/planning';

const store = usePlanningStore();
const botanical = useBotanicalStore();

const selectedVegetableId = ref<number | null>(null);
const vegetableSearch = ref('');
const searchStartDate = ref(`${store.selectedYear}-01-01`);
const searchEndDate = ref(`${store.selectedYear}-12-31`);
const hasSearched = ref(false);

// ── Filtres exploitation / sole ───────────────────────────────────────────────
const selectedExploitationId = ref<number | null>(null);
const selectedSoleId = ref<number | null>(null);

const solesForExploitation = computed(() => {
  if (selectedExploitationId.value === null) return store.soles;
  return store.soles.filter(
    (s) => s.exploitation?.id_exploitation === selectedExploitationId.value,
  );
});

// Lookup: boardId → { soleId, exploitationId }
const boardToSole = computed(() => {
  const map = new Map<number, { soleId: number; exploitationId: number; soleName: string }>();
  for (const sole of store.soles) {
    for (const board of sole.boards) {
      map.set(board.id_board, {
        soleId: sole.id_sole,
        exploitationId: sole.exploitation?.id_exploitation ?? -1,
        soleName: sole.sole_name,
      });
    }
  }
  return map;
});

const filteredSectionsByBoard = computed(() => {
  const sections = store.plantableSections.filter((s) => {
    const meta = boardToSole.value.get(s.boardId);
    if (!meta) return true; // inconnu → inclure par défaut
    if (selectedSoleId.value !== null && meta.soleId !== selectedSoleId.value) return false;
    if (selectedExploitationId.value !== null && meta.exploitationId !== selectedExploitationId.value) return false;
    return true;
  });

  const map = new Map<number, { boardName: string; soleName: string; sections: PlantableSection[] }>();
  for (const s of sections) {
    if (!map.has(s.boardId)) {
      const meta = boardToSole.value.get(s.boardId);
      map.set(s.boardId, { boardName: s.boardName, soleName: meta?.soleName ?? '', sections: [] });
    }
    map.get(s.boardId)!.sections.push(s);
  }
  return [...map.values()];
});

onMounted(() => {
  if (botanical.families.length === 0) botanical.loadAll();
  if (store.soles.length === 0) store.loadSoles();
});

const groupedVegetables = computed(() => {
  const q = vegetableSearch.value.toLowerCase().trim();
  return botanical.families
    .map((f) => ({
      familyId: f.id_family,
      familyName: f.family_name,
      importance: f.family_importance?.importance_name ?? '',
      vegetables: (f.vegetables ?? []).filter(
        (v) => !q || v.vegetable_name.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.vegetables.length > 0)
    .sort((a, b) => {
      if (a.importance === 'primaire' && b.importance !== 'primaire') return -1;
      if (a.importance !== 'primaire' && b.importance === 'primaire') return 1;
      return a.familyName.localeCompare(b.familyName);
    });
});

const canSearch = computed(
  () =>
    selectedVegetableId.value !== null &&
    searchStartDate.value &&
    searchEndDate.value &&
    searchStartDate.value <= searchEndDate.value,
);

async function runSearch() {
  if (!canSearch.value || selectedVegetableId.value === null) return;
  hasSearched.value = true;
  await store.findPlantableSections(
    selectedVegetableId.value,
    searchStartDate.value,
    searchEndDate.value,
  );
}

function planHere(section: PlantableSection) {
  if (selectedVegetableId.value === null) return;
  store.jumpToSection(section, selectedVegetableId.value, searchStartDate.value, searchEndDate.value);
}
</script>

<style scoped>
.vsearch-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 27, 22, 0.42);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
  padding: 1rem;
}

.vsearch-panel {
  width: min(560px, 100vw);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(255, 251, 244, 0.98), rgba(248, 242, 231, 0.94));
  border-radius: 28px 0 0 28px;
  border-left: 1px solid rgba(39, 65, 53, 0.08);
  box-shadow: -18px 0 54px rgba(26, 34, 28, 0.18);
  overflow: hidden;
}

.vsearch-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.35rem 1.5rem;
  border-bottom: 1px solid rgba(39, 65, 53, 0.08);
  background: inherit;
  flex-shrink: 0;
}

.vsearch-eyebrow {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 800;
  color: var(--brand-clay);
  margin: 0 0 0.25rem;
}

.vsearch-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: var(--brand-deep);
}

.close-btn {
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(39, 65, 53, 0.08);
  border: 1px solid rgba(39, 65, 53, 0.12);
  border-radius: 999px;
  font-size: 1.05rem;
  cursor: pointer;
  color: var(--brand-deep);
  flex-shrink: 0;
}

.vsearch-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vsearch-section {
  padding: 1rem 1.1rem 1.1rem;
  border-radius: 22px;
  border: 1px solid rgba(39, 65, 53, 0.08);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-soft);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.vsearch-section h4 {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--brand-clay);
  margin: 0;
}

.veg-search-input {
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(39, 65, 53, 0.14);
  border-radius: 12px;
  font-size: 0.92rem;
  background: rgba(255, 255, 255, 0.94);
  color: var(--text-primary);
  width: 100%;
  box-sizing: border-box;
}

.veg-groups {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 260px;
  overflow-y: auto;
}

.veg-group { display: flex; flex-direction: column; gap: 0.4rem; }

.group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.family-name {
  font-weight: 800;
  font-size: 0.84rem;
  color: var(--brand-deep);
}

.importance-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.imp-primary {
  background: rgba(74, 103, 65, 0.12);
  color: var(--brand-olive);
  border: 1px solid rgba(74, 103, 65, 0.2);
}

.imp-secondary {
  background: rgba(39, 65, 53, 0.07);
  color: rgba(39, 65, 53, 0.65);
  border: 1px solid rgba(39, 65, 53, 0.12);
}

.veg-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.veg-btn {
  padding: 0.45rem 0.85rem;
  border: 1px solid rgba(39, 65, 53, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--brand-deep);
  cursor: pointer;
  transition: background 120ms, border-color 120ms;
}

.veg-btn:hover { background: rgba(74, 103, 65, 0.08); border-color: rgba(74, 103, 65, 0.2); }

.veg-btn.selected {
  background: rgba(74, 103, 65, 0.14);
  border-color: rgba(74, 103, 65, 0.32);
  font-weight: 800;
}

.date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-field { display: flex; flex-direction: column; gap: 0.3rem; }

.form-field label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(39, 65, 53, 0.65);
}

.form-field input,
.vsearch-select {
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(39, 65, 53, 0.14);
  border-radius: 12px;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.94);
  color: var(--text-primary);
  width: 100%;
  box-sizing: border-box;
}

.vsearch-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23274135' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.9rem center;
  padding-right: 2.2rem;
  cursor: pointer;
}

.vsearch-select:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.search-btn {
  padding: 0.85rem 1.25rem;
  background: linear-gradient(135deg, var(--brand-olive), var(--brand-deep));
  color: #fffdf8;
  border: none;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 10px 20px rgba(39, 65, 53, 0.2);
  transition: opacity 160ms, transform 160ms;
}

.search-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.search-btn:hover:not(:disabled) { transform: translateY(-1px); }

.results-section { gap: 0.6rem; }

.results-list { display: flex; flex-direction: column; gap: 0.75rem; }

.result-board {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.result-board-name {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(39, 65, 53, 0.55);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.result-sole-name {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.76rem;
  color: rgba(39, 65, 53, 0.4);
}

.result-sections { display: flex; flex-direction: column; gap: 0.3rem; }

.result-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.9rem;
  border-radius: 14px;
  border: 1px solid rgba(39, 65, 53, 0.1);
  background: rgba(255, 255, 255, 0.8);
  transition: border-color 120ms;
}

.result-section.never-planted {
  border-color: rgba(74, 103, 65, 0.2);
  background: rgba(74, 103, 65, 0.04);
}

.section-info { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0; }

.section-label {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--brand-deep);
  white-space: nowrap;
}

.badge-never {
  font-size: 0.68rem;
  background: rgba(74, 103, 65, 0.12);
  color: var(--brand-olive);
  border: 1px solid rgba(74, 103, 65, 0.2);
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-weight: 700;
  white-space: nowrap;
}

.badge-last {
  font-size: 0.72rem;
  color: rgba(39, 65, 53, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan-here-btn {
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  border: 1.5px solid rgba(74, 103, 65, 0.3);
  background: rgba(255, 255, 255, 0.9);
  color: var(--brand-deep);
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 140ms, border-color 140ms;
}

.plan-here-btn:hover {
  background: rgba(74, 103, 65, 0.1);
  border-color: rgba(74, 103, 65, 0.45);
}

.state-info, .state-empty {
  padding: 1.25rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.88rem;
  border-radius: 14px;
  border: 1px dashed rgba(39, 65, 53, 0.14);
  line-height: 1.6;
}

.state-error {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: rgba(200, 60, 60, 0.07);
  border: 1px solid rgba(200, 60, 60, 0.18);
  color: #b94040;
  font-size: 0.86rem;
}

@media (max-width: 720px) {
  .vsearch-backdrop { padding: 0; }
  .vsearch-panel { width: 100vw; border-radius: 0; }
  .date-grid { grid-template-columns: 1fr; }
}
</style>
