# Manual Setup Guide (Exact Steps)

## 1. Local Preview (already configured)

From project root:

```bash
cd "/Users/ahmadhajji/.gemini/antigravity/scratch/remaking clinicalvault.me"
npm install
npm run start
```

Open:

- `http://localhost:8080/`
- `http://localhost:8080/notes/Heart%20Failure%20Primer/`
- `http://localhost:8080/notes/About/`

Unpublished safety check:

- `http://localhost:8080/notes/Private%20Scratchpad/` should return 404.

## 2. Create your GitHub repo and push this project

1. Create a new GitHub repo in your account, for example: `clinicalvault-garden`.
2. Repoint git remote and push:

```bash
cd "/Users/ahmadhajji/.gemini/antigravity/scratch/remaking clinicalvault.me"

git remote rename origin upstream
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/clinicalvault-garden.git

git add .
git commit -m "Initial Clinical Vault Digital Garden rebuild"
git push -u origin main
```

## 3. Vercel project setup (exact)

1. Go to `https://vercel.com/new`.
2. Import repo: `<YOUR_GITHUB_USERNAME>/clinicalvault-garden`.
3. Keep defaults:
- Framework Preset: `Other`
- Root Directory: `.`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
4. Click **Deploy**.

## 4. Vercel environment variables

In Vercel Project -> Settings -> Environment Variables, add these keys.

```text
THEME=https://raw.githubusercontent.com/kepano/obsidian-minimal/master/theme.css
BASE_THEME=light
SITE_BASE_URL=clinicalvault.me
SITE_NAME_HEADER=Clinical Vault
SITE_MAIN_LANGUAGE=en

dgHomeLink=true
dgEnableSearch=true
dgShowBacklinks=true
dgShowLocalGraph=false
dgShowToc=true
dgLinkPreview=true
dgShowTags=true

SHOW_CREATED_TIMESTAMP=true
SHOW_UPDATED_TIMESTAMP=true
TIMESTAMP_FORMAT=yyyy-MM-dd

CLOUDFLARE_ANALYTICS_TOKEN=

GISCUS_REPO=
GISCUS_REPO_ID=
GISCUS_CATEGORY=General
GISCUS_CATEGORY_ID=
GISCUS_MAPPING=pathname
GISCUS_STRICT=0
GISCUS_REACTIONS_ENABLED=1
GISCUS_EMIT_METADATA=0
GISCUS_INPUT_POSITION=top
GISCUS_LANG=en
GISCUS_THEME=preferred_color_scheme
```

After adding env vars, trigger a redeploy.

## 5. Connect `clinicalvault.me` in Vercel + Cloudflare

1. In Vercel -> Project -> Settings -> Domains, add `clinicalvault.me` and `www.clinicalvault.me`.
2. Vercel will show required DNS records.
3. In Cloudflare -> DNS, create/update exactly the records Vercel requests.
4. Keep old homelab records unchanged until Vercel domain validation is green.
5. Once validated and site works, remove old production DNS records.

## 6. Obsidian Digital Garden plugin setup

1. In Obsidian -> Settings -> Community plugins -> Browse.
2. Install and enable **Digital Garden**.
3. Open plugin settings.
4. Fill GitHub auth fields:
- GitHub repo name: `clinicalvault-garden`
- GitHub Username: `<YOUR_GITHUB_USERNAME>`
- GitHub token: Fine-grained PAT from step 7
5. Set Base URL: `https://clinicalvault.me`.
6. Save settings.

## 7. Create GitHub fine-grained token for plugin

1. Go to `https://github.com/settings/personal-access-tokens/new`.
2. Set:
- Token name: `DigitalGarden`.
- Resource owner: your account.
- Repository access: only `clinicalvault-garden`.
3. Repository permissions:
- Contents: Read and write.
- Pull requests: Read and write.
4. Generate token and copy it.
5. Paste token into Obsidian Digital Garden settings.

## 8. Giscus setup (including IDs)

### 8.1 Enable Discussions in your repo

1. Open `https://github.com/<YOUR_GITHUB_USERNAME>/clinicalvault-garden/settings`.
2. Enable **Discussions**.
3. Create a discussion category named `General` (if it does not exist).

### 8.2 Install Giscus app

1. Open `https://github.com/apps/giscus`.
2. Click **Install**.
3. Grant access to `clinicalvault-garden` repo.

### 8.3 Get Giscus IDs exactly

1. Open `https://giscus.app`.
2. In “Repository”, enter `<YOUR_GITHUB_USERNAME>/clinicalvault-garden`.
3. Pick category: `General`.
4. Mapping: `pathname`.
5. Copy values from generated script:
- `data-repo` -> `GISCUS_REPO`
- `data-repo-id` -> `GISCUS_REPO_ID`
- `data-category-id` -> `GISCUS_CATEGORY_ID`
6. Put them in Vercel env vars and redeploy.

## 9. Cloudflare Web Analytics token setup

1. In Cloudflare dashboard, open **Web Analytics**.
2. Add site `clinicalvault.me`.
3. Copy token value.
4. Set `CLOUDFLARE_ANALYTICS_TOKEN` in Vercel env vars.
5. Redeploy.

## 10. Obsidian publishing workflow (day-to-day)

For public notes:

- Set frontmatter `dg-publish: true`.
- For homepage note only, set `dg-home: true`.

Publish commands:

- `Digital Garden: Toggle publication status`
- `Digital Garden: Publish All Notes Marked for Publish`

Unpublish:

- Set `dg-publish: false`.
- Run `Publish All Notes Marked for Publish`.

## 11. Final go-live validation

Check these URLs after deployment:

- `https://clinicalvault.me/`
- `https://clinicalvault.me/notes/Heart%20Failure%20Primer/`
- `https://clinicalvault.me/notes/About/`

Expected:

- Home and notes load.
- Private test note is 404.
- Giscus appears when env values are set.
- Cloudflare analytics receives page views.

