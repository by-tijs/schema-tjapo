"use strict";

window.Rehab = (() => {
  let root;
  let options;
  let selectedWeekId;
  let calendarWeekId;
  const expandedExercises = new Set();
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

  function isExerciseComplete(state, weekId, dayId, exerciseId) {
    return state.rehab?.progress?.[weekId]?.[dayId]?.[exerciseId] === true;
  }

  function dayProgress(state, weekId, dayId) {
    const day = weeks.find((week) => week.id === weekId)?.days.find((item) => item.id === dayId);
    const total = day?.exercises.length || 0;
    const done = day?.exercises.filter((exercise) => isExerciseComplete(state, weekId, dayId, exercise.id)).length || 0;
    return { percent: total ? Math.round(done / total * 100) : 0, complete: total > 0 && done === total };
  }

  function setExerciseComplete(state, weekId, dayId, exerciseId, complete) {
    const day = weeks.find((week) => week.id === weekId)?.days.find((item) => item.id === dayId);
    if (!day?.exercises.some((exercise) => exercise.id === exerciseId)) return false;
    const data = getData(state);
    if (!record(data.progress)) data.progress = {};
    if (!record(data.progress[weekId])) data.progress[weekId] = {};
    if (!record(data.progress[weekId][dayId])) data.progress[weekId][dayId] = {};
    // Keep explicit false values so reopening a day also survives cloud sync.
    data.progress[weekId][dayId][exerciseId] = Boolean(complete);
    return true;
  }

  function setDayComplete(state, weekId, dayId, complete) {
    const day = weeks.find((week) => week.id === weekId)?.days.find((item) => item.id === dayId);
    if (!day?.exercises.length) return false;
    day.exercises.forEach((exercise) => setExerciseComplete(state, weekId, dayId, exercise.id, complete));
    return true;
  }

  function hasData(state) {
    return hasNotes(state) || Object.values(state?.rehab?.progress || {}).some((week) => record(week)
      && Object.values(week).some((day) => record(day)
        && Object.values(day).some((complete) => typeof complete === "boolean")));
  }

  function weekText(state, weekId) {
    const week = weeks.find((item) => item.id === weekId);
    if (!week) return "";
    if (!week.days.some((day) => day.exercises.length)) return `Rehab Tijs — ${week.label}\n\nSchema volgt nog.`;
    return [`Rehab Tijs — ${week.label}`, ...week.days.map((day) => [
      day.label,
      ...day.exercises.map((exercise) => `*${exercise.name}* — ${exercise.prescription}\n${getNote(state, week.id, day.id, exercise.id).trim() || "Geen opmerkingen"}`),
    ].join("\n\n"))].join("\n\n");
  }

  function currentWeek(date = new Date()) {
    // Compare calendar dates in the schedule's timezone, including DST changes.
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(date).map((part) => [part.type, part.value]));
    const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
    return weeks.filter((week) => week.startDate <= dateKey).at(-1) || weeks[0];
  }

  function weekDates(week) {
    const start = new Date(`${week.startDate}T12:00:00Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    const format = new Intl.DateTimeFormat("nl-NL", { timeZone: "UTC", day: "numeric", month: "short" });
    return `${format.format(start)} – ${format.format(end)}`;
  }

  function open() {
    if (!root) return;
    calendarWeekId = currentWeek(options.now()).id;
    selectedWeekId = calendarWeekId;
    expandedExercises.clear();
    render();
  }

  function resume() {
    // Keep a manually selected week during this visit, but advance after a new
    // calendar week starts while the installed app was in the background.
    if (root && calendarWeekId !== currentWeek(options.now()).id) open();
  }

  function selection() {
    const data = options.getState().rehab;
    const week = weeks.find((item) => item.id === selectedWeekId) || currentWeek(options.now());
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
    const hasExercises = week.days.some((item) => item.exercises.length);
    const progress = dayProgress(options.getState(), week.id, day.id);
    root.innerHTML = `
      <div class="workbench">
        <aside class="side-panel">
          <div class="session-rail rehab-days" aria-label="Rehabdagen">
            ${week.days.map((item) => {
              const complete = dayProgress(options.getState(), week.id, item.id).complete;
              return `<button type="button" class="session-chip${item.id === day.id ? " is-active" : ""}${complete ? " is-cycle-complete" : ""}"
                data-rehab-day="${item.id}" aria-label="${item.label}${complete ? ", afgerond" : ""}" aria-pressed="${item.id === day.id}"><strong>${item.label}</strong></button>`;
            }).join("")}
          </div>
        </aside>
        <section class="training-panel">
          <div class="session-heading">
            <div class="session-title-block">
              <h1 id="rehab-title"><span>${day.label}</span>${day.exercises.length ? `<span class="title-progress${progress.complete ? " is-complete" : ""}" aria-label="${progress.percent}% afgerond">${progress.percent}%</span>` : ""}</h1>
              <span class="session-time-estimate">Rehab · ${weekDates(week)}</span>
            </div>
            <label class="field rehab-week-field"><span>Week</span>
              <select data-rehab-week aria-label="Rehabweek">${weeks.map((item) => `<option value="${item.id}"${item.id === week.id ? " selected" : ""}>${item.label}</option>`).join("")}</select>
            </label>
          </div>
          <div class="exercise-list">
            ${!day.exercises.length ? `<div class="empty-state">Het schema voor ${week.label.toLowerCase()} volgt nog.</div>` : ""}
            ${day.exercises.map((exercise, index) => {
              const isOpen = expandedExercises.has(exercise.id);
              const complete = isExerciseComplete(options.getState(), week.id, day.id, exercise.id);
              const bodyId = `rehab-${week.id}-${day.id}-${exercise.id}`;
              return `
              <article class="exercise-card rehab-exercise${isOpen ? " is-open" : ""}">
                <header class="exercise-head" data-rehab-toggle="${exercise.id}">
                  <span class="exercise-index">${String(index + 1).padStart(2, "0")}</span>
                  <div class="exercise-title">
                    <button class="activity-name-display" type="button" data-rehab-toggle="${exercise.id}" aria-expanded="${isOpen}" aria-controls="${bodyId}">${escape(exercise.name)}</button>
                    <span class="exercise-subtitle">${escape(exercise.prescription)}</span>
                  </div>
                  <div class="card-controls">
                    <button class="card-toggle${complete && !isOpen ? " is-complete" : ""}" type="button" data-rehab-toggle="${exercise.id}" aria-expanded="${isOpen}" aria-controls="${bodyId}" aria-label="${isOpen ? "Klap dicht" : "Klap open"}: ${escape(exercise.name)}, ${complete ? 100 : 0}% afgerond">
                      <span class="set-counter">${complete ? 100 : 0}%</span>
                      <i data-lucide="${isOpen ? "chevron-up" : "chevron-down"}"></i>
                    </button>
                  </div>
                </header>
                <div id="${bodyId}"${isOpen ? "" : " hidden"}>
                  <div class="exercise-note">
                    <textarea rows="1" data-rehab-note="${exercise.id}" aria-label="Opmerking bij ${escape(exercise.name)}" placeholder="Opmerking toevoegen…">${escape(getNote(options.getState(), week.id, day.id, exercise.id))}</textarea>
                  </div>
                  <div class="exercise-actions">
                    <button class="mini-button" type="button" data-rehab-done="${exercise.id}"><i data-lucide="${complete ? "rotate-ccw" : "check"}"></i><span>${complete ? "Oefening heropenen" : "Oefening afronden"}</span></button>
                  </div>
                </div>
              </article>`;
            }).join("")}
          </div>
          <div class="finish-bar rehab-copy-bar"${hasExercises ? "" : " hidden"}>
            <div class="rehab-day-actions"${day.exercises.length ? "" : " hidden"}>
              <button class="primary-button" type="button" data-rehab-complete${progress.complete ? " disabled" : ""}><i data-lucide="check"></i><span>${progress.complete ? "Dag afgerond" : "Dag afronden"}</span></button>
              <button class="mini-button" type="button" data-rehab-reopen${progress.complete ? "" : " hidden"}>Dag opnieuw openen</button>
            </div>
            <button class="ghost-button" type="button" data-rehab-copy><i data-lucide="copy"></i><span>Kopieer ${week.label.toLowerCase()}</span></button>
            <span class="record-meta">Met schema en opmerkingen. Klaar voor WhatsApp.</span>
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
    selectedWeekId = null;
    calendarWeekId = null;
    expandedExercises.clear();
    if (!settings.enabled) {
      document.querySelectorAll("[data-rehab-owner]").forEach((element) => element.remove());
      return;
    }
    options = { now: () => new Date(), ...settings };
    selectedWeekId = currentWeek(options.now()).id;
    calendarWeekId = selectedWeekId;
    root = document.querySelector('[data-view="rehab"]');
    document.querySelectorAll("[data-rehab-owner]").forEach((element) => { element.hidden = false; });
    document.querySelector(".view-tabs").style.setProperty("--view-count", "5");
    root.addEventListener("click", (event) => {
      // Rehab cards have no set controls; don't delegate their headings to Train.
      event.stopPropagation();
      const dayButton = event.target.closest("[data-rehab-day]");
      if (dayButton) {
        getData(options.getState()).selectedDay = dayButton.dataset.rehabDay;
        expandedExercises.clear();
        options.save();
        render();
        root.querySelector(`[data-rehab-day="${selection().day.id}"]`).focus({ preventScroll: true });
      }
      const toggle = event.target.closest("[data-rehab-toggle]");
      if (toggle) {
        const id = toggle.dataset.rehabToggle;
        if (expandedExercises.has(id)) expandedExercises.delete(id);
        else expandedExercises.add(id);
        render();
        root.querySelector(`button[data-rehab-toggle="${id}"]`).focus({ preventScroll: true });
      }
      const doneButton = event.target.closest("[data-rehab-done]");
      if (doneButton) {
        const { week, day } = selection();
        const id = doneButton.dataset.rehabDone;
        const complete = !isExerciseComplete(options.getState(), week.id, day.id, id);
        if (setExerciseComplete(options.getState(), week.id, day.id, id, complete)) {
          options.save();
          options.flush();
          render();
          root.querySelector(`[data-rehab-done="${id}"]`).focus({ preventScroll: true });
        }
      }
      const finish = event.target.closest("[data-rehab-complete]");
      const reopen = event.target.closest("[data-rehab-reopen]");
      if (finish || reopen) {
        const { week, day } = selection();
        if (setDayComplete(options.getState(), week.id, day.id, Boolean(finish))) {
          options.save();
          options.flush();
          expandedExercises.clear();
          render();
          root.querySelector(finish ? "[data-rehab-reopen]" : "[data-rehab-complete]").focus({ preventScroll: true });
          options.notify?.(`${day.label} ${finish ? "afgerond" : "weer geopend"}`);
        }
      }
      if (event.target.closest("[data-rehab-copy]")) void copyWeek();
    });
    root.addEventListener("change", (event) => {
      if (!event.target.matches("[data-rehab-week]")) return;
      selectedWeekId = event.target.value;
      expandedExercises.clear();
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

  return { mount, open, resume, render, resizeNotes, getNote, setNote, hasNotes, hasData, weekText, currentWeek,
    isExerciseComplete, dayProgress, setExerciseComplete, setDayComplete };
})();
