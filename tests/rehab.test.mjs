import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
function load(globals = {}) {
  const context = vm.createContext({ window: {}, ...globals });
  vm.runInContext(read('rehab-plan.js') + '\n' + read('rehab.js'), context);
  return { api: context.window.Rehab, weeks: context.window.REHAB_PLAN, context };
}

test('two prescribed weeks contain all four days in source order and keep stable exercise IDs', () => {
  const { weeks } = load();
  assert.equal(weeks.length, 5);
  for (const week of weeks.slice(0, 2)) {
    assert.deepEqual(Array.from(week.days, day => day.exercises.length), [6, 5, 6, 5]);
    assert.equal(new Set(week.days.map(day => day.id)).size, 4);
    for (const day of week.days) assert.equal(new Set(day.exercises.map(e => e.id)).size, day.exercises.length);
  }
  assert.deepEqual(Array.from(weeks[0].days[0].exercises, e => e.name), [
    'Seated russian twist', 'Plank walk out', 'Jefferson curl', 'Shoulder taps', 'Side plank', 'Ski',
  ]);
  assert.deepEqual(Array.from(weeks[1].days[3].exercises, e => e.prescription), [
    '10x15m', '2 x 10m', '3 x 20m progressief met slee', 'short lever 1x25 sec per kant', '2 x 7 max 3kg',
  ]);
  assert.equal(weeks[1].days[1].exercises[4].prescription, '2 x 12 smith machine single leg');
});

test('notes stay separate across weeks and repeated exercises, and survive JSON storage', () => {
  const { api } = load();
  const state = { workouts: { original: { note: 'training' } }, history: [{ id: 'unchanged' }] };
  api.setNote(state, 'week-1', 'day-2', 'huppelen', 'Dag twee');
  api.setNote(state, 'week-1', 'day-4', 'huppelen', 'Dag vier');
  api.setNote(state, 'week-2', 'day-2', 'huppelen', 'Tweede week\nVoelt goed');
  const reload = JSON.parse(JSON.stringify(state));
  assert.equal(api.getNote(reload, 'week-1', 'day-2', 'huppelen'), 'Dag twee');
  assert.equal(api.getNote(reload, 'week-1', 'day-4', 'huppelen'), 'Dag vier');
  assert.equal(api.getNote(reload, 'week-2', 'day-2', 'huppelen'), 'Tweede week\nVoelt goed');
  assert.deepEqual(state.workouts, { original: { note: 'training' } });
  assert.deepEqual(state.history, [{ id: 'unchanged' }]);
  assert.equal(api.setNote(state, 'week-1', 'day-2', '__proto__', 'invalid'), false);
});

test('week 2 starts on 26 October in Amsterdam and advances each Monday across timezone boundaries', () => {
  const { api } = load();
  for (const [date, expected] of [
    ['2026-10-25T22:59:59Z', 'week-1'],
    ['2026-10-25T23:00:00Z', 'week-2'],
    ['2026-10-27T12:00:00Z', 'week-2'],
    ['2026-11-01T22:59:59Z', 'week-2'],
    ['2026-11-01T23:00:00Z', 'week-3'],
    ['2026-11-08T23:00:00Z', 'week-4'],
    ['2026-11-15T23:00:00Z', 'week-5'],
  ]) assert.equal(api.currentWeek(new Date(date)).id, expected, date);
});

test('weeks 3 to 5 have dates and empty days without invented exercises or comments', () => {
  const { weeks, api } = load();
  assert.deepEqual(Array.from(weeks.slice(2), week => week.startDate), ['2026-11-02', '2026-11-09', '2026-11-16']);
  for (const week of weeks.slice(2)) {
    assert.equal(week.days.length, 4);
    assert.ok(week.days.every(day => day.exercises.length === 0));
    assert.equal(api.weekText({}, week.id), `Rehab Tijs — ${week.label}\n\nSchema volgt nog.`);
    assert.equal(api.setNote({}, week.id, 'day-1', 'ski', 'invented'), false);
  }
  const ui = mounted({ now: () => new Date('2026-11-02T10:00:00Z') });
  ui.api.render();
  assert.match(ui.root.innerHTML, /Het schema voor week 3 volgt nog\./);
  assert.match(ui.root.innerHTML, /class="finish-bar rehab-copy-bar" hidden/);
  assert.ok(!ui.root.innerHTML.includes('data-rehab-note='));
});

