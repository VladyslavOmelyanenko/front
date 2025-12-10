// Guard against double-initialization when View Transitions
// reload this script on each new page.
if (!window.__NAV_SCRIPT_INITIALIZED__) {
  window.__NAV_SCRIPT_INITIALIZED__ = true;

  function initNav(instantInit = false) {
    const nav = document.getElementById("navBar");
    if (!nav) return;

    const items = Array.from(nav.querySelectorAll("li"));
    const highlight = nav.querySelector(".animation");
    const routes = JSON.parse(nav.dataset.routes || "[]");

    if (!highlight || items.length === 0) return;

    /* -----------------------------
        ROUTE CLEAN + INDEX LOGIC
    ------------------------------ */
    function clean(path) {
      return path === "/" ? "/" : path.replace(/\/+$/, "");
    }

    function computeIndex(path) {
      let p = clean(path);

      // During Astro View Transitions, use the persisted route if needed
      if (nav.dataset.persistedRoute && !routes.includes(p)) {
        p = clean(nav.dataset.persistedRoute);
      }

      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        if (p === route || p.startsWith(route + "/")) return i;
      }

      return -1;
    }

    /* -----------------------------
        HIGHLIGHT MOVING BAR
    ------------------------------ */
    function applyHighlight(index, instant = false) {
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

    function setActiveIndex(index, opts = { instant: false }) {
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

      applyHighlight(index, opts.instant);
    }

    function updateForCurrentPath(instant = false) {
      requestAnimationFrame(() => {
        const index = computeIndex(window.location.pathname);
        setActiveIndex(index, { instant });
      });

      // Avoid weird interactivity mid-transition
      nav.style.pointerEvents = "none";
      requestAnimationFrame(() => {
        nav.style.pointerEvents = "";
      });
    }

    /* -----------------------------
        EVENTS
    ------------------------------ */

    // Desktop hover highlight
    items.forEach((li, index) => {
      li.onmouseenter = () => applyHighlight(index);

      // Instant update on tap/click (mobile + desktop)
      li.addEventListener("click", () => {
        const a = li.querySelector("a");
        if (!a) return;

        try {
          const url = new URL(a.href, window.location.origin);
          const path = url.pathname;
          nav.dataset.persistedRoute = path;
        } catch {
          // ignore URL parsing failures
        }

        // Instantly mark this item active + move highlight
        setActiveIndex(index, { instant: true });
        // Let navigation proceed normally
      });
    });

    nav.onmouseleave = () => updateForCurrentPath(false);
    window.onresize = () => updateForCurrentPath(true);

    // Initial placement
    updateForCurrentPath(instantInit);
  }

  /* ======================================
     ASTRO EVENT HOOKS (View Transitions)
  ====================================== */

  // BEFORE SWAP: freeze current selection so it never flashes
  document.addEventListener("astro:before-swap", () => {
    const nav = document.getElementById("navBar");
    if (!nav) return;

    nav.classList.add("freeze-highlight");

    // Save current route to restore active state during transition
    nav.dataset.persistedRoute = window.location.pathname;
  });

  // AFTER SWAP: restore normal behavior + initialize instantly
  document.addEventListener("astro:after-swap", () => {
    const nav = document.getElementById("navBar");
    if (!nav) return;

    initNav(true);

    // Remove freeze after highlight is placed
    requestAnimationFrame(() => {
      nav.classList.remove("freeze-highlight");
    });

    // Mobile Safari hover reset hack
    const evt = new MouseEvent("mousemove", { bubbles: true });
    document.dispatchEvent(evt);
  });

  // Normal full reload
  document.addEventListener("astro:page-load", () => initNav(false));

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
