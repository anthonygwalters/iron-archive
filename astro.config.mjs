import { defineConfig } from "astro/config";

// Static output (default). The built site in dist/ is what Cloudflare Pages serves.
export default defineConfig({
  site: "https://theironarchive.org",
});
