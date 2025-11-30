import { client } from "../lib/sanity.js";


export async function getPosts(type, field) {
  try {
    const posts = await client.fetch(
      `*[_type == $type][0].${field}[]->{
        title,
        "slug": slug.current,
        postDate,
        postImage{ asset },
        postDescription,
        postAuthor,
        "images": content[_type == "image"] {
          _key,
          asset,
          alt
        }
      } | order(postDate desc)`, // 👈 sorts newest → oldest
      { type }
    );

    if (!posts || posts.length === 0) {
      console.warn(`No posts found for type: ${type}`);
      return [];
    }

    return posts;
  } catch (error) {
    console.error(`Failed to fetch ${type} posts:`, error);
    throw new Error(`Failed to fetch ${type} posts`);
  }
}

export async function getWorkPost(slug) {
  try {
    const post = await client.fetch(
      `*[_type == "post" && slug.current == $slug][0]{
        title,
        "slug": slug.current,
        postDate,
        postImage{
          asset
        },
        postDescription,
        content[]{
          ...,
          _type == "image" => {
            ...,
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


export async function getAboutPost() {
  try {
    const data = await client.fetch(`
      *[_type == "about"][0]{
        aboutPost->{
          title,
          "slug": slug.current,
          postDate,
          postImage{asset},
          postDescription,
          content[]{
            ...,
            _type == "image" => { ... } // keep as-is if you rely on asset._ref
          }
        }
      }
    `);

    // Return the referenced post (or null if missing)
    return data?.aboutPost ?? null;
  } catch (err) {
    console.error("Failed to fetch about post:", err);
    return null;
  }
}