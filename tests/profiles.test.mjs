import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const ownerKey = 'herpakkingsseason.tracker.v1';
function app(search = '', storage = new Map()) {
  const context = vm.createContext({
    URLSearchParams, Date, structuredClone, setTimeout, clearTimeout,
    location: { search, hash: '' }, document: { addEventListener() {} },
    window: { SCHEMA_TJAPO_FIREBASE_CONFIG: {apiKey:'test', projectId:'test', authDomain:'test', appId:'test'} },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  });
  vm.runInContext(source + '\nsyncViewFromHash = () => {}; profileAccount = {authenticated:true,queueSave(){},markEdited(){}}; state = loadState(); ensureDefaults();', context);
  return { run: code => vm.runInContext(code, context), storage };
}
test('Jochem starts empty even on a browser containing the owner’s progress', () => {
  const original = JSON.stringify({history:[{id:'owner-history',date:'2026-09-10'}],bodyweight:'94'});
  const storage = new Map([[ownerKey, original]]);
  const j = app('?profiel=jochem', storage);
  assert.equal(j.run('state.history.length'), 0);
  assert.equal(j.run('getDefaultBodyweight()'), '');
  j.run('getActiveWorkout().exercises["weighted-pull-ups"].sets[0].reps = "8"; flushStateSave();');
  assert.equal(storage.get(ownerKey), original);
  const reloaded = app('?profiel=jochem', storage);
  assert.equal(reloaded.run('getActiveWorkout().exercises["weighted-pull-ups"].sets[0].reps'), '8');
  assert.equal(app('',storage).run('state.history[0].id'), 'owner-history');
});
test('Jochem has four upper sessions, and cycles directly through them', () => {
  const j = app('?profiel=jochem');
  assert.equal(j.run('sessions.some(s => s.group === "Lower")'),false);
  assert.equal(j.run('CHART_GROUPS.includes("Lower")'),false);
  assert.equal(j.run('sessions.some(s => s.exercises.some(e => e.id === "deadlift"))'),false);
  for (const [completed,next] of [['upper-a','upper-b'],['upper-b','upper-c'],['upper-c','upper-d'],['upper-d','upper-a']]) {
    assert.equal(j.run(`advanceCycle('${completed}'); getNextSession().id`), next);
  }
});
test('Owner still has lower sessions, full cycle, and original bodyweight default', () => {
  const owner = app();
  assert.equal(owner.run('sessions.filter(s => s.group === "Lower").length'),4);
  assert.equal(owner.run('CHART_GROUPS.includes("Lower")'),true);
  assert.equal(owner.run('advanceCycle("upper-a"); getNextSession().id'),'lower-a');
  assert.equal(owner.run('getDefaultBodyweight()'),'94');
});
test('Cloud profile has its own UID storage while the owner keeps the existing key', () => {
  assert.equal(app('?profiel=jochem').run('STORAGE_KEY'), ownerKey + ':user:4XLfELa1AoeC4tcqBdW3e4Bz29o1');
  assert.equal(app().run('STORAGE_KEY'), ownerKey);
  assert.equal(app('?profiel=jochem').run('USER_PROFILE.uid'), '4XLfELa1AoeC4tcqBdW3e4Bz29o1');
});
test('Bodyweight is personal, and clearing it leaves empty fields without fictitious records', () => {
  const j = app('?profiel=jochem');
  assert.equal(j.run('getActiveWorkout().exercises["weighted-pull-ups"].bodyweight'), '');
  j.run('setDailyBodyweight(state.activeDate,"78");');
  assert.equal(j.run('getDefaultBodyweight()'), '78');
  assert.equal(j.run('getActiveWorkout().exercises["weighted-pull-ups"].bodyweight'), '78');
  j.run('setDailyBodyweight(state.activeDate,"");');
  assert.equal(j.run('getActiveWorkout().exercises["weighted-pull-ups"].bodyweight'), '');
  assert.equal(j.run('getExerciseStrengthLevel("db-incline-curls",30)'), '');
});
test('The installed Jochem app opens the same local profile', () => {
  const manifest = JSON.parse(readFileSync(new URL('../manifest-jochem.webmanifest', import.meta.url)));
  assert.equal(new URL(manifest.start_url,'https://example.com/').searchParams.get('profiel'), 'jochem');
  assert.equal(manifest.name, 'Schema Jochem');
});

test('Every Jochem Upper starts with two blank Bench Press sets, without changing Tijs', () => {
  const j = app('?profiel=jochem');
  for (const id of ['upper-a', 'upper-b', 'upper-c', 'upper-d']) {
    assert.equal(j.run(`findSession('${id}').exercises[0].name`), 'Bench Press');
    assert.equal(j.run(`getWorkout('${id}','2026-09-17').exercises['bench-press'].sets.length`), 2);
    assert.equal(j.run(`getWorkout('${id}','2026-09-17').exercises['bench-press'].sets.every(s => !s.weight && !s.reps && !s.rpe)`), true);
  }
  assert.equal(app().run('sessions.some(s => s.exercises.some(e => e.id === "bench-press"))'), false);
});

