import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const client = createClient({
  projectId: "saq01wqu",
  dataset: "production",
  useCdn: true,
  apiVersion: "2023-10-01",
});

const builder = imageUrlBuilder(client);

export function urlFor(source) {
  // Handle both direct asset objects and asset references
  return builder.image(source);
}