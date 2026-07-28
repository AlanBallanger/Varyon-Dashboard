# Guide de déploiement Varyon Dev Dashboard

Même modèle que **Varyon_site** : build CI → artefact `.tar.gz` → SCP → extract + PM2 sur le VPS.

## Secrets GitHub

Settings → Secrets and variables → Actions :

| Secret | Description | Exemple |
|--------|-------------|---------|
| `VPS_HOST` | IP / hostname VPS | `123.45.67.89` |
| `VPS_USERNAME` | User SSH | `root` / `ubuntu` |
| `VPS_SSH_KEY` | Clé privée SSH | contenu de `~/.ssh/github-actions` |
| `VPS_PORT` | Port SSH | `22` |
| `DEPLOY_PATH` | Chemin production | `/var/www/varyon-dashboard` |
| `LOKI_URL` | Loki | `http://127.0.0.1:3100` |
| `PROMETHEUS_URL` | Prometheus | `http://127.0.0.1:9090` |
| `HYTALE_MODS_PATH` | Dossier mods | `/opt/hytale/server/mods` |
| `LOKI_LOG_SELECTOR` | LogQL selector | `{job="hytale"}` |
| `API_PORT` | Port API/UI | `8787` |
| `PLAYERS_PROMQL` | PromQL joueurs | `hytale_players_online` |

Les secrets VPS peuvent être les mêmes que pour Varyon_site si c’est le même serveur.

## Préparation VPS

```bash
# Node 20+
sudo apt-get update
sudo apt-get install -y nodejs npm

# pnpm via corepack
sudo corepack enable
sudo corepack prepare pnpm@10.8.1 --activate

# PM2
sudo npm install -g pm2

sudo mkdir -p /var/www/varyon-dashboard
sudo chown -R $USER:$USER /var/www/varyon-dashboard

pm2 startup
pm2 save
```

## Fonctionnement

1. Push sur `main`
2. GitHub Actions build (`pnpm build` → `dist/`)
3. Package : `dist/`, `server/`, `package.json`, `pnpm-lock.yaml`, `.env`
4. SCP vers `/tmp/deploy.tar.gz`
5. Extract dans `DEPLOY_PATH`, `pnpm install --prod`, restart PM2 `varyon-dashboard`

L’API Node sert aussi le frontend (`dist/`) sur `API_PORT`.

## Nginx (exemple)

```nginx
server {
    listen 80;
    server_name dashboard.varyon.example;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

## PM2

```bash
pm2 list
pm2 logs varyon-dashboard
pm2 restart varyon-dashboard
```
