# Feature Specification: Phase 4 — Moteur de Planification et Règles de Rotation

**Feature Branch**: `004-moteur-planification`
**Created**: 2026-04-19
**Status**: Draft
**Input**: PLAN.md — Phase 4 ; API rotation entièrement opérationnelle dans `culturo/api-culturo/src/rotations/`

---

## Résumé de l'existant

| Composant | État |
|-----------|------|
| Backend moteur de rotation | ✅ Complet — 6 endpoints opérationnels |
| Règle 1 — Rotation 5 ans | ✅ Implémentée dans `RotationService.canPlantVegetable` |
| Règle 2 — Cohabitation familles primaires | ✅ Implémentée |
| Suggestions de légumes compatibles | ✅ `GET /rotations/plantable-vegetables` |
| Sections disponibles | ✅ `GET /rotations/plantable-sections` |
| Plan de culture annuel | ✅ `GET /rotations/plan/:soleId` |
| Frontend `PlanningView.vue` | ❌ Placeholder uniquement |
| Interface de planification | ❌ À implémenter entièrement |

**Conséquence** : Cette phase est exclusivement frontend — brancher l'interface Vue.js 3 sur les endpoints existants, sans modification du backend.

---

## User Scenarios & Testing

### User Story 1 — Formateur visualise le plan de culture annuel d'une sole (Priority: P1)

Un formateur sélectionne une exploitation, une sole et une année pour voir l'ensemble des cultures planifiées : quelles planches, quelles sections, quels légumes, sur quelles périodes.

**Why this priority**: C'est la vue de base sans laquelle aucune autre action de planification n'est possible. Elle sert aussi de point d'entrée pour toutes les interactions suivantes.

**Independent Test**: Se connecter en tant que formateur → naviguer vers /plan → sélectionner une sole et l'année 2025 → vérifier que le tableau des planches et sections s'affiche avec les cultures existantes en base.

**Acceptance Scenarios**:

1. **Given** un formateur connecté sur `/plan`, **When** il sélectionne une exploitation, une sole et une année, **Then** le plan de culture s'affiche : liste des planches, leurs sections, le légume planté dans chacune, et les dates de début/fin.
2. **Given** le plan affiché, **When** une section n'a pas encore de légume affecté pour l'année, **Then** elle apparaît comme "disponible" avec une action visible pour initier une plantation.
3. **Given** le plan affiché, **When** le formateur change l'année, **Then** le plan se recharge automatiquement sans rechargement de page.
4. **Given** une sole sans plan de culture pour l'année sélectionnée, **When** le formateur consulte la vue, **Then** un message indique qu'aucune culture n'est planifiée et propose de commencer la planification.

---

### User Story 2 — Formateur affecte un légume à une section avec validation en temps réel (Priority: P1)

Le formateur clique sur une section disponible, choisit parmi les légumes compatibles suggérés (filtrés selon les règles de rotation), saisit les dates et confirme. L'application valide les règles agronomiques avant d'enregistrer.

**Why this priority**: C'est l'action principale du moteur de planification — sans elle la phase 4 n'a pas de valeur métier.

**Independent Test**: Depuis la vue plan → cliquer sur une section vide → vérifier que seuls les légumes compatibles sont proposés → sélectionner un légume → renseigner les dates → confirmer → vérifier que la section affiche le légume planté dans la vue principale.

**Acceptance Scenarios**:

1. **Given** une section disponible, **When** le formateur clique dessus, **Then** un panneau latéral s'ouvre listant uniquement les légumes compatibles avec l'historique de la planche (règles 1 et 2 respectées).
2. **Given** le panneau de sélection ouvert, **When** le formateur choisit un légume et saisit des dates valides, **Then** un résumé des règles respectées s'affiche avant confirmation ("✅ Aucune famille primaire active sur cette planche", "✅ Dernière rotation il y a 6 ans").
3. **Given** la confirmation soumise, **When** l'API retourne status `OK`, **Then** la section s'affiche immédiatement comme occupée dans le plan sans rechargement de page.
4. **Given** la confirmation soumise, **When** l'API retourne status `WARNING`, **Then** un message d'erreur explicatif s'affiche en langage clair (la raison de la règle, pas un code technique) et la plantation est annulée.
5. **Given** un formateur ou admin, **When** le WARNING s'affiche, **Then** un bouton "Forcer quand même (bypass)" est visible et permet de confirmer malgré l'avertissement.
6. **Given** un stagiaire connecté, **When** il consulte le plan, **Then** il ne voit pas le bouton de bypass ni les actions d'affectation.

---

### User Story 3 — Formateur consulte les suggestions pour une section (Priority: P2)

Avant de sélectionner manuellement un légume, le formateur peut voir, pour chaque section disponible, quelles familles et légumes sont recommandés (compatibles), lesquels sont déconseillés, et pourquoi.

**Why this priority**: Valeur pédagogique importante — le formateur comprend les raisons avant d'agir, pas seulement le résultat. Implémentable indépendamment de l'affectation.

**Independent Test**: Cliquer sur une section disponible → vérifier que la liste des légumes compatibles est groupée par famille, avec un indicateur visuel "jamais planté ici" ou "dernière plantation : [légume]".

**Acceptance Scenarios**:

1. **Given** le panneau de sélection d'une section, **When** il s'ouvre, **Then** les légumes sont groupés par famille botanique et triés : d'abord les familles jamais plantées sur cette planche, ensuite celles plantées il y a le plus longtemps.
2. **Given** un légume affiché dans les suggestions, **When** il a déjà été planté dans cette section, **Then** la date de dernière plantation et le légume précédent sont affichés sous son nom.
3. **Given** un légume affiché pour la première fois sur cette planche, **When** il est listé, **Then** un badge "Jamais planté ici" est visible.