test('opening Rehab uses this week despite old saved selection and keeps manual choices during the visit', () => {
  const state = { rehab: { selectedWeek: 'week-1', weeks: { 'week-1': { 'day-1': { ski: 'Historische opmerking' } } } } };
  const ui = mounted({ state });
  ui.api.open();
  assert.match(ui.root.innerHTML, /value="week-2" selected/);
  ui.listeners.change({ target: { matches: () => true, value: 'week-1' } });
  ui.api.render(); // A cloud/UI refresh must not override a manual choice.
  ui.api.resume(); // Returning from WhatsApp within the same week preserves it too.
  assert.match(ui.root.innerHTML, /value="week-1" selected/);
  assert.ok(ui.root.innerHTML.includes('Historische opmerking'));
  ui.api.open(); // Entering Rehab again defaults to this week.
  assert.match(ui.root.innerHTML, /value="week-2" selected/);
  assert.equal(ui.api.getNote(state, 'week-1', 'day-1', 'ski'), 'Historische opmerking');
  assert.equal(ui.saves(), 0); // Merely viewing a week never overwrites cloud data.
});

test('resuming an installed app after Monday advances to the new week', () => {
  let date = new Date('2026-11-01T22:59:00Z');
  const ui = mounted({ now: () => date });
  ui.api.open();
  assert.match(ui.root.innerHTML, /value="week-2" selected/);
  date = new Date('2026-11-01T23:01:00Z');
  ui.api.resume();
  assert.match(ui.root.innerHTML, /value="week-3" selected/);
  assert.match(ui.root.innerHTML, /Het schema voor week 3 volgt nog\./);
});

test('WhatsApp copy includes bold exercise names, the prescribed sets and weights, and notes', () => {
  const { api, weeks } = load();
  const state = {};
  api.setNote(state, 'week-1', 'day-1', 'seated-russian-twist', '  Rustig uitgevoerd.\nTweede ronde ging beter.  ');
  api.setNote(state, 'week-2', 'day-1', 'seated-russian-twist', 'Andere week');
  const text = api.weekText(state, 'week-1');
  assert.ok(text.startsWith('Rehab Tijs — Week 1\n\nDag 1'));
  assert.ok(text.includes('*Seated russian twist* — 2 x 3 4kg\nRustig uitgevoerd.\nTweede ronde ging beter.'));
  assert.equal((text.match(/Geen opmerkingen/g) || []).length, 21);
  for (const day of weeks[0].days) {
    assert.ok(text.includes(day.label));
    for (const exercise of day.exercises) {
      assert.ok(text.includes(exercise.name));
      assert.ok(text.includes(`*${exercise.name}* — ${exercise.prescription}`));
    }
  }
  assert.ok(!text.includes('Andere week'));
  assert.ok(api.weekText(state, 'week-2').includes('*Seated russian twist* — 2 x 5 R/L 4kg\nAndere week'));
  assert.equal(api.weekText(state, 'missing'), '');
});

test('blank comments produce Geen opmerkingen and empty preferences do not count as personal data', () => {
  const { api } = load();
  const state = { rehab: { selectedWeek: 'week-2' } };
  assert.equal(api.hasNotes(state), false);
  api.setNote(state, 'week-1', 'day-1', 'ski', '   \n');
  assert.equal(api.hasNotes(state), false);
  assert.match(api.weekText(state, 'week-1'), /\*Ski\* — 2 x 30 seconden\nGeen opmerkingen/);
  api.setNote(state, 'week-1', 'day-1', 'ski', 'Wel een opmerking');
  assert.equal(api.hasNotes(state), true);
  api.setNote(state, 'week-1', 'day-1', 'ski', '');
  assert.equal(api.getNote(JSON.parse(JSON.stringify(state)), 'week-1', 'day-1', 'ski'), '');
});

function mounted({ clipboardFails = false, state = {}, now = () => new Date('2026-10-27T12:00:00Z') } = {}) {
  const listeners = {};
  const status = { textContent: '' };
  const preview = { open: false };
  const field = { value: '', focus() { this.focused = true; }, select() { this.selected = true; }, setSelectionRange(a, b) { this.range = [a, b]; } };
  const elements = { '.rehab-copy-status': status, '.rehab-preview': preview, '[data-rehab-text]': field, '[data-rehab-week]': { focus() {} } };
  const root = { innerHTML: '', querySelector: s => elements[s] || { focus() {} }, querySelectorAll: () => [], addEventListener: (name, fn) => { listeners[name] = fn; } };
  const nav = { style: { setProperty() {} } };
  const copied = [];
  let flushes = 0;
  let saves = 0;
  const loaded = load({
    document: { querySelector: s => s === '.view-tabs' ? nav : root, querySelectorAll: () => [] },
    navigator: { clipboard: { writeText: async text => { if (clipboardFails) throw new Error('Denied'); copied.push(text); } } },
  });
  loaded.api.mount({ enabled: true, now, getState: () => state, save: () => { saves++; }, flush: () => { flushes++; }, refreshIcons() {} });
  return { ...loaded, state, listeners, root, status, preview, field, copied, saves: () => saves, flushes: () => flushes };
}

