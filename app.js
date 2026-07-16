"use strict";

const STORAGE_KEY = "herpakkingsseason.tracker.v1";
const REST_TIMER_COMPOUND_SECONDS = 5 * 60;
const REST_TIMER_ISOLATION_SECONDS = 3 * 60;
const REST_TIMER_SIDE_SECONDS = 30;
const REST_TIMER_TICK_MS = 250;
const REST_TIMER_ALARM_REPEAT_MS = 3600;
const REST_TIMER_AUDIO_READY_TIMEOUT_MS = 700;
const REST_TIMER_ALARM_SET = "set";
const REST_TIMER_ALARM_SIDE = "side";

const sessions = [
  {
    id: "upper-a",
    group: "Upper",
    label: "Upper A",
    cycle: true,
    exercises: [
      compound("paused-bench", "Paused Bench", 3, "16"),
      compoundBodyweight("weighted-pull-ups", "Weighted pull ups", 2),
      unilateral("single-cable-press", "Single cable press", 2, "-22"),
      unilateral("cuffed-laterial", "Cuffed Laterial", 2, "-25"),
      ex("db-incline-curls", "Db incline curls", 2),
      ex("jm-press", "JM press", 2, "hoogste"),
    ],
  },
  {
    id: "upper-b",
    group: "Upper",
    label: "Upper B",
    cycle: true,
    exercises: [
      compound("slow-eccentric-bench", "Slow eccentric bench", 3, "16"),
      compoundUnilateral("illiac-row", "Illiac row", 2, "hoogste"),
      compound("weighted-dips", "Weighted dips", 2, "17"),
      ex("seated-db-side-delts", "Seated db side delts", 2),
      ex("cable-bar-reverse-curls", "Cable bar reverse curls", 2),
      ex("rope-pushdown", "Rope pushdown", 2, "hoogste"),
    ],
  },
  {
    id: "upper-c",
    group: "Upper",
    label: "Upper C",
    cycle: true,
    exercises: [
      compound("paused-bench-c", "Paused bench", 3, "16"),
      compoundUnilateral("cable-single-row", "Cable single row", 2, "1 boven L"),
      compound("smith-incline-bench", "Smith incline bench", 2),
      unilateral("cuffed-laterial-c", "Cuffed Laterial", 2, "22"),
      unilateral("cable-preacher-curls", "Cable preacher curls", 2, "laagste"),
      ex("seated-bar-pushdowns", "Seated bar pushdowns", 2),
    ],
  },
  {
    id: "upper-d",
    group: "Upper",
    label: "Upper D",
    cycle: false,
    exercises: [
      compound("barbell-bench", "Barbell Bench", 3, "16"),
      ex("cable-lat-prayer", "Cable lat prayer", 2, "hoogste"),
      compound("smith-shoulder-press", "Smith shoulder press", 2),
      ex("y-raises", "Y-raises", 2, "22"),
      ex("supinated-db-bicep-curls", "Supinated db bicep curls", 2),
      unilateral("single-arm-pushdowns", "Single arm pushdowns", 2, "hoogste"),
    ],
  },
  {
    id: "lower-a",
    group: "Lower",
    label: "Lower A",
    cycle: true,
    exercises: [
      compound("smith-sissy-squats", "Smith sissy squats", 2),
      unilateral("db-hamstring-curls", "Db hamstring curls", 2),
      unilateral("calve-raises", "Calve raises", 2),
      ex("neck-extentsions", "Neck extentsions", 2),
      unilateral("db-wrist-curls", "Db wrist curls", 2),
      unilateral("weighted-grip", "Weighted grip", 2, "knie"),
      unilateral("cable-traps", "Cable traps", 2),
    ],
  },
  {
    id: "lower-b",
    group: "Lower",
    label: "Lower B",
    cycle: true,
    exercises: [
      compound("smith-sissy-squats-b", "Smith sissy squats", 2),
      unilateral("db-hamstring-curls-b", "Db hamstring curls", 2),
      unilateral("calve-raises-b", "Calve raises", 2),
      unilateral("neck-side", "Neck side", 2, "12"),
      unilateral("riser-lift", "Riser lift", 2),
      unilateral("squeeze-hand", "Squeeze hand", 2, "hoogste"),
      unilateral("cable-obliques", "Cable obliques", 2, "12"),
    ],
  },
  {
    id: "lower-c",
    group: "Lower",
    label: "Lower C",
    cycle: true,
    exercises: [
      compound("smith-sissy-squats-c", "Smith sissy squats", 2),
      unilateral("db-hamstring-curls-c", "Db hamstring curls", 2),
      unilateral("calve-raises-c", "Calve raises", 2),
      ex("neck-curls", "Neck curls", 2, "4"),
      unilateral("single-arm-dead-hang", "Single arm dead hang", 2),
      ex("cable-crunches", "Cable crunches", 2, "hoogste"),
      unilateral("side-pressure", "Side pressure", 2, "-20"),
    ],
  },
  {
    id: "lower-d",
    group: "Lower",
    label: "Lower D",
    cycle: false,
    exercises: [
      compound("smith-sissy-squats-d", "Smith sissy squats", 2),
      unilateral("db-hamstring-curls-d", "Db hamstring curls", 2),
      unilateral("calve-raises-d", "Calve raises", 2),
      unilateral("neck-twist", "Neck twist", 2, "10"),
      unilateral("riser-holt", "Riser holt", 2),
      unilateral("cable-bends", "Cable bends", 2, "10"),
      unilateral("smith-traps-d", "Smith traps", 2),
    ],
  },
  {
    id: "overig",
    group: "Extra",
    label: "Overig",
    cycle: false,
    exercises: [
      ex("hardlopen", "Hardlopen", 1, "run"),
      ex("airbike-1-minuut", "Echo Bike (1 minuut)", 1, "cardio"),
      ex("airbike-topspeed", "Echo Bike (Top Speed)", 1, "cardio"),
      compound("deadlift", "Deadlift", 2),
      compound("db-shoulder-press", "DB Shoulder Press", 2),
      compound("incline-db-press", "Incline DB press", 2),
      compound("db-press", "DB press", 2),
    ],
  },
];

const cycleOrder = ["upper-a", "lower-a", "upper-b", "lower-b", "upper-c", "lower-c", "upper-d", "lower-d"];
const CHART_GROUPS = ["Upper", "Lower", "Running"];
const STRENGTH_INDEX_METRIC = "strength:index";
const RUN_5K_METRIC = "run:5k-estimate";
const RUN_PACE_METRIC = "run:pace";
const RUN_DISTANCE_METRIC = "run:distance";
const RUN_DURATION_METRIC = "run:duration";
const RUN_INTENSITY_METRIC = "run:intensity";
const RUN_TARGET_DISTANCE_KM = 5;
const RUN_RIEGEL_EXPONENT = 1.06;
const MIN_RUN_DISTANCE_KM_FOR_5K_ESTIMATE = 2;
const MIN_RUN_INTENSITY_FOR_5K_ESTIMATE = 8;
const STATS_RANGE_DAYS = [30, 90, 365];
const DEFAULT_STATS_RANGE_DAYS = 90;
const CHART_FILTERS = {
  Upper: [
    { value: "all", label: "All" },
    { value: "push", label: "Push" },
    { value: "back", label: "Back" },
    { value: "shoulders", label: "Shoulders" },
    { value: "biceps", label: "Biceps" },
    { value: "triceps", label: "Triceps" },
  ],
  Lower: [
    { value: "all", label: "All" },
    { value: "legs", label: "Legs" },
    { value: "calves", label: "Calves" },
    { value: "neck", label: "Neck" },
    { value: "grip", label: "Grip" },
    { value: "abs", label: "Abs" },
  ],
  Running: [{ value: "all", label: "All" }],
};
const MAX_EFFECTIVE_REPS_FOR_E1RM = 50;
const MAX_RIR_FROM_RPE = 5;
const MIN_RPE_FOR_E1RM = 6;
const TAIL_SET_WEIGHT_DECAY = 0.67;
const DEFAULT_BODYWEIGHT_KG = 94;
const DRAG_START_THRESHOLD = 10;
const DRAG_CLICK_SUPPRESS_MS = 40;
const SAVE_DEBOUNCE_MS = 180;
const CLOUD_SYNC_DEBOUNCE_MS = 1200;
const APP_VERSION = "139";
const FIREBASE_SDK_VERSION = "12.16.0";
const DECIMAL_INPUT_FIELDS = new Set(["weight", "reps", "rpe", "bodyweight", "distance", "intensity", "amount", "speed", "metric-rpe"]);
const ZERO_TO_TEN_INPUT_FIELDS = new Set(["rpe", "metric-rpe", "intensity"]);
const CALENDAR_WEEKDAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

let state = loadState();
let toastTimer = null;
let saveTimer = null;
let stateDirty = false;
let deferredInstallPrompt = null;
let resizeTimer = null;
let pendingConfirmAction = null;
let suppressSessionClick = false;
let suppressSessionClickUntil = 0;
let suppressHorizontalClickUntil = 0;
let suppressDatePickerClickUntil = 0;
const sessionRailDrag = {
  active: false,
  dragged: false,
  pointerId: null,
  trigger: null,
  startX: 0,
  startScrollLeft: 0,
};
const horizontalDrag = {
  active: false,
  dragged: false,
  pointerId: null,
  rail: null,
  trigger: null,
  startX: 0,
  startScrollLeft: 0,
};
const datePickerDrag = {
  active: false,
  pointerId: null,
  startX: 0,
  startY: 0,
};
const uiState = {
  expandedCards: new Set(),
  editingSetup: null,
  editingName: null,
  historyCursor: new Map(),
  datePickerMonth: null,
};
const historyCache = {
  ref: null,
  sortedAsc: null,
  sortedDesc: null,
  statsByRange: new Map(),
  statsAscByRange: new Map(),
  activityHistory: new Map(),
  latestActivity: new Map(),
  entryActivities: new Map(),
  strengthIndexPoints: new Map(),
  historyProgressSummaries: null,
};
const cloudSync = {
  available: false,
  ready: false,
  loading: false,
  applyingRemote: false,
  modules: null,
  app: null,
  auth: null,
  db: null,
  user: null,
  timer: null,
  lastSyncedAt: "",
  status: "Firebase nog niet ingesteld.",
};
const restTimer = {
  active: false,
  status: "idle",
  alarmKind: REST_TIMER_ALARM_SET,
  durationSeconds: 0,
  remainingSeconds: 0,
  endsAt: 0,
  interval: null,
  alarmInterval: null,
  alarmHideTimeout: null,
  alarmFallbackActive: false,
  alarmPlaybackPending: false,
  alarmSequence: 0,
  alarmMedia: null,
  audioContext: null,
  audioUnlocked: false,
  alarmBuffers: {
    [REST_TIMER_ALARM_SET]: null,
    [REST_TIMER_ALARM_SIDE]: null,
  },
  alarmBufferPromises: {
    [REST_TIMER_ALARM_SET]: null,
    [REST_TIMER_ALARM_SIDE]: null,
  },
  alarmSource: null,
  alarmGain: null,
  mediaPrimeIndex: 0,
  completionKeys: new Set(),
};

const els = {};

document.addEventListener("DOMContentLoaded", init);

function ex(id, name, setCount, kindOrSetup = "strength", setup = "", options = {}) {
  const knownKinds = ["strength", "run", "cardio", "other"];
  const kind = knownKinds.includes(kindOrSetup) ? kindOrSetup : "strength";
  return {
    id,
    name,
    setCount,
    kind,
    setup: knownKinds.includes(kindOrSetup) ? setup : kindOrSetup,
    ...options,
  };
}

function unilateral(id, name, setCount, setup = "", options = {}) {
  return ex(id, name, setCount, "strength", setup, { unilateral: true, ...options });
}

function bodyweight(id, name, setCount, setup = "", options = {}) {
  return ex(id, name, setCount, "strength", setup, { usesBodyweight: true, ...options });
}

function compound(id, name, setCount, setup = "") {
  return ex(id, name, setCount, "strength", setup, { restSeconds: REST_TIMER_COMPOUND_SECONDS });
}

function compoundUnilateral(id, name, setCount, setup = "") {
  return unilateral(id, name, setCount, setup, { restSeconds: REST_TIMER_COMPOUND_SECONDS });
}

function compoundBodyweight(id, name, setCount, setup = "") {
  return bodyweight(id, name, setCount, setup, { restSeconds: REST_TIMER_COMPOUND_SECONDS });
}

function getProgramExerciseName(exercise) {
  const override = state.exerciseNames?.[exercise?.id];
  return String(override || exercise?.name || "").trim() || exercise?.name || "Oefening";
}

function setProgramExerciseName(exerciseId, value) {
  const session = findSession(state.activeSessionId);
  const exercise = session?.exercises.find((item) => item.id === exerciseId);
  if (!exercise) return;

  const previousName = getProgramExerciseName(exercise);
  const nextName = String(value || "").trim();
  state.exerciseNames ||= {};

  if (!nextName || nextName === exercise.name) {
    delete state.exerciseNames[exerciseId];
  } else {
    state.exerciseNames[exerciseId] = nextName;
  }

  const previousMetric = makeExerciseMetricValue(previousName, exercise.setup);
  if (state.chartMetric === previousMetric) {
    state.chartMetric = makeExerciseMetricValue(getProgramExerciseName(exercise), exercise.setup);
  }

  historyCache.ref = null;
}

function init() {
  bindElements();
  installListeners();
  ensureDefaults();
  renderAll();
  registerServiceWorker();
  initCloudSync();
  refreshIcons();
}

function bindElements() {
  els.date = document.getElementById("training-date");
  els.dateButton = document.getElementById("training-date-button");
  els.dateLabel = document.getElementById("training-date-label");
  els.datePicker = document.getElementById("date-picker");
  els.datePickerMonth = document.getElementById("date-picker-month");
  els.datePickerSelected = document.getElementById("date-picker-selected");
  els.datePickerGrid = document.getElementById("date-picker-grid");
  els.datePickerWeekdays = document.querySelector(".date-picker-weekdays");
  els.sessionSelect = document.getElementById("session-select");
  els.sessionRail = document.getElementById("session-rail");
  els.trainTitle = document.getElementById("train-title");
  els.trainTitleLabel = document.getElementById("train-title-label");
  els.trainProgressCount = document.getElementById("train-progress-count");
  els.exerciseList = document.getElementById("exercise-list");
  els.historyList = document.getElementById("history-list");
  els.statsGrid = document.getElementById("stats-grid");
  els.chartFilterControl = document.getElementById("chart-filter-control");
  els.chartMetricSelect = document.getElementById("e1rm-metric-select");
  els.chartCanvas = document.getElementById("e1rm-chart");
  els.chartEmpty = document.getElementById("e1rm-empty");
  els.chartReadout = document.getElementById("chart-readout");
  els.recordsList = document.getElementById("records-list");
  els.backupFallback = document.getElementById("backup-fallback");
  els.storageReadout = document.getElementById("storage-readout");
  els.cloudStatus = document.getElementById("cloud-status");
  els.cloudAuth = document.getElementById("cloud-auth");
  els.cloudEmail = document.getElementById("cloud-email");
  els.cloudPassword = document.getElementById("cloud-password");
  els.cloudUserActions = document.getElementById("cloud-user-actions");
  els.importFile = document.getElementById("import-file");
  els.confirmModal = document.getElementById("confirm-modal");
  els.confirmTitle = document.getElementById("confirm-title");
  els.confirmMessage = document.getElementById("confirm-message");
  els.confirmActionLabel = document.getElementById("confirm-action-label");
  els.restTimer = document.getElementById("rest-timer");
  els.restTimerValue = document.getElementById("rest-timer-value");
  els.restTimerPause = document.getElementById("rest-timer-pause");
  els.restAlarm = document.getElementById("rest-alarm");
  els.restAlarmTitle = document.getElementById("rest-alarm-title");
  els.restAlarmActionLabel = document.getElementById("rest-alarm-action-label");
  els.restAlarmAudio = document.getElementById("rest-alarm-audio");
  els.sideAlarmAudio = document.getElementById("side-alarm-audio");
  els.toast = document.getElementById("toast");
}

function installListeners() {
  document.body.addEventListener("click", handleClick);
  document.body.addEventListener("input", handleInput);
  document.body.addEventListener("change", handleChange);
  document.body.addEventListener("focusout", handleFocusOut);
  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("pointerdown", unlockRestTimerAudio, { capture: true, passive: true });
  document.addEventListener("click", unlockRestTimerAudio, true);
  document.addEventListener("touchend", unlockRestTimerAudio, { capture: true, passive: true });
  document.addEventListener("keydown", unlockRestTimerAudio, true);
  els.sessionRail?.addEventListener("pointerdown", handleSessionRailPointerDown);
  els.sessionRail?.addEventListener("pointermove", handleSessionRailPointerMove);
  els.sessionRail?.addEventListener("pointerup", handleSessionRailPointerEnd);
  els.sessionRail?.addEventListener("pointercancel", handleSessionRailPointerEnd);
  els.sessionRail?.addEventListener("lostpointercapture", handleSessionRailPointerEnd);
  els.sessionRail?.addEventListener("click", handleSessionRailClick, true);
  document.addEventListener("pointerdown", handleHorizontalRailPointerDown);
  document.addEventListener("pointermove", handleHorizontalRailPointerMove);
  document.addEventListener("pointerup", handleHorizontalRailPointerEnd);
  document.addEventListener("pointercancel", handleHorizontalRailPointerEnd);
  document.addEventListener("click", handleHorizontalRailClick, true);
  document.addEventListener("click", handleDatePickerClick, true);
  els.datePicker?.querySelector(".date-picker-calendar")?.addEventListener("pointerdown", handleDatePickerPointerDown);
  els.datePicker?.querySelector(".date-picker-calendar")?.addEventListener("pointerup", handleDatePickerPointerEnd);
  els.datePicker?.querySelector(".date-picker-calendar")?.addEventListener("pointercancel", handleDatePickerPointerEnd);
  window.addEventListener("hashchange", syncViewFromHash);
  window.addEventListener("beforeunload", flushStateSave);
  window.addEventListener("pagehide", flushStateSave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushStateSave();
    } else {
      recoverRestTimerAudio();
    }
  });
  window.addEventListener("pageshow", recoverRestTimerAudio);
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (els.datePicker && !els.datePicker.hidden) positionDatePicker();
      if (getActiveViewName() === "stats") renderStats();
    }, 120);
  });
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    document.querySelector('[data-action="install"]')?.removeAttribute("hidden");
  });

  els.importFile?.addEventListener("change", importData);
}

function ensureDefaults() {
  if (!state.activeDate) state.activeDate = today();
  if (!state.activeSessionId) state.activeSessionId = getNextSession().id;
  if (!Number.isInteger(state.cycleIndex)) state.cycleIndex = 0;
  if (state.cycleIndex < 0 || state.cycleIndex >= cycleOrder.length) state.cycleIndex = 0;
  state.cycleCompleted = Array.isArray(state.cycleCompleted)
    ? state.cycleCompleted.filter((sessionId, index, list) => cycleOrder.includes(sessionId) && list.indexOf(sessionId) === index)
    : [];
  if (state.cycleCompleted.length >= cycleOrder.length) state.cycleCompleted = [];
  if (!state.workouts) state.workouts = {};
  if (!Array.isArray(state.history)) state.history = [];
  if (!state.exerciseNames || Array.isArray(state.exerciseNames) || typeof state.exerciseNames !== "object") state.exerciseNames = {};
  if (!Number.isFinite(parseNumber(state.bodyweight)) || parseNumber(state.bodyweight) <= 0) state.bodyweight = String(DEFAULT_BODYWEIGHT_KG);
  if (state.editingHistoryId && !state.history.some((entry) => entry.id === state.editingHistoryId)) state.editingHistoryId = null;
  if (!CHART_GROUPS.includes(state.chartGroup)) state.chartGroup = "Upper";
  if (!getChartFilters(state.chartGroup).some((filter) => filter.value === state.chartFilter)) state.chartFilter = "all";
  if (!state.chartMetric) state.chartMetric = getDefaultChartMetric(state.chartGroup);
  state.statsRangeDays = getStatsRangeDays(state.statsRangeDays);
  syncViewFromHash();
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveState(showSaved = false) {
  if (!cloudSync.applyingRemote) stateDirty = true;
  if (showSaved) {
    flushStateSave();
  } else {
    scheduleStateSave();
  }
  if (showSaved) showToast("Opgeslagen");
}

function scheduleStateSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushStateSave, SAVE_DEBOUNCE_MS);
}

