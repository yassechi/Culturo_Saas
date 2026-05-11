# Application de Planification Maraîchère
## Document de Projet — Plan de Développement Spec-Driven

---

## Résumé Exécutif

Ce projet consiste à développer une **application web de planification de culture** destinée à un maraîcher et son équipe (formateur + stagiaires). L'application permet de gérer la disposition des cultures sur des planches divisées en sections, tout en respectant automatiquement les règles agronomiques de rotation et d'association des familles botaniques.

### Concept clé : la structure du sol

```
Sol
└── Planches (N planches)
    └── Sections (3 sections par planche)
        └── Culture plantée (famille botanique + légume)
```

### Règles métier fondamentales

| Règle | Description |
|---|---|
| **Règle 1 — Cohabitation** | Deux familles primaires ne peuvent pas être plantées dans la même planche la même année |
| **Règle 2 — Rotation 5 ans** | Une famille primaire ne peut pas occuper une planche si une autre famille primaire y a été présente dans les 5 dernières années |
| **Règle 3 — Jachère** | Une planche peut être mise en jachère ou recevoir un engrais vert entre deux cultures |
| **Règle 4 — Associations** | Certaines familles sont bénéfiques ensemble (ex. Alliacées + Carottes), d'autres sont incompatibles |
| **Règle 5 — Saisonnalité** | Chaque légume a une fenêtre de plantation et de récolte définie (printemps, été, automne, hiver) |

### Rôles utilisateurs

| Rôle | Droits |
|---|---|
| **Admin** | Accès complet : configuration du sol, des planches, des cultures, des utilisateurs |
| **Formateur** | Planification, validation des rotations, consultation de l'historique |
| **Stagiaire** | Consultation du plan de culture, saisie des observations terrain |

### Stack technique

- **Backend :** Node.js (Express ou Fastify)
- **Frontend :** Vue.js 3 (Composition API + Pinia)
- **Base de données :** PostgreSQL
- **Auth :** JWT avec gestion des rôles
- **Déploiement :** Docker

---

## Phases de Développement

---

### Phase 1 — Fondation & Architecture

**Objectif :** Mettre en place le squelette technique complet de l'application — backend, frontend, base de données et authentification.

**Périmètre :**

- Initialisation du projet Node.js (Express) + Vue.js 3
- Modélisation de la base de données PostgreSQL :
  - Tables : `users`, `roles`, `sols`, `planches`, `sections`, `familles`, `legumes`, `cultures`, `saisons`
- Système d'authentification JWT avec gestion des rôles (admin / formateur / stagiaire)
- Middleware de protection des routes par rôle
- Structure des dossiers back et front (clean architecture)
- Environnements de développement et de production (Docker Compose)
- Pipeline CI/CD de base

**Critères d'acceptation :**
- L'application démarre sans erreur en développement
- Un utilisateur peut se connecter et recevoir un token JWT
- Les routes sont protégées selon le rôle
- La base de données est initialisée avec les tables de base

---

### Phase 2 — Référentiel Botanique

**Objectif :** Construire et gérer le catalogue des familles botaniques et des légumes avec toutes leurs caractéristiques agronomiques.

**Périmètre :**

- CRUD complet des **familles botaniques** (ex. Solanacées, Cucurbitacées, Alliacées, Brassicacées, Légumineuses, Apiacées, Chénopodiacées…)
- Classification en **familles primaires** (soumises aux règles de rotation strictes) et **familles secondaires**
- CRUD complet des **légumes** avec :
  - Famille d'appartenance
  - Fenêtres de plantation par saison (printemps / été / automne / hiver)
  - Durée de culture (en semaines)
  - Besoins en azote (faible / moyen / fort) — pour planifier les engrais verts
  - Compatibilités et incompatibilités avec d'autres familles
- Table des **associations bénéfiques** (ex. Tomate + Basilic, Carotte + Poireau)
- Table des **associations déconseillées** (ex. Oignon + Haricot)
- Interface d'administration pour gérer le référentiel
- Pré-remplissage avec les familles et légumes courants du maraîchage

**Critères d'acceptation :**
- L'admin peut ajouter, modifier et supprimer des familles et des légumes
- Les associations (bénéfiques et déconseillées) sont enregistrées et consultables
- Le référentiel est pré-rempli avec les données de base du maraîchage

---

### Phase 3 — Gestion du Sol et des Planches

**Objectif :** Permettre à l'admin de configurer la structure physique du sol : planches et sections.

**Périmètre :**

- CRUD des **sols** (possibilité de gérer plusieurs parcelles)
- CRUD des **planches** au sein d'un sol :
  - Numéro / nom de la planche
  - Superficie (optionnel)
  - Statut : active / en jachère / hors service
