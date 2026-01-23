import sanity from "@sanity/astro";
import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import react from '@astrojs/react';



export default defineConfig({
  output: "static",
  adapter: netlify(),
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
