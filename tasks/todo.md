# Tasks: BestDealsPlus (bestdealsplus.com)

> **Pivot du 9 août** : domaine principal → bestdealsplus.com, produit en anglais. topoffres.fr/marché FR devient un futur dépôt séparé (voir spec.md Open Questions). Tranches 1 à 4 ci-dessous ont été faites sous l'ancien nom (topoffres.fr, UI en français) puis rebrandées sans recoder la logique — seuls les libellés visibles ont changé.

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
- [x] Tranche 5 — Analytics : capture d'événements ✅ (fait)
  - src/analytics/events-repo.ts : recordEvent, pas d'IP/user-agent capturés (minimal par défaut)
  - src/web/app.ts : routing extrait de server.ts pour être testable (port éphémère, db en mémoire) ; GET / logue un pageview, GET /out/:id logue un clic puis redirige (302) vers l'URL réelle du deal
  - src/web/render.ts : les liens de deal passent par /out/:id au lieu de l'URL externe directe
  - 24/24 tests verts ; vérifié en vrai avec curl + lecture de la table events
- [x] Tranche 6 — Analytics : moteur de conclusions ✅ (fait)
  - src/analytics/conclusions.ts : compare les clics/deal par catégorie à la moyenne du site ; deux garde-fous : MIN_SAMPLE_CLICKS (10, sinon `ready:false`) et MIN_LIFT (20%, sinon une catégorie n'est pas remontée comme "conclusion")
  - Route interne GET /internal/conclusions (JSON, **pas d'auth pour l'instant** — à revoir avant que le rapport contienne quoi que ce soit de sensible)
  - 29/29 tests verts, dont une corrélation injectée retrouvée exactement (Analytics 3x plus cliqué que Marketing → repéré, +50% de lift)
  - Vérifié en vrai : Analytics à 5 clics/deal ressort à +67% au-dessus de la moyenne (3,00), Marketing sous la moyenne n'est pas remonté
- [x] Tranche 7 — Content ✅ (fait, gabarit — pas de LLM)
  - src/content/generate.ts : gabarit déterministe, deux formes — spotlight sur la catégorie gagnante (avec la vraie conclusion de la Tranche 6) si dispo, sinon top 3 générique. Aucun chiffre inventé, tout vient du scoring/conclusions.
  - src/content/articles-repo.ts, render.ts, run.ts (`npm run publish`)
  - Routes /blog et /blog/:slug, trackées séparément de la page d'accueil (target = le chemin exact)
  - 41/41 tests verts ; vérifié en vrai : corrélation Analytics de la Tranche 6 retrouvée, article publié avec le bon texte/chiffre, pageviews de l'article bien distincts de ceux de l'accueil
- [ ] Tranche 8 — Growth : export CSV de prospects (aucun envoi automatique)
- [x] Tranche 9 — Déploiement automatique — **pipeline fait, avancée à la demande avant 7/8**
  - .github/workflows/deploy.yml : teste → build → rsync vers le VPS → `npm ci --omit=dev` → restart pm2. Ne déploie jamais si les tests échouent.
  - package.json : ajout du script `start`
  - docs/deploy.md : checklist manuelle (création du site CloudPanel, clé SSH, secrets GitHub) — **je ne l'ai pas fait moi-même** : pas d'accès CloudPanel, et je ne génère/attache pas de clé SSH ou de mot de passe serveur moi-même (identifiants + réglages d'accès = à vous de le faire)
  - Débogage réel du premier déploiement (9 août) : mauvais utilisateur système, `authorized_keys` vide, port 3000 déjà pris par un autre site, et `nvm` qui ne se charge pas en SSH non-interactif → `node` retombait sur l'ancien Node système sans `node:sqlite`. Tout corrigé dans deploy.yml + docs/deploy.md.
