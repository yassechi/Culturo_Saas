# Feature Specification: Phase 1 — Fondation & Architecture

**Feature Branch**: `001-fondation-architecture`
**Created**: 2026-04-19
**Status**: Draft
**Input**: PLAN.md — Phase 1, contexte : API NestJS existante dans `planculture/api-culturo/`, frontend Vue.js 3 à initialiser dans `planculture/front-culturo/`

---

## Résumé de l'existant

| Composant | État |
|-----------|------|
| Backend NestJS (`api-culturo`) | ✅ Initialisé — modules users, rotations, vegetables, boards, exploitations, amendments, harvests présents |
| Base de données PostgreSQL | ✅ Schema défini (`schema.sql`), TypeORM configuré |
| Authentification JWT | ✅ `@nestjs/jwt` + `@nestjs/passport` installés, module users existant |
| Swagger | ✅ `@nestjs/swagger` installé |
| Dockerfile backend | ✅ Présent dans `api-culturo/` |
| Frontend Vue.js 3 (`front-culturo`) | ❌ Dossier vide — à initialiser |
| Docker Compose full-stack | ❌ À créer (backend + frontend + PostgreSQL) |
| Pipeline CI/CD | ❌ À définir |
| Connexion frontend → API | ❌ À implémenter |

**Conséquence** : Cette phase se concentre sur ce qui manque — scaffolding frontend, Docker Compose full-stack, et intégration de la couche d'authentification côté frontend. Le backend est considéré comme déjà fonctionnel sur ses fondations.

---

## User Scenarios & Testing

### User Story 1 — Développeur démarre l'environnement complet en une commande (Priority: P1)

Un développeur qui clone le projet peut lancer l'intégralité de l'environnement (backend, frontend, base de données) avec une seule commande sans configuration manuelle.

**Why this priority**: Bloque toutes les autres phases — sans environnement reproductible, aucun développement parallèle n'est possible.

**Independent Test**: Exécuter `docker compose up` depuis la racine du projet et vérifier que les trois services (API, frontend, PostgreSQL) démarrent sans erreur.

**Acceptance Scenarios**:

1. **Given** un poste avec Docker installé et le repo cloné, **When** le développeur exécute `docker compose up`, **Then** l'API répond sur son port, le frontend est accessible sur son port, et la base de données est prête avec le schéma initialisé.
2. **Given** l'environnement en cours d'exécution, **When** le développeur accède à Swagger, **Then** la documentation API est accessible et liste tous les endpoints disponibles.
3. **Given** l'environnement stoppé, **When** le développeur relance `docker compose up`, **Then** les données persistées en base sont conservées (volume Docker).

---

### User Story 2 — Utilisateur se connecte et reçoit un accès selon son rôle (Priority: P1)

Un utilisateur (admin, formateur ou stagiaire) saisit ses identifiants dans l'interface frontend et accède aux fonctionnalités correspondant à son rôle.

**Why this priority**: Le contrôle d'accès est un prérequis de toutes les fonctionnalités métier — aucune phase suivante ne peut être testée sans authentification fonctionnelle.

**Independent Test**: Depuis le frontend, tenter une connexion avec trois comptes de rôles différents et vérifier que chaque rôle accède uniquement à ses fonctionnalités autorisées.

**Acceptance Scenarios**:

1. **Given** un utilisateur avec des identifiants valides, **When** il soumet le formulaire de connexion, **Then** il est redirigé vers son tableau de bord avec son rôle affiché.
2. **Given** un utilisateur connecté en tant que stagiaire, **When** il tente d'accéder à une page réservée admin, **Then** il est redirigé vers une page "accès refusé" sans erreur serveur.
3. **Given** un utilisateur connecté, **When** son token expire, **Then** il est redirigé vers la page de connexion avec un message explicatif.
4. **Given** des identifiants incorrects, **When** l'utilisateur soumet le formulaire, **Then** un message d'erreur clair s'affiche (sans révéler si c'est l'email ou le mot de passe qui est incorrect).

---

### User Story 3 — Développeur voit la structure de navigation du frontend (Priority: P2)

Le frontend scaffoldé expose une structure de navigation cohérente avec les trois rôles, même si les pages sont vides (placeholders).

