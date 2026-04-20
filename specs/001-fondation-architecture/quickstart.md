# Quickstart: Phase 1 - Fondation & Architecture

**Prerequis**: Docker et Docker Compose installes, repo clone.

## Demarrage en une commande

```bash
cd culturo
docker compose up --build
```

L'application est prete quand vous voyez :

```text
api    | [NestFactory] Starting Nest application...
api    | Application is running on: http://0.0.0.0:3000
front  | VITE ready in XXXms
front  | Local: http://localhost:5173/
```

## Acces aux services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Application Vue.js 3 |
| API | http://localhost:3000 | Backend NestJS |
| Swagger | http://localhost:3000/swagger | Documentation API |
| PostgreSQL | localhost:5432 | Base de donnees (`postgres`) |

## Comptes de test

Les comptes sont injectes via `culturo/z_DB/inserts.sql`.

| Email | Mot de passe | Role |
|-------|---------------|------|
| admin@culturo.be | 123456 | Admin |
| sylvie@culturo.be | 123456 | Formateur |
| marc@culturo.be | 123456 | Stagiaire |

## Validation de l'environnement

```bash
# 1. API
curl http://localhost:3000

# 2. Swagger
curl http://localhost:3000/swagger

# 3. Login
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@culturo.be","password":"123456","hpassword":"123456"}'

# 4. Frontend
curl http://localhost:5173
```

## Developpement sans Docker

### Backend

```bash
cd culturo/api-culturo
cp .env.example .env
npm install
npm run start:dev
```

### Frontend

```bash
cd culturo/front-culturo
cp .env.example .env
npm install
npm run dev
```

En developpement local sans Docker, `VITE_API_URL` doit etre `/api`.
Le proxy Vite redirige alors automatiquement vers `http://localhost:3000`.

En Docker Compose, le service `front` fournit `VITE_API_URL=http://localhost:3000`.

## Arret et nettoyage

```bash
docker compose down
docker compose down -v
```

## Structure de configuration

```text
culturo/
|-- docker-compose.yml
|-- api-culturo/
|   |-- .env.example
|   |-- Dockerfile
|-- front-culturo/
|   |-- .env.example
|   |-- Dockerfile
|   |-- Dockerfile.dev
|-- z_DB/
|   |-- inserts.sql
|   |-- seed.sh
```
