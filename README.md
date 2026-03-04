# Clinical Vault Live (Vercel-First)

Clinical Vault now runs as a modern React + TypeScript app backed by Vercel serverless APIs.

## Architecture

- Frontend: React + TypeScript + Vite (`modern/apps/web`)
- API: Vercel Functions (`api/**`)
- Content source: Markdown notes in `src/site/notes`
- Sync behavior on deploy: frontend polls APIs every 15 seconds

## Important behavior on Vercel

- This deployment mode does **not** run a persistent file watcher/websocket server.
- New note changes become available after you push changes and Vercel finishes a new deployment.
- In-browser data refresh happens automatically every 15 seconds.
- Draft notes are hidden by default (`dg-publish: false`).

## Commands

- Install modern workspace: `npm run modern:install`
- Build modern app: `npm run modern:build`
- Start modern dev stack: `npm start`

## Vercel config

Configured in [vercel.json](/Users/ahmadhajji/.gemini/antigravity/scratch/remaking clinicalvault.me/vercel.json):

- Install command: `npm run modern:install`
- Build command: `npm run modern:build`
- Output directory: `modern/apps/web/dist`
- SPA fallback routes to `index.html`
- `/api/*` routes to Vercel Functions

## Legacy fallback

Old Eleventy stack remains available:

- `npm run legacy:start`
- `npm run legacy:build`
