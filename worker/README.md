# Iron Archive submission Worker

Turns a form submission into a reviewed pull request. Runs on Cloudflare Workers.

- `POST /machines` — new machine **stub** (photo → R2, YAML, branch + PR)
- `POST /sightings` — a **sighting** (+ a new gym file if the place is new), gym
  resolved via OpenStreetMap
- Turnstile verification + per-IP rate limiting on every request

Secrets are **never committed** — they're set with `wrangler secret put`.

## Note on the Wix-DNS constraint

Because DNS stays at Wix, we can't attach `submit.` or `assets.` subdomains to
Cloudflare (custom domains/routes need the zone on Cloudflare). So we use the
**built-in public URLs**, which need no DNS:

- the Worker's `*.workers.dev` URL as the form endpoint
- the R2 bucket's `*.r2.dev` public URL as the asset base

Both are public, non-secret values — they go straight into `src/lib/config.ts`
and `astro.config`/data layer. Only the PAT and Turnstile secret are real secrets.
(If you later transfer the domain to Cloudflare, you can swap in
`submit.theironarchive.org` / `assets.theironarchive.org`.)

## One-time setup

```bash
cd worker
npm install
npx wrangler login          # authorize your Cloudflare account
```

1. **R2 bucket (assets)**
   ```bash
   npx wrangler r2 bucket create iron-archive-assets
   ```
   In the dashboard → R2 → the bucket → **Settings → Public access**, enable the
   **r2.dev public URL**. Copy it (e.g. `https://pub-abc123.r2.dev`).
   - Put it in `wrangler.toml` `ASSETS_BASE`.
   - Put the same value in the **site**: set `IRON_ASSETS_BASE` for the site build
     (or change the default in `src/lib/data.ts`).

2. **KV namespace (rate limiting)**
   ```bash
   npx wrangler kv namespace create RATE_LIMIT
   ```
   Paste the returned `id` into `wrangler.toml` under `[[kv_namespaces]]`.

3. **Fine-grained GitHub PAT** — GitHub → Settings → Developer settings →
   Fine-grained tokens. Repository access: **only `anthonygwalters/iron-archive`**.
   Permissions: **Contents: Read/Write**, **Pull requests: Read/Write**. Then:
   ```bash
   npx wrangler secret put GITHUB_TOKEN      # paste the PAT
   ```

4. **Turnstile** — Cloudflare dashboard → Turnstile → add a widget for
   `theironarchive.org`. You get a **site key** (public) and a **secret**.
   ```bash
   npx wrangler secret put TURNSTILE_SECRET  # paste the secret
   ```
   Put the **site key** in the site: `PUBLIC_TURNSTILE_SITEKEY` (or change the
   default in `src/lib/config.ts`).

5. **Deploy**
   ```bash
   npx wrangler deploy
   ```
   Note the printed `https://iron-archive-submit.<account>.workers.dev` URL.

6. **Point the site at the Worker** — set `PUBLIC_SUBMIT_URL` to that workers.dev
   URL (or change the default in `src/lib/config.ts`), commit, and let Pages
   rebuild. The `ALLOWED_ORIGIN` var is already `https://theironarchive.org`, so
   CORS is handled.

## Verify

```bash
curl https://iron-archive-submit.<account>.workers.dev/   # {"ok":true,...}
```

Then submit a test machine from the live form and confirm a PR opens (CI validates
it, you merge). Delete the test PR/branch if it was only a test.

## Local dev

```bash
npx wrangler dev            # needs the secrets set (or they're skipped in dev)
npm run typecheck
```
