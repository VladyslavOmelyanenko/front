// netlify/functions/private-post.js
const { createClient: createSanity } = require("@sanity/client");

function hasUnlockCookie(event) {
  const cookie = event.headers?.cookie || event.headers?.Cookie || "";
  return /(?:^|;\s*)private_ui=1(?:;|$)/.test(cookie);
}

const sanity = createSanity({
  projectId: process.env.SANITY_PROJECT_ID || "88b6ol4q",
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_READ_TOKEN, // set in Netlify env vars
  useCdn: false,
});

exports.handler = async (event) => {
  if (!hasUnlockCookie(event)) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const slug = event.queryStringParameters?.slug;
  if (!slug) return { statusCode: 400, body: "Missing slug" };

  if (!process.env.SANITY_READ_TOKEN) {
    return { statusCode: 500, body: "Missing SANITY_READ_TOKEN" };
  }

  const s = await sanity.fetch(
    `*[_type=="post"
      && postType=="work"
      && slug.current==$slug
      && isHidden == true
      && !(_id in path("drafts.**"))
    ][0]{
      "slug": slug.current,
      title,
      postDate,
      postDescription,
      content,
      creditbox
    }`,
    { slug },
  );

  if (!s) return { statusCode: 404, body: "Not found" };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({
      slug: s.slug,
      title: s.title,
      postDate: s.postDate,
      postDescription: s.postDescription,
      content: s.content,
      creditbox: s.creditbox,
      postType: "work",
      isHidden: true,
    }),
  };
};
