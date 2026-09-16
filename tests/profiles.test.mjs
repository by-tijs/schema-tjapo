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
