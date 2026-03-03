# Clinical Vault (Obsidian Digital Garden)

Clinical Vault is rebuilt as a static Obsidian-first publishing stack using the Digital Garden template.

## Stack

- Obsidian + Digital Garden plugin (`dg-publish` / `dg-home`)
- Eleventy static site (Digital Garden template)
- Vercel Free hosting
- Cloudflare DNS + Web Analytics
- Giscus comments (optional, env-controlled)

## What Changed

- Removed legacy app complexity (server, DB, auth, sync daemon, push APIs).
- Publishing is now controlled directly in Obsidian Properties.
- Visual style aligned to Minimal Theme + Flexoki tokens.
- Comments and analytics are injected through user component slots.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Set environment values (start from `.env.example`):

```bash
cp .env.example .env
```

3. Build locally:

```bash
npm run build
```

4. Start local dev server:

```bash
npm run start
```

## Obsidian Publishing Contract

### Required frontmatter

- `dg-publish: true` to publish a note
- `dg-home: true` on exactly one note (site home)

### Optional frontmatter

- `title`, `tags`, `created`, `updated`, `published`, `description`, `aliases`

`published` is editorial metadata only; it is not the publish gate.

## Obsidian Commands

Use Digital Garden command palette commands:

- `Digital Garden: Toggle publication status`
- `Digital Garden: Publish All Notes Marked for Publish`

Unpublishing is done by removing/toggling off `dg-publish`, then running publish-all.

## Comments (Giscus)

Comments render only when these env vars are set:

- `GISCUS_REPO`
- `GISCUS_REPO_ID`
- `GISCUS_CATEGORY_ID`

Other Giscus options are configurable in `.env`.

## Analytics (Cloudflare)

Set `CLOUDFLARE_ANALYTICS_TOKEN` to enable Cloudflare Web Analytics script injection.

## Customization Boundaries

Safe customization locations:

- `src/site/styles/user/*.scss`
- `src/site/_includes/components/user/**`
- `src/helpers/userUtils.js`
- `.env` / `.env.example`

Avoid direct edits in template core paths unless necessary; this keeps future Digital Garden template updates easy.

## Deployment

See:

- `docs/OBSIDIAN-WORKFLOW.md`
- `docs/DEPLOYMENT-VERCEL-CLOUDFLARE.md`
- `docs/MANUAL-SETUP.md`
