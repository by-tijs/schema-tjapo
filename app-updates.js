"use strict";

window.AppUpdates = {
  init({ version, profile, save }) {
    const banner = document.getElementById("app-update-banner");
    const status = document.getElementById("app-update-status");
    const buttons = [...document.querySelectorAll("[data-app-update]")];
    const description = `Schema ${profile} · versie ${version}`;
    let lastCheck = 0;
    let inFlight = null;
    let updating = false;
    status.textContent = description;

    async function check(force = false) {
      if (inFlight) return inFlight;
      if (!force && Date.now() - lastCheck < 60000) return null;
      lastCheck = Date.now();
      inFlight = (async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
          const url = new URL("app-version.json", location.href);
          url.searchParams.set("t", Date.now());
          const response = await fetch(url, { cache: "no-store", signal: controller.signal });
          if (!response.ok) throw new Error("Version unavailable");
          const release = await response.json();
          if (!/^\d+$/.test(String(release.version))) throw new Error("Invalid version");
          const available = Number(release.version) > Number(version);
          banner.hidden = !available;
          status.textContent = available ? `${description} · update beschikbaar` : description;
          return String(release.version);
        } catch {
          if (force) status.textContent = `${description} · bijwerken lukt nu niet. Probeer het straks opnieuw.`;
          return null;
        } finally {
          clearTimeout(timeout);
          inFlight = null;
        }
      })();
      return inFlight;
    }

    async function update() {
      if (updating) return;
      updating = true;
      buttons.forEach((button) => { button.disabled = true; });
      try {
        const latest = await check(true);
        if (!latest) return;
        // Persist both the workout and its pending-sync marker before navigating.
        // If local storage fails, leave the current app and its inputs open.
        save();
        const url = new URL(location.href);
        url.searchParams.set("v", latest);
        if (url.href === location.href) location.reload();
        else location.replace(url.href);
      } catch {
        status.textContent = `${description} · opslaan lukt niet. Maak eerst een export van je voortgang.`;
      } finally {
        updating = false;
        buttons.forEach((button) => { button.disabled = false; });
      }
    }

    buttons.forEach((button) => button.addEventListener("click", update));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check();
    });
    window.addEventListener("pageshow", () => check());
    window.addEventListener("online", () => check(true));
    setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, 5 * 60000);
    check();
  },
};
