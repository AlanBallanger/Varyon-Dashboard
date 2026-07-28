# Varyon Dev Dashboard

Dashboard ops web pour le serveur Hytale **Varyon** — logs (Loki), joueurs (Prometheus), mods (filesystem).

## Stack

Vue 3 · Vite · TypeScript · Tailwind · DaisyUI · Tabler Icons · petite API Node

## Configuration

Copie `.env.example` vers `.env` et adapte :

```env
LOKI_URL=http://localhost:3100
PROMETHEUS_URL=http://localhost:9090
HYTALE_MODS_PATH=/opt/hytale/server/mods
LOKI_LOG_SELECTOR={job="hytale"}
API_PORT=8787
PLAYERS_PROMQL=hytale_players_online
```

Ajuste `LOKI_LOG_SELECTOR` et `PLAYERS_PROMQL` selon tes labels / métriques réels.

## Dev

```bash
pnpm install
pnpm dev:api    # API sur :8787
pnpm dev        # UI sur :5173 (proxy /api → 8787)
```

## Prod

```bash
pnpm build
pnpm start      # sert dist/ + API sur API_PORT
```

## Tests

```bash
pnpm test
```

## Onglets V1

| Onglet | Source |
|--------|--------|
| Logs | Loki (`query_range`, live poll) |
| Joueurs | Prometheus |
| Mods | `HYTALE_MODS_PATH` |

Les autres (Console, TPS, RAM, …) sont des placeholders.

## Déploiement

Push sur `main` → GitHub Actions → SCP → PM2 (prod uniquement).  
Voir [`.github/DEPLOYMENT.md`](.github/DEPLOYMENT.md).
