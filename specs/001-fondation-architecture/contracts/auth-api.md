# API Contracts: Authentification

**Service**: `planculture/api-culturo`
**Base URL**: `http://localhost:3000` (dev) / configurable via `VITE_API_URL`
**Auth**: Bearer JWT dans le header `Authorization`

---

## POST /users/login

Authentifie un utilisateur et retourne un token JWT.

**Request**:
```json
{
  "email": "admin@culturo.fr",
  "password": "motdepasse"
}
```

**Response 200**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@culturo.fr",
    "role": "admin"
  }
}
```

**Response 401** — identifiants incorrects:
```json
{
  "statusCode": 401,
  "message": "Identifiants incorrects"
}
```

**Utilisé par**: `useAuthStore.login()` dans le frontend.

---

## POST /users/current

Retourne les informations de l'utilisateur authentifié (token requis).

**Headers**: `Authorization: Bearer <token>`

**Response 200**:
```json
{
  "id": 1,
  "email": "admin@culturo.fr",
  "firstName": "Admin",
  "lastName": "Culturo",
  "role": "admin",
  "active": true
}
```

**Response 401** — token absent ou invalide:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Utilisé par**: `useAuthStore.fetchCurrentUser()` — appelé au chargement de l'app pour rafraîchir les données user depuis le localStorage.

---

## POST /users/register

Crée un nouvel utilisateur. **Réservé à l'admin** (rôle requis : `admin`).

**Headers**: `Authorization: Bearer <token>` (admin)

**Request**:
```json
{
  "email": "stagiaire@culturo.fr",
  "password": "motdepasse",
  "firstName": "Jean",
  "lastName": "Dupont",
  "roleId": 3
}
```

**Response 201**:
```json
{
  "id": 42,
  "email": "stagiaire@culturo.fr",
  "role": "stagiaire"
}
```

**Response 403** — rôle insuffisant:
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

---

## Codes d'erreur standard

| Code | Signification | Action frontend |
|------|---------------|-----------------|
| 401 | Token absent, expiré ou invalide | Logout + redirect /login |
| 403 | Rôle insuffisant pour cette ressource | Redirect /403 |
| 422 | Données de requête invalides | Afficher erreur de validation |
| 500 | Erreur serveur | Message générique "Erreur serveur, réessayez" |
