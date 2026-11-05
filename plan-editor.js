"use strict";

window.PlanEditor = (() => {
  const model = window.PersonalPlan;
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  let options, root, draft, baseline, selected, expanded, pendingDelete, replacing;
  let newName = "", newSets = 3;

  function open() {
    if (!root || draft) return;
    draft = options.getPlan();
    baseline = JSON.stringify(draft);
    selected = draft.days.some((day) => day.id === options.activeDay()) ? options.activeDay() : draft.days[0].id;
    expanded = pendingDelete = replacing = null;
    newName = ""; newSets = 3;
    render();
  }

  const button = (action, icon, label, extra = "") => `<button class="mini-button plan-icon" type="button" data-plan-action="${action}" aria-label="${esc(label)}" title="${esc(label)}" ${extra}><i data-lucide="${icon}"></i></button>`;

  function render() {
    if (!draft) return;
    const day = draft.days.find((item) => item.id === selected) || draft.days[0];
    selected = day.id;
    const index = draft.days.indexOf(day);
    root.innerHTML = `<form class="plan-form">
      <p class="plan-status" role="status" aria-live="polite"></p>
      <div class="workbench"><aside class="side-panel"><div class="session-rail" aria-label="Dagen bewerken">
        ${draft.days.map((item) => `<button class="session-chip${item.id === day.id ? " is-active" : ""}" type="button" data-plan-action="select-day" data-id="${item.id}" aria-pressed="${item.id === day.id}"><strong>${esc(item.label || "Naamloze dag")}</strong></button>`).join("")}
      </div><button class="mini-button plan-add-day" type="button" data-plan-action="add-day"><i data-lucide="plus"></i><span>Dag toevoegen</span></button></aside>
      <section class="training-panel" aria-label="Dag bewerken"><div class="plan-day-heading">
        <label class="field plan-day-name"><span>Naam van de dag</span><input class="cloud-input" data-plan-field="day-name" value="${esc(day.label)}" maxlength="80" required></label>
        <div class="plan-tools">${button("day-up", "arrow-up", "Dag omhoog", index === 0 ? "disabled" : "")}${button("day-down", "arrow-down", "Dag omlaag", index === draft.days.length - 1 ? "disabled" : "")}
          ${day.id !== "overig" ? button("copy-day", "copy", "Dag kopiëren") + button("delete-day", "trash-2", "Dag verwijderen") : ""}</div></div>
        ${pendingDelete === "day" ? `<div class="plan-confirm"><p>${esc(day.label)} uit je schema verwijderen? Je trainingshistorie blijft bewaard.</p><button class="mini-button" type="button" data-plan-action="confirm-day-delete">Dag verwijderen</button><button class="mini-button" type="button" data-plan-action="keep">Behouden</button></div>` : ""}
        ${day.id === "overig" ? `<p class="record-meta">Overig blijft beschikbaar voor losse activiteiten. Hieronder bewerk je de snelkeuzes.</p>` : `<label class="field plan-group"><span>Groep in Stats</span><select data-plan-field="group"><option value="Upper"${day.group === "Upper" ? " selected" : ""}>Upper</option><option value="Lower"${day.group === "Lower" ? " selected" : ""}>Lower</option></select></label>`}
        <div class="exercise-list">${day.exercises.length ? day.exercises.map((exercise, i) => renderExercise(exercise, i, day)).join("") : `<div class="empty-state">Voeg je eerste oefening toe.</div>`}</div>
        <div class="plan-add" id="plan-add-exercise"><h2>${replacing ? "Oefening vervangen" : "Oefening toevoegen"}</h2>
          <div class="plan-add-fields"><label class="field"><span>Oefening</span><input class="cloud-input" data-plan-field="new-name" list="plan-suggestions" maxlength="120" value="${esc(newName)}" placeholder="Bijvoorbeeld bench press" autocomplete="off"></label>
          <label class="field plan-sets"><span>Sets</span><input class="cloud-input" data-plan-field="new-sets" type="number" min="1" max="30" step="1" value="${newSets}"></label></div>
          <datalist id="plan-suggestions">${options.suggestions(draft).map((exercise) => `<option value="${esc(exercise.name)}">${esc(exercise.aliases || exercise.name)}</option>`).join("")}</datalist>
          <button class="ghost-button" type="button" data-plan-action="add-exercise"><i data-lucide="${replacing ? "repeat-2" : "plus"}"></i><span>${replacing ? "Vervangen" : "Oefening toevoegen"}</span></button>
          ${replacing ? `<button class="mini-button" type="button" data-plan-action="cancel-replace">Vervangen annuleren</button>` : ""}
        </div>
      </section></div>
      <footer class="plan-footer" aria-label="Schema bewerken"><div class="plan-footer-actions">
        <button class="ghost-button" type="button" data-plan-action="cancel">Annuleren</button>
        <button class="primary-button" type="submit"><i data-lucide="check"></i><span>Opslaan</span></button>
      </div></footer>
    </form>`;
    options.refreshIcons();
    const rail = root.querySelector(".session-rail"), active = rail.querySelector(".is-active");
    if (active && rail.scrollWidth > rail.clientWidth) {
      rail.scrollLeft += active.getBoundingClientRect().left - rail.getBoundingClientRect().left - 14;
    }
  }

  function renderExercise(exercise, index, day) {
    const isOpen = expanded === exercise.id;
    return `<article class="exercise-card${isOpen ? " is-open" : ""}" data-plan-exercise="${exercise.id}">
      <header class="exercise-head"><span class="exercise-index">${String(index + 1).padStart(2, "0")}</span>
        <div class="exercise-title"><button class="activity-name-display" type="button" data-plan-action="toggle-exercise" aria-expanded="${isOpen}">${esc(exercise.name)}</button><span class="exercise-subtitle">${exercise.setCount} ${exercise.kind === "run" || exercise.kind === "cardio" ? "pogingen" : "sets"}</span></div>
        <button class="card-toggle" type="button" data-plan-action="toggle-exercise" aria-expanded="${isOpen}" aria-label="Bewerk ${esc(exercise.name)}"><i data-lucide="chevron-${isOpen ? "up" : "down"}"></i></button></header>
      ${isOpen ? `<div class="plan-exercise-fields"><div class="plan-add-fields"><label class="field"><span>Naam van de oefening</span><input class="cloud-input" data-plan-field="name" value="${esc(exercise.name)}" maxlength="120" required></label>
        <label class="field plan-sets"><span>${exercise.kind === "run" || exercise.kind === "cardio" ? "Pogingen" : "Sets"}</span><input class="cloud-input" data-plan-field="setCount" type="number" min="1" max="30" step="1" value="${exercise.setCount}" required></label></div>
        <details class="plan-options"><summary>Meer opties</summary><div class="plan-option-fields">
          <label class="field"><span>Setup / apparaatstand</span><input class="cloud-input" data-plan-field="setup" value="${esc(exercise.setup)}" maxlength="120"></label>
          ${(!exercise.kind || exercise.kind === "strength") ? `<label class="field"><span>Rusttijd (seconden)</span><input class="cloud-input" data-plan-field="restSeconds" type="number" min="0" max="1800" step="15" value="${exercise.restSeconds ?? 180}"></label>
          ${[["unilateral", "Links en rechts apart"], ["usesBodyweight", "Lichaamsgewicht meetellen"], ["isometric", "Seconden in plaats van herhalingen"], ["weightOptional", "Gewicht optioneel"]].map(([field, label]) => `<label class="plan-check"><input type="checkbox" data-plan-field="${field}"${exercise[field] ? " checked" : ""}>${label}</label>`).join("")}` : ""}
        </div></details>
        <div class="plan-exercise-actions"><div class="plan-tools">${button("exercise-up", "arrow-up", "Oefening omhoog", index === 0 ? "disabled" : "")}${button("exercise-down", "arrow-down", "Oefening omlaag", index === day.exercises.length - 1 ? "disabled" : "")}</div>
          <button class="mini-button" type="button" data-plan-action="replace-exercise">Vervangen</button><button class="mini-button" type="button" data-plan-action="delete-exercise">Verwijderen</button></div>
        ${pendingDelete === exercise.id ? `<div class="plan-confirm"><p>Oefening uit deze dag verwijderen? Je historie blijft bewaard.</p><button class="mini-button" type="button" data-plan-action="confirm-exercise-delete">Oefening verwijderen</button><button class="mini-button" type="button" data-plan-action="keep">Behouden</button></div>` : ""}
      </div>` : ""}</article>`;
  }

  function status(message) { root.querySelector(".plan-status").textContent = message; }
  function focus(selector) { root.querySelector(selector)?.focus(); }
  function resetSelection() { expanded = pendingDelete = replacing = null; newName = ""; newSets = 3; }

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
    root.addEventListener("input", (event) => {
      event.stopPropagation();
      const target = event.target, field = target.dataset.planField;
      if (!draft || !field) return;
      const day = draft.days.find((item) => item.id === selected);
      if (field === "day-name") {
        day.label = target.value;
        root.querySelector(`[data-plan-action="select-day"][data-id="${day.id}"] strong`).textContent = target.value || "Naamloze dag";
        return;
      }
      if (field === "group") { day.group = target.value; return; }
      if (field === "new-name") { newName = target.value; return; }
      if (field === "new-sets") { newSets = Number(target.value); return; }
      const exercise = day.exercises.find((item) => item.id === target.closest("[data-plan-exercise]")?.dataset.planExercise);
      if (!exercise) return;
      exercise[field] = target.type === "checkbox" ? target.checked
        : ["setCount", "restSeconds"].includes(field) ? Number(target.value) : target.value;
      const card = target.closest("[data-plan-exercise]");
      if (field === "name") {
        card.querySelector(".activity-name-display").textContent = target.value || "Naamloze oefening";
        card.querySelector(".card-toggle").setAttribute("aria-label", `Bewerk ${target.value}`);
      }
      if (field === "setCount") card.querySelector(".exercise-subtitle").textContent = `${target.value} ${exercise.kind === "run" || exercise.kind === "cardio" ? "pogingen" : "sets"}`;
    });
    root.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && event.target.dataset.planField === "new-name") {
        event.preventDefault(); event.stopPropagation();
        root.querySelector('[data-plan-action="add-exercise"]').click();
      }
    });
    root.addEventListener("change", (event) => event.stopPropagation());
    root.addEventListener("submit", (event) => {
      event.preventDefault(); event.stopPropagation();
      if (!model.valid(draft)) { status("Vul voor elke dag en oefening een naam in en kies 1 tot 30 sets."); return; }
      try {
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
      if (action === "cancel") { draft = null; location.hash = "train"; return; }
      if (action === "select-day") { selected = trigger.dataset.id; resetSelection(); }
      if (action === "add-day") { selected = model.addDay(draft).id; resetSelection(); }
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
      if (action === "replace-exercise") { replacing = exerciseId; newName = ""; newSets = day.exercises[exerciseIndex].setCount; }
      if (action === "cancel-replace") { replacing = null; newName = ""; newSets = 3; }
      if (action === "add-exercise") {
        if (!newName.trim() || !Number.isInteger(newSets) || newSets < 1 || newSets > 30) { status("Vul een oefeningnaam in en kies 1 tot 30 sets."); return; }
        const source = options.suggestions(draft).find((item) => item.name.toLowerCase() === newName.trim().toLowerCase());
        const exercise = model.newExercise(newName, newSets, source);
        const replacementIndex = day.exercises.findIndex((item) => item.id === replacing);
        if (replacementIndex >= 0) day.exercises.splice(replacementIndex, 1, exercise);
        else day.exercises.push(exercise);
        replacing = null; expanded = exercise.id; newName = ""; newSets = 3;
      }
      render();
      if (["add-day", "copy-day", "select-day"].includes(action)) focus('[data-plan-field="day-name"]');
      else if (action === "replace-exercise") focus('[data-plan-field="new-name"]');
      else if (action === "add-exercise") focus(`[data-plan-exercise="${expanded}"] [data-plan-field="name"]`);
      else if (exerciseId) focus(`[data-plan-exercise="${exerciseId}"] button`);
    });
  }
  return { mount, open };
})();