- Chaque planche est automatiquement divisée en **3 sections**
- Vue cartographique simplifiée du sol (représentation visuelle des planches)
- Historique des cultures par planche (5 dernières années)
- Gestion des **engrais verts** : type, durée, famille botanique associée

**Critères d'acceptation :**
- L'admin peut créer un sol avec N planches
- Chaque planche affiche ses 3 sections
- L'historique des 5 dernières années est consultable par planche
- Le statut jachère / active est modifiable manuellement

---

### Phase 4 — Moteur de Planification et Règles de Rotation

**Objectif :** Implémenter le cœur métier de l'application — le moteur qui valide et suggère les cultures en respectant toutes les règles agronomiques.

**Périmètre :**

- **Moteur de règles** centralisé :
  - Règle 1 : interdiction de deux familles primaires sur la même planche la même année
  - Règle 2 : rotation obligatoire sur 5 ans (aucune famille primaire ne peut revenir si une autre y était dans les 5 dernières années)
  - Règle 3 : détection des conflits d'associations déconseillées dans une même planche
  - Règle 4 : validation des saisons de plantation (alerte si hors fenêtre)
  - Règle 5 : suggestion automatique d'engrais vert après une culture à fort besoin en azote
  - Règle 6 : mise en jachère recommandée après N années de culture intensive
- Interface de **planification annuelle** :
  - Sélection de l'année
  - Attribution d'un légume à chaque section de chaque planche
  - Validation en temps réel avec affichage des erreurs et avertissements
- **Système de suggestions** : pour une planche donnée, proposer les familles compatibles selon l'historique
- Visualisation du plan de culture complet pour une année donnée
- Comparaison possible entre deux scénarios de rotation

**Critères d'acceptation :**
- Le moteur bloque toute affectation violant les règles 1 et 2
- Les avertissements (associations, saisons, azote) sont affichés sans bloquer
- Les suggestions de cultures compatibles sont pertinentes et expliquées
- Le plan de l'année est enregistré et consultable

---

### Phase 5 — Historique, Observations et Traçabilité

**Objectif :** Permettre le suivi terrain et construire la mémoire agronomique du sol sur le long terme.

**Périmètre :**

- **Journal de culture** par section :
  - Date de plantation réelle
  - Date de récolte réelle
  - Rendement (optionnel)
  - Notes libres
- Saisie des **observations terrain** par les stagiaires :
  - Maladies / ravageurs observés
  - Conditions météo notables
  - État de la plante (échelle simple : bon / moyen / mauvais)
- **Historique complet** par planche : toutes les cultures des années passées avec leur statut
- Export de l'historique en **PDF** ou **CSV**
- **Tableau de bord** récapitulatif :
  - Taux d'occupation des planches
  - Alertes de rotation à venir (année suivante)
  - Synthèse des observations terrain

**Critères d'acceptation :**
- Les stagiaires peuvent saisir des observations depuis leur interface
- L'historique est accessible et filtrable par planche, année, famille
- L'export PDF/CSV fonctionne correctement
- Le tableau de bord affiche les alertes de rotation pour l'année suivante

---

### Phase 6 — Interface Pédagogique et Gestion des Utilisateurs

**Objectif :** Adapter l'application au contexte formation — gestion des stagiaires, vue pédagogique des règles, et tableau de bord formateur.

**Périmètre :**

- **Gestion des utilisateurs** (admin) :
  - Création / modification / désactivation de comptes
  - Attribution des rôles (admin / formateur / stagiaire)
  - Organisation par groupes / promotions de stagiaires
- **Tableau de bord formateur** :
  - Vue d'ensemble de l'activité des stagiaires
  - Validation des saisies terrain
  - Suivi pédagogique par stagiaire
- **Mode explicatif** pour les stagiaires :
  - Affichage des règles de rotation avec explications visuelles
  - Pourquoi telle culture est-elle interdite ici ? (explication en langage naturel)
  - Fiche récapitulative de chaque famille botanique
  - Quiz de révision sur les règles de rotation (optionnel)
- Notifications in-app (rappels de plantation, alertes de rotation, validations du formateur)

**Critères d'acceptation :**
- L'admin peut gérer tous les utilisateurs et leurs rôles
- Le formateur voit l'activité de ses stagiaires et peut valider leurs saisies
- Le mode explicatif affiche la raison des blocages en langage clair
- Les notifications fonctionnent pour les rappels de saison et les alertes

---

## Récapitulatif des Contraintes Agronomiques

| Contrainte | Phase |
|---|---|
| Rotation familles primaires — même planche, même année | 4 |
| Rotation sur 5 ans | 4 |
| Associations bénéfiques | 2 & 4 |
| Associations déconseillées | 2 & 4 |
| Saisonnalité des plantations | 2 & 4 |
| Engrais verts / jachère | 3 & 4 |
| Besoins en azote | 2 & 4 |
| Jachère recommandée après culture intensive | 4 |
| Observations terrain / maladies / ravageurs | 5 |
| Alertes rotation année suivante | 5 |
| Explications pédagogiques des règles | 6 |