test('note entry saves immediately, escapes HTML in the form, and refreshes the full-week preview', () => {
  const ui = mounted();
  const note = '<script>alert("test")</script>\nRustig & goed';
  const input = { matches: () => true, dataset: { rehabNote: 'ski' }, value: note, style: {}, scrollHeight: 80 };
  ui.listeners.input({ target: input });
  assert.equal(ui.saves(), 1);
  assert.equal(ui.api.getNote(ui.state, 'week-2', 'day-1', 'ski'), note);
  assert.ok(ui.field.value.includes(note));
  ui.api.render();
  assert.ok(!ui.root.innerHTML.includes('<script>'));
  assert.ok(ui.root.innerHTML.includes('&lt;script&gt;'));
  assert.equal(input.style.height, '80px');
});

test('rehab completion is separate from notes, isolated by day/week, and survives storage', () => {
  const { api } = load();
  const state = { history: [{ id: 'strength-history' }] };
  api.setNote(state, 'week-2', 'day-1', 'ski', 'Opmerking blijft staan');
  const report = api.weekText(state, 'week-2');
  assert.equal(api.dayProgress(state, 'week-2', 'day-1').percent, 0);
  api.setExerciseComplete(state, 'week-2', 'day-1', 'ski', true);
  assert.equal(api.dayProgress(state, 'week-2', 'day-1').percent, 17);
  assert.equal(api.dayProgress(state, 'week-2', 'day-1').complete, false);
  api.setDayComplete(state, 'week-2', 'day-1', true);
  const reloaded = JSON.parse(JSON.stringify(state));
  assert.equal(api.dayProgress(reloaded, 'week-2', 'day-1').percent, 100);
  assert.equal(api.dayProgress(reloaded, 'week-2', 'day-1').complete, true);
  assert.equal(api.dayProgress(reloaded, 'week-2', 'day-2').percent, 0);
  assert.equal(api.dayProgress(reloaded, 'week-1', 'day-1').percent, 0);
  assert.equal(api.weekText(reloaded, 'week-2'), report);
  assert.deepEqual(state.history, [{ id: 'strength-history' }]);
  api.setExerciseComplete(reloaded, 'week-2', 'day-1', 'ski', false);
  assert.equal(api.dayProgress(reloaded, 'week-2', 'day-1').percent, 83);
  api.setDayComplete(reloaded, 'week-2', 'day-1', false);
  assert.equal(api.dayProgress(reloaded, 'week-2', 'day-1').percent, 0);
  assert.equal(api.getNote(reloaded, 'week-2', 'day-1', 'ski'), 'Opmerking blijft staan');
});

test('a day without notes can be completed; future empty days cannot', () => {
  const { api } = load();
  const state = {};
  assert.equal(api.setDayComplete(state, 'week-3', 'day-1', true), false);
  assert.equal(api.setExerciseComplete(state, 'week-2', 'day-1', 'missing', true), false);
  assert.equal(api.dayProgress(state, 'week-3', 'day-1').complete, false);
  assert.equal(api.hasData(state), false);
  assert.equal(api.setDayComplete(state, 'week-2', 'day-1', true), true);
  assert.equal(api.hasNotes(state), false);
  assert.equal(api.hasData(state), true);
  assert.equal((api.weekText(state, 'week-2').match(/Geen opmerkingen/g) || []).length, 22);
  api.setDayComplete(state, 'week-2', 'day-1', false);
  assert.equal(api.hasData(state), true); // Explicit undo must also sync to other devices.
});

