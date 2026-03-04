# Migration Plan: Static Garden -> Vercel-First Modern Stack

## Delivered in this change

- New modern frontend in `modern/apps/web` (React + TypeScript + Vite)
- Vercel Functions API in `api/`:
  - `GET /api/health`
  - `GET /api/notes`
  - `GET /api/notes/:slug`
- Shared note parsing utilities in `api/_lib/notes.ts`
- Frontend polling every 15 seconds for updates
- Draft notes hidden by default

## Runtime behavior on Vercel

- APIs read markdown notes from `src/site/notes` in the deployed repo snapshot.
- No persistent websocket/file watcher in production serverless mode.
- To publish note changes: commit + push so Vercel deploys a new snapshot.
- Open clients refresh API-backed content every 15 seconds.

## Local run (optional)

```bash
npm run modern:install
npm start
```

## Vercel cutover settings

- install command: `npm run modern:install`
- build command: `npm run modern:build`
- output directory: `modern/apps/web/dist`
- routes: `/api/*` to functions, all other paths to SPA `index.html`

## Notes

- Legacy Eleventy system remains available for rollback.
- URL schema for notes is `/note/<slug>`.
