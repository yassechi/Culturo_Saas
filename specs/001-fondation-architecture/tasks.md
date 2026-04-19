# Tasks: Phase 1 — Fondation & Architecture

**Input**: `specs/001-fondation-architecture/plan.md` · `spec.md` · `data-model.md` · `contracts/auth-api.md`
**Branch**: `001-fondation-architecture`
**Stack**: NestJS 11 / TypeScript 5.7 / Vue.js 3 / Vite / Pinia / Vue Router 4 / Axios / PostgreSQL 15 / Docker

> **Note LLM**: Chaque tâche est autonome. Les chemins sont absolus par rapport à la racine `planculture/`.
> Le code existant est dans `planculture/api-culturo/`. Le frontend vide est dans `planculture/front-culturo/`.

---

## Phase 1 : Setup (Corrections Backend Existant)

**But** : Corriger les problèmes détectés dans le backend existant avant de construire quoi que ce soit par-dessus.

- [ ] T001 Mettre à jour `planculture/api-culturo/Dockerfile` : remplacer `FROM node:20` par `FROM node:22-alpine`. Vérifier que `WORKDIR /app`, `COPY package.json .`, `RUN npm install`, `COPY . .`, `RUN npm run build`, `EXPOSE 3000`, `CMD ["node", "dist/main.js"]` sont tous présents dans l'ordre.

- [ ] T002 Créer `planculture/api-culturo/.env.example` avec exactement ce contenu (commentaires inclus) :
  ```
  # Base de données PostgreSQL
  DB_HOST=db
  DB_PORT=5432
  DB_USER=postgres
  DB_PASSWORD=culturo_secret
  DB_NAME=culturo

  # JWT
  JWT_SECRET=change-me-in-production-minimum-32-chars

  # Serveur
  PORT=3000
  NODE_ENV=development
  ```

- [ ] T003 Créer `planculture/api-culturo/.env.dev` (copie de `.env.example` avec les valeurs de développement réelles). Ce fichier NE DOIT PAS être commité — ajouter `*.env.dev` et `.env` dans `planculture/api-culturo/.gitignore` s'il n'y est pas déjà.

- [ ] T004 Modifier `planculture/api-culturo/src/data-source.ts` : décommenter et activer les lignes `process.env.DB_USER`, `process.env.DB_PASSWORD`, `process.env.DB_NAME`. Supprimer les valeurs hardcodées `'postgres'`, `'root'`, `'culturo'`. Résultat attendu dans `AppDataSourceOptions` :
  ```typescript
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ```
  Supprimer également la fonction `testConnection()` et son appel en bas du fichier — cette fonction appelle `initialize()` et `destroy()` au démarrage, ce qui est inutile et génère des erreurs en Docker.

- [ ] T005 Modifier `planculture/api-culturo/src/app.module.ts` : remplacer le JWT secret hardcodé. Changer :
  ```typescript
  JwtModule.register({
    secret: 'secretKey',
    signOptions: { expiresIn: '1h' },
  }),
  ```
  par :
  ```typescript
  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      secret: config.get<string>('JWT_SECRET'),
      signOptions: { expiresIn: '1h' },
    }),
  }),
  ```
  Ajouter les imports manquants en tête du fichier : `import { ConfigModule, ConfigService } from '@nestjs/config';`

- [ ] T006 [P] Vérifier que `planculture/api-culturo/src/app.module.ts` configure `ConfigModule` avec `envFilePath: ['.env.dev', '.env']` (tableau pour fallback). La config actuelle utilise `.env.${process.env.NODE_ENV || 'dev'}` — garder ce comportement ou simplifier en `envFilePath: '.env.dev'` pour le développement.

---

## Phase 2 : Fondation (Bloquant — à compléter avant les User Stories)

**But** : Infrastructure partagée requise par toutes les user stories. Aucune US ne peut commencer avant que cette phase soit complète.

⚠️ **CRITIQUE** : Tout le travail des phases 3, 4, 5 dépend de cette phase.

