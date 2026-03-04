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

## Scheduled fallback reconcile

Fallback reconcile runs through GitHub Actions in this repo:

- workflow: `.github/workflows/drive-reconcile.yml`
- schedule: every 5 minutes
- required repository secret: `DRIVE_RECONCILE_URL`
- optional repository secret: `SYNC_SECRET`

If `SYNC_SECRET` is configured in Vercel, set the same value as a GitHub repository secret so the workflow can send `x-sync-secret`.
