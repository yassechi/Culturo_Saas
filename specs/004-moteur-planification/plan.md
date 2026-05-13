# Implementation Plan: Phase 4 — Moteur de Planification (Frontend)

**Branch**: `004-moteur-planification` | **Dernière mise à jour**: 2026-05-13 | **Spec**: [spec.md](./spec.md)

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

## 7. Authentification — Mot de passe oublié

### Backend

**`User_` entity** — 2 colonnes ajoutées :
- `reset_token` (varchar nullable)
- `reset_token_expires` (timestamp nullable)

**`EmailService`** (`src/email/email.service.ts`) :
- `sendPasswordResetEmail(email, firstName, resetUrl)` — email HTML avec bouton vert + lien direct
- `sendWelcomeEmail()` — refactorisé avec Logger NestJS
- Config nodemailer : `host`/`port` lus depuis env, auth conditionnelle (ignorée si `MAIL_USER` vide)
- `transporter.verify()` au démarrage → log `Connexion SMTP OK` ou erreur explicite

**`UsersService`** — 2 nouvelles méthodes :
- `forgotPassword(email)` → génère token crypto 32 bytes, expiration 1h, envoie l'email. Echec d'envoi silencieux (log + lien debug en console)
- `resetPassword(token, newPassword)` → vérifie token + expiration, hash le nouveau mot de passe, efface le token

**DTOs** :
- `src/users/dtos/forgot-password.dto.ts` — `{ email: string }`
- `src/users/dtos/reset-password.dto.ts` — `{ token: string, newPassword: string (min 6) }`