- [ ] T007 Scaffolder le projet Vue.js 3 dans `planculture/front-culturo/`. Exécuter dans ce dossier :
  ```bash
  npm create vite@latest . -- --template vue-ts
  ```
  Répondre : framework = Vue, variant = TypeScript. Ensuite : `npm install`.

- [ ] T008 Installer les dépendances frontend dans `planculture/front-culturo/` :
  ```bash
  npm install vue-router@4 pinia axios
  npm install -D vitest @vue/test-utils @vitejs/plugin-vue
  ```

- [ ] T009 Créer `planculture/front-culturo/.env` avec :
  ```
  VITE_API_URL=http://localhost:3000
  ```
  Créer `planculture/front-culturo/.env.example` avec le même contenu. Ajouter `.env` dans `planculture/front-culturo/.gitignore`.

- [ ] T010 Créer `planculture/front-culturo/src/api/client.ts` — instance Axios centralisée avec intercepteurs :
  ```typescript
  import axios from 'axios'

  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  })

  // Injecte le token JWT sur chaque requête
  apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('culturo_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Gère les 401 globalement (token expiré ou invalide)
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('culturo_token')
        localStorage.removeItem('culturo_user')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  export default apiClient
  ```

- [ ] T011 Créer `planculture/front-culturo/src/stores/auth.ts` — store Pinia d'authentification :
  ```typescript
  import { defineStore } from 'pinia'
  import { ref, computed } from 'vue'
  import apiClient from '@/api/client'

  interface AuthUser {
    id: number
    email: string
    role: 'admin' | 'formateur' | 'stagiaire'
    firstName?: string
    lastName?: string
  }

  export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('culturo_token'))
    const user = ref<AuthUser | null>(
      JSON.parse(localStorage.getItem('culturo_user') ?? 'null')
    )

    const isAuthenticated = computed(() => !!token.value)
    const isAdmin = computed(() => user.value?.role === 'admin')
    const isFormateur = computed(() => user.value?.role === 'formateur')
    const isStagiaire = computed(() => user.value?.role === 'stagiaire')

    async function login(email: string, password: string) {
      const response = await apiClient.post('/users/login', { email, password })
      const { access_token, user: userData } = response.data
      token.value = access_token
      user.value = userData
      localStorage.setItem('culturo_token', access_token)
      localStorage.setItem('culturo_user', JSON.stringify(userData))
    }

    function logout() {
      token.value = null
      user.value = null
      localStorage.removeItem('culturo_token')
      localStorage.removeItem('culturo_user')
    }

    async function fetchCurrentUser() {
      const response = await apiClient.post('/users/current')
      user.value = response.data
      localStorage.setItem('culturo_user', JSON.stringify(response.data))
    }

    return { token, user, isAuthenticated, isAdmin, isFormateur, isStagiaire, login, logout, fetchCurrentUser }
  })
  ```

- [ ] T012 Créer `planculture/front-culturo/src/router/index.ts` — Vue Router 4 avec navigation guards par rôle :
  ```typescript
  import { createRouter, createWebHistory } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/login',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
        meta: { requiresAuth: false, layout: 'auth' },
      },
      {
        path: '/',
        redirect: '/dashboard',
      },
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { requiresAuth: true, layout: 'main' },
      },
      {
        path: '/admin/utilisateurs',
        name: 'admin-users',
        component: () => import('@/views/AdminUsersView.vue'),
        meta: { requiresAuth: true, roles: ['admin'], layout: 'main' },
      },
      {
        path: '/plan',
        name: 'plan',
        component: () => import('@/views/PlanView.vue'),
        meta: { requiresAuth: true, roles: ['admin', 'formateur'], layout: 'main' },
      },
      {
        path: '/observations',
        name: 'observations',
        component: () => import('@/views/ObservationsView.vue'),
        meta: { requiresAuth: true, roles: ['stagiaire'], layout: 'main' },
      },
      {
        path: '/403',
        name: 'forbidden',
        component: () => import('@/views/ForbiddenView.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: '/:pathMatch(.*)*',
        redirect: '/dashboard',
      },
    ],
  })

  // Guard global de navigation par rôle
  router.beforeEach((to) => {
    const auth = useAuthStore()

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: 'login' }
    }

    const requiredRoles = to.meta.roles as string[] | undefined
    if (requiredRoles && auth.user && !requiredRoles.includes(auth.user.role)) {
      return { name: 'forbidden' }
    }
  })

  export default router
  ```

