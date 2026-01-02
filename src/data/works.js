import { client } from "../lib/sanity.js";

/* -------------------------------------------------------
   Fetch MULTIPLE POSTS (list page)
------------------------------------------------------- */
export async function getPosts(type, field) {
  try {
    const posts = await client.fetch(
      `*[_type == $type][0].${field}[]->{
        title,
        "slug": slug.current,
        postDate,
        postDescription,
        postAuthor,

        // MAIN POST IMAGE
        postImage{
          asset,                                   // keep the _ref here
          "url": asset->url,
          "metadata": asset->metadata{dimensions}
        },

        // INLINE CONTENT IMAGES
        "images": content[_type == "image"]{
          _key,
          alt,
          asset,                                  // keep the _ref here too
          "url": asset->url,
          "metadata": asset->metadata{dimensions}
        }
      } | order(postDate desc)`,
      { type }
    );

    return posts ?? [];
  } catch (error) {
    console.error(`Failed to fetch ${type} posts:`, error);
    throw new Error(`Failed to fetch ${type} posts`);
  }
}

/* -------------------------------------------------------
   Fetch a SINGLE WORK POST
------------------------------------------------------- */
export async function getWorkPost(slug) {
  try {
    const post = await client.fetch(
      `*[_type == "post" && slug.current == $slug][0]{
        title,
        "slug": slug.current,
        postDate,
        postType,
        postImage{
          asset,                // <-- KEEP _ref!
          "url": asset->url,
          "metadata": asset->metadata{dimensions}
        },

        postDescription,

        content[]{
          ...,
          _type == "image" => {
            _key,
            alt,
            asset,              // <-- MUST be ONLY asset, not asset->{...}
            "url": asset->url,
            "metadata": asset->metadata{dimensions}
          }
        }
      }`,
      { slug }
    );

    return post ?? null;
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return null;
  }
}

/* -------------------------------------------------------
   Fetch the ABOUT PAGE post
------------------------------------------------------- */
export async function getAboutPost() {
  try {
    const data = await client.fetch(`
      *[_type == "about"][0]{
        aboutPost->{
          title,
          "slug": slug.current,
          postDate,
          postType,
          postImage{
            asset->{
              url,
              metadata { dimensions }
            }
          },

          postDescription,

          content[]{
            ...,

            _type == "image" => {
              ...,
              asset,
              "url": asset->url,
              "metadata": asset->metadata{dimensions}
            }
          }
        }
      }
    `);

    return data?.aboutPost ?? null;
  } catch (err) {
    console.error("Failed to fetch about post:", err);
    return null;
  }
}
