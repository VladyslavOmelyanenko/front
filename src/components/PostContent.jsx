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

    footnote: ({ children, value }) => {
      return (
        <span className="footnote">
          <span className="footnote-text">{children}</span>

          {/* Hidden rich-content note, including images */}
          <span className="footnote-note">
            <PortableText value={value?.note} components={components} />
          </span>
        </span>
      );
    },
  },
};

export default function PostContent({ post }) {
  useEffect(() => {
    const container = document.querySelector(".post-content");
    if (!container) return;

    // Create or reuse right/left layers
    let rightLayer = container.querySelector(".footnote-layer--right");
    if (!rightLayer) {
      rightLayer = document.createElement("div");
      rightLayer.className = "footnote-layer footnote-layer--right";
      container.appendChild(rightLayer);
    }

    let leftLayer = container.querySelector(".footnote-layer--left");
    if (!leftLayer) {
      leftLayer = document.createElement("div");
      leftLayer.className = "footnote-layer footnote-layer--left";
      container.appendChild(leftLayer);
    }

    // track which note is currently visible
    let activeId = null;

    function hideAllNotes() {
      container
        .querySelectorAll(".margin-note--visible")
        .forEach((n) => n.classList.remove("margin-note--visible"));
      activeId = null;
    }

    function layoutNotes() {
      rightLayer.innerHTML = "";
      leftLayer.innerHTML = "";

      const rectContainer = container.getBoundingClientRect();
      const footnotes = container.querySelectorAll(".footnote");

      footnotes.forEach((fn, index) => {
        const textEl = fn.querySelector(".footnote-text");
        const noteEl = fn.querySelector(".footnote-note");
        if (!textEl || !noteEl) return;

        const rectText = textEl.getBoundingClientRect();
        const top = rectText.top - rectContainer.top;
        const isRight = index % 2 === 0; // 0,2,4... → right; 1,3,5... → left
        const id = String(index);

        const div = document.createElement("div");
        div.className = `margin-note ${
          isRight ? "margin-note--right" : "margin-note--left"
        }`;

        // ⬇️ keep rich markup (including <img>)
        div.innerHTML = noteEl.innerHTML || "";

        div.dataset.footnoteId = id;
        div.style.top = `${top}px`;

        fn.dataset.footnoteId = id;
        fn.style.cursor = "pointer";

        if (isRight) {
          rightLayer.appendChild(div);
        } else {
          leftLayer.appendChild(div);
        }

        fn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();

          const alreadyActive = activeId === id;
          hideAllNotes();
          if (alreadyActive) return;

          const target = container.querySelector(
            `.margin-note[data-footnote-id="${id}"]`
          );
          if (target) {
            target.classList.add("margin-note--visible");
            activeId = id;
          }
        };
      });
    }


    layoutNotes();
    window.addEventListener("resize", layoutNotes);

    // click anywhere in the post-content "empty space" → hide all
    const containerClickHandler = (e) => {
      // if the click is inside a .footnote, let the footnote handler deal with it
      const inFootnote = e.target.closest(".footnote");
      if (inFootnote) return;

      // margin-notes have pointer-events: none, so clicks won't originate there
      hideAllNotes();
    };

    container.addEventListener("click", containerClickHandler);

    return () => {
      window.removeEventListener("resize", layoutNotes);
      container.removeEventListener("click", containerClickHandler);
    };
  }, [post]);

  return (
    <>
      {post.content && (
        <PortableText value={post.content} components={components} />
      )}
    </>
  );
}
