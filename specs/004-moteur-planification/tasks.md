# Tasks: Phase 4 — Moteur de Planification (Frontend)

**Input**: `specs/004-moteur-planification/` (plan.md, spec.md, data-model.md, contracts/, research.md)
**Stack**: Vue 3 + Pinia + Axios — `culturo/front-culturo/src/`
**Zéro modification backend** — branchement sur 6 endpoints existants

> **Instruction pour LLM**: Chaque tâche contient le code complet à écrire. Copier tel quel dans le fichier indiqué. Ne modifier que si une incohérence évidente est détectée.

---

## Phase 1: Setup (Infrastructure partagée)

**Purpose**: Créer les types TypeScript partagés et la structure des dossiers.

- [ ] T001 Créer le dossier `culturo/front-culturo/src/components/planning/` (dossier vide — crée les sous-fichiers dans les tâches suivantes)

- [ ] T002 [P] Créer les types TypeScript partagés dans `culturo/front-culturo/src/types/planning.ts`

```typescript
// culturo/front-culturo/src/types/planning.ts

export interface ExploitationSummary {
  id_exploitation: number;
  exploitation_name: string;
}

export interface BoardSummary {
  id_board: number;
  board_name: string;
  id_sole: number;
}

export interface SoleWithBoards {
  id_sole: number;
  sole_name: string;
  exploitation: ExploitationSummary;
  boards: BoardSummary[];
}

export interface CulturePlanEntry {
  boardId: number;
  boardName: string;
  sectionNumber: number;
  vegetableName: string;
  startDate: string;
  endDate: string;
}

export interface PlantableVegetable {
  vegetableId: number;
  vegetableName: string;
  familyId: number;
  familyName: string;
  importance: string;
  lastPlantedInSection: string | null;
  neverPlantedInSection: boolean;
}

export interface SectionPlanResult {
  sectionPlan: { id_section_plan: number };
  status: 'CREATED' | 'FOUND';
}

export interface CanPlantResult {
  status: 'OK' | 'WARNING';
  reason?: string;
  neededBypass?: boolean;
}

export type SectionStatus = 'occupied' | 'available' | 'loading';

export interface SectionDisplay {
  sectionNumber: number;
  status: SectionStatus;
  vegetableName?: string;
  startDate?: string;
  endDate?: string;
}

export interface VegetableGroup {
  familyName: string;
  importance: string;
  neverPlanted: boolean;
  lastPlantedDate: string | null;
  vegetables: PlantableVegetable[];
}

export interface SelectedSection {
  boardId: number;
  boardName: string;
  sectionNumber: number;
  sectionPlanId: number | null;
}

export interface AssignmentForm {
  vegetableId: number | null;
  startDate: string;
  endDate: string;
  quantityPlanted: number;
  unity: string;
  varietyIdentifier: string;
  bypass: boolean;
}

export interface RuleMessage {
  type: 'ok' | 'warning';
  text: string;
}
```

- [ ] T003 [P] Créer le module API exploitations dans `culturo/front-culturo/src/api/exploitations.ts`

```typescript
// culturo/front-culturo/src/api/exploitations.ts
import apiClient from './client';
import type { SoleWithBoards, ExploitationSummary } from '@/types/planning';

export const exploitationsApi = {
  getAllSoles() {
    return apiClient.get<SoleWithBoards[]>('/sole');
  },
  getAllExploitations() {
    return apiClient.get<ExploitationSummary[]>('/exploitation');
  },
};
```

---

## Phase 2: Fondamental (Prérequis bloquants)

**Purpose**: Module API rotations + store Pinia. DOIT être complet avant toute user story.

**⚠️ CRITIQUE** : T004 et T005 doivent être terminés avant de commencer Phase 3.

- [ ] T004 Créer le module API rotations dans `culturo/front-culturo/src/api/rotations.ts`

```typescript
// culturo/front-culturo/src/api/rotations.ts
import apiClient from './client';
import type { CulturePlanEntry, PlantableVegetable, SectionPlanResult, CanPlantResult } from '@/types/planning';

export const rotationsApi = {
  getCulturePlan(soleId: number, year: number) {
    return apiClient.get<CulturePlanEntry[]>(`/rotations/plan/${soleId}`, {
      params: { year },
    });
  },

  createOrGetSectionPlan(boardId: number) {
    return apiClient.post<SectionPlanResult>(`/rotations/plan-section`, null, {
      params: { boardId },
    });
  },

  getPlantableVegetables(
    sectionPlanId: number,
    sectionNumber: number,
    startDate: string,
    endDate: string,
  ) {
    return apiClient.get<PlantableVegetable[]>('/rotations/plantable-vegetables', {
      params: { sectionPlanId, sectionNumber, startDate, endDate },
    });
  },

  addVegetableToBoard(dto: {
    boardId: number;
    sectionNumber: number;
    vegetableId: number;
    startDate: string;
    endDate: string;
    quantityPlanted?: number;
    unity?: string;
    varietyIdentifier: string;
    bypass?: boolean;
  }) {
    return apiClient.post('/rotations/add-vegetable', dto);
  },

  canPlantVegetable(boardId: number, vegetableId: number, bypass = false) {
    return apiClient.post<CanPlantResult>('/rotations/can', { boardId, vegetableId, bypass });
  },
};
```

