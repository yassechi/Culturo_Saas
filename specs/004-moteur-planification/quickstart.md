# Quickstart — Phase 4 : Moteur de Planification (Tests manuels)

**Branch**: `004-moteur-planification` | **Date**: 2026-04-19

Guide de test manuel pour valider les User Stories de la Phase 4.
Prérequis : application lancée via `docker compose up` (base de données seedée via Phase 2).

---

## Prérequis

```bash
# Lancer l'application
cd culturo
docker compose up

# URL frontend: http://localhost:5173
# URL backend Swagger: http://localhost:3000/api
```

Comptes de test (créés par inserts.sql Phase 6 ou manuellement via Swagger) :

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| admin | admin@culturo.fr | Admin1234! |
| formateur | formateur@culturo.fr | Form1234! |
| stagiaire | stagiaire@culturo.fr | Stag1234! |

---

## Test US1 — Visualiser le plan de culture annuel

**Story**: Un formateur sélectionne une sole et une année → voit les cultures planifiées.

### Étapes

1. Naviguer vers `http://localhost:5173/login`
2. Se connecter en tant que `formateur@culturo.fr`
3. Naviguer vers `/plan`
4. Dans le sélecteur, choisir une exploitation → une sole → année 2025
5. Cliquer "Charger" (ou attendre le rechargement automatique)

### Résultats attendus

- [ ] La grille des planches s'affiche avec les sections
- [ ] Les sections avec légumes affichent : nom du légume + période
- [ ] Les sections sans légume affichent "Disponible" avec une action visible
- [ ] Changer l'année vers 2024 recharge le plan sans rechargement de page
- [ ] Si aucune culture pour l'année : message "Aucune culture planifiée pour cette année."

---

## Test US2 — Affecter un légume à une section disponible

**Story**: Formateur clique sur une section disponible → choisit un légume → confirme.

### Étapes

1. Connecté en tant que formateur, sur `/plan` avec une sole chargée
2. Cliquer sur une section affichée "Disponible"
3. Vérifier que le panneau latéral s'ouvre
4. Sélectionner un légume dans la liste proposée
5. Renseigner : date début `2025-03-15`, date fin `2025-07-31`, variété `Test`
6. Cliquer "Confirmer"

### Résultats attendus

- [ ] Le panneau s'ouvre avec la liste des légumes compatibles
- [ ] Les légumes sont groupés par famille botanique
- [ ] Les familles jamais plantées sont en tête de liste
- [ ] Message "✅ Compatible — aucune contrainte de rotation détectée" visible
- [ ] Après confirmation : la section affiche immédiatement le légume choisi (sans rechargement)
- [ ] Le panneau se ferme automatiquement

### Test du bypass (WARNING)

1. Choisir un légume dont la famille a été plantée récemment sur la planche
2. Cliquer "Confirmer" → un message ⚠️ s'affiche avec la règle violée en français
3. Le bouton "Forcer quand même (bypass)" est visible
4. Cliquer "Forcer" → la plantation est enregistrée malgré l'avertissement

---

## Test US3 — Suggestions groupées par famille

**Story**: Formateur consulte les suggestions avant de choisir.

### Étapes

1. Connecté en tant que formateur, panneau section ouvert
2. Observer la liste des légumes

### Résultats attendus

- [ ] Légumes groupés par famille botanique (ex: "Solanacées", "Brassicacées")
- [ ] Badge "Jamais planté ici" visible pour les légumes jamais plantés sur cette planche
- [ ] Pour les autres : date de dernière plantation affichée sous le nom
- [ ] Familles jamais plantées apparaissent en premier dans la liste

---

## Test US4 — Vérification manuelle de compatibilité

**Story**: Formateur sélectionne un légume et voit immédiatement si c'est compatible.

### Étapes

1. Ouvrir le panneau d'une section disponible
2. Cliquer sur un légume dont on sait qu'il viole une règle (famille primaire active)

### Résultats attendus

- [ ] Message "⚠️ Règle 2 : [Famille X] est actuellement active sur cette planche..." affiché immédiatement (avant soumission)
- [ ] Ou "⚠️ Règle 1 : [Famille X] a été plantée en [année]..."
- [ ] Message en français clair, jamais un code d'erreur technique
- [ ] Si compatible : "✅ Compatible — aucune contrainte de rotation détectée"

---

## Test de contrôle d'accès — Stagiaire

**Story**: Un stagiaire consulte le plan en lecture seule.

### Étapes

1. Se connecter en tant que `stagiaire@culturo.fr`
2. Naviguer vers `/plan`

### Résultats attendus

- [ ] La vue est accessible (pas de redirection /403)
- [ ] Les sections "Disponible" ne sont pas cliquables (ou le panneau ne s'ouvre pas)
- [ ] Aucun bouton "Confirmer" ni "Forcer (bypass)" visible
- [ ] Le plan est visible en lecture seule

> **Note**: Selon le router, la route `/plan` est réservée à `['admin', 'formateur']`. Le stagiaire est redirigé vers `/403`. Vérifier que ce comportement est cohérent avec la spec (US2 scénario 6 : "il ne voit pas le bouton... ni les actions d'affectation"). Si la route est totalement bloquée pour le stagiaire, ce scénario est validé par le guard router.

---

## Tests edge cases

### Sole sans planches

1. Créer une sole sans planches via Swagger `POST /sole`
2. Sélectionner cette sole dans `/plan`
3. Résultat attendu : message "Aucune planche configurée pour cette sole."

### Dates inversées dans le formulaire

1. Dans le panneau d'affectation, saisir `startDate > endDate`
2. Résultat attendu : validation côté frontend empêche la soumission avec message d'erreur clair.

### API 500 pendant confirmation

1. Couper le backend (`docker compose stop api`)
2. Tenter une affectation
3. Résultat attendu : message d'erreur "Une erreur est survenue. Veuillez réessayer." — pas de crash de l'interface.

### Aucun légume compatible

1. Trouver une section où toutes les familles primaires ont été plantées récemment
2. Ouvrir le panneau pour cette section
3. Résultat attendu : message "Aucun légume compatible disponible pour cette section."
