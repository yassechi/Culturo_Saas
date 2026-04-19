# Quickstart: Phase 1 — Fondation & Architecture

**Prérequis**: Docker & Docker Compose installés, repo cloné.

---

## Démarrage en une commande

```bash
cd planculture
docker compose up --build
```

L'application est prête quand vous voyez :
```
api    | [NestFactory] Starting Nest application...
api    | Application is running on: http://0.0.0.0:3000
front  | VITE ready in XXXms
front  | ➜  Local: http://localhost:5173/
```

---

## Accès aux services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Application Vue.js 3 |
| API | http://localhost:3000 | Backend NestJS |
| Swagger | http://localhost:3000/swagger | Documentation API |
| PostgreSQL | localhost:5432 | Base de données (user: postgres) |

---

## Comptes de test (initialisés via insert.sql)

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@culturo.fr | (voir insert.sql) | Admin |
| formateur@culturo.fr | (voir insert.sql) | Formateur |
| stagiaire@culturo.fr | (voir insert.sql) | Stagiaire |

---

## Validation de l'environnement

Vérifier que tout fonctionne :

```bash
# 1. API répond
curl http://localhost:3000

# 2. Login fonctionne
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@culturo.fr","password":"votremotdepasse"}'
# → doit retourner { "access_token": "...", "user": {...} }

# 3. Route protégée fonctionne
curl http://localhost:3000/users \
  -H "Authorization: Bearer <token_obtenu_ci_dessus>"
# → doit retourner la liste des utilisateurs

# 4. Route bloquée sans token
curl http://localhost:3000/users
# → doit retourner 401

# 5. Frontend accessible
curl http://localhost:5173
# → doit retourner le HTML de l'app Vue
```

---

## Développement sans Docker

### Backend

```bash
cd planculture/api-culturo
cp .env.example .env       # adapter les credentials DB locaux
npm install
npm run start:dev          # hot-reload activé
```

### Frontend

```bash
cd planculture/front-culturo
cp .env.example .env       # adapter VITE_API_URL si besoin
npm install
npm run dev                # Vite dev server sur :5173
```

---

## Arrêt et nettoyage

```bash
# Arrêter les conteneurs (données conservées)
docker compose down

# Arrêter + supprimer les données (reset complet)
docker compose down -v
```

---

## Structure des fichiers de configuration

```
planculture/
├── docker-compose.yml              # Orchestration des 3 services
├── api-culturo/
│   ├── .env.example                # Template variables d'environnement
│   ├── .env                        # Variables locales (non commité)
│   ├── Dockerfile                  # Image production (Node 22 alpine)
│   └── schema.sql                  # Schéma DB (monté dans initdb)
└── front-culturo/
    ├── .env.example                # Template variables d'environnement
    ├── .env                        # Variables locales (non commité)
    └── Dockerfile                  # Image production (Nginx + build Vite)
```