test('Adding Bench Press to an existing Upper keeps every previously entered set', () => {
  const j = app('?profiel=jochem');
  j.run(`const oldWorkout = getWorkout('upper-b','2026-09-16');
    delete oldWorkout.exercises['bench-press'];
    oldWorkout.exercises['weighted-dips'].sets[0] = {weight:'10',reps:'6',rpe:'9.1'};
    getWorkout('upper-b','2026-09-16');`);
  assert.equal(j.run('oldWorkout.exercises["bench-press"].sets.length'), 2);
  assert.equal(j.run('oldWorkout.exercises["weighted-dips"].sets[0].rpe'), '9.1');
});

test('The last recorded personal weight replaces stale 94kg in later workouts and history', () => {
  const j = app('?profiel=jochem');
  j.run(`state.bodyweight = '94';
    const w = getWorkout('upper-b', '2026-09-17');
    w.exercises['weighted-dips'].bodyweight = '94';
    w.exercises['weighted-dips'].sets[0] = {weight:'10',reps:'6',rpe:'9'};
    state.history = [{id:'saved',date:w.date,sessionId:w.sessionId,workout:structuredClone(w)}];
    state.bodyweights = {'2026-09-16':'78.5'};
    ensureDefaults();`);
  assert.equal(j.run('state.bodyweight'), '78.5');
  assert.equal(j.run('getWorkout("upper-b","2026-09-17").exercises["weighted-dips"].bodyweight'), '78.5');
  assert.equal(j.run('state.history[0].workout.exercises["weighted-dips"].bodyweight'), '78.5');
  assert.equal(j.run('state.history[0].volume'), (78.5 + 10) * 6);
  assert.equal(j.run('getWorkout("upper-a","2026-09-17").exercises["weighted-pull-ups"].bodyweight'), '78.5');
  j.run('setDailyBodyweight("2026-09-18","79")');
  assert.equal(j.run('getWorkout("upper-b","2026-09-17").exercises["weighted-dips"].bodyweight'), '78.5');
  assert.equal(j.run('getWorkout("upper-b","2026-09-18").exercises["weighted-dips"].bodyweight'), '79');
});

test('Decimal entry preserves the typed comma while saving a decimal distance and correct pace', () => {
  const j = app('?profiel=jochem');
  for (const value of ['5', '5,', '5,2', '5,25', '0,75', '5.25']) {
    j.run(`var input = { value: ${JSON.stringify(value)}, dataset: {field:'distance'} };`);
    assert.equal(j.run('normalizeInputValue(input)'), value.replace(',', '.'));
    assert.equal(j.run('input.value'), value);
  }
  assert.equal(j.run('calculateRunPace({distance:"5.25",duration:"26:15"})'), '5:00');
  assert.equal(j.run('calculateRunPace({distance:"5,25",duration:"26:15"})'), '5:00');
  assert.equal(j.run('normalizeInputValue({value:"12",dataset:{field:"rpe"}})'), '10');
});

test('Jochem’s inherited 94kg is cleared from saved workouts and history when no own measurement exists', () => {
  const j = app('?profiel=jochem');
  j.run(`state.bodyweight = '94'; state.bodyweights = {};
    const oldDips = getWorkout('upper-b','2026-09-16');
    oldDips.exercises['weighted-dips'].bodyweight = '94';
    oldDips.exercises['weighted-dips'].sets[0] = {weight:'10',reps:'6',rpe:'9'};
    const oldPullups = getWorkout('upper-a','2026-09-16');
    oldPullups.exercises['weighted-pull-ups'].bodyweight = '94';
    state.history = [{id:'kept',date:oldDips.date,sessionId:oldDips.sessionId,workout:structuredClone(oldDips)}];
    ensureDefaults(); flushStateSave();`);
  assert.equal(j.run('state.bodyweight'), '');
  assert.equal(j.run('oldDips.exercises["weighted-dips"].bodyweight'), '');
  assert.equal(j.run('oldPullups.exercises["weighted-pull-ups"].bodyweight'), '');
  assert.equal(j.run('state.history[0].workout.exercises["weighted-dips"].bodyweight'), '');
  assert.equal(j.run('state.history[0].workout.exercises["weighted-dips"].sets[0].reps'), '6');
  assert.equal(app('?profiel=jochem',j.storage).run('getDefaultBodyweight()'), '');
  assert.equal(j.run('ensureDefaults()'), false);
  assert.equal(app().run('getDefaultBodyweight()'), '94');
});

test('Jochem’s own non-default weight replaces old 94kg even without a daily measurement', () => {
  const j = app('?profiel=jochem');
  j.run(`state.bodyweight='81'; const w=getWorkout('upper-b','2026-09-17');
    w.exercises['weighted-dips'].bodyweight='94'; ensureDefaults();`);
  assert.equal(j.run('w.exercises["weighted-dips"].bodyweight'), '81');
});

test('An explicitly recorded personal weight of 94kg remains valid for Jochem', () => {
  const j = app('?profiel=jochem');
  j.run(`setDailyBodyweight('2026-09-16','94'); ensureDefaults();`);
  assert.equal(j.run('state.bodyweight'), '94');
  assert.equal(j.run('getWorkout("upper-b","2026-09-17").exercises["weighted-dips"].bodyweight'), '94');
});
