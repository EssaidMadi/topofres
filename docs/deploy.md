# Déploiement — mise en place initiale (une fois, à la main)

Le pipeline (`.github/workflows/deploy.yml`) build, teste, et déploie automatiquement à chaque push sur `main`. Mais il a besoin d'un accès SSH au VPS que vous devez créer et donner vous-même — je n'ai pas d'accès à CloudPanel ni au serveur, et je ne génère pas de clé d'accès à votre serveur moi-même.

## 1. Créer le site dans CloudPanel

CloudPanel tourne sur le VPS (`srv1313361.hstgr.cloud`, `76.13.114.85`), généralement sur `https://76.13.114.85:8443`.

1. Connectez-vous à CloudPanel (si vous n'avez pas encore de mot de passe panel, définissez-en un depuis hPanel Hostinger → votre VPS → CloudPanel).
2. **Add Site → Node.js**.
3. Domain: `bestdealsplus.com` (le DNS pointe déjà vers ce VPS, confirmé).
4. Node.js version : 22.
5. App port : choisissez-en un (ex. `3000`) — notez-le, `server.ts` lit `process.env.PORT`.
6. CloudPanel crée un utilisateur système dédié au site (ex. `bestdealsplus`) avec son propre dossier `htdocs/bestdealsplus.com/` — c'est le `DEPLOY_PATH` du secret ci-dessous.
7. Activez SSL (Let's Encrypt) dans l'onglet du site une fois le domaine vérifié.

## 2. Créer une clé SSH pour le déploiement

Sur votre machine (pas besoin de partager la clé privée avec moi) :

```bash
ssh-keygen -t ed25519 -f ./deploy_key -N "" -C "github-actions-deploy"
```

Ça crée `deploy_key` (privée) et `deploy_key.pub` (publique).

Dans CloudPanel : onglet du site → **SSH/SFTP** (ou **File Manager**) → ajoutez le contenu de `deploy_key.pub` aux clés autorisées de l'utilisateur système du site. Vérifiez que le login SSH est activé pour cet utilisateur.

## 3. Ajouter le secret dans GitHub

Seule la clé privée est un secret — l'hôte, l'utilisateur et le chemin sont en dur dans `.github/workflows/deploy.yml` (`env:` en haut du fichier), pas besoin de les répéter dans GitHub.

Repo `topofres` → **Settings → Secrets and variables → Actions → New repository secret** :

| Secret | Valeur |
|---|---|
| `VPS_SSH_KEY` | contenu **complet** de `deploy_key` (la clé privée) |

Puis **supprimez `deploy_key` de votre machine** une fois collée dans GitHub (ou gardez-la dans un gestionnaire de mots de passe, pas en clair dans un dossier).

⚠️ Si votre site CloudPanel utilise un autre utilisateur système ou un autre chemin que `bestdealsplus` / `/home/bestdealsplus/htdocs/bestdealsplus.com`, éditez `VPS_USER` et `VPS_PATH` en haut de `deploy.yml` avant de lancer le workflow.

## 4. pm2 sur le serveur

Le workflow suppose `pm2` installé globalement sur le VPS pour garder l'app en vie et la relancer après un déploiement. Depuis le terminal CloudPanel du site (ou SSH) :

```bash
npm install -g pm2
```

## 5. Déclencher

Un `git push` sur `main` suffit ensuite. Pour un premier essai sans attendre un commit : GitHub → **Actions → Deploy → Run workflow**.

## Variables d'environnement en prod

`PRODUCT_HUNT_TOKEN` (voir `.env.example`) doit être défini côté serveur, pas dans le repo — dans CloudPanel, onglet **Node.js → Environment Variables** du site, ou dans un `.env` déposé manuellement dans `DEPLOY_PATH` (le `.gitignore` l'exclut du repo, donc `rsync --delete` ne l'écrasera pas s'il vit déjà sur le serveur).