- [ ] T005 Créer le store Pinia de planification dans `culturo/front-culturo/src/stores/planning.ts`

```typescript
// culturo/front-culturo/src/stores/planning.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { exploitationsApi } from '@/api/exploitations';
import { rotationsApi } from '@/api/rotations';
import type {
  SoleWithBoards,
  CulturePlanEntry,
  PlantableVegetable,
  SelectedSection,
  AssignmentForm,
  RuleMessage,
  SectionDisplay,
  VegetableGroup,
  ExploitationSummary,
  BoardSummary,
} from '@/types/planning';

const SECTIONS_PER_BOARD = 4;

function makeDefaultForm(): AssignmentForm {
  const year = new Date().getFullYear();
  return {
    vegetableId: null,
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    quantityPlanted: 0,
    unity: 'unité',
    varietyIdentifier: '',
    bypass: false,
  };
}

export const usePlanningStore = defineStore('planning', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const soles = ref<SoleWithBoards[]>([]);
  const selectedSoleId = ref<number | null>(null);
  const selectedYear = ref<number>(new Date().getFullYear());

  const culturePlan = ref<CulturePlanEntry[]>([]);
  const planLoading = ref(false);
  const planError = ref<string | null>(null);

  const openSection = ref<SelectedSection | null>(null);
  const plantableVegetables = ref<PlantableVegetable[]>([]);
  const vegetablesLoading = ref(false);

  const assignmentForm = ref<AssignmentForm>(makeDefaultForm());
  const assignmentLoading = ref(false);
  const lastRuleMessage = ref<RuleMessage | null>(null);

  // ── Getters ────────────────────────────────────────────────────────────────
  const selectedSole = computed<SoleWithBoards | null>(
    () => soles.value.find((s) => s.id_sole === selectedSoleId.value) ?? null,
  );

  const uniqueExploitations = computed<ExploitationSummary[]>(() => {
    const seen = new Set<number>();
    return soles.value
      .map((s) => s.exploitation)
      .filter((e) => {
        if (seen.has(e.id_exploitation)) return false;
        seen.add(e.id_exploitation);
        return true;
      });
  });

  const boardsForSelectedSole = computed<BoardSummary[]>(
    () => selectedSole.value?.boards ?? [],
  );

  const sectionDisplayMap = computed<Map<string, SectionDisplay>>(() => {
    const map = new Map<string, SectionDisplay>();

    // Initialiser toutes les sections comme disponibles
    for (const board of boardsForSelectedSole.value) {
      for (let n = 1; n <= SECTIONS_PER_BOARD; n++) {
        map.set(`${board.id_board}-${n}`, { sectionNumber: n, status: 'available' });
      }
    }

    // Marquer les sections occupées depuis le plan de culture
    for (const entry of culturePlan.value) {
      map.set(`${entry.boardId}-${entry.sectionNumber}`, {
        sectionNumber: entry.sectionNumber,
        status: 'occupied',
        vegetableName: entry.vegetableName,
        startDate: entry.startDate,
        endDate: entry.endDate,
      });
    }

    return map;
  });

  const vegetableGroups = computed<VegetableGroup[]>(() => {
    const groupMap = new Map<string, VegetableGroup>();

    for (const veg of plantableVegetables.value) {
      if (!groupMap.has(veg.familyName)) {
        groupMap.set(veg.familyName, {
          familyName: veg.familyName,
          importance: veg.importance,
          neverPlanted: veg.neverPlantedInSection,
          lastPlantedDate: veg.lastPlantedInSection,
          vegetables: [],
        });
      }
      const group = groupMap.get(veg.familyName)!;
      group.vegetables.push(veg);
      // Si au moins un légume de la famille a été planté, le groupe n'est plus "jamais planté"
      if (!veg.neverPlantedInSection) group.neverPlanted = false;
      // Garder la date la plus récente pour le tri
      if (veg.lastPlantedInSection && (!group.lastPlantedDate || veg.lastPlantedInSection > group.lastPlantedDate)) {
        group.lastPlantedDate = veg.lastPlantedInSection;
      }
    }

    // Trier : jamais plantées d'abord, puis par date de dernière plantation (la plus ancienne d'abord)
    return Array.from(groupMap.values()).sort((a, b) => {
      if (a.neverPlanted && !b.neverPlanted) return -1;
      if (!a.neverPlanted && b.neverPlanted) return 1;
      if (!a.lastPlantedDate && !b.lastPlantedDate) return 0;
      if (!a.lastPlantedDate) return -1;
      if (!b.lastPlantedDate) return 1;
      return a.lastPlantedDate.localeCompare(b.lastPlantedDate);
    });
  });

  // ── Actions ────────────────────────────────────────────────────────────────
  async function loadSoles() {
    try {
      const response = await exploitationsApi.getAllSoles();
      soles.value = response.data;
    } catch {
      planError.value = 'Impossible de charger les exploitations.';
    }
  }

  async function loadCulturePlan() {
    if (!selectedSoleId.value) return;
    planLoading.value = true;
    planError.value = null;
    try {
      const response = await rotationsApi.getCulturePlan(selectedSoleId.value, selectedYear.value);
      culturePlan.value = response.data;
    } catch {
      planError.value = 'Impossible de charger le plan de culture.';
    } finally {
      planLoading.value = false;
    }
  }

  function selectYear(year: number) {
    selectedYear.value = year;
    loadCulturePlan();
  }

  function selectSole(soleId: number) {
    selectedSoleId.value = soleId;
    culturePlan.value = [];
    closeSectionPanel();
    loadCulturePlan();
  }

  function openSectionPanel(boardId: number, boardName: string, sectionNumber: number) {
    openSection.value = { boardId, boardName, sectionNumber, sectionPlanId: null };
    plantableVegetables.value = [];
    lastRuleMessage.value = null;
    assignmentForm.value = makeDefaultForm();
  }

  function closeSectionPanel() {
    openSection.value = null;
    plantableVegetables.value = [];
    lastRuleMessage.value = null;
  }

  async function loadPlantableVegetables() {
    if (!openSection.value) return;
    vegetablesLoading.value = true;
    try {
      // Étape 1 : créer ou retrouver le SectionPlan pour cette planche
      const planResp = await rotationsApi.createOrGetSectionPlan(openSection.value.boardId);
      openSection.value.sectionPlanId = planResp.data.sectionPlan.id_section_plan;

      // Étape 2 : récupérer les légumes compatibles
      const vegResp = await rotationsApi.getPlantableVegetables(
        openSection.value.sectionPlanId,
        openSection.value.sectionNumber,
        assignmentForm.value.startDate,
        assignmentForm.value.endDate,
      );
      plantableVegetables.value = vegResp.data;
    } catch {
      lastRuleMessage.value = {
        type: 'warning',
        text: 'Impossible de charger les légumes compatibles.',
      };
    } finally {
      vegetablesLoading.value = false;
    }
  }

  async function checkVegetableCompatibility(vegetableId: number) {
    if (!openSection.value) return;
    assignmentForm.value.vegetableId = vegetableId;
    lastRuleMessage.value = null;
    try {
      const resp = await rotationsApi.canPlantVegetable(openSection.value.boardId, vegetableId);
      if (resp.data.status === 'OK') {
        lastRuleMessage.value = { type: 'ok', text: '✅ Compatible — aucune contrainte de rotation détectée.' };
      } else {
        lastRuleMessage.value = {
          type: 'warning',
          text: `⚠️ ${resp.data.reason ?? 'Règle de rotation non respectée.'}`,
        };
      }
    } catch {
      // Ne pas bloquer l'UI si cette vérification échoue
    }
  }

  async function submitAssignment(bypass: boolean) {
    if (!openSection.value || !assignmentForm.value.vegetableId) return;
    assignmentLoading.value = true;
    lastRuleMessage.value = null;
    try {
      await rotationsApi.addVegetableToBoard({
        boardId: openSection.value.boardId,
        sectionNumber: openSection.value.sectionNumber,
        vegetableId: assignmentForm.value.vegetableId,
        startDate: assignmentForm.value.startDate,
        endDate: assignmentForm.value.endDate,
        quantityPlanted: assignmentForm.value.quantityPlanted,
        unity: assignmentForm.value.unity,
        varietyIdentifier: assignmentForm.value.varietyIdentifier || 'Standard',
        bypass,
      });
      // Succès : recharger le plan et fermer le panneau
      await loadCulturePlan();
      closeSectionPanel();
    } catch (error: any) {
      const data = error?.response?.data;
      if (data?.warningDetails) {
        const msg = typeof data.message === 'string' && data.message.length > 0
          ? data.message
          : 'Règle de rotation non respectée. Vérifiez l\'historique de la planche.';
        lastRuleMessage.value = { type: 'warning', text: `⚠️ ${msg}` };
      } else {
        lastRuleMessage.value = {
          type: 'warning',
          text: 'Une erreur est survenue. Veuillez réessayer.',
        };
      }
    } finally {
      assignmentLoading.value = false;
    }
  }

  function resetAssignmentForm() {
    assignmentForm.value = makeDefaultForm();
    lastRuleMessage.value = null;
  }

  return {
    // state
    soles,
    selectedSoleId,
    selectedYear,
    culturePlan,
    planLoading,
    planError,
    openSection,
    plantableVegetables,
    vegetablesLoading,
    assignmentForm,
    assignmentLoading,
    lastRuleMessage,
    // getters
    selectedSole,
    uniqueExploitations,
    boardsForSelectedSole,
    sectionDisplayMap,
    vegetableGroups,
    // actions
    loadSoles,
    loadCulturePlan,
    selectYear,
    selectSole,
    openSectionPanel,
    closeSectionPanel,
    loadPlantableVegetables,
    checkVegetableCompatibility,
    submitAssignment,
    resetAssignmentForm,
  };
});
```

