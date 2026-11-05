"use strict";

window.PlanEditor = (() => {
  const model = window.PersonalPlan;
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  let options, root, draft, baseline, selected, expanded, pendingDelete;
  const freshExercises = new Set();
  const appliedSuggestions = new Map();

  function open() {
    if (!root) return;
    if (draft) { alignRail("end"); return; }
    draft = options.getPlan();
    baseline = JSON.stringify(draft);
    selected = draft.days.some((day) => day.id === options.activeDay()) ? options.activeDay() : draft.days[0].id;
    expanded = pendingDelete = null;
    freshExercises.clear(); appliedSuggestions.clear();
    render("end");
  }

  const button = (action, icon, label, extra = "") => `<button class="mini-button plan-icon" type="button" data-plan-action="${action}" aria-label="${esc(label)}" title="${esc(label)}" ${extra}><i data-lucide="${icon}"></i></button>`;

  function render(railPosition = "preserve") {
    if (!draft) return;
    const previousScroll = root.querySelector(".session-rail")?.scrollLeft || 0;
    const day = draft.days.find((item) => item.id === selected) || draft.days[0];
    selected = day.id;
    const index = draft.days.indexOf(day);
    root.innerHTML = `<form id="plan-editor-form" class="plan-form" novalidate>
      <p class="plan-status" role="status" aria-live="polite"></p>
      <div class="workbench"><aside class="side-panel"><div class="session-rail" aria-label="Dagen bewerken">
        ${draft.days.map((item) => `<button class="session-chip${item.id === day.id ? " is-active" : ""}" type="button" data-plan-action="select-day" data-id="${item.id}" aria-pressed="${item.id === day.id}"><strong>${esc(item.label || "Naam invullen")}</strong></button>`).join("")}
        <button class="session-chip" type="button" data-plan-action="add-day"${draft.days.length >= 60 ? " disabled" : ""}><strong><i data-lucide="plus"></i>Dag toevoegen</strong></button>
      </div></aside>
      <section class="training-panel" aria-label="Dag bewerken"><div class="plan-day-heading">
        <label class="field plan-day-name"><span>Naam van de dag</span><input class="cloud-input" data-plan-field="day-name" value="${esc(day.label)}" placeholder="Naam invullen" maxlength="80" autocomplete="off" required></label>
        <div class="plan-day-actions"><div class="plan-tools">${button("day-up", "arrow-left", "Dag naar links", index === 0 ? "disabled" : "")}${button("day-down", "arrow-right", "Dag naar rechts", index === draft.days.length - 1 ? "disabled" : "")}</div>
          <div class="plan-tools">${day.id !== "overig" ? button("copy-day", "copy", "Dag kopiëren", draft.days.length >= 60 ? "disabled" : "") + button("delete-day", "trash-2", "Dag verwijderen") : ""}</div></div></div>
        ${pendingDelete === "day" ? `<div class="plan-confirm"><p>${esc(day.label)} uit je schema verwijderen? Je trainingshistorie blijft bewaard.</p><button class="mini-button" type="button" data-plan-action="confirm-day-delete">Dag verwijderen</button><button class="mini-button" type="button" data-plan-action="keep">Behouden</button></div>` : ""}
        ${day.id === "overig" ? `<p class="record-meta">Overig blijft beschikbaar voor losse activiteiten. Hieronder bewerk je de snelkeuzes.</p>` : ""}
        <div class="exercise-list">${day.exercises.map((exercise, i) => renderExercise(exercise, i, day)).join("")}</div>
        <button class="mini-button plan-add-exercise" type="button" data-plan-action="add-exercise"${day.exercises.length >= 80 ? " disabled" : ""}><i data-lucide="plus"></i><span>Oefening toevoegen</span></button>
      </section></div>
    </form>`;
    options.refreshIcons();
    alignRail(railPosition, previousScroll);
  }

  function alignRail(position, previousScroll = 0) {
    const rail = root.querySelector(".session-rail"), active = rail?.querySelector(".is-active");
    if (!rail || rail.scrollWidth <= rail.clientWidth) return;
    if (position === "end") rail.scrollLeft = rail.scrollWidth;
    else {
      rail.scrollLeft = previousScroll;
      if (position !== "active" || !active) return;
      const bounds = rail.getBoundingClientRect(), item = active.getBoundingClientRect();
      if (item.left < bounds.left) rail.scrollLeft += item.left - bounds.left;
      else if (item.right > bounds.right) rail.scrollLeft += item.right - bounds.right;
    }
  }

  function muscleSelection(exercise, day) {
    const automatic = options.category({ ...exercise, muscleGroup: undefined }, freshExercises.has(exercise.id) ? undefined : day.group);
    const selected = options.category(exercise, freshExercises.has(exercise.id) ? undefined : day.group);
    const groups = Object.entries(options.muscleGroups);
    return {
      automaticLabel: groups.flatMap(([, items]) => items).find(item => item.value === automatic)?.label,
      group: groups.find(([, items]) => items.some(item => item.value === selected))?.[0] || "Groep",
      label: groups.flatMap(([, items]) => items).find(item => item.value === selected)?.label || "Kies spiergroep",
      value: exercise.muscleGroup ? selected : "",
    };
  }

  function updateMuscleSelection(card, exercise, day) {
    const selection = muscleSelection(exercise, day);
    const select = card.querySelector('[data-plan-field="muscleGroup"]');
    if (!select) return;
    select.querySelector('option[value=""]').textContent = selection.automaticLabel ? `Automatisch · ${selection.automaticLabel}` : "Kies spiergroep";
    card.querySelector(".plan-muscle-section").textContent = selection.group;
    card.querySelector(".plan-muscle-name").textContent = selection.label;
  }

  function renderExercise(exercise, index, day) {
    const isOpen = expanded === exercise.id;
    const muscleGroups = Object.entries(options.muscleGroups);
    const selection = muscleSelection(exercise, day);
    return `<article class="exercise-card${isOpen ? " is-open" : ""}" data-plan-exercise="${exercise.id}">
      <header class="exercise-head"><span class="exercise-index">${String(index + 1).padStart(2, "0")}</span>
        <div class="exercise-title"><button class="activity-name-display" type="button" data-plan-action="toggle-exercise" aria-expanded="${isOpen}">${esc(exercise.name || "Naam invullen")}</button><span class="exercise-subtitle">${exercise.setCount} ${exercise.kind === "run" || exercise.kind === "cardio" ? "pogingen" : "sets"}</span></div>
        <button class="card-toggle" type="button" data-plan-action="toggle-exercise" aria-expanded="${isOpen}" aria-label="Bewerk ${esc(exercise.name || "oefening")}"><i data-lucide="chevron-${isOpen ? "up" : "down"}"></i></button></header>
      ${isOpen ? `<div class="plan-exercise-fields"><div class="plan-add-fields"><label class="field"><span>Naam van de oefening</span><input class="cloud-input" data-plan-field="name" value="${esc(exercise.name)}" placeholder="Naam invullen" autocomplete="off" maxlength="120" required></label>
        <label class="field plan-sets"><span>${exercise.kind === "run" || exercise.kind === "cardio" ? "Pogingen" : "Sets"}</span><input class="cloud-input" data-plan-field="setCount" type="number" min="1" max="30" step="1" value="${exercise.setCount}" required></label></div>
        ${(!exercise.kind || exercise.kind === "strength") ? `<label class="field plan-muscle-group"><span>Spiergroep in Stats</span><div class="plan-muscle-picker">
          <div class="plan-muscle-values" aria-hidden="true"><span class="plan-muscle-section">${esc(selection.group)}</span><span class="plan-muscle-name">${esc(selection.label)}</span></div>
          <select data-plan-field="muscleGroup" aria-label="Spiergroep in Stats" required>
          <option value="">${selection.automaticLabel ? `Automatisch · ${esc(selection.automaticLabel)}` : "Kies spiergroep"}</option>${muscleGroups.map(([group, items]) => `<optgroup label="${group}">${items.map((item) => `<option value="${item.value}"${selection.value === item.value ? " selected" : ""}>${esc(item.label)}</option>`).join("")}</optgroup>`).join("")}
        </select></div></label>` : ""}
        <details class="plan-options"><summary>Meer opties</summary><div class="plan-option-fields">
          <label class="field"><span>Setup / apparaatstand</span><input class="cloud-input" data-plan-field="setup" value="${esc(exercise.setup)}" maxlength="120"></label>
          ${(!exercise.kind || exercise.kind === "strength") ? `<label class="field"><span>Rusttijd (seconden)</span><input class="cloud-input" data-plan-field="restSeconds" type="number" min="0" max="1800" step="15" value="${exercise.restSeconds ?? 180}"></label>
          ${[["unilateral", "Links en rechts apart"], ["usesBodyweight", "Lichaamsgewicht meetellen"], ["isometric", "Seconden in plaats van herhalingen"], ["weightOptional", "Gewicht optioneel"]].map(([field, label]) => `<label class="plan-check"><input type="checkbox" data-plan-field="${field}"${exercise[field] ? " checked" : ""}>${label}</label>`).join("")}` : ""}
        </div></details>
        <div class="plan-exercise-actions"><div class="plan-tools">${button("exercise-up", "arrow-up", "Oefening omhoog", index === 0 ? "disabled" : "")}${button("exercise-down", "arrow-down", "Oefening omlaag", index === day.exercises.length - 1 ? "disabled" : "")}</div>
          <button class="mini-button" type="button" data-plan-action="delete-exercise">Verwijderen</button></div>
        ${pendingDelete === exercise.id ? `<div class="plan-confirm"><p>Oefening uit deze dag verwijderen? Je historie blijft bewaard.</p><button class="mini-button" type="button" data-plan-action="confirm-exercise-delete">Oefening verwijderen</button><button class="mini-button" type="button" data-plan-action="keep">Behouden</button></div>` : ""}
      </div>` : ""}</article>`;
  }

  function status(message) { root.querySelector(".plan-status").textContent = message; }
  function focus(selector) { root.querySelector(selector)?.focus(); }
  function resetSelection() { expanded = pendingDelete = null; }
  function suggestions() {
    // Exclude unfinished cards so they do not shadow a known exercise's settings.
    return options.suggestions({ ...draft, days: draft.days.map((day) => ({ ...day,
      exercises: day.exercises.filter((exercise) => !freshExercises.has(exercise.id)),
    })) });
  }

  function checkField(selector) {
    const input = root.querySelector(selector);
    if (!input) return false;
    input.setCustomValidity(!input.value.trim() && input.dataset.planField === "muscleGroup" ? "Kies een spiergroep."
      : input.tagName === "INPUT" && input.type !== "number" && !input.value.trim() ? "Vul een naam in." : "");
    if (input.checkValidity()) return true;
    input.closest("details")?.setAttribute("open", "");
    input.focus();
    input.reportValidity();
    return false;
  }

  function checkDraft() {
    for (const day of draft.days) {
      let field = !day.label.trim() || day.label.length > 80 ? "day-name" : null;
      const exercise = day.exercises.find((item) => {
        if (field) return false;
        if (!item.name.trim() || item.name.length > 120) field = "name";
        else if (!Number.isInteger(item.setCount) || item.setCount < 1 || item.setCount > 30) field = "setCount";
        else if (item.restSeconds !== undefined && (!Number.isFinite(item.restSeconds) || item.restSeconds < 0 || item.restSeconds > 1800)) field = "restSeconds";
        else if ((item.kind || "strength") === "strength" && !options.category(item, freshExercises.has(item.id) ? undefined : day.group)) field = "muscleGroup";
        return Boolean(field);
      });
      if (!field) continue;
      selected = day.id; expanded = exercise?.id || null;
      pendingDelete = null;
      render("active");
      checkField(`[data-plan-field="${field}"]`);
      return false;
    }
    return model.valid(draft);
  }

  function mount(settings) {
    options = settings;
    draft = null;
    root = null;
    if (!settings.enabled) {
      document.querySelectorAll("[data-schema-owner]").forEach((element) => element.remove());
      return;
    }
    document.querySelectorAll("[data-schema-owner]").forEach((element) => { element.hidden = false; });
    root = document.querySelector('[data-view="schema"]');
    document.querySelector('[data-plan-action="cancel"]').addEventListener("click", () => { draft = null; location.hash = "train"; });
    root.addEventListener("input", (event) => {
      event.stopPropagation();
      const target = event.target, field = target.dataset.planField;
      if (!draft || !field) return;
      target.setCustomValidity?.("");
      const day = draft.days.find((item) => item.id === selected);
      if (field === "day-name") {
        day.label = target.value;
        root.querySelector(`[data-plan-action="select-day"][data-id="${day.id}"] strong`).textContent = target.value || "Naam invullen";
        return;
      }
      const exercise = day.exercises.find((item) => item.id === target.closest("[data-plan-exercise]")?.dataset.planExercise);
      if (!exercise) return;
      exercise[field] = target.type === "checkbox" ? target.checked
        : ["setCount", "restSeconds"].includes(field) ? Number(target.value) : target.value;
      const card = target.closest("[data-plan-exercise]");
      if (field === "name") {
        card.querySelector(".activity-name-display").textContent = target.value || "Naam invullen";
        card.querySelector(".card-toggle").setAttribute("aria-label", `Bewerk ${target.value || "oefening"}`);
        updateMuscleSelection(card, exercise, day);
        const name = target.value.trim().toLowerCase();
        const source = freshExercises.has(exercise.id) && appliedSuggestions.get(exercise.id) !== name
          ? suggestions().find((item) => item.name.toLowerCase() === name) : null;
        if (source) {
          const originalId = exercise.id;
          const replacement = model.newExercise(target.value, exercise.setCount, source);
          const muscleGroup = exercise.muscleGroup ?? replacement.muscleGroup;
          Object.keys(exercise).forEach((key) => { delete exercise[key]; });
          Object.assign(exercise, replacement, { id: originalId });
          if (Object.values(options.muscleGroups).flat().some((item) => item.value === muscleGroup)) exercise.muscleGroup = muscleGroup;
          else delete exercise.muscleGroup;
          appliedSuggestions.set(exercise.id, name);
          render();
          const input = root.querySelector(`[data-plan-exercise="${exercise.id}"] [data-plan-field="name"]`);
          input.focus(); input.setSelectionRange(input.value.length, input.value.length);
        }
      }
      if (field === "muscleGroup") updateMuscleSelection(card, exercise, day);
      if (field === "setCount") card.querySelector(".exercise-subtitle").textContent = `${target.value} ${exercise.kind === "run" || exercise.kind === "cardio" ? "pogingen" : "sets"}`;
    });
    root.addEventListener("change", (event) => event.stopPropagation());
    root.addEventListener("submit", (event) => {
      event.preventDefault(); event.stopPropagation();
      if (!checkDraft()) return;
      try {
        draft.days.forEach((day) => day.exercises.forEach((exercise) => {
          if ((exercise.kind || "strength") === "strength") exercise.muscleGroup = options.category(exercise, freshExercises.has(exercise.id) ? undefined : day.group);
        }));
        options.commit(model.clone(draft), baseline);
        draft = null;
        location.hash = "train";
      } catch (error) { status(error.message || "Opslaan is niet gelukt. Je wijzigingen staan hier nog."); }
    });
    root.addEventListener("click", (event) => {
      event.stopPropagation();
      const trigger = event.target.closest("[data-plan-action]");
      if (!trigger || !draft) return;
      const action = trigger.dataset.planAction;
      const day = draft.days.find((item) => item.id === selected);
      const exerciseId = trigger.closest("[data-plan-exercise]")?.dataset.planExercise;
      const exerciseIndex = day.exercises.findIndex((item) => item.id === exerciseId);
      if (action === "select-day") { selected = trigger.dataset.id; resetSelection(); }
      if (action === "add-day") { selected = model.addDay(draft, "").id; resetSelection(); }
      if (action === "copy-day") { selected = model.copyDay(draft, day.id)?.id || day.id; resetSelection(); }
      if (action === "day-up" || action === "day-down") {
        model.move(draft.days, draft.days.indexOf(day), action === "day-up" ? -1 : 1);
        draft.order = draft.days.filter((item) => item.id !== "overig").map((item) => item.id);
      }
      if (action === "delete-day") pendingDelete = "day";
      if (action === "confirm-day-delete") { model.removeDay(draft, day.id); selected = draft.days[0].id; resetSelection(); }
      if (action === "keep") pendingDelete = null;
      if (action === "toggle-exercise") { expanded = expanded === exerciseId ? null : exerciseId; pendingDelete = null; }
      if (action === "exercise-up" || action === "exercise-down") model.move(day.exercises, exerciseIndex, action === "exercise-up" ? -1 : 1);
      if (action === "delete-exercise") pendingDelete = exerciseId;
      if (action === "confirm-exercise-delete") { day.exercises.splice(exerciseIndex, 1); expanded = pendingDelete = null; }
      if (action === "add-exercise") {
        const exercise = model.newExercise("");
        day.exercises.push(exercise);
        freshExercises.add(exercise.id);
        resetSelection(); expanded = exercise.id;
      }
      render(["add-day", "copy-day", "select-day", "day-up", "day-down", "confirm-day-delete"].includes(action) ? "active" : "preserve");
      if (["add-day", "copy-day"].includes(action)) focus('[data-plan-field="day-name"]');
      else if (action === "add-exercise") focus(`[data-plan-exercise="${expanded}"] [data-plan-field="name"]`);
      else if (exerciseId) focus(`[data-plan-exercise="${exerciseId}"] button`);
    });
  }
  return { mount, open };
})();
