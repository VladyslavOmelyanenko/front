// src/components/PrivatePostContent.jsx
import { useEffect, useState } from "react";
import PostContent from "./PostContent.jsx";

export default function PrivatePostClient({ slug }) {
  const [post, setPost] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const effectiveSlug =
          (slug && String(slug).trim()) ||
          window.location.pathname.split("/").filter(Boolean).pop() ||
          "";

        if (!effectiveSlug) {
          window.location.replace("/works");
          return;
        }

        const res = await fetch(
          `/.netlify/functions/private-post?slug=${encodeURIComponent(effectiveSlug)}`,
          { credentials: "include", cache: "no-store" },
        );

        // Not unlocked
        if (res.status === 401) {
          window.location.replace("/works?unlock=open");
          return;
        }

        // Bad slug / not found
        if (res.status === 400 || res.status === 404) {
          window.location.replace("/works");
          return;
        }

        if (!res.ok) {
          window.location.replace("/works?unlock=open");
          return;
        }

        const data = await res.json();

        const normalized = {
          postType: "work",
          title: data.title ?? "Hidden Project",
          postDate: data.postDate ?? data.post_date ?? null,
          postDescription: data.postDescription ?? data.post_description ?? "",
          content: Array.isArray(data.content) ? data.content : [],
          creditbox: Array.isArray(data.creditbox) ? data.creditbox : [],
        };

        // hide locked UI once we have content
        const lockedEl = document.querySelector("[data-private-locked]");
        if (lockedEl) lockedEl.style.display = "none";

        // update nav title if you've added the hook
        if (typeof window.__setNavPostTitle === "function") {
          window.__setNavPostTitle(normalized.title);
        }

        if (alive) setPost(normalized);
      } catch {
        window.location.replace("/works?unlock=open");
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  if (!post) return null; // locked UI is already visible

  const year = post.postDate ? new Date(post.postDate).getFullYear() : "";

  return (
    <div className="post-container private-no-context-menu">
      <div className="title-bar">
        <h2>{post.title}</h2>
        <p>{year}</p>
      </div>

      {post.postDescription ? <p>{post.postDescription}</p> : null}

      <div className="post-content">
        <div className="post-body">
          <PostContent post={post} />
        </div>
      </div>
    </div>
  );
}
