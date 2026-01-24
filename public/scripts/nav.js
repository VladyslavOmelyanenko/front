// // nav.js
// // Hide/show nav on scroll, Safari-bounce safe.

// (function initNavOnce() {
//   if (window.__NAV_SCRIPT_INITIALIZED__) return;
//   window.__NAV_SCRIPT_INITIALIZED__ = true;

//   let lastY = Math.max(0, window.scrollY || 0);
//   let ticking = false;

//   // Tune these:
//   const DELTA_PX = 6; // ignore tiny jitter
//   const TOP_LOCK_PX = 24; // never hide when near very top
//   const SHOW_ON_BOUNCE_TOP = true;

//   function setHidden(hidden) {
//     const navBar = document.getElementById("navBar");
//     const postNav = document.querySelector(".nav-post-wrapper");
//     if (navBar) navBar.classList.toggle("nav-bar--hidden", hidden);
//     if (postNav) postNav.classList.toggle("nav-bar--hidden", hidden);
//   }

//   function onScroll() {
//     if (ticking) return;
//     ticking = true;

//     requestAnimationFrame(() => {
//       ticking = false;

//       // Clamp: Safari can report negative scrollY during rubber-band
//       const rawY = window.scrollY || 0;
//       const y = Math.max(0, rawY);

//       // Always show at/near top (prevents weird hide on bounce)
//       if (y <= TOP_LOCK_PX) {
//         setHidden(false);
//         lastY = y;
//         return;
//       }

//       // Ignore jitter
//       const dy = y - lastY;
//       if (Math.abs(dy) < DELTA_PX) return;

//       // If user scrolls down => hide, up => show
//       if (dy > 0) {
//         setHidden(true);
//       } else {
//         setHidden(false);
//       }

//       lastY = y;
//     });
//   }

//   window.addEventListener("scroll", onScroll, { passive: true });

//   // Keep state correct after Astro swaps
//   function resync() {
//     lastY = Math.max(0, window.scrollY || 0);
//     if (SHOW_ON_BOUNCE_TOP && lastY <= TOP_LOCK_PX) setHidden(false);
//     onScroll();
//   }

//   document.addEventListener("astro:after-swap", resync);
//   document.addEventListener("astro:page-load", resync);
// })();
