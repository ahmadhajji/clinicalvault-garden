# Deployment: Vercel + Cloudflare (clinicalvault.me)

## Goal

Serve the static Digital Garden build from Vercel under `clinicalvault.me`, keeping rollback to homelab available during cutover.

## Vercel Setup

1. Import this repo into Vercel.
2. Build settings:
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
3. Add project env vars from `.env` (including optional analytics/comments keys).

## Domain Cutover

1. Add `clinicalvault.me` in Vercel Domains.
2. Update Cloudflare DNS for apex/root and any `www` alias to the Vercel-provided target.
3. Keep previous homelab tunnel/proxy records documented until validation completes.

## Validation Checklist

- `https://clinicalvault.me` loads correct site.
- HTTPS certificate active.
- Home note resolves and renders.
- Newly published note appears after publish-all.
- Unpublished note disappears after publish-all.
- Giscus shows (if configured).
- Cloudflare analytics receives traffic (if configured).

## Rollback

If production issue occurs after DNS cutover:

1. Revert Cloudflare DNS to prior homelab target.
2. Purge Cloudflare cache.
3. Confirm old endpoint resumes serving.

