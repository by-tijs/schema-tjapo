import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';

const read = (name) => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const storageKey = 'herpakkingsseason.tracker.v1';
function app({ search = '', storage = new Map() } = {}) {
  const context = vm.createContext({
    window: {}, document: { addEventListener() {} }, URLSearchParams, Date, structuredClone,
    crypto: { randomUUID }, setTimeout: () => 1, clearTimeout() {},
    location: { search, pathname: '/index.html', hash: '#train' },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  });
  vm.runInContext(read('plan-model.js') + '\n' + read('app.js') + `
    syncViewFromHash = renderAll = showToast = () => {};
    ensureDefaults();
    function editPlan(edit) { const draft = getPersonalPlan(); const baseline = JSON.stringify(draft); edit(draft); commitPersonalPlan(draft, baseline); }
  `, context);
  const run = code => vm.runInContext(code, context);
  const json = code => JSON.parse(run(`JSON.stringify(${code})`));
  return { run, json, storage, model: context.window.PersonalPlan };
}

test('opening the editor keeps original IDs, custom names, cycle and input without saving defaults', () => {
  const a = app();
  a.run(`state.exerciseNames['flat-smith'] = 'Mijn smith'; var workout = getActiveWorkout();
    workout.exercises['flat-smith'].sets[0].weight = '55'; var before = JSON.stringify(state); var plan = getPersonalPlan();`);
  assert.equal(a.run('JSON.stringify(state) === before'), true);
  assert.equal(a.run('state.personalPlan'), undefined);
  assert.equal(a.run('plan.days[0].exercises[1].name'), 'Mijn smith');
  assert.deepEqual(a.json('plan.order'), a.json('DEFAULT_CYCLE_ORDER'));
});

test('add, copy, reorder and remove days persist per owner and do not alter defaults or Rehab', () => {
  const a = app();
  a.run(`state.rehab = {weeks:{'week-2':{'day-1':{ski:'Blijft staan'}}}};
    editPlan(plan => {
      const day = window.PersonalPlan.addDay(plan, 'Upper E');
      day.exercises.push(window.PersonalPlan.newExercise('Bench press', 3));
      const copy = window.PersonalPlan.copyDay(plan, day.id); copy.label = 'Upper F';
      window.PersonalPlan.move(plan.days, plan.days.findIndex(item => item.id === copy.id), -1);
      window.PersonalPlan.removeDay(plan, 'upper-d');
    });`);
  assert.equal(a.run('sessions.some(day => day.id === "upper-d")'), false);
  assert.equal(a.run('DEFAULT_SESSIONS.some(day => day.id === "upper-d")'), true);
  assert.equal(a.run('sessions.filter(day => day.label === "Upper E" || day.label === "Upper F").length'), 2);
  assert.equal(a.run('state.rehab.weeks["week-2"]["day-1"].ski'), 'Blijft staan');
  const b = app({ storage: a.storage });
  assert.deepEqual(b.json('sessions'), a.json('sessions'));
  assert.equal(b.run('stateHasMeaningfulData({personalPlan:state.personalPlan})'), true);
  assert.equal(b.run('new Set(cycleOrder).size === cycleOrder.length'), true);
});

test('set and exercise changes apply to a new training while an entered training keeps its original snapshot', () => {
  const a = app();
  a.run(`var oldWorkout = getActiveWorkout(); oldWorkout.exercises['flat-smith'].sets[0] = {weight:'60',reps:'8',rpe:'8'};
    var oldTotal = getCompletion(oldWorkout).total;
    editPlan(plan => { const day = plan.days[0]; day.label = 'Mijn upper';
      day.exercises.find(item => item.id === 'flat-smith').setCount = 4;
      day.exercises.push(window.PersonalPlan.newExercise('Bench press', 3)); });`);
  assert.equal(a.run('getTrainingSession().label'), 'Upper A');
  assert.equal(a.run('getCompletion(getActiveWorkout()).total === oldTotal'), true);
  assert.equal(a.run('getActiveWorkout().exercises["flat-smith"].sets[0].weight'), '60');
  assert.equal(a.run('getWorkout("upper-a", "2099-01-01").exercises["flat-smith"].sets.length'), 4);
  assert.equal(a.run('getWorkoutSession(getWorkout("upper-a", "2099-01-01")).label'), 'Mijn upper');
  assert.equal(a.run('getCompletion(getWorkout("upper-a", "2099-01-01")).total'), a.run('oldTotal + 5'));
});

