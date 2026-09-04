const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the actual app without initialization, network access or real storage.
function loadApp() {
  const context = vm.createContext({
    document: { addEventListener() {} },
    localStorage: { getItem() { return null; } },
    structuredClone,
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8'), context);
  return vm.runInContext(`({
    sessions, getActivityHistory, getLatestActivitySnapshot, makeActivityHistoryTarget,
    getActivityTargetFromRef, getTimeEstimatePreviousSnapshot, getHistoryActivityEntries,
    renderExerciseCard, renderCustomCard, makeExerciseEntry, getActiveWorkout,
    upsertHistoryEntry, copyPreviousEntry,
    reset(history = [], overrides = {}) {
      state = { history, workouts: {}, exerciseNames: {}, bodyweights: {},
        activeSessionId: 'lower-a', activeDate: '2026-09-04', ...overrides };
      historyCache.ref = null;
      uiState.expandedCards = new Set(['exercise:smith-sissy-squats', 'custom:0']);
      uiState.historyCursor.clear();
      saveState = renderTraining = refreshIcons = showToast = () => {};
    },
    browse(index) { uiState.historyCursor.set('exercise:smith-sissy-squats', index); },
  })`, context);
}

const set = (weight, reps = 15, rpe = 8) => ({ weight: String(weight), reps: String(reps), rpe: String(rpe) });
const blank = () => set('', '', '');
const both = (weight) => ({ left: set(weight), right: set(weight) });
function recorded(app, sessionId, date, sets, entryOverrides = {}, exerciseIndex = 0) {
  const session = app.sessions.find(s => s.id === sessionId);
  const exercise = session.exercises[exerciseIndex];
  const entry = { ...app.makeExerciseEntry(exercise, date), sets, ...entryOverrides };
  return {
    id: `${sessionId}:${date}`, sessionId, sessionLabel: session.label, date,
    completedAt: `${date}T12:00:00.000Z`,
    workout: { sessionId, date, exercises: { [exercise.id]: entry }, customItems: [] },
  };
}
function setup() {
  const app = loadApp();
  app.reset();
  const exercise = app.sessions.find(s => s.id === 'lower-a').exercises[0];
  const entry = app.makeExerciseEntry(exercise);
  const target = app.makeActivityHistoryTarget(entry, exercise);
  return { app, exercise, entry, target };
}
function weights(html) {
  return [...html.matchAll(/placeholder="([^"]*)" data-field="weight"/g)].map(m => m[1]);
}
function fixture(app) {
  return [
    recorded(app, 'lower-a', '2026-08-06', [set(42.5), set(42.5)]),
    recorded(app, 'lower-b', '2026-09-02', [set(52.5, 13, 8.5), blank()]),
  ];
}

test('latest session wins across Lower A/B/C/D, even with only one recorded set', () => {
  const { app, target } = setup();
  for (const sessionId of ['lower-a', 'lower-b', 'lower-c', 'lower-d']) {
    app.reset([
      recorded(app, 'lower-a', '2026-08-06', [set(42.5), set(42.5)]),
      recorded(app, sessionId, '2026-09-02', [set(52.5), blank()]),
    ]);
    const latest = app.getLatestActivitySnapshot(target);
    assert.equal(latest.date, '2026-09-02');
    assert.equal(latest.sets[0].weight, '52.5');
    assert.equal(latest.sets[1], null);
    assert.equal(app.getActivityHistory(target)[0].date, latest.date);
  }
});

test('screenshot regression: first row is 52.5, second row has no older 42.5 suggestion', () => {
  const { app, exercise } = setup();
  app.reset(fixture(app));
  const html = app.renderExerciseCard(exercise, app.getActiveWorkout(), 0);
  assert.match(html, /52.5kg x 13r @8.5/);
  assert.match(html, /02 sep/i);
  assert.deepEqual(weights(html), ['52.5', 'kg']);
  assert.doesNotMatch(html, /42.5/);
  assert.match(html, /data-field="weight" value=""/);
});

test('single-row historical session leaves extra current rows without suggestions', () => {
  const { app, exercise } = setup();
  app.reset([recorded(app, 'lower-c', '2026-09-02', [set(60)])]);
  const workout = app.getActiveWorkout();
  workout.exercises[exercise.id].sets.push(blank());
  assert.deepEqual(weights(app.renderExerciseCard(exercise, workout, 0)), ['60', 'kg', 'kg']);
});

test('increasing current set count never changes the selected session', () => {
  const { app, entry, exercise } = setup();
  app.reset(fixture(app));
  for (const count of [1, 2, 3, 5]) {
    entry.sets = Array.from({ length: count }, blank);
    assert.equal(app.getLatestActivitySnapshot(app.makeActivityHistoryTarget(entry, exercise)).date, '2026-09-02');
  }
});

test('copy keeps both current rows and leaves missing second set empty', () => {
  const { app, exercise } = setup();
  app.reset(fixture(app));
  app.copyPreviousEntry({ dataset: { exerciseId: exercise.id, historyIndex: '0' } });
  const sets = app.getActiveWorkout().exercises[exercise.id].sets;
  assert.equal(sets.length, 2);
  assert.equal(sets[0].weight, '52.5');
  assert.equal(sets[1].weight, '');
  assert.equal(sets[1].reps, '');
  assert.equal(sets[1].rpe, '');
});

test('missing first set stays first; copying does not shift second set upwards', () => {
  const { app, exercise } = setup();
  app.reset([recorded(app, 'lower-b', '2026-09-02', [blank(), set(60)])]);
  assert.deepEqual(weights(app.renderExerciseCard(exercise, app.getActiveWorkout(), 0)), ['kg', '60']);
  app.copyPreviousEntry({ dataset: { exerciseId: exercise.id, historyIndex: '0' } });
  const sets = app.getActiveWorkout().exercises[exercise.id].sets;
  assert.equal(sets[0].weight, '');
  assert.equal(sets[1].weight, '60');
});

test('intentional history browsing keeps date, suggestions and copy on the same session', () => {
  const { app, exercise } = setup();
  app.reset(fixture(app));
  app.browse(1);
  const html = app.renderExerciseCard(exercise, app.getActiveWorkout(), 0);
  assert.match(html, /06 aug/i);
  assert.deepEqual(weights(html), ['42.5', '42.5']);
  app.copyPreviousEntry({ dataset: { exerciseId: exercise.id, historyIndex: '1' } });
  assert.equal(app.getActiveWorkout().exercises[exercise.id].sets[0].weight, '42.5');
});

test('time estimate uses the same latest partial session as the card', () => {
  const { app, entry, exercise } = setup();
  app.reset(fixture(app));
  const latest = app.getTimeEstimatePreviousSnapshot(entry, exercise);
  assert.equal(latest.date, '2026-09-02');
  assert.equal(latest.sets[1], null);
});

test('different setups stay separate', () => {
  const { app, target } = setup();
  app.reset([
    recorded(app, 'lower-a', '2026-08-06', [set(42.5)]),
    recorded(app, 'lower-b', '2026-09-02', [set(60)], { setup: 'andere machine' }),
  ]);
  assert.equal(app.getLatestActivitySnapshot(target).date, '2026-08-06');
});

test('compatible one-sided exercise matches across training variants', () => {
  const { app } = setup();
  const exercise = app.sessions.find(s => s.id === 'lower-a').exercises[1];
  const entry = app.makeExerciseEntry(exercise);
  app.reset([recorded(app, 'lower-c', '2026-09-02', [both(25), { left: blank(), right: blank() }], {}, 1)]);
  const latest = app.getLatestActivitySnapshot(app.makeActivityHistoryTarget(entry, exercise));
  assert.equal(latest.sets[0].left.weight, '25');
  assert.equal(latest.sets[0].right.weight, '25');
  assert.equal(latest.sets[1], null);
});

test('one-sided, time-based and bodyweight variants cannot cross-fill normal strength sets', () => {
  const { app, target } = setup();
  for (const overrides of [{ unilateral: true }, { isometric: true }, { usesBodyweight: true }]) {
    app.reset([recorded(app, 'lower-b', '2026-09-02', [set(60)], overrides)]);
    assert.equal(app.getLatestActivitySnapshot(target), null);
  }
});

test('stored historical name prevents a different exercise in a reused slot from matching', () => {
  const { app, target } = setup();
  app.reset([recorded(app, 'lower-a', '2026-09-02', [set(60)], { name: 'Different exercise' })]);
  assert.equal(app.getLatestActivitySnapshot(target), null);
});

test('legacy entries without a name still match their program exercise', () => {
  const { app, target } = setup();
  const old = recorded(app, 'lower-b', '2026-09-02', [set(60)]);
  delete old.workout.exercises['smith-sissy-squats-b'].name;
  app.reset([old]);
  assert.equal(app.getLatestActivitySnapshot(target).date, '2026-09-02');
});

test('identical custom exercises and program exercises share history in both directions', () => {
  const { app, target } = setup();
  const custom = { name: target.name, kind: 'strength', setup: '', sets: [set(60)] };
  const recent = { id: 'custom-lift', date: '2026-09-02', sessionId: 'overig', sessionLabel: 'Overig', workout: { exercises: {}, customItems: [custom] } };
  app.reset([recent, recorded(app, 'lower-a', '2026-08-06', [set(42.5)])]);
  assert.equal(app.getLatestActivitySnapshot(target).sessionLabel, 'Overig');
  app.reset([recorded(app, 'lower-a', '2026-09-02', [set(60)])], { activeSessionId: 'overig' });
  const current = { ...custom, sets: [blank(), blank()] };
  assert.deepEqual(weights(app.renderCustomCard(current, 0)), ['60', 'kg']);
});

test('a recent session where the exercise is entirely blank does not hide the last performed exercise', () => {
  const { app, target } = setup();
  app.reset([
    recorded(app, 'lower-a', '2026-08-06', [set(42.5)]),
    recorded(app, 'lower-b', '2026-09-02', [blank(), blank()]),
  ]);
  assert.equal(app.getLatestActivitySnapshot(target).date, '2026-08-06');
});

test('date order, past-date editing and equal-date tie breaking remain deterministic', () => {
  const { app, target } = setup();
  const recent = recorded(app, 'lower-b', '2026-09-02', [set(60)]);
  const later = recorded(app, 'lower-c', '2026-09-02', [set(65)]);
  later.completedAt = '2026-09-02T18:00:00.000Z';
  app.reset([
    recorded(app, 'lower-d', '2026-09-05', [set(80)]),
    recent,
    recorded(app, 'lower-a', '2026-08-06', [set(42.5)]),
    later,
    recorded(app, 'lower-a', '2026-09-04', [set(70)]),
  ]);
  assert.equal(app.getLatestActivitySnapshot(target).sets[0].weight, '65');
  assert.equal(app.getLatestActivitySnapshot({ ...target, beforeDate: '2026-09-02' }).date, '2026-08-06');
});

test('saving newer history invalidates cached latest and displayed histories', () => {
  const { app, target } = setup();
  app.reset([recorded(app, 'lower-a', '2026-08-06', [set(42.5)])]);
  assert.equal(app.getLatestActivitySnapshot(target).date, '2026-08-06');
  app.upsertHistoryEntry(recorded(app, 'lower-b', '2026-09-02', [set(60)]));
  assert.equal(app.getLatestActivitySnapshot(target).date, '2026-09-02');
  assert.equal(app.getActivityHistory(target)[0].date, '2026-09-02');
});

test('no history returns null and all blank default placeholders', () => {
  const { app, target, exercise } = setup();
  assert.equal(app.getLatestActivitySnapshot(target), null);
  assert.deepEqual(weights(app.renderExerciseCard(exercise, app.getActiveWorkout(), 0)), ['kg', 'kg']);
});

test('metric activities also use their last partial session without backfilling attempts', () => {
  const { app } = setup();
  const attempt = (duration) => ({ metrics: { distance: '5', duration, intensity: '8' } });
  const run = (date, attempts) => ({ id: date, date, sessionId: 'overig', sessionLabel: 'Overig', workout: { exercises: {}, customItems: [{ name: 'Hardlopen', kind: 'run', targetCount: 2, attempts }] } });
  app.reset([run('2026-08-06', [attempt('30:00'), attempt('31:00')]), run('2026-09-02', [attempt('28:00'), { metrics: {} }])]);
  const latest = app.getLatestActivitySnapshot({ name: 'Hardlopen', kind: 'run', beforeDate: '2026-09-04' });
  assert.equal(latest.date, '2026-09-02');
  assert.equal(latest.attempts[0].metrics.duration, '28:00');
  assert.equal(latest.attempts[1], null);
});

test('app, HTML, service worker and manifest consistently use the new cache version', () => {
  const root = path.join(__dirname, '..');
  for (const file of ['app.js', 'index.html', 'sw.js', 'manifest.webmanifest']) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(content, /(?:v=|cache-v|APP_VERSION = ")189/);
    assert.match(content, /190/);
  }
});
