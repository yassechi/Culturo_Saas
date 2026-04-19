# Data Model: Phase 1 — Fondation & Architecture

**Date**: 2026-04-19
**Branch**: `001-fondation-architecture`

---

## Entités Backend (existantes — pour référence)

Ces entités sont déjà définies dans `planculture/api-culturo/src/entities/`. Aucune modification requise pour cette phase.

| Entité | Fichier | Rôle |
|--------|---------|------|
| `User_` | `user_.entity.ts` | Compte utilisateur (email, password hash, role) |
| `Role` | `role.entity.ts` | Rôle applicatif (admin, formateur, stagiaire) |
| `Family` | `family.entity.ts` | Famille botanique |
| `Vegetable` | `vegetable.entity.ts` | Légume avec ses caractéristiques |
| `Board` | `board.entity.ts` | Planche de culture |
| `Sole` | `sole.entity.ts` | Sol / parcelle |
| `Section` | `section.entity.ts` | Section d'une planche |
| `SectionPlan` | `section_plan.entity.ts` | Plan de section pour une année |
| `Exploitation` | `exploitation.entity.ts` | Exploitation agricole |
| `Harvest`, `Watering`, `Amendement`, etc. | (divers) | Données de suivi terrain |

---

## Modèle de Données Frontend (Phase 1 — nouveau)

### Store Pinia : `useAuthStore`

Fichier : `planculture/front-culturo/src/stores/auth.ts`

```typescript
interface AuthUser {
  id: number
  email: string
  role: 'admin' | 'formateur' | 'stagiaire'
  firstName?: string
  lastName?: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
}
```

**Persistance** : `localStorage` clés `culturo_token` et `culturo_user`.

**Actions**:
- `login(credentials)` → POST /users/login → stocke token + user
- `logout()` → efface store + localStorage + redirige vers /login
- `loadFromStorage()` → restaure l'état au chargement de l'app
- `fetchCurrentUser()` → POST /users/current → rafraîchit les données user

**Getters**:
- `isAuthenticated` : boolean
- `isAdmin` : boolean
- `isFormateur` : boolean
- `isStagiaire` : boolean

---

### Modèle de Route Protégée

Chaque route Vue Router expose des méta-données :

```typescript
interface RouteMeta {
  requiresAuth: boolean       // true = authentification requise
  roles?: string[]            // ['admin'] | ['admin', 'formateur'] | undefined (tous rôles)
  layout?: 'main' | 'auth'   // layout à utiliser
}
```

**Exemples**:
```typescript
{ path: '/login',          meta: { requiresAuth: false, layout: 'auth' } }
{ path: '/dashboard',      meta: { requiresAuth: true,  roles: undefined } }        // tous rôles
{ path: '/admin/users',    meta: { requiresAuth: true,  roles: ['admin'] } }
{ path: '/plan',           meta: { requiresAuth: true,  roles: ['admin', 'formateur'] } }
{ path: '/observations',   meta: { requiresAuth: true,  roles: ['stagiaire'] } }
{ path: '/403',            meta: { requiresAuth: false } }
```

---

### Service HTTP : `apiClient`

Fichier : `planculture/front-culturo/src/api/client.ts`

```typescript
// Instance Axios configurée
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // ex: http://localhost:3000
  timeout: 10000,
})

// Intercepteur sortant : injecte le token JWT
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('culturo_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Intercepteur entrant : gère les 401
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      useAuthStore().logout()
    }
    return Promise.reject(error)
  }
)
```

---

## Variables d'Environnement

### Backend (`planculture/api-culturo/.env`)

```env
DB_HOST=db                  # nom du service Docker Compose
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=culturo_secret
DB_NAME=culturo
JWT_SECRET=change-me-in-production-use-32-chars-min
PORT=3000
NODE_ENV=development
```

### Frontend (`planculture/front-culturo/.env`)

```env
VITE_API_URL=http://localhost:3000
```

### Frontend Production (`planculture/front-culturo/.env.production`)

```env
VITE_API_URL=http://api:3000
```