**Why this priority**: Permet aux phases suivantes de brancher leurs composants sur une structure existante sans restructurer le projet.

**Independent Test**: Naviguer manuellement dans l'application frontend connecté en tant que chaque rôle et vérifier que les menus et routes correspondent aux permissions de ce rôle.

**Acceptance Scenarios**:

1. **Given** un utilisateur admin connecté, **When** il consulte le menu de navigation, **Then** il voit les entrées : Utilisateurs, Référentiel botanique, Sol & Planches, Planification, Historique, Configuration.
2. **Given** un utilisateur formateur connecté, **When** il consulte le menu, **Then** il voit : Planification, Validation, Historique, Tableau de bord formateur.
3. **Given** un utilisateur stagiaire connecté, **When** il consulte le menu, **Then** il voit uniquement : Plan de culture, Mes observations.

---

### Edge Cases

- Que se passe-t-il si PostgreSQL n'est pas encore prêt quand le backend démarre (race condition Docker) ?
- Comment l'application gère-t-elle un token JWT malformé ou altéré ?
- Que se passe-t-il si le frontend tente un appel API hors connexion réseau ?

---

## Requirements

### Functional Requirements

- **FR-001**: Le projet DOIT pouvoir démarrer en mode développement complet via `docker compose up` depuis la racine, sans étapes manuelles supplémentaires.
- **FR-002**: Le backend DOIT exposer les variables d'environnement requises (DATABASE_URL, JWT_SECRET, PORT) via un fichier `.env.example` documenté.
- **FR-003**: Le frontend DOIT être initialisé dans `planculture/front-culturo/` avec Vue.js 3 (Composition API) et Pinia comme gestionnaire d'état.
- **FR-004**: Le frontend DOIT inclure Vue Router configuré avec des routes protégées par rôle (guard de navigation).
- **FR-005**: Le frontend DOIT inclure un client HTTP centralisé (axios ou fetch wrapper) configuré pour envoyer le token JWT sur chaque requête.
- **FR-006**: Le frontend DOIT implémenter les écrans : page de connexion, tableau de bord (placeholder par rôle), page 403/accès refusé.
- **FR-007**: Le système DOIT rediriger vers la page de connexion si le token est absent ou expiré.
- **FR-008**: L'API DOIT retourner un code HTTP 401 pour les requêtes non authentifiées et 403 pour les accès non autorisés par rôle.
- **FR-009**: Le Docker Compose DOIT inclure les services : `api` (NestJS), `front` (Vue.js), `db` (PostgreSQL) avec health checks.
- **FR-010**: Le Docker Compose DOIT initialiser la base de données avec `schema.sql` au premier démarrage.

### Key Entities

- **Session utilisateur**: Token JWT, rôle associé, identité (id, email, nom) — stocké côté client (localStorage ou cookie httpOnly).
- **Route protégée**: Chemin frontend, rôle(s) requis, composant associé.
- **Service HTTP**: Base URL de l'API, intercepteurs de token, gestionnaire d'erreurs globales.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Un développeur peut passer de "repo cloné" à "application fonctionnelle" en moins de 5 minutes avec une seule commande.
- **SC-002**: Un utilisateur peut se connecter, voir son tableau de bord et naviguer dans les sections autorisées en moins de 30 secondes.
- **SC-003**: Toute tentative d'accès non autorisé est bloquée et redirigée en moins de 200ms côté frontend (guard) sans appel API superflu.
- **SC-004**: L'environnement de développement est identique pour tous les membres de l'équipe — zéro configuration locale spécifique au poste.

---

## Assumptions

- Le backend NestJS existant est fonctionnel et les endpoints d'authentification (`POST /users/login`, `POST /users/register`, `POST /users/current`) sont opérationnels.
- Le schéma PostgreSQL (`schema.sql`) et les données de base (rôles, utilisateurs de test) sont fournis dans le fichier `insert.sql` existant.
- Le frontend sera servi par un serveur de développement (Vite) en mode dev et buildé en conteneur Docker pour la production.
- La gestion du rafraîchissement automatique du token (refresh token) est hors périmètre de cette phase — uniquement le token d'accès initial.
- Les pages métier (référentiel botanique, planification, etc.) sont des placeholders dans cette phase — leur contenu est implémenté dans les phases suivantes.
