export async function POST({ request, redirect }) {
  const form = await request.formData();
  const password = String(form.get("password") || "");

  const correct = import.meta.env.PRIVATE_PAGE_PASSWORD;

  if (!correct || password !== correct) {
    return redirect("/works?unlock=fail", 302);
  }

  const isProd = import.meta.env.PROD;

  // ✅ 10 minutes = 600 seconds
  const cookie = [
    "private_ui=1",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=600", // ✅ auto lock after 10 minutes
    isProd ? "Secure" : "", // ✅ only on https
  ]
    .filter(Boolean)
    .join("; ");

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/works",
      "Set-Cookie": cookie,
    },
  });
}
