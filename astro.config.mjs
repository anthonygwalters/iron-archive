import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Static output (default). The built site in dist/ is what GitHub Pages serves.
export default defineConfig({
  site: "https://theironarchive.org",
  integrations: [sitemap()],
});
