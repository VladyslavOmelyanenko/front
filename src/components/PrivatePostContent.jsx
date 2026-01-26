// src/components/PrivatePostClient.jsx
import { useEffect, useState } from "react";
import PostContent from "./PostContent.jsx";

export default function PrivatePostClient() {
  const [post, setPost] = useState(null);

  // ✅ Disable right-click / context menu anywhere on this page while mounted
  useEffect(() => {
    const onContextMenu = (e) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu, { capture: true });

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, {
        capture: true,
      });
    };
  }, []);

  useEffect(() => {
    (async () => {
      // ✅ localStorage unlock gate
      const until = Number(localStorage.getItem("private_ui_until") || 0);
      const unlocked = Date.now() < until;

      if (!unlocked) {
        window.location.href = "/works";
        return;
      }

      const slug = window.location.pathname.split("/").pop();

      // ✅ IMPORTANT: include cookies so Netlify function can see private_ui cookie
      const res = await fetch(`/.netlify/functions/private-post?slug=${slug}`, {
        credentials: "include",
      });

      if (!res.ok) {
        window.location.href = "/works";
        return;
      }

      const data = await res.json();

      // ✅ Normalize Supabase -> Sanity-like shape
      const normalized = {
        postType: "work",
        title: data.title ?? "Hidden Project",
        postDate: data.post_date ?? null,
        postDescription: data.post_description ?? "",
        content: Array.isArray(data.content) ? data.content : [],
        creditbox: Array.isArray(data.creditbox) ? data.creditbox : [],
      };

      setPost(normalized);
    })();
  }, []);

  if (!post) return <div className="private-loading"></div>;

  const year = post.postDate ? new Date(post.postDate).getFullYear() : "";

  return (
    <div className="post-container private-no-context-menu">
      <div className="title-bar">
        <h2>{post.title}</h2>
        <p>{year}</p>
      </div>

      {post.postDescription ? <p>{post.postDescription}</p> : null}

      {/* ✅ uses your Sanity renderer */}
      <div className="post-content">
        <div className="post-body">
          <PostContent post={post} />
        </div>
      </div>
    </div>
  );
}
