# Implementation Plan: Phase 4 — Moteur de Planification (Frontend)

**Branch**: `004-moteur-planification` | **Dernière mise à jour**: 2026-05-11 | **Spec**: [spec.md](./spec.md)

---

## Résumé global

Phase 4 couvre l'intégralité du moteur de planification agricole : visualisation du plan de culture, suivi des arrosages, récoltes, amendements et traitements phytosanitaires. Tout le travail est livré — backend NestJS + frontend Vue 3.

---

## 1. Moteur de planification (Rotation / Grille)

### Backend (existant avant Phase 4)
- `GET /rotations/plan/:soleId?year=YYYY` → plan de culture annuel
- `POST /rotations/plan-section` → crée ou récupère une section de plan
- `GET /rotations/plantable-vegetables` → légumes filtrés par règles agronomiques
- `POST /rotations/can` → vérification préalable (OK / WARNING)
- `POST /rotations/add-vegetable` → affectation avec bypass optionnel
- `DELETE /rotations/remove-vegetable/:id` → retrait d'un légume

### Frontend créé
```text
src/
├── api/rotations.ts          ✅ 5 fonctions rotation
├── stores/planning.ts        ✅ usePlanningStore (soles, culturePlan, openSection, plantableVegetables)
├── views/PlanningView.vue    ✅ Vue principale (remplace placeholder)
└── components/planning/
    ├── PlanSelector.vue          ✅ Sélecteurs exploitation / sole / année
    ├── CulturePlanGrid.vue       ✅ Grille toutes planches
    ├── BoardCard.vue             ✅ Une planche + sections
    ├── SectionCell.vue           ✅ Cellule (occupée / disponible / readonly)
    ├── SectionSidePanel.vue      ✅ Panneau latéral (affectation + arrosage)
    └── RotationRuleMessage.vue   ✅ Feedback OK / WARNING
```

### Règles RBAC
- Route `/plan` : `roles: ['admin', 'formateur']`
- Stagiaire → `readonly` prop → cellules non cliquables
- Bypass visible uniquement admin/formateur

---

## 2. Arrosages

### Backend
**Entité** : `Watering` (`src/entities/watering.entity.ts`)
- `id_watering`, `watering_datetime` (timestamp), `id_section_plan` (FK nullable), `id_board` (FK), `scope` (`section` | `board` | `sole`)

**Module** : `src/watering/`
- `watering.service.ts` : `findAll()`, `findBySection()`, `waterSection()`, `waterBulk()`, `remove()`
- `watering.controller.ts` : `GET /watering`, `GET /watering/section/:sectionPlanId`, `POST /watering`, `POST /watering/bulk`, `DELETE /watering/:id`
- `watering.module.ts` : enregistré dans `AppModule`

### Frontend
```text
src/
├── api/waterings.ts          ✅ wateringsApi (findAll, findBySection, create, createBulk, remove)
├── stores/watering.ts        ✅ useWateringStore
└── views/WateringHistoryView.vue  ✅ /arrosages (tous rôles)
```

**`SectionSidePanel.vue`** — bloc 💧 arrosage intégré :
- Sélecteur de périmètre (cette section / planche entière / sole entière)
- Champ `datetime-local` plafonné à maintenant
- `doWater()` → `waterSection` ou `waterBulk` selon scope
- Liste des 5 derniers arrosages de la section

**`WateringHistoryView.vue`** :
- Filtres : exploitation, date de/à, reset
- Tableau : date/heure, section, légume, planche, sole, exploitation, supprimer (admin/formateur)
- Modal de confirmation suppression via `Teleport`

### Route
```
/arrosages  →  requiresAuth: true  (tous rôles)
```

---

## 3. Récoltes

### Backend
**Entité** : `Harvest` / `HarvestEntry` (tables existantes)
- Relations : section_plan → board → sole → exploitation

**Module** : `src/harvest/`
- `harvest.service.ts` : `findAll()`, `findBySection()`, `create()`, `remove()`
- Endpoints : `GET /harvest`, `GET /harvest/section/:id`, `POST /harvest`, `DELETE /harvest/:id`