test('an untouched draft is refreshed immediately after saving the schema', () => {
  const a = app();
  a.run(`getActiveWorkout(); editPlan(plan => { plan.days[0].exercises[0].setCount = 5; });`);
  assert.equal(a.run('getActiveWorkout().exercises["weighted-pull-ups"].sets.length'), 5);
});

test('removed days and replaced exercises remain accessible in history, records, graph and previous sets', () => {
  const a = app();
  a.run(`var oldWorkout = getWorkout('upper-a', '2026-11-01');
    oldWorkout.exercises['flat-smith'].sets[0] = {weight:'60',reps:'8',rpe:'8'};
    state.history = [{id:'kept', sessionId:'upper-a',sessionLabel:'Upper A', sessionGroup:'Upper',date:'2026-11-01', workout:structuredClone(oldWorkout)}];
    var originalSets = JSON.stringify(state.history[0].workout.exercises);
    editPlan(plan => { window.PersonalPlan.removeDay(plan, 'upper-a'); });
    var record = state.history[0];
    var target = {name:'Flat smith', kind:'strength',setup:'',entry:{},beforeDate:'2026-11-05'};`);
  assert.equal(a.run('JSON.stringify(record.workout.exercises) === originalSets'), true);
  assert.equal(a.run('getHistoryActivityEntries(record).some(item => item.name === "Flat smith")'), true);
  assert.equal(a.run('getExerciseTrendMeasurement(record, getStrengthActivityKey("Flat smith", "")).value > 0'), true);
  assert.equal(a.run('getActivityHistory(target)[0].sets[0].weight'), '60');
  assert.equal(a.run('getChartMetrics("Upper").some(item => item.label === "Flat smith")'), true);
  a.run(`state.activeSessionId = 'upper-a'; state.activeDate = '2026-11-01';`);
  assert.equal(a.run('getTrainingSession().label'), 'Upper A');
  assert.equal(a.run('getActiveWorkout().exercises["flat-smith"].sets[0].weight'), '60');
});

test('renaming or regrouping a day does not change the original history group or exercise label', () => {
  const a = app();
  a.run(`var w = getActiveWorkout(); w.exercises['flat-smith'].sets[0] = {weight:'60',reps:'8',rpe:'8'};
    state.history = [{id:'kept',sessionId:w.sessionId,sessionGroup:'Upper',date:w.date,workout:structuredClone(w)}];
    editPlan(plan => { plan.days[0].group='Lower'; plan.days[0].label='Nieuwe naam'; plan.days[0].exercises[1].name='Andere naam'; });`);
  assert.equal(a.run('getWorkoutSession(state.history[0].workout).group'), 'Upper');
  assert.equal(a.run('getProgramExerciseName(getWorkoutSession(state.history[0].workout).exercises[1])'), 'Flat smith');
});

test('empty day lists remain usable through Overig and an empty day cannot finish a cycle', () => {
  const a = app();
  a.run(`editPlan(plan => { plan.days.filter(day => day.id !== 'overig').forEach(day => window.PersonalPlan.removeDay(plan, day.id)); }); ensureDefaults(); advanceCycle('overig');`);
  assert.equal(a.run('getNextSession().id'), 'overig');
  assert.deepEqual(a.json('cycleOrder'), []);
  assert.equal(a.run('window.PersonalPlan.removeDay(state.personalPlan, "overig")'), false);
});

