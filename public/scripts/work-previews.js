function initWorkPreviews() {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(
    navigator.userAgent
  );

  const SPEED_DESKTOP = 150;
  const SPEED_MOBILE = 60;
  const SPEED = isMobile ? SPEED_MOBILE : SPEED_DESKTOP;

  const ROTATE_INTERVAL_DESKTOP = 300;
  const ROTATE_INTERVAL_MOBILE = 5000;
  const ROTATE_INTERVAL = isMobile
    ? ROTATE_INTERVAL_MOBILE
    : ROTATE_INTERVAL_DESKTOP;

  // --- TEXT TICKER ---
  document.querySelectorAll("[data-ticker]").forEach((ticker) => {
    const singleWidth = ticker.scrollWidth / 2;
    const duration = singleWidth / SPEED;
    ticker.style.setProperty("--ticker-duration", `${duration}s`);
  });

  // --- IMAGE ROTATION ---
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
      row.onmouseenter = startRotation;
      row.onmouseleave = stopRotation;
    }
  });
}

document.addEventListener("astro:page-load", initWorkPreviews);
document.addEventListener("astro:after-swap", initWorkPreviews);