- [ ] T013 Mettre à jour `planculture/front-culturo/src/main.ts` pour enregistrer Pinia et le Router :
  ```typescript
  import { createApp } from 'vue'
  import { createPinia } from 'pinia'
  import App from './App.vue'
  import router from './router'

  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')
  ```

- [ ] T014 Configurer l'alias `@` dans `planculture/front-culturo/vite.config.ts` :
  ```typescript
  import { defineConfig } from 'vite'
  import vue from '@vitejs/plugin-vue'
  import { resolve } from 'path'

  export default defineConfig({
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,  // nécessaire pour Docker
    },
  })
  ```
  Ajouter aussi dans `planculture/front-culturo/tsconfig.json` sous `compilerOptions` :
  ```json
  "paths": { "@/*": ["./src/*"] }
  ```

**Checkpoint Fondation** : Le frontend compile (`npm run build` sans erreur) et `npm run dev` démarre sur :5173.

---

## Phase 3 : User Story 1 — Environnement full-stack en une commande (P1)

**But** : `docker compose up` depuis `planculture/` démarre tout (API + front + DB) sans étape manuelle.

**Test indépendant** : `docker compose up --build` → les 3 services démarrent → `curl http://localhost:3000` répond → `curl http://localhost:5173` répond → les données de `insert.sql` sont présentes en base.

### Implémentation US1

- [ ] T015 [US1] Créer `planculture/docker-compose.yml` avec ce contenu complet :
  ```yaml
  version: '3.9'

  services:
    db:
      image: postgres:15-alpine
      container_name: culturo-db
      environment:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: culturo_secret
        POSTGRES_DB: culturo
      volumes:
        - postgres_data:/var/lib/postgresql/data
        - ./api-culturo/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
        - ./api-culturo/DB/insert.sql:/docker-entrypoint-initdb.d/02-insert.sql
      ports:
        - '5432:5432'
      healthcheck:
        test: ['CMD-SHELL', 'pg_isready -U postgres']
        interval: 5s
        timeout: 5s
        retries: 10

    api:
      build:
        context: ./api-culturo
        dockerfile: Dockerfile
      container_name: culturo-api
      environment:
        DB_HOST: db
        DB_PORT: 5432
        DB_USER: postgres
        DB_PASSWORD: culturo_secret
        DB_NAME: culturo
        JWT_SECRET: dev-secret-change-in-production
        PORT: 3000
        NODE_ENV: development
      ports:
        - '3000:3000'
      depends_on:
        db:
          condition: service_healthy
      volumes:
        - ./api-culturo/src:/app/src  # hot-reload en dev

    front:
      build:
        context: ./front-culturo
        dockerfile: Dockerfile
      container_name: culturo-front
      environment:
        VITE_API_URL: http://localhost:3000
      ports:
        - '5173:5173'
      depends_on:
        - api

  volumes:
    postgres_data:
  ```

- [ ] T016 [US1] Vérifier que `planculture/api-culturo/DB/` contient `insert.sql`. Si le dossier s'appelle différemment (ex: `db/`, `database/`), adapter le chemin dans le volume du service `db` dans `docker-compose.yml` (T015). Lister le contenu de `planculture/api-culturo/` pour confirmer le nom exact du dossier contenant `insert.sql`.

- [ ] T017 [US1] Créer `planculture/front-culturo/Dockerfile` pour la production (Nginx + build Vite) :
  ```dockerfile
  FROM node:22-alpine AS builder
  WORKDIR /app
  COPY package.json package-lock.json ./
  RUN npm ci
  COPY . .
  RUN npm run build

  FROM nginx:alpine
  COPY --from=builder /app/dist /usr/share/nginx/html
  COPY nginx.conf /etc/nginx/conf.d/default.conf
  EXPOSE 80
  CMD ["nginx", "-g", "daemon off;"]
  ```

