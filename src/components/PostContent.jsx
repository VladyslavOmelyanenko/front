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

// shared link renderer
const LinkMark = ({ children, value }) => {
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
};

// Footnote PortableText used INSIDE footnotes only – inline elements only
const footnoteComponents = {
  types: {
    image: SanityImage, // <img> is phrasing → safe inside <p>
  },
  block: {
    normal: ({ children }) => (
      <span className="fn-inline-block">{children}</span>
    ),
    blockquote: ({ children }) => (
      <span className="fn-inline-block">{children}</span>
    ),
    h1: ({ children }) => <span className="fn-inline-block">{children}</span>,
  },
  marks: {
    link: LinkMark,
  },
};

// Main body components
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
    link: LinkMark,
    footnote: ({ children, value }) => (
      <span className="footnote">
        <span className="footnote-text">{children}</span>
        <span className="footnote-note">
          <PortableText value={value?.note} components={footnoteComponents} />
        </span>
      </span>
    ),
  },
};

export default function PostContent({ post }) {
  useEffect(() => {
    const container = document.querySelector(".post-content");
    if (!container) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (isMobile) {
      // ---------- MOBILE: INLINE AFTER TEXT ----------
      const footnotes = container.querySelectorAll(".footnote");
      let activeInline = null;

      const hideInline = () => {
        if (activeInline && activeInline.parentNode) {
          activeInline.parentNode.removeChild(activeInline);
        }
        activeInline = null;
      };

      footnotes.forEach((fn) => {
        const noteEl = fn.querySelector(".footnote-note");
        if (!noteEl) return;

        fn.style.cursor = "pointer";

        fn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();

          // if already showing for this one, hide and exit
          if (
            activeInline &&
            activeInline.__host === fn &&
            activeInline.parentNode
          ) {
            hideInline();
            return;
          }

          // hide any previous
          hideInline();

          // create new inline element
          const span = document.createElement("span");
          span.className = "inline-footnote";
          span.innerHTML = noteEl.innerHTML || "";
          span.__host = fn;

          fn.insertAdjacentElement("afterend", span);
          activeInline = span;
        };
      });

      const clickOutside = (e) => {
        if (
          e.target.closest(".footnote") ||
          e.target.closest(".inline-footnote")
        )
          return;
        hideInline();
      };

      container.addEventListener("click", clickOutside);

      return () => {
        container.removeEventListener("click", clickOutside);
      };
    } else {
      // ---------- DESKTOP: MARGIN NOTES ----------
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
          const isRight = index % 2 === 0;
          const id = String(index);

          const div = document.createElement("div");
          div.className = `margin-note ${
            isRight ? "margin-note--right" : "margin-note--left"
          }`;
          div.innerHTML = noteEl.innerHTML || "";
          div.dataset.footnoteId = id;
          div.style.top = `${top}px`;

          fn.dataset.footnoteId = id;
          fn.style.cursor = "pointer";

          if (isRight) rightLayer.appendChild(div);
          else leftLayer.appendChild(div);

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

      const containerClickHandler = (e) => {
        if (e.target.closest(".footnote")) return;
        hideAllNotes();
      };

      container.addEventListener("click", containerClickHandler);

      return () => {
        window.removeEventListener("resize", layoutNotes);
        container.removeEventListener("click", containerClickHandler);
      };
    }
  }, [post]);

  return (
    <>
      {post.content && (
        <PortableText value={post.content} components={components} />
      )}
    </>
  );
}
