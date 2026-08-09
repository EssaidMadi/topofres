# Tasks: TopOffres (topoffres.fr)

## Tranche 1 — Squelette projet ✅ (fait)

- [x] Task: Initialiser le projet TypeScript + SQLite
  - Acceptance: `npm install && npm test` tourne sans erreur ; `npm run dev` démarre un serveur
  - Verify: `npm test` (2/2 verts), `npm run build`, serveur démarré + `curl localhost:3000` répond
  - Files: package.json, tsconfig.json, src/web/server.ts, .gitignore
  - Note: SQLite via `node:sqlite` intégré (pas de dépendance native ajoutée) ; test runner en découverte par défaut (`node --test` sans argument dossier — passer un chemin cassait la résolution ESM de tsx sur Windows)

- [x] Task: Schéma de base (deals, events)
  - Acceptance: la base SQLite se crée automatiquement au démarrage avec les tables `deals` et `events`
  - Verify: src/db/client.test.ts — 2/2 tests verts (tables créées, contrainte unique source+source_id)
  - Files: src/db/schema.ts, src/db/client.ts

## Tranche 2 — Ingestion Product Hunt ✅ (fait, pas encore testé en vrai)

- [x] Task: Client API Product Hunt (lecture seule)
  - Acceptance: appelle l'API Product Hunt et retourne une liste typée de lancements récents
  - Verify: 5 tests avec réponse mockée (succès, HTTP non-ok, erreur GraphQL, heuristique de remise, mapping) — verts, aucun appel réseau réel
  - Files: src/ingestion/producthunt.ts, src/ingestion/producthunt.test.ts, src/ingestion/types.ts
  - Note: la "remise" est devinée par regex sur le tagline/description (Product Hunt n'a pas de champ deal structuré) — heuristique documentée comme approximative, à revoir avec une 2e source

- [x] Task: Stockage des deals ingérés
  - Acceptance: les deals récupérés sont écrits en base, avec la source et la date de collecte tracées (Boundary "toujours logger la source")
  - Verify: 3 tests (insertion, ré-ingestion idempotente, source tracée) verts
  - Files: src/ingestion/store.ts, src/ingestion/store.test.ts

- [ ] Task: **Vérification en conditions réelles** — bloquée sur un token Product Hunt
  - Acceptance: `npm run ingest` avec un vrai `PRODUCT_HUNT_TOKEN` en `.env` stocke de vrais deals en base
  - Verify: `npm run ingest` affiche "N nouveaux deals stockés"
  - Files: aucun (juste `.env`, jamais commité)

## Backlog — tranches 3 à 9 (à découper en détail quand on y arrive)

- [x] Tranche 3 — Scoring ✅ (fait)
  - src/scoring/score.ts : 3 signaux pondérés (recency 40%, discount 40%, votes 20%), formule explicite, pas de boîte noire
  - 5 tests verts : deal récent+remise bat deal ancien, décroissance de la fraîcheur à 30j, remise clampée, rendements décroissants sur les votes, jamais de crash sur signaux manquants
  - Pas de champ `votes_count` en base pour l'instant (pas dans le schéma Tranche 1) — le scoring l'accepte mais reçoit `null` tant que l'ingestion ne le stocke pas ; à ajouter si on veut vraiment ce signal
- [x] Tranche 4 — Web ✅ (fait)
  - src/db/deals-repo.ts : lit la base, mappe vers le format attendu par le scoring
  - src/web/render.ts : page HTML pure/testable, échappement HTML systématique (titres/descriptions viennent de Product Hunt, source externe non fiable)
  - src/web/server.ts : sert la page classée sur `/`
  - 20/20 tests verts (dont un vrai bug de test corrigé : "badge" apparaît toujours dans le CSS, il fallait chercher le markup exact)
  - Vérifié avec 2 deals réels en base (`data/topoffres.sqlite`, non commité) : le deal frais à -70% passe bien devant le deal ancien sans remise
- [ ] Tranche 5 — Analytics : capture pageview + clic, stockage interne
- [ ] Tranche 6 — Analytics : job de conclusions (avec seuil minimal d'échantillon)
- [ ] Tranche 7 — Content : génération + publication automatique d'articles
- [ ] Tranche 8 — Growth : export CSV de prospects (aucun envoi automatique)
- [ ] Tranche 9 — Déploiement VPS Hostinger + DNS topoffres.fr