---

## Référence des Commandes Spec Kit

| Commande | Rôle |
|---|---|
| `/speckit-constitution` | Définir les principes du projet et les standards de code |
| `/speckit-specify` | Décrire ce qu'une phase doit faire (exigences fonctionnelles) |
| `/speckit-clarify` | Poser des questions structurées pour lever les ambiguïtés |
| `/speckit-plan` | Définir l'architecture technique et le stack pour la phase |
| `/speckit-tasks` | Décomposer le plan en tâches d'implémentation ordonnées |
| `/speckit-implement` | Exécuter toutes les tâches et générer le code |

---

## Pour Commencer

1. Ouvrir **Claude Code** dans le dossier du projet
2. Lancer `/speckit-constitution` en précisant :
   - Stack : Node.js + Vue.js 3 + PostgreSQL + Docker
   - Rôles : admin / formateur / stagiaire
   - Le moteur de règles est le cœur du projet — il doit être centralisé, testable et indépendant
   - Le code doit être lisible et pédagogique (contexte formation agricole)
3. Démarrer la **Phase 1** avec `/speckit-specify`
4. Compléter toutes les étapes Spec Kit avant d'écrire du code
5. Répéter pour chaque phase suivante

---

*Généré pour le projet de planification maraîchère — Développement Spec-Driven avec GitHub Spec Kit*

---

## État d'avancement — Audit du 2026-05-11

### Phases terminées ✅

| Phase | Statut |
|---|---|
| Phase 1 — Fondation & Architecture | ✅ Complet |
| Phase 2 — Référentiel Botanique | ✅ Complet |
| Phase 3 — Gestion du Sol et des Planches | ✅ Complet |

### Phase 4 — Moteur de Planification (≈ 60%) 🔶

**Fait :**
- Règle 1 (rotation 5 ans) et Règle 2 (cohabitation familles primaires) implémentées dans `rotation.service.ts`
- Endpoints : `GET /rotations/plan/:soleId`, `POST /rotations/can`, `GET /rotations/plantable-sections`, `GET /rotations/plantable-vegetables`, `POST /rotations/add-vegetable`
- `PlanningView` avec grille calendrier fenêtre glissante 3 mois
- `SectionSidePanel` (affectation légume/section) et `VegetableSearchPanel` (recherche inverse)

**À faire :**
- [ ] **Règle 3** — Détection des associations déconseillées dans une même planche
- [ ] **Règle 4** — Alerte si plantation hors fenêtre saisonnière du légume
- [ ] **Règle 5** — Suggestion d'engrais vert après culture à fort besoin en azote
- [ ] **Règle 6** — Recommandation de jachère après N années d'occupation intensive
- [ ] `CulturePlanView` — Vue lecture seule simplifiée pour le rôle stagiaire (actuellement `FeaturePlaceholder`)

### Phase 5 — Historique, Observations et Traçabilité (≈ 40%) 🔶

**Fait :**
- `HistoryView` — historique multi-années avec filtres exploitation/sole/planche et alertes de rotation
- Store `history.ts` avec calcul d'alertes côté client

**À faire :**
- [ ] Entité et endpoint **Observations terrain** côté backend (aucun endpoint dédié ; les entités `Watering`/`Treatment` ne couvrent pas les notes libres stagiaires)
- [ ] `ObservationsView` — Saisie terrain pour les stagiaires (maladies, ravageurs, notes, état plante) — actuellement `FeaturePlaceholder`
- [ ] Export **PDF / CSV** de l'historique
- [ ] `DashboardView` — Enrichir avec stats réelles (taux d'occupation, alertes rotation année suivante)
- [ ] Module `StatisticsModule` backend — entièrement vide, aucun service ni contrôleur

### Phase 6 — Interface Pédagogique et Gestion des Utilisateurs (≈ 30%) 🔶

**Fait :**
- `AdminUsersView` — CRUD complet des utilisateurs avec gestion des rôles

**À faire :**
- [ ] `TrainerDashboardView` — Vue synthétique formateur (activité stagiaires, validations en attente) — actuellement `FeaturePlaceholder`
- [ ] `ValidationView` — Interface de validation des saisies terrain par le formateur — actuellement `FeaturePlaceholder`
- [ ] Mode explicatif pédagogique : afficher en langage naturel pourquoi une culture est bloquée
- [ ] Notifications in-app (rappels plantation, alertes rotation, validations formateur)
- [ ] Gestion des groupes / promotions de stagiaires