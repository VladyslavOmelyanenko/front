import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

const isDev = import.meta.env?.DEV;

export const client = createClient({
  projectId: "saq01wqu",
  dataset: "production",
  useCdn: !isDev,
  apiVersion: "2023-10-01",
});

const builder = imageUrlBuilder(client);

export function urlFor(source) {
  if (!source) return builder.image(null);

  // image field object
  if (source.asset) return builder.image(source);

  // asset ref/object
  return builder.image({ asset: source });
}