**Checkpoint Phase 2** : Store Pinia et modules API prêts. Tester dans Vue DevTools que `usePlanningStore` est disponible.

---

## Phase 3: User Story 1 — Visualiser le plan de culture annuel (P1) 🎯 MVP

**Goal**: Un formateur voit le plan de culture complet d'une sole pour une année donnée.

**Independent Test**: Connecté formateur → `/plan` → sélectionner une sole + année → vérifier grille des planches avec sections occupées/disponibles.

- [ ] T006 [US1] Créer `culturo/front-culturo/src/components/planning/PlanSelector.vue`

```vue
<!-- culturo/front-culturo/src/components/planning/PlanSelector.vue -->
<template>
  <div class="plan-selector">
    <div class="selector-group">
      <label for="exploitation-select">Exploitation</label>
      <select
        id="exploitation-select"
        v-model="selectedExploitationId"
      >
        <option :value="null" disabled>Choisir une exploitation</option>
        <option
          v-for="exp in store.uniqueExploitations"
          :key="exp.id_exploitation"
          :value="exp.id_exploitation"
        >
          {{ exp.exploitation_name }}
        </option>
      </select>
    </div>

    <div class="selector-group">
      <label for="sole-select">Sole</label>
      <select
        id="sole-select"
        :disabled="!selectedExploitationId"
        :value="store.selectedSoleId"
        @change="onSoleChange"
      >
        <option :value="null" disabled>Choisir une sole</option>
        <option
          v-for="sole in filteredSoles"
          :key="sole.id_sole"
          :value="sole.id_sole"
        >
          {{ sole.sole_name }}
        </option>
      </select>
    </div>

    <div class="selector-group">
      <label for="year-input">Année</label>
      <input
        id="year-input"
        type="number"
        :value="store.selectedYear"
        :min="2000"
        :max="currentYear + 2"
        @change="onYearChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePlanningStore } from '@/stores/planning';

const store = usePlanningStore();
const currentYear = new Date().getFullYear();
const selectedExploitationId = ref<number | null>(null);

const filteredSoles = computed(() =>
  selectedExploitationId.value
    ? store.soles.filter(
        (s) => s.exploitation.id_exploitation === selectedExploitationId.value,
      )
    : [],
);

function onSoleChange(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value);
  if (value) store.selectSole(value);
}

function onYearChange(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (value >= 2000) store.selectYear(value);
}
</script>

<style scoped>
.plan-selector {
  display: flex;
  gap: 1.5rem;
  align-items: flex-end;
  flex-wrap: wrap;
  padding: 1rem 1.5rem;
  background: var(--color-surface, #f8f8f8);
  border-bottom: 1px solid var(--color-border, #e0e0e0);
}

.selector-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #666);
}

select,
input[type='number'] {
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-border, #ccc);
  border-radius: 4px;
  font-size: 0.9rem;
  min-width: 160px;
  background: white;
}

select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

- [ ] T007 [P] [US1] Créer `culturo/front-culturo/src/components/planning/SectionCell.vue`

```vue
<!-- culturo/front-culturo/src/components/planning/SectionCell.vue -->
<template>
  <button
    class="section-cell"
    :class="[`status-${display.status}`, { 'is-readonly': readonly }]"
    :disabled="display.status === 'occupied' || readonly"
    :title="cellTitle"
    type="button"
    @click="handleClick"
  >
    <span class="section-num">S{{ display.sectionNumber }}</span>
    <span v-if="display.status === 'occupied'" class="section-content">
      <span class="veg-name">{{ display.vegetableName }}</span>
      <span class="veg-dates">{{ formatDate(display.startDate) }} → {{ formatDate(display.endDate) }}</span>
    </span>
    <span v-else-if="display.status === 'available'" class="section-content">
      <span class="available-label">Disponible</span>
      <span v-if="!readonly" class="action-hint">+ Affecter</span>
    </span>
    <span v-else class="section-content">
      <span class="loading-dots">…</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePlanningStore } from '@/stores/planning';