- [ ] T018 [US1] Créer `planculture/front-culturo/nginx.conf` pour servir la SPA Vue.js (nécessaire pour que Vue Router fonctionne — toutes les routes renvoient `index.html`) :
  ```nginx
  server {
      listen 80;
      root /usr/share/nginx/html;
      index index.html;

      location / {
          try_files $uri $uri/ /index.html;
      }
  }
  ```

- [ ] T019 [US1] Créer un `Dockerfile` de développement pour le frontend dans `planculture/front-culturo/Dockerfile.dev` (utilisé par Docker Compose en mode dev avec hot-reload) :
  ```dockerfile
  FROM node:22-alpine
  WORKDIR /app
  COPY package.json package-lock.json ./
  RUN npm ci
  COPY . .
  EXPOSE 5173
  CMD ["npm", "run", "dev", "--", "--host"]
  ```
  Modifier le service `front` dans `planculture/docker-compose.yml` pour pointer sur ce Dockerfile dev :
  ```yaml
  front:
    build:
      context: ./front-culturo
      dockerfile: Dockerfile.dev
  ```

- [ ] T020 [US1] Créer `planculture/.gitignore` (si absent) avec :
  ```
  node_modules/
  dist/
  .env
  .env.dev
  .env.local
  *.log
  ```

**Checkpoint US1** : `cd planculture && docker compose up --build` démarre sans erreur. Les 3 URLs répondent (API :3000, Swagger :3000/swagger, Front :5173).

---

## Phase 4 : User Story 2 — Authentification frontend end-to-end (P1)

**But** : Un utilisateur peut se connecter depuis le frontend et accéder à son tableau de bord selon son rôle.

**Test indépendant** : Ouvrir `http://localhost:5173/login` → saisir les credentials d'un admin → vérifier redirection vers `/dashboard` → vérifier que le menu affiche le rôle admin → tenter `/admin/utilisateurs` en tant que stagiaire → vérifier redirection vers `/403`.

### Implémentation US2

- [ ] T021 [US2] Créer `planculture/front-culturo/src/views/LoginView.vue` — formulaire de connexion :
  ```vue
  <template>
    <div class="login-container">
      <h1>Culturo — Connexion</h1>
      <form @submit.prevent="handleLogin">
        <div>
          <label for="email">Email</label>
          <input id="email" v-model="form.email" type="email" required autocomplete="email" />
        </div>
        <div>
          <label for="password">Mot de passe</label>
          <input id="password" v-model="form.password" type="password" required autocomplete="current-password" />
        </div>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>
    </div>
  </template>

  <script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const auth = useAuthStore()

  const form = ref({ email: '', password: '' })
  const loading = ref(false)
  const errorMessage = ref('')

  async function handleLogin() {
    loading.value = true
    errorMessage.value = ''
    try {
      await auth.login(form.value.email, form.value.password)
      router.push('/dashboard')
    } catch (error: any) {
      errorMessage.value = 'Identifiants incorrects. Vérifiez votre email et mot de passe.'
    } finally {
      loading.value = false
    }
  }
  </script>
  ```

