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

  const size = value?.size || "l"; // "s" | "m" | "l"
  const src = urlFor({ _ref: ref })
    .width(1800)
    .auto("format")
    .quality(85)
    .url();
  const alt = value?.alt || value?.caption || "";

  const widthPct = size === "s" ? "33.333%" : size === "m" ? "66.666%" : "100%";

  return (
    <figure
      className={`pt-image pt-image--${size}`}
      style={{
        width: widthPct,
        margin: "8px auto", // centered for s/m
      }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{
          width: "100%",
          height: "auto", // ✅ natural height
          objectFit: "contain", // doesn’t crop
          display: "block",
          borderRadius: "var(--br)",
        }}
      />
    </figure>
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

// ✅ Carousel block renderer (Portable Text block object: _type === "carousel")
function CarouselBlock({ value }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || root.__inited) return;
    root.__inited = true;

    const crossfadeMs = Number(value?.crossfadeMs ?? 6000);
    const cursorPointer = value?.cursorPointer ?? true;

    const imgs = Array.from(root.querySelectorAll(".pt-carousel-img"));
    if (imgs.length < 2) return;

    const refs =
      (value?.images || [])
        .map((img) => img?.asset?._ref || img?.asset?._id)
        .filter(Boolean) || [];

    const urls = refs.map((ref) =>
      urlFor({ _ref: ref }).width(1920).auto("format").quality(85).url()
    );

    if (!urls.length) return;

    root.style.cursor = cursorPointer ? "pointer" : "default";
    imgs.forEach((img) => {
      img.style.transition = `opacity ${crossfadeMs}ms ease-in-out`;
    });

    let index = 0;
    let front = imgs[0];
    let back = imgs[1];
    let locked = false;

    // make sure both start hidden, then show the first
    front.classList.remove("is-visible");
    back.classList.remove("is-visible");

    // Preload helper
    const preload = (url) =>
      new Promise((resolve, reject) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = () =>
          resolve({
            url,
            w: im.naturalWidth || im.width,
            h: im.naturalHeight || im.height,
          });
        im.onerror = reject;
        im.src = url;
      });

    // Init: load first image before showing
    (async () => {
      try {
        const loaded0 = await preload(urls[0]);
        const isHorizontal0 = loaded0.w >= loaded0.h;

        front.classList.toggle("fit-cover", isHorizontal0);
        front.classList.toggle("fit-contain", !isHorizontal0);

        front.src = loaded0.url;

        requestAnimationFrame(() => front.classList.add("is-visible"));

        // warm up next (optional)
        if (urls.length > 1) preload(urls[1]).catch(() => {});
      } catch {
        // ignore
      }
    })();
    const advance = async () => {
      if (urls.length <= 1) return;
      if (locked) return;
      locked = true;

      const next = (index + 1) % urls.length;
      const nextUrl = urls[next];

      try {
        // ✅ only switch once the next image is ready
        const loaded = await preload(nextUrl);

        // ✅ orientation-based fit
        const isHorizontal = loaded.w >= loaded.h;
        back.classList.toggle("fit-cover", isHorizontal);
        back.classList.toggle("fit-contain", !isHorizontal);

        back.src = loaded.url;

        // crossfade after src is committed
        requestAnimationFrame(() => {
          back.classList.add("is-visible");
          front.classList.remove("is-visible");

          // swap pointers
          const tmp = front;
          front = back;
          back = tmp;
          index = next;

          // keep the now-hidden "back" fully hidden
          back.classList.remove("is-visible");
        });

        // ✅ warm up the one after next to reduce future lag
        const afterNext = urls[(next + 1) % urls.length];
        preload(afterNext).catch(() => {});
      } catch {
        // if image fails, just unlock so user can try again
      } finally {
        // small delay prevents ultra-fast double clicks from fighting the fade
        setTimeout(() => {
          locked = false;
        }, 100);
      }
    };

    root.addEventListener("click", advance);

    return () => {
      root.removeEventListener("click", advance);
      root.__inited = false;
    };
  }, [value]);

  return (
    <div className="pt-carousel" ref={rootRef}>
      <img className="pt-carousel-img" alt="" decoding="async" />
      <img className="pt-carousel-img" alt="" decoding="async" />
    </div>
  );
}



