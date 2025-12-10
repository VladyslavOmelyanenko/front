// Prevent double-initialization across transitions
if (!window.__NAV_SCRIPT_INITIALIZED__) {
  window.__NAV_SCRIPT_INITIALIZED__ = true;

  function getNavParts() {
    const nav = document.getElementById("navBar");
    if (!nav) return null;

    const items = Array.from(nav.querySelectorAll("li"));
    const highlight = nav.querySelector(".animation");
    const routes = JSON.parse(nav.dataset.routes || "[]");

    if (!highlight || items.length === 0) return null;

    return { nav, items, highlight, routes };
  }

  function cleanPath(path) {
    return path === "/" ? "/" : path.replace(/\/+$/, "");
  }

  function computeIndex(path, routes) {
    const p = cleanPath(path);
    if (p === "/") return -1;

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      if (p === route || p.startsWith(route + "/")) return i;
    }
    return -1;
  }

  function applyHighlight(parts, index, instant = false) {
    const { items, highlight } = parts;

    if (instant) {
      highlight.style.transition = "none";
    }

    if (index < 0 || !items[index]) {
      highlight.style.width = "0px";
      highlight.style.transform = "translateX(0px)";
    } else {
      const li = items[index];
      highlight.style.width = `${li.offsetWidth}px`;
      highlight.style.transform = `translateX(${li.offsetLeft}px)`;
    }

    if (instant) {
      // force reflow, then restore transitions
      // eslint-disable-next-line no-unused-expressions
      highlight.offsetHeight;
      highlight.style.transition = "";
    }
  }

  function setActiveIndex(parts, index, { instant = false } = {}) {
    const { items } = parts;

    // Clear all active
    items.forEach((li) => {
      const a = li.querySelector("a");
      if (a) a.classList.remove("active");
    });

    // Apply active
    if (index >= 0 && items[index]) {
      const a = items[index].querySelector("a");
      if (a) a.classList.add("active");
    }

    applyHighlight(parts, index, instant);
  }

  function updateNavForPath(path, { instant = false } = {}) {
    const parts = getNavParts();
    if (!parts) return;

    const { nav, routes } = parts;
    const index = computeIndex(path, routes);

    requestAnimationFrame(() => {
      setActiveIndex(parts, index, { instant });

      // Optional: temporary pointer-events guard
      nav.style.pointerEvents = "none";
      requestAnimationFrame(() => {
        nav.style.pointerEvents = "";
      });
    });
  }

  function initNav(instantInit = false) {
    const parts = getNavParts();
    if (!parts) return;

    const { nav, items } = parts;

    // Initial placement, based on current URL
    updateNavForPath(window.location.pathname, { instant: instantInit });

    // Hover highlight (desktop)
    items.forEach((li, index) => {
      li.onmouseenter = () => {
        const innerParts = getNavParts();
        if (!innerParts) return;
        applyHighlight(innerParts, index, false);
      };
    });

    // Reset highlight to active on mouse leave
    nav.onmouseleave = () => {
      updateNavForPath(window.location.pathname, { instant: false });
    };

    // On resize, recalc position instantly
    window.onresize = () => {
      updateNavForPath(window.location.pathname, { instant: true });
    };
  }

  /* ======================================
     ASTRO VIEW TRANSITION EVENTS
  ====================================== */

  // 🔥 As soon as navigation starts, update nav to the *incoming* path
  document.addEventListener("astro:before-preparation", (event) => {
    const toUrl = event.to || new URL(window.location.href);
    const path = toUrl.pathname;

    updateNavForPath(path, { instant: true });
  });

  // After contents swap, just re-sync (for layout changes, etc.)
  document.addEventListener("astro:after-swap", () => {
    initNav(true);
  });

  // On full page load
  document.addEventListener("astro:page-load", () => {
    initNav(false);
  });

  /* ======================================
     NAV HIDE ON SCROLL
  ====================================== */
  let lastScrollY = window.scrollY;

  function handleScrollHideNav() {
    const nav = document.getElementById("navBar");
    if (!nav) return;

    const current = window.scrollY;

    if (current > lastScrollY) {
      nav.classList.add("nav-bar--hidden");
    } else {
      nav.classList.remove("nav-bar--hidden");
    }

    lastScrollY = current;
  }

  window.addEventListener("scroll", handleScrollHideNav, { passive: true });
}