test('exercise cards use the shared chevron and percentages, and completion controls save immediately', () => {
  const ui = mounted();
  const click = (selector, dataset = {}) => ui.listeners.click({
    stopPropagation() {}, target: { closest: s => s === selector ? { dataset } : null },
  });
  ui.api.render();
  assert.match(ui.root.innerHTML, /class="title-progress" aria-label="0% afgerond">0%/);
  assert.match(ui.root.innerHTML, /<span class="set-counter">0%<\/span>/);
  assert.match(ui.root.innerHTML, /data-lucide="chevron-down"/);
  click('[data-rehab-toggle]', { rehabToggle: 'ski' });
  assert.match(ui.root.innerHTML, /data-lucide="chevron-up"/);
  assert.match(ui.root.innerHTML, /id="rehab-week-2-day-1-ski">/);
  click('[data-rehab-done]', { rehabDone: 'ski' });
  assert.equal(ui.saves(), 1);
  assert.equal(ui.flushes(), 1);
  assert.match(ui.root.innerHTML, /aria-label="17% afgerond">17%/);
  click('[data-rehab-complete]');
  assert.equal(ui.saves(), 2);
  assert.equal(ui.flushes(), 2);
  assert.match(ui.root.innerHTML, /aria-label="100% afgerond">100%/);
  assert.match(ui.root.innerHTML, /aria-label="Dag 1, afgerond"/);
  assert.match(ui.root.innerHTML, /data-rehab-complete disabled/);
  assert.match(ui.root.innerHTML, /data-rehab-reopen>Dag opnieuw openen/);
  click('[data-rehab-reopen]');
  assert.equal(ui.api.dayProgress(ui.state, 'week-2', 'day-1').percent, 0);
  assert.equal(ui.flushes(), 3);
  assert.match(ui.root.innerHTML, /data-rehab-reopen hidden/);
});

for (const clipboardFails of [false, true]) {
  test(`week copy ${clipboardFails ? 'offers selected text when clipboard permission fails' : 'copies the full week and confirms success'}`, async () => {
    const ui = mounted({ clipboardFails });
    ui.listeners.click({ stopPropagation() {}, target: { closest: selector => selector === '[data-rehab-copy]' ? {} : null } });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(ui.flushes(), 1);
    const text = ui.api.weekText(ui.state, 'week-2');
    if (clipboardFails) {
      assert.equal(ui.preview.open, true);
      assert.equal(ui.field.value, text);
      assert.deepEqual(ui.field.range, [0, text.length]);
      assert.match(ui.status.textContent, /tekstmenu/);
      assert.equal(ui.copied.length, 0);
    } else {
      assert.deepEqual(ui.copied, [text]);
      assert.match(ui.status.textContent, /Gekopieerd/);
    }
  });
}

test('Jochem has neither the rehab navigation nor the rehab view', () => {
  let removed = 0;
  const elements = [{ remove() { removed++; } }, { remove() { removed++; } }];
  const { api } = load({ document: { querySelectorAll: () => elements } });
  api.mount({ enabled: false });
  api.render();
  assert.equal(removed, 2);
});

test('rehab-only input is meaningful to existing cloud selection and is included in local backup state', () => {
  const storage = new Map();
  const { context } = load({
    URLSearchParams, Date, structuredClone, setTimeout, clearTimeout,
    location: { search: '', hash: '', pathname: '/index.html' },
    document: { addEventListener() {} },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  });
  vm.runInContext(read('app.js') + '\nsyncViewFromHash = () => {}; ensureDefaults();', context);
  assert.equal(vm.runInContext('stateHasMeaningfulData(state)', context), false);
  vm.runInContext('window.Rehab.setNote(state, "week-1", "day-1", "ski", "Bewaarde opmerking"); saveState(); flushStateSave();', context);
  assert.equal(vm.runInContext('stateHasMeaningfulData(state)', context), true);
  const saved = JSON.parse(storage.get('herpakkingsseason.tracker.v1'));
  assert.equal(saved.rehab.weeks['week-1']['day-1'].ski, 'Bewaarde opmerking');
  assert.ok(saved.updatedAt);
  vm.runInContext('state.rehab = {}; window.Rehab.setDayComplete(state, "week-2", "day-1", true); saveState(); flushStateSave();', context);
  assert.equal(vm.runInContext('stateHasMeaningfulData(state)', context), true);
  assert.equal(JSON.parse(storage.get('herpakkingsseason.tracker.v1')).rehab.progress['week-2']['day-1'].ski, true);
  vm.runInContext('window.Rehab.setDayComplete(state, "week-2", "day-1", false); saveState(); flushStateSave();', context);
  assert.equal(vm.runInContext('stateHasMeaningfulData(state)', context), true);
  assert.equal(JSON.parse(storage.get('herpakkingsseason.tracker.v1')).rehab.progress['week-2']['day-1'].ski, false);
});

test('rehab files are in the offline cache and only owner HTML elements opt into the view', () => {
  const html = read('index.html');
  for (const name of ['rehab-plan.js', 'rehab.js', 'rehab.css']) assert.ok(read('sw.js').includes(name));
  assert.match(html, /data-view="rehab" data-rehab-owner[^>]+hidden/);
  assert.match(html, /data-view-link="rehab" data-rehab-owner hidden/);
  assert.match(read('app.js'), /Rehab\?\.mount\(\{ enabled: !USER_PROFILE/);
});