// Main body components
const components = {
  types: {
    image: SanityImage,
    carousel: CarouselBlock, // ✅ handle carousel blocks inside content array
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

            hideAllNotes();

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

        container.querySelectorAll(".footnote").forEach((fn) => {
          fn.onclick = null;
        });

        rightLayer?.remove();
        leftLayer?.remove();
      };
    };

    const setupForCurrentMode = () => {
      cleanupCurrentMode?.();
      cleanupCurrentMode = mql.matches ? setupMobile() : setupDesktop();
    };

    setupForCurrentMode();

    // --- LIGHTBOX for regular PT images (NOT carousel) ---
    const ensureLightbox = () => {
      let overlay = document.getElementById("ptLightbox");
      if (overlay) return overlay;

      overlay = document.createElement("div");
      overlay.id = "ptLightbox";
      overlay.className = "pt-lightbox";
      overlay.innerHTML = `
    <div class="pt-lightbox__backdrop"></div>
    <img class="pt-lightbox__img" alt="" />
  `;
      document.body.appendChild(overlay);

      return overlay;
    };

    const openLightbox = (imgEl) => {
      const overlay = ensureLightbox();
      const modalImg = overlay.querySelector(".pt-lightbox__img");

      const src = imgEl.currentSrc || imgEl.src;
      if (!src) return;

      // Use already-known dimensions if present; otherwise fall back to natural sizes.
      const w = imgEl.naturalWidth || Number(imgEl.getAttribute("width")) || 0;
      const h =
        imgEl.naturalHeight || Number(imgEl.getAttribute("height")) || 0;
      const isHorizontal = w && h ? w >= h : true;

      modalImg.src = src;
      modalImg.classList.toggle("is-horizontal", isHorizontal);
      modalImg.classList.toggle("is-vertical", !isHorizontal);

      overlay.classList.add("is-open");
      document.documentElement.classList.add("pt-no-scroll");
    };

    const closeLightbox = () => {
      const overlay = document.getElementById("ptLightbox");
      if (!overlay) return;

      overlay.classList.remove("is-open");
      document.documentElement.classList.remove("pt-no-scroll");

      const modalImg = overlay.querySelector(".pt-lightbox__img");
      // optional: clear src after close to free memory
      setTimeout(() => {
        if (!overlay.classList.contains("is-open"))
          modalImg.removeAttribute("src");
      }, 150);
    };

    // Click-to-open (capture so it still works even if wrapped)
    const onContainerClick = (e) => {
      const t = e.target;

      // only regular PT images
      const img = t?.closest?.(".pt-image img");
      if (!img) return;

      // ignore carousel images
      if (t?.closest?.(".pt-carousel")) return;

      e.preventDefault();
      e.stopPropagation();
      openLightbox(img);
    };

    container.addEventListener("click", onContainerClick, true);

    // click overlay or ESC to close
    const overlay = ensureLightbox();
    const onOverlayClick = () => closeLightbox();
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
    };

    overlay.addEventListener("click", onOverlayClick);
    window.addEventListener("keydown", onKeyDown);

    // include in your effect cleanup:
    const cleanupLightbox = () => {
      container.removeEventListener("click", onContainerClick, true);
      overlay.removeEventListener("click", onOverlayClick);
      window.removeEventListener("keydown", onKeyDown);
    };

    const onMqlChange = () => setupForCurrentMode();
    if (mql.addEventListener) mql.addEventListener("change", onMqlChange);
    else mql.addListener(onMqlChange);

    return () => {
      if (mql.removeEventListener)
        mql.removeEventListener("change", onMqlChange);
      else mql.removeListener(onMqlChange);

      cleanupCurrentMode?.();
      cleanupLightbox?.();
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
