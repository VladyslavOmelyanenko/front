// src/components/PrivatePostContent.jsx
import { useEffect, useState } from "react";
import PostContent from "./PostContent.jsx";

export default function PrivatePostClient({ slug: slugProp }) {
  // ...
  useEffect(() => {
    (async () => {
      const slug = slugProp || window.location.pathname.split("/").pop();

      const res = await fetch(`/.netlify/functions/private-post?slug=${slug}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        window.location.href = "/works?unlock=open";
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

    if (
      typeof window !== "undefined" &&
      typeof window.__setNavPostTitle === "function"
    ) {
      window.__setNavPostTitle(normalized.title);
    }

    setPost(normalized);
    })();
  }, [slugProp]);

  if (!post) return <div className="private-loading"></div>;

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