- [ ] T022 [US2] Créer `planculture/front-culturo/src/views/DashboardView.vue` — tableau de bord placeholder adapté au rôle :
  ```vue
  <template>
    <div>
      <h1>Tableau de bord</h1>
      <p>Bienvenue, {{ auth.user?.email }}</p>
      <p>Rôle : <strong>{{ auth.user?.role }}</strong></p>

      <div v-if="auth.isAdmin">
        <h2>Actions admin</h2>
        <ul>
          <li><router-link to="/admin/utilisateurs">Gérer les utilisateurs</router-link></li>
          <li><router-link to="/plan">Planification</router-link></li>
        </ul>
      </div>

      <div v-else-if="auth.isFormateur">
        <h2>Actions formateur</h2>
        <ul>
          <li><router-link to="/plan">Planification</router-link></li>
        </ul>
      </div>

      <div v-else-if="auth.isStagiaire">
        <h2>Mon espace</h2>
        <ul>
          <li><router-link to="/observations">Mes observations</router-link></li>
        </ul>
      </div>

      <button @click="handleLogout">Se déconnecter</button>
    </div>
  </template>

  <script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const auth = useAuthStore()
  const router = useRouter()

  function handleLogout() {
    auth.logout()
    router.push('/login')
  }
  </script>
  ```

- [ ] T023 [US2] Créer `planculture/front-culturo/src/views/ForbiddenView.vue` — page 403 :
  ```vue
  <template>
    <div>
      <h1>403 — Accès refusé</h1>
      <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
      <p>Rôle actuel : <strong>{{ auth.user?.role ?? 'non connecté' }}</strong></p>
      <router-link to="/dashboard">Retour au tableau de bord</router-link>
    </div>
  </template>

  <script setup lang="ts">
  import { useAuthStore } from '@/stores/auth'
  const auth = useAuthStore()
  </script>
  ```

- [ ] T024 [P] [US2] Créer les vues placeholder pour les routes protégées (fichiers minimaux — seront remplis dans les phases suivantes) :
  - `planculture/front-culturo/src/views/AdminUsersView.vue` : template `<h1>Gestion des utilisateurs — Phase 6</h1>`
  - `planculture/front-culturo/src/views/PlanView.vue` : template `<h1>Planification — Phase 4</h1>`
  - `planculture/front-culturo/src/views/ObservationsView.vue` : template `<h1>Mes observations — Phase 5</h1>`

- [ ] T025 [US2] Mettre à jour `planculture/front-culturo/src/App.vue` pour utiliser le composant router-view :
  ```vue
  <template>
    <router-view />
  </template>
  ```
  Supprimer le contenu par défaut généré par Vite (logos, compteur, etc.).

**Checkpoint US2** : Navigation login → dashboard fonctionne. Le guard redirige vers /403 si le rôle est insuffisant.

---

## Phase 5 : User Story 3 — Structure de navigation par rôle (P2)

**But** : Layouts avec menu de navigation adapté au rôle de l'utilisateur connecté.

**Test indépendant** : Se connecter avec chaque rôle et vérifier que le menu latéral n'affiche que les entrées autorisées pour ce rôle.

### Implémentation US3

- [ ] T026 [US3] Créer `planculture/front-culturo/src/layouts/MainLayout.vue` — layout avec navigation latérale par rôle :
  ```vue
  <template>
    <div class="app-layout">
      <nav class="sidebar">
        <div class="brand">
          <h2>🌱 Culturo</h2>
          <span class="role-badge">{{ auth.user?.role }}</span>
        </div>

        <ul>
          <li><router-link to="/dashboard">Accueil</router-link></li>

          <!-- Admin uniquement -->
          <template v-if="auth.isAdmin">
            <li><router-link to="/admin/utilisateurs">Utilisateurs</router-link></li>
            <li><router-link to="/plan">Planification</router-link></li>
          </template>

          <!-- Admin + Formateur -->
          <template v-if="auth.isAdmin || auth.isFormateur">
            <li><router-link to="/plan">Planification</router-link></li>
          </template>

          <!-- Stagiaire uniquement -->
          <template v-if="auth.isStagiaire">
            <li><router-link to="/observations">Mes observations</router-link></li>
          </template>
        </ul>

        <button class="logout-btn" @click="handleLogout">Déconnexion</button>
      </nav>

      <main class="content">
        <router-view />
      </main>
    </div>
  </template>

  <script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const auth = useAuthStore()
  const router = useRouter()

  function handleLogout() {
    auth.logout()
    router.push('/login')
  }
  </script>
  ```

