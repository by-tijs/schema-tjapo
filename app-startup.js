"use strict";

// Reveal one populated screen. Authentication still decides which screen is allowed.
window.AppStartup = (() => {
  let fallback, revealed = false, preparing = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    clearTimeout(fallback);
    document.documentElement.classList.remove("app-booting");
  }
  function start({ profile = false } = {}) {
    const installed = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    if (installed && !new URLSearchParams(location.hash.slice(1)).has("activate")) {
      history.replaceState(null, "", `${location.pathname}${location.search}#train`);
    }
    // Slow connections may show the existing loading screen, never a premature login form.
    if (profile) fallback = setTimeout(reveal, 600);
  }
  async function ready() {
    if (revealed || preparing) return;
    preparing = true;
    clearTimeout(fallback);
    if (document.fonts?.ready) {
      await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 150))]);
    }
    requestAnimationFrame(reveal);
  }
  return { start, ready };
})();
