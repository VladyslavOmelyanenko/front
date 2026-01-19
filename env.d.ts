/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_SANITY_PROJECT_ID: string;
  readonly PUBLIC_SANITY_DATASET: string;

  // server-only
  readonly SANITY_READ_TOKEN?: string;
  readonly PRIVATE_PAGE_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}