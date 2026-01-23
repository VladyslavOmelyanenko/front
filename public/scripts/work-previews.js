// /public/scripts/work-previews.js

function initWorkPreviews() {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(
    navigator.userAgent,
  );

  const SPEED_DESKTOP = 200;
  const SPEED_MOBILE = 60;
  const SPEED = isMobile ? SPEED_MOBILE : SPEED_DESKTOP;

  const ROTATE_INTERVAL_DESKTOP = 350;
  const ROTATE_INTERVAL_MOBILE = 600;
  const ROTATE_INTERVAL = isMobile
    ? ROTATE_INTERVAL_MOBILE
    : ROTATE_INTERVAL_DESKTOP;

  // -------------------------
  // TEXT TICKER (only if overflow)
  // -------------------------
document.querySelectorAll("[data-ticker]").forEach((ticker) => {
  const parent = ticker.closest(".work-short-description");
  if (!parent) return;

  const t1 = ticker.querySelector(".t1");
  if (!t1) return;

  // measure without scrolling first (detect overflow)
  const visibleWidth = parent.clientWidth;
  const baseWidth = t1.scrollWidth;

  const isOverflowing = baseWidth > visibleWidth + 2;

  if (!isOverflowing) {
    ticker.classList.remove("is-scrolling");
    ticker.style.setProperty("--ticker-duration", "0s");
    ticker.style.setProperty("--ticker-distance", "0px");
    return;
  }

  // ✅ apply scrolling class FIRST so padding-right kicks in
  ticker.classList.add("is-scrolling");

  // ✅ force reflow so CSS is applied before measuring
  void ticker.offsetWidth;

  // ✅ now measure exact scroll distance including the gap (padding-right:40px)
  const distance = t1.getBoundingClientRect().width;

  ticker.style.setProperty("--ticker-distance", `${distance}px`);

  const duration = distance / SPEED;
  ticker.style.setProperty("--ticker-duration", `${duration}s`);
});



  // -------------------------
  // IMAGE ROTATION (no duplicate intervals on swaps)
  // -------------------------
  document.querySelectorAll(".work-preview").forEach((row) => {
    const imgs = row.querySelectorAll(".work-image");
    const urls = JSON.parse(row.dataset.images || "[]");

    if (!urls.length || urls.length <= imgs.length) return;

    // ✅ clear previous interval if re-init happens
    if (row.__rotateIntervalId) {
      clearInterval(row.__rotateIntervalId);
      row.__rotateIntervalId = null;
    }

    // ✅ keep index between inits (optional)
    if (typeof row.__rotateIndex !== "number") row.__rotateIndex = 0;

    const updateImages = () => {
      imgs.forEach((img, i) => {
        img.src = urls[(row.__rotateIndex + i) % urls.length];
      });
    };

    const startRotation = () => {
      if (row.__rotateIntervalId) return;
      row.__rotateIntervalId = setInterval(() => {
        row.__rotateIndex = (row.__rotateIndex + 1) % urls.length;
        updateImages();
      }, ROTATE_INTERVAL);
    };

    const stopRotation = () => {
      if (row.__rotateIntervalId) {
        clearInterval(row.__rotateIntervalId);
        row.__rotateIntervalId = null;
      }
    };

    // ✅ set initial images once
    updateImages();

    // ✅ remove previous hover handlers safely
    if (row.__hoverStart)
      row.removeEventListener("mouseenter", row.__hoverStart);
    if (row.__hoverStop) row.removeEventListener("mouseleave", row.__hoverStop);

    // ✅ ticker hover smooth (restart animation to avoid jump)
    if (row.__tickerEnter)
      row.removeEventListener("mouseenter", row.__tickerEnter);
    if (row.__tickerLeave)
      row.removeEventListener("mouseleave", row.__tickerLeave);

    if (isMobile) {
      // mobile: rotate automatically
      startRotation();
    } else {
      // desktop: rotate only on hover
      row.__hoverStart = startRotation;
      row.__hoverStop = stopRotation;

      row.addEventListener("mouseenter", row.__hoverStart);
      row.addEventListener("mouseleave", row.__hoverStop);

      // ✅ restart ticker cleanly on hover (prevents jumping)
      row.__tickerEnter = () => {
        row
          .querySelectorAll(
            ".work-short-description [data-ticker].is-scrolling",
          )
          .forEach((ticker) => {
            ticker.style.animation = "none";
            void ticker.offsetHeight; // force reflow
            ticker.style.animation = "";
            ticker.style.animationPlayState = "running";
          });
      };

      row.__tickerLeave = () => {
        row
          .querySelectorAll(
            ".work-short-description [data-ticker].is-scrolling",
          )
          .forEach((ticker) => {
            ticker.style.animationPlayState = "paused";
          });
      };

      row.addEventListener("mouseenter", row.__tickerEnter);
      row.addEventListener("mouseleave", row.__tickerLeave);
    }
  });
}

// ✅ only this one (astro:page-load fires on initial + swaps)
document.addEventListener("astro:page-load", initWorkPreviews);
