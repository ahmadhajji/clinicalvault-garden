# Launch Checklist

## Credentials Needed

- GitHub fine-grained token for Digital Garden plugin (repo write + PR write)
- Vercel account access
- Cloudflare DNS zone access for `clinicalvault.me`
- Optional: Giscus repo/category IDs
- Optional: Cloudflare Web Analytics token

## Final Manual Steps

1. Deploy this repo to Vercel.
2. Set production env vars from `.env`.
3. Connect custom domain `clinicalvault.me` in Vercel.
4. Update Cloudflare DNS from homelab target to Vercel target.
5. In Obsidian Digital Garden settings, set GitHub user/repo/token.
6. Run `Publish All Notes Marked for Publish` from Obsidian.
7. Validate live site, comments, and analytics.