### Frontend
```text
src/
├── api/harvests.ts               ✅ harvestsApi
├── stores/harvest.ts             ✅ useHarvestStore
└── views/HarvestHistoryView.vue  ✅ /recoltes (admin + formateur)
```

**`HarvestHistoryView.vue`** :
- Filtres : exploitation, légume, date de/à
- Tableau : date, légume, quantité, unité, planche, sole, exploitation, actions
- Formulaire ajout récolte inline ou modal
- Suppression avec confirmation

### Route
```
/recoltes  →  roles: ['admin', 'formateur']
```

---

## 4. Amendements (Fertilisation)

### Backend
**Entités** :
- `Amendement` (`src/entities/amendement.entity.ts`) — catalogue produits
  - `id_amendement`, `amendment_name`, `notice` (text nullable — notice/mode d'emploi)
- `Amended` (`src/entities/amended.entity.ts`) — applications par planche
  - `id_amended`, `amendment_date` (date), `quantity` (decimal nullable), `quantity_unit` (varchar nullable), `description` (text nullable)
  - FK → `Board`, FK → `Amendement`

**Module** : `src/amendement/`
- `amendement.service.ts` :
  - Catalogue : `findAllCatalogue()`, `findCatalogueById()`, `createCatalogue()`, `updateCatalogue()`, `removeCatalogue()`
  - Applications : `findAll()`, `findByBoard()`, `findById()`, `create()`, `createBulk()` (toutes planches actives d'une sole), `update()`, `remove()`
- `amendement.controller.ts` — deux contrôleurs dans un fichier :
  - `CatalogueController` → `GET|POST|PUT|DELETE /amendements/catalogue`
  - `AmendedController` → `GET|POST /amendements`, `POST /amendements/bulk`, `DELETE /amendements/:id`
- `dtos/create.amendement.dto.ts` : `CreateAmendementDTO`, `CreateBulkAmendementDTO`
- `dtos/catalogue.dto.ts` : `CreateCatalogueDTO`, `UpdateCatalogueDTO`

> **Note technique** : `amendment_date` maintenu en type `date` (pas `timestamp`) pour éviter l'erreur PostgreSQL `ATRewriteTable` lors du `synchronize`. `quantity_unit` requiert `type: 'varchar'` explicite dans le décorateur `@Column` pour éviter `DataTypeNotSupportedError: Data type "Object"`.

### Frontend
```text
src/
├── api/amendements.ts        ✅ amendementsApi (catalogue + applications)
├── stores/amendement.ts      ✅ useAmendementStore
└── views/AmendementView.vue  ✅ /amendements (admin + formateur)
```

**`AmendementView.vue`** :
- **Cartes résumé par planche** : dernière fertilisation + jours écoulés, code couleur (vert ≤30j, neutre >30j, gris "Jamais amendé")
- Filtres : exploitation, produit, date de/à
- Tableau historique avec popup notice au clic sur le produit
- Modal "Nouvel amendement" : périmètre (planche / sole), sélecteur produit + hint notice, date, quantité, unité, description
- Modal "Catalogue produits" : ajout / édition / suppression inline

### Route
```
/amendements  →  roles: ['admin', 'formateur']
```

---

## 5. Traitements phytosanitaires

### Backend
**Entités** :
- `Treatment` (`src/entities/treatment.entity.ts`) — catalogue produits
  - `id_treatment`, `treatment_name`, `notice` (text nullable)
- `Treated` (`src/entities/treated.entity.ts`) — applications par planche
  - `id_treated`, `treatment_date` (date), `treatment_quantity` (decimal nullable), `treatment_unit` (varchar nullable), `description` (text nullable)
  - FK → `Board`, FK → `Treatment`

**Module** : `src/treatment/`
- `treatment.service.ts` :
  - Catalogue : `findAllCatalogue()`, `findCatalogueById()`, `createCatalogue()`, `updateCatalogue()`, `removeCatalogue()`
  - Applications : `findAll()`, `findByBoard()`, `findOne()`, `create()`, `createBulk()`, `remove()`
- `treatment.controller.ts` — deux contrôleurs :
  - `TreatmentCatalogueController` → `GET|POST|PUT|DELETE /treated/catalogue`
  - `TreatedController` → `GET|POST /treated`, `GET /treated/board/:boardId`, `POST /treated/bulk`, `DELETE /treated/:id`
- `dtos/create.treatment.dto.ts` : `CreateTreatedDTO`, `CreateBulkTreatedDTO`, `CreateTreatmentCatalogueDTO`, `UpdateTreatmentCatalogueDTO`

### Frontend
```text
src/
├── api/treatments.ts        ✅ treatmentsApi (catalogue + applications)
├── stores/treatment.ts      ✅ useTreatmentStore
└── views/TreatmentView.vue  ✅ /traitements (admin + formateur)
```

**`TreatmentView.vue`** (schème couleur orange/brun — phytosanitaire) :
- **Cartes résumé par planche** : dernier traitement + jours écoulés
- Filtres : exploitation, produit, date de/à
- Tableau historique avec popup notice
- Modal "Nouveau traitement" : périmètre (planche / sole), produit, date, quantité, unité, description
- Modal "Catalogue produits" : CRUD inline

### Route
```
/traitements  →  roles: ['admin', 'formateur']
```

---

## 6. Correctifs transversaux

### CORS (api-culturo/src/main.ts)
Suppression de la double configuration qui bloquait toutes les requêtes :
```typescript
// AVANT (cassé) :
const app = await NestFactory.create(AppModule, { cors: true });
app.enableCors({ origin: true, ... });

// APRÈS (corrigé) :
const app = await NestFactory.create(AppModule);
app.enableCors({
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
```

### TypeORM — colonnes nullable avec type union
Toute colonne `string | null` ou `number | null` doit spécifier `type` explicitement :
```typescript
@Column({ type: 'varchar', nullable: true }) quantity_unit: string | null;
@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) quantity: number | null;
```

### Navigation (MainLayout.vue)
Liens ajoutés pour admin et formateur :
- `/arrosages` — Arrosages (Phase 4)
- `/amendements` — Amendements (Phase 4)
- `/traitements` — Traitements (Phase 4)

---

## Structure fichiers finale

```text
api-culturo/src/
├── entities/
│   ├── watering.entity.ts     ✅
│   ├── amended.entity.ts      ✅ (refondu)
│   ├── amendement.entity.ts   ✅ + notice
│   ├── treated.entity.ts      ✅ + quantity/unit/description
│   └── treatment.entity.ts    ✅ + notice
├── watering/                  ✅
├── amendement/                ✅ (refondu)
└── treatment/                 ✅ (refondu)

front-culturo/src/
├── api/
│   ├── waterings.ts           ✅
│   ├── harvests.ts            ✅
│   ├── amendements.ts         ✅
│   └── treatments.ts          ✅
├── stores/
│   ├── watering.ts            ✅
│   ├── harvest.ts             ✅
│   ├── amendement.ts          ✅
│   └── treatment.ts           ✅
├── views/
│   ├── WateringHistoryView.vue   ✅
│   ├── HarvestHistoryView.vue    ✅
│   ├── AmendementView.vue        ✅
│   └── TreatmentView.vue         ✅
└── components/planning/
    └── SectionSidePanel.vue      ✅ + bloc arrosage intégré
```

---

## Statut global

| Fonctionnalité            | Backend | Frontend | Route       | Nav |
|---------------------------|---------|----------|-------------|-----|
| Grille planification      | ✅ (pré-existant) | ✅ | `/plan` | ✅ |
| Arrosages                 | ✅      | ✅       | `/arrosages` | ✅ |
| Récoltes                  | ✅      | ✅       | `/recoltes` | ✅ |
| Amendements               | ✅      | ✅       | `/amendements` | ✅ |
| Traitements               | ✅      | ✅       | `/traitements` | ✅ |
