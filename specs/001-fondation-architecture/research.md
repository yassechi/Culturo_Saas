# Research: Phase 1 — Fondation & Architecture

**Date**: 2026-04-19
**Branch**: `001-fondation-architecture`

---

## 1. Node.js Version Alignment

**Decision**: Utiliser Node.js 22 LTS partout (Dockerfile + Docker Compose + documentation).

**Rationale**: Le `package.json` déclare `engines: node 22.20.0`. Le Dockerfile actuel utilise `node:20` — incohérence à corriger. Node 22 est la LTS active et correspond à ce qui est utilisé en dev.

**Action**: Mettre à jour le Dockerfile avec `FROM node:22-alpine`.

---

## 2. Credentials DB en dur dans data-source.ts

**Decision**: Externaliser toutes les credentials dans des variables d'environnement via un fichier `.env`.

**Rationale**: `data-source.ts` contient `username: 'postgres'`, `password: 'root'`, `database: 'culturo'` en dur. Ce pattern bloque l'environnement Docker (le host DB change en conteneur) et expose les secrets en clair dans le repo.

**Pattern choisi**: `.env` + `@nestjs/config` (déjà installé) avec `.env.example` documenté.

**Variables requises**:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=culturo
JWT_SECRET=change-me-in-production
PORT=3000
```

---

## 3. Stack Frontend

**Decision**: Vue.js 3 + Vite + Pinia + Vue Router 4 + Axios.

**Rationale**:
- Vite : build tool standard pour Vue 3, hot-reload rapide, compatible Docker.
- Pinia : gestionnaire d'état officiel Vue 3 (remplace Vuex). Utilisé pour le store d'authentification.
- Vue Router 4 : routing avec navigation guards pour la protection par rôle.
- Axios : client HTTP avec intercepteurs (injection automatique du token JWT, gestion d'erreurs globale).

**Alternatives rejetées**:
- Nuxt.js : SSR non nécessaire pour cette application (auth JWT + SPA suffit).
- Fetch API natif : moins pratique pour les intercepteurs d'authentification.

**Structure frontend** (`planculture/front-culturo/`):
```
src/
├── api/          # axios instance + appels par domaine
├── stores/       # Pinia stores (auth, etc.)
├── router/       # Vue Router + guards
├── views/        # pages (Login, Dashboard, 403)
├── components/   # composants réutilisables
├── layouts/      # MainLayout (avec nav), AuthLayout (sans nav)
└── assets/
```

---

## 4. Docker Compose Full-Stack

**Decision**: `docker-compose.yml` à la racine de `planculture/` avec trois services.

**Rationale**: Un seul fichier compose pour démarrer tout l'environnement. La DB utilise `healthcheck` pour que l'API attende qu'elle soit prête (évite la race condition identifiée dans les edge cases).

**Services**:
| Service | Image | Port | Dépend de |
|---------|-------|------|-----------|
| `db` | postgres:15-alpine | 5432 | — |
| `api` | build ./api-culturo | 3000 | db (healthy) |
| `front` | build ./front-culturo | 5173 | api |

**Volumes**: `postgres_data` persistant pour les données DB.

**Init DB**: Le service `db` monte `./api-culturo/schema.sql` et `./api-culturo/DB/insert.sql` dans `/docker-entrypoint-initdb.d/` — PostgreSQL les exécute automatiquement au premier démarrage.

---

## 5. Stratégie d'Authentification Frontend

**Decision**: Token JWT stocké dans `localStorage`, transmis via header `Authorization: Bearer <token>`.

**Rationale**: Approche standard pour une SPA Vue.js. CORS est déjà configuré côté NestJS (`cors: true`). Le token est injecté automatiquement via un intercepteur Axios sur chaque requête.

**Flux**:
1. `POST /users/login` → réponse contient `{ token, user: { id, email, role } }`
2. Store Pinia `useAuthStore` persiste `{ token, user }` dans `localStorage`
3. Axios intercepteur lit le store et injecte le header
4. Vue Router guard lit le store et redirige si non authentifié ou rôle insuffisant
5. Erreur 401 → l'intercepteur Axios efface le store et redirige vers `/login`

**Alternatives rejetées**:
- Cookie httpOnly : plus sécurisé contre XSS mais complique la configuration CORS et l'accès depuis Axios sans configuration serveur supplémentaire.
- Session serveur : incompatible avec l'architecture JWT stateless actuelle.

---

## 6. Navigation Guards par Rôle

**Decision**: Guard centralisé dans `router/index.ts` qui lit le store Pinia.

**Pattern**:
```typescript
// Méta de route
{ path: '/admin/users', meta: { requiresAuth: true, roles: ['admin'] }, ... }

// Guard global
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) return next('/login')
  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) return next('/403')
  next()
})
```

**Rationale**: Centralise la logique d'autorisation — aucune page ne gère son propre accès.

---

## 7. Tests Frontend

**Decision**: Vitest pour les tests unitaires (stores, utils), Cypress pour les tests e2e (optionnel Phase 1).

**Rationale**: Vitest est le standard pour Vue 3 + Vite. Configuration minimale, compatible avec le même ecosystem que le backend Jest.

**Phase 1 scope**: Tests unitaires du store `useAuthStore` uniquement — les tests e2e viennent avec les features métier.
