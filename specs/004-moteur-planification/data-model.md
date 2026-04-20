# Data Model — Phase 4 : Moteur de Planification (Frontend)

**Branch**: `004-moteur-planification` | **Date**: 2026-04-19

Ce fichier décrit les **types TypeScript frontend** utilisés dans le store et les composants de la Phase 4.
Les types correspondent aux réponses réelles des endpoints backend (DTOs NestJS existants).

---

## Types API (réponses backend)

### ExploitationSummary
Issu de `GET /exploitation`

```typescript
interface ExploitationSummary {
  id_exploitation: number;
  exploitation_name: string;
}
```

### SoleWithBoards
Issu de `GET /sole` (avec relations `['exploitation', 'boards']`)

```typescript
interface SoleWithBoards {
  id_sole: number;
  sole_name: string;
  exploitation: {
    id_exploitation: number;
    exploitation_name: string;
  };
  boards: BoardSummary[];
}

interface BoardSummary {
  id_board: number;
  board_name: string;
  id_sole: number;
}
```

### CulturePlanEntry
Issu de `GET /rotations/plan/:soleId?year=&month=&periodMonths=`

```typescript
interface CulturePlanEntry {
  boardId: number;
  boardName: string;
  sectionNumber: number;
  vegetableName: string;
  startDate: string;  // ISO date string
  endDate: string;    // ISO date string
}
```

### PlantableVegetable
Issu de `GET /rotations/plantable-vegetables`

```typescript
interface PlantableVegetable {
  vegetableId: number;
  vegetableName: string;
  familyId: number;
  familyName: string;
  importance: string;           // 'primary' | 'secondary'
  lastPlantedInSection: string | null;  // ISO date ou null
  neverPlantedInSection: boolean;
}
```

### SectionPlanResult
Issu de `POST /rotations/plan-section?boardId=`

```typescript
interface SectionPlanResult {
  sectionPlan: {
    id_section_plan: number;
    // autres champs retournés par l'API
  };
  status: 'CREATED' | 'FOUND';
}
```

### PlantingWarning
Réponse HTTP 400 de `POST /rotations/add-vegetable` quand `status === 'WARNING'`

```typescript
interface PlantingWarning {
  statusCode: 400;
  message: string;       // texte agronomique lisible
  warningDetails: {
    status: 'WARNING';
    reason: string;
    neededBypass: boolean;
  };
}
```

### CanPlantResult
Issu de `POST /rotations/can`

```typescript
interface CanPlantResult {
  status: 'OK' | 'WARNING';
  reason?: string;
  neededBypass?: boolean;
}
```

---

## Types Frontend (état store)

### SelectedSection
Représente la section actuellement ouverte dans le panneau latéral.

```typescript
interface SelectedSection {
  boardId: number;
  boardName: string;
  sectionNumber: number;
  sectionPlanId: number | null;  // null avant appel plan-section
}
```

### SectionDisplayState
Calculé pour chaque section à afficher dans la grille.

```typescript
type SectionStatus = 'occupied' | 'available' | 'loading';

interface SectionDisplay {
  sectionNumber: number;
  status: SectionStatus;
  vegetableName?: string;     // si occupied
  startDate?: string;         // si occupied
  endDate?: string;           // si occupied
}
```

### VegetableGroup
Légumes regroupés par famille botanique pour l'affichage dans le panneau.

```typescript
interface VegetableGroup {
  familyName: string;
  importance: string;
  neverPlanted: boolean;      // true si aucun légume de cette famille jamais planté
  lastPlantedDate: string | null;   // date du légume planté le plus récemment dans la famille
  vegetables: PlantableVegetable[];
}
```

### AssignmentForm
Données du formulaire d'affectation dans le panneau latéral.

```typescript
interface AssignmentForm {
  vegetableId: number | null;
  startDate: string;          // YYYY-MM-DD
  endDate: string;            // YYYY-MM-DD
  quantityPlanted: number;    // défaut: 0
  unity: string;              // défaut: 'unité'
  varietyIdentifier: string;  // saisie libre
  bypass: boolean;            // false par défaut, true si formateur confirme malgré WARNING
}
```

---

## État du store `usePlanningStore`

```typescript
interface PlanningState {
  // Sélecteurs
  soles: SoleWithBoards[];
  selectedSoleId: number | null;
  selectedYear: number;           // défaut: année courante

  // Plan de culture chargé
  culturePlan: CulturePlanEntry[];
  planLoading: boolean;
  planError: string | null;

  // Panneau de section
  openSection: SelectedSection | null;
  plantableVegetables: PlantableVegetable[];
  vegetablesLoading: boolean;

  // Formulaire d'affectation
  assignmentForm: AssignmentForm;
  assignmentLoading: boolean;
  lastRuleMessage: { type: 'ok' | 'warning'; text: string } | null;
}
```

---

## Relations entre entités (rappel backend)

```
Exploitation 1──* Sole 1──* Board 1──1 SectionPlan 1──* Section
                                                     (historique cultures)
Vegetable *──1 BotanicalFamily (importance: primary | secondary)
Section *──1 Vegetable (via variety)
```

Les entités ci-dessus sont gérées **en lecture seule** depuis le frontend Phase 4.
Seule l'entité `Section` est créée/modifiée via `POST /rotations/add-vegetable`.