- [ ] T027 [US3] Créer `planculture/front-culturo/src/layouts/AuthLayout.vue` — layout minimal sans navigation (pour la page de login) :
  ```vue
  <template>
    <div class="auth-layout">
      <router-view />
    </div>
  </template>
  ```

- [ ] T028 [US3] Mettre à jour `planculture/front-culturo/src/App.vue` pour utiliser le layout selon la méta de route :
  ```vue
  <template>
    <component :is="currentLayout">
      <router-view />
    </component>
  </template>

  <script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import MainLayout from '@/layouts/MainLayout.vue'
  import AuthLayout from '@/layouts/AuthLayout.vue'

  const route = useRoute()

  const currentLayout = computed(() => {
    return route.meta.layout === 'auth' ? AuthLayout : MainLayout
  })
  </script>
  ```

**Checkpoint US3** : Le menu sidebar change selon le rôle connecté. La page login n'a pas de sidebar.

---

## Phase 6 : Tests du Store d'Authentification

**But** : Tests unitaires Vitest pour `useAuthStore` — seuls tests requis pour cette phase (pas de tests e2e).

- [ ] T029 Configurer Vitest dans `planculture/front-culturo/vite.config.ts`. Ajouter dans `defineConfig` :
  ```typescript
  test: {
    environment: 'jsdom',
    globals: true,
  }
  ```
  Installer la dépendance manquante : `npm install -D jsdom`.
  Ajouter dans `planculture/front-culturo/package.json` sous `scripts` : `"test": "vitest"`.

- [ ] T030 Créer `planculture/front-culturo/src/stores/auth.test.ts` — tests unitaires du store d'auth :
  ```typescript
  import { describe, it, expect, beforeEach, vi } from 'vitest'
  import { setActivePinia, createPinia } from 'pinia'
  import { useAuthStore } from './auth'

  // Mock du client API
  vi.mock('@/api/client', () => ({
    default: {
      post: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    },
  }))

  import apiClient from '@/api/client'

  describe('useAuthStore', () => {
    beforeEach(() => {
      setActivePinia(createPinia())
      localStorage.clear()
    })

    it('isAuthenticated est false par défaut', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('login stocke le token et le user', async () => {
      const mockResponse = {
        data: {
          access_token: 'test-token-123',
          user: { id: 1, email: 'admin@culturo.fr', role: 'admin' },
        },
      }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const store = useAuthStore()
      await store.login('admin@culturo.fr', 'password')

      expect(store.token).toBe('test-token-123')
      expect(store.user?.role).toBe('admin')
      expect(store.isAdmin).toBe(true)
      expect(localStorage.getItem('culturo_token')).toBe('test-token-123')
    })

    it('logout efface le token et le user', () => {
      const store = useAuthStore()
      store.logout()

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(localStorage.getItem('culturo_token')).toBeNull()
    })

    it('isAdmin est false pour un stagiaire', async () => {
      const mockResponse = {
        data: {
          access_token: 'token',
          user: { id: 2, email: 'stagiaire@culturo.fr', role: 'stagiaire' },
        },
      }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const store = useAuthStore()
      await store.login('stagiaire@culturo.fr', 'password')

      expect(store.isAdmin).toBe(false)
      expect(store.isStagiaire).toBe(true)
    })
  })
  ```

---

## Phase 7 : Polish & Finition

- [ ] T031 [P] Créer `planculture/front-culturo/src/api/users.ts` — module API pour les appels auth (isole les appels du composant) :
  ```typescript
  import apiClient from './client'

  export const usersApi = {
    login: (email: string, password: string) =>
      apiClient.post('/users/login', { email, password }),

    getCurrentUser: () =>
      apiClient.post('/users/current'),

    register: (data: { email: string; password: string; firstName: string; lastName: string; roleId: number }) =>
      apiClient.post('/users/register', data),
  }
  ```
  Mettre à jour `useAuthStore` pour utiliser `usersApi.login()` et `usersApi.getCurrentUser()` au lieu des appels directs à `apiClient`.