test('correcting an exercise name keeps previous sets and chart measurements under the same metric', () => {
  const a = app();
  a.run(`var w = getWorkout('upper-a', '2026-11-01'); w.exercises['flat-smith'].sets[0] = {weight:'60',reps:'8',rpe:'8'};
    state.history = [{id:'kept',sessionId:w.sessionId,sessionGroup:'Upper',date:w.date,workout:structuredClone(w)}];
    editPlan(plan => { plan.days[0].exercises.find(item => item.id === 'flat-smith').name = 'Flat Smith press'; });
    var target = {name:'Flat Smith press',kind:'strength',setup:'',entry:{},beforeDate:'2026-11-05'};`);
  assert.equal(a.run('getActivityHistory(target)[0].sets[0].weight'), '60');
  assert.equal(a.run('getStrengthActivityKey("Flat Smith press") === getStrengthActivityKey("Flat smith")'), true);
  assert.equal(a.run('getExerciseTrendMeasurement(state.history[0], getStrengthActivityKey("Flat Smith press")).value > 0'), true);
  assert.equal(a.run('getChartMetrics("Upper").filter(item => item.value === makeExerciseMetricValue("Flat Smith press")).length'), 1);
});

test('Jochem ignores an owner plan and cannot commit any schema edits', () => {
  const a = app({ search: '?profiel=jochem' });
  a.run('state.personalPlan = getPersonalPlan(); state.personalPlan.days = [state.personalPlan.days.find(day => day.id === "overig")]; ensureDefaults();');
  assert.equal(a.run('sessions.some(day => day.id === "lower-a")'), true);
  assert.equal(a.run('sessions[0].exercises[0].name'), 'Bench Press');
  assert.throws(() => a.run('commitPersonalPlan(getPersonalPlan(), JSON.stringify(getPersonalPlan()))'), /alleen beschikbaar voor Tijs/);
});

test('a stale editor cannot overwrite a newer schema; invalid or duplicate IDs are rejected', () => {
  const a = app();
  a.run(`var draft = getPersonalPlan(), baseline = JSON.stringify(draft); editPlan(plan => { plan.days[0].label='Nieuw op ander apparaat'; });`);
  assert.throws(() => a.run('commitPersonalPlan(draft, baseline)'), /intussen gewijzigd/);
  assert.equal(a.run('sessions[0].label'), 'Nieuw op ander apparaat');
  a.run(`draft = getPersonalPlan(); draft.days[1].id = draft.days[0].id;`);
  assert.equal(a.run('window.PersonalPlan.valid(draft)'), false);
  a.run(`draft = getPersonalPlan(); draft.days[0].exercises[0].setCount = -1;`);
  assert.equal(a.run('window.PersonalPlan.valid(draft)'), false);
});

test('exercise replacement uses a new identity and suggestions never copy previously logged sets', () => {
  const a = app();
  const exercise = a.model.newExercise('Bench press', 3, {id:'old',name:'Old',sets:[{weight:'100'}],note:'private',restSeconds:300,unilateral:true});
  assert.notEqual(exercise.id, 'old');
  assert.equal(exercise.sets, undefined);
  assert.equal(exercise.note, undefined);
  assert.equal(exercise.restSeconds, 300);
  assert.equal(exercise.unilateral, true);
});

test('editor entry points are owner-only and reuse existing button and card styles', () => {
  for (const file of ['plan-model.js', 'plan-editor.js', 'plan-editor.css']) assert.ok(read('sw.js').includes(file));
  assert.match(read('index.html'), /href="#schema" data-schema-owner hidden/);
  assert.match(read('index.html'), /data-view="schema" data-schema-owner/);
  const removed = [];
  const context = vm.createContext({ window: {}, document: { querySelectorAll: () => [{remove(){removed.push('link');}}, {remove(){removed.push('view');}}] } });
  vm.runInContext(read('plan-model.js') + '\n' + read('plan-editor.js'), context);
  context.window.PlanEditor.mount({ enabled:false });
  assert.deepEqual(removed, ['link','view']);
});
