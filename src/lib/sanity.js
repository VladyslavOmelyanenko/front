import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

const isDev = import.meta.env.DEV;

export const client = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  useCdn: !isDev,
  apiVersion: "2023-10-01",
});

const builder = imageUrlBuilder(client);

export function urlFor(source) {
  if (!source) return builder.image(null);
  if (source.asset) return builder.image(source);
  return builder.image({ asset: source });
}
