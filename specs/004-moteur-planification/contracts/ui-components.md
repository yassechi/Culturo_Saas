# UI Component Contracts — Phase 4 : Moteur de Planification

**Branch**: `004-moteur-planification` | **Date**: 2026-04-19

Contrats d'interface des composants Vue 3 à créer pour la Phase 4.
Tous les composants utilisent la Composition API (`<script setup lang="ts">`).

---

## `src/api/exploitations.ts`

```typescript
// Fonctions exposées
export function getAllSoles(): Promise<AxiosResponse<SoleWithBoards[]>>
export function getAllExploitations(): Promise<AxiosResponse<ExploitationSummary[]>>
```

---

## `src/api/rotations.ts`

```typescript
// Fonctions exposées
export function getCulturePlan(soleId: number, year: number): Promise<AxiosResponse<CulturePlanEntry[]>>

export function createOrGetSectionPlan(boardId: number): Promise<AxiosResponse<SectionPlanResult>>

export function getPlantableVegetables(
  sectionPlanId: number,
  sectionNumber: number,
  startDate: string,
  endDate: string
): Promise<AxiosResponse<PlantableVegetable[]>>

export function addVegetableToBoard(dto: {
  boardId: number;
  sectionNumber: number;
  vegetableId: number;
  startDate: string;
  endDate: string;
  quantityPlanted?: number;
  unity?: string;
  varietyIdentifier: string;
  bypass?: boolean;
}): Promise<AxiosResponse<{ status: 'OK'; section: any }>>

export function canPlantVegetable(
  boardId: number,
  vegetableId: number,
  bypass?: boolean
): Promise<AxiosResponse<CanPlantResult>>
```

---

## `src/stores/planning.ts`

```typescript
// Store Pinia — usePlanningStore
export const usePlanningStore = defineStore('planning', () => {
  // STATE
  const soles: Ref<SoleWithBoards[]>
  const selectedSoleId: Ref<number | null>
  const selectedYear: Ref<number>           // défaut: new Date().getFullYear()

  const culturePlan: Ref<CulturePlanEntry[]>
  const planLoading: Ref<boolean>
  const planError: Ref<string | null>

  const openSection: Ref<SelectedSection | null>
  const plantableVegetables: Ref<PlantableVegetable[]>
  const vegetablesLoading: Ref<boolean>

  const assignmentForm: Ref<AssignmentForm>
  const assignmentLoading: Ref<boolean>
  const lastRuleMessage: Ref<{ type: 'ok' | 'warning'; text: string } | null>

  // GETTERS (computed)
  const selectedSole: ComputedRef<SoleWithBoards | null>
  const uniqueExploitations: ComputedRef<ExploitationSummary[]>
  const solesByExploitation: ComputedRef<(exploitationId: number) => SoleWithBoards[]>
  const boardsForSelectedSole: ComputedRef<BoardSummary[]>
  const sectionDisplayMap: ComputedRef<Map<string, SectionDisplay>>
  // key: `${boardId}-${sectionNumber}` → SectionDisplay
  const vegetableGroups: ComputedRef<VegetableGroup[]>
  // légumes groupés par famille, triés (jamais plantés d'abord, puis par date)

  // ACTIONS
  async function loadSoles(): Promise<void>
  async function loadCulturePlan(): Promise<void>   // utilise selectedSoleId + selectedYear
  function selectYear(year: number): void            // change année → recharge plan
  function openSectionPanel(boardId: number, boardName: string, sectionNumber: number): void
  function closeSectionPanel(): void
  async function loadPlantableVegetables(): Promise<void>
  // appelle POST plan-section puis GET plantable-vegetables
  async function submitAssignment(bypass: boolean): Promise<void>
  // appelle POST add-vegetable ; en cas de WARNING, stocke le message dans lastRuleMessage
  function resetAssignmentForm(): void
})
```

---

## `src/views/PlanningView.vue`

**Rôle**: Orchestrateur principal. Monte le store, coordonne `PlanSelector`, `CulturePlanGrid`, `SectionSidePanel`.

```typescript
// Props: aucune (vue routée)
// Emits: aucun

// Comportement:
// - onMounted: loadSoles()
// - watch(selectedSoleId, selectedYear): loadCulturePlan()
// - Affiche <SectionSidePanel> si openSection !== null
// - Layout: colonne gauche (PlanSelector + CulturePlanGrid) + panneau droit (SectionSidePanel)
```

