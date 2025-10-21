import { client } from "../lib/sanity.js";

export async function getWorks() {
  try {
    const works = await client.fetch(`
      *[_type == "works"][0].selectedPosts[]->{
        title,
        "slug": slug.current,
        postDate,
        postImage{
          asset
        },
        postDescription
      }
    `);

    if (!works) {
      throw new Error("No projects found");
    }

    return works;
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    throw new Error("Failed to fetch projects");
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