---

### User Story 4 — Vérification manuelle d'une plantation possible (Priority: P2)

Le formateur peut tester manuellement si un légume spécifique peut être planté sur une planche donnée, sans procéder à l'affectation. L'API retourne `OK` ou `WARNING` avec la raison.

**Why this priority**: Utile pour la formation — permet d'apprendre les règles en testant des scénarios hypothétiques sans modifier les données.

**Independent Test**: Depuis le panneau section → choisir un légume non compatible → vérifier que la règle violée est affichée en français clair avant même de soumettre.

**Acceptance Scenarios**:

1. **Given** un légume sélectionné dans le panneau, **When** sa famille est primaire et déjà présente activement sur la planche, **Then** un message s'affiche immédiatement : "⚠️ Règle 2 : [Famille X] est actuellement active sur cette planche. Une seule famille primaire par planche."
2. **Given** un légume sélectionné, **When** sa famille a été plantée sur la planche dans les 5 dernières années, **Then** le message indique : "⚠️ Règle 1 : [Famille X] a été plantée sur cette planche en [année]. Rotation de 5 ans requise."
3. **Given** un légume compatible sélectionné, **When** aucune règle n'est violée, **Then** un message vert "✅ Compatible — aucune contrainte de rotation détectée" s'affiche.

---

### Edge Cases

- Que se passe-t-il si la sole sélectionnée n'a aucune planche ?
- Que se passe-t-il si les dates de début et de fin sont inversées ?
- Que se passe-t-il si le formateur tente d'affecter un légume sur une section déjà occupée (section active) ?
- Que se passe-t-il si l'API retourne une erreur 500 pendant la confirmation ?
- Que se passe-t-il si aucun légume compatible n'existe pour une section donnée ?

---

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT permettre de sélectionner une exploitation, une sole et une année pour afficher le plan de culture correspondant.
- **FR-002**: Le plan de culture DOIT afficher toutes les planches de la sole avec leurs sections, le légume affecté (ou "disponible") et les dates de plantation.
- **FR-003**: Le système DOIT afficher uniquement les légumes compatibles (filtré par les règles de rotation) lorsqu'un utilisateur initie une affectation sur une section.
- **FR-004**: Toute violation de règle de rotation DOIT être expliquée en français clair (règle numérotée + raison agronomique), jamais comme un code d'erreur technique.
- **FR-005**: L'affectation d'un légume DOIT mettre à jour la vue du plan immédiatement après confirmation, sans rechargement de page.
- **FR-006**: Le bouton de bypass DOIT être visible uniquement pour les rôles `admin` et `formateur`. Les `stagiaires` voient le plan en lecture seule.
- **FR-007**: Les légumes suggérés DOIVENT être groupés par famille botanique et triés par compatibilité (jamais planté en premier, plantation la plus ancienne ensuite).
- **FR-008**: La sélection de l'année DOIT proposer l'année en cours par défaut et permettre de naviguer dans les années passées et futures.
- **FR-009**: Le changement d'année ou de sole DOIT recharger le plan automatiquement.
- **FR-010**: Le système DOIT afficher un état de chargement pendant les appels API (squelette ou spinner).

### Key Entities

- **Plan de culture** : `soleId`, `année`, liste de planches avec leurs sections et légumes affectés.
- **Section disponible** : `sectionPlanId`, `boardId`, `boardName`, `sectionNumber`, `lastPlantedVegetable`, `neverPlanted`.
- **Légume compatible** : `vegetableId`, `vegetableName`, `familyName`, `importance`, `lastPlantedInSection`, `neverPlantedInSection`.
- **Affectation** : `boardId`, `sectionNumber`, `vegetableId`, `startDate`, `endDate`, `quantityPlanted`, `unity`, `varietyIdentifier`, `bypass`.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Un formateur peut visualiser le plan de culture complet d'une sole en moins de 3 secondes après sélection de l'année.
- **SC-002**: Un formateur peut affecter un légume à une section en moins de 5 étapes (clic section → sélection légume → dates → confirmation → résultat visible).
- **SC-003**: 100% des messages d'erreur de rotation sont affichés en langage naturel — zéro message technique visible par l'utilisateur.
- **SC-004**: La liste des légumes compatibles s'affiche en moins de 2 secondes après ouverture du panneau de sélection.
- **SC-005**: Les stagiaires ne peuvent déclencher aucune action d'écriture (affectation, bypass) — vérifiable sans connexion réseau (guard frontend).

---

## Assumptions

- Les endpoints de rotation backend sont stables et ne nécessitent aucune modification dans cette phase.
- Le catalogue de légumes et de familles botaniques est déjà rempli en base via `inserts.sql` (Phase 2).
- Les planches et sections sont déjà configurées pour au moins une exploitation de test (Phase 3).
- La saisie des dates de plantation utilise un format `YYYY-MM-DD` standard — aucun calendrier complexe requis pour cette phase.
- La variété (`varietyIdentifier`) peut être saisie comme chaîne libre — elle sera créée automatiquement par l'API si elle n'existe pas encore.
- La consultation du plan (`GET /rotations/plan/:soleId`) requiert un `soleId` — l'utilisateur doit d'abord sélectionner une exploitation puis une sole.
- Le champ `quantityPlanted` et `unity` sont optionnels dans l'interface (valeurs par défaut : 0 et "unité").
