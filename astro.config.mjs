import sanity from "@sanity/astro";
import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import react from '@astrojs/react';
import sitemap from "@astrojs/sitemap";



export default defineConfig({
  output: "static",
  adapter: netlify(),
  site: "https://dzastins.com",
  integrations: [sitemap()],
  transitions: {
    enabled: true,
  },
  integrations: [
    sanity({
      projectId: "saq01wqu",
      dataset: "production",
      // Set useCdn to false if you're building statically.
      useCdn: false,
    }),
    react(),
  ],
});
