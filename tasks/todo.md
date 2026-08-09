# Tasks: TopOffres (topoffres.fr)

## Tranche 1 — Squelette projet (détaillé, prêt à implémenter)

- [ ] Task: Initialiser le projet TypeScript + SQLite
  - Acceptance: `npm install && npm test` tourne sans erreur (même sans test réel encore) ; `npm run dev` démarre un serveur vide
  - Verify: exécuter les deux commandes
  - Files: package.json, tsconfig.json, src/web/server.ts, .gitignore

- [ ] Task: Schéma de base (deals, events)
  - Acceptance: la base SQLite se crée automatiquement au démarrage avec les tables `deals` et `events`
  - Verify: script qui ouvre la base et liste les tables
  - Files: src/db/schema.ts, src/db/client.ts

## Tranche 2 — Ingestion Product Hunt (détaillé)

- [ ] Task: Client API Product Hunt (lecture seule)
  - Acceptance: appelle l'API Product Hunt et retourne une liste typée de lancements récents
  - Verify: test avec réponse mockée (pas d'appel réseau réel dans les tests)
  - Files: src/ingestion/producthunt.ts, src/ingestion/producthunt.test.ts

- [ ] Task: Stockage des deals ingérés
  - Acceptance: les deals récupérés sont écrits en base, avec la source et la date de collecte tracées (Boundary "toujours logger la source")
  - Verify: `npm test` + script manuel qui affiche N deals en base après ingestion
  - Files: src/ingestion/store.ts, src/ingestion/store.test.ts

## Backlog — tranches 3 à 9 (à découper en détail quand on y arrive)

- [ ] Tranche 3 — Scoring : fonction pure de classement des deals + tests sur cas connus
- [ ] Tranche 4 — Web : page comparateur qui sert les deals classés
- [ ] Tranche 5 — Analytics : capture pageview + clic, stockage interne
- [ ] Tranche 6 — Analytics : job de conclusions (avec seuil minimal d'échantillon)
- [ ] Tranche 7 — Content : génération + publication automatique d'articles
- [ ] Tranche 8 — Growth : export CSV de prospects (aucun envoi automatique)
- [ ] Tranche 9 — Déploiement VPS Hostinger + DNS topoffres.fr
