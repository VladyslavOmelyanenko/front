function initNav(instantInit = false) {
  const nav = document.getElementById("navBar");
  if (!nav) return;

  const items = Array.from(nav.querySelectorAll("li"));
  const highlight = nav.querySelector(".animation");
  const routes = JSON.parse(nav.dataset.routes || "[]");

  function clean(path) {
    return path === "/" ? "/" : path.replace(/\/+$/, "");
  }

  function computeIndex(path) {
    const p = clean(path);
    if (p === "/") return -1;

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      if (p === route || p.startsWith(route + "/")) return i;
    }
    return -1;
  }

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
      highlight.offsetHeight;
      highlight.style.transition = "";
    }
  }

  function updateForCurrentPath(instant = false) {
    requestAnimationFrame(() => {
      const index = computeIndex(window.location.pathname);

      items.forEach((li) => li.querySelector("a").classList.remove("active"));

      if (index >= 0 && items[index]) {
        items[index].querySelector("a").classList.add("active");
      }

      applyHighlight(index, instant);
    });

    nav.style.pointerEvents = "none";
    requestAnimationFrame(() => (nav.style.pointerEvents = ""));
  }

  items.forEach((li, index) => {
    li.onmouseenter = () => applyHighlight(index);
  });

  nav.onmouseleave = () => updateForCurrentPath(false);
  window.onresize = () => updateForCurrentPath(true);

  updateForCurrentPath(instantInit);
}

// REAL RELOAD → normal animation
document.addEventListener("astro:page-load", () => initNav(false));

// ===========================================
// OPTION A FIX — DISABLE HOVER DURING SWITCH
// ===========================================
document.addEventListener("astro:after-swap", () => {
  const nav = document.getElementById("navBar");
  if (!nav) return;

  // Prevent color flicker during transition
  nav.classList.add("nav-disable-hover");

  initNav(true);

  // remove the protection on next frame AFTER highlight is placed
  requestAnimationFrame(() => {
    nav.classList.remove("nav-disable-hover");
  });

  // force browser to reset ghost hover state on mobile
  const evt = new MouseEvent("mousemove", { bubbles: true });
  document.dispatchEvent(evt);
});

// --- NAV HIDE ON SCROLL ---
let lastScrollY = window.scrollY;
