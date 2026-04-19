# Culturo Backend 🥕🌱

[![NestJS](https://img.shields.io/badge/NestJS-v11.0.10-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.2-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v15-blue)](https://www.postgresql.org/)
[![TypeORM](https://img.shields.io/badge/TypeORM-latest-yellowgreen)](https://typeorm.io/)
[![JWT](https://img.shields.io/badge/JWT-auth-orange)](https://jwt.io/)
[![Docker](https://img.shields.io/badge/Docker-enabled-blue)](https://www.docker.com/)
[![Swagger](https://img.shields.io/badge/Swagger-docs-green)](/swagger)

---

## 📌 Table of Contents

- [Technologies](#-technologies)
- [Prérequis](#-prérequis)
- [Installation & Run](#-installation--run)
- [Endpoints principaux](#-endpoints-principaux)
  - [Users](#users)
  - [Family](#family)
  - [Vegetables & Variety](#vegetables--variety)
  - [Boards & Soles](#boards--soles)
  - [Exploitations](#exploitations)
  - [Rotations](#rotations)
  - [Amendments](#amendments)
  - [Harvests](#harvests)
  - [Orders](#orders)
  - [Treated](#treated)
  - [Waterings](#waterings)
- [Règles métier](#-règles-métier)
- [Docker](#-docker)
- [Base de données](#-base-de-données)
- [Déploiement & Instructions](#-déploiement--instructions)

---

## 🛠 Technologies

- **Langage :** TypeScript
- **Framework :** Nest.js v11.0.10
- **Base de données :** PostgreSQL
- **ORM :** TypeORM (latest)
- **Authentification :** JWT
- **Autres packages clés :** class-validator, bcrypt, passport
- **Documentation API :** Swagger sur `/swagger`
- **Containerisation :** Dockerfile + Docker Compose inclus

---

## 📦 Prérequis

- Node.js v22.20.0
- PostgreSQL
- Docker & Docker Compose (optionnel mais recommandé)

---

## 🚀 Installation & Run

1. Cloner le dépôt backend :

```bash
git clone <url_du_backend>
cd api-culturo
Installer les dépendances :

bash
Copier le code
npm install
Préparer la base de données :

sql
Copier le code
-- Se connecter à PostgreSQL
psql -h localhost -p 5432 -U postgres
-- Mot de passe : root
-- Créer la DB
DROP DATABASE IF EXISTS culturo;
CREATE DATABASE culturo;
\c culturo
-- Vérifier les tables
\d
-- Copier le contenu du fichier insert.sql
-- Vérifier que les données sont présentes
SELECT * FROM role;
Lancer le serveur en mode développement :

bash
Copier le code
npm run start:dev
Accéder à l’API Swagger :

bash
Copier le code
http://localhost:3000/swagger
🔑 Endpoints principaux
Users
GET /users – Get all users

PUT /users – Update user

GET /users/active – Get all active users

GET /users/inactive – Get all inactive users

GET /users/{id} – Get user by ID

PATCH /users/status/{id}/{status} – Disactivate user

POST /users/register – Register user

POST /users/login – Login user

POST /users/current – Get current user (from token)

Family
GET /family – Get all families

POST /family – Create a family

PUT /family – Update a family

GET /family/importances – Get all importances

GET /family/{id} – Get family by ID

DELETE /family/{id} – Delete a family

Vegetables & Variety
GET /vegetables – Get all vegetables

POST /vegetables – Create a vegetable

PUT /vegetables – Update vegetable

GET /vegetables/{id} – Get vegetable by ID

DELETE /vegetables/{id} – Delete vegetable

GET /vegetables/{id}/varieties – Get all varieties of a vegetable

GET /varieties – Get variety by vegetable ID

GET /varieties/{id} – Get variety by ID

PUT /varieties – Update a variety

DELETE /varieties/{id} – Delete a variety

Boards & Soles
GET /boards – Get all boards

POST /boards – Create board

PUT /boards – Update board

GET /boards/{id} – Get board by ID

DELETE /boards/{id} – Delete board

GET /sole – Get all soles

POST /sole – Create a sole

PUT /sole – Update a sole

GET /sole/{id} – Get sole by ID

DELETE /sole/{id} – Delete sole

Exploitations
GET /exploitation – Get all exploitations

POST /exploitation – Create exploitation

PUT /exploitation – Update exploitation

GET /exploitation/{id} – Get exploitation by ID

GET /exploitation/search/name – Search exploitations by name or proximity

Rotations
GET /rotations/plan/{soleId} – Get plan for a sole

POST /rotations/can – Check if a vegetable can be planted

GET /rotations/plantable-sections – Get plantable sections

GET /rotations/plantable-vegetables – Get plantable vegetables

POST /rotations/plan-section – Create/activate section plan

POST /rotations/add-vegetable – Add vegetable to a section

Amendments
GET /amendements

POST /amendements

GET /amendements/{id}

PUT /amendements/{id}

DELETE /amendements/{id}

Harvests
GET /harvests

POST /harvests

GET /harvests/{id}

PATCH /harvests/{id}

DELETE /harvests/{id}

Orders
GET /orders

POST /orders

GET /orders/{id}

PATCH /orders/{id}

DELETE /orders/{id}

Treated
GET /treated

POST /treated

GET /treated/{id}

PATCH /treated/{id}

DELETE /treated/{id}

Waterings
GET /waterings

POST /waterings

GET /waterings/{id}

PATCH /waterings/{id}

DELETE /waterings/{id}

📜 Règles métier
Rotation (5 ans) : un légume primaire ne peut pas être planté dans une planche où il a été planté les 5 dernières années.

Deux familles primaires ne peuvent pas cohabiter dans une même planche.

Chaque planche possède un plan de section actif tant qu’il y a des sections actives.

🐳 Docker
Dockerfile et Docker Compose inclus

Containerisation complète pour déploiement facile

🧾 Base de données
PostgreSQL

Fichier insert.sql fourni pour initialiser les tables et données

⚙️ Déploiement & Instructions
Drop de la base culturo si elle existe

Créer la base culturo

Lancer npm run start:dev

Se connecter à PostgreSQL et exécuter le insert.sql

Vérifier la présence des données avec SELECT * FROM <table>;
```
