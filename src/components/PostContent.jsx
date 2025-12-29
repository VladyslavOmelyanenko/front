import { useEffect, useRef } from "react";
import { PortableText } from "@portabletext/react";
import { urlFor } from "../lib/sanity";

// Helper: extract width & height from Sanity asset _ref
function getDimensionsFromRef(ref) {
  if (!ref || typeof ref !== "string") return {};
  const parts = ref.split("-");
  const sizePart = parts[parts.length - 2]; // "2795x4193"
  if (!sizePart) return {};
  const [wStr, hStr] = sizePart.split("x");
  const width = parseInt(wStr, 10);
  const height = parseInt(hStr, 10);
  if (!width || !height) return {};
  return { width, height };
}

// Image renderer for PortableText
function SanityImage({ value }) {
  const asset = value?.asset;
  if (!asset) return null;

  const ref = asset._ref || asset._id;
  if (!ref) return null;

  const src = urlFor({ _ref: ref }).width(1400).auto("format").url();
  const alt = value?.alt || value?.caption || "";
  const { width, height } = getDimensionsFromRef(ref);

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={width || undefined}
      height={height || undefined}
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  );
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
  types: { image: SanityImage },
  block: {
    normal: ({ children }) => (
      <span className="fn-inline-block">{children}</span>
    ),
    blockquote: ({ children }) => (
      <span className="fn-inline-block">{children}</span>
    ),
    h1: ({ children }) => <span className="fn-inline-block">{children}</span>,
  },
  marks: { link: LinkMark },
};

// Main body components
const components = {
  types: { image: SanityImage },
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
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mql = window.matchMedia("(max-width: 768px)");
    let cleanupCurrentMode = null;

    const setupMobile = () => {
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

          if (
            activeInline &&
            activeInline.__host === fn &&
            activeInline.parentNode
          ) {
            hideInline();
            return;
          }

          hideInline();

          const span = document.createElement("span");
          span.className = "inline-footnote";
          span.innerHTML = noteEl.innerHTML || "";
          span.__host = fn;

          fn.insertAdjacentElement("afterend", span);
          activeInline = span;
        };
      });

      const clickOutside = (e) => {
        const t = e.target;
        if (t?.closest?.(".footnote") || t?.closest?.(".inline-footnote"))
          return;
        hideInline();
      };

      container.addEventListener("click", clickOutside);

      return () => {
        hideInline();
        container.removeEventListener("click", clickOutside);
        footnotes.forEach((fn) => {
          fn.onclick = null;
        });
      };
    };

    const setupDesktop = () => {
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

      // Persist which note is open across resizes/re-layouts
      let activeId = null;

      const hideAllNotes = () => {
        container
          .querySelectorAll(".margin-note--visible")
          .forEach((n) => n.classList.remove("margin-note--visible"));
      };

      const closeAllNotes = () => {
        hideAllNotes();
        activeId = null;
      };

      const showActiveIfAny = () => {
        if (activeId === null) return;
        const target = container.querySelector(
          `.margin-note[data-footnote-id="${activeId}"]`
        );
        target?.classList.add("margin-note--visible");
      };

      const layoutNotes = () => {
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
          div.className = `margin-note ${isRight ? "margin-note--right" : "margin-note--left"}`;
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

            // always hide visible notes first
            hideAllNotes();

            // toggle off if clicking the same footnote
            if (alreadyActive) {
              activeId = null;
              return;
            }

            const target = container.querySelector(
              `.margin-note[data-footnote-id="${id}"]`
            );
            if (target) {
              target.classList.add("margin-note--visible");
              activeId = id;
            }
          };
        });

        // Re-show the previously open note after rebuilding on resize
        showActiveIfAny();
      };

      layoutNotes();
      window.addEventListener("resize", layoutNotes);

      const containerClickHandler = (e) => {
        const t = e.target;
        if (t?.closest?.(".footnote")) return;
        closeAllNotes();
      };

      container.addEventListener("click", containerClickHandler);

      return () => {
        window.removeEventListener("resize", layoutNotes);
        container.removeEventListener("click", containerClickHandler);

        // clean footnote handlers
        container.querySelectorAll(".footnote").forEach((fn) => {
          fn.onclick = null;
        });

        // remove layers (optional, but keeps mode-switch clean)
        rightLayer?.remove();
        leftLayer?.remove();
      };
    };

    const setupForCurrentMode = () => {
      cleanupCurrentMode?.();
      cleanupCurrentMode = mql.matches ? setupMobile() : setupDesktop();
    };

    setupForCurrentMode();

    // Switch behavior when crossing the breakpoint
    const onMqlChange = () => setupForCurrentMode();
    if (mql.addEventListener) mql.addEventListener("change", onMqlChange);
    else mql.addListener(onMqlChange); // Safari fallback

    return () => {
      if (mql.removeEventListener)
        mql.removeEventListener("change", onMqlChange);
      else mql.removeListener(onMqlChange);

      cleanupCurrentMode?.();
      cleanupCurrentMode = null;
    };
  }, [post]);

  return (
    <div className="post-content" ref={containerRef}>
      {post?.content && (
        <PortableText value={post.content} components={components} />
      )}
    </div>
  );
}
