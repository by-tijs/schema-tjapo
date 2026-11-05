"use strict";

window.PersonalPlan = (() => {
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const id = (prefix) => `${prefix}-${crypto.randomUUID()}`;
  const safeId = (value) => typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,100}$/.test(value);
  const muscleGroups = ["push", "back", "shoulders", "traps", "biceps", "triceps", "legs", "quads-glutes", "hamstrings", "calves", "neck", "grip", "abs"];
  const valid = (plan) => plan?.version === 1 && Array.isArray(plan.days) && plan.days.length > 0
    && (plan.order === undefined || (Array.isArray(plan.order) && plan.order.every(safeId)))
    && (plan.archivedDays === undefined || (Array.isArray(plan.archivedDays) && plan.archivedDays.every((day) => safeId(day?.id) && Array.isArray(day.exercises))))
    && (plan.nameAliases === undefined || (plan.nameAliases && typeof plan.nameAliases === "object" && !Array.isArray(plan.nameAliases)
      && Object.values(plan.nameAliases).every((name) => typeof name === "string")))
    && plan.days.length <= 60 && new Set(plan.days.map((day) => day.id)).size === plan.days.length
    && plan.days.some((day) => day.id === "overig")
    && plan.days.every((day) => safeId(day.id) && typeof day.label === "string" && day.label.trim()
      && day.label.length <= 80 && ["Upper", "Lower", "Extra"].includes(day.group)
      && Array.isArray(day.exercises) && day.exercises.length <= 80
      && new Set(day.exercises.map((exercise) => exercise.id)).size === day.exercises.length
      && day.exercises.every((exercise) => safeId(exercise.id) && typeof exercise.name === "string"
        && exercise.name.trim() && exercise.name.length <= 120
        && Number.isInteger(exercise.setCount) && exercise.setCount >= 1 && exercise.setCount <= 30
        && (exercise.muscleGroup === undefined || exercise.muscleGroup === "" || muscleGroups.includes(exercise.muscleGroup))
        && ["strength", "run", "cardio"].includes(exercise.kind || "strength")
        && (exercise.restSeconds === undefined || (Number.isFinite(exercise.restSeconds) && exercise.restSeconds >= 0 && exercise.restSeconds <= 1800))));

  function fromState(state, defaults, order) {
    if (valid(state.personalPlan)) return clone(state.personalPlan);
    return { version: 1, days: defaults.map((day) => ({ ...clone(day), exercises: day.exercises.map((exercise) => ({
      ...clone(exercise), name: state.exerciseNames?.[exercise.id] || exercise.name,
    })) })), order: [...order] };
  }

  function cycle(plan) {
    const ids = plan.days.filter((day) => day.id !== "overig").map((day) => day.id);
    return [...new Set([...(plan.order || []), ...ids])].filter((key) => ids.includes(key));
  }

  function addDay(plan, label = "Nieuwe dag", group = "Upper") {
    const day = { id: id("day"), label, group, cycle: true, exercises: [] };
    plan.days.splice(Math.max(0, plan.days.findIndex((item) => item.id === "overig")), 0, day);
    plan.order = [...cycle(plan).filter((key) => key !== day.id), day.id];
    return day;
  }

  function copyDay(plan, dayId) {
    const source = plan.days.find((day) => day.id === dayId);
    if (!source || source.id === "overig") return null;
    const day = { ...clone(source), id: id("day"), label: `${source.label.slice(0, 72)} kopie` };
    plan.days.splice(plan.days.indexOf(source) + 1, 0, day);
    const order = cycle(plan).filter((key) => key !== day.id);
    order.splice(order.indexOf(source.id) + 1, 0, day.id);
    plan.order = order;
    return day;
  }

  function removeDay(plan, dayId) {
    if (dayId === "overig") return false;
    plan.days = plan.days.filter((day) => day.id !== dayId);
    plan.order = cycle(plan);
    return true;
  }

  function move(items, index, offset) {
    const next = index + offset;
    if (index < 0 || next < 0 || next >= items.length) return;
    [items[index], items[next]] = [items[next], items[index]];
  }

  function newExercise(name, setCount = 3, source = {}) {
    const settings = {};
    for (const key of ["setup", "unilateral", "usesBodyweight", "isometric", "weightOptional", "restSeconds", "defaultMetrics", "muscleGroup"]) {
      if (source[key] !== undefined) settings[key] = clone(source[key]);
    }
    return { ...settings, id: id("exercise"), name: name.trim(), kind: source.kind || "strength", setCount };
  }

  function snapshot(day, workout, historical = false) {
    const exercises = historical ? Object.keys(workout.exercises || {}).map((key) =>
      day.exercises.find((exercise) => exercise.id === key) || { id: key, name: key, kind: "strength", setCount: 1 }) : day.exercises;
    return { ...clone(day), exercises: exercises.map((exercise) => {
      const entry = workout.exercises?.[exercise.id];
      return { ...clone(exercise), name: entry?.name || exercise.name, frozenName: true,
        ...(entry ? { kind: entry.kind || exercise.kind, setup: entry.setup ?? exercise.setup,
          setCount: entry.sets?.length ?? entry.targetCount ?? exercise.setCount,
          unilateral: Boolean(entry.unilateral ?? exercise.unilateral), isometric: Boolean(entry.isometric ?? exercise.isometric),
          usesBodyweight: Boolean(entry.usesBodyweight ?? exercise.usesBodyweight), weightOptional: Boolean(entry.weightOptional ?? exercise.weightOptional),
          ...(entry.restSeconds !== undefined ? { restSeconds: entry.restSeconds } : {}),
          ...(entry.muscleGroup !== undefined ? { muscleGroup: entry.muscleGroup } : {}) } : {}) };
    }) };
  }

  return { clone, valid, fromState, cycle, addDay, copyDay, removeDay, move, newExercise, snapshot };
})();
