// nav.js
// Minimal nav behavior: hide/show on scroll.
// No active link logic, no highlight animation, no Astro transition syncing.

(function initNavOnce() {
  if (window.__NAV_SCRIPT_INITIALIZED__) return;
  window.__NAV_SCRIPT_INITIALIZED__ = true;

  let lastScrollY = window.scrollY;

function handleScrollHideNav() {
  const navBar = document.getElementById("navBar");
  const postNav = document.querySelector(".nav-post-wrapper");

  const current = window.scrollY;

  const shouldHide = current > lastScrollY;

  if (navBar) navBar.classList.toggle("nav-bar--hidden", shouldHide);
  if (postNav) postNav.classList.toggle("nav-bar--hidden", shouldHide);

  lastScrollY = current;
}

  window.addEventListener("scroll", handleScrollHideNav, { passive: true });

  // If you use Astro view transitions, the DOM can swap without a full reload.
  // This keeps the state correct after swaps.
  document.addEventListener("astro:after-swap", () => {
    lastScrollY = window.scrollY;
    handleScrollHideNav();
  });

  document.addEventListener("astro:page-load", () => {
    lastScrollY = window.scrollY;
    handleScrollHideNav();
  });
})();