**Template structure**:
```html
<div class="planning-view">
  <PlanSelector />
  <div class="plan-content" v-if="store.selectedSoleId">
    <p v-if="store.planLoading">Chargement...</p>
    <p v-else-if="store.planError">{{ store.planError }}</p>
    <p v-else-if="!store.culturePlan.length">Aucune culture planifiée pour cette année.</p>
    <CulturePlanGrid v-else />
  </div>
  <SectionSidePanel v-if="store.openSection" />
</div>
```

---

## `src/components/planning/PlanSelector.vue`

**Rôle**: Dropdowns pour choisir exploitation, sole et année.

```typescript
// Props: aucune (lit le store directement)
// Emits: aucun

// Éléments UI:
// - <select> exploitation → filtre les soles affichées
// - <select> sole → déclenche loadCulturePlan() via watch dans le store
// - <input type="number"> année → appelle store.selectYear()
// - Année par défaut: new Date().getFullYear()
// - Années disponibles: currentYear - 5 à currentYear + 2
```

---

## `src/components/planning/CulturePlanGrid.vue`

**Rôle**: Grille de toutes les planches de la sole sélectionnée avec leurs sections.

```typescript
// Props: aucune (lit store.boardsForSelectedSole + store.sectionDisplayMap)
// Emits: aucun

// Affiche: une <BoardCard> par board dans boardsForSelectedSole
// Si boardsForSelectedSole est vide: message "Aucune planche configurée pour cette sole"
```

---

## `src/components/planning/BoardCard.vue`

**Rôle**: Affiche une planche et ses 4 sections (1 à 4).

```typescript
// Props:
interface Props {
  board: BoardSummary;
}
// Emits: aucun

// Affiche: nom de la planche + 4 <SectionCell> (sectionNumber 1 à 4)
// Lit store.sectionDisplayMap.get(`${board.id_board}-${n}`) pour chaque section
```

---

## `src/components/planning/SectionCell.vue`

**Rôle**: Cellule représentant l'état d'une section.

```typescript
// Props:
interface Props {
  boardId: number;
  boardName: string;
  sectionNumber: number;
  sectionDisplay: SectionDisplay;
  readonly: boolean;   // true si isStagiaire
}
// Emits: aucun (appelle store.openSectionPanel directement)

// Affichage conditionnel:
// - status === 'occupied': légume + dates (fond vert pâle, non cliquable)
// - status === 'available': "Disponible" + icône + curseur pointer (si !readonly)
// - status === 'loading': spinner
// Clic sur 'available' (si !readonly): store.openSectionPanel(boardId, boardName, sectionNumber)
```

---

## `src/components/planning/SectionSidePanel.vue`

**Rôle**: Panneau latéral d'affectation d'un légume à une section disponible.

```typescript
// Props: aucune (lit store.openSection + store.plantableVegetables + store.lastRuleMessage)
// Emits: aucun

// Lifecycle: onMounted → store.loadPlantableVegetables()

// Sections du panneau:
// 1. En-tête: "Planche [boardName] — Section [N]" + bouton fermer
// 2. Liste des légumes: <VegetableOption> par groupe (si !vegetablesLoading)
// 3. Formulaire: startDate, endDate, varietyIdentifier, quantityPlanted (optionnel)
// 4. Message règle: <RotationRuleMessage> si lastRuleMessage
// 5. Boutons:
//    - "Confirmer" → store.submitAssignment(false)
//    - "Forcer quand même (bypass)" → store.submitAssignment(true) — v-if="!isStagiaire"
// 6. Résumé règles avant confirmation (si légume sélectionné + aucun WARNING actif):
//    "✅ Compatible — aucune contrainte de rotation détectée"
```

---

## `src/components/planning/RotationRuleMessage.vue`

**Rôle**: Affiche le message OK ou WARNING de la validation de rotation.

```typescript
// Props:
interface Props {
  message: { type: 'ok' | 'warning'; text: string };
}
// Emits: aucun

// Affichage:
// - type 'ok':      fond vert, icône ✅, texte
// - type 'warning': fond orange, icône ⚠️, texte (traduit depuis l'API en français clair)
```

---

## Traduction des messages WARNING API → français

Le backend retourne des messages en français déjà (ex: `"Cette famille primaire a déjà été plantée..."`).
Le frontend affiche `error.response.data.message` directement, sans transformation.
Si le message est vide ou technique (`[object Object]`), afficher le fallback :
`"Règle de rotation non respectée. Vérifiez l'historique de la planche."`
