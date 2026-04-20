# Implementation Plan: Phase 4 — Moteur de Planification (Frontend)

**Branch**: `004-moteur-planification` | **Date**: 2026-04-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification Phase 4 ; API rotation entièrement opérationnelle dans `culturo/api-culturo/src/rotations/`

---

## Summary

Implémenter la vue Planification Vue.js 3 qui branche l'interface utilisateur sur les 6 endpoints de rotation existants. Zéro modification backend. La vue permet à un formateur de visualiser le plan de culture annuel d'une sole, d'affecter des légumes aux sections disponibles avec validation des règles agronomiques en temps réel, et d'afficher les suggestions groupées par famille botanique.

---

## Technical Context

**Language/Version**: TypeScript 5.x via Vite — Vue.js 3 (Composition API + `<script setup>`)
**Primary Dependencies**: Vue 3, Pinia, Vue Router 4, Axios (déjà installés)
**Storage**: Aucun — état en mémoire (Pinia store), données depuis API REST
**Testing**: Vitest (déjà configuré dans le projet)
**Target Platform**: Navigateur web (Chrome/Firefox/Edge modernes) — Docker front port 5173
**Project Type**: Single-Page Application frontend-only (web-service)
**Performance Goals**: Plan de culture chargé < 3 secondes (SC-001) ; suggestions < 2 secondes (SC-004)
**Constraints**: Lecture seule pour stagiaire — guard composant (pas seulement routeur) ; bypass visible uniquement admin/formateur
**Scale/Scope**: 1 sole = max ~20 planches × 4 sections = 80 cellules par vue

---

## Constitution Check

### I. Centralized Rules Engine ✅
Le moteur de règles reste intégralement côté backend. Le frontend affiche uniquement les résultats :
- `GET /rotations/plantable-vegetables` → légumes déjà filtrés par les règles
- `POST /rotations/can` → résultat OK/WARNING (optionnel, pour prévisualisation)
- `POST /rotations/add-vegetable` → validation finale côté serveur
Aucune règle agronomique dans le frontend.

### II. Role-Based Access Control ✅
- Route `/plan` : `roles: ['admin', 'formateur']` dans le routeur (déjà configuré)
- Composant `SectionCell` : prop `readonly` dérivé de `auth.isStagiaire`
- Bouton bypass : `v-if="!auth.isStagiaire"` dans `SectionSidePanel`
- Toutes les actions d'écriture (POST) passent par le store, qui appelle l'API avec JWT

### III. API-First Design ✅
- Aucune logique métier dans les composants
- Toutes les règles de rotation traitées côté serveur
- Contrats définis dans `/contracts/ui-components.md`

### IV. Test-First Development ⚠️ (DEFERRED)
Phase 4 est 100% frontend UI — les tests unitaires Vitest sur le store de planning sont préconisés mais la couverture de l'API backend est déjà validée en Phase 3. Les composants Vue ne feront pas l'objet de tests automatisés dans cette phase (hors scope spécifié).

### V. Pedagogical Clarity ✅
- Messages d'erreur en français naturel (directement depuis l'API)
- Groupement par famille botanique avec badges "Jamais planté ici"
- Affichage des dates de dernière plantation

**Résultat du gate**: ✅ Pas de violation bloquante — Phase IV autorisée.

---

## Project Structure

### Documentation (cette feature)

```text
specs/004-moteur-planification/
├── plan.md              # Ce fichier
├── research.md          # Décisions techniques D1–D7
├── data-model.md        # Types TypeScript frontend
├── quickstart.md        # Scénarios de test manuels
├── contracts/
│   └── ui-components.md # Contrats composants + API frontend
├── checklists/
│   └── requirements.md  # Checklist qualité spec
└── tasks.md             # Tâches d'implémentation (/speckit-tasks)
```

### Source Code

```text
culturo/front-culturo/src/
├── api/
│   ├── client.ts          # ✅ Existant — axios + intercepteurs JWT
│   ├── users.ts           # ✅ Existant
│   ├── exploitations.ts   # 🆕 À créer — GET /exploitation, GET /sole
│   └── rotations.ts       # ✅ Créé (T004) — 5 fonctions rotation
│
├── stores/
│   ├── auth.ts            # ✅ Existant
│   └── planning.ts        # 🆕 À créer (T005) — usePlanningStore
│
├── types/
│   └── planning.ts        # 🆕 À créer (T002) — 10 interfaces TypeScript
│
├── components/
│   ├── FeaturePlaceholder.vue  # ✅ Existant
│   └── planning/               # 🆕 Dossier à créer
│       ├── PlanSelector.vue    # Sélecteurs exploitation/sole/année
│       ├── CulturePlanGrid.vue # Grille toutes les planches
│       ├── BoardCard.vue       # Une planche + ses sections
│       ├── SectionCell.vue     # Cellule section (occupée/disponible)
│       ├── SectionSidePanel.vue # Panneau affectation
│       └── RotationRuleMessage.vue # Message OK/WARNING
│
└── views/
    └── PlanningView.vue    # 🔄 À remplacer (actuellement placeholder)
```

---

## Séquence des appels API

### Chargement initial
```
[Montage PlanningView]
  → store.loadSoles()
    → GET /sole (retourne soles avec exploitation + boards)
  → Sélecteurs peuplés (exploitation, sole)

[Sélection d'une sole + année]
  → store.loadCulturePlan()
    → GET /rotations/plan/:soleId?year=YYYY
    → CulturePlanEntry[] stocké dans store.culturePlan
  → Grille calculée : sectionDisplayMap (occupied / available)
```

### Ouverture panneau section disponible
```
[Clic sur SectionCell "available"]
  → store.openSectionPanel(boardId, boardName, sectionNumber)
    → openSection = { boardId, boardName, sectionNumber, sectionPlanId: null }
  → SectionSidePanel monté → onMounted → store.loadPlantableVegetables()
    → POST /rotations/plan-section?boardId=X
    → openSection.sectionPlanId = response.sectionPlan.id_section_plan
    → GET /rotations/plantable-vegetables?sectionPlanId=N&sectionNumber=Y&startDate=&endDate=
    → plantableVegetables = réponse
    → vegetableGroups calculé (groupement + tri famille)
```

### Confirmation affectation
```
[Clic "Confirmer"]
  → store.submitAssignment(bypass = false)
    → POST /rotations/add-vegetable (DTO complet)
    → Si HTTP 200 OK:
        loadCulturePlan() → grille rechargée
        closeSectionPanel()
    → Si HTTP 400 (WARNING):
        lastRuleMessage = { type: 'warning', text: error.response.data.message }
        bypass button devient visible

[Clic "Forcer (bypass)"]
  → store.submitAssignment(bypass = true)
    → Même flux → planting enregistré malgré WARNING
```

---

## Complexity Tracking

Aucune violation de constitution détectée — section non applicable.