import type { SectionDisplay } from '@/types/planning';

const props = defineProps<{
  boardId: number;
  boardName: string;
  sectionNumber: number;
  display: SectionDisplay;
  readonly: boolean;
}>();

const store = usePlanningStore();

const cellTitle = computed(() => {
  if (props.display.status === 'occupied') return `${props.display.vegetableName} — planté`;
  if (props.readonly) return 'Lecture seule';
  return `Affecter un légume à ${props.boardName} section ${props.sectionNumber}`;
});

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function handleClick() {
  if (props.display.status === 'available' && !props.readonly) {
    store.openSectionPanel(props.boardId, props.boardName, props.sectionNumber);
  }
}
</script>

<style scoped>
.section-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 6px;
  background: white;
  cursor: default;
  text-align: left;
  width: 100%;
  min-height: 64px;
  font-size: 0.85rem;
  transition: background 0.15s;
}

.status-occupied {
  background: #e8f5e9;
  border-color: #a5d6a7;
}

.status-available:not(.is-readonly) {
  cursor: pointer;
  border-style: dashed;
  border-color: #90caf9;
  background: #e3f2fd;
}

.status-available:not(.is-readonly):hover {
  background: #bbdefb;
}

.section-num {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #888;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.veg-name {
  font-weight: 600;
  color: #2e7d32;
}