**`UsersController`** — 2 nouveaux endpoints (sans guard) :
- `POST /users/forgot-password` → retourne toujours 200 (ne révèle pas si l'email existe)
- `POST /users/reset-password` → 200 OK ou 400 token invalide/expiré

**`UsersModule`** — `ConfigModule` ajouté aux imports pour que `ConfigService` soit disponible dans `UsersService`

### Frontend

**`src/api/users.ts`** — 2 nouvelles fonctions :
- `forgotPassword(email)`
- `resetPassword(token, newPassword)`

**`src/views/ForgotPasswordView.vue`** (nouvelle vue) :
- Formulaire email → appel API → message de succès neutre
- Lien "← Retour à la connexion"
- `defineOptions({ name: 'ForgotPasswordView' })` pour exclusion keep-alive

**`src/views/ResetPasswordView.vue`** (nouvelle vue) :
- Token lu depuis `window.location.search` (synchrone, avant tout rendu)
- Formulaire nouveau mot de passe + confirmation
- Gestion token manquant / expiré / succès
- `defineOptions({ name: 'ResetPasswordView' })` pour exclusion keep-alive

**Routes** (`src/router/index.ts`) :
- `/mot-de-passe-oublie` → `ForgotPasswordView` (requiresAuth: false, layout: auth)
- `/reinitialiser-mot-de-passe` → `ResetPasswordView` (requiresAuth: false, layout: auth)

**`src/views/LoginView.vue`** :
- Textes de dev remplacés par textes production
- Lien "Mot de passe oublié ?" ajouté sous le bouton

**`src/App.vue`** :
- Pages auth (`LoginView`, `ForgotPasswordView`, `ResetPasswordView`) exclues du `keep-alive` via `:exclude`

**`src/api/client.ts`** — intercepteur Axios corrigé :
- La redirection vers `/login` sur 401 est désormais ignorée si on est sur une page publique (`/login`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe`)

### Configuration SMTP

**`culturo/.env`** (fichier local, non commité) :
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=culturotech@gmail.com
MAIL_PASSWORD=<app_password_google>
MAIL_FROM=Culturo <culturotech@gmail.com>
FRONTEND_URL=http://localhost:5173
```

**`api-culturo/.env.dev`** — même valeurs SMTP (NestJS charge ce fichier en priorité via `ConfigModule`)

**`docker-compose.yml`** — variables SMTP injectées dans le conteneur API

> **Note** : Gmail SMTP avec `yassechi@gmail.com` a été rejeté systématiquement (BadCredentials 535-5.7.8) malgré plusieurs mots de passe d'application. Solution : utiliser un compte Gmail dédié (`culturotech@gmail.com`).

### Bugs corrigés

| Bug | Cause | Fix |
|-----|-------|-----|
| Redirect vers login au clic sur input | Intercepteur Axios → 401 d'un appel background redirige toutes pages | Exclure les pages publiques de la redirection |
| Token vide au rendu | `onMounted` s'exécute après le premier rendu → flash `v-if="!token"` | Lire le token via `window.location.search` synchroniquement |
| Composant caché réutilisé (wrong state) | `keep-alive` réutilisait l'instance précédente | `defineOptions({ name })` + `:exclude` sur keep-alive |
| MAIL_PASSWORD ignoré | `.env.dev` chargé en priorité par NestJS avec l'ancien mot de passe | Synchroniser `.env.dev` et `culturo/.env` |
| `service: 'gmail'` ignorait MAIL_HOST | nodemailer `service` hardcode les settings Gmail | Revenu à `host`/`port` explicites |

---

## Structure fichiers finale

```text
api-culturo/src/
├── entities/
│   ├── user_.entity.ts              ✅ + reset_token / reset_token_expires
│   ├── user_group.entity.ts         ✅
│   ├── exploitation.entity.ts       ✅
│   ├── sole.entity.ts               ✅
│   ├── board.entity.ts              ✅
│   ├── section.entity.ts            ✅ (section active d'une planche)
│   ├── section_plan.entity.ts       ✅ (plan annuel d'une planche)
│   ├── family.entity.ts             ✅
│   ├── family_importance.entity.ts  ✅
│   ├── family_incompatibility.entity.ts ✅
│   ├── vegetable.entity.ts          ✅
│   ├── variety.entity.ts            ✅
│   ├── harvest.entity.ts            ✅
│   ├── watering.entity.ts           ✅
│   ├── amendement.entity.ts         ✅ + notice
│   ├── amended.entity.ts            ✅ + quantity/unit/description
│   ├── treatment.entity.ts          ✅ + notice
│   ├── treated.entity.ts            ✅ + quantity/unit/description
│   ├── observation.entity.ts        ✅
│   ├── order.entity.ts              ✅
│   ├── order-details.entity.ts      ✅
│   └── price.entity.ts              ✅
├── users/                           ✅ CRUD + JWT + permissions + groups
├── email/                           ✅ nodemailer (reset pw + review notification)
├── exploitations/                   ✅ exploitations + soles + planches
├── vegetables/                      ✅ familles + légumes + variétés
├── harvest/                         ✅
├── watering/                        ✅
├── amendement/                      ✅ (refondu)
├── treatment/                       ✅ (refondu)
├── observations/                    ✅ + workflow validation
├── statistics/                      ✅ dashboard + rotation alerts
├── notifications/                   ✅ pending obs + upcoming harvest
├── rotations/                       ✅ plan de culture + règles rotation
└── order/                           ✅ (présent, non utilisé en frontend)

front-culturo/src/
├── api/
│   ├── client.ts                    ✅ intercepteur 401 corrigé
│   ├── users.ts                     ✅ + forgotPassword / resetPassword
│   ├── exploitations.ts             ✅
│   ├── soilBoards.ts                ✅
│   ├── botanical.ts                 ✅
│   ├── rotations.ts                 ✅
│   ├── waterings.ts                 ✅
│   ├── harvests.ts                  ✅
│   ├── amendements.ts               ✅
│   ├── treatments.ts                ✅
│   ├── observations.ts              ✅
│   ├── statistics.ts                ✅
│   └── admin.ts                     ✅
├── stores/
│   ├── auth.ts                      ✅
│   ├── adminUsers.ts                ✅
│   ├── botanical.ts                 ✅
│   ├── soilBoards.ts                ✅
│   ├── planning.ts                  ✅
│   ├── watering.ts                  ✅
│   ├── harvest.ts                   ✅
│   ├── amendement.ts                ✅
│   ├── treatment.ts                 ✅
│   ├── history.ts                   ✅
│   ├── observations.ts              ✅
│   ├── dashboard.ts                 ✅
│   ├── notifications.ts             ✅
│   └── config.ts                    ✅
├── views/
│   ├── LoginView.vue                ✅ textes production
│   ├── ForgotPasswordView.vue       ✅
│   ├── ResetPasswordView.vue        ✅
│   ├── DashboardView.vue            ✅
│   ├── AdminUsersView.vue           ✅ (admin)
│   ├── BotanicalCatalogView.vue     ✅
│   ├── SoilBoardsView.vue           ✅ + expand planches + delete sections
│   ├── PlanningView.vue             ✅ Gantt éditeur (admin/formateur)
│   ├── CulturePlanView.vue          ✅ lecture seule (stagiaire)
│   ├── HarvestHistoryView.vue       ✅
│   ├── WateringHistoryView.vue      ✅
│   ├── AmendementView.vue           ✅
│   ├── TreatmentView.vue            ✅
│   ├── HistoryView.vue              ✅ + alertes rotation
│   ├── ObservationsView.vue         ✅ (saisie stagiaire)
│   ├── ValidationView.vue           ✅ (relecture formateur)
│   ├── TrainerDashboardView.vue     ✅
│   ├── ConfigurationView.vue        ✅ (admin)
│   └── ForbiddenView.vue            ✅
├── components/
│   ├── NotificationBell.vue         ✅
│   ├── SatelliteMapPicker.vue       ✅
│   ├── SatelliteFrame.vue           ✅
│   └── planning/
│       ├── PlanSelector.vue         ✅
│       ├── CulturePlanGrid.vue      ✅ + type famille tooltip
│       ├── BoardCard.vue            ✅
│       ├── SectionCell.vue          ✅
│       ├── SectionSidePanel.vue     ✅ + arrosage + unité quantité + collapse compatibles
│       ├── VegetableSearchPanel.vue ✅ recherche légume → sections disponibles
│       └── RotationRuleMessage.vue  ✅
└── layouts/
    ├── MainLayout.vue               ✅ sidebar + nav par rôle + NotificationBell
    └── AuthLayout.vue               ✅
```

---

## 8. Améliorations UX — Planification & Sol (2026-05-13)

### 8.1 Synchronisation cross-store

Toutes les mutations (arrosage, récolte, amendement, traitement, historique) invalident désormais le plan de culture en temps réel sans rechargement de page.

**`stores/watering.ts`** — après `waterSection`, `waterBulk`, `deleteWatering` :
```typescript
listLoaded.value = false;
```

**`stores/harvest.ts`** — après `createHarvest` et `deleteHarvest` :
```typescript
listLoaded.value = false;
void usePlanningStore().loadCulturePlan();
```

**`stores/treatment.ts`** — après `applyToBoard`, `applyToSole`, `deleteTreatment` :
```typescript
listLoaded.value = false;
```

**`stores/amendement.ts`** — après `applyToBoard`, `applyToSole`, `deleteAmendement` :
```typescript
listLoaded.value = false;
```

**`stores/history.ts`** — nouvelle fonction exposée :
```typescript
invalidateSoles: () => { solesLoaded.value = false; entriesByYear.value = {}; }
```

**`stores/soilBoards.ts`** — `syncPlanningStore()` étendu + appelé depuis `batchCreateBoards()` :
```typescript
function syncPlanningStore() {
  const planningStore = usePlanningStore();
  planningStore.invalidateSoles();
  void planningStore.loadSoles();
  const historyStore = useHistoryStore();
  historyStore.invalidateSoles();
  void historyStore.loadSoles();
}
```

**`stores/planning.ts`** — après `submitAssignment` :
```typescript
useHistoryStore().invalidateSoles();
```

---

### 8.2 Type de famille dans le tooltip Gantt

Le tooltip des barres Gantt affiche désormais `Famille : Tomate · primaire` (type importance de la famille).

**Backend — `rotation.service.ts`** :
- `RawCulturePlanResult` : ajout du champ `family_importance_importance_name: string | null`
- Join : `.leftJoin('family.family_importance', 'family_importance')`
- Select : `'family_importance.importance_name'`
- Mapping : `familyType: r.family_importance_importance_name ?? null`

**`api-culturo/src/rotations/dtos/boardPlan.dto.ts`** :
```typescript
familyType: string | null;
```

**`front-culturo/src/types/planning.ts`** :
```typescript
// CulturePlanEntry
familyType: string | null;
```

**`CulturePlanGrid.vue`** — `LaneData` + `boardRows` computed + tooltip :
```vue
Famille : {{ lane.familyName ?? '—' }}
<template v-if="lane.familyType"> · <em>{{ lane.familyType }}</em></template>
```

---

### 8.3 Quantité plantée + correction "Invalid Date" dans SectionSidePanel

**Problème** : `lastPlantedInSection` retournait le NOM du légume au lieu d'une date ISO → `formatDate()` affichait "Invalid Date". `lastQuantityPlanted` n'était pas exposé.

**Fix backend — `rotation.service.ts`** (`findPlantableVegetables`) :
```typescript
lastPlantedInSection: lastSectionAtLocation?.start_date
  ? new Date(lastSectionAtLocation.start_date).toISOString()
  : null,
lastQuantityPlanted: lastSectionAtLocation?.quantity_planted ?? null,
```

**`api-culturo/src/rotations/dtos/plantable.vegetable.dto.ts`** :
```typescript
lastQuantityPlanted: number | null;
```

**`front-culturo/src/types/planning.ts`** :
```typescript
// PlantableVegetable
lastQuantityPlanted: number | null;
```

**`SectionSidePanel.vue`** — badge légume :
```vue
{{ formatDate(veg.lastPlantedInSection) }}
<template v-if="veg.lastQuantityPlanted"> · {{ veg.lastQuantityPlanted }} pl.</template>
```

---

### 8.4 Sélecteur d'unité pour la quantité plantée

Le champ quantité dans le formulaire d'affectation propose maintenant un sélecteur d'unité inline.

**`stores/planning.ts`** — valeur par défaut corrigée : `unity: 'kg'` (était `'unité'` qui ne correspondait à aucune option)

**`SectionSidePanel.vue`** — champ quantité remplacé par une ligne combinée :
```vue
<div class="qty-row">
  <input id="qty" v-model.number="store.assignmentForm.quantityPlanted"
         type="number" min="0" class="qty-input" />
  <select v-model="store.assignmentForm.unity" class="qty-unit">
    <option value="kg">kg</option>
    <option value="pièces">pièces</option>
    <option value="plants">plants</option>
    <option value="bottes">bottes</option>
    <option value="graines">graines</option>
  </select>
</div>
```

---

### 8.5 Section "Légumes compatibles" repliée par défaut

La section compatibilités était toujours ouverte, alourdissant le panneau.

**`SectionSidePanel.vue`** :
```typescript
const showCompatible = ref(false);
```
Section enveloppée dans un toggle identique au pattern `showRestricted` existant.

---

### 8.6 Expansion des planches + suppression de sections (Sol & Planches)

**`SoilBoardsView.vue`** — nouvelles fonctionnalités :

**État local ajouté** :
```typescript
const expandedBoardId = ref<number | null>(null);
const boardSectionsMap = reactive<Record<number, CulturePlanEntry[]>>({});
const boardSectionsLoading = reactive<Record<number, boolean>>({});
const boardSectionCounts = reactive<Record<number, number>>({});
```

**`toggleBoard(boardId)`** : clic sur l'en-tête d'une planche → bascule l'expansion et charge les sections via `createOrGetSectionPlan` + `getCulturePlan`.

**`loadBoardSections(boardId)`** : appelle `rotationsApi.createOrGetSectionPlan` (pour obtenir le compte de sections) puis `rotationsApi.getCulturePlan` (pour les légumes occupant chaque section).

**`deleteSection(sectionId, boardId, vegetableName?)`** :
- Si la section est occupée → `window.confirm()` avec le nom du légume
- `rotationsApi.cancelSection(sectionId)` si occupée
- `store.setSections(boardId, newCount)` pour réduire le compte
- `usePlanningStore().loadCulturePlan()` pour rafraîchir le Gantt

**Template** : `.board-header` cliquable → panneau expandable avec liste S1..SN (occupé / disponible + bouton 🗑️ par section).

---

### 8.7 Correctif backend — réduction du nombre de sections

**Problème** : après suppression d'une section, elle réapparaissait comme "Disponible" dans la planification car `createOrActivatePlan` ne réduisait jamais le nombre de sections.

**`rotation.service.ts`** — `createOrActivatePlan` :
```typescript
// AVANT (bug — seulement augmentation) :
if (numberOfSections > existingPlan.number_of_section) {

// APRÈS (fix — augmentation ET réduction) :
if (numberOfSections !== existingPlan.number_of_section && numberOfSections > 0) {
  existingPlan.number_of_section = numberOfSections;
  await this.sectionPlanRepository.save(existingPlan);
}
```

> **Note** : restart du backend requis pour que ce fix soit actif.

---

### 8.8 Correctif visuel — fond non homogène sous la grille Gantt

**Problème** : la zone vide sous les dernières lignes du Gantt montrait le gradient beige chaud du `body` (avec `background-attachment: fixed`), créant une rupture visuelle.

**Cause** : `.app-shell` utilise `min-height: 100vh` (pas `height`), donc `height: 100%` sur `.planning-view` n'était pas résolu par rapport au viewport — la vue ne s'étendait pas jusqu'en bas.

**Fix — `PlanningView.vue`** :
```css
.planning-view {
  min-height: calc(100vh - 2.5rem); /* était min-height: 100% */
}
```

---

## 9. Fonctionnalités existantes non documentées

Ces fonctionnalités sont présentes dans le dépôt mais n'étaient pas couvertes dans les sections 1–8.

---

### 9.1 Tableau de bord (`/dashboard`)

**Frontend** : `DashboardView.vue` + `stores/dashboard.ts` + `api/statistics.ts`

- Stat cards : taux d'occupation (sections actives / total), observations en attente, saisies 7 jours, violations de rotation
- Liste des actions disponibles (liens rapides selon le rôle)
- Alertes de rotation dismissables (persistées en localStorage via `culturo:dismissed-alerts`)
- Observations récentes de l'exploitation

**Backend** : `statistics/` module — `StatisticsService` + `StatisticsController`
- `GET /statistics/dashboard` → `DashboardSummary` : planning (occupancy), observations (pending, recent), rotation alerts (rule des 5 ans), contributors
- Entités jointes : `Board`, `SectionPlan`, `Section`, `Observation`, `Family`

---

### 9.2 Sol & Planches (`/admin/sol-planches`)

**Frontend** : `SoilBoardsView.vue` + `stores/soilBoards.ts` + `api/soilBoards.ts` + `api/exploitations.ts`

- 3 colonnes : Exploitations → Soles → Planches (CRUD complet)
- Miniature satellite par exploitation (coords stockées dans `localStorage` via `culturo_exploitation_coords`)
- Sélecteur de coordonnées satellite : `SatelliteMapPicker.vue` + `SatelliteFrame.vue` (tuile OSM statique)
- Stats en-tête : nombre d'exploitations, soles, planches
- Planche cliquable → panneau expandable avec liste sections (S1..SN occupé/disponible + 🗑️)
- Création batch de planches (`batchCreateBoards`)

**Backend** : `exploitations/` module
- `ExploitationController` → `GET|POST|PATCH|DELETE /exploitations`
- `SoleController` → `GET|POST|PATCH|DELETE /soles`
- `BoardController` → `GET|POST|PATCH|DELETE /boards`

---

### 9.3 Référentiel botanique (`/admin/botanique`)

**Frontend** : `BotanicalCatalogView.vue` + `stores/botanical.ts` + `api/botanical.ts`

- Onglets : Familles / Légumes / Variétés
- CRUD complet par onglet (modal création/édition inline)
- Stats en-tête : nb familles, légumes, variétés
- Sélecteur d'importance de famille (primaire / secondaire)

**Backend** : `vegetables/` module (`legume.module.ts`)
- `FamilyController` → `GET|POST|PATCH|DELETE /families` + gestion des incompatibilités
- `VegetableController` → `GET|POST|PATCH|DELETE /vegetables`
- `VarietyController` → `GET|POST|PATCH|DELETE /varieties`
- Entités : `Family`, `Vegetable`, `Variety`, `FamilyImportance`, `FamilyIncompatibility`

---

### 9.4 Gestion des utilisateurs (`/admin/utilisateurs`)

**Frontend** : `AdminUsersView.vue` + `stores/adminUsers.ts` + `api/admin.ts`

- Stats : total, actifs, inactifs, admins, formateurs, stagiaires
- Tableau filtrable (rôle, statut, recherche nom/email)
- Modal création/édition : email, prénom, nom, rôle, mot de passe (création), actif/inactif
- Désactivation / suppression avec confirmation

**Backend** : `UsersController` + `UsersService` (module `users/`)
- `GET /users` → liste paginée avec filtres
- `POST /users` → création compte (hash bcrypt)
- `PATCH /users/:id` → édition
- `DELETE /users/:id` → suppression

---

### 9.5 Observations terrain (`/observations`)

**Frontend** : `ObservationsView.vue` + `stores/observations.ts` + `api/observations.ts`

- Formulaire de saisie : section active (sélecteur avec légume planté), état de la plante, type de problème, description, météo, photo (optionnel)
- Liste "Mes observations" avec statut (en_attente / validé / à_corriger) et retour formateur
- Stats personnelles : total, en attente, à corriger

**Backend** : `observations/` module
- `GET /observations` → liste (filtrée par auteur pour stagiaire, tous pour formateur/admin)
- `POST /observations` → création avec envoi email au formateur (via `EmailService`)
- `PATCH /observations/:id/review` → validation ou demande de corrections (formateur)
- `DELETE /observations/:id`
- Entité : `Observation` (section FK, author FK, statut, météo, description, review_comment)

---

### 9.6 Validation pédagogique (`/validation`)

**Frontend** : `ValidationView.vue` + `stores/observations.ts` (partagé)

- File des observations en attente (priorisées par date)
- Boutons : Valider / Demander des corrections (avec champ retour)
- Stats formateur : en attente, validées, à corriger

---

### 9.7 Tableau de bord formateur (`/formateur/tableau-de-bord`)

**Frontend** : `TrainerDashboardView.vue` + `stores/observations.ts` (partagé)

- Vue agrégée : contributions par stagiaire, observations prioritaires
- Lien rapide vers la file de validation

---

### 9.8 Plan de culture stagiaire (`/plan-culture`)

**Frontend** : `CulturePlanView.vue` + `stores/planning.ts` (partagé)

- Vue lecture seule du plan de culture annuel pour les stagiaires
- Sélecteurs exploitation / sole / année (`PlanSelector.vue`)
- Tableau planches × sections avec légume, dates, statut récolte
- Pas d'interaction (mode `readonly`)

---

### 9.9 Historique des cultures (`/historique`)

**Frontend** : `HistoryView.vue` + `stores/history.ts` + (API partagée rotations)

- Filtres : exploitation, sole, légume, année, alerte seule
- Tableau : planche, section, légume, famille, dates, jours écoulés
- Alertes rotation (règle 5 ans) en surbrillance
- Stats : plantations, légumes uniques, alertes
- Export CSV

---

### 9.10 Notifications (`NotificationBell.vue`)

**Frontend** : `NotificationBell.vue` + `stores/notifications.ts`

- Cloche dans la barre latérale avec badge de comptage
- Panneau déroulant : observations en attente, récoltes prochaines, alertes rotation
- Sévérité : info / warning / critical

**Backend** : `notifications/` module
- `GET /notifications` → liste triée par sévérité (critical → warning → info)
- Types : `pending_observation`, `upcoming_harvest`, `rotation_alert`

---

### 9.11 Groupes d'utilisateurs

**Backend** : `users/groups.service.ts` + `users/groups.controller.ts`
- `GET|POST|PATCH|DELETE /groups`
- `POST /groups/:id/add-user` / `DELETE /groups/:id/remove-user/:userId`
- Entité : `UserGroup` (name, description, FK users)
- Non encore intégré en frontend (prévu pour gestion pédagogique)

---

### 9.12 Configuration système (`/admin/configuration`)

**Frontend** : `ConfigurationView.vue` + `stores/config.ts`

- Sections accordéon : Informations système (env, URL API, version), Paramètres métier (année en cours, règles de rotation), Outils dev
- Sauvegarde locale (pas d'appel API — config stockée en `localStorage`)

---

### 9.13 Navigation complète par rôle

| Rôle       | Liens disponibles |
|------------|-------------------|
| **Admin**  | Utilisateurs, Référentiel botanique, Sol & planches, Planification, Récoltes, Arrosages, Fertilisations, Traitements, Historique, Configuration |
| **Formateur** | Référentiel botanique, Sol & planches, Planification, Récoltes, Arrosages, Fertilisations, Traitements, Historique, Observations, Validation, Tableau de bord formateur |
| **Stagiaire** | Référentiel botanique, Planification, Récoltes, Arrosages, Fertilisations, Traitements, Historique, Mes observations |

---

## 10. Badges, récoltes imminentes et alertes rotation (2026-05-14)

### 10.1 Gestion utilisateurs étendue aux formateurs

- Route `/admin/utilisateurs` ouverte aux formateurs (`roles: ['admin', 'formateur']`)
- Lien "Utilisateurs" ajouté dans la sidebar formateur
- Table : colonne "Formateur" avec `<select>` pour affecter un formateur à chaque stagiaire
- Modal création : sélection du rôle (admin / formateur / stagiaire) + sélecteur de formateur si stagiaire
- **Backend** : `User_` entity — colonne `id_formateur` (int nullable) + relation `@ManyToOne` auto-référentielle
- **DTO** : `UpdateUserDTO.id_formateur` décoré `@ValidateIf / @IsNumber / @Transform` pour passer le `ValidationPipe whitelist`
- **`UsersService.updateUser()`** : affecte `id_formateur` si présent dans le payload
- **Observations filtrées par formateur assigné** : `findAll()` → `author.id_formateur = :formateurId` pour le rôle formateur (admin voit tout)
- **Email notification** : envoyé uniquement au formateur assigné (`author.id_formateur`) et non à tous les formateurs

### 10.2 Badges sidebar

**Formateur — badge "Validation"** :
- `useObservationsStore.loadPendingCount()` → `GET /observations?reviewStatus=pending` compté séparément dans `pendingCount ref`
- `MainLayout` appelle `loadPendingCount()` au mount pour formateur/admin
- `{ to: '/validation', label: 'Validation', badge: pendingValidationCount }` avec `.nav-badge` rouge

**Stagiaire — badge "Mes observations"** :
- `seen_by_author` boolean ajouté sur `Observation` entity (`default: true`)
- `review()` dans `observations.service.ts` passe `seen_by_author = false` lors de la validation
- `PATCH /observations/mark-seen` → `markAllSeenForAuthor(authorId)` marque toutes les observations relues
- `ObservationsView` appelle `store.markAllSeen()` au mount → badge disparaît automatiquement
- `myStats.unseen` = observations `review_status !== 'pending' && !seen_by_author`

### 10.3 Récoltes imminentes dans tous les dashboards

- `GET /rotations/harvest-due?days=7` — retourne les sections `section_active = true` dont `end_date <= today+7` (sans borne inférieure → inclut les retards)
- **Store partagé `harvestDue.ts`** (`useHarvestDueStore`) : `items ref`, `loading ref`, `load(days)` action
- `DashboardView` et `TrainerDashboardView` utilisent `storeToRefs(harvestDueStore)` pour la réactivité
- `useHarvestStore.createHarvest()` et `deleteHarvest()` appellent `harvestDueStore.load()` + `notificationsStore.fetch()` après chaque opération → mise à jour automatique sans rechargement
- **Codes couleur** : retard → rouge (`badge-overdue`), aujourd'hui → orange (`badge-today`), bientôt → vert (`badge-soon`)

### 10.4 Cloche notifications — récoltes urgentes

- Fenêtre réduite à 7 jours (cohérence avec dashboard)
- Trois niveaux distincts générés par `addUpcomingHarvestNotifications()` :
  - `end_date < today` → notification `critical` "X récolte(s) en retard"
  - `end_date = today` → notification `warning` "X récolte(s) à faire aujourd'hui"
  - `end_date <= today+7` → notification `info` "X récoltes dans les 7 prochains jours"
- Compteur observations formateur filtré par `author.id_formateur` dans `notifications.service.ts`

### 10.5 Alertes rotation — cohabitation de familles primaires

- `computeRotationAlerts()` remplacé par deux méthodes parallèles :
  - `computeRotation5yAlerts()` — inchangé, `ruleType: 'rotation_5y'`
  - `computeCohabitationAlerts()` — détecte les planches avec 2+ familles primaires actives simultanément (`section_active = true`), `ruleType: 'cohabitation'`
- `DashboardRotationAlert` : ajout de `ruleType: 'rotation_5y' | 'cohabitation'` et `description?: string`
- Template : badge coloré par type (orange 5 ans, violet cohabitation) + description adaptée
- Règle jachère (3 ans consécutifs) conservée dans le flux de plantation uniquement, retirée du dashboard

### 10.6 Seed SQL — scénarios de violation contrôlés

- DO block principal : `vegetable_id` limité aux légumes non-primaires (`ARRAY[1,3,9,10,11,12,13,14,15,16,17,18,19,20]`) → aucune violation accidentelle
- Bloc `13b` ajouté avec violations explicites :
  - **5 ans (1 seule)** : Tomate (Solanacées) sur N1 en mars 2022 puis mars 2025 (écart 3 ans)
  - **Cohabitation** : N2 avec Tomate (Solanacées) + Brocoli (Crucifères) actives simultanément

---

## Statut global

| Fonctionnalité            | Backend | Frontend | Route       | Rôles |
|---------------------------|---------|----------|-------------|-------|
| Authentification + JWT    | ✅      | ✅       | `/login`    | tous  |
| Mot de passe oublié       | ✅      | ✅       | `/mot-de-passe-oublie` | tous |
| Tableau de bord           | ✅      | ✅       | `/dashboard` | tous |
| Gestion utilisateurs      | ✅      | ✅       | `/admin/utilisateurs` | admin |
| Référentiel botanique     | ✅      | ✅       | `/admin/botanique` | tous |
| Sol & Planches            | ✅      | ✅       | `/admin/sol-planches` | admin, formateur |
| Grille planification      | ✅      | ✅       | `/plan`     | tous  |
| Plan de culture stagiaire | ✅      | ✅       | `/plan-culture` | tous |
| Arrosages                 | ✅      | ✅       | `/arrosages` | tous |
| Récoltes                  | ✅      | ✅       | `/recoltes`  | admin, formateur |
| Amendements               | ✅      | ✅       | `/amendements` | admin, formateur |
| Traitements               | ✅      | ✅       | `/traitements` | admin, formateur |
| Historique cultures       | ✅      | ✅       | `/historique` | tous |
| Observations terrain      | ✅      | ✅       | `/observations` | tous |
| Validation pédagogique    | ✅      | ✅       | `/validation` | admin, formateur |
| Tableau de bord formateur | —       | ✅       | `/formateur/tableau-de-bord` | admin, formateur |
| Notifications             | ✅      | ✅       | — (composant sidebar) | tous |
| Groupes utilisateurs      | ✅      | —        | — (frontend à faire) | admin |
| Configuration système     | —       | ✅       | `/admin/configuration` | admin |
| Sync cross-store          | —       | ✅       | —           | — |
| Type famille tooltip Gantt| ✅      | ✅       | —           | — |
| Sélecteur unité quantité  | —       | ✅       | —           | — |
| Expand planche + suppr. section | ✅ | ✅     | —           | — |
| Fix réduction sections    | ✅      | —        | —           | — |
| Affectation formateur→stagiaire | ✅ | ✅   | —           | admin, formateur |
| Badge validation (formateur)    | ✅ | ✅   | —           | formateur |
| Badge observations non lues (stagiaire) | ✅ | ✅ | —      | stagiaire |
| Récoltes imminentes dashboard   | ✅ | ✅   | —           | tous |
| Store partagé harvestDue        | —  | ✅   | —           | — |
| Cloche — récoltes critical/warning | ✅ | ✅ | —          | tous |
| Alertes rotation cohabitation   | ✅ | ✅   | —           | tous |
| Seed SQL violations contrôlées  | ✅ | —    | —           | — |
