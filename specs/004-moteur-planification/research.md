# Research — Phase 4 : Moteur de Planification (Frontend)

**Branch**: `004-moteur-planification` | **Date**: 2026-04-19

---

## Décisions techniques

### D1 — Architecture de l'état (Pinia store)

**Decision**: Un store Pinia dédié `usePlanningStore` centralise tout l'état de la vue Planification.

**Rationale**: La vue implique des données inter-dépendantes (exploitation → sole → planches → plan de culture + panneau latéral de section). Un store unique évite le prop-drilling profond et permet à plusieurs composants de réagir aux mêmes mutations (ex: sélection d'année recharge le plan ET réinitialise le panneau ouvert).

**Alternatives considérées**:
- Props/emits uniquement → trop verbeux sur 4–5 niveaux de composants, rejoint pour lisibilité.
- Composable `usePlanningState` → valide mais ne bénéficie pas de Vue DevTools Pinia tracking.

---

### D2 — Séquence d'appels API pour charger le plan

**Decision**: Deux appels parallèles au démarrage :
1. `GET /sole` (avec `relations: ['exploitation', 'boards']`) → construit les sélecteurs exploitation + sole + donne la liste des planches.
2. `GET /rotations/plan/:soleId?year=YYYY` → retourne les sections occupées.

Les sections "disponibles" sont calculées côté frontend : `boards[i].sections 1..N` moins les `sectionNumber` déjà dans le plan de culture.

**Rationale**: `GET /sole` retourne déjà les boards inclus (relation eager). Pas besoin d'un appel séparé `GET /boards`. Évite une route backend supplémentaire dans une phase frontend pure.

**Alternatives considérées**:
- `GET /boards?soleId=X` → n'existe pas côté backend (pas de filtre par soleId exposé).
- Ajouter un endpoint backend → hors scope Phase 4 (frontend-only).

**Nombre de sections par planche**: L'entité `Board` ne stocke pas `numberOfSections`. La valeur par défaut est **4 sections** (valeur utilisée par `addVegetableToBoard` via `sectionsToCreate = numberOfSection ?? 3`). La vue affichera sections 1 à 4 par défaut.

---

### D3 — Séquence pour afficher les légumes compatibles

**Decision**: Quand l'utilisateur ouvre le panneau d'une section disponible :
1. `POST /rotations/plan-section?boardId=X` → retourne `{ sectionPlan: { id_section_plan: N }, status }` (crée ou retrouve le plan de section).
2. `GET /rotations/plantable-vegetables?sectionPlanId=N&sectionNumber=Y&startDate=&endDate=` → liste les légumes compatibles.

Les dates `startDate`/`endDate` sont initialisées à `01-01-YYYY` / `31-12-YYYY` de l'année sélectionnée ; l'utilisateur les affine dans le formulaire.

**Rationale**: `findPlantableVegetables` exige un `sectionPlanId` — il faut d'abord créer ou retrouver le plan de section. L'endpoint `POST /rotations/plan-section` est idempotent (retourne FOUND si déjà existant), sans effet de bord.

---

### D4 — Affichage des légumes groupés par famille

**Decision**: Côté frontend, les légumes compatibles reçus de l'API sont triés/groupés selon :
1. Familles jamais plantées sur la planche (`neverPlantedInSection: true`) — groupe prioritaire.
2. Familles plantées, triées par `lastPlantedInSection` (date la plus ancienne d'abord).

Le tri se fait dans le store (fonction `groupVegetablesByFamily`), pas dans le composant.

**Rationale**: L'API retourne un tableau plat de `PlantableVegetableDto`. Le groupement est une règle de présentation métier (FR-007) — appartient à la couche logique du store, pas au template.

---

### D5 — Gestion du bypass (contournement)

**Decision**: Le bouton "Forcer quand même (bypass)" est rendu conditionnel via `v-if="auth.isAdmin || auth.isFormateur"`. Quand l'API retourne un WARNING (HTTP 400 avec `warningDetails`), l'interface affiche le message d'erreur ET le bouton bypass. Si le formateur confirme, le DTO `bypass: true` est envoyé.

**Rationale**: Le backend renvoie HTTP 400 pour les WARNING (voir `rotation.controller.ts` ligne 345–353). Le frontend intercepte cette erreur via `axios.catch`, lit `error.response.data.warningDetails`, et affiche le message explicatif. Le bypass est une re-soumission du même formulaire avec `bypass: true`.

---

### D6 — Modules API frontend

**Decision**: Deux nouveaux modules dans `src/api/` :
- `rotations.ts` — 5 fonctions wrappant les endpoints rotation.
- `exploitations.ts` — 2 fonctions: `getAllSoles()`, `getAllExploitations()`.

**Rationale**: Cohérent avec `src/api/users.ts` existant. Sépare les domaines. Aucun appel API direct dans les composants — toujours via le store ou un composable.

---

### D7 — Structure des composants

**Decision**: Dossier `src/components/planning/` avec 6 composants dédiés + `PlanningView.vue` remplacé.

| Composant | Responsabilité unique |
|-----------|----------------------|
| `PlanSelector.vue` | Dropdowns exploitation / sole / année + bouton Charger |
| `CulturePlanGrid.vue` | Grille de toutes les planches avec leurs sections |
| `BoardCard.vue` | Affiche une planche et ses N sections |
| `SectionCell.vue` | Cellule section : occupée (légume+dates) ou disponible (clic pour ouvrir panneau) |
| `SectionSidePanel.vue` | Panneau latéral d'affectation : suggestions + formulaire + confirmation |
| `RotationRuleMessage.vue` | Message OK vert / WARNING orange avec texte agronomique clair |

**Rationale**: Chaque composant a une responsabilité unique (constitution principe V). Facilite le test individuel et la réutilisation future.

---

## Contraintes confirmées

- **Stagiaire** : `isFormateur || isAdmin` guard sur toute action d'écriture. Vue lecture seule.
- **Bypass** : visible uniquement si `!auth.isStagiaire`.
- **Dates** : format `YYYY-MM-DD` (ISO 8601) pour tous les inputs date → `<input type="date">`.
- **Quantité/unité** : champs optionnels, défauts `quantityPlanted: 0`, `unity: 'unité'`.
- **VarietyIdentifier** : saisie libre (chaîne), créée auto par l'API si inconnue.
- **Nombre de sections par planche** : 4 par défaut (affiché côté front même si l'API en a créé 3).