.veg-dates {
  font-size: 0.75rem;
  color: #555;
}

.available-label {
  color: #1565c0;
  font-weight: 500;
}

.action-hint {
  font-size: 0.75rem;
  color: #1976d2;
}

.loading-dots {
  color: #aaa;
}
</style>
```

- [ ] T008 [P] [US1] Créer `culturo/front-culturo/src/components/planning/BoardCard.vue`

```vue
<!-- culturo/front-culturo/src/components/planning/BoardCard.vue -->
<template>
  <div class="board-card">
    <h3 class="board-name">{{ board.board_name }}</h3>
    <div class="sections-grid">
      <SectionCell
        v-for="n in SECTIONS_PER_BOARD"
        :key="n"
        :board-id="board.id_board"
        :board-name="board.board_name"
        :section-number="n"
        :display="getSectionDisplay(n)"
        :readonly="readonly"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlanningStore } from '@/stores/planning';
import type { BoardSummary, SectionDisplay } from '@/types/planning';
import SectionCell from './SectionCell.vue';

const SECTIONS_PER_BOARD = 4;

const props = defineProps<{
  board: BoardSummary;
  readonly: boolean;
}>();

const store = usePlanningStore();

function getSectionDisplay(sectionNumber: number): SectionDisplay {
  return (
    store.sectionDisplayMap.get(`${props.board.id_board}-${sectionNumber}`) ?? {
      sectionNumber,
      status: 'available',
    }
  );
}
</script>

