import { useEffect, useRef, useState } from "react";
import { PortableText } from "@portabletext/react";
import { urlFor } from "../lib/sanity";

// Image renderer for PortableText
function SanityImage({ value }) {
  // Supports:
  // - contentImage: { _type:"contentImage", size, image:{asset, alt, caption} }
  // - plain image/captionedImage: { asset, alt, caption }
  const img = value?.image ?? value;
  const asset = img?.asset;
  if (!asset) return null;

  const size =
    value?._type === "contentImage" ? value?.size || "l" : value?.size || "l";
  const src = urlFor(asset).width(1800).auto("format").quality(85).url();

  const alt = img?.alt || img?.caption || "";
  const caption = img?.caption || null;

  const widthPct = size === "s" ? "33.333%" : size === "m" ? "66.666%" : "100%";

  return (
    <figure
      className={`pt-image pt-image--${size}`}
      style={{ width: widthPct, margin: "8px auto" }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{
          width: "100%",
          height: "auto",
          objectFit: "contain",
          display: "block",
          borderRadius: "var(--br)",
        }}
      />
      {caption && <figcaption className="pt-caption">{caption}</figcaption>}
    </figure>
  );
}

// shared link renderer
const LinkMark = ({ children, value }) => {
  const href = value?.href;

  // ✅ no href -> no link (prevents scroll-to-top)
  if (!href) return <>{children}</>;

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

// Footnote PortableText used INSIDE footnotes only
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

function CarouselBlock({ value }) {
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const currentRef = useRef({ src: "", alt: "" });
  const [caption, setCaption] = useState("");

  useEffect(() => {
    const root = rootRef.current;
    const btn = btnRef.current;
    if (!root || !btn) return;

    if (root.__inited) return;
    root.__inited = true;

    const crossfadeMs = Number(value?.crossfadeMs ?? 6000);
    const cursorPointer = value?.cursorPointer ?? true;

    const imgs = Array.from(root.querySelectorAll(".pt-carousel-img"));
    if (imgs.length < 2) return;

    const items =
      (value?.images || [])
        .map((img) => {
          const ref = img?.asset?._ref || img?.asset?._id;
          if (!ref) return null;
          return {
            url: urlFor({ _ref: ref })
              .width(1920)
              .auto("format")
              .quality(85)
              .url(),
            caption: img?.caption || "",
            alt: img?.alt || img?.caption || "",
          };
        })
        .filter(Boolean) || [];

    if (!items.length) return;

    root.style.cursor = cursorPointer ? "pointer" : "default";
    imgs.forEach((img) => {
      img.style.transition = `opacity ${crossfadeMs}ms ease-in-out`;
    });

    let index = 0;
    let front = imgs[0];
    let back = imgs[1];
    let locked = false;
    let currentImgEl = front;

    front.classList.remove("is-visible");
    back.classList.remove("is-visible");

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

    function applyFit(imgEl, w, h) {
      const isHorizontal = w >= h;
      imgEl.classList.toggle("fit-cover", isHorizontal);
      imgEl.classList.toggle("fit-contain", !isHorizontal);
    }

    function setCurrent(i, imgElForPosition) {
      setCaption(items[i]?.caption || "");
      currentRef.current = {
        src: items[i]?.url || "",
        alt: items[i]?.alt || "",
      };
      if (imgElForPosition) {
        currentImgEl = imgElForPosition;
      }
    }

    // ✅ Position the button relative to the CURRENT image box
    function positionBtnOn(imgEl) {
      if (!imgEl || !btn) return;

      const rImg = imgEl.getBoundingClientRect();
      const rRoot = root.getBoundingClientRect();

      const pad = 4; // distance from image edge
      const left = rImg.left - rRoot.left + pad;
      const top = rImg.bottom - rRoot.top - btn.offsetHeight - pad;

      btn.style.left = `${left}px`;
      btn.style.top = `${top}px`;
    }

    const onResize = () => positionBtnOn(currentImgEl);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    (async () => {
      try {
        const loaded0 = await preload(items[0].url);
        applyFit(front, loaded0.w, loaded0.h);
        front.src = loaded0.url;
        front.alt = items[0].alt || "";
        setCurrent(0, front);

        requestAnimationFrame(() => {
          front.classList.add("is-visible");
          requestAnimationFrame(() => positionBtnOn(front));
        });

        if (items.length > 1) preload(items[1].url).catch(() => {});
      } catch {}
    })();

    const advance = async () => {
      if (items.length <= 1) return;
      if (locked) return;
      locked = true;

      const next = (index + 1) % items.length;
      const nextItem = items[next];

      try {
        const loaded = await preload(nextItem.url);
        applyFit(back, loaded.w, loaded.h);
        back.src = loaded.url;
        back.alt = nextItem.alt || "";

        requestAnimationFrame(() => {
          // place button on the incoming image immediately
          positionBtnOn(back);

          back.classList.add("is-visible");
          front.classList.remove("is-visible");

          const tmp = front;
          front = back;
          back = tmp;

          index = next;
          setCurrent(index, front);

          // keep the old one hidden for next round
          back.classList.remove("is-visible");
        });

        const afterNext = items[(next + 1) % items.length]?.url;
        if (afterNext) preload(afterNext).catch(() => {});
      } finally {
        setTimeout(() => {
          locked = false;
        }, 100);
      }
    };

    root.addEventListener("click", advance);

    return () => {
      root.removeEventListener("click", advance);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      root.__inited = false;
    };
  }, [value]);

  return (
    <div className="pt-carousel-wrap">
      <div className="pt-carousel" ref={rootRef}>
        <img className="pt-carousel-img" alt="" decoding="async" />
        <img className="pt-carousel-img" alt="" decoding="async" />

        {/* Button pinned to visible IMAGE bounds (positioned by JS) */}
        <button
          type="button"
          className="pt-carousel-btn"
          aria-label="Fullscreen"
          ref={btnRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            const { src, alt } = currentRef.current || {};
            if (!src) return;

            document.dispatchEvent(
              new CustomEvent("pt:open-lightbox", { detail: { src, alt } })
            );
          }}
        >
          <span className="material-symbols-outlined">fullscreen</span>
        </button>
      </div>

      {caption && <div className="pt-caption">{caption}</div>}
    </div>
  );
}

