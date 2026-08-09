# Plan: TopOffres (topoffres.fr)

## Components & dependencies
```
ingestion (Product Hunt) ──▶ scoring ──▶ web (comparateur)
                                             │
                                             ▼
                                        analytics (events)
                                             │
                                             ▼
                                    conclusions (analyse)
                                             │
                                             ▼
                                  content (articles auto) ──▶ web (blog)
                                             │
                                             ▼
                                  growth (export prospects) [assisté, hors auto-send]
```
`scoring` et `analytics/conclusions` sont les deux composants à plus haut risque (cf. Testing Strategy du spec) — ce sont ceux qui décident ce que voit un visiteur et ce que le système "apprend".

## Order — tranches verticales
1. **Squelette projet** — package.json, TypeScript, structure de dossiers, SQLite, script `npm test` qui tourne (même à vide).
2. **Ingestion Product Hunt** — récupère des deals réels, les stocke en base. Vérifiable : une commande qui affiche N deals en base.
3. **Scoring** — fonction pure qui classe les deals stockés. Vérifiable : tests unitaires sur des cas connus (deal récent + remise forte doit sortir devant un deal ancien).
4. **Web — page comparateur** — sert les deals classés en HTML. Vérifiable : `npm run dev` + la page affiche les deals dans le bon ordre.
5. **Analytics — capture d'événements** — pageview + clic vers le deal, stockés en interne (pas de tracker tiers). Vérifiable : un clic en local crée une ligne en base.
6. **Analytics — conclusions** — job qui agrège les événements par attribut de contenu (catégorie, format) et sort des conclusions lisibles. Vérifiable : avec un jeu de données de test, le job retrouve la corrélation injectée.
7. **Content — génération + publication d'articles** — utilise le scoring + les conclusions pour écrire un article, le publie sur `/blog`. Vérifiable : un article complet publié sans intervention manuelle.
8. **Growth — export de prospects** — liste exportable (CSV) de contacts pertinents pour l'outreach ; aucun envoi automatique. Vérifiable : export généré, aucune connexion sortante vers un service de messagerie.
9. **Déploiement** — VPS Hostinger + DNS topoffres.fr (manuel côté GoDaddy, ou transfert).

Séquentiel de 1 à 6 (chaque étape dépend de la précédente). 7 et 8 peuvent être menés en parallèle une fois 6 terminé, tous deux consomment le même scoring/conclusions mais n'interagissent pas entre eux.

## Risks
- **Rate limits / CGU Product Hunt** — l'API impose des quotas ; prévoir un cache local et respecter les CGU d'usage des données (traçabilité déjà posée en Boundaries du spec).
- **Conclusions bruitées au démarrage** — avec peu de trafic, une "corrélation" peut être du bruit statistique. Le moteur de conclusions doit avoir un seuil minimal d'échantillon avant d'afficher une conclusion, sinon on désinforme le contenu suivant.
- **DNS/registrar hors de mon contrôle** — topoffres.fr est chez GoDaddy, je n'ai pas d'accès API là-bas ; l'étape 9 aura une partie manuelle qui vous revient.

## Verification checkpoints
Après chaque tranche : tests unitaires verts + la vérification manuelle listée ci-dessus. Pas de passage à la tranche suivante sans les deux.
