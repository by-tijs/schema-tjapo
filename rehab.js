"use strict";

window.Rehab = (() => {
  let root;
  let options;
  const weeks = window.REHAB_PLAN;
  const record = (value) => value && typeof value === "object" && !Array.isArray(value);
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

  function getNote(state, weekId, dayId, exerciseId) {
    const value = state.rehab?.weeks?.[weekId]?.[dayId]?.[exerciseId];
    return typeof value === "string" ? value : "";
  }

  function getData(state) {
    if (!record(state.rehab)) state.rehab = {};
    if (!record(state.rehab.weeks)) state.rehab.weeks = {};
    return state.rehab;
  }

  function setNote(state, weekId, dayId, exerciseId, text) {
    const day = weeks.find((week) => week.id === weekId)?.days.find((item) => item.id === dayId);
    if (!day?.exercises.some((exercise) => exercise.id === exerciseId)) return false;
    const data = getData(state);
    if (!record(data.weeks[weekId])) data.weeks[weekId] = {};
    if (!record(data.weeks[weekId][dayId])) data.weeks[weekId][dayId] = {};
    data.weeks[weekId][dayId][exerciseId] = String(text);
    return true;
  }

  function hasNotes(state) {
    return Object.values(state?.rehab?.weeks || {}).some((week) => record(week)
      && Object.values(week).some((day) => record(day)
        && Object.values(day).some((note) => typeof note === "string" && note.trim())));
  }

  function weekText(state, weekId) {
    const week = weeks.find((item) => item.id === weekId);
    if (!week) return "";
    return [`Rehab Tijs — ${week.label}`, ...week.days.map((day) => [
      day.label,
      ...day.exercises.map((exercise) => `${exercise.name}\n${getNote(state, week.id, day.id, exercise.id).trim() || "Geen opmerkingen"}`),
    ].join("\n\n"))].join("\n\n");
  }

  function selection() {
    const data = options.getState().rehab;
    const week = weeks.find((item) => item.id === data?.selectedWeek) || weeks[0];
    const day = week.days.find((item) => item.id === data?.selectedDay) || week.days[0];
    return { week, day };
  }

  function resize(input) {
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }

  function resizeNotes() {
    root?.querySelectorAll("[data-rehab-note]").forEach(resize);
  }

  function render() {
    if (!root) return;
    const { week, day } = selection();
    root.innerHTML = `
      <div class="workbench">
        <aside class="side-panel">
          <div class="session-rail" aria-label="Rehabdagen">
            ${week.days.map((item) => `<button type="button" class="session-chip${item.id === day.id ? " is-active" : ""}"
              data-rehab-day="${item.id}" aria-pressed="${item.id === day.id}"><strong>${item.label}</strong></button>`).join("")}
          </div>
        </aside>
        <section class="training-panel">
          <div class="session-heading">
            <div class="session-title-block">
              <h1 id="rehab-title">${day.label}</h1>
              <span class="session-time-estimate">Rehab · ${week.label}</span>
            </div>
            <label class="field rehab-week-field"><span>Week</span>
              <select data-rehab-week aria-label="Rehabweek">${weeks.map((item) => `<option value="${item.id}"${item.id === week.id ? " selected" : ""}>${item.label}</option>`).join("")}</select>
            </label>
          </div>
          <div class="exercise-list">
            ${day.exercises.map((exercise, index) => `
              <article class="exercise-card rehab-exercise">
                <header class="exercise-head">
                  <span class="exercise-index">${String(index + 1).padStart(2, "0")}</span>
                  <div class="exercise-title">
                    <h3>${escape(exercise.name)}</h3>
                    <span class="exercise-subtitle">${escape(exercise.prescription)}</span>
                  </div>
                </header>
                <div class="exercise-note">
                  <textarea rows="1" data-rehab-note="${exercise.id}" aria-label="Opmerking bij ${escape(exercise.name)}" placeholder="Opmerking toevoegen…">${escape(getNote(options.getState(), week.id, day.id, exercise.id))}</textarea>
                </div>
              </article>`).join("")}
          </div>
          <div class="finish-bar rehab-copy-bar">
            <button class="primary-button" type="button" data-rehab-copy><i data-lucide="copy"></i><span>Kopieer ${week.label.toLowerCase()}</span></button>
            <span class="record-meta">Alle vier dagen, met jouw opmerkingen.</span>
            <details class="rehab-preview">
              <summary>Weektekst bekijken</summary>
              <textarea rows="12" readonly aria-label="Tekst om te kopiëren" data-rehab-text>${escape(weekText(options.getState(), week.id))}</textarea>
            </details>
            <span class="record-meta rehab-copy-status" role="status" aria-live="polite"></span>
          </div>
        </section>
      </div>`;
    resizeNotes();
    options.refreshIcons();
  }

  async function copyWeek() {
    const text = weekText(options.getState(), selection().week.id);
    const status = root.querySelector(".rehab-copy-status");
    const preview = root.querySelector(".rehab-preview");
    const field = root.querySelector("[data-rehab-text]");
    field.value = text;
    options.flush();
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Gekopieerd. Je kunt de tekst nu doorsturen.";
    } catch {
      preview.open = true;
      field.focus();
      field.select();
      field.setSelectionRange(0, text.length);
      status.textContent = "Kopieer de geselecteerde tekst via het tekstmenu van je telefoon of met Ctrl/Cmd+C.";
    }
  }

  function mount(settings) {
    root = null;
    if (!settings.enabled) {
      document.querySelectorAll("[data-rehab-owner]").forEach((element) => element.remove());
      return;
    }
    options = settings;
    root = document.querySelector('[data-view="rehab"]');
    document.querySelectorAll("[data-rehab-owner]").forEach((element) => { element.hidden = false; });
    document.querySelector(".view-tabs").style.setProperty("--view-count", "5");
    root.addEventListener("click", (event) => {
      // Rehab cards have no set controls; don't delegate their headings to Train.
      event.stopPropagation();
      const dayButton = event.target.closest("[data-rehab-day]");
      if (dayButton) {
        getData(options.getState()).selectedDay = dayButton.dataset.rehabDay;
        options.save();
        render();
        root.querySelector(`[data-rehab-day="${selection().day.id}"]`).focus({ preventScroll: true });
      }
      if (event.target.closest("[data-rehab-copy]")) void copyWeek();
    });
    root.addEventListener("change", (event) => {
      if (!event.target.matches("[data-rehab-week]")) return;
      getData(options.getState()).selectedWeek = event.target.value;
      options.save();
      render();
      root.querySelector("[data-rehab-week]").focus({ preventScroll: true });
    });
    root.addEventListener("input", (event) => {
      if (!event.target.matches("[data-rehab-note]")) return;
      const { week, day } = selection();
      setNote(options.getState(), week.id, day.id, event.target.dataset.rehabNote, event.target.value);
      options.save();
      resize(event.target);
      root.querySelector("[data-rehab-text]").value = weekText(options.getState(), week.id);
      root.querySelector(".rehab-copy-status").textContent = "";
    });
  }

  return { mount, render, resizeNotes, getNote, setNote, hasNotes, weekText };
})();