- [ ] T032 [P] Mettre à jour `planculture/front-culturo/vite.config.ts` pour configurer le proxy de développement (évite les problèmes CORS en dev sans Docker) :
  ```typescript
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  ```
  Note : avec ce proxy, `VITE_API_URL` doit être `/api` en mode dev local (sans Docker). En Docker, l'URL directe `http://localhost:3000` est utilisée. Documenter ce choix dans `quickstart.md`.

- [ ] T033 Validation finale — exécuter le checklist suivant et corriger tout problème :
  1. `cd planculture && docker compose up --build` → les 3 services démarrent
  2. `curl http://localhost:3000` → répond (NestJS)
  3. `curl http://localhost:3000/swagger` → retourne HTML Swagger
  4. `curl http://localhost:5173` → retourne HTML Vue.js
  5. `POST http://localhost:3000/users/login` avec credentials valides → retourne `access_token`
  6. `GET http://localhost:5173/login` → page de login s'affiche
  7. `npm run test` dans `front-culturo/` → les 4 tests passent
  8. Connexion admin → dashboard → menu complet visible
  9. Connexion stagiaire → `/admin/utilisateurs` → redirection `/403`

---

## Dépendances & Ordre d'Exécution

### Ordre des Phases

- **Phase 1 (Setup)** : Aucune dépendance — commencer immédiatement. T001–T006 peuvent être parallélisés.
- **Phase 2 (Fondation)** : Dépend de Phase 1 — BLOQUE les Phases 3, 4, 5.
- **Phase 3 (US1 — Docker)** : Dépend de Phase 2. Peut être parallélisée avec Phase 4 si deux développeurs.
- **Phase 4 (US2 — Auth frontend)** : Dépend de Phase 2. T021–T024 peuvent être parallélisés entre eux.
- **Phase 5 (US3 — Navigation)** : Dépend de Phase 4 (les layouts nécessitent le store auth).
- **Phase 6 (Tests)** : Dépend de Phase 2 (store auth doit exister).
- **Phase 7 (Polish)** : Dépend des Phases 3, 4, 5.

### Opportunités de Parallélisation

```bash
# Phase 1 — peuvent tourner en parallèle
T001 (Dockerfile)  +  T002 (env.example)  +  T003 (.env.dev)

# Phase 2 — séquentiel (T007 crée le projet, le reste en dépend)
T007 → T008 → T009+T010+T011+T012+T013+T014 (parallèles entre eux)

# Phase 4 — parallèles (fichiers différents)
T021 (LoginView) + T022 (DashboardView) + T023 (ForbiddenView) + T024 (placeholders)
```

---

## Stratégie d'Implémentation

### MVP (livrable minimum validable)

1. Phase 1 : Corriger le backend (T001–T006)
2. Phase 2 : Scaffolder le frontend (T007–T014)
3. Phase 3 : Docker Compose (T015–T020)
4. **VALIDER** : `docker compose up` → les 3 services tournent
5. Phase 4 : Auth end-to-end (T021–T025)
6. **VALIDER** : login fonctionne, guards bloquent

### Livraison Incrémentale

- Après Phase 3 : Environnement reproductible → montrable au client
- Après Phase 4 : Auth fonctionnelle → toutes les phases suivantes peuvent commencer
- Après Phase 5 : Navigation role-aware → UX complète pour la Phase 1

---

## Résumé

| Métrique | Valeur |
|----------|--------|
| Total tâches | 33 |
| Phase 1 (Setup) | T001–T006 (6 tâches) |
| Phase 2 (Fondation) | T007–T014 (8 tâches) |
| Phase 3 (US1 Docker) | T015–T020 (6 tâches) |
| Phase 4 (US2 Auth) | T021–T025 (5 tâches) |
| Phase 5 (US3 Nav) | T026–T028 (3 tâches) |
| Phase 6 (Tests) | T029–T030 (2 tâches) |
| Phase 7 (Polish) | T031–T033 (3 tâches) |
| Tâches parallélisables | 14 (marquées [P]) |
| MVP minimal | T001–T025 (25 tâches) |
