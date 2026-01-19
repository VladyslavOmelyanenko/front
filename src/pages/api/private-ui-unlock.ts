export async function POST({ request, redirect }) {
  const form = await request.formData();
  const password = String(form.get("password") || "");

  const correct = import.meta.env.PRIVATE_PAGE_PASSWORD;

  if (!correct || password !== correct) {
    return redirect("/works?unlock=fail", 302);
  }

  const isProd = import.meta.env.PROD;

  // ✅ SESSION cookie (no Max-Age / Expires)
  // ✅ HttpOnly (JS cannot read it)
  // ✅ Secure only in prod (Netlify HTTPS)
  const cookie = [
    "private_ui=1",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    isProd ? "Secure" : "",
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
