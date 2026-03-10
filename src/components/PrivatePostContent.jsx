// src/components/PrivatePostContent.jsx
import { useEffect, useState } from "react";
import PostContent from "./PostContent.jsx";

export default function PrivatePostClient({ slug }) {
  const [post, setPost] = useState(null);

  useEffect(() => {
    let alive = true;

    const lockedBox = document.querySelector("[data-private-locked]");
    const loadingEl = document.querySelector("[data-private-loading]");
    const lockedTextEl = document.querySelector("[data-private-locked-text]");

    const showLoading = () => {
      if (loadingEl) loadingEl.hidden = false;
      if (lockedTextEl) lockedTextEl.hidden = true;
      if (lockedBox) lockedBox.style.display = "block";
    };

    const showLocked = () => {
      if (loadingEl) loadingEl.hidden = true;
      if (lockedTextEl) lockedTextEl.hidden = false;
      if (lockedBox) lockedBox.style.display = "block";
    };

    const hideLockedBox = () => {
      if (lockedBox) lockedBox.style.display = "none";
    };

    (async () => {
      try {
        showLoading();

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

        if (res.status === 401) {
          showLocked();
          return; // user can click unlock link
        }

        if (res.status === 404 || res.status === 400) {
          window.location.replace("/works");
          return;
        }

        if (!res.ok) {
          // treat as locked-ish
          showLocked();
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

        if (typeof window.__setNavPostTitle === "function") {
          window.__setNavPostTitle(normalized.title);
        }

        hideLockedBox();
        if (alive) setPost(normalized);
      } catch {
        showLocked();
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  if (!post) return null; // loading/locked UI handled by the Astro block

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