<style scoped>
.board-card {
  background: white;
  border: 1px solid var(--color-border, #e0e0e0);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.board-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #333;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.sections-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
</style>
```

- [ ] T009 [US1] Créer `culturo/front-culturo/src/components/planning/CulturePlanGrid.vue`

```vue
<!-- culturo/front-culturo/src/components/planning/CulturePlanGrid.vue -->
<template>
  <div class="culture-plan-grid">
    <div v-if="!store.boardsForSelectedSole.length" class="empty-state">
      <p>Aucune planche configurée pour cette sole.</p>
    </div>
    <div v-else class="boards-grid">
      <BoardCard
        v-for="board in store.boardsForSelectedSole"
        :key="board.id_board"
        :board="board"
        :readonly="isReadonly"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { usePlanningStore } from '@/stores/planning';
import BoardCard from './BoardCard.vue';

const store = usePlanningStore();
const auth = useAuthStore();
const isReadonly = auth.isStagiaire;
</script>

<style scoped>
.culture-plan-grid {
  padding: 1.5rem;
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #888;
}
</style>
```

- [ ] T010 [US1] Remplacer `culturo/front-culturo/src/views/PlanningView.vue` (remplace le placeholder existant)

```vue
<!-- culturo/front-culturo/src/views/PlanningView.vue -->
<template>
  <div class="planning-view">
    <PlanSelector />

    <div v-if="!store.selectedSoleId" class="no-selection">
      <p>Sélectionnez une exploitation et une sole pour afficher le plan de culture.</p>
    </div>

    <div v-else class="plan-content">
      <div v-if="store.planLoading" class="loading-state">
        <p>Chargement du plan de culture…</p>
      </div>
      <div v-else-if="store.planError" class="error-state">
        <p>{{ store.planError }}</p>
      </div>
      <div v-else-if="!store.planLoading && store.boardsForSelectedSole.length === 0" class="empty-state">
        <p>Aucune planche configurée pour la sole sélectionnée.</p>
      </div>
      <template v-else>
        <div class="plan-header">
          <h2>Plan de culture {{ store.selectedYear }} — {{ store.selectedSole?.sole_name }}</h2>
          <span class="plan-meta">
            {{ store.boardsForSelectedSole.length }} planche(s) •
            {{ store.culturePlan.length }} section(s) planifiée(s)
          </span>
        </div>
        <CulturePlanGrid />
      </template>
    </div>

    <!-- Panneau latéral d'affectation -->
    <SectionSidePanel v-if="store.openSection" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePlanningStore } from '@/stores/planning';
import PlanSelector from '@/components/planning/PlanSelector.vue';
import CulturePlanGrid from '@/components/planning/CulturePlanGrid.vue';
import SectionSidePanel from '@/components/planning/SectionSidePanel.vue';

const store = usePlanningStore();

onMounted(() => {
  store.loadSoles();
});
</script>

<style scoped>
.planning-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.plan-content {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.no-selection,
.loading-state,
.error-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #888;
  font-size: 0.95rem;
}

.error-state {
  color: #c62828;
}

.plan-header {
  padding: 1rem 1.5rem 0;
}

.plan-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.plan-meta {
  font-size: 0.8rem;
  color: #888;
}
</style>
```

**Checkpoint US1** : Naviguer vers `/plan`, sélectionner une exploitation + sole + 2025 → grille des planches visible avec sections occupées en vert et disponibles en bleu.

---

## Phase 4: User Story 2 — Affecter un légume à une section (P1)

**Goal**: Formateur clique sur section disponible → panneau → sélectionne légume + dates → confirme → section mise à jour.

**Independent Test**: Cliquer "Disponible" → panneau s'ouvre → liste légumes → remplir formulaire → "Confirmer" → section devient verte avec le légume.

- [ ] T011 [US2] Créer `culturo/front-culturo/src/components/planning/RotationRuleMessage.vue`

```vue
<!-- culturo/front-culturo/src/components/planning/RotationRuleMessage.vue -->
<template>
  <div class="rule-message" :class="`type-${message.type}`" role="alert">
    <span class="rule-icon">{{ message.type === 'ok' ? '✅' : '⚠️' }}</span>
    <span class="rule-text">{{ message.text }}</span>
  </div>
</template>

<script setup lang="ts">
import type { RuleMessage } from '@/types/planning';

defineProps<{
  message: RuleMessage;
}>();
</script>

<style scoped>
.rule-message {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.4;
}

.type-ok {
  background: #e8f5e9;
  border: 1px solid #a5d6a7;
  color: #1b5e20;
}

.type-warning {
  background: #fff3e0;
  border: 1px solid #ffcc80;
  color: #e65100;
}

.rule-icon {
  flex-shrink: 0;
  font-size: 1rem;
}

.rule-text {
  flex: 1;
}
</style>
```

- [ ] T012 [US2] Créer `culturo/front-culturo/src/components/planning/SectionSidePanel.vue`

```vue
<!-- culturo/front-culturo/src/components/planning/SectionSidePanel.vue -->
<template>
  <div class="side-panel-overlay" @click.self="store.closeSectionPanel()">
    <aside class="side-panel" role="dialog" aria-modal="true">
      <!-- En-tête -->
      <header class="panel-header">
        <div>
          <p class="panel-eyebrow">Affectation de légume</p>
          <h3 class="panel-title">
            {{ store.openSection!.boardName }} — Section {{ store.openSection!.sectionNumber }}
          </h3>
        </div>
        <button type="button" class="close-btn" aria-label="Fermer" @click="store.closeSectionPanel()">✕</button>
      </header>

      <!-- Chargement légumes -->
      <div v-if="store.vegetablesLoading" class="panel-loading">
        <p>Chargement des légumes compatibles…</p>
      </div>

      <!-- Aucun légume compatible -->
      <div v-else-if="!store.plantableVegetables.length && !store.vegetablesLoading" class="panel-empty">
        <p>Aucun légume compatible disponible pour cette section.</p>
      </div>

      <template v-else>
        <!-- Sélection du légume -->
        <section class="panel-section">
          <h4>Légumes compatibles</h4>
          <div class="vegetable-groups">
            <div
              v-for="group in store.vegetableGroups"
              :key="group.familyName"
              class="veg-group"
            >
              <div class="group-header">
                <span class="family-name">{{ group.familyName }}</span>
                <span
                  v-if="group.neverPlanted"
                  class="badge-never"
                  title="Jamais planté sur cette planche"
                >Jamais planté ici</span>
                <span v-else-if="group.lastPlantedDate" class="badge-date">
                  Dernier : {{ formatDate(group.lastPlantedDate) }}
                </span>
              </div>
              <div class="veg-list">
                <button
                  v-for="veg in group.vegetables"
                  :key="veg.vegetableId"
                  type="button"
                  class="veg-btn"
                  :class="{ selected: store.assignmentForm.vegetableId === veg.vegetableId }"
                  @click="selectVegetable(veg.vegetableId)"
                >
                  <span class="veg-btn-name">{{ veg.vegetableName }}</span>
                  <span v-if="veg.neverPlantedInSection" class="veg-badge-never">jamais planté</span>
                  <span v-else-if="veg.lastPlantedInSection" class="veg-badge-date">
                    {{ formatDate(veg.lastPlantedInSection) }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Message règle de rotation -->
        <RotationRuleMessage
          v-if="store.lastRuleMessage"
          :message="store.lastRuleMessage"
          class="panel-rule-msg"
        />

        <!-- Formulaire dates + détails -->
        <section v-if="store.assignmentForm.vegetableId" class="panel-section">
          <h4>Détails de la plantation</h4>
          <div class="form-grid">
            <div class="form-field">
              <label for="start-date">Date de début *</label>
              <input
                id="start-date"
                v-model="store.assignmentForm.startDate"
                type="date"
                required
              />
            </div>
            <div class="form-field">
              <label for="end-date">Date de fin *</label>
              <input
                id="end-date"
                v-model="store.assignmentForm.endDate"
                type="date"
                :min="store.assignmentForm.startDate"
                required
              />
            </div>
            <div class="form-field">
              <label for="variety">Variété</label>
              <input
                id="variety"
                v-model="store.assignmentForm.varietyIdentifier"
                type="text"
                placeholder="ex: Marmande, Roma…"
              />
            </div>
            <div class="form-field">
              <label for="qty">Quantité</label>
              <input
                id="qty"
                v-model.number="store.assignmentForm.quantityPlanted"
                type="number"
                min="0"
              />
            </div>
          </div>
        </section>

        <!-- Actions -->
        <footer class="panel-footer">
          <button
            type="button"
            class="primary-button"
            :disabled="!isFormValid || store.assignmentLoading"
            @click="confirm(false)"
          >
            {{ store.assignmentLoading ? 'Enregistrement…' : 'Confirmer' }}
          </button>
          <button
            v-if="showBypass && store.lastRuleMessage?.type === 'warning'"
            type="button"
            class="warning-button"
            :disabled="store.assignmentLoading"
            @click="confirm(true)"
          >
            Forcer quand même (bypass)
          </button>
          <button
            type="button"
            class="secondary-button"
            @click="store.closeSectionPanel()"
          >
            Annuler
          </button>
        </footer>
      </template>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { usePlanningStore } from '@/stores/planning';
import { useAuthStore } from '@/stores/auth';
import RotationRuleMessage from './RotationRuleMessage.vue';

const store = usePlanningStore();
const auth = useAuthStore();

const showBypass = computed(() => auth.isAdmin || auth.isFormateur);

const isFormValid = computed(() => {
  const f = store.assignmentForm;
  return (
    f.vegetableId !== null &&
    f.startDate &&
    f.endDate &&
    f.startDate <= f.endDate
  );
});

onMounted(() => {
  store.loadPlantableVegetables();
});

function selectVegetable(id: number) {
  store.checkVegetableCompatibility(id);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function confirm(bypass: boolean) {
  store.submitAssignment(bypass);
}
</script>

<style scoped>
.side-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}

.side-panel {
  width: min(480px, 100vw);
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.panel-eyebrow {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #888;
  margin: 0 0 0.25rem;
}

.panel-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
  padding: 0.25rem;
  line-height: 1;
}

.panel-section {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f5f5f5;
}

.panel-section h4 {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #888;
  margin: 0 0 0.75rem;
}

.panel-loading,
.panel-empty {
  padding: 2rem 1.5rem;
  color: #888;
  text-align: center;
}

.panel-rule-msg {
  margin: 0 1.5rem;
}

.vegetable-groups {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.veg-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.family-name {
  font-weight: 600;
  font-size: 0.85rem;
}

.badge-never {
  font-size: 0.7rem;
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
  border-radius: 99px;
  padding: 0.1rem 0.5rem;
}

.badge-date {
  font-size: 0.7rem;
  color: #777;
}

.veg-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.veg-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.4rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fafafa;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s;
}

.veg-btn:hover {
  background: #e3f2fd;
  border-color: #90caf9;
}

.veg-btn.selected {
  background: #1565c0;
  border-color: #0d47a1;
  color: white;
}

.veg-btn-name {
  font-weight: 500;
}

.veg-badge-never {
  font-size: 0.65rem;
  color: #2e7d32;
  font-style: italic;
}

.veg-btn.selected .veg-badge-never {
  color: #a5d6a7;
}

.veg-badge-date {
  font-size: 0.65rem;
  color: #888;
}

.veg-btn.selected .veg-badge-date {
  color: #bbdefb;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #555;
}

.form-field input {
  padding: 0.4rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}

.panel-footer {
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid #f0f0f0;
  position: sticky;
  bottom: 0;
  background: white;
}

.primary-button {
  padding: 0.6rem 1.25rem;
  background: #1565c0;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.warning-button {
  padding: 0.6rem 1.25rem;
  background: #e65100;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.secondary-button {
  padding: 0.5rem 1rem;
  background: transparent;
  color: #555;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}
</style>
```

**Checkpoint US2** : Cliquer une section "Disponible" → panneau s'ouvre avec légumes groupés → sélectionner légume → message ✅ ou ⚠️ → "Confirmer" → section devient verte sans rechargement de page.

---

## Phase 5: User Story 3 — Suggestions groupées par famille (P2)

**Goal**: Les légumes sont groupés par famille, triés (jamais plantés d'abord), avec badges informatifs.

**Independent Test**: Ouvrir panneau → vérifier groupes de familles → familles "jamais plantées" en tête → badge "Jamais planté ici" visible.

> **Note** : US3 est intégré dans `SectionSidePanel.vue` (T012) via le getter `vegetableGroups` du store (T005). Aucun fichier supplémentaire n'est nécessaire. Cette phase valide le comportement déjà implémenté.

- [ ] T013 [US3] Vérifier manuellement le tri des groupes dans le panneau selon `quickstart.md` scénario US3

  _Action_ : Ouvrir le panneau d'une section et confirmer que :
  1. Les familles jamais plantées apparaissent en premier avec le badge vert "Jamais planté ici"
  2. Les familles déjà plantées sont triées par date (plus ancienne d'abord)
  3. Chaque légume déjà planté affiche sa date de dernière plantation

  Si le tri est incorrect, vérifier la fonction de tri dans `vegetableGroups` computed du store `planning.ts` (T005, bloc `Array.from(groupMap.values()).sort(...)`).

**Checkpoint US3** : Groupement et badges visibles et corrects.

---

## Phase 6: User Story 4 — Vérification manuelle de compatibilité (P2)

**Goal**: Sélectionner un légume dans le panneau affiche immédiatement le message de compatibilité (avant confirmation).

**Independent Test**: Cliquer sur un légume potentiellement incompatible → message ⚠️ s'affiche immédiatement en dessous de la liste.

> **Note** : US4 est géré par `store.checkVegetableCompatibility()` (action T005) appelée dans `selectVegetable()` de `SectionSidePanel.vue` (T012). Aucun fichier supplémentaire.

- [ ] T014 [US4] Vérifier manuellement le comportement selon `quickstart.md` scénario US4

  _Action_ : 
  1. Ouvrir le panneau d'une section
  2. Cliquer sur un légume dont on sait que la famille a été plantée récemment → ⚠️ s'affiche immédiatement
  3. Cliquer sur un légume compatible → ✅ s'affiche immédiatement
  4. Confirmer que le message ⚠️ fait apparaître le bouton "Forcer (bypass)" pour les formateurs

**Checkpoint US4** : Vérification en temps réel opérationnelle.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, validation, robustesse.

- [ ] T015 Ajouter la validation de dates dans le formulaire du panneau — dans `culturo/front-culturo/src/components/planning/SectionSidePanel.vue`, le champ `end-date` a déjà `:min="store.assignmentForm.startDate"`. Vérifier que si l'utilisateur saisit manuellement une date invalide, le bouton "Confirmer" reste désactivé (contrôlé par `isFormValid` computed qui vérifie `f.startDate <= f.endDate`). Aucune modification nécessaire si déjà fonctionnel.

- [ ] T016 [P] Tester le scénario "API 500 pendant confirmation" selon `quickstart.md` : couper le backend, tenter une affectation → vérifier que le message "Une erreur est survenue. Veuillez réessayer." s'affiche (géré dans `submitAssignment` catch du store). Aucune modification si déjà fonctionnel.

- [ ] T017 [P] Tester le scénario "Aucun légume compatible" : si `plantableVegetables` est vide, le panneau affiche "Aucun légume compatible disponible pour cette section." (géré dans `SectionSidePanel.vue` par `v-else-if="!store.plantableVegetables.length"`). Aucune modification si déjà fonctionnel.

- [ ] T018 Vérifier l'accès stagiaire : se connecter en tant que stagiaire → la route `/plan` est bloquée par le routeur (`roles: ['admin', 'formateur']` dans `router/index.ts`) → redirection vers `/403`. ✅ Déjà géré — aucune modification nécessaire.

- [ ] T019 Valider les 4 scénarios du `quickstart.md` manuellement et cocher chaque critère d'acceptance.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** : Pas de dépendance — commence immédiatement
- **Phase 2 (Fondamental)** : Dépend de Phase 1 — bloque toutes les user stories
- **Phase 3 (US1)** : Dépend de Phase 2 — MVP
- **Phase 4 (US2)** : Dépend de Phase 3 (utilise `openSectionPanel` du store déjà initialisé)
- **Phase 5 (US3)** : Intégré dans US2 — validation manuelle seulement
- **Phase 6 (US4)** : Intégré dans US2 — validation manuelle seulement
- **Phase 7 (Polish)** : Après Phases 3–6

### User Story Dependencies

- **US1 (P1)** : Après Phase 2 — indépendant
- **US2 (P1)** : Dépend US1 (SectionSidePanel s'affiche dans PlanningView qui dépend de US1)
- **US3 (P2)** : Intégré dans US2 — pas de dépendance supplémentaire
- **US4 (P2)** : Intégré dans US2 — pas de dépendance supplémentaire

### Parallélisable dans Phase 2

- T002 [P] et T003 [P] → fichiers différents, exécutable en parallèle

### Parallélisable dans Phase 3

- T007 [P] `SectionCell.vue` et T008 [P] `BoardCard.vue` → fichiers différents, exécutable en parallèle

---

## Parallel Examples

```bash
# Phase 2 — exécuter en parallèle :
Task T002: Créer src/types/planning.ts
Task T003: Créer src/api/exploitations.ts

# Phase 3 — exécuter en parallèle après T005 :
Task T007: Créer SectionCell.vue
Task T008: Créer BoardCard.vue
```

---

## Implementation Strategy

### MVP First (US1 seul)

1. Phase 1 (T001–T003) — Setup
2. Phase 2 (T004–T005) — Store + API
3. Phase 3 (T006–T010) — US1 visualisation
4. **STOP et VALIDER** : plan de culture visible, sélecteurs fonctionnels
5. Démo possible à ce stade

### Delivery Incrémentale

1. Phase 1+2 → Infrastructure prête
2. + Phase 3 → MVP : visualisation plan ✅
3. + Phase 4 → Affectation légume ✅
4. + Phase 7 → Robustesse ✅

---

## Notes

- `[P]` = tâches sans dépendance entre elles, fichiers différents
- `[US1/2/3/4]` = traçabilité vers les user stories de la spec
- Chaque tâche contient le code complet — copier dans le fichier indiqué
- La route `/plan` reste réservée à `['admin', 'formateur']` dans le routeur — déjà configuré
- Tester dans Docker : `docker compose up` depuis `culturo/`
- Swagger disponible sur `http://localhost:3000/api` pour vérifier les endpoints
