# Realtime Google Drive Sync Setup

## Overview

This app supports a Drive-ingest publishing model:

1. Obsidian outputs markdown files into a Drive-synced folder.
2. Drive webhook or reconcile endpoint triggers ingestion.
3. Notes are parsed and upserted into Supabase `notes`.
4. Public APIs (`/api/notes`, `/api/search`) serve from synced data.

## Required env vars

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_DRIVE_FOLDER_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

Optional hardening:

- `GOOGLE_DRIVE_WEBHOOK_TOKEN`
- `SYNC_SECRET`

## Endpoints

- `POST /api/sync/drive/webhook`
- `POST /api/sync/drive/reconcile`

## Security

- Set `GOOGLE_DRIVE_WEBHOOK_TOKEN` and configure matching channel token in Drive watch setup.
- Set `SYNC_SECRET` and include `x-sync-secret` header on manual reconcile calls.

## Cron fallback

`vercel.json` config triggers `/api/sync/drive/reconcile` every 5 minutes.

If `SYNC_SECRET` is set, configure cron requests to include `x-sync-secret` via an external scheduler that supports custom headers (Vercel native cron does not send custom headers).
