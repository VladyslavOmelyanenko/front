function initWorkPreviews() {
  const SPEED = 150;
  const ROTATE_INTERVAL = 300;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  // Text ticker
  document.querySelectorAll("[data-ticker]").forEach((ticker) => {
    const singleWidth = ticker.scrollWidth / 2;
    const duration = singleWidth / SPEED;
    ticker.style.setProperty("--ticker-duration", `${duration}s`);
  });

  // Image rotation
  document.querySelectorAll(".work-preview").forEach((row) => {
    const imgs = row.querySelectorAll(".work-image");
    const urls = JSON.parse(row.dataset.images || "[]");

    if (!urls.length || urls.length <= imgs.length) return;

    let startIndex = 0;
    let intervalId;

    const updateImages = () => {
      imgs.forEach((img, i) => {
        img.src = urls[(startIndex + i) % urls.length];
      });
    };

    const startRotation = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        startIndex = (startIndex + 1) % urls.length;
        updateImages();
      }, ROTATE_INTERVAL);
    };

    const stopRotation = () => {
      clearInterval(intervalId);
      intervalId = null;
    };

    if (isMobile) {
      startRotation();
    } else {
      row.addEventListener("mouseenter", startRotation);
      row.addEventListener("mouseleave", stopRotation);
    }
  });
}

// Run on initial load
document.addEventListener("astro:page-load", initWorkPreviews);
// Run after any view transition
document.addEventListener("astro:after-swap", initWorkPreviews);
