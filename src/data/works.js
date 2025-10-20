import { client } from "../lib/sanity.js";

export async function getWorks() {
  try {
    const works = await client.fetch(`
      *[_type == "works"][0].selectedPosts[]->{
        title,
        "slug": slug.current,
        postDate,
        postImage{
          asset->{
            _id,
            url,
          }
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
        slug,
        postDate,
        postImage{
          asset->{
            _id,
            url,
          }
        },
        postDescription,
        content[]{
          ...,
          _type == "image" => {
            ...,
            asset->{
              _id,
              url
            }
          }
        }
      }`,
      { slug }
    );

    if (!post) {
      return null;
    }

    return post;

  } catch (error) {
    console.error("Failed to fetch project:", error);
    return null;
  }
}