const components = {
  types: {
    contentImage: SanityImage,
    image: SanityImage, // fallback (footnotes)
    carousel: CarouselBlock,
  },
  block: {
    h1: ({ children }) => <h1>{children}</h1>,
    normal: ({ children }) => <div className="pt-block">{children}</div>,
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
  const scrollYRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // build or find lightbox once
    let lightbox = document.querySelector(".pt-lightbox");
    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.className = "pt-lightbox";
      lightbox.innerHTML = `
        <div class="pt-lightbox__backdrop"></div>
        <img class="pt-lightbox__img" alt="" />
      `;
      document.body.appendChild(lightbox);
    }

    const lbImg = lightbox.querySelector(".pt-lightbox__img");
    const backdrop = lightbox.querySelector(".pt-lightbox__backdrop");

    const lockScroll = () => {
      const y = window.scrollY || 0;
      scrollYRef.current = y;

      // ✅ prevents jump-to-top on iOS/Safari
      document.body.style.position = "fixed";
      document.body.style.top = `-${y}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    };

    const unlockScroll = () => {
      const y = scrollYRef.current || 0;

      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";

      window.scrollTo(0, y);
    };

    const open = (src, alt = "") => {
      if (!src) return;

      // avoid double-lock
      const alreadyOpen = lightbox.classList.contains("is-open");
      if (!alreadyOpen) lockScroll();

      lbImg.src = src;
      lbImg.alt = alt;

      lbImg.classList.remove("is-horizontal", "is-vertical");
      const tmp = new Image();
      tmp.onload = () => {
        const horiz = (tmp.naturalWidth || 1) >= (tmp.naturalHeight || 1);
        lbImg.classList.add(horiz ? "is-horizontal" : "is-vertical");
      };
      tmp.src = src;

      lightbox.classList.add("is-open");
    };

    const close = () => {
      if (!lightbox.classList.contains("is-open")) return;
      lightbox.classList.remove("is-open");
      lbImg.src = "";
      unlockScroll();
    };

    // ✅ open requested by carousel button
    const onOpenFromCarousel = (e) => {
      const { src, alt } = e.detail || {};
      if (!src) return;
      open(src, alt || "");
    };
    document.addEventListener("pt:open-lightbox", onOpenFromCarousel);

    // ✅ Event delegation for normal images
    const onClick = (e) => {
      const img = e.target.closest("img");
      if (!img) return;
      if (!container.contains(img)) return;

      // ✅ don't zoom carousel images
      if (img.classList.contains("pt-carousel-img")) return;

      // ✅ stop any link navigation
      const a = img.closest("a");
      if (a) {
        e.preventDefault();
        e.stopPropagation();
      }

      const src = img.currentSrc || img.src;
      if (!src) return;

      open(src, img.alt || "");
    };

    const onClose = (e) => {
      if (e.target === backdrop || e.target === lbImg) close();
    };

    // Esc closes
    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };

    container.addEventListener("click", onClick);
    lightbox.addEventListener("click", onClose);
    document.addEventListener("keydown", onKeyDown);

    // Close lightbox on route transitions
    const onBeforeSwap = () => close();
    document.addEventListener("astro:before-swap", onBeforeSwap);

    return () => {
      container.removeEventListener("click", onClick);
      lightbox.removeEventListener("click", onClose);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("astro:before-swap", onBeforeSwap);
      document.removeEventListener("pt:open-lightbox", onOpenFromCarousel);
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
