// src/components/PrivatePostContent.jsx (or whatever filename you import)
import { useEffect, useState } from "react";
import PostContent from "./PostContent.jsx";

export default function PrivatePostClient({ slug }) {
  const [post, setPost] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // ✅ cookie-based check (server truth)
        const status = await fetch("/.netlify/functions/private-ui-status", {
          credentials: "include",
          cache: "no-store",
        }).then((r) => (r.ok ? r.json() : null));

        if (!status?.unlocked) {
          window.location.replace("/works?unlock=open");
          return;
        }

        const res = await fetch(
          `/.netlify/functions/private-post?slug=${encodeURIComponent(slug)}`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        if (!res.ok) {
          window.location.replace("/works?unlock=open");
          return;
        }

        const data = await res.json();

        const normalized = {
          postType: "work",
          title: data.title ?? "Hidden Project",
          postDate: data.post_date ?? data.postDate ?? null,
          postDescription: data.post_description ?? data.postDescription ?? "",
          content: Array.isArray(data.content) ? data.content : [],
          creditbox: Array.isArray(data.creditbox) ? data.creditbox : [],
        };

        // ✅ update Nav pill title if available
        if (
          typeof window !== "undefined" &&
          typeof window.__setNavPostTitle === "function"
        ) {
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

  if (!post) return <div className="private-loading" />;

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
