# Deploy (Cloudflare Pages)

The site is a static Astro build. Cloudflare Pages builds it from the repo and
serves `dist/`.

## One-time setup
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → pick `anthonygwalters/iron-archive`.
2. Build settings:
   - **Framework preset:** Astro (or None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`
3. Environment variables:
   - `NODE_VERSION` = `20` (also pinned in `.nvmrc`)
   - `IRON_ASSETS_BASE` = the public base URL of the R2 bucket that holds photos
     and uploaded documents (e.g. `https://assets.theironarchive.org`). Records
     store object keys like `obj/ph_<ulid>.jpg`; the site resolves them against
     this base. Defaults to `https://assets.theironarchive.org` if unset.
4. Deploy. Every push to `main` rebuilds; PRs get preview deployments.

## Custom domain
After DNS is active on Cloudflare (see below), Pages → the project →
**Custom domains** → add `theironarchive.org`. Pages creates the DNS record and
TLS cert automatically. The submit Worker can take `submit.theironarchive.org`
the same way.

## Notes
- **Search:** `npm run build` runs `pagefind --site dist` after `astro build`,
  emitting `/pagefind/*`. The `/search/` page loads it. No runtime service.
- **Data source:** the production build renders `data/` only. The fabricated
  `tests/fixtures/*` are included only when `IRON_DEV_FIXTURES=1`
  (`npm run build:fixtures`), for local template preview — never in production.
- **Empty at launch is fine:** with no records in `data/`, the home page shows an
  honest empty state. Records arrive via the intake flow (docs/intake.md).
- **Local preview:** `npm run dev` (live) or `npm run build:fixtures` then serve
  `dist/`.
