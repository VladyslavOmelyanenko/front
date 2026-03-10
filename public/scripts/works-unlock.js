// /public/scripts/works-unlock.js
(() => {
  const elTarget = (e) =>
    e?.target instanceof Element ? e.target : e?.target?.parentElement;

  function getOverlay() {
    return document.querySelector("[data-unlock-overlay]");
  }

  function openOverlay() {
    const overlay = getOverlay();
    if (!overlay) return;

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");

    const input = overlay.querySelector("input[name='password']");
    if (input) setTimeout(() => input.focus(), 0);
  }

  function closeOverlay() {
    const overlay = getOverlay();
    if (!overlay) return;

    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");

    const err = overlay.querySelector("[data-unlock-error]");
    if (err) err.hidden = true;
  }

  async function syncUnlockedUIFromCookie() {
    try {
      const r = await fetch("/.netlify/functions/private-ui-status", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await r.json().catch(() => null);
      const unlocked = !!data?.unlocked;
      document.documentElement.classList.toggle("works-unlocked", unlocked);
      return unlocked;
    } catch {
      document.documentElement.classList.remove("works-unlocked");
      return false;
    }
  }

  function handleUnlockRedirectParams() {
    const url = new URL(window.location.href);

    if (url.searchParams.get("unlock") === "open") {
      openOverlay();
      url.searchParams.delete("unlock");
      window.history.replaceState({}, "", url.pathname + url.search);
    }

    if (url.searchParams.get("unlock") === "fail") {
      openOverlay();
      const overlay = getOverlay();
      const err = overlay?.querySelector("[data-unlock-error]");
      if (err) err.hidden = false;
      url.searchParams.delete("unlock");
      window.history.replaceState({}, "", url.pathname + url.search);
    }

    if (url.searchParams.get("unlock") === "ok") {
      // cookie is set; just sync UI from cookie
      url.searchParams.delete("unlock");
      window.history.replaceState({}, "", url.pathname + url.search);
      syncUnlockedUIFromCookie();
    }
  }

  function bindUnlockFormOnce() {
    const overlay = getOverlay();
    if (!overlay) return;

    const form = overlay.querySelector("[data-unlock-form]");
    if (!form || form.__bound) return;
    form.__bound = true;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const errorEl = overlay.querySelector("[data-unlock-error]");
      if (errorEl) errorEl.hidden = true;

      const input = form.querySelector("input[name='password']");
      const btn = form.querySelector("button[type='submit']");
      if (btn) btn.disabled = true;

      try {
        const body = new URLSearchParams(new FormData(form)).toString();

        const res = await fetch(form.action, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body,
          credentials: "include",
        });

        const data = await res.json().catch(() => null);

        if (!data?.ok) {
          if (errorEl) errorEl.hidden = false;
          if (input) {
            input.focus();
            input.select();
          }
          return;
        }

        // ✅ cookie was set by server, now sync UI from cookie
        await syncUnlockedUIFromCookie();

        if (input) input.value = "";
        closeOverlay();
      } catch (err) {
        console.warn("Unlock submit error:", err);
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = "Error. Try again.";
        }
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  function initOnEveryNavigation() {
    closeOverlay();
    handleUnlockRedirectParams();
    bindUnlockFormOnce();
    syncUnlockedUIFromCookie();
  }

  function onClick(e) {
    const t = elTarget(e);
    if (!t) return;

    // locked link click -> if not unlocked, prevent + open overlay
    const lockedLink = t.closest?.("a[data-locked='true']");
    if (
      lockedLink &&
      !document.documentElement.classList.contains("works-unlocked")
    ) {
      e.preventDefault();
      e.stopPropagation();
      openOverlay();
      return;
    }

    if (t.closest?.("[data-unlock-backdrop]")) {
      closeOverlay();
      return;
    }
  }

  function onKeydown(e) {
    if (e.key === "Escape") closeOverlay();
  }

  if (!window.__worksUnlockBound) {
    document.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeydown);
    window.__worksUnlockBound = true;
  }

  document.addEventListener("astro:page-load", initOnEveryNavigation);
  initOnEveryNavigation();
})();
