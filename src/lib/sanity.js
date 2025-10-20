import { createClient } from "@sanity/client";

export const client = createClient({
  projectId: "saq01wqu",
  dataset: "production",
  useCdn: true,
  apiVersion: "2023-10-01",
});
