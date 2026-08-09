# Spec: BestDealsPlus (bestdealsplus.com)

> **Pivot du 9 août** : le domaine principal passe de topoffres.fr à bestdealsplus.com — marché international/anglophone. topoffres.fr est mis de côté ; un site pour le marché français se fera **dans un dépôt séparé**, plus tard (pas une refonte de celui-ci). Le contenu produit (UI, articles) passe en anglais ; cette doc de travail reste en français.

## Objective
Un comparateur de deals SaaS qui se fait connaître tout seul, et qui apprend de ce qui marche.

Trois briques, une boucle :
1. **Comparateur** — traque des deals/promos sur des outils & abonnements SaaS depuis des sources réelles (pas une liste figée) et les classe objectivement.
2. **Croissance** — publie automatiquement des articles SEO qui parlent des deals trouvés (autonome) ; prépare des listes de prospects pour du démarchage (assisté — l'envoi reste validé par l'humain, jamais automatique).
3. **Analytics interne** — trace chaque article et chaque deal (trafic, source, clics, conversions) et en tire des conclusions exploitables : quel type d'article ramène du trafic, et pourquoi. Ces conclusions reboucler sur ce que la brique Croissance publie ensuite.

Qui : indés / marketeurs / fondateurs qui veulent réduire leur facture d'outils SaaS.
Succès : un visiteur trouve un deal pertinent en moins de 30s ; le site publie du contenu qui génère du trafic organique mesurable ; le dashboard interne explique — pas juste affiche — pourquoi certains contenus marchent mieux que d'autres.

## Tech Stack
- Node.js + TypeScript
- Base de données : SQLite pour démarrer (simple, un seul fichier, facile à sauvegarder sur le VPS) — migration vers Postgres si le volume le justifie
- Hébergement : VPS Hostinger existant (accès API déjà disponible pour le provisioning)

## Commands
Build: npm run build
Test: npm test
Lint: npm run lint
Dev: npm run dev
*(scripts exacts définis à la Tâche 1 du Plan — squelette du projet)*

## Project Structure
```
src/
  ingestion/    → collecte des deals depuis les sources/API (une source = un module)
  scoring/      → classement objectif des deals (règles explicites, pas de boîte noire)
  content/      → génération + publication automatique des articles
  growth/       → constitution de listes de prospects (export, jamais d'envoi direct)
  analytics/    → événements trackés + moteur qui en tire des conclusions
  web/          → le site : pages comparateur + blog
tests/          → tests unitaires et d'intégration
docs/           → décisions d'architecture (voir documentation-and-adrs)
tasks/          → plan.md et todo.md (convention /plan)
```

## Code Style
TypeScript strict, fonctions pures pour tout ce qui touche au scoring et à l'analyse (testable sans I/O). Un exemple type sera fixé à l'implémentation de la première tranche (ingestion/scoring).

## Testing Strategy
`node:test` (ou vitest si le projet grossit). Priorité de couverture : le moteur de scoring des deals et le moteur de conclusions analytics — ce sont les deux endroits où une erreur silencieuse fait le plus de dégâts (mauvais classement affiché aux visiteurs, fausses conclusions qui orientent le contenu).

## Boundaries
- **Toujours** : logger la source de chaque donnée collectée (traçabilité + respect des CGU des sources) ; ne publier un article qu'après passage par le pipeline de scoring (pas de contenu improvisé) ; garder le moteur d'analytics interne (pas de dépendance à un tracker tiers qui capte les données des visiteurs).
- **Demander d'abord** : toute nouvelle dépendance ; toute clé d'API tierce (surtout payante) ; tout provisioning réel sur le VPS/domaine ; le choix du modèle de monétisation.
- **Jamais** : envoyer un message (DM, email) sans validation humaine explicite au moment de l'envoi ; committer une clé d'API ou un secret ; publier un deal dont la source n'est pas vérifiable.

## Success Criteria
- Le comparateur affiche des deals réels, horodatés, tirés d'au moins une source vérifiable, pas plus vieux que N jours.
- Un article est publié automatiquement de bout en bout (génération → mise en ligne) sans intervention manuelle.
- Le dashboard analytics relie chaque article à ses métriques (vues, source de trafic, clics vers le deal) et affiche au moins une conclusion générée automatiquement (ex. « les articles sur la catégorie X génèrent 3x plus de clics »).
- Aucun message n'est envoyé à un tiers sans un clic de validation humain explicite.

## Open Questions
- ~~Nom + domaine~~ → **bestdealsplus.com**, DNS déjà pointé vers le VPS Hostinger (76.13.114.85), confirmé le 9 août. (topoffres.fr reste acheté chez GoDaddy mais n'est plus utilisé par ce dépôt.)
- ~~Source de deals #1~~ → **Product Hunt** (API publique, lancements SaaS avec souvent un deal de lancement). D'autres sources s'ajoutent après la première tranche.
- Modèle de monétisation : affiliation sur les deals, freemium sur le dashboard, autre ?
- Canal d'outreach assisté à privilégier une fois le contenu en place (export email, export LinkedIn, autre) ?
- **Nouveau** : domaine et dépôt du site marché français — pas encore choisis, à traiter comme un projet séparé quand on y sera (ne pas mélanger avec ce dépôt).
