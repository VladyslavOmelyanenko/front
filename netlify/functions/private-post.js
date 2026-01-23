const { createClient } = require("@supabase/supabase-js");

function hasUnlockCookie(event) {
  const cookie = event.headers?.cookie || event.headers?.Cookie || "";
  return cookie.includes("private_ui=1");
}

exports.handler = async (event) => {
  if (!hasUnlockCookie(event)) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const slug = event.queryStringParameters?.slug;
  if (!slug) return { statusCode: 400, body: "Missing slug" };

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data, error } = await supabase
    .from("private_posts")
    .select("slug,title,post_date,post_description,content,creditbox")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return { statusCode: 404, body: "Not found" };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(data),
  };
};
