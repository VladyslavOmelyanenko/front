console.log('fajkldfjlakjflks');

function initBlogPreviews() {
  const SPEED = 100; // px/s

  document.querySelectorAll("[data-ticker]").forEach((ticker) => {
    // fully rebuild the ticker to avoid stale state
    const container = ticker.parentElement;
    const original = ticker.querySelector(".ticker-text");
    if (!original || !container) return;

    // Save original text
    const text = original.textContent;

    // Clear ticker completely and rebuild
    ticker.innerHTML = "";
    const textEl = document.createElement("span");
    textEl.className = "ticker-text";
    textEl.textContent = text;
    ticker.appendChild(textEl);

    // Wait until layout has stabilized
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const textWidth = textEl.scrollWidth;
        const containerWidth = container.offsetWidth;

        // If text fits → no scrolling
        if (textWidth <= containerWidth) return;

        // Clone second copy
        const clone = textEl.cloneNode(true);
        ticker.appendChild(clone);

        const duration = textWidth / SPEED;

        // Reset animation (important!)
        ticker.style.animation = "none";
        ticker.offsetHeight; // force reflow
        ticker.style.animation = "";

        ticker.style.setProperty("--ticker-duration", `${duration}s`);
        ticker.classList.add("ticker--scrolling");
      });
    });
  });
}

document.addEventListener("astro:page-load", initBlogPreviews);
document.addEventListener("astro:after-swap", initBlogPreviews);
