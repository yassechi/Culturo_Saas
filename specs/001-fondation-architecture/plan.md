# Implementation Plan: Phase 1 — Fondation & Architecture

**Branch**: `001-fondation-architecture` | **Date**: 2026-04-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-fondation-architecture/spec.md`

---

## Summary

Compléter la fondation full-stack de l'application Culturo. Le backend NestJS est fonctionnel mais utilise des credentials hardcodés et Node 20 (au lieu de 22). Le frontend Vue.js 3 est à initialiser depuis zéro. Le livrable principal est un environnement reproductible via `docker compose up` avec authentification JWT fonctionnelle end-to-end et navigation protégée par rôle.

---

## Technical Context

**Language/Version**: TypeScript 5.7 (backend) / TypeScript 5.x via Vite (frontend) — Node.js 22 LTS
**Primary Dependencies**:
- Backend (existant): NestJS 11, TypeORM, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/swagger`, `@nestjs/config`
- Frontend (à créer): Vue.js 3, Pinia, Vue Router 4, Axios, Vite
**Storage**: PostgreSQL 15 (TypeORM, `synchronize: true` en dev)
**Testing**: Jest + Supertest (backend, existant) / Vitest (frontend, à configurer)
**Target Platform**: Web — navigateur moderne (Chrome, Firefox, Edge)
**Project Type**: Web application full-stack (SPA + REST API)
**Performance Goals**: Démarrage Docker < 5 min, navigation < 30s pour l'utilisateur, guard rôle < 200ms
**Constraints**: Environnement 100% Docker reproducible, zéro config manuelle post-clone
**Scale/Scope**: Équipe de formation (< 50 utilisateurs), usage mono-exploitation en v1

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Vérification | Statut |
|----------|-------------|--------|
| **I. Moteur de Règles Centralisé** | Cette phase ne touche pas au moteur de règles agronomiques. Le module `rotations/` existant est préservé sans modification. | ✅ Non concerné |
| **II. Contrôle d'Accès par Rôle** | Guards Vue Router centralisés + middleware NestJS par rôle. Chaque route déclare ses rôles autorisés. Erreurs 401/403 distinctes. | ✅ Conforme |
| **III. API-First Design** | Swagger existant préservé. Contrats auth documentés dans `contracts/auth-api.md`. Frontend est consommateur pur via Axios. Aucune logique métier côté frontend. | ✅ Conforme |
| **IV. Test-First** | Store `useAuthStore` testé avec Vitest avant implémentation. Tests backend existants préservés. | ✅ Conforme (scope limité Phase 1) |
| **V. Clarté Pédagogique** | Messages d'erreur explicatifs (pourquoi le login échoue, pourquoi l'accès est refusé). Commentaires sur les guards et intercepteurs. | ✅ Conforme |
| **Stack locked** | NestJS + TypeScript + Vue 3 + Pinia + PostgreSQL + TypeORM + JWT + Docker. Aucun ajout hors stack. | ✅ Conforme |

**Post-design re-check**: ✅ Tous les gates passent. Aucune violation à justifier.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-fondation-architecture/
├── plan.md              ← ce fichier
├── spec.md              ← spécification fonctionnelle
├── research.md          ← décisions techniques résolues
├── data-model.md        ← modèle de données frontend + env vars
├── quickstart.md        ← guide de démarrage validé
├── contracts/
│   └── auth-api.md      ← contrats API d'authentification
├── checklists/
│   └── requirements.md  ← checklist qualité spec
└── tasks.md             ← à générer avec /speckit-tasks
```

### Source Code

```text
planculture/
├── docker-compose.yml                   ← À CRÉER
│
├── api-culturo/                         ← EXISTANT — modifications ciblées
│   ├── .env.example                     ← À CRÉER (template credentials)
│   ├── .env                             ← À CRÉER (local, gitignored)
│   ├── Dockerfile                       ← MODIFIER (node:20 → node:22-alpine)
│   ├── src/
│   │   └── data-source.ts               ← MODIFIER (externaliser credentials vers .env)
│   └── (reste inchangé)
│
└── front-culturo/                       ← VIDE — à scaffolder entièrement
    ├── Dockerfile                       ← À CRÉER
    ├── .env.example                     ← À CRÉER
    ├── .env                             ← À CRÉER (local, gitignored)
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── package.json
    └── src/
        ├── main.ts                      ← Point d'entrée Vue + Pinia + Router
        ├── App.vue
        ├── api/
        │   └── client.ts                ← Instance Axios + intercepteurs
        ├── stores/
        │   └── auth.ts                  ← useAuthStore (Pinia)
        ├── router/
        │   └── index.ts                 ← Routes + navigation guards
        ├── layouts/
        │   ├── MainLayout.vue           ← Avec nav sidebar (post-login)
        │   └── AuthLayout.vue           ← Sans nav (login)
        └── views/
            ├── LoginView.vue
            ├── DashboardView.vue        ← Placeholder par rôle
            └── ForbiddenView.vue        ← Page 403
```

**Structure Decision**: Web application full-stack. Backend dans `api-culturo/`, frontend dans `front-culturo/`. Docker Compose à la racine de `planculture/` orchestre les deux.

---

## Phase 0: Research

✅ Complété — voir [research.md](research.md)

Décisions clés résolues :
- Node 22 LTS (alignement Dockerfile + package.json)
- Credentials DB via `.env` + `@nestjs/config`
- Vue 3 + Vite + Pinia + Vue Router 4 + Axios pour le frontend
- Docker Compose avec healthcheck DB pour éviter la race condition
- Token JWT dans `localStorage`, injecté via intercepteur Axios
- Navigation guard centralisé dans `router/index.ts`
- Vitest pour les tests frontend (store `useAuthStore`)

---

## Phase 1: Design & Contracts

✅ Complété

Artifacts générés :
- [data-model.md](data-model.md) — Store Pinia, modèle de route, service HTTP, variables d'env
- [contracts/auth-api.md](contracts/auth-api.md) — Contrats POST /users/login, /users/current, /users/register
- [quickstart.md](quickstart.md) — Guide de démarrage et validation

---

## Complexity Tracking

> Aucune violation de la constitution — section vide.
