# backyard-egerl

Backyard ultra timing system deployed on Cloudflare.

## Architecture

- **Frontend** – React + Vite SPA deployed to [Cloudflare Pages](https://pages.cloudflare.com/)
- **Backend** – [Cloudflare Workers](https://workers.cloudflare.com/) with [Hono](https://hono.dev/) framework
- **Database** – [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)

## Required GitHub Secrets

Configure the following secrets in the repository settings for the deployment workflow:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with permissions: Workers Scripts (Edit), Pages (Edit), D1 (Edit) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID (found in the dashboard URL or overview page) |
| `VITE_API_BASE_URL` | URL of the deployed Worker API (e.g. `https://backyard-egerl-api.<your-subdomain>.workers.dev`) |

## Setup

### 1. Create the D1 database

```bash
cd backend
npx wrangler d1 create backyard-egerl-db
```

Copy the output `database_id` into `backend/wrangler.toml`.

### 2. Apply migrations

```bash
cd backend
npx wrangler d1 migrations apply backyard-egerl-db --local   # local dev
npx wrangler d1 migrations apply backyard-egerl-db --remote  # production
```

### 3. Set Worker secrets

```bash
cd backend
npx wrangler secret put JWT_SECRET
```

### 4. Create a Cloudflare Pages project

```bash
npx wrangler pages project create backyard-egerl
```

## Local Development

```bash
# Frontend (in /frontend)
npm install
npm run dev

# Backend (in /backend)
npm install
npm run dev
```

The frontend Vite dev server proxies API calls to the local Worker dev server on port 8787.