function flushStateSave() {
  clearTimeout(saveTimer);
  saveTimer = null;
  const shouldSync = stateDirty && !cloudSync.applyingRemote;
  if (shouldSync) {
    state.updatedAt = new Date().toISOString();
    stateDirty = false;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (shouldSync) scheduleCloudSave();
}

function getHistoryCache() {
  if (historyCache.ref !== state.history) {
    historyCache.ref = state.history;
    historyCache.sortedAsc = null;
    historyCache.sortedDesc = null;
    historyCache.statsByRange.clear();
    historyCache.statsAscByRange.clear();
    historyCache.activityHistory.clear();
    historyCache.latestActivity.clear();
    historyCache.entryActivities.clear();
    historyCache.strengthIndexPoints.clear();
    historyCache.historyProgressSummaries = null;
  }
  return historyCache;
}

function getSortedHistoryDesc() {
  const cache = getHistoryCache();
  if (!cache.sortedDesc) {
    cache.sortedDesc = [...state.history].sort((a, b) => getHistorySortKey(b).localeCompare(getHistorySortKey(a)));
  }
  return cache.sortedDesc;
}

function getSortedHistoryAsc() {
  const cache = getHistoryCache();
  if (!cache.sortedAsc) {
    cache.sortedAsc = [...state.history].sort((a, b) => getHistorySortKey(a).localeCompare(getHistorySortKey(b)));
  }
  return cache.sortedAsc;
}

function getHistoryCacheKey(parts) {
  return parts.map((part) => String(part ?? "")).join("::");
}

function renderAll() {
  renderSessionOptions();
  renderSessionRail();
  renderTraining();
  const view = getActiveViewName();
  if (view === "log") renderHistory();
  if (view === "stats") renderStats();
  renderStorage();
  renderRestTimer();
  refreshIcons();
}

function renderSessionOptions() {
  if (!els.sessionSelect) {
    renderDateControl();
    return;
  }
  const currentValue = els.sessionSelect.value || state.activeSessionId;
  els.sessionSelect.innerHTML = sessions
    .map((session) => `<option value="${session.id}">${escapeHtml(session.label)}</option>`)
    .join("");
  els.sessionSelect.value = findSession(currentValue) ? currentValue : state.activeSessionId;
  renderDateControl();
}

function renderSessionRail() {
  const sessionButtons = sessions
    .map((session) => {
      const active = session.id === state.activeSessionId ? " is-active" : "";
      const complete = isCycleSessionComplete(session.id) ? " is-cycle-complete" : "";
      return `
        <button class="session-chip${active}${complete}" type="button" data-action="select-session" data-session-id="${session.id}">
          <strong>${escapeHtml(session.label)}</strong>
        </button>
      `;
    })
    .join("");
  els.sessionRail.innerHTML = `
    ${sessionButtons}
    <button class="session-chip session-chip-reset" type="button" data-action="reset-cycle">
      <strong>Reset</strong>
    </button>
  `;
  requestAnimationFrame(scrollActiveSessionIntoView);
}

function scrollActiveSessionIntoView() {
  const rail = els.sessionRail;
  const active = rail?.querySelector(".session-chip.is-active");
  if (!rail || !active || rail.scrollWidth <= rail.clientWidth) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targetLeft = active.offsetLeft - ((rail.clientWidth - active.offsetWidth) / 2);
  rail.scrollTo({
    left: Math.max(0, targetLeft),
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

function handleSessionRailPointerDown(event) {
  const rail = els.sessionRail;
  if (event.pointerType !== "mouse" || event.button !== 0 || !rail || rail.scrollWidth <= rail.clientWidth) return;

  sessionRailDrag.active = true;
  sessionRailDrag.dragged = false;
  sessionRailDrag.pointerId = event.pointerId;
  sessionRailDrag.trigger = event.target.closest?.("button[data-action]") || null;
  sessionRailDrag.startX = event.clientX;
  sessionRailDrag.startScrollLeft = rail.scrollLeft;
}

function handleSessionRailPointerMove(event) {
  const rail = els.sessionRail;
  if (!rail || !sessionRailDrag.active || event.pointerId !== sessionRailDrag.pointerId) return;

  const deltaX = event.clientX - sessionRailDrag.startX;
  if (!sessionRailDrag.dragged && Math.abs(deltaX) > DRAG_START_THRESHOLD) {
    sessionRailDrag.dragged = true;
    rail.classList.add("is-dragging");
    rail.setPointerCapture?.(event.pointerId);
  }

  if (!sessionRailDrag.dragged) return;
  rail.scrollLeft = sessionRailDrag.startScrollLeft - deltaX;
  event.preventDefault();
}

function handleSessionRailPointerEnd(event) {
  const rail = els.sessionRail;
  if (!sessionRailDrag.active || event.pointerId !== sessionRailDrag.pointerId) return;

  if (sessionRailDrag.dragged) {
    suppressSessionClick = true;
    suppressSessionClickUntil = performance.now() + DRAG_CLICK_SUPPRESS_MS;
    window.setTimeout(() => {
      suppressSessionClick = false;
    }, DRAG_CLICK_SUPPRESS_MS);
  } else if (sessionRailDrag.trigger?.isConnected && event.target.closest?.("button[data-action]") === sessionRailDrag.trigger) {
    suppressSessionClick = true;
    suppressSessionClickUntil = performance.now() + DRAG_CLICK_SUPPRESS_MS;
    window.setTimeout(() => {
      suppressSessionClick = false;
    }, DRAG_CLICK_SUPPRESS_MS);
    runAction(sessionRailDrag.trigger);
  }

  rail?.classList.remove("is-dragging");
  if (rail?.hasPointerCapture?.(event.pointerId)) rail.releasePointerCapture(event.pointerId);
  sessionRailDrag.active = false;
  sessionRailDrag.dragged = false;
  sessionRailDrag.pointerId = null;
  sessionRailDrag.trigger = null;
}

function handleSessionRailClick(event) {
  if (!suppressSessionClick && performance.now() >= suppressSessionClickUntil) return;
  event.preventDefault();
  event.stopPropagation();
}

function handleHorizontalRailPointerDown(event) {
  const rail = event.target.closest?.(".preset-strip, .filter-control, .previous-line");
  if (event.pointerType !== "mouse" || event.button !== 0 || !rail || rail.scrollWidth <= rail.clientWidth) return;

  horizontalDrag.active = true;
  horizontalDrag.dragged = false;
  horizontalDrag.pointerId = event.pointerId;
  horizontalDrag.rail = rail;
  horizontalDrag.trigger = event.target.closest?.("button[data-action]") || null;
  horizontalDrag.startX = event.clientX;
  horizontalDrag.startScrollLeft = rail.scrollLeft;
}

function handleHorizontalRailPointerMove(event) {
  const rail = horizontalDrag.rail;
  if (!rail || !horizontalDrag.active || event.pointerId !== horizontalDrag.pointerId) return;

  const deltaX = event.clientX - horizontalDrag.startX;
  if (!horizontalDrag.dragged && Math.abs(deltaX) > DRAG_START_THRESHOLD) {
    horizontalDrag.dragged = true;
    rail.classList.add("is-dragging");
    rail.setPointerCapture?.(event.pointerId);
  }

  if (!horizontalDrag.dragged) return;
  rail.scrollLeft = horizontalDrag.startScrollLeft - deltaX;
  event.preventDefault();
}

function handleHorizontalRailPointerEnd(event) {
  const rail = horizontalDrag.rail;
  if (!horizontalDrag.active || event.pointerId !== horizontalDrag.pointerId) return;

  rail?.classList.remove("is-dragging");
  if (rail?.hasPointerCapture?.(event.pointerId)) rail.releasePointerCapture(event.pointerId);
  if (horizontalDrag.dragged) suppressHorizontalClickUntil = performance.now() + DRAG_CLICK_SUPPRESS_MS;
  if (!horizontalDrag.dragged && horizontalDrag.trigger?.isConnected && event.target.closest?.("button[data-action]") === horizontalDrag.trigger) {
    suppressHorizontalClickUntil = performance.now() + DRAG_CLICK_SUPPRESS_MS;
    runAction(horizontalDrag.trigger);
  }
  window.setTimeout(() => {
    horizontalDrag.dragged = false;
  }, DRAG_CLICK_SUPPRESS_MS);

  horizontalDrag.active = false;
  horizontalDrag.pointerId = null;
  horizontalDrag.rail = null;
  horizontalDrag.trigger = null;
}

function handleHorizontalRailClick(event) {
  if ((!horizontalDrag.dragged && performance.now() >= suppressHorizontalClickUntil) || !event.target.closest?.(".preset-strip, .filter-control, .previous-line")) return;
  event.preventDefault();
  event.stopPropagation();
}

function renderDateControl() {
  if (els.date) els.date.value = state.activeDate;
  if (els.dateLabel) els.dateLabel.textContent = formatDateNumeric(state.activeDate);
  if (els.dateButton) {
    els.dateButton.setAttribute("aria-label", `Datum ${formatDate(state.activeDate)}`);
    els.dateButton.setAttribute("aria-expanded", els.datePicker && !els.datePicker.hidden ? "true" : "false");
  }
  if (els.datePicker && !els.datePicker.hidden) renderDatePicker();
}

function openDatePicker() {
  uiState.datePickerMonth = getMonthStart(state.activeDate);
  renderDatePicker();
  positionDatePicker();
  els.datePicker.hidden = false;
  els.dateButton?.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => {
    els.datePicker.classList.add("is-visible");
    const selected = els.datePickerGrid?.querySelector(".calendar-day.is-selected");
    selected?.focus({ preventScroll: true });
  });
}

function positionDatePicker() {
  if (!els.datePicker || !els.dateButton) return;
  const rect = els.dateButton.getBoundingClientRect();
  els.datePicker.style.setProperty("--date-picker-top", `${Math.round(rect.bottom + 8)}px`);
  els.datePicker.style.setProperty("--date-picker-right", `${Math.max(10, Math.round(window.innerWidth - rect.right))}px`);
}

function closeDatePicker() {
  if (!els.datePicker || els.datePicker.hidden) return;
  els.datePicker.classList.remove("is-visible");
  els.dateButton?.setAttribute("aria-expanded", "false");
  window.setTimeout(() => {
    els.datePicker.hidden = true;
  }, 160);
}

function shiftDatePickerMonth(amount) {
  uiState.datePickerMonth = addMonths(uiState.datePickerMonth || getMonthStart(state.activeDate), amount);
  renderDatePicker();
}

function selectCalendarDate(dateString) {
  if (!isValidDateString(dateString)) return;
  closeDatePicker();
  if (dateString === state.activeDate) {
    renderDateControl();
    return;
  }

  stopRestTimer();
  clearRestTimerCompletionTracking();
  state.activeDate = dateString;
  clearEditingHistoryIfActiveTargetChanged();
  getActiveWorkout();
  collapseExerciseCards();
  saveState(true);
  renderAll();
}

function renderDatePicker() {
  if (!els.datePickerGrid) return;
  const monthStart = uiState.datePickerMonth || getMonthStart(state.activeDate);
  const currentMonth = parseDateLocal(monthStart).getMonth();
  const calendarStart = addDays(monthStart, -getMondayOffset(monthStart));
  const todayString = today();
  const markedDates = getCalendarMarkedDates();

  if (els.datePickerMonth) els.datePickerMonth.textContent = formatMonthTitle(monthStart);
  if (els.datePickerSelected) els.datePickerSelected.textContent = formatDateNumeric(state.activeDate);
  if (els.datePickerWeekdays && !els.datePickerWeekdays.children.length) {
    els.datePickerWeekdays.innerHTML = CALENDAR_WEEKDAYS.map((day) => `<span>${day}</span>`).join("");
  }

  els.datePickerGrid.innerHTML = Array.from({ length: 42 }, (_, index) => {
    const dateString = addDays(calendarStart, index);
    const date = parseDateLocal(dateString);
    const day = date.getDate();
    const classes = [
      "calendar-day",
      date.getMonth() !== currentMonth ? "is-outside" : "",
      dateString === state.activeDate ? "is-selected" : "",
      dateString === todayString ? "is-today" : "",
      markedDates.has(dateString) ? "has-log" : "",
    ].filter(Boolean).join(" ");
    const label = `${formatDate(dateString)}${markedDates.has(dateString) ? ", log aanwezig" : ""}`;
    return `
      <button class="${classes}" type="button" data-action="calendar-select-date" data-date="${dateString}" aria-label="${escapeAttr(label)}" aria-pressed="${dateString === state.activeDate ? "true" : "false"}">
        <span>${day}</span>
        ${markedDates.has(dateString) ? "<i></i>" : ""}
      </button>
    `;
  }).join("");
}

function getCalendarMarkedDates() {
  const dates = new Set(state.history.map((entry) => entry.date).filter(Boolean));
  Object.entries(state.workouts || {}).forEach(([key, workout]) => {
    const date = key.split("::")[0];
    if (date && countFilledWorkoutItems(workout) > 0) dates.add(date);
  });
  return dates;
}

function handleDatePickerPointerDown(event) {
  if (els.datePicker?.hidden) return;
  datePickerDrag.active = true;
  datePickerDrag.pointerId = event.pointerId;
  datePickerDrag.startX = event.clientX;
  datePickerDrag.startY = event.clientY;
}

function handleDatePickerPointerEnd(event) {
  if (!datePickerDrag.active || event.pointerId !== datePickerDrag.pointerId) return;
  const deltaX = event.clientX - datePickerDrag.startX;
  const deltaY = event.clientY - datePickerDrag.startY;
  datePickerDrag.active = false;
  datePickerDrag.pointerId = null;

  if (Math.abs(deltaX) < 52 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
  suppressDatePickerClickUntil = performance.now() + 120;
  shiftDatePickerMonth(deltaX < 0 ? 1 : -1);
  event.preventDefault();
}

function handleDatePickerClick(event) {
  if (performance.now() >= suppressDatePickerClickUntil || !event.target.closest?.(".date-picker")) return;
  event.preventDefault();
  event.stopPropagation();
}

function renderTraining() {
  const session = findSession(state.activeSessionId) || getNextSession();
  state.activeSessionId = session.id;
  if (els.sessionSelect) els.sessionSelect.value = session.id;
  renderDateControl();

  const workout = getWorkout(session.id, state.activeDate);
  normalizeWorkout(workout, session);

  const totals = getCompletion(workout);
  const isOverig = session.id === "overig";
  renderTrainingTitle(session, totals, isOverig);

  const canAddCustom = session.id === "overig";
  els.exerciseList.dataset.sessionId = session.id;
  const loggedPresetCards = isOverig
    ? getLoggedPresetExercises(session, workout)
      .map((exercise, index) => renderExerciseCard(exercise, workout, index, { showCounter: false }))
      .join("")
    : "";
  const programCards = isOverig ? "" : session.exercises
    .map((exercise, index) => renderExerciseCard(exercise, workout, index, { showCounter: true }))
    .join("");
  const customCards = canAddCustom ? (workout.customItems || [])
    .map((item, index) => renderCustomCard(item, index, { showCounter: true }))
    .join("") : "";
  const addBar = canAddCustom ? renderOverigQuickAdd(session) : "";
  els.exerciseList.innerHTML = `
    ${addBar}
    ${loggedPresetCards}
    ${programCards}
    ${customCards}
  `;
  resizeNoteTextareas(els.exerciseList);
}

function renderTrainingTitle(session, totals, isOverig) {
  if (els.trainTitleLabel && els.trainProgressCount) {
    els.trainTitleLabel.textContent = session.label;
    els.trainProgressCount.textContent = isOverig ? "" : `${totals.done}/${totals.total}`;
    els.trainProgressCount.hidden = isOverig;
    els.trainProgressCount.classList.toggle("is-complete", !isOverig && totals.total > 0 && totals.done >= totals.total);
    return;
  }
  els.trainTitle.textContent = isOverig ? session.label : `${session.label} ${totals.done}/${totals.total}`;
}

function renderOverigQuickAdd(session) {
  const presetButtons = session.exercises
    .map((exercise) => `
      <button class="preset-chip" type="button" data-action="add-preset" data-preset-id="${escapeAttr(exercise.id)}">
        <i data-lucide="plus"></i>
        <span>${escapeHtml(getPresetShortLabel(getProgramExerciseName(exercise)))}</span>
      </button>
    `)
    .join("");

  return `
    <div class="quick-add">
      <div class="preset-strip-wrap">
        <div class="preset-strip" aria-label="Vaste opties">
          ${presetButtons}
        </div>
      </div>
      <div class="activity-add">
        <button class="mini-button" type="button" data-action="add-custom" data-kind="strength">
          <i data-lucide="plus"></i>
          <span>Lift</span>
        </button>
        <button class="mini-button" type="button" data-action="add-custom" data-kind="cardio">
          <i data-lucide="timer"></i>
          <span>Cardio</span>
        </button>
      </div>
    </div>
  `;
}

function renderExerciseCard(exercise, workout, index, options = {}) {
  const entry = ensureExerciseEntry(workout, exercise.id);
  const kind = getEntryKind(entry);
  const summary = getEntrySummary(entry, exercise);
  const ref = { exerciseId: exercise.id };
  const cardKey = getRefKey(ref);
  const isOpen = uiState.expandedCards.has(cardKey);
  const isEditingName = isOpen && uiState.editingName === cardKey;
  const isEditingSetup = isOpen && uiState.editingSetup === cardKey;
  const exerciseName = getProgramExerciseName(exercise);
  const target = { name: exerciseName, kind, setup: entry.setup };
  const previous = isOpen ? getActivityHistory(target) : [];
  const placeholderSource = isOpen ? getLatestActivitySnapshot(target) : null;
  return `
    <article class="exercise-card${isOpen ? " is-open" : ""}" data-kind="${kind}" data-exercise-id="${exercise.id}">
      <header class="exercise-head">
        <span class="exercise-index">${String(index + 1).padStart(2, "0")}</span>
        <div class="exercise-title">
          ${isEditingName ? `
            <input class="activity-name-input" type="text" data-field="exercise-name" ${getRefAttrs(ref)} value="${escapeAttr(exerciseName)}" data-original-value="${escapeAttr(exerciseName)}" aria-label="Naam">
          ` : `
            <button class="activity-name-display" type="button" data-action="${isOpen ? "edit-exercise-name" : "toggle-card"}" ${getRefAttrs(ref)}>${escapeHtml(exerciseName)}</button>
          `}
          ${renderExerciseSubtitle(summary, entry, ref, isOpen, isEditingSetup)}
        </div>
        ${renderCardControls(ref, summary, isOpen, entry, options)}
      </header>
      ${isOpen ? `
        ${renderPreviousPanel(previous, ref)}
        ${renderEntryBody(entry, ref, false, previous, placeholderSource)}
      ` : ""}
    </article>
  `;
}

function renderCustomCard(item, index, options = {}) {
  const kind = getEntryKind(item);
  const summary = getEntrySummary(item);
  const ref = { customIndex: index };
  const cardKey = getRefKey(ref);
  const isOpen = uiState.expandedCards.has(cardKey);
  const isEditingName = isOpen && uiState.editingName === cardKey;
  const previous = isOpen && item.name ? getActivityHistory({ name: item.name, kind }) : [];
  const placeholderSource = isOpen && item.name ? getLatestActivitySnapshot({ name: item.name, kind }) : null;
  return `
    <article class="exercise-card${isOpen ? " is-open" : ""}" data-kind="${kind}" data-custom-index="${index}">
      <header class="exercise-head custom-head">
        <span class="exercise-index">${String(index + 1).padStart(2, "0")}</span>
        <div class="exercise-title">
          ${isEditingName ? `
            <input class="activity-name-input" type="text" data-field="activity-name" data-custom-index="${index}" value="${escapeAttr(item.name)}" data-original-value="${escapeAttr(item.name)}" aria-label="Naam">
          ` : `
            <button class="activity-name-display" type="button" data-action="${isOpen ? "edit-name" : "toggle-card"}" data-custom-index="${index}">${escapeHtml(item.name || "Naam")}</button>
          `}
          <span class="exercise-subtitle">${escapeHtml(getCardSubtitle(summary, item))}</span>
        </div>
        ${renderCardControls(ref, summary, isOpen, item, { ...options, removable: true })}
      </header>
      ${isOpen ? `
        ${renderPreviousPanel(previous, ref)}
        ${renderEntryBody(item, ref, false, previous, placeholderSource)}
      ` : ""}
    </article>
  `;
}

function renderCardControls(ref, summary, isOpen, entry, options = {}) {
  const refAttrs = getRefAttrs(ref);
  const canAdjustSets = isOpen;
  const setTotal = isMetricEntry(entry) ? getMetricAttempts(entry).length : (entry.sets || []).length;
  const disableRemove = canAdjustSets && setTotal <= 0;
  const showCounter = options.showCounter !== false;
  const removable = Boolean(options.removable);
  const counterComplete = summary.total > 0 && summary.done >= summary.total;
  return `
    <div class="card-controls${canAdjustSets && showCounter ? " has-stepper" : ""}${removable ? " has-delete" : ""}">
      ${canAdjustSets && showCounter ? `
        <div class="set-adjuster" aria-label="Sets aanpassen">
          <button class="set-stepper set-stepper-minus" type="button" data-action="remove-set" ${refAttrs} ${disableRemove ? "disabled" : ""} aria-label="Set minder" title="Set minder">
            <i data-lucide="minus"></i>
          </button>
          <span class="set-counter set-counter-box">${summary.counter}</span>
          <button class="set-stepper set-stepper-plus" type="button" data-action="add-set" ${refAttrs} aria-label="Set erbij" title="Set erbij">
            <i data-lucide="plus"></i>
          </button>
        </div>
      ` : ""}
      <button class="card-toggle${!isOpen && showCounter && !canAdjustSets && counterComplete ? " is-complete" : ""}" type="button" data-action="toggle-card" ${refAttrs} aria-expanded="${isOpen}" aria-label="${isOpen ? "Klap dicht" : "Klap open"}">
        ${showCounter && !canAdjustSets ? `<span class="set-counter">${summary.counter}</span>` : ""}
        <i data-lucide="${isOpen ? "chevron-up" : "chevron-down"}"></i>
      </button>
      ${removable ? `
        <button class="card-delete" type="button" data-action="delete-custom" ${refAttrs} aria-label="Verwijder" title="Verwijder">
          <i data-lucide="trash"></i>
        </button>
      ` : ""}
    </div>
  `;
}

function renderExerciseSubtitle(summary, entry, ref, isOpen, isEditingSetup) {
  const refAttrs = getRefAttrs(ref);
  if (isEditingSetup) {
    return `
      <input class="setup-input" type="text" data-field="exercise-setup" ${refAttrs} value="${escapeAttr(entry.setup || "")}" data-original-value="${escapeAttr(entry.setup || "")}" placeholder="setup">
    `;
  }

  if (!isOpen) {
    return `<span class="exercise-subtitle">${escapeHtml(getCardSubtitle(summary, entry))}</span>`;
  }

  return `
    <button class="exercise-subtitle setup-display setup-display-button" type="button" data-action="edit-setup" ${refAttrs}>
      ${escapeHtml(getCardSubtitle(summary, entry))}
    </button>
  `;
}

function getCardSubtitle(summary, entry) {
  const setup = normalizeSetupLabel(entry?.setup || "");
  return setup ? `${summary.label} - ${setup}` : summary.label;
}

function renderEntryBody(entry, ref, removable = false, previous = [], placeholderSource = previous[0]) {
  const refAttrs = getRefAttrs(ref);
  const last = placeholderSource || previous[0];
  if (entry.kind === "run") {
    return renderRunBody(entry, ref, removable, last);
  }
  if (isMetricEntry(entry)) {
    return renderOtherMetricBody(entry, ref, removable, last);
  }

  const unilateral = isUnilateralEntry(entry);
  const rows = (entry.sets || []).map((set, setIndex) => renderSetRow(ref, set, setIndex, last?.sets?.[setIndex], entry)).join("");
  const hasSets = (entry.sets || []).length > 0;
  return `
    <div class="set-list">
      ${renderBodyweightControl(entry, ref)}
      ${hasSets ? `
        <div class="set-field-labels${unilateral ? " is-unilateral" : ""}" aria-hidden="true">
          ${unilateral ? "<span>side</span>" : ""}
          <span>${usesBodyweightLoad(entry) ? "+kg" : "kg"}</span>
          <span>reps</span>
          <span>rpe</span>
        </div>
      ` : ""}
      ${rows}
    </div>
    ${renderEntryNote(entry, ref, last)}
    ${removable ? renderCustomActions(ref) : ""}
  `;
}

function renderBodyweightControl(entry, ref) {
  if (!usesBodyweightLoad(entry)) return "";
  return `
    <label class="bodyweight-control" ${getRefAttrs(ref)}>
      <span>BW</span>
      <input type="text" inputmode="decimal" data-field="bodyweight" value="${escapeAttr(entry.bodyweight)}" aria-label="Lichaamsgewicht in kg">
      <em>kg</em>
    </label>
  `;
}

function renderRunBody(entry, ref, removable, previous) {
  const attempts = getMetricAttempts(entry);
  return `
    <div class="metric-attempts">
      ${attempts.map((attempt, index) => renderRunAttempt(ref, attempt, index, getPreviousMetricAttempt(previous, index))).join("")}
    </div>
    ${renderEntryNote(entry, ref, previous)}
    ${removable ? renderCustomActions(ref) : ""}
  `;
}

function renderOtherMetricBody(entry, ref, removable, previous) {
  const attempts = getMetricAttempts(entry);
  return `
    <div class="metric-attempts">
      ${attempts.map((attempt, index) => renderOtherMetricAttempt(ref, attempt, index, getPreviousMetricAttempt(previous, index))).join("")}
    </div>
    ${renderEntryNote(entry, ref, previous)}
    ${removable ? renderCustomActions(ref) : ""}
  `;
}

function renderRunAttempt(ref, attempt, index, previous) {
  const metrics = attempt.metrics || makeMetrics();
  const pace = calculateRunPace(metrics) || metrics.pace || "";
  const paceFallback = getMetricPlaceholder(previous, "pace", "calc");
  const paceText = pace ? `${pace}/km` : paceFallback;
  return `
    <div class="metric-list" ${getRefAttrs(ref)} data-metric-index="${index}">
      <div class="metric-grid run-grid">
        <input type="text" inputmode="decimal" placeholder="${escapeAttr(getMetricPlaceholder(previous, "distance", "km"))}" data-field="distance" value="${escapeAttr(metrics.distance)}" aria-label="Afstand in km">
        <input type="text" inputmode="numeric" placeholder="${escapeAttr(getMetricPlaceholder(previous, "duration", "tijd"))}" data-field="duration" value="${escapeAttr(metrics.duration)}" aria-label="Tijd">
        <input type="text" inputmode="decimal" placeholder="${escapeAttr(getMetricPlaceholder(previous, "intensity", "int."))}" data-field="intensity" value="${escapeAttr(metrics.intensity)}" aria-label="Intensiteit 0 tot 10">
        <output class="metric-output pace-output${pace ? " has-value" : ""}" data-field="pace-output" data-empty-label="${escapeAttr(paceFallback)}">${escapeHtml(paceText)}</output>
      </div>
    </div>
  `;
}

function renderOtherMetricAttempt(ref, attempt, index, previous) {
  const metrics = attempt.metrics || makeMetrics();
  const speedValue = metrics.speed || metrics.amount || "";
  return `
    <div class="metric-list" ${getRefAttrs(ref)} data-metric-index="${index}">
      <div class="metric-grid other-grid">
        <input type="text" inputmode="decimal" placeholder="${escapeAttr(getMetricPlaceholder(previous, "duration", "min"))}" data-field="duration" value="${escapeAttr(metrics.duration)}" aria-label="Tijd in minuten">
        <input type="text" inputmode="decimal" placeholder="${escapeAttr(getMetricPlaceholder(previous, "speed", "km/u"))}" data-field="speed" value="${escapeAttr(speedValue)}" aria-label="Snelheid in kilometer per uur">
        <input type="text" inputmode="decimal" placeholder="${escapeAttr(getMetricPlaceholder(previous, "rpe", "RPE"))}" data-field="metric-rpe" value="${escapeAttr(metrics.rpe)}" aria-label="RPE">
      </div>
    </div>
  `;
}

function renderPreviousPanel(previous, ref) {
  if (!previous.length) return "";
  const key = getRefKey(ref);
  const activeIndex = clampHistoryCursor(key, previous.length);
  const item = previous[activeIndex];
  return `
    <div class="previous-strip">
      ${renderPreviousRow(item, ref, activeIndex, previous.length)}
    </div>
  `;
}

function renderPreviousRow(item, ref, index, total) {
  const dateLabel = formatPreviousDate(item.date);
  const hasNav = total > 1;
  return `
    <div class="previous-row${hasNav ? " has-nav" : ""}">
      <div class="previous-line" tabindex="0" aria-label="${dateLabel} ${escapeAttr(item.summary)}">
        <span class="previous-date">
          ${hasNav ? `
            <button class="previous-nav previous-nav-inline" type="button" data-action="history-newer" data-history-index="${index}" data-history-count="${total}" ${getRefAttrs(ref)} ${index <= 0 ? "disabled" : ""} aria-label="Nieuwer" title="Nieuwer">
              <i data-lucide="chevron-left"></i>
            </button>
          ` : ""}
          <span>${dateLabel}</span>
          ${hasNav ? `
            <button class="previous-nav previous-nav-inline" type="button" data-action="history-older" data-history-index="${index}" data-history-count="${total}" ${getRefAttrs(ref)} ${index >= total - 1 ? "disabled" : ""} aria-label="Ouder" title="Ouder">
              <i data-lucide="chevron-right"></i>
            </button>
          ` : ""}
        </span>
        <strong>${escapeHtml(item.summary)}</strong>
        ${hasNav ? `<em>${index + 1}/${total}</em>` : ""}
      </div>
      <button class="mini-button icon-mini" type="button" data-action="copy-history" data-history-index="${index}" ${getRefAttrs(ref)} aria-label="Kopieer vorige" title="Kopieer vorige">
        <i data-lucide="copy"></i>
      </button>
    </div>
  `;
}

function clampHistoryCursor(key, total) {
  const current = Number(uiState.historyCursor.get(key) || 0);
  const clamped = Math.max(0, Math.min(Math.max(0, total - 1), current));
  if (clamped !== current) uiState.historyCursor.set(key, clamped);
  return clamped;
}

function renderEntryNote(entry, ref, previous) {
  const placeholder = previous?.note ? previous.note : "Note";
  return `
    <div class="exercise-note">
      <textarea rows="1" data-field="exercise-note" ${getRefAttrs(ref)} placeholder="${escapeAttr(placeholder)}">${escapeHtml(entry.note || "")}</textarea>
    </div>
  `;
}

function renderCustomActions(ref) {
  return `
    <div class="exercise-actions">
      <button class="mini-button icon-mini danger" type="button" data-action="delete-custom" ${getRefAttrs(ref)} aria-label="Verwijder" title="Verwijder">
        <i data-lucide="trash"></i>
      </button>
    </div>
  `;
}

function renderSetRow(ref, set, setIndex, previousSet, entry) {
  if (isUnilateralSet(set, entry)) {
    return `
      <div class="set-pair">
        ${renderStrengthSideRow(ref, set, setIndex, previousSet, "left", entry)}
        ${renderStrengthSideRow(ref, set, setIndex, previousSet, "right", entry)}
      </div>
    `;
  }

  return `
    <div class="set-row" ${getRefAttrs(ref)} data-set-index="${setIndex}">
      <input type="text" inputmode="decimal" placeholder="${escapeAttr(getSetPlaceholder(previousSet, "weight", usesBodyweightLoad(entry) ? "+kg" : "kg"))}" data-field="weight" value="${escapeAttr(set.weight)}">
      <input type="text" inputmode="decimal" placeholder="${escapeAttr(getSetPlaceholder(previousSet, "reps", "reps"))}" data-field="reps" value="${escapeAttr(set.reps)}">
      <input type="text" inputmode="decimal" placeholder="${escapeAttr(getSetPlaceholder(previousSet, "rpe", "RPE"))}" data-field="rpe" value="${escapeAttr(set.rpe)}">
    </div>
  `;
}

function renderStrengthSideRow(ref, set, setIndex, previousSet, side, entry) {
  const current = set?.[side] || makeStrengthSide();
  const previous = previousSet?.[side] || null;
  const label = side === "left" ? "L" : "R";
  return `
    <div class="set-row is-unilateral" ${getRefAttrs(ref)} data-set-index="${setIndex}" data-side="${side}">
      <span class="set-side" aria-label="${side === "left" ? "Links" : "Rechts"}">${label}</span>
      <input type="text" inputmode="decimal" placeholder="${escapeAttr(getSetPlaceholder(previous, "weight", usesBodyweightLoad(entry) ? "+kg" : "kg"))}" data-field="weight" value="${escapeAttr(current.weight)}">
      <input type="text" inputmode="decimal" placeholder="${escapeAttr(getSetPlaceholder(previous, "reps", "reps"))}" data-field="reps" value="${escapeAttr(current.reps)}">
      <input type="text" inputmode="decimal" placeholder="${escapeAttr(getSetPlaceholder(previous, "rpe", "RPE"))}" data-field="rpe" value="${escapeAttr(current.rpe)}">
    </div>
  `;
}

function renderHistory() {
  if (!state.history.length) {
    els.historyList.innerHTML = '<div class="empty-state">Nog geen afgeronde sessies.</div>';
    return;
  }

  els.historyList.innerHTML = getSortedHistoryDesc()
    .map((entry) => {
      const cardioSummary = getCardioSummary(entry.workout);
      const progress = getHistoryProgressSummary(entry);
      const summaryParts = [
        { text: formatDate(entry.date), className: "" },
        { text: getHistoryCompletionLabel(entry), className: "" },
        progress,
        cardioSummary ? { text: cardioSummary, className: "" } : null,
      ].filter(Boolean);
      return `
        <article class="history-item">
          <div class="history-top">
            <div>
              <div class="history-title">${escapeHtml(entry.sessionLabel)}</div>
              <div class="history-meta history-summary">
                ${summaryParts.map((part) => `<span class="${escapeAttr(part.className || "history-summary-item")}">${escapeHtml(part.text)}</span>`).join("")}
              </div>
            </div>
          </div>
          ${entry.note ? `<div class="history-meta">${escapeHtml(entry.note)}</div>` : ""}
          <div class="history-actions">
            <button class="mini-button" type="button" data-action="open-history" data-history-id="${entry.id}">
              <i data-lucide="folder-open"></i>
              <span>Open</span>
            </button>
            <button class="mini-button danger" type="button" data-action="delete-history" data-history-id="${entry.id}">
              <i data-lucide="trash"></i>
              <span>Wis</span>
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderStats() {
  const last30 = getStatsHistory(30);
  const totalSets = state.history.reduce((sum, entry) => sum + (entry.doneSets || 0), 0);
  const last = getSortedHistoryDesc()[0];
  const currentStreak = getCycleCompletionStreak();

  const cards = [
    ["Sessies", state.history.length],
    ["Sets", totalSets],
    ["Laatste 30d", last30.length],
    ["Streak", currentStreak],
  ];

  els.statsGrid.innerHTML = cards
    .map(([label, value]) => `
      <div class="stat-card">
        <strong>${value}</strong>
        <span class="stat-label">${label}</span>
      </div>
    `)
    .join("");

  const group = getChartGroup();
  const filter = getChartFilter(group);
  const rangeDays = getStatsRangeDays();
  renderTrendChart(group, filter, rangeDays);

  if (shouldRenderBoomingGroups(group, filter)) {
    const highlights = getBoomingMuscleGroups(group, rangeDays);
    if (!highlights.length) {
      els.recordsList.innerHTML = '<div class="empty-state">Meer metingen nodig voor booming groups.</div>';
      return;
    }

    els.recordsList.innerHTML = highlights
      .map(renderBoomingGroupItem)
      .join("");
    return;
  }

  const records = getRecords(group, filter, rangeDays).slice(0, 12);
  if (!records.length) {
    const emptyText = group === "Running"
      ? "Nog geen runs met afstand en tijd."
      : (last ? "Vul gewicht en reps in voor records." : "Nog geen records.");
    els.recordsList.innerHTML = `<div class="empty-state">${emptyText}</div>`;
    return;
  }

  els.recordsList.innerHTML = records
    .map(renderRecordItem)
    .join("");
}

function renderTrendChart(group = getChartGroup(), filter = getChartFilter(group), rangeDays = getStatsRangeDays()) {
  state.chartGroup = group;
  state.chartFilter = filter;
  state.statsRangeDays = getStatsRangeDays(rangeDays);
  const metrics = getChartMetrics(group, filter);
  if (!metrics.some((metric) => metric.value === state.chartMetric)) {
    state.chartMetric = getDefaultChartMetric(group);
  }

  document.querySelectorAll("[data-chart-group]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.chartGroup === group);
  });
  document.querySelectorAll("[data-range-days]").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.rangeDays) === state.statsRangeDays);
  });
  renderChartFilterControl(group, filter);
  const metric = metrics.find((item) => item.value === state.chartMetric) || metrics[0];
  const metricField = els.chartMetricSelect.closest(".chart-metric-field");
  if (metricField) metricField.hidden = metrics.length <= 1;

  els.chartMetricSelect.innerHTML = metrics
    .map((metric) => `<option value="${escapeAttr(metric.value)}">${escapeHtml(metric.label)}</option>`)
    .join("");
  els.chartMetricSelect.value = state.chartMetric;

  const points = getTrendPoints(group, metric.value, filter, state.statsRangeDays);
  renderChartReadout(points, metric.value);
  drawTrendCanvas(points, metric);
}

function renderStorage() {
  if (!els.storageReadout) return;
  const bytes = new Blob([JSON.stringify(state)]).size;
  const workouts = Object.keys(state.workouts || {}).length;
  const lastBackup = state.lastBackupAt
    ? new Date(state.lastBackupAt).toLocaleString("nl-NL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "Nog niet";
  els.storageReadout.innerHTML = `
    <div>Workouts: ${workouts}</div>
    <div>Afgerond: ${state.history.length}</div>
    <div>Laatste backup: ${escapeHtml(lastBackup)}</div>
    <div>Opslag: ${formatBytes(bytes)}</div>
  `;
  renderCloudSync();
}

function handleClick(event) {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) {
    const head = event.target.closest(".exercise-head");
    if (head && !event.target.closest("input, textarea, select, button")) {
      toggleExerciseCard(head);
    }
    return;
  }

  runAction(trigger);
}

function runAction(trigger) {
  const action = trigger.dataset.action;
  if (action === "select-session") selectSession(trigger.dataset.sessionId);
  if (action === "toggle-card") toggleExerciseCard(trigger);
  if (action === "add-set") addSet(trigger);
  if (action === "remove-set") removeLastSet(trigger);
  if (action === "add-preset") addPresetItem(trigger.dataset.presetId);
  if (action === "add-custom") addCustomItem(trigger.dataset.kind);
  if (action === "delete-custom") deleteCustomItem(trigger.dataset.customIndex);
  if (action === "copy-history") copyPreviousEntry(trigger);
  if (action === "history-newer") shiftPreviousHistory(trigger, -1);
  if (action === "history-older") shiftPreviousHistory(trigger, 1);
  if (action === "edit-setup") editSetup(trigger);
  if (action === "edit-exercise-name") editProgramExerciseName(trigger);
  if (action === "edit-name") editActivityName(trigger);
  if (action === "rest-timer-toggle-pause") toggleRestTimerPause();
  if (action === "rest-timer-subtract") addRestTimerSeconds(-30);
  if (action === "rest-timer-add") addRestTimerSeconds(30);
  if (action === "rest-timer-dismiss") stopRestTimer();
  if (action === "rest-alarm-dismiss") stopRestTimer();
  if (action === "complete-session") completeSession();
  if (action === "reset-current") resetCurrent();
  if (action === "reset-cycle") resetCycle();
  if (action === "confirm-pending") confirmPendingAction();
  if (action === "cancel-confirm") closeConfirmModal();
  if (action === "open-date-picker") openDatePicker();
  if (action === "close-date-picker") closeDatePicker();
  if (action === "calendar-prev-month") shiftDatePickerMonth(-1);
  if (action === "calendar-next-month") shiftDatePickerMonth(1);
  if (action === "calendar-select-date") selectCalendarDate(trigger.dataset.date);
  if (action === "calendar-relative") selectCalendarDate(addDays(today(), Number(trigger.dataset.dateOffset || 0)));
  if (action === "quick-export") exportData();
  if (action === "import-data") els.importFile?.click();
  if (action === "cloud-login") cloudLogin();
  if (action === "cloud-sync-now") syncCloudNow();
  if (action === "cloud-logout") cloudLogout();
  if (action === "reset-all") resetAll();
  if (action === "install") installApp();
  if (action === "open-history") openHistory(trigger.dataset.historyId);
  if (action === "delete-history") deleteHistory(trigger.dataset.historyId);
  if (action === "chart-group") {
    state.chartGroup = trigger.dataset.chartGroup || "Upper";
    state.chartFilter = "all";
    state.chartMetric = getDefaultChartMetric(state.chartGroup);
    saveState();
    renderStats();
  }
  if (action === "chart-filter") {
    state.chartFilter = trigger.dataset.chartFilter || "all";
    state.chartMetric = getDefaultChartMetric(state.chartGroup);
    saveState();
    renderStats();
  }
  if (action === "chart-range") {
    state.statsRangeDays = getStatsRangeDays(trigger.dataset.rangeDays);
    saveState();
    renderStats();
  }
}

function handleKeydown(event) {
  if (event.target?.dataset?.field === "exercise-name") {
    if (event.key === "Enter") {
      event.preventDefault();
      event.target.blur();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      const ref = getRefFromElement(event.target);
      setProgramExerciseName(ref.exerciseId, event.target.dataset.originalValue || "");
      saveState();
      finishNameEdit();
      return;
    }
  }

  if (event.target?.dataset?.field === "activity-name") {
    if (event.key === "Enter") {
      event.preventDefault();
      event.target.blur();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      const workout = getActiveWorkout();
      const entry = getEntryFromElement(workout, event.target);
      entry.name = event.target.dataset.originalValue || entry.name || "";
      saveState();
      finishNameEdit();
      return;
    }
  }

  if (event.target?.dataset?.field === "exercise-setup") {
    if (event.key === "Enter") {
      event.preventDefault();
      event.target.blur();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      const workout = getActiveWorkout();
      const entry = getEntryFromElement(workout, event.target);
      entry.setup = event.target.dataset.originalValue || "";
      saveState();
      finishSetupEdit();
      return;
    }
  }

  if (event.key === "Escape" && els.confirmModal && !els.confirmModal.hidden) {
    closeConfirmModal();
  }

  if (event.key === "Escape" && els.datePicker && !els.datePicker.hidden) {
    closeDatePicker();
  }
}

function handleInput(event) {
  const target = event.target;
  if (target.dataset.field === "exercise-name") {
    const ref = getRefFromElement(target);
    setProgramExerciseName(ref.exerciseId, target.value);
    saveState();
    return;
  }

  if (target.dataset.field === "exercise-setup") {
    const workout = getActiveWorkout();
    const entry = getEntryFromElement(workout, target);
    entry.setup = target.value;
    saveState();
    return;
  }

  if (target.dataset.field === "exercise-note") {
    const workout = getActiveWorkout();
    const entry = getEntryFromElement(workout, target);
    entry.note = target.value;
    resizeNoteTextarea(target);
    saveState();
    return;
  }

  if (target.dataset.field === "activity-name") {
    const workout = getActiveWorkout();
    const entry = getEntryFromElement(workout, target);
    entry.name = target.value;
    saveState();
    return;
  }

  if (target.dataset.field === "bodyweight") {
    const workout = getActiveWorkout();
    const entry = getEntryFromElement(workout, target);
    const bodyweight = normalizeInputValue(target);
    entry.bodyweight = bodyweight;
    if (parseNumber(bodyweight) > 0) state.bodyweight = bodyweight;
    updateEntrySummary(target, entry);
    saveState();
    return;
  }

  if (["distance", "duration", "intensity", "amount", "speed", "unit", "metric-rpe"].includes(target.dataset.field)) {
    const workout = getActiveWorkout();
    const entry = getEntryFromElement(workout, target);
    entry.metrics ||= makeMetrics();
    const attempt = getMetricAttemptFromElement(entry, target);
    const metrics = attempt ? attempt.metrics : entry.metrics;
    const metricField = target.dataset.field === "metric-rpe" ? "rpe" : target.dataset.field;
    metrics[metricField] = normalizeInputValue(target);
    if (entry.kind === "run") {
      metrics.pace = calculateRunPace(metrics);
      updateRunPaceOutput(target, metrics);
    }
    if (attempt) syncMetricEntryFromAttempts(entry);
    updateEntrySummary(target, entry);
    updateTrainingProgressReadout();
    saveState();
    return;
  }

  const row = target.closest(".set-row");
  if (!row || !target.dataset.field) return;

  const workout = getActiveWorkout();
  const entry = getEntryFromElement(workout, row);
  const parentSet = entry.sets[Number(row.dataset.setIndex)];
  const set = row.dataset.side ? parentSet?.[row.dataset.side] : parentSet;
  if (!set) return;

  const side = row.dataset.side || "";
  const wasSetComplete = hasCompleteStrengthSet(parentSet, entry);
  const wasSideComplete = side ? hasCompleteStrengthSide(parentSet?.[side], entry) : false;

  set[target.dataset.field] = normalizeInputValue(target);

  const isSetComplete = hasCompleteStrengthSet(parentSet, entry);
  const isSideComplete = side ? hasCompleteStrengthSide(parentSet?.[side], entry) : false;
  const ref = getRefFromElement(row);
  if (side && !wasSideComplete && isSideComplete && !isSetComplete) {
    startSideRestTimer(entry, ref, Number(row.dataset.setIndex), side);
  }
  if (!wasSetComplete && isSetComplete) {
    startSetRestTimer(entry, ref, Number(row.dataset.setIndex));
  }

  updateEntrySummary(target, entry);
  updateTrainingProgressReadout();
  saveState();
}

function startSetRestTimer(entry, ref, setIndex) {
  if (state.editingHistoryId) return;
  const completionKey = getRestTimerCompletionKey(ref, setIndex, "set");
  if (restTimer.completionKeys.has(completionKey)) return;
  restTimer.completionKeys.add(completionKey);
  startRestTimer(getEntryRestSeconds(entry), REST_TIMER_ALARM_SET);
}

function startSideRestTimer(entry, ref, setIndex, side) {
  if (state.editingHistoryId) return;
  const completionKey = getRestTimerCompletionKey(ref, setIndex, side);
  if (restTimer.completionKeys.has(completionKey)) return;
  restTimer.completionKeys.add(completionKey);

  startRestTimer(REST_TIMER_SIDE_SECONDS, REST_TIMER_ALARM_SIDE);
}

function getRestTimerCompletionKey(ref, setIndex, part) {
  return [state.activeDate, state.activeSessionId, getRefKey(ref), setIndex, part].join("::");
}

function clearRestTimerCompletionTracking() {
  restTimer.completionKeys.clear();
}

function getEntryRestSeconds(entry) {
  const configured = Number(entry?.restSeconds);
  if (Number.isFinite(configured) && configured > 0) return Math.round(configured);

  const name = normalizeExerciseName(entry?.name);
  return isLikelyCompoundExercise(name) ? REST_TIMER_COMPOUND_SECONDS : REST_TIMER_ISOLATION_SECONDS;
}

function isLikelyCompoundExercise(name) {
  return /(bench|pull\s?ups?|weighted dips|deadlift|sissy squats|shoulder press|(^|\s)row|incline db press|db press)/.test(name);
}

function startRestTimer(seconds, alarmKind = REST_TIMER_ALARM_SET) {
  const duration = Math.max(1, Math.round(Number(seconds) || REST_TIMER_ISOLATION_SECONDS));
  clearRestTimerInterval();
  clearRestTimerAlarm();
  restTimer.active = true;
  restTimer.status = "running";
  restTimer.alarmKind = alarmKind === REST_TIMER_ALARM_SIDE ? REST_TIMER_ALARM_SIDE : REST_TIMER_ALARM_SET;
  restTimer.durationSeconds = duration;
  restTimer.remainingSeconds = duration;
  restTimer.endsAt = Date.now() + duration * 1000;
  prepareRestTimerAudio();
  renderRestTimer();
  restTimer.interval = setInterval(tickRestTimer, REST_TIMER_TICK_MS);
}

function tickRestTimer() {
  if (restTimer.status !== "running") return;
  const remaining = getRestTimerRemainingSeconds();
  if (remaining <= 0) {
    finishRestTimer();
    return;
  }
  if (remaining === restTimer.remainingSeconds) return;
  restTimer.remainingSeconds = remaining;
  renderRestTimer();
}

function getRestTimerRemainingSeconds() {
  if (restTimer.status !== "running") return restTimer.remainingSeconds;
  return Math.max(0, Math.ceil((restTimer.endsAt - Date.now()) / 1000));
}

function addRestTimerSeconds(seconds) {
  if (!restTimer.active || restTimer.status === "done") return;
  const adjustment = Math.round(Number(seconds) || 0);
  if (!adjustment) return;
  const remaining = Math.max(0, getRestTimerRemainingSeconds() + adjustment);
  if (remaining <= 0) {
    finishRestTimer();
    return;
  }

  restTimer.remainingSeconds = remaining;
  restTimer.durationSeconds = Math.max(remaining, restTimer.durationSeconds + adjustment);
  if (restTimer.status === "running") restTimer.endsAt = Date.now() + remaining * 1000;
  renderRestTimer();
}

function toggleRestTimerPause() {
  if (!restTimer.active || restTimer.status === "done") return;

  if (restTimer.status === "paused") {
    restTimer.status = "running";
    restTimer.endsAt = Date.now() + restTimer.remainingSeconds * 1000;
    clearRestTimerInterval();
    restTimer.interval = setInterval(tickRestTimer, REST_TIMER_TICK_MS);
  } else {
    restTimer.remainingSeconds = getRestTimerRemainingSeconds();
    clearRestTimerInterval();
    restTimer.status = "paused";
    restTimer.endsAt = 0;
  }

  renderRestTimer();
}

function finishRestTimer() {
  clearRestTimerInterval();
  restTimer.active = false;
  restTimer.status = "done";
  restTimer.remainingSeconds = 0;
  restTimer.endsAt = 0;
  renderRestTimer();
  openRestTimerAlarm();
}

function stopRestTimer() {
  clearRestTimerInterval();
  clearRestTimerAlarm();
  restTimer.active = false;
  restTimer.status = "idle";
  restTimer.durationSeconds = 0;
  restTimer.remainingSeconds = 0;
  restTimer.endsAt = 0;
  restTimer.alarmKind = REST_TIMER_ALARM_SET;
  renderRestTimer();
}

function clearRestTimerInterval() {
  clearInterval(restTimer.interval);
  restTimer.interval = null;
}

function openRestTimerAlarm() {
  clearInterval(restTimer.alarmInterval);
  restTimer.alarmInterval = null;
  restTimer.alarmFallbackActive = false;
  clearTimeout(restTimer.alarmHideTimeout);
  restTimer.alarmHideTimeout = null;

  if (els.restAlarm) {
    const sideChange = restTimer.alarmKind === REST_TIMER_ALARM_SIDE;
    els.restAlarm.dataset.kind = restTimer.alarmKind;
    delete els.restAlarm.dataset.mediaError;
    delete els.restAlarm.dataset.playback;
    if (els.restAlarmTitle) els.restAlarmTitle.textContent = sideChange ? "Andere kant." : "Volgende set.";
    if (els.restAlarmActionLabel) els.restAlarmActionLabel.textContent = sideChange ? "Start andere kant" : "Start set";
    els.restAlarm.hidden = false;
    requestAnimationFrame(() => {
      els.restAlarm.classList.add("is-visible");
      els.restAlarm.querySelector('[data-action="rest-alarm-dismiss"]')?.focus({ preventScroll: true });
    });
  }

  prepareRestTimerAudio();
  playRestTimerAlarm();
  refreshIcons();
}

function clearRestTimerAlarm() {
  clearInterval(restTimer.alarmInterval);
  restTimer.alarmInterval = null;
  restTimer.alarmFallbackActive = false;
  restTimer.alarmPlaybackPending = false;
  restTimer.alarmSequence += 1;
  if (restTimer.alarmSource) {
    const source = restTimer.alarmSource;
    const gain = restTimer.alarmGain;
    restTimer.alarmSource = null;
    restTimer.alarmGain = null;
    source.onended = null;
    try {
      source.stop();
    } catch {}
    try {
      source.disconnect();
      gain?.disconnect();
    } catch {}
  }
  restTimer.alarmMedia = null;
  stopRestTimerMediaElement(els.restAlarmAudio);
  stopRestTimerMediaElement(els.sideAlarmAudio);
  clearTimeout(restTimer.alarmHideTimeout);
  restTimer.alarmHideTimeout = null;
  navigator.vibrate?.(0);

  if (!els.restAlarm || els.restAlarm.hidden) return;
  delete els.restAlarm.dataset.playback;
  delete els.restAlarm.dataset.mediaError;
  els.restAlarm.classList.remove("is-visible");
  restTimer.alarmHideTimeout = setTimeout(() => {
    els.restAlarm.hidden = true;
    restTimer.alarmHideTimeout = null;
  }, 160);
}

function renderRestTimer() {
  if (!els.restTimer) return;
  const visible = restTimer.active;
  els.restTimer.dataset.state = restTimer.status;
  els.restTimer.hidden = !visible;
  document.body.classList.toggle("has-rest-timer", visible);
  if (!visible) return;

  const progress = restTimer.durationSeconds
    ? Math.min(100, Math.max(0, ((restTimer.durationSeconds - restTimer.remainingSeconds) / restTimer.durationSeconds) * 100))
    : 0;

  els.restTimer.style.setProperty("--rest-timer-progress", `${progress}%`);
  if (els.restTimerValue) els.restTimerValue.textContent = formatRestTimerSeconds(restTimer.remainingSeconds);
  if (els.restTimerPause) {
    const paused = restTimer.status === "paused";
    const state = paused ? "paused" : "running";
    if (els.restTimerPause.dataset.state !== state) {
      els.restTimerPause.dataset.state = state;
      els.restTimerPause.setAttribute("aria-label", paused ? "Hervat rusttimer" : "Pauzeer rusttimer");
      els.restTimerPause.setAttribute("title", paused ? "Hervat rusttimer" : "Pauzeer rusttimer");
      els.restTimerPause.setAttribute("aria-pressed", String(paused));
      els.restTimerPause.innerHTML = `<i data-lucide="${paused ? "play" : "pause"}"></i>`;
      refreshIcons();
    }
  }
}

function formatRestTimerSeconds(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

function ensureRestTimerAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!restTimer.audioContext || restTimer.audioContext.state === "closed") {
    restTimer.audioContext = new AudioContext();
    restTimer.audioUnlocked = false;
  }
  return restTimer.audioContext;
}

function prepareRestTimerAudio() {
  [els.restAlarmAudio, els.sideAlarmAudio].forEach((audio) => {
    if (!audio || audio.dataset.prepared === "true") return;
    audio.dataset.prepared = "true";
    audio.load();
  });
  const context = ensureRestTimerAudioContext();
  if (!context) return null;
  loadRestTimerAudioBuffer(context, REST_TIMER_ALARM_SET, `rest-alarm.mp3?v=${APP_VERSION}`);
  loadRestTimerAudioBuffer(context, REST_TIMER_ALARM_SIDE, `side-alarm.mp3?v=${APP_VERSION}`);
  return context;
}

function loadRestTimerAudioBuffer(context, kind, url) {
  if (restTimer.alarmBuffers[kind]) return Promise.resolve(restTimer.alarmBuffers[kind]);
  if (restTimer.alarmBufferPromises[kind]) return restTimer.alarmBufferPromises[kind];

  const promise = fetch(url, { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) throw new Error("Alarm audio kon niet worden geladen.");
      return response.arrayBuffer();
    })
    .then((data) => context.decodeAudioData(data))
    .then((buffer) => {
      restTimer.alarmBuffers[kind] = buffer;
      return buffer;
    })
    .catch(() => null)
    .finally(() => {
      restTimer.alarmBufferPromises[kind] = null;
    });

  restTimer.alarmBufferPromises[kind] = promise;
  return promise;
}

function unlockRestTimerAudio() {
  const context = prepareRestTimerAudio();
  primeNextRestTimerMediaElement();
  if (!context || (restTimer.audioUnlocked && context.state === "running")) return;

  try {
    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, 22050);
    source.connect(context.destination);
    source.onended = () => source.disconnect();
    source.start(0);
  } catch {}

  const markUnlocked = () => {
    restTimer.audioUnlocked = context.state === "running";
  };
  if (context.state === "running") {
    markUnlocked();
  } else {
    context.resume().then(markUnlocked).catch(() => {
      restTimer.audioUnlocked = false;
    });
  }
}

function primeNextRestTimerMediaElement() {
  const media = [els.restAlarmAudio, els.sideAlarmAudio].filter(Boolean);
  if (media.some((audio) => audio.dataset.unlocking === "true")) return;
  const locked = media.filter((audio) => audio.dataset.unlocked !== "true");
  if (!locked.length) return;
  const next = locked[restTimer.mediaPrimeIndex % locked.length];
  restTimer.mediaPrimeIndex += 1;
  if (next) primeRestTimerMediaElement(next);
}

function primeRestTimerMediaElement(audio) {
  if (!audio || audio.dataset.unlocked === "true" || audio.dataset.unlocking === "true") return;
  audio.dataset.unlocking = "true";
  const source = audio.getAttribute("src");
  const wasLooping = audio.loop;
  const wasMuted = audio.muted;
  audio.loop = false;
  audio.muted = false;
  audio.setAttribute("src", `audio-unlock.mp3?v=${APP_VERSION}`);
  audio.load();

  const finish = (unlocked, error) => {
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {}
    audio.loop = wasLooping;
    audio.muted = wasMuted;
    audio.setAttribute("src", source);
    audio.load();
    delete audio.dataset.unlocking;
    if (unlocked) {
      audio.dataset.unlocked = "true";
      delete audio.dataset.unlockError;
    } else if (error) {
      audio.dataset.unlockError = error.name || "PlaybackError";
    }
  };

  try {
    const playback = audio.play();
    if (playback?.then) {
      playback
        .then(() => setTimeout(() => finish(true), 60))
        .catch((error) => finish(false, error));
    } else {
      setTimeout(() => finish(true), 60);
    }
  } catch (error) {
    finish(false, error);
  }
}

function recoverRestTimerAudio() {
  const context = restTimer.audioContext;
  if (context && context.state !== "closed" && context.state !== "running") {
    context.resume().then(() => {
      restTimer.audioUnlocked = context.state === "running";
    }).catch(() => {
      restTimer.audioUnlocked = false;
    });
  }

  if (
    restTimer.status === "done"
    && !restTimer.alarmSource
    && !restTimer.alarmPlaybackPending
    && (!restTimer.alarmMedia || restTimer.alarmMedia.paused)
  ) {
    playRestTimerAlarm();
  }
}

function playRestTimerAlarm() {
  if (restTimer.status !== "done" || restTimer.alarmPlaybackPending) return;
  if (restTimer.alarmSource) return;
  if (restTimer.alarmMedia && !restTimer.alarmMedia.paused) return;

  const kind = restTimer.alarmKind === REST_TIMER_ALARM_SIDE
    ? REST_TIMER_ALARM_SIDE
    : REST_TIMER_ALARM_SET;
  const context = prepareRestTimerAudio();
  const sequence = restTimer.alarmSequence;
  const buffer = restTimer.alarmBuffers[kind];

  if (context && context.state === "running" && buffer) {
    if (!startRestTimerBufferAlarm(buffer)) playRestTimerMediaAlarm();
    return;
  }

  if (context) {
    restTimer.alarmPlaybackPending = true;
    const bufferPromise = buffer
      ? Promise.resolve(buffer)
      : waitForRestTimerAudioBuffer(restTimer.alarmBufferPromises[kind]);
    const resumePromise = context.state === "running"
      ? Promise.resolve(true)
      : resumeRestTimerAudioContext(context);

    Promise.all([bufferPromise, resumePromise]).then(([loadedBuffer]) => {
      if (sequence !== restTimer.alarmSequence || restTimer.status !== "done") return;
      restTimer.alarmPlaybackPending = false;
      if (loadedBuffer && context.state === "running" && startRestTimerBufferAlarm(loadedBuffer)) return;
      playRestTimerMediaAlarm();
    });
    return;
  }

  playRestTimerMediaAlarm();
}

function waitForRestTimerAudioBuffer(bufferPromise) {
  if (!bufferPromise) return Promise.resolve(null);
  return Promise.race([
    bufferPromise,
    new Promise((resolve) => setTimeout(() => resolve(null), REST_TIMER_AUDIO_READY_TIMEOUT_MS)),
  ]);
}

function resumeRestTimerAudioContext(context) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (running) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(running);
    };
    const timeout = setTimeout(() => finish(false), REST_TIMER_AUDIO_READY_TIMEOUT_MS);
    context.resume()
      .then(() => finish(context.state === "running"))
      .catch(() => finish(false));
  });
}

function startRestTimerBufferAlarm(buffer) {
  if (restTimer.status !== "done" || restTimer.alarmSource) return false;
  const context = restTimer.audioContext;
  if (!context || context.state !== "running") return false;

  const sideChange = restTimer.alarmKind === REST_TIMER_ALARM_SIDE;
  try {
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = !sideChange;
    gain.gain.setValueAtTime(sideChange ? 1 : 0.95, context.currentTime);
    source.connect(gain).connect(context.destination);
    source.onended = () => {
      if (restTimer.alarmSource === source) {
        restTimer.alarmSource = null;
        restTimer.alarmGain = null;
      }
      try {
        source.disconnect();
        gain.disconnect();
      } catch {}
    };
    restTimer.alarmSource = source;
    restTimer.alarmGain = gain;
    restTimer.alarmMedia = null;
    restTimer.alarmFallbackActive = false;
    source.start(0);
    if (els.restAlarm) els.restAlarm.dataset.playback = "webaudio";
    navigator.vibrate?.(sideChange ? [70, 55, 120] : [80, 65, 80, 65, 180]);
    return true;
  } catch {
    restTimer.alarmSource = null;
    restTimer.alarmGain = null;
    return false;
  }
}

function playRestTimerMediaAlarm() {
  if (restTimer.status !== "done" || restTimer.alarmPlaybackPending || restTimer.alarmSource) return;

  const sideChange = restTimer.alarmKind === REST_TIMER_ALARM_SIDE;
  const audio = sideChange ? els.sideAlarmAudio : els.restAlarmAudio;
  if (!audio) {
    startRestTimerFallbackAlarm();
    return;
  }

  const sequence = restTimer.alarmSequence;
  restTimer.alarmPlaybackPending = true;
  restTimer.alarmMedia = audio;
  stopRestTimerMediaElement(sideChange ? els.restAlarmAudio : els.sideAlarmAudio);
  audio.loop = !sideChange;
  audio.muted = false;
  audio.volume = sideChange ? 0.9 : 1;
  try {
    audio.currentTime = 0;
  } catch {}

  const started = () => {
    if (sequence !== restTimer.alarmSequence || restTimer.status !== "done") {
      stopRestTimerMediaElement(audio);
      return;
    }
    restTimer.alarmPlaybackPending = false;
    if (els.restAlarm) els.restAlarm.dataset.playback = "media";
    navigator.vibrate?.(sideChange ? [70, 55, 120] : [80, 65, 80, 65, 180]);
  };
  const failed = (error) => {
    if (sequence !== restTimer.alarmSequence || restTimer.status !== "done") return;
    restTimer.alarmPlaybackPending = false;
    restTimer.alarmMedia = null;
    if (els.restAlarm) els.restAlarm.dataset.mediaError = error?.name || "PlaybackError";
    startRestTimerFallbackAlarm();
  };

  try {
    const playback = audio.play();
    if (playback?.then) playback.then(started).catch(failed);
    else started();
  } catch (error) {
    failed(error);
  }
}

function stopRestTimerMediaElement(audio) {
  if (!audio) return;
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch {}
}

function startRestTimerFallbackAlarm() {
  if (
    restTimer.status !== "done"
    || restTimer.alarmFallbackActive
    || restTimer.alarmSource
    || (restTimer.alarmMedia && !restTimer.alarmMedia.paused)
  ) return;
  const context = ensureRestTimerAudioContext();
  if (!context || context.state === "closed") {
    if (els.restAlarm) els.restAlarm.dataset.playback = "blocked";
    return;
  }

  const start = () => {
    if (restTimer.status !== "done" || restTimer.alarmFallbackActive || context.state !== "running") return;
    restTimer.alarmFallbackActive = true;
    if (els.restAlarm) els.restAlarm.dataset.playback = "fallback";
    playRestTimerFallbackSound();
    if (restTimer.alarmKind === REST_TIMER_ALARM_SET) {
      restTimer.alarmInterval = setInterval(playRestTimerFallbackSound, REST_TIMER_ALARM_REPEAT_MS);
    }
  };

  if (context.state === "running") {
    start();
  } else {
    context.resume().then(start).catch(() => {
      if (els.restAlarm) els.restAlarm.dataset.playback = "blocked";
    });
  }
}

function playRestTimerFallbackSound() {
  if (restTimer.status !== "done") return;
  const context = restTimer.audioContext;
  if (!context || context.state !== "running") return;
  const sideChange = restTimer.alarmKind === REST_TIMER_ALARM_SIDE;
  const notes = sideChange
    ? [
      { frequency: 523.25, start: 0, duration: 0.13, gain: 0.11, accent: false },
      { frequency: 783.99, start: 0.15, duration: 0.3, gain: 0.13, accent: true },
    ]
    : [
      { frequency: 554.37, start: 0, duration: 0.11, gain: 0.085, accent: false },
      { frequency: 659.25, start: 0.15, duration: 0.11, gain: 0.085, accent: false },
      { frequency: 739.99, start: 0.3, duration: 0.11, gain: 0.085, accent: false },
      { frequency: 659.25, start: 0.45, duration: 0.11, gain: 0.085, accent: false },
      { frequency: 880, start: 0.67, duration: 0.28, gain: 0.115, accent: true },
    ];
  const now = context.currentTime;

  notes.forEach((note) => {
    const lead = context.createOscillator();
    const leadGain = context.createGain();
    const kick = context.createOscillator();
    const kickGain = context.createGain();
    const start = now + note.start;
    const end = start + note.duration;

    lead.type = "square";
    lead.frequency.setValueAtTime(note.frequency, start);
    lead.frequency.exponentialRampToValueAtTime(note.frequency * 0.975, end);
    leadGain.gain.setValueAtTime(0.0001, start);
    leadGain.gain.exponentialRampToValueAtTime(note.gain, start + 0.012);
    leadGain.gain.exponentialRampToValueAtTime(0.0001, end);
    lead.connect(leadGain).connect(context.destination);
    lead.start(start);
    lead.stop(end + 0.03);

    const kickEnd = start + Math.min(note.duration, note.accent ? 0.18 : 0.12);
    kick.type = "sine";
    kick.frequency.setValueAtTime(note.accent ? 128 : 108, start);
    kick.frequency.exponentialRampToValueAtTime(48, kickEnd);
    kickGain.gain.setValueAtTime(0.0001, start);
    kickGain.gain.exponentialRampToValueAtTime(note.accent ? 0.09 : 0.058, start + 0.008);
    kickGain.gain.exponentialRampToValueAtTime(0.0001, kickEnd);
    kick.connect(kickGain).connect(context.destination);
    kick.start(start);
    kick.stop(kickEnd + 0.03);
  });
  navigator.vibrate?.(sideChange ? [70, 55, 120] : [55, 70, 55, 70, 55, 70, 55, 115, 180]);
}

function handleFocusOut(event) {
  if (event.target.dataset.field === "exercise-name") {
    const ref = getRefFromElement(event.target);
    setProgramExerciseName(ref.exerciseId, event.target.value);
    saveState();
    finishNameEdit();
  }

  if (event.target.dataset.field === "activity-name") {
    finishNameEdit();
  }

  if (event.target.dataset.field === "exercise-setup") {
    finishSetupEdit();
  }
}

function handleChange(event) {
  if (event.target.id === "training-date") {
    stopRestTimer();
    clearRestTimerCompletionTracking();
    state.activeDate = event.target.value || today();
    clearEditingHistoryIfActiveTargetChanged();
    getActiveWorkout();
    collapseExerciseCards();
    saveState(true);
    renderAll();
  }

  if (event.target.id === "session-select") {
    selectSession(event.target.value);
  }

  if (event.target.id === "e1rm-metric-select") {
    state.chartMetric = event.target.value;
    saveState();
    renderStats();
  }
}

function selectSession(sessionId) {
  const session = findSession(sessionId);
  if (!session) return;
  stopRestTimer();
  state.activeSessionId = session.id;
  clearEditingHistoryIfActiveTargetChanged();
  clearRestTimerCompletionTracking();
  getActiveWorkout();
  collapseExerciseCards();
  saveState();
  renderAll();
}

function toggleExerciseCard(source) {
  const key = getRefKey(getRefFromElement(source));
  if (uiState.expandedCards.has(key)) {
    uiState.expandedCards.delete(key);
    if (uiState.editingName === key) uiState.editingName = null;
    if (uiState.editingSetup === key) uiState.editingSetup = null;
  } else {
    uiState.expandedCards.add(key);
  }
  renderTraining();
  refreshIcons();
}

function editSetup(trigger) {
  const key = getRefKey(getRefFromElement(trigger));
  uiState.editingSetup = key;
  renderTraining();
  requestAnimationFrame(() => {
    const input = els.exerciseList?.querySelector('[data-field="exercise-setup"]');
    input?.focus();
    input?.select();
  });
}

function editActivityName(trigger) {
  const key = getRefKey(getRefFromElement(trigger));
  if (!uiState.expandedCards.has(key)) return;
  uiState.editingName = key;
  renderTraining();
  requestAnimationFrame(() => {
    const input = els.exerciseList?.querySelector('[data-field="activity-name"]');
    input?.focus();
    input?.select();
  });
}

function editProgramExerciseName(trigger) {
  const key = getRefKey(getRefFromElement(trigger));
  if (!uiState.expandedCards.has(key)) return;
  uiState.editingName = key;
  renderTraining();
  requestAnimationFrame(() => {
    const input = els.exerciseList?.querySelector('[data-field="exercise-name"]');
    input?.focus();
    input?.select();
  });
}

function finishSetupEdit() {
  if (!uiState.editingSetup) return;
  uiState.editingSetup = null;
  renderTraining();
  refreshIcons();
}

function finishNameEdit() {
  if (!uiState.editingName) return;
  uiState.editingName = null;
  renderTraining();
  refreshIcons();
}

function collapseExerciseCards() {
  uiState.expandedCards.clear();
  uiState.editingSetup = null;
  uiState.editingName = null;
  uiState.historyCursor.clear();
}

function clearCustomCardExpansion() {
  [...uiState.expandedCards].forEach((key) => {
    if (key.startsWith("custom:")) uiState.expandedCards.delete(key);
  });
  [...uiState.historyCursor.keys()].forEach((key) => {
    if (key.startsWith("custom:")) uiState.historyCursor.delete(key);
  });
  if (uiState.editingName?.startsWith("custom:")) uiState.editingName = null;
}

function addSet(trigger) {
  const workout = getActiveWorkout();
  const entry = getEntryFromElement(workout, trigger);
  clearRestTimerCompletionTracking();
  if (isMetricEntry(entry)) {
    entry.attempts ||= [];
    entry.attempts.push(makeMetricAttempt());
    entry.targetCount = entry.attempts.length;
    syncMetricEntryFromAttempts(entry);
    saveState(true);
    renderTraining();
    refreshIcons();
    return;
  }
  entry.sets.push(makeSet());
  saveState(true);
  renderTraining();
  refreshIcons();
}

function removeLastSet(trigger) {
  const workout = getActiveWorkout();
  const entry = getEntryFromElement(workout, trigger);
  clearRestTimerCompletionTracking();
  if (isMetricEntry(entry)) {
    entry.attempts ||= [];
    if (entry.attempts.length <= 0) return;
    entry.attempts.pop();
    entry.targetCount = entry.attempts.length;
    syncMetricEntryFromAttempts(entry);
    saveState(true);
    renderTraining();
    refreshIcons();
    return;
  }
  if (!entry.sets || entry.sets.length <= 0) return;
  entry.sets.pop();
  saveState(true);
  renderTraining();
  refreshIcons();
}

function shiftPreviousHistory(trigger, direction) {
  const ref = getRefFromElement(trigger);
  const key = getRefKey(ref);
  const total = Number(trigger.dataset.historyCount || 0);
  const current = Number(trigger.dataset.historyIndex || uiState.historyCursor.get(key) || 0);
  const next = Math.max(0, Math.min(Math.max(0, total - 1), current + direction));
  uiState.historyCursor.set(key, next);
  renderTraining();
  refreshIcons();
}

function addPresetItem(presetId) {
  const workout = getActiveWorkout();
  const session = findSession("overig");
  if (workout.sessionId !== "overig" || !session) return;
  const preset = session.exercises.find((exercise) => exercise.id === presetId);
  if (!preset) return;

  workout.customItems ||= [];
  const newIndex = workout.customItems.length;
  workout.customItems.push(makePresetItem(preset));
  uiState.expandedCards.add(`custom:${newIndex}`);
  saveState(true);
  renderTraining();
  refreshIcons();
}

function addCustomItem(kind) {
  const workout = getActiveWorkout();
  if (workout.sessionId !== "overig") return;
  workout.customItems ||= [];
  const newIndex = workout.customItems.length;
  workout.customItems.push(makeCustomItem(kind));
  uiState.expandedCards.add(`custom:${newIndex}`);
  saveState(true);
  renderTraining();
  refreshIcons();
}

function deleteCustomItem(customIndex) {
  const workout = getActiveWorkout();
  const index = Number(customIndex);
  if (!workout.customItems || Number.isNaN(index)) return;
  workout.customItems.splice(index, 1);
  clearCustomCardExpansion();
  saveState(true);
  renderTraining();
  refreshIcons();
}

function copyPreviousEntry(trigger) {
  const workout = getActiveWorkout();
  const ref = getRefFromElement(trigger);
  const entry = getEntryFromElement(workout, trigger);
  const target = getActivityTargetFromRef(ref, entry);
  const history = getActivityHistory(target);
  const historyEntry = history[Number(trigger.dataset.historyIndex || 0)];
  if (!historyEntry) return;

  if (historyEntry.kind === "strength") {
    entry.kind = "strength";
    entry.unilateral = Boolean(historyEntry.unilateral || entry.unilateral);
    entry.usesBodyweight = Boolean(historyEntry.usesBodyweight || entry.usesBodyweight);
    if (entry.usesBodyweight && historyEntry.bodyweight) entry.bodyweight = historyEntry.bodyweight;
    entry.sets = historyEntry.sets
      .filter(Boolean)
      .map((set) => entry.unilateral ? makeUnilateralSet(set) : makeStrengthSide(set));
  } else {
    entry.kind = historyEntry.kind;
    const attempts = historyEntry.attempts?.filter(Boolean).length ? historyEntry.attempts.filter(Boolean) : [historyEntry];
    entry.targetCount = Math.max(entry.targetCount || 1, attempts.length);
    entry.attempts = attempts.map((attempt) => makeMetricAttempt({ done: false, metrics: attempt.metrics || makeMetrics() }));
    syncMetricEntryFromAttempts(entry);
  }

  saveState(true);
  renderTraining();
  refreshIcons();
  showToast("Vorige gekopieerd");
}

function completeSession() {
  const session = findSession(state.activeSessionId);
  const workout = getActiveWorkout();
  const totals = getCompletion(workout);

  if (totals.done === 0) {
    showToast(session.id === "overig" ? "Nog niets ingevuld" : "Nog geen sets ingevuld");
    return;
  }

  stopRestTimer();
  clearRestTimerCompletionTracking();

  const historyEntry = {
    id: "",
    date: workout.date,
    sessionId: session.id,
    sessionLabel: session.label,
    sessionGroup: session.group,
    completedAt: new Date().toISOString(),
    doneSets: totals.done,
    totalSets: totals.total,
    volume: getWorkoutVolume(workout),
    note: workout.note || "",
    workout: structuredCloneSafe(workout),
  };

  const existing = getEditableHistoryEntry(session.id, workout.date);
  historyEntry.id = existing?.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  historyEntry.completedAt = existing?.completedAt || historyEntry.completedAt;
  upsertHistoryEntry(historyEntry);
  if (!existing) advanceCycle(session.id);
  state.editingHistoryId = historyEntry.id;
  collapseExerciseCards();
  saveState(true);
  renderAll();
  showToast(existing ? "Sessie bijgewerkt" : "Sessie afgerond");
}

function getEditableHistoryEntry(sessionId, date) {
  const editing = state.editingHistoryId
    ? state.history.find((entry) => entry.id === state.editingHistoryId)
    : null;
  if (editing && editing.sessionId === sessionId && editing.date === date) return editing;

  return getSortedHistoryDesc().find((entry) => entry.sessionId === sessionId && entry.date === date) || null;
}

function upsertHistoryEntry(historyEntry) {
  state.history = [
    ...state.history.filter((entry) =>
      entry.id !== historyEntry.id &&
      !(entry.sessionId === historyEntry.sessionId && entry.date === historyEntry.date)
    ),
    historyEntry,
  ];
}

function clearEditingHistoryIfActiveTargetChanged() {
  if (!state.editingHistoryId) return;
  const editing = state.history.find((entry) => entry.id === state.editingHistoryId);
  if (!editing || editing.sessionId !== state.activeSessionId || editing.date !== state.activeDate) {
    state.editingHistoryId = null;
  }
}

function resetCurrent() {
  const workout = getActiveWorkout();
  const filledCount = countFilledWorkoutItems(workout);
  if (filledCount >= 3) {
    openResetConfirm(filledCount);
    return;
  }

  performResetCurrent();
}

function performResetCurrent() {
  stopRestTimer();
  clearRestTimerCompletionTracking();
  const sessionId = state.activeSessionId;
  const date = state.activeDate;
  const key = workoutKey(state.activeSessionId, state.activeDate);
  const deletedHistory = deleteHistoryForWorkout(sessionId, date);

  delete state.workouts[key];
  if (deletedHistory.length) {
    if (deletedHistory.some((entry) => entry.id === state.editingHistoryId)) state.editingHistoryId = null;
    removeCycleCompletions(deletedHistory.map((entry) => entry.sessionId));
  }

  getActiveWorkout();
  collapseExerciseCards();
  saveState(true);
  renderAll();
}

function openResetConfirm(filledCount) {
  openConfirmModal({
    action: "reset-current",
    title: "Training resetten?",
    message: `${filledCount} ingevulde items worden gewist voor deze dag.`,
    confirmLabel: "Verwijder",
  });
}

function openConfirmModal({ action, title, message, confirmLabel }) {
  pendingConfirmAction = action;
  if (els.confirmTitle) els.confirmTitle.textContent = title;
  if (els.confirmMessage) els.confirmMessage.textContent = message;
  if (els.confirmActionLabel) els.confirmActionLabel.textContent = confirmLabel;
  els.confirmModal.hidden = false;
  requestAnimationFrame(() => {
    els.confirmModal.classList.add("is-visible");
    els.confirmModal.querySelector('.confirm-card [data-action="cancel-confirm"]')?.focus();
  });
  refreshIcons();
}

function closeConfirmModal() {
  pendingConfirmAction = null;
  if (!els.confirmModal) return;
  els.confirmModal.classList.remove("is-visible");
  setTimeout(() => {
    els.confirmModal.hidden = true;
  }, 160);
}

function confirmPendingAction() {
  const action = pendingConfirmAction;
  closeConfirmModal();
  if (action === "reset-current") performResetCurrent();
  if (action === "reset-cycle") performResetCycle();
}

function resetCycle() {
  if (!state.cycleCompleted?.length && (state.cycleIndex || 0) === 0) {
    showToast("Cyclus staat al op begin");
    return;
  }

  openConfirmModal({
    action: "reset-cycle",
    title: "Cyclus opnieuw beginnen?",
    message: "Alle groene upper/lower cycluskleuren worden gewist. Overig doet niet mee.",
    confirmLabel: "Reset cyclus",
  });
}

function performResetCycle() {
  state.cycleCompleted = [];
  state.cycleIndex = 0;
  state.cycleStreakResetAt = new Date().toISOString();
  saveState(true);
  renderAll();
  showToast("Cyclus gereset");
}

function resetAll() {
  if (!window.confirm("Alle lokale trackerdata wissen?")) return;
  stopRestTimer();
  clearRestTimerCompletionTracking();
  state = {};
  ensureDefaults();
  collapseExerciseCards();
  saveState(true);
  renderAll();
}

function deleteHistoryForWorkout(sessionId, date) {
  const deleted = state.history.filter((entry) => entry.sessionId === sessionId && entry.date === date);
  if (!deleted.length) return [];
  const deletedIds = new Set(deleted.map((entry) => entry.id));
  state.history = state.history.filter((entry) => !deletedIds.has(entry.id));
  return deleted;
}

function openHistory(historyId) {
  const entry = state.history.find((item) => item.id === historyId);
  if (!entry) return;
  stopRestTimer();
  clearRestTimerCompletionTracking();
  state.activeDate = entry.date;
  state.activeSessionId = entry.sessionId;
  state.editingHistoryId = entry.id;
  if (entry.workout) {
    state.workouts[workoutKey(entry.sessionId, entry.date)] = structuredCloneSafe(entry.workout);
  }
  collapseExerciseCards();
  saveState();
  location.hash = "train";
  renderAll();
}

function deleteHistory(historyId) {
  const deleted = state.history.filter((item) => item.id === historyId);
  state.history = state.history.filter((item) => item.id !== historyId);
  if (state.editingHistoryId === historyId) state.editingHistoryId = null;
  if (deleted.length) {
    removeCycleCompletions(deleted.map((entry) => entry.sessionId));
  }
  saveState(true);
  renderAll();
}

function exportData() {
  state.lastBackupAt = new Date().toISOString();
  stateDirty = true;
  flushStateSave();
  const payload = {
    exportedAt: state.lastBackupAt,
    app: "Schema Tjapo",
    version: 1,
    state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `schema-tjapo-${today()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Export klaar");
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const importedState = parsed.state || parsed;
      if (!importedState || typeof importedState !== "object") throw new Error("Invalid data");
      state = importedState;
      ensureDefaults();
      saveState(true);
      renderAll();
      showToast("Import klaar");
    } catch {
      showToast("Import mislukt");
    } finally {
      event.target.value = "";
    }
  });
  reader.readAsText(file);
}

function getFirebaseConfig() {
  const config = window.SCHEMA_TJAPO_FIREBASE_CONFIG;
  if (!config || typeof config !== "object") return null;
  if (!config.apiKey || !config.projectId || !config.authDomain || !config.appId) return null;
  return config;
}

async function initCloudSync() {
  const config = getFirebaseConfig();
  if (!config) {
    cloudSync.status = "Firebase nog niet ingesteld.";
    renderCloudSync();
    return;
  }

  cloudSync.available = true;
  cloudSync.loading = true;
  cloudSync.status = "Cloud wordt geladen...";
  renderCloudSync();

  try {
    const [appMod, authMod, firestoreMod] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`),
    ]);

    cloudSync.modules = { appMod, authMod, firestoreMod };
    cloudSync.app = appMod.getApps().find((candidate) => candidate.name === "schema-tjapo")
      || appMod.initializeApp(config, "schema-tjapo");
    cloudSync.auth = authMod.getAuth(cloudSync.app);
    cloudSync.db = firestoreMod.getFirestore(cloudSync.app);
    await authMod.setPersistence(cloudSync.auth, authMod.browserLocalPersistence);

    authMod.onAuthStateChanged(cloudSync.auth, (user) => {
      cloudSync.user = user;
      cloudSync.ready = true;
      cloudSync.loading = false;
      if (!user) {
        cloudSync.status = "Niet ingelogd.";
        cloudSync.lastSyncedAt = "";
        renderCloudSync();
        return;
      }
      cloudSync.status = `Ingelogd als ${user.email || "Firebase user"}.`;
      renderCloudSync();
      reconcileCloudState();
    });
  } catch {
    cloudSync.loading = false;
    cloudSync.status = "Cloud kon niet laden.";
    renderCloudSync();
  }
}

function renderCloudSync() {
  if (!els.cloudStatus) return;
  const syncActive = Boolean(cloudSync.available && cloudSync.ready && cloudSync.user);
  const syncing = /laden|check|inloggen|maken/i.test(cloudSync.status);
  const failed = /mislukt/i.test(cloudSync.status);
  const cloudProtected = syncActive && !failed;
  els.cloudStatus.textContent = syncActive && !syncing && !failed
    ? (cloudSync.lastSyncedAt
      ? `Automatisch gesynchroniseerd · ${formatDateTimeShort(cloudSync.lastSyncedAt)}`
      : "Automatische sync actief.")
    : cloudSync.status;

  const configured = Boolean(getFirebaseConfig());
  if (els.backupFallback) els.backupFallback.hidden = cloudProtected;
  if (els.cloudAuth) {
    els.cloudAuth.hidden = !configured || Boolean(cloudSync.user);
  }
  if (els.cloudUserActions) {
    els.cloudUserActions.hidden = !configured || !cloudSync.user;
  }
}

function getCloudCredentials() {
  const email = els.cloudEmail?.value.trim() || "";
  const password = els.cloudPassword?.value || "";
  if (!email || !password) {
    showToast("Vul email en wachtwoord in");
    return null;
  }
  return { email, password };
}

async function cloudLogin() {
  const credentials = getCloudCredentials();
  if (!credentials || !cloudSync.modules?.authMod || !cloudSync.auth) return;
  try {
    cloudSync.status = "Inloggen...";
    renderCloudSync();
    await cloudSync.modules.authMod.signInWithEmailAndPassword(cloudSync.auth, credentials.email, credentials.password);
    if (els.cloudPassword) els.cloudPassword.value = "";
    showToast("Cloud ingelogd");
  } catch {
    cloudSync.status = "Inloggen mislukt.";
    renderCloudSync();
    showToast("Inloggen mislukt");
  }
}

async function cloudLogout() {
  if (!cloudSync.modules?.authMod || !cloudSync.auth) return;
  flushStateSave();
  await cloudSync.modules.authMod.signOut(cloudSync.auth);
  showToast("Uitgelogd");
}

function getCloudDocRef() {
  if (!cloudSync.user || !cloudSync.db || !cloudSync.modules?.firestoreMod) return null;
  return cloudSync.modules.firestoreMod.doc(cloudSync.db, "users", cloudSync.user.uid, "schemaTjapo", "state");
}

async function reconcileCloudState() {
  const ref = getCloudDocRef();
  if (!ref) return;
  try {
    cloudSync.status = "Cloud check...";
    renderCloudSync();
    const snap = await cloudSync.modules.firestoreMod.getDoc(ref);
    if (!snap.exists()) {
      if (stateHasMeaningfulData(state)) {
        await uploadCloudState(false);
      } else {
        cloudSync.status = "Cloud klaar.";
        renderCloudSync();
      }
      return;
    }

    const remote = snap.data() || {};
    const remoteState = remote.state;
    if (!remoteState || typeof remoteState !== "object") {
      await uploadCloudState(false);
      return;
    }

    const localMeaningful = stateHasMeaningfulData(state);
    const remoteUpdatedAt = remote.updatedAt || inferStateUpdatedAt(remoteState);
    const localUpdatedAt = inferStateUpdatedAt(state);

    if (!localMeaningful || compareIsoDates(remoteUpdatedAt, localUpdatedAt) >= 0) {
      applyRemoteState(remoteState, remoteUpdatedAt);
      return;
    }

    await uploadCloudState(false);
  } catch {
    cloudSync.status = "Cloud sync mislukt.";
    renderCloudSync();
  }
}

function scheduleCloudSave() {
  if (!cloudSync.user || !cloudSync.ready || !cloudSync.modules?.firestoreMod) return;
  clearTimeout(cloudSync.timer);
  cloudSync.timer = setTimeout(() => {
    uploadCloudState(false);
  }, CLOUD_SYNC_DEBOUNCE_MS);
}

async function syncCloudNow() {
  if (!cloudSync.user) {
    showToast("Log eerst in");
    return;
  }
  flushStateSave();
  await uploadCloudState(true);
}

async function uploadCloudState(showSyncedToast = false) {
  const ref = getCloudDocRef();
  if (!ref) return;
  clearTimeout(cloudSync.timer);
  cloudSync.timer = null;
  const updatedAt = inferStateUpdatedAt(state) || new Date().toISOString();
  const payload = {
    app: "Schema Tjapo",
    version: 1,
    updatedAt,
    savedAt: new Date().toISOString(),
    state: structuredCloneSafe(state),
  };
  try {
    await cloudSync.modules.firestoreMod.setDoc(ref, payload);
    cloudSync.lastSyncedAt = payload.savedAt;
    cloudSync.status = "Cloud gesynct.";
    renderCloudSync();
    if (showSyncedToast) showToast("Cloud gesynct");
  } catch {
    cloudSync.status = "Cloud upload mislukt.";
    renderCloudSync();
    if (showSyncedToast) showToast("Sync mislukt");
  }
}

function applyRemoteState(remoteState, remoteUpdatedAt = "") {
  cloudSync.applyingRemote = true;
  state = structuredCloneSafe(remoteState);
  ensureDefaults();
  stateDirty = false;
  flushStateSave();
  stateDirty = false;
  cloudSync.applyingRemote = false;
  cloudSync.lastSyncedAt = remoteUpdatedAt || new Date().toISOString();
  cloudSync.status = "Cloud geladen.";
  collapseExerciseCards();
  renderAll();
  showToast("Cloud data geladen");
}

function inferStateUpdatedAt(candidate) {
  const dates = [
    candidate?.updatedAt,
    candidate?.lastBackupAt,
    ...(Array.isArray(candidate?.history) ? candidate.history.map((entry) => entry.completedAt || entry.date) : []),
  ].filter(Boolean);
  return dates.sort().at(-1) || "";
}

function compareIsoDates(a, b) {
  return String(a || "").localeCompare(String(b || ""));
}

function stateHasMeaningfulData(candidate) {
  if (Array.isArray(candidate?.history) && candidate.history.length > 0) return true;
  if (Array.isArray(candidate?.cycleCompleted) && candidate.cycleCompleted.length > 0) return true;
  return Object.values(candidate?.workouts || {}).some((workout) => workoutHasMeaningfulData(workout));
}

function workoutHasMeaningfulData(workout) {
  return (workout?.entries || []).some((entry) => {
    if (entry.note && String(entry.note).trim()) return true;
    if (entry.kind === "strength") return (entry.sets || []).some(hasTouchedStrengthSet);
    if (entry.kind === "run" || entry.kind === "cardio") {
      if ((entry.attempts || []).some(hasTouchedMetricAttempt)) return true;
      return hasTouchedMetricAttempt(entry);
    }
    return Boolean(entry.name || entry.setup);
  });
}

async function installApp() {
  if (!deferredInstallPrompt) {
    showToast("Gebruik Deel > Zet op beginscherm");
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
}

function getActiveWorkout() {
  return getWorkout(state.activeSessionId, state.activeDate);
}

function getWorkout(sessionId, date) {
  const session = findSession(sessionId) || getNextSession();
  const key = workoutKey(session.id, date);
  if (!state.workouts[key]) {
    state.workouts[key] = makeWorkout(session, date);
  }
  normalizeWorkout(state.workouts[key], session);
  return state.workouts[key];
}

function makeWorkout(session, date) {
  const exercises = {};
  if (session.id !== "overig") {
    session.exercises.forEach((exercise) => {
      exercises[exercise.id] = makeExerciseEntry(exercise);
    });
  }
  return {
    date,
    sessionId: session.id,
    note: "",
    exercises,
    customItems: [],
  };
}

function makeExerciseEntry(exercise) {
  const kind = exercise.kind || "strength";
  if (isMetricKind(kind)) {
    const targetCount = Math.max(1, Number(exercise.setCount) || 1);
    return {
      kind,
      name: getProgramExerciseName(exercise),
      setup: exercise.setup || "",
      note: "",
      targetCount,
      done: false,
      metrics: makeMetrics(),
      attempts: Array.from({ length: targetCount }, () => makeMetricAttempt()),
    };
  }
  const unilateral = Boolean(exercise.unilateral);
  const usesBodyweight = Boolean(exercise.usesBodyweight);
  return {
    kind: "strength",
    name: getProgramExerciseName(exercise),
    setup: exercise.setup || "",
    note: "",
    ...(Number.isFinite(Number(exercise.restSeconds)) ? { restSeconds: Number(exercise.restSeconds) } : {}),
    unilateral,
    usesBodyweight,
    bodyweight: usesBodyweight ? getDefaultBodyweight() : "",
    sets: Array.from({ length: exercise.setCount }, () => makeSet(unilateral)),
  };
}

function makeSet(unilateral = false) {
  return unilateral ? makeUnilateralSet() : makeStrengthSide();
}

function makeStrengthSide(source = {}) {
  return {
    weight: "",
    reps: "",
    rpe: "",
    done: false,
    ...source,
    rpe: clampZeroToTenInput(source.rpe),
  };
}

function makeUnilateralSet(source = {}) {
  const legacySide = {
    weight: source.weight || "",
    reps: source.reps || "",
    rpe: source.rpe || "",
  };
  return {
    left: makeStrengthSide(source.left || legacySide),
    right: makeStrengthSide(source.right || legacySide),
    done: false,
  };
}

function getDefaultBodyweight() {
  const bodyweight = parseNumber(state.bodyweight);
  return String(Number.isFinite(bodyweight) && bodyweight > 0 ? bodyweight : DEFAULT_BODYWEIGHT_KG);
}

function makeMetricAttempt(source = {}) {
  const attempt = source?.metrics ? source : { done: source?.done, metrics: source };
  return {
    done: Boolean(attempt.done),
    metrics: { ...makeMetrics(), ...(attempt.metrics || {}) },
  };
}

function makeMetrics() {
  return { distance: "", duration: "", pace: "", intensity: "", calories: "", amount: "", speed: "", unit: "", rpe: "" };
}

function makeCustomItem(kind = "strength") {
  const id = `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const names = {
    strength: "Extra lift",
    run: "Hardlopen",
    cardio: "Cardio",
    other: "Cardio",
  };
  const item = {
    id,
    kind,
    name: names[kind] || "Extra",
    setup: "",
    note: "",
  };
  if (isMetricKind(kind)) {
    const targetCount = 1;
    item.targetCount = targetCount;
    item.done = false;
    item.metrics = makeMetrics();
    item.attempts = Array.from({ length: targetCount }, () => makeMetricAttempt());
  } else {
    item.kind = "strength";
    item.sets = Array.from({ length: 3 }, makeSet);
  }
  return item;
}

function makePresetItem(exercise) {
  const item = makeExerciseEntry(exercise);
  item.id = `preset-${exercise.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  item.sourceId = exercise.id;
  return item;
}

function ensureExerciseEntry(workout, exerciseId) {
  if (!workout.exercises[exerciseId]) {
    const session = findSession(workout.sessionId);
    const exercise = session?.exercises.find((item) => item.id === exerciseId) || ex(exerciseId, exerciseId, 1);
    workout.exercises[exerciseId] = makeExerciseEntry(exercise);
  }
  const session = findSession(workout.sessionId);
  const exercise = session?.exercises.find((item) => item.id === exerciseId) || ex(exerciseId, exerciseId, 1);
  normalizeEntry(workout.exercises[exerciseId], exercise);
  return workout.exercises[exerciseId];
}

function normalizeWorkout(workout, session) {
  workout.exercises ||= {};
  workout.customItems ||= [];
  if (session.id === "overig") {
    Object.entries(workout.exercises).forEach(([exerciseId, entry]) => {
      const exercise = session.exercises.find((item) => item.id === exerciseId);
      normalizeEntry(entry, exercise);
    });
  } else {
    session.exercises.forEach((exercise) => {
      if (!workout.exercises[exercise.id]) {
        workout.exercises[exercise.id] = makeExerciseEntry(exercise);
      } else {
        normalizeEntry(workout.exercises[exercise.id], exercise);
      }
    });
  }
  workout.customItems.forEach((item) => normalizeEntry(item));
}

function normalizeEntry(entry, exercise) {
  const kind = entry.kind || exercise?.kind || "strength";
  entry.kind = kind;
  if (!entry.name && exercise?.name) entry.name = getProgramExerciseName(exercise);
  if (entry.setup === undefined) entry.setup = exercise?.setup || "";
  entry.setup = normalizeSetupLabel(entry.setup);
  entry.note ||= "";
  if (isMetricKind(kind)) {
    const targetCount = getMetricTargetCount(entry, exercise);
    const legacyAttempt = makeMetricAttempt({ done: entry.done, metrics: entry.metrics || makeMetrics() });
    let attempts = Array.isArray(entry.attempts) && entry.attempts.length
      ? entry.attempts.map((attempt) => normalizeMetricAttempt(attempt, kind))
      : [normalizeMetricAttempt(legacyAttempt, kind)];

    while (attempts.length < targetCount) attempts.push(normalizeMetricAttempt(makeMetricAttempt(), kind));
    if (attempts.length > targetCount) attempts = attempts.slice(0, targetCount);

    entry.targetCount = targetCount;
    entry.attempts = attempts;
    syncMetricEntryFromAttempts(entry);
    delete entry.sets;
    return entry;
  }
  entry.kind = "strength";
  if (!Number.isFinite(Number(entry.restSeconds)) && Number.isFinite(Number(exercise?.restSeconds))) {
    entry.restSeconds = Number(exercise.restSeconds);
  }
  const unilateral = Boolean(entry.unilateral || exercise?.unilateral);
  const usesBodyweight = Boolean(entry.usesBodyweight || exercise?.usesBodyweight);
  entry.unilateral = unilateral;
  entry.usesBodyweight = usesBodyweight;
  entry.bodyweight = usesBodyweight
    ? String(parseNumber(entry.bodyweight) > 0 ? entry.bodyweight : getDefaultBodyweight())
    : "";
  entry.sets = Array.isArray(entry.sets) ? entry.sets : [makeSet(unilateral)];
  entry.sets = entry.sets.map((set) => unilateral ? makeUnilateralSet(set) : makeStrengthSide(set));
  return entry;
}

function getMetricTargetCount(entry, exercise) {
  const fromExercise = Number(exercise?.setCount);
  const fromEntry = Number(entry?.targetCount);
  const fromAttempts = Array.isArray(entry?.attempts) ? entry.attempts.length : 0;
  if (Number.isFinite(fromEntry)) return Math.max(0, Math.floor(fromEntry));
  if (fromAttempts) return Math.max(0, Math.floor(fromAttempts));
  const value = Number.isFinite(fromExercise) ? fromExercise : 1;
  return Math.max(0, Math.floor(value));
}

function normalizeMetricAttempt(source, kind) {
  const attempt = makeMetricAttempt(source);
  if (!attempt.metrics.speed && kind !== "run" && attempt.metrics.amount) {
    attempt.metrics.speed = attempt.metrics.amount;
  }
  attempt.metrics.rpe = clampZeroToTenInput(attempt.metrics.rpe);
  attempt.metrics.intensity = clampZeroToTenInput(attempt.metrics.intensity);
  if (kind === "run") attempt.metrics.pace = calculateRunPace(attempt.metrics) || attempt.metrics.pace || "";
  return attempt;
}

function syncMetricEntryFromAttempts(entry) {
  const attempts = Array.isArray(entry.attempts)
    ? entry.attempts
    : [makeMetricAttempt({ done: entry.done, metrics: entry.metrics || makeMetrics() })];
  entry.attempts = attempts;
  entry.done = attempts.some((attempt) => hasCompleteMetricAttempt(attempt, entry.kind));
  entry.metrics = { ...makeMetrics(), ...(attempts[0]?.metrics || {}) };
  return entry;
}

function getMetricAttempts(entry, exercise) {
  if (!isMetricEntry(entry)) return [];
  normalizeEntry(entry, exercise);
  return entry.attempts || [];
}

function getMetricAttemptFromElement(entry, element) {
  if (!isMetricEntry(entry)) return null;
  const holder = element.closest?.("[data-metric-index]");
  if (!holder) return null;
  const index = Number(holder.dataset.metricIndex);
  return entry.attempts?.[index] || null;
}

function getPreviousMetricAttempt(previous, index) {
  if (!previous) return null;
  if (Array.isArray(previous.attempts)) {
    return previous.attempts[index] ? { metrics: previous.attempts[index].metrics || makeMetrics() } : null;
  }
  if (previous.attempts?.[index]) return { metrics: previous.attempts[index].metrics || makeMetrics() };
  return index === 0 ? previous : null;
}

function getEntryFromElement(workout, element) {
  const holder = element.closest?.("[data-custom-index], [data-exercise-id]") || element;
  if (holder.dataset.customIndex !== undefined) {
    return workout.customItems[Number(holder.dataset.customIndex)];
  }
  return ensureExerciseEntry(workout, holder.dataset.exerciseId);
}

function getRefAttrs(ref) {
  if (ref.customIndex !== undefined) return `data-custom-index="${ref.customIndex}"`;
  return `data-exercise-id="${escapeAttr(ref.exerciseId)}"`;
}

function getEntryKind(entry) {
  return entry.kind || "strength";
}

function normalizeSetupLabel(value) {
  return String(value || "").trim().replace(/^hoogte\s+/i, "");
}

function getStrengthActivityKey(name, entryOrSetup = "") {
  const setup = typeof entryOrSetup === "object" ? entryOrSetup?.setup : entryOrSetup;
  const normalizedSetup = normalizeExerciseName(normalizeSetupLabel(setup));
  return `${normalizeExerciseName(name)}::${normalizedSetup}`;
}

function getStrengthActivityLabel(name, entryOrSetup = "") {
  const setup = typeof entryOrSetup === "object" ? entryOrSetup?.setup : entryOrSetup;
  const normalizedSetup = normalizeSetupLabel(setup);
  return normalizedSetup ? `${name} - ${normalizedSetup}` : name;
}

function makeExerciseMetricValue(name, entryOrSetup = "") {
  return `exercise:${getStrengthActivityKey(name, entryOrSetup)}`;
}

function getActivityComparisonKey(target) {
  if (target?.kind && isMetricKind(target.kind)) return normalizeExerciseName(target.name);
  return getStrengthActivityKey(target?.name, target?.setup ?? target?.entry?.setup);
}

function isMetricKind(kind) {
  return ["run", "cardio", "other"].includes(kind);
}

function isMetricEntry(entry) {
  return isMetricKind(entry.kind);
}

function isCardioEntry(entry) {
  return isMetricEntry(entry);
}

function getEntrySummary(entry, exercise) {
  if (entry.kind === "run") {
    const attempts = getMetricAttempts(entry, exercise);
    const done = attempts.filter((attempt) => hasCompleteMetricAttempt(attempt, "run")).length;
    const meta = formatMetricAttemptsSummary(entry, "run");
    return {
      label: meta || "Cardio",
      counter: `${done}/${attempts.length}`,
      done,
      total: attempts.length,
    };
  }
  if (isMetricEntry(entry)) {
    const attempts = getMetricAttempts(entry, exercise);
    const done = attempts.filter((attempt) => hasCompleteMetricAttempt(attempt, entry.kind)).length;
    const meta = formatMetricAttemptsSummary(entry, entry.kind);
    return {
      label: meta || "Cardio",
      counter: `${done}/${attempts.length}`,
      done,
      total: attempts.length,
    };
  }
  const sets = entry.sets || [];
  const done = sets.filter((set) => hasCompleteStrengthSet(set, entry)).length;
  return {
    label: `${sets.length || exercise?.setCount || 0} sets`,
    counter: `${done}/${sets.length}`,
    done,
    total: sets.length,
  };
}

function getRefFromElement(element) {
  const holder = element.closest?.("[data-custom-index], [data-exercise-id]") || element;
  if (holder.dataset.customIndex !== undefined) {
    return { customIndex: Number(holder.dataset.customIndex) };
  }
  return { exerciseId: holder.dataset.exerciseId };
}

function getRefKey(ref) {
  if (ref.customIndex !== undefined) return `custom:${ref.customIndex}`;
  return `exercise:${ref.exerciseId}`;
}

function getActivityTargetFromRef(ref, entry) {
  if (ref.customIndex !== undefined) {
    return {
      name: entry.name || "Extra",
      kind: getEntryKind(entry),
      setup: entry.setup || "",
    };
  }

  const session = findSession(state.activeSessionId);
  const exercise = session?.exercises.find((item) => item.id === ref.exerciseId);
  return {
    name: getProgramExerciseName(exercise) || entry.name || ref.exerciseId,
    kind: getEntryKind(entry),
    setup: entry.setup || exercise?.setup || "",
  };
}

function getActivityHistory(target, limit = 8) {
  const targetKind = target.kind || "strength";
  const targetKey = getActivityComparisonKey(target);
  const cache = getHistoryCache();
  const cacheKey = getHistoryCacheKey(["activity", targetKind, targetKey, limit]);
  if (cache.activityHistory.has(cacheKey)) return cache.activityHistory.get(cacheKey);

  const rows = [];

  getSortedHistoryDesc()
    .forEach((historyEntry) => {
      getHistoryActivityEntries(historyEntry).forEach((candidate) => {
        if (candidate.kind !== targetKind) return;
        if (getActivityComparisonKey(candidate) !== targetKey) return;

        const snapshot = makeHistorySnapshot(candidate, historyEntry);
        if (snapshot) rows.push(snapshot);
      });
    });

  const result = rows.slice(0, limit);
  cache.activityHistory.set(cacheKey, result);
  return result;
}

function getLatestActivitySnapshot(target) {
  const targetKind = target.kind || "strength";
  const targetKey = getActivityComparisonKey(target);
  const cache = getHistoryCache();
  const cacheKey = getHistoryCacheKey(["latest", targetKind, targetKey]);
  if (cache.latestActivity.has(cacheKey)) return cache.latestActivity.get(cacheKey);

  for (const historyEntry of getSortedHistoryDesc()) {
    const match = getHistoryActivityEntries(historyEntry).find((candidate) =>
      candidate.kind === targetKind && getActivityComparisonKey(candidate) === targetKey
    );
    if (!match) continue;

    const snapshot = makeHistorySnapshot(match, historyEntry, { allowEmpty: true });
    if (snapshot) {
      cache.latestActivity.set(cacheKey, snapshot);
      return snapshot;
    }
  }

  cache.latestActivity.set(cacheKey, null);
  return null;
}

function getHistoryActivityEntries(historyEntry) {
  const cache = getHistoryCache();
  const cacheKey = historyEntry.id || getHistorySortKey(historyEntry);
  if (cache.entryActivities.has(cacheKey)) return cache.entryActivities.get(cacheKey);

  const session = findSession(historyEntry.sessionId);
  const workout = historyEntry.workout;
  if (!session || !workout) {
    cache.entryActivities.set(cacheKey, []);
    return [];
  }

  const programEntries = session.exercises
    .map((exercise) => {
      const entry = workout.exercises?.[exercise.id];
      if (!entry) return null;
      normalizeEntry(entry, exercise);
      return {
        name: getProgramExerciseName(exercise),
        kind: entry.kind || exercise.kind || "strength",
        entry,
      };
    })
    .filter(Boolean);

  const customEntries = (workout.customItems || [])
    .filter((item) => item?.name)
    .map((item) => {
      normalizeEntry(item);
      return {
        name: item.name,
        kind: item.kind || "strength",
        entry: item,
      };
    });

  const entries = [...programEntries, ...customEntries];
  cache.entryActivities.set(cacheKey, entries);
  return entries;
}

function makeHistorySnapshot(candidate, historyEntry, options = {}) {
  if (candidate.kind === "strength") {
    const sets = (candidate.entry.sets || []).map((set) =>
      hasCompleteStrengthSet(set, candidate.entry)
        ? cloneStrengthSet(set, candidate.entry)
        : null
    );
    const summarySets = sets.filter(Boolean);
    if (!summarySets.length && !options.allowEmpty) return null;
    return {
      kind: "strength",
      date: historyEntry.date,
      sessionLabel: historyEntry.sessionLabel,
      note: candidate.entry.note || "",
      unilateral: isUnilateralEntry(candidate.entry),
      usesBodyweight: usesBodyweightLoad(candidate.entry),
      bodyweight: usesBodyweightLoad(candidate.entry) ? candidate.entry.bodyweight : "",
      sets,
      summary: summarySets.map((set) => formatSetSummary(set, candidate.entry)).join(" / "),
    };
  }

  const attempts = getMetricAttempts(candidate.entry)
    .map((attempt) => {
      const metrics = { ...makeMetrics(), ...(attempt.metrics || {}) };
      const summary = formatMetricSummary(metrics, candidate.kind);
      const done = hasCompleteMetricAttempt(attempt, candidate.kind);
      return done ? { done, metrics, summary } : null;
    });
  const summary = attempts.filter(Boolean).map((attempt) => attempt.summary).filter(Boolean).join(" / ");
  if (!summary && !options.allowEmpty) return null;
  return {
    kind: candidate.kind,
    date: historyEntry.date,
    sessionLabel: historyEntry.sessionLabel,
    note: candidate.entry.note || "",
    attempts,
    metrics: attempts.find(Boolean)?.metrics || makeMetrics(),
    summary,
  };
}

function cloneStrengthSet(set, entry) {
  if (isUnilateralSet(set, entry)) {
    return {
      left: makeStrengthSide(set.left),
      right: makeStrengthSide(set.right),
      done: false,
    };
  }
  return makeStrengthSide(set);
}

function formatSetSummary(set, entry = {}) {
  if (isUnilateralSet(set, entry)) {
    return [
      formatStrengthSideSummary(set.left, entry, "L"),
      formatStrengthSideSummary(set.right, entry, "R"),
    ].filter(Boolean).join(" / ");
  }
  return formatStrengthSideSummary(set, entry);
}

function formatStrengthSideSummary(set, entry = {}, sideLabel = "") {
  const load = getStrengthLoadLabel(set, entry);
  const main = [load, set?.reps && `${set.reps}r`].filter(Boolean).join(" x ");
  const summary = hasMetricValue(set?.rpe) ? `${main} @${set.rpe}` : main;
  return sideLabel && summary ? `${sideLabel} ${summary}` : summary;
}

function formatMetricSummary(metrics, kind = "other") {
  if (kind === "run") {
    const pace = calculateRunPace(metrics) || metrics.pace;
    return [
      metrics.distance && `${metrics.distance} km`,
      metrics.duration,
      hasMetricValue(metrics.intensity) && `${metrics.intensity}/10`,
      pace && `${pace}/km`,
    ].filter(Boolean).join(" / ");
  }

  const speed = metrics.speed || metrics.amount;
  return [
    metrics.duration && `${metrics.duration} min`,
    speed && `${speed} km/u`,
    hasMetricValue(metrics.rpe) && `RPE ${metrics.rpe}`,
    metrics.calories && `${metrics.calories} kcal`,
  ].filter(Boolean).join(" / ");
}

function formatMetricAttemptsSummary(entry, kind = "other") {
  return getMetricAttempts(entry)
    .map((attempt) => formatMetricSummary(attempt.metrics || makeMetrics(), kind))
    .filter(Boolean)
    .join(" / ");
}

function getSetPlaceholder(previousSet, field, fallback) {
  if (!previousSet?.[field]) return fallback;
  return normalizePlaceholderValue(previousSet[field]);
}

function getMetricPlaceholder(previous, field, fallback) {
  if (field === "pace") {
    const pace = previous?.metrics?.pace || calculateRunPace(previous?.metrics || {});
    return pace ? `${normalizePlaceholderValue(pace)}/km` : fallback;
  }
  if (field === "speed") {
    const speed = previous?.metrics?.speed || previous?.metrics?.amount;
    return hasMetricValue(speed) ? normalizePlaceholderValue(speed) : fallback;
  }
  const value = previous?.metrics?.[field];
  if (!hasMetricValue(value)) return fallback;
  return normalizePlaceholderValue(value);
}

function hasMetricValue(value) {
  return String(value ?? "").trim() !== "";
}

function isUnilateralEntry(entry) {
  return Boolean(entry?.unilateral);
}

function isUnilateralSet(set, entry = {}) {
  return Boolean(isUnilateralEntry(entry) || set?.left || set?.right);
}

function usesBodyweightLoad(entry) {
  return Boolean(entry?.usesBodyweight);
}

function getEntryBodyweight(entry) {
  const entryBodyweight = parseNumber(entry?.bodyweight);
  if (Number.isFinite(entryBodyweight) && entryBodyweight > 0) return entryBodyweight;
  const defaultBodyweight = parseNumber(state.bodyweight);
  return Number.isFinite(defaultBodyweight) && defaultBodyweight > 0 ? defaultBodyweight : DEFAULT_BODYWEIGHT_KG;
}

function getStrengthLoad(set, entry = {}) {
  const weight = parseNumber(set?.weight);
  if (usesBodyweightLoad(entry)) {
    const extraWeight = Number.isFinite(weight) ? weight : 0;
    return getEntryBodyweight(entry) + extraWeight;
  }
  return weight;
}

function getStrengthLoadLabel(set, entry = {}) {
  if (usesBodyweightLoad(entry)) {
    const bodyweight = formatNumber(getEntryBodyweight(entry));
    const extraWeight = parseNumber(set?.weight);
    if (!Number.isFinite(extraWeight) || extraWeight === 0) return `${bodyweight}kg BW`;
    const sign = extraWeight > 0 ? "+" : "";
    return `${bodyweight}${sign}${formatNumber(extraWeight)}kg`;
  }
  return hasMetricValue(set?.weight) ? `${set.weight}kg` : "";
}

function hasCompleteStrengthSide(set, entry = {}) {
  const hasLoad = usesBodyweightLoad(entry) || hasMetricValue(set?.weight);
  return Boolean(hasLoad && hasMetricValue(set?.reps) && hasMetricValue(set?.rpe));
}

function hasCompleteStrengthSet(set, entry = {}) {
  if (isUnilateralSet(set, entry)) {
    return hasCompleteStrengthSide(set?.left, entry) && hasCompleteStrengthSide(set?.right, entry);
  }
  return hasCompleteStrengthSide(set, entry);
}

function hasTouchedStrengthSide(set) {
  return Boolean(
    hasMetricValue(set?.weight) ||
    hasMetricValue(set?.reps) ||
    hasMetricValue(set?.rpe),
  );
}

function hasTouchedStrengthSet(set, entry = {}) {
  if (isUnilateralSet(set, entry)) {
    return hasTouchedStrengthSide(set?.left) || hasTouchedStrengthSide(set?.right);
  }
  return hasTouchedStrengthSide(set);
}

function hasCompleteMetricAttempt(attempt, kind = "other") {
  const metrics = attempt?.metrics || {};
  if (kind === "run") {
    return Boolean(
      hasMetricValue(metrics.distance) &&
      hasMetricValue(metrics.duration) &&
      hasMetricValue(metrics.intensity),
    );
  }

  return Boolean(
    hasMetricValue(metrics.duration) &&
    (hasMetricValue(metrics.speed) || hasMetricValue(metrics.amount)) &&
    hasMetricValue(metrics.rpe),
  );
}

function hasTouchedMetricAttempt(attempt) {
  const metrics = attempt?.metrics || {};
  return Boolean(
    hasMetricValue(metrics.distance) ||
    hasMetricValue(metrics.duration) ||
    hasMetricValue(metrics.intensity) ||
    hasMetricValue(metrics.calories) ||
    hasMetricValue(metrics.amount) ||
    hasMetricValue(metrics.speed) ||
    hasMetricValue(metrics.unit) ||
    hasMetricValue(metrics.rpe),
  );
}

function normalizePlaceholderValue(value) {
  return String(value ?? "").trim().replaceAll(",", ".");
}

function normalizeInputValue(target) {
  const value = target.value;
  const field = target.dataset.field;
  if (!DECIMAL_INPUT_FIELDS.has(field)) return value;

  const selectionStart = target.selectionStart;
  const selectionEnd = target.selectionEnd;
  let normalized = value.replaceAll(",", ".");
  if (ZERO_TO_TEN_INPUT_FIELDS.has(field)) {
    normalized = clampZeroToTenInput(normalized);
  }
  if (target.value !== normalized) target.value = normalized;

  if (document.activeElement === target && selectionStart !== null && selectionEnd !== null) {
    try {
      target.setSelectionRange(selectionStart, selectionEnd);
    } catch {
      // Some input modes do not expose a writable selection range.
    }
  }

  return normalized;
}

function clampZeroToTenInput(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return raw;
  if (parsed < 0) return "0";
  if (parsed > 10) return "10";
  return raw;
}

function updateRunPaceOutput(target, metrics) {
  const output = target.closest(".metric-list")?.querySelector('[data-field="pace-output"]');
  if (!output) return;
  const pace = calculateRunPace(metrics);
  output.textContent = pace ? `${pace}/km` : (output.dataset.emptyLabel || "calc");
  output.classList.toggle("has-value", Boolean(pace));
}

function updateEntrySummary(target, entry) {
  const card = target.closest(".exercise-card");
  if (!card) return;
  const summary = getEntrySummary(entry);
  const label = card.querySelector(".exercise-subtitle");
  const counter = card.querySelector(".set-counter");
  if (label) label.textContent = getCardSubtitle(summary, entry);
  if (counter) {
    counter.textContent = summary.counter;
    const isOpen = card.classList.contains("is-open");
    counter.closest(".card-toggle")?.classList.toggle("is-complete", !isOpen && summary.total > 0 && summary.done >= summary.total);
  }
}

function updateTrainingProgressReadout() {
  const session = findSession(state.activeSessionId);
  const workout = getActiveWorkout();
  if (!session || !workout) return;
  renderTrainingTitle(session, getCompletion(workout), session.id === "overig");
}

function resizeNoteTextareas(scope = document) {
  scope.querySelectorAll?.('textarea[data-field="exercise-note"]').forEach(resizeNoteTextarea);
}

function resizeNoteTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function calculateRunPace(metrics = {}) {
  const distance = parseNumber(metrics.distance);
  const durationSeconds = parseDurationToSeconds(metrics.duration);
  if (!distance || distance <= 0 || !durationSeconds) return "";
  return formatPace(durationSeconds / distance);
}

function parseDurationToSeconds(value) {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return null;

  if (raw.includes(":")) {
    const parts = raw.split(":").map((part) => Number(part));
    if (parts.some((part) => Number.isNaN(part) || part < 0)) return null;
    if (parts.length === 2) return (parts[0] * 60) + parts[1];
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    return null;
  }

  const minutes = Number(raw);
  return Number.isNaN(minutes) || minutes < 0 ? null : minutes * 60;
}

function formatPace(secondsPerKm) {
  const totalSeconds = Math.round(secondsPerKm);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedSeconds = String(seconds).padStart(2, "0");
  if (!hours) return `${minutes}:${paddedSeconds}`;
  return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
}

function getCompletion(workout) {
  const session = findSession(workout.sessionId);
  const entries = getAllWorkoutEntries(workout, session);
  if (session?.id === "overig") {
    const logged = entries.filter(hasLoggedEntry);
    return {
      done: logged.length,
      total: logged.length,
      percent: logged.length ? 100 : 0,
    };
  }

  const total = entries.reduce((sum, entry) => sum + (isCardioEntry(entry) ? getMetricAttempts(entry).length : (entry.sets || []).length), 0);
  const done = entries.reduce((sum, entry) => {
    if (isCardioEntry(entry)) return sum + getMetricAttempts(entry).filter((attempt) => hasCompleteMetricAttempt(attempt, entry.kind)).length;
    return sum + (entry.sets || []).filter((set) => hasCompleteStrengthSet(set, entry)).length;
  }, 0);
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

function countFilledWorkoutItems(workout) {
  if (!workout) return 0;
  let count = workout.note?.trim() ? 1 : 0;
  const entries = [
    ...Object.values(workout.exercises || {}),
    ...(workout.customItems || []),
  ];

  entries.forEach((entry) => {
    if (!entry) return;
    if (workout.sessionId === "overig" && entry.id) count += 1;
    if (entry.note?.trim()) count += 1;

    if (isMetricEntry(entry)) {
      getMetricAttempts(entry).forEach((attempt) => {
        count += Object.entries(attempt.metrics || {})
          .filter(([key, value]) => key !== "pace" && String(value ?? "").trim())
          .length;
      });
      return;
    }

    count += (entry.sets || []).filter((set) => hasTouchedStrengthSet(set, entry)).length;
  });

  return count;
}

function getWorkoutVolume(workout) {
  const session = findSession(workout.sessionId);
  return getAllWorkoutEntries(workout, session).reduce((sum, entry) => {
    if (isCardioEntry(entry)) return sum;
    return sum + (entry.sets || []).reduce((setSum, set) => {
      if (!hasCompleteStrengthSet(set, entry)) return setSum;
      const sides = isUnilateralSet(set, entry) ? [set.left, set.right] : [set];
      return setSum + sides.reduce((sideSum, side) => {
        const load = getStrengthLoad(side, entry);
        const reps = parseNumber(side?.reps);
        if (!Number.isFinite(load) || !Number.isFinite(reps)) return sideSum;
        return sideSum + load * reps;
      }, 0);
    }, 0);
  }, 0);
}

function getAllWorkoutEntries(workout, session = findSession(workout.sessionId)) {
  const base = session?.exercises
    ? session.exercises.map((exercise) => workout.exercises?.[exercise.id]).filter(Boolean)
    : Object.values(workout.exercises || {});
  if (session?.id !== "overig") return base;
  return [...base.filter(hasLoggedEntry), ...(workout.customItems || [])];
}

function hasLoggedEntry(entry) {
  if (!entry) return false;
  if (isMetricEntry(entry)) {
    return Boolean(
      String(entry.note || "").trim() ||
      getMetricAttempts(entry).some(hasLoggedMetricAttempt),
    );
  }

  return Boolean(
    String(entry.note || "").trim() ||
    (entry.sets || []).some((set) => hasTouchedStrengthSet(set, entry)),
  );
}

function hasLoggedMetricAttempt(attempt) {
  return Boolean(attempt?.done || hasTouchedMetricAttempt(attempt));
}

function getLoggedPresetExercises(session, workout) {
  return session.exercises.filter((exercise) => hasLoggedEntry(workout.exercises?.[exercise.id]));
}

function getPresetShortLabel(name) {
  const labels = {
    "Echo Bike (1 minuut)": "Echo Bike 1m",
    "Echo Bike (Top Speed)": "Echo Bike top",
    "DB Shoulder Press": "DB shoulder",
    "Incline DB press": "Incline DB",
  };
  return labels[name] || name;
}

function getCardioSummary(workout) {
  if (!workout) return "";
  const summaries = getAllWorkoutEntries(workout)
    .filter((entry) => isCardioEntry(entry) && getMetricAttempts(entry).some((attempt) => hasCompleteMetricAttempt(attempt, entry.kind)))
    .map((entry) => {
      return [entry.name, formatMetricAttemptsSummary(entry, entry.kind)].filter(Boolean).join(" ");
    })
    .filter(Boolean);
  return summaries.slice(0, 2).join(" / ");
}

function getHistoryCompletionLabel(historyEntry) {
  const done = Number(historyEntry.doneSets || 0);
  const total = Number(historyEntry.totalSets || 0);
  const session = findSession(historyEntry.sessionId);
  const label = session?.id === "overig" ? "items" : "sets";
  return `${done}/${total} ${label}`;
}

function getHistoryProgressSummary(historyEntry) {
  if (!historyEntry?.workout || historyEntry.sessionId === "overig") return null;
  const cacheKey = historyEntry.id || getHistorySortKey(historyEntry);
  return getHistoryProgressSummaries().get(cacheKey) || null;
}

function getHistoryProgressSummaries() {
  const cache = getHistoryCache();
  if (cache.historyProgressSummaries) return cache.historyProgressSummaries;

  const summaries = new Map();
  const latestScores = new Map();

  getSortedHistoryAsc().forEach((historyEntry) => {
    if (!historyEntry?.workout || historyEntry.sessionId === "overig") return;

    const changeFactors = [];
    const updates = [];
    getHistoryActivityEntries(historyEntry)
      .filter((candidate) => candidate.kind === "strength")
      .forEach((candidate) => {
        const score = getExerciseSetGainScore(candidate.entry);
        if (score === null) return;

        const activityKey = getStrengthActivityKey(candidate.name, candidate.entry);
        const previous = latestScores.get(activityKey);
        if (previous > 0 && score > 0) changeFactors.push(score / previous);
        updates.push([activityKey, score]);
      });

    updates.forEach(([activityKey, score]) => latestScores.set(activityKey, score));

    if (!changeFactors.length) return;
    const average = (getGeometricMean(changeFactors) - 1) * 100;
    const className = average > 0.15
      ? "history-summary-progress is-up"
      : average < -0.15
        ? "history-summary-progress is-down"
        : "history-summary-progress is-flat";
    summaries.set(historyEntry.id || getHistorySortKey(historyEntry), {
      text: formatLogProgressPercent(average),
      className,
    });
  });

  cache.historyProgressSummaries = summaries;
  return summaries;
}

function getHistorySortKey(historyEntry) {
  return `${historyEntry.date || ""}${historyEntry.completedAt || ""}${historyEntry.id || ""}`;
}

function renderRecordItem(record) {
  if (record.type === "run") {
    return `
      <div class="record-item">
        <div>
          <div class="record-title">${escapeHtml(record.name)}</div>
          <div class="record-meta">${escapeHtml(record.meta)}</div>
        </div>
        <span class="panel-label">${escapeHtml(record.value)}</span>
      </div>
    `;
  }

  return `
    <div class="record-item">
      <div>
        <div class="record-title">${escapeHtml(record.name)}</div>
        <div class="record-meta">${escapeHtml(record.summary)} - ${formatDate(record.date)}</div>
      </div>
      <span class="panel-label">${formatNumber(record.score)} e1RM</span>
    </div>
  `;
}

function renderBoomingGroupItem(item) {
  const tone = item.change > 0.05 ? "is-up" : item.change < -0.05 ? "is-down" : "is-flat";
  const prefix = item.change > 0.05 ? "+" : item.change < -0.05 ? "-" : "";
  const value = `${prefix}${formatNumber(Math.abs(item.change))}%`;

  return `
    <div class="record-item booming-item">
      <div>
        <div class="record-title">${escapeHtml(item.label)}</div>
        <div class="record-meta">Booming Muscle Group</div>
      </div>
      <span class="panel-label record-value ${tone}">${escapeHtml(value)}</span>
    </div>
  `;
}

function getRecords(group = getChartGroup(), filter = getChartFilter(group), rangeDays = getStatsRangeDays()) {
  if (group === "Running") return getRunningRecords(rangeDays);
  return getStrengthRecords(group, filter, rangeDays);
}

function shouldRenderBoomingGroups(group, filter) {
  return group !== "Running" && filter === "all";
}

function getBoomingMuscleGroups(group, rangeDays = getStatsRangeDays()) {
  return getChartFilters(group)
    .filter((filter) => filter.value !== "all")
    .map((filter) => {
      const points = getTrendPoints(group, STRENGTH_INDEX_METRIC, filter.value, rangeDays);
      if (points.length < 2) return null;
      const first = points[0];
      const latest = points[points.length - 1];
      return {
        label: filter.label,
        change: latest.value - first.value,
        points: points.length,
        startDate: first.date,
        endDate: latest.date,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.change - a.change)
    .slice(0, 1);
}

function getStrengthRecords(group, filter, rangeDays = getStatsRangeDays()) {
  const records = new Map();
  getStatsHistory(rangeDays).forEach((historyEntry) => {
    const session = findSession(historyEntry.sessionId);
    const workout = historyEntry.workout;
    if (!session || !workout || session.group !== group) return;

    session.exercises
      .filter((exercise) => matchesChartFilter(exercise, group, filter))
      .forEach((exercise) => {
        const entry = workout.exercises?.[exercise.id];
        const score = getExerciseFirstSetE1rm(entry);
        if (score === null) return;
        const name = entry?.name || getProgramExerciseName(exercise);
        const activityKey = getStrengthActivityKey(name, entry?.setup ?? exercise.setup);
        const current = records.get(activityKey);
        if (!current || score > current.score) {
          records.set(activityKey, {
            name,
            setup: entry?.setup ?? exercise.setup,
            score,
            summary: getExerciseFirstSetSummary(entry),
            date: historyEntry.date,
          });
        }
      });
  });
  const values = [...records.values()];
  const duplicateNames = values.reduce((counts, record) => {
    const nameKey = normalizeExerciseName(record.name);
    counts.set(nameKey, (counts.get(nameKey) || 0) + 1);
    return counts;
  }, new Map());
  return values
    .map((record) => ({
      ...record,
      name: duplicateNames.get(normalizeExerciseName(record.name)) > 1
        ? getStrengthActivityLabel(record.name, record.setup)
        : record.name,
    }))
    .sort((a, b) => b.score - a.score);
}

function getRunningRecords(rangeDays = getStatsRangeDays()) {
  const runs = getRunHistoryRows(rangeDays).filter((run) => Number.isFinite(run.distance) || Number.isFinite(run.durationSeconds));
  if (!runs.length) return [];

  const records = [];
  const byLatest = [...runs].sort((a, b) => `${b.date}${b.completedAt}`.localeCompare(`${a.date}${a.completedAt}`));
  const distanceRows = runs.filter((run) => Number.isFinite(run.distance));
  const fiveKRows = runs.filter((run) => Number.isFinite(run.estimatedFiveKSeconds));

  const bestFiveK = [...fiveKRows].sort((a, b) => a.estimatedFiveKSeconds - b.estimatedFiveKSeconds)[0];
  if (bestFiveK) {
    records.push({
      type: "run",
      name: "Beste 5K schatting",
      meta: formatRunRecordMeta(bestFiveK),
      value: formatRaceTime(bestFiveK.estimatedFiveKSeconds),
    });
  }

  const longest = [...distanceRows].sort((a, b) => b.distance - a.distance)[0];
  if (longest) {
    records.push({
      type: "run",
      name: "Langste run",
      meta: [Number.isFinite(longest.durationSeconds) && formatMetricDuration(longest.durationSeconds), formatDate(longest.date)]
        .filter(Boolean)
        .join(" - "),
      value: `${formatNumber(longest.distance)} km`,
    });
  }

  const latest = byLatest[0];
  if (latest) {
    records.push({
      type: "run",
      name: "Laatste run",
      meta: formatDate(latest.date),
      value: formatRunRecordValue(latest),
    });
  }

  return records;
}

function formatRunRecordMeta(run) {
  return [
    Number.isFinite(run.distance) && `${formatNumber(run.distance)} km`,
    Number.isFinite(run.durationSeconds) && formatMetricDuration(run.durationSeconds),
    Number.isFinite(run.intensity) && `${formatNumber(run.intensity)}/10`,
    formatDate(run.date),
  ].filter(Boolean).join(" - ");
}

function getChartGroup() {
  return CHART_GROUPS.includes(state.chartGroup) ? state.chartGroup : "Upper";
}

function getChartFilters(group) {
  return CHART_FILTERS[group] || CHART_FILTERS.Upper;
}

function getChartFilter(group) {
  const filters = getChartFilters(group);
  const value = state.chartFilter || "all";
  return filters.some((filter) => filter.value === value) ? value : "all";
}

function getDefaultChartMetric(group) {
  return group === "Running" ? RUN_5K_METRIC : STRENGTH_INDEX_METRIC;
}

function getStatsRangeDays(value = state.statsRangeDays) {
  const days = Number(value);
  return STATS_RANGE_DAYS.includes(days) ? days : DEFAULT_STATS_RANGE_DAYS;
}

function getStatsHistory(rangeDays = getStatsRangeDays()) {
  const cache = getHistoryCache();
  const days = getStatsRangeDays(rangeDays);
  if (!cache.statsByRange.has(days)) {
    cache.statsByRange.set(days, state.history.filter((entry) => isHistoryEntryInStatsRange(entry, days)));
  }
  return cache.statsByRange.get(days);
}

function getStatsHistoryAsc(rangeDays = getStatsRangeDays()) {
  const cache = getHistoryCache();
  const days = getStatsRangeDays(rangeDays);
  if (!cache.statsAscByRange.has(days)) {
    cache.statsAscByRange.set(days, getSortedHistoryAsc().filter((entry) => isHistoryEntryInStatsRange(entry, days)));
  }
  return cache.statsAscByRange.get(days);
}

function isHistoryEntryInStatsRange(historyEntry, rangeDays = getStatsRangeDays()) {
  const age = daysBetween(historyEntry.date, today());
  return age >= 0 && age <= rangeDays;
}

function renderChartFilterControl(group, activeFilter) {
  if (!els.chartFilterControl) return;
  const filters = getChartFilters(group);
  els.chartFilterControl.hidden = filters.length <= 1;
  els.chartFilterControl.innerHTML = filters
    .map((filter) => `
      <button type="button" data-action="chart-filter" data-chart-filter="${escapeAttr(filter.value)}" class="${filter.value === activeFilter ? "is-active" : ""}">
        ${escapeHtml(filter.label)}
      </button>
    `)
    .join("");
}

function getChartMetrics(group, filter = "all") {
  if (group === "Running") {
    return [{ value: RUN_5K_METRIC, label: "5K schatting" }];
  }

  const metricsByKey = new Map();
  sessions
    .filter((session) => session.group === group)
    .flatMap((session) => session.exercises)
    .filter((exercise) => matchesChartFilter(exercise, group, filter))
    .forEach((exercise) => {
      const name = getProgramExerciseName(exercise);
      const activityKey = getStrengthActivityKey(name, exercise.setup);
      if (!metricsByKey.has(activityKey)) metricsByKey.set(activityKey, { name, setup: exercise.setup, activityKey });
    });

  const duplicateNames = new Map();
  metricsByKey.forEach((metric) => {
    const nameKey = normalizeExerciseName(metric.name);
    duplicateNames.set(nameKey, (duplicateNames.get(nameKey) || 0) + 1);
  });

  const exerciseMetrics = [...metricsByKey.values()]
    .map((metric) => ({
      value: `exercise:${metric.activityKey}`,
      label: duplicateNames.get(normalizeExerciseName(metric.name)) > 1
        ? getStrengthActivityLabel(metric.name, metric.setup)
        : metric.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const filterLabel = getChartFilters(group).find((item) => item.value === filter)?.label;
  const indexLabel = filter === "all" ? "Strength index" : `${filterLabel} index`;
  return [{ value: STRENGTH_INDEX_METRIC, label: indexLabel }, ...exerciseMetrics];
}

function getTrendPoints(group, metric, filter = "all", rangeDays = getStatsRangeDays()) {
  if (group === "Running") return getRunTrendPoints(metric, rangeDays);
  if (metric === STRENGTH_INDEX_METRIC) return getStrengthIndexTrendPoints(group, filter, rangeDays);

  return getStatsHistoryAsc(rangeDays)
    .filter((entry) => entry.sessionGroup === group && entry.workout)
    .map((entry) => {
      const value = getExerciseTrendValue(entry, metric.replace("exercise:", ""));
      if (value === null) return null;
      return {
        date: entry.date,
        label: entry.sessionLabel,
        value,
      };
    })
    .filter(Boolean);
}

function getStrengthIndexTrendPoints(group, filter = "all", rangeDays = getStatsRangeDays()) {
  const cache = getHistoryCache();
  const days = getStatsRangeDays(rangeDays);
  const cacheKey = getHistoryCacheKey(["strength-index", group, filter, days]);
  if (cache.strengthIndexPoints.has(cacheKey)) return cache.strengthIndexPoints.get(cacheKey);

  const baselines = new Map();
  const latestFactors = new Map();
  const points = [];

  getSortedHistoryAsc().forEach((historyEntry) => {
    const measurements = getStrengthIndexMeasurements(historyEntry, group, filter);
    if (!measurements.length) return;

    measurements.forEach(({ activityKey, score }) => {
      if (!baselines.has(activityKey)) baselines.set(activityKey, score);
      const baseline = baselines.get(activityKey);
      if (baseline > 0) latestFactors.set(activityKey, score / baseline);
    });

    if (!isHistoryEntryInStatsRange(historyEntry, days)) return;
    const factor = getGeometricMean([...latestFactors.values()]);
    if (factor === null) return;
    points.push({
      date: historyEntry.date,
      label: historyEntry.sessionLabel,
      value: factor * 100,
    });
  });

  cache.strengthIndexPoints.set(cacheKey, points);
  return points;
}

function getStrengthIndexMeasurements(historyEntry, group, filter = "all") {
  const session = findSession(historyEntry.sessionId);
  const workout = historyEntry.workout;
  if (!session || !workout || session.group !== group) return [];

  const measurements = new Map();
  session.exercises.forEach((exercise) => {
    if (!matchesChartFilter(exercise, group, filter)) return;
    const entry = workout.exercises?.[exercise.id];
    const score = getExerciseFirstSetE1rm(entry);
    if (score === null) return;

    const name = entry?.name || getProgramExerciseName(exercise);
    const activityKey = getStrengthActivityKey(name, entry?.setup ?? exercise.setup);
    const previous = measurements.get(activityKey);
    if (!previous || score > previous.score) measurements.set(activityKey, { activityKey, score });
  });

  return [...measurements.values()];
}

function getRunTrendPoints(metric, rangeDays = getStatsRangeDays()) {
  return getStatsHistoryAsc(rangeDays)
    .filter((entry) => entry.workout)
    .flatMap((historyEntry) => getHistoryActivityEntries(historyEntry)
      .filter((candidate) => candidate.kind === "run")
      .flatMap((candidate) => getMetricAttempts(candidate.entry).map((attempt) => {
        const value = getRunMetricValue(attempt.metrics || {}, metric);
        if (value === null) return null;
        return {
          date: historyEntry.date,
          label: candidate.name,
          value,
        };
      }))
      .filter(Boolean));
}

function getExerciseTrendValue(historyEntry, exerciseKey) {
  const session = findSession(historyEntry.sessionId);
  const workout = historyEntry.workout;
  if (!session || !workout) return null;

  let best = null;
  session.exercises.forEach((exercise) => {
    const entry = workout.exercises?.[exercise.id];
    const name = entry?.name || getProgramExerciseName(exercise);
    if (getStrengthActivityKey(name, entry?.setup ?? exercise.setup) !== exerciseKey) return;
    const value = getExerciseFirstSetE1rm(entry);
    if (value !== null && (best === null || value > best)) best = value;
  });
  return best;
}

function getRunMetricValue(metrics, metric) {
  const distance = parseNumber(metrics.distance);
  const durationSeconds = parseDurationToSeconds(metrics.duration);
  const intensity = parseRunIntensity(metrics.intensity);
  if (metric === RUN_5K_METRIC) return getEstimatedFiveKSeconds(metrics);
  if (metric === RUN_DISTANCE_METRIC) return Number.isFinite(distance) && distance > 0 ? distance : null;
  if (metric === RUN_DURATION_METRIC) return durationSeconds ? durationSeconds / 60 : null;
  if (metric === RUN_INTENSITY_METRIC) return Number.isFinite(intensity) ? intensity : null;
  if (metric === RUN_PACE_METRIC) {
    if (!Number.isFinite(distance) || distance <= 0 || !durationSeconds) return null;
    return durationSeconds / distance;
  }
  return null;
}

function getEstimatedFiveKSeconds(metrics = {}) {
  const distance = parseNumber(metrics.distance);
  const durationSeconds = parseDurationToSeconds(metrics.duration);
  const intensity = parseRunIntensity(metrics.intensity);
  if (
    !Number.isFinite(distance) ||
    distance < MIN_RUN_DISTANCE_KM_FOR_5K_ESTIMATE ||
    !durationSeconds ||
    !Number.isFinite(intensity) ||
    intensity < MIN_RUN_INTENSITY_FOR_5K_ESTIMATE
  ) return null;

  return durationSeconds * Math.pow(RUN_TARGET_DISTANCE_KM / distance, RUN_RIEGEL_EXPONENT);
}

function getRunHistoryRows(rangeDays = getStatsRangeDays()) {
  return getStatsHistory(rangeDays).flatMap((historyEntry) => getHistoryActivityEntries(historyEntry)
    .filter((candidate) => candidate.kind === "run")
    .flatMap((candidate) => getMetricAttempts(candidate.entry).map((attempt) => {
      const metrics = attempt.metrics || {};
      const distance = parseNumber(metrics.distance);
      const durationSeconds = parseDurationToSeconds(metrics.duration);
      const intensity = parseRunIntensity(metrics.intensity);
      return {
        date: historyEntry.date,
        completedAt: historyEntry.completedAt || "",
        name: candidate.name,
        distance: Number.isFinite(distance) && distance > 0 ? distance : null,
        durationSeconds: durationSeconds || null,
        intensity: Number.isFinite(intensity) ? intensity : null,
        paceSeconds: Number.isFinite(distance) && distance > 0 && durationSeconds ? durationSeconds / distance : null,
        estimatedFiveKSeconds: getEstimatedFiveKSeconds(metrics),
      };
    })));
}

function parseRunIntensity(value) {
  const intensity = parseNumber(value);
  if (!Number.isFinite(intensity)) return null;
  return Math.max(0, Math.min(10, intensity));
}

function getExerciseCategory(exercise, group) {
  const name = normalizeExerciseName(exercise.name);
  if (group === "Upper") {
    if (/(curl|bicep)/.test(name)) return "biceps";
    if (/(jm press|pushdown|tricep)/.test(name)) return "triceps";
    if (/(pull up|pull ups|row|lat prayer)/.test(name)) return "back";
    if (/(shoulder press|laterial|lateral|side delt|y-raise|y-raises)/.test(name)) return "shoulders";
    if (/(bench|press|dips)/.test(name)) return "push";
    return "push";
  }

  if (group === "Lower") {
    if (/(calve|calf)/.test(name)) return "calves";
    if (/(neck|trap)/.test(name)) return "neck";
    if (/(wrist|grip|riser|squeeze|dead hang|side pressure)/.test(name)) return "grip";
    if (/(oblique|crunch|bend)/.test(name)) return "abs";
    return "legs";
  }

  return "all";
}

function matchesChartFilter(exercise, group, filter = "all") {
  return filter === "all" || getExerciseCategory(exercise, group) === filter;
}

function getExerciseFirstSetE1rm(entry) {
  const firstSet = entry?.sets?.[0];
  return firstSet ? estimateOneRepMax(firstSet, entry) : null;
}

function getExerciseFirstSetSummary(entry) {
  const firstSet = entry?.sets?.[0];
  return firstSet && estimateOneRepMax(firstSet, entry) !== null ? formatSetSummary(firstSet, entry) : "Geen eerste set";
}

function getExerciseSetGainScore(entry) {
  const scoredSets = getScoredStrengthSets(entry);
  const weights = getSetPositionWeights((entry?.sets || []).length);
  if (!scoredSets.length || !weights.length) return null;

  const totalWeight = scoredSets.reduce((sum, item) => sum + (weights[item.index] || 0), 0);
  if (!totalWeight) return null;
  return scoredSets.reduce((sum, item) => sum + item.score * (weights[item.index] || 0), 0) / totalWeight;
}

function getScoredStrengthSets(entry) {
  if (!entry) return [];
  return (entry.sets || [])
    .map((set, index) => ({ set, index, score: estimateOneRepMax(set, entry) }))
    .filter((item) => item.score !== null);
}

function getSetPositionWeights(count) {
  if (count <= 0) return [];
  if (count === 1) return [1];
  if (count === 2) return normalizeWeights([0.5, 0.3]);

  const tailCount = count - 2;
  const tailRaw = Array.from({ length: tailCount }, (_, index) => Math.pow(TAIL_SET_WEIGHT_DECAY, index));
  const tailTotal = tailRaw.reduce((sum, value) => sum + value, 0) || 1;
  return [
    0.5,
    0.3,
    ...tailRaw.map((value) => (0.2 * value) / tailTotal),
  ];
}

function normalizeWeights(weights) {
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  return weights.map((weight) => weight / total);
}

function getGeometricMean(values) {
  const valid = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!valid.length) return null;
  return Math.exp(valid.reduce((sum, value) => sum + Math.log(value), 0) / valid.length);
}

function estimateOneRepMax(set, entry = {}) {
  if (!hasCompleteStrengthSet(set, entry)) return null;
  if (isUnilateralSet(set, entry)) {
    const sideEntry = { ...entry, unilateral: false };
    const sideScores = [set.left, set.right]
      .map((side) => estimateOneRepMax(side, sideEntry))
      .filter((score) => score !== null);
    if (sideScores.length !== 2) return null;
    return sideScores.reduce((sum, score) => sum + score, 0) / sideScores.length;
  }

  const weight = getStrengthLoad(set, entry);
  const reps = parseNumber(set.reps);
  const rpe = parseNumber(set.rpe);
  if (
    !Number.isFinite(weight) ||
    !Number.isFinite(reps) ||
    !Number.isFinite(rpe) ||
    weight <= 0 ||
    reps <= 0 ||
    rpe < MIN_RPE_FOR_E1RM
  ) return null;

  const effectiveReps = getEffectiveRepsForSet(set);
  return getHybridOneRepMax(weight, effectiveReps);
}

function getEffectiveRepsForSet(set) {
  const reps = parseNumber(set.reps);
  const rpe = parseNumber(set.rpe);
  const rir = Number.isFinite(rpe)
    ? Math.max(0, Math.min(MAX_RIR_FROM_RPE, 10 - Math.max(0, Math.min(rpe, 10))))
    : 0;
  return Math.max(1, Math.min(MAX_EFFECTIVE_REPS_FOR_E1RM, reps + rir));
}

function getHybridOneRepMax(weight, effectiveReps) {
  if (effectiveReps <= 1.05) return weight;

  const formulas = [
    weight * (1 + effectiveReps / 30), // Epley
    weight * (1 + 0.025 * effectiveReps), // O'Conner
    weight * Math.pow(effectiveReps, 0.10), // Lombardi
    (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * effectiveReps)), // Mayhew
    (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * effectiveReps)), // Wathan
  ];

  if (effectiveReps <= 12) {
    formulas.push(
      weight * (36 / (37 - effectiveReps)), // Brzycki
      (100 * weight) / (101.3 - 2.67123 * effectiveReps), // Lander
    );
  }

  const valid = formulas.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  const trimmed = valid.length >= 5 ? valid.slice(1, -1) : valid;
  return trimmed.reduce((sum, value) => sum + value, 0) / trimmed.length;
}

function formatRunRecordValue(run) {
  return [
    Number.isFinite(run.distance) && `${formatNumber(run.distance)} km`,
    Number.isFinite(run.durationSeconds) && formatMetricDuration(run.durationSeconds),
    Number.isFinite(run.intensity) && `${formatNumber(run.intensity)}/10`,
    Number.isFinite(run.paceSeconds) && `${formatPace(run.paceSeconds)}/km`,
  ].filter(Boolean).join(" / ") || "-";
}

function formatMetricDuration(seconds) {
  if (!Number.isFinite(seconds)) return "-";
  return formatPace(seconds);
}

function formatRaceTime(seconds) {
  if (!Number.isFinite(seconds)) return "-";
  return formatPace(seconds);
}

function formatChartValue(value, metric) {
  if (metric === RUN_5K_METRIC) return formatRaceTime(value);
  if (metric === RUN_PACE_METRIC) return `${formatPace(value)}/km`;
  if (metric === RUN_DISTANCE_METRIC) return `${formatNumber(value)} km`;
  if (metric === RUN_DURATION_METRIC) return `${formatNumber(value)} min`;
  if (metric === RUN_INTENSITY_METRIC) return `${formatNumber(value)}/10`;
  if (metric === STRENGTH_INDEX_METRIC) return `${formatNumber(value)}%`;
  return `${formatNumber(value)} e1RM`;
}

function formatChartAxisValue(value, metric) {
  if (metric === RUN_5K_METRIC) return formatRaceTime(value);
  if (metric === RUN_PACE_METRIC) return formatPace(value);
  if (metric === RUN_DURATION_METRIC) return `${formatNumber(value)}m`;
  if (metric === RUN_INTENSITY_METRIC) return `${formatNumber(value)}/10`;
  if (metric === STRENGTH_INDEX_METRIC) return `${formatNumber(value)}%`;
  return formatNumber(value);
}

function formatLogProgressPercent(value) {
  if (Math.abs(value) < 0.05) return "0%";
  return value > 0 ? `${formatNumber(value)}%` : `-${formatNumber(Math.abs(value))}%`;
}

function renderChartReadout(points, metric) {
  if (!points.length) {
    els.chartReadout.innerHTML = "";
    return;
  }

  const first = points[0];
  const latest = points[points.length - 1];
  const best = getBestTrendPoint(points, metric);
  const bestIsLatest = best.index === points.length - 1;
  const cards = [
    {
      label: bestIsLatest && points.length > 1 ? "Nu / beste" : "Nu",
      value: formatChartValue(latest.value, metric),
      tone: bestIsLatest && points.length > 1 ? "is-up" : "",
    },
  ];

  if (points.length > 1) {
    cards.push({
      label: `Sinds ${formatDateShort(first.date)}`,
      value: formatTrendProgress(first.value, latest.value, metric),
      tone: getTrendTone(first.value, latest.value, metric),
    });
  }

  if (points.length > 1 && !bestIsLatest) {
    cards.push({
      label: `Beste - ${formatDateShort(best.point.date)}`,
      value: formatChartValue(best.point.value, metric),
      tone: "is-best",
    });
  }

  els.chartReadout.innerHTML = cards
    .map(({ label, value, tone }) => `
      <div class="chart-stat ${tone}">
        <strong>${value}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    `)
    .join("");
}

function getBestTrendPoint(points, metric) {
  const lowerIsBetter = isLowerBetterMetric(metric);
  return points.reduce((best, point, index) => {
    const better = lowerIsBetter ? point.value < best.point.value : point.value > best.point.value;
    return better ? { point, index } : best;
  }, { point: points[0], index: 0 });
}

function isLowerBetterMetric(metric) {
  return metric === RUN_PACE_METRIC || metric === RUN_5K_METRIC;
}

function getTrendTone(firstValue, latestValue, metric) {
  const score = getTrendImprovement(firstValue, latestValue, metric);
  if (Math.abs(score) < 0.05) return "is-flat";
  return score > 0 ? "is-up" : "is-down";
}

function getTrendImprovement(firstValue, latestValue, metric) {
  const change = latestValue - firstValue;
  return isLowerBetterMetric(metric) ? -change : change;
}

function formatTrendProgress(firstValue, latestValue, metric) {
  const improvement = getTrendImprovement(firstValue, latestValue, metric);
  const percent = firstValue ? (improvement / firstValue) * 100 : 0;
  if (Math.abs(percent) < 0.05) return "0%";

  if (isLowerBetterMetric(metric)) {
    return `${formatNumber(Math.abs(percent))}% ${improvement > 0 ? "sneller" : "langzamer"}`;
  }

  return `${percent > 0 ? "+" : ""}${formatNumber(percent)}%`;
}

function drawTrendCanvas(points, metric) {
  const canvas = els.chartCanvas;
  const wrapper = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = Math.max(320, Math.floor(wrapper?.clientWidth || 720));
  const cssHeight = Math.max(260, Math.floor(canvas.clientHeight || 320));
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  if (!points.length) {
    canvas.hidden = true;
    els.chartEmpty.hidden = false;
    return;
  }

  canvas.hidden = false;
  els.chartEmpty.hidden = true;

  const styles = getComputedStyle(document.documentElement);
  const line = styles.getPropertyValue("--line").trim();
  const textDim = styles.getPropertyValue("--text-dim").trim();
  const green = styles.getPropertyValue("--green").trim();
  const blue = styles.getPropertyValue("--blue").trim();
  const panel = styles.getPropertyValue("--panel-3").trim();

  const pad = { top: 18, right: 18, bottom: 42, left: isLowerBetterMetric(metric.value) ? 54 : 46 };
  const plotWidth = cssWidth - pad.left - pad.right;
  const plotHeight = cssHeight - pad.top - pad.bottom;
  const rawMin = Math.min(...points.map((point) => point.value));
  const rawMax = Math.max(...points.map((point) => point.value));
  const padding = Math.max(5, (rawMax - rawMin) * 0.12);
  const min = Math.max(0, rawMin - padding);
  const max = rawMax === rawMin ? rawMax + padding : rawMax + padding;
  const range = max - min || 1;
  const xFor = (index) => pad.left + (points.length === 1 ? plotWidth / 2 : (plotWidth * index) / (points.length - 1));
  const yFor = (value) => pad.top + plotHeight - ((value - min) / range) * plotHeight;

  ctx.lineWidth = 1;
  ctx.strokeStyle = line;
  ctx.fillStyle = textDim;
  ctx.font = "12px Inter, sans-serif";

  for (let i = 0; i < 4; i += 1) {
    const ratio = i / 3;
    const y = pad.top + plotHeight * ratio;
    const value = max - range * ratio;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(cssWidth - pad.right, y);
    ctx.stroke();
    ctx.fillText(formatChartAxisValue(value, metric.value), 8, y + 4);
  }

  const gradient = ctx.createLinearGradient(0, pad.top, 0, cssHeight - pad.bottom);
  gradient.addColorStop(0, "rgba(215, 255, 99, 0.22)");
  gradient.addColorStop(1, "rgba(215, 255, 99, 0)");

  ctx.beginPath();
  points.forEach((point, index) => {
    const x = xFor(index);
    const y = yFor(point.value);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(xFor(points.length - 1), cssHeight - pad.bottom);
  ctx.lineTo(xFor(0), cssHeight - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  points.forEach((point, index) => {
    const x = xFor(index);
    const y = yFor(point.value);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = metric.value === STRENGTH_INDEX_METRIC ? green : blue;
  ctx.lineWidth = 3;
  ctx.stroke();

  points.forEach((point, index) => {
    const x = xFor(index);
    const y = yFor(point.value);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = panel;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = metric.value === STRENGTH_INDEX_METRIC ? green : blue;
    ctx.stroke();
  });

  const first = points[0];
  const latest = points[points.length - 1];
  ctx.fillStyle = textDim;
  ctx.fillText(formatDateShort(first.date), pad.left, cssHeight - 16);
  const latestLabel = formatDateShort(latest.date);
  const latestWidth = ctx.measureText(latestLabel).width;
  ctx.fillText(latestLabel, cssWidth - pad.right - latestWidth, cssHeight - 16);
}

function getCycleCompletionStreak() {
  const resetAt = state.cycleStreakResetAt || "";
  const entries = getSortedHistoryDesc()
    .filter((entry) => cycleOrder.includes(entry.sessionId) && (!resetAt || getHistoryCompletedAt(entry) > resetAt));

  let streak = 0;
  let expectedIndex = null;
  for (const entry of entries) {
    const index = cycleOrder.indexOf(entry.sessionId);
    if (expectedIndex === null) expectedIndex = index;
    if (index !== expectedIndex) break;
    if (!isCompleteCycleHistoryEntry(entry)) break;

    streak += 1;
    expectedIndex = (index - 1 + cycleOrder.length) % cycleOrder.length;
  }

  return streak;
}

function isCompleteCycleHistoryEntry(historyEntry) {
  if (!historyEntry || historyEntry.totalSets <= 0 || historyEntry.doneSets < historyEntry.totalSets) return false;
  const session = findSession(historyEntry.sessionId);
  const workout = historyEntry.workout;
  if (!session || !workout || !cycleOrder.includes(session.id)) return false;

  return session.exercises.every((exercise) => {
    const entry = workout.exercises?.[exercise.id];
    return entry && !isMetricEntry(entry) && (entry.sets || []).length > 0;
  });
}

function getHistoryCompletedAt(historyEntry) {
  return historyEntry.completedAt || `${historyEntry.date || "0000-00-00"}T23:59:59.999Z`;
}

function advanceCycle(sessionId) {
  const index = cycleOrder.indexOf(sessionId);
  if (index === -1) return;
  const completed = new Set(state.cycleCompleted || []);
  completed.add(sessionId);

  if (cycleOrder.every((id) => completed.has(id))) {
    state.cycleCompleted = [];
    state.cycleIndex = 0;
    return;
  }

  state.cycleCompleted = cycleOrder.filter((id) => completed.has(id));
  state.cycleIndex = getNextCycleIndex(index, completed);
}

function removeCycleCompletions(sessionIds) {
  const removed = new Set(sessionIds.filter((sessionId) => cycleOrder.includes(sessionId)));
  if (!removed.size) return;

  state.cycleCompleted = (state.cycleCompleted || []).filter((sessionId) => !removed.has(sessionId));
  state.cycleIndex = getFirstOpenCycleIndex();
}

function getFirstOpenCycleIndex() {
  const completed = new Set(state.cycleCompleted || []);
  const index = cycleOrder.findIndex((sessionId) => !completed.has(sessionId));
  return index === -1 ? 0 : index;
}

function getNextCycleIndex(fromIndex, completed) {
  for (let offset = 1; offset <= cycleOrder.length; offset += 1) {
    const index = (fromIndex + offset) % cycleOrder.length;
    if (!completed.has(cycleOrder[index])) return index;
  }
  return 0;
}

function getNextSession() {
  const id = cycleOrder[state.cycleIndex || 0] || cycleOrder[0];
  return findSession(id) || sessions[0];
}

function isCycleSessionComplete(sessionId) {
  return cycleOrder.includes(sessionId) && (state.cycleCompleted || []).includes(sessionId);
}

function findSession(sessionId) {
  return sessions.find((session) => session.id === sessionId);
}

function workoutKey(sessionId, date) {
  return `${date}::${sessionId}`;
}

function syncViewFromHash() {
  const requestedView = (location.hash || "#train").replace("#", "");
  const availableViews = [...document.querySelectorAll("[data-view]")].map((section) => section.dataset.view);
  const view = availableViews.includes(requestedView) ? requestedView : "train";
  if (view !== requestedView) {
    history.replaceState(null, "", "#train");
  }
  document.querySelectorAll("[data-view]").forEach((section) => {
    section.classList.toggle("is-active", section.dataset.view === view);
  });
  document.querySelectorAll("[data-view-link]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.viewLink === view);
  });
  if (view === "stats" && els.chartCanvas) {
    renderStats();
  }
  if (view === "log" && els.historyList) {
    renderHistory();
  }
}

function getActiveViewName() {
  return document.querySelector("[data-view].is-active")?.dataset.view || "train";
}

function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function parseDateLocal(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function isValidDateString(dateString) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(dateString || "")) && !Number.isNaN(parseDateLocal(dateString).getTime());
}

function getMonthStart(dateString) {
  const date = parseDateLocal(isValidDateString(dateString) ? dateString : today());
  date.setDate(1);
  return date.toISOString().slice(0, 10);
}

function addMonths(dateString, amount) {
  const date = parseDateLocal(getMonthStart(dateString));
  date.setMonth(date.getMonth() + amount);
  return date.toISOString().slice(0, 10);
}

function getMondayOffset(dateString) {
  return (parseDateLocal(dateString).getDay() + 6) % 7;
}

function addDays(dateString, amount) {
  const date = parseDateLocal(dateString);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  return Math.round((end - start) / 86400000);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "short", year: "numeric" }).format(parseDateLocal(dateString));
}

function formatDateShort(dateString) {
  return new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "short" }).format(parseDateLocal(dateString));
}

function formatDateTimeShort(value) {
  return new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatPreviousDate(dateString) {
  return formatDateShort(dateString).replace(".", "").toUpperCase();
}

function formatDateNumeric(dateString) {
  const [year, month, day] = String(dateString || today()).split("-");
  return `${day}-${month}-${year}`;
}

function formatMonthTitle(dateString) {
  return new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" }).format(parseDateLocal(dateString));
}

function formatNumber(value) {
  return Number(value).toLocaleString("nl-NL", { maximumFractionDigits: 1 });
}

function parseNumber(value) {
  return parseFloat(String(value).replace(",", "."));
}

function normalizeExerciseName(name) {
  return String(name).trim().toLowerCase().replace(/\s+/g, " ");
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), 1800);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!["http:", "https:"].includes(location.protocol)) return;
  navigator.serviceWorker.register(`sw.js?v=${APP_VERSION}`, { updateViaCache: "none" })
    .then((registration) => registration.update())
    .catch(() => {});
}
