# Clinical Vault Modern (Vercel + Realtime Sync Ready)

Clinical Vault now runs on a modern React + TypeScript frontend with Vercel Functions for APIs.

## What is implemented

- Modern note UI with constrained reading width and overflow-safe rendering
- Embedded video rendering from note frontmatter
- Discussion section scaffold for Supabase comments + Google login
- Universal search API and global `Cmd+K` / `Ctrl+K` command palette
- Structured `/library` page with table, filters, and sort
- Three curated themes with light/dark mode
- Drive sync ingestion endpoints for near-realtime publishing architecture

## Current deployment mode

The site can run in two content modes:

1. Local-file fallback mode (default if Supabase sync is not configured)
- reads from `src/site/notes`
- requires normal git push + Vercel deploy for content changes

2. Realtime sync mode (when Drive + Supabase env vars are configured)
- Google Drive folder is canonical source
- webhook/reconcile ingestion updates Supabase-backed notes
- frontend auto-refresh + global search use synced records

## Key routes

Frontend:
- `/`
- `/note/:slug`
- `/library`

APIs:
- `GET /api/health`
- `GET /api/notes`
- `GET /api/notes/:slug`
- `GET /api/search?q=...&limit=...`
- `GET /api/comments/:slug`
- `POST /api/comments/:slug`
- `POST /api/auth/google`
- `POST /api/sync/drive/webhook`
- `POST /api/sync/drive/reconcile`

## Commands

- `npm run modern:install`
- `npm run modern:build`
- `npm start`

Legacy Eleventy scripts are still available for rollback:
- `npm run legacy:start`
- `npm run legacy:build`

## Required environment (for full realtime + comments)

See `.env.example` for all variables.

Minimum for production comments/auth:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Minimum for Drive realtime sync:
- `GOOGLE_DRIVE_FOLDER_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

Optional:
- `GOOGLE_DRIVE_WEBHOOK_TOKEN`
- `SYNC_SECRET`

## Vercel config

`vercel.json` is configured for:
- install: `npm install && npm run modern:install`
- build: `npm run modern:build`
- output: `modern/apps/web/dist`
- cron reconcile every 5 minutes: `/api/sync/drive/reconcile`
- SPA rewrites for `/note/*` and `/library`
