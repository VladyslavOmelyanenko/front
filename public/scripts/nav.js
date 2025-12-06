// FINAL NAV HIGHLIGHT SCRIPT (reload behaves differently from client navigation)
// ------------------------------------------------------------------------------

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
      highlight.offsetHeight; // force reflow
      highlight.style.transition = ""; // restore animations
    }
  }

  function updateForCurrentPath(instant = false) {
    requestAnimationFrame(() => {
      const index = computeIndex(window.location.pathname);

      // Remove old active states
      items.forEach((li) => li.querySelector("a").classList.remove("active"));

      // Apply new active state
      if (index >= 0 && items[index]) {
        items[index].querySelector("a").classList.add("active");
      }

      applyHighlight(index, instant);
    });
  }

  items.forEach((li, index) => {
    li.addEventListener("mouseenter", () => applyHighlight(index));
  });

  nav.addEventListener("mouseleave", () => updateForCurrentPath(false));

  window.addEventListener("resize", () => updateForCurrentPath(true));

  // Initial placement
  updateForCurrentPath(instantInit);
}

// REAL RELOAD → normal animation (instantInit = false)
document.addEventListener("astro:page-load", () => initNav(false));

// CLIENT NAVIGATION → avoid slide-from-zero (instantInit = true)
document.addEventListener("astro:after-swap", () => initNav(true));
