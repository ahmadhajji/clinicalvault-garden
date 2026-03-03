# Obsidian Workflow

## Vault

Primary vault:

`/Users/ahmadhajji/Library/Mobile Documents/iCloud~md~obsidian/Documents/main`

No new vault and no required folder restructuring.

## Plugin Setup

1. Install **Digital Garden** plugin in Obsidian.
2. Set GitHub username/repo/token in plugin settings.
3. Configure site template repo deployed to Vercel.

## Publish Rules

- Only notes with `dg-publish: true` are public.
- Exactly one note should have `dg-home: true`.
- `published:` remains editorial date metadata.

## Recommended Note Lifecycle

1. Draft normally in any note.
2. Toggle `dg-publish` only when ready.
3. Run `Publish All Notes Marked for Publish`.
4. To unpublish: set `dg-publish: false` (or remove), then publish-all.

## Template Defaults

Vault templates are configured with `dg-publish: false` to prevent accidental publishing.

