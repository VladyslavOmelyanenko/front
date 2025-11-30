import { useEffect } from "react";
import { PortableText } from "@portabletext/react";
import { urlFor } from "../lib/sanity";

// Image renderer
function SanityImage({ value }) {
  const ref = value?.asset?._ref || value?.asset?._id;
  if (!ref) return null;
  const src = urlFor(value).width(1200).auto("format").url();
  const alt = value?.alt || value?.caption || "";
  return <img src={src} alt={alt} loading="lazy" />;
}

// Portable Text components
const components = {
  types: {
    image: SanityImage,
  },

  block: {
    h1: ({ children }) => <h1>{children}</h1>,
    normal: ({ children }) => <p className="pt-block">{children}</p>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  },

  marks: {
    link: ({ children, value }) => {
      const href = value?.href || "#";
      const isExternal = href.startsWith("http");
      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          style={{ textDecoration: "underline" }}
        >
          {children}
        </a>
      );
    },

    // footnote mark – contains inline text + hidden note
    footnote: ({ children, value }) => {
      const note = value?.note || "";
      return (
        <span className="footnote">
          <span className="footnote-text">{children}</span>
          <span className="footnote-note">{note}</span>
        </span>
      );
    },
  },
};

export default function PostContent({ post }) {
  useEffect(() => {
    const container = document.querySelector(".post-content");
    if (!container) return;

    // Ensure we have / create overlay for margin notes
    let layer = container.querySelector(".footnote-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "footnote-layer";
      container.appendChild(layer);
    }

    function layoutNotes() {
      layer.innerHTML = "";

      const rectContainer = container.getBoundingClientRect();
      const footnotes = container.querySelectorAll(".footnote");

      footnotes.forEach((fn) => {
        const textEl = fn.querySelector(".footnote-text");
        const noteEl = fn.querySelector(".footnote-note");
        if (!textEl || !noteEl) return;

        const rectText = textEl.getBoundingClientRect();

        // top relative to container
        const top = rectText.top - rectContainer.top;

        const div = document.createElement("div");
        div.className = "margin-note";
        div.textContent = noteEl.textContent || "";

        div.style.top = `${top}px`;

        layer.appendChild(div);
      });
    }

    layoutNotes();

    window.addEventListener("resize", layoutNotes);
    return () => window.removeEventListener("resize", layoutNotes);
  }, [post]);

  return (
    <>
      {post.content && (
        <PortableText value={post.content} components={components} />
      )}
    </>
  );
}
