import { client } from "../lib/sanity.js";

/* -------------------------------------------------------
   Common fragments
------------------------------------------------------- */
const CAPTIONED_IMAGE = `
  {
    asset,
    alt,
    caption,
    "url": asset->url,
    "metadata": asset->metadata{dimensions}
  }
`;

// Portable Text field that can contain link annotations
const PORTABLE_TEXT_WITH_LINKS = `
  []{
    ...,
    markDefs[]{
      ...,
      _type == "link" => { _type, _key, href }
    }
  }
`;

/* -------------------------------------------------------
   Fetch MULTIPLE POSTS (list page)
   NOTE: this query is weird structurally (homepage doc -> field[]-> posts)
   Kept the same behavior, just updated image shapes.
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

        // CREDIT BOX (Portable Text)
        "creditbox": creditbox ${PORTABLE_TEXT_WITH_LINKS},

        // MAIN POST IMAGE (captionedImage)
        "postImage": postImage ${CAPTIONED_IMAGE},

        // INLINE CONTENT IMAGES (contentImage wrapper)
        "images": content[_type == "contentImage"]{
          _key,
          size,
          "image": image ${CAPTIONED_IMAGE}
        },

        // CAROUSEL PREVIEW (optional: first image + count)
        "carousel": content[_type == "carousel"][0]{
          "count": count(images),
          "first": images[0] ${CAPTIONED_IMAGE},
          intervalMs,
          crossfadeMs,
          cursorPointer
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

        // CREDIT BOX (Portable Text)
        "creditbox": creditbox ${PORTABLE_TEXT_WITH_LINKS},

        // MAIN POST IMAGE (captionedImage)
        "postImage": postImage ${CAPTIONED_IMAGE},

        postDescription,

        content[]{
          ...,

          // INLINE CONTENT IMAGE BLOCK (contentImage)
          _type == "contentImage" => {
            _key,
            size,
            "image": image ${CAPTIONED_IMAGE}
          },

          // CAROUSEL BLOCK (images are captionedImage)
          _type == "carousel" => {
            ...,
            images[] ${CAPTIONED_IMAGE}
          }

          // Footnote images remain plain "image" inside annotations; ignored here
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
   (Your schema earlier shows about as a postType, but you have an about doc.
    Kept your structure, just updated image shapes.)
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

          // CREDIT BOX (Portable Text)
          "creditbox": creditbox ${PORTABLE_TEXT_WITH_LINKS},

          // MAIN POST IMAGE (captionedImage)
          "postImage": postImage ${CAPTIONED_IMAGE},

          postDescription,

          content[]{
            ...,

            _type == "contentImage" => {
              _key,
              size,
              "image": image ${CAPTIONED_IMAGE}
            },

            _type == "carousel" => {
              ...,
              images[] ${CAPTIONED_IMAGE}
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
