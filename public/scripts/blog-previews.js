function initBlogPreviews() {
  const SPEED = 100; // px/s
  const GAP = 40; // must match CSS padding-right

  document.querySelectorAll(".ticker[data-ticker]").forEach((ticker) => {
    const pill = ticker.closest(".blog-title, .blog-short-description");
    if (!pill) return;

    const original = ticker.querySelector(".t1");
    if (!original) return;

    const text = original.textContent || "";

    // rebuild clean: single copy, NO gap by default
    ticker.innerHTML = "";
    const base = document.createElement("span");
    base.className = "t1";
    base.textContent = text;
    ticker.appendChild(base);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const pillWidth = pill.clientWidth;
        const textWidth = base.scrollWidth;

        // ✅ only animate when actually cut off
        const isCutOff = textWidth > pillWidth;

        if (!isCutOff) {
          ticker.classList.remove("ticker--scrolling");
          ticker.style.removeProperty("--ticker-duration");
          return;
        }

        // enable scrolling mode (adds CSS gap)
        ticker.classList.add("ticker--scrolling");

        // build enough repeats for smooth loop
        const target = pillWidth * 2;
        const copiesNeeded = Math.max(2, Math.ceil(target / (textWidth + GAP)));

        for (let i = 1; i < copiesNeeded; i++) {
          const copy = base.cloneNode(true);
          copy.className = i === 1 ? "t2" : "t1";
          ticker.appendChild(copy);
        }

        // constant speed
        const duration = (textWidth + GAP) / SPEED;
        ticker.style.setProperty("--ticker-duration", `${duration}s`);
      });
    });
  });
}

document.addEventListener("astro:page-load", initBlogPreviews);
document.addEventListener("astro:after-swap", initBlogPreviews);
window.addEventListener("resize", initBlogPreviews);
