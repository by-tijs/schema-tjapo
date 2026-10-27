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
  assert.equal(weeks.length, 2);
  for (const week of weeks) {
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

test('copy text includes every day and exercise with notes, and omits prescribed sets and weights', () => {
  const { api, weeks } = load();
  const state = {};
  api.setNote(state, 'week-1', 'day-1', 'seated-russian-twist', '  Rustig uitgevoerd.\nTweede ronde ging beter.  ');
  api.setNote(state, 'week-2', 'day-1', 'seated-russian-twist', 'Andere week');
  const text = api.weekText(state, 'week-1');
  assert.ok(text.startsWith('Rehab Tijs — Week 1\n\nDag 1'));
  assert.ok(text.includes('Seated russian twist\nRustig uitgevoerd.\nTweede ronde ging beter.'));
  assert.equal((text.match(/Geen opmerkingen/g) || []).length, 21);
  for (const day of weeks[0].days) {
    assert.ok(text.includes(day.label));
    for (const exercise of day.exercises) {
      assert.ok(text.includes(exercise.name));
      assert.ok(!text.includes(exercise.prescription));
    }
  }
  assert.ok(!text.includes('Andere week'));
  assert.equal(api.weekText(state, 'missing'), '');
});

test('blank comments produce Geen opmerkingen and empty preferences do not count as personal data', () => {
  const { api } = load();
  const state = { rehab: { selectedWeek: 'week-2' } };
  assert.equal(api.hasNotes(state), false);
  api.setNote(state, 'week-1', 'day-1', 'ski', '   \n');
  assert.equal(api.hasNotes(state), false);
  assert.match(api.weekText(state, 'week-1'), /Ski\nGeen opmerkingen/);
  api.setNote(state, 'week-1', 'day-1', 'ski', 'Wel een opmerking');
  assert.equal(api.hasNotes(state), true);
  api.setNote(state, 'week-1', 'day-1', 'ski', '');
  assert.equal(api.getNote(JSON.parse(JSON.stringify(state)), 'week-1', 'day-1', 'ski'), '');
});

function mounted({ clipboardFails = false, state = {} } = {}) {
  const listeners = {};
  const status = { textContent: '' };
  const preview = { open: false };
  const field = { value: '', focus() { this.focused = true; }, select() { this.selected = true; }, setSelectionRange(a, b) { this.range = [a, b]; } };
  const elements = { '.rehab-copy-status': status, '.rehab-preview': preview, '[data-rehab-text]': field };
  const root = { innerHTML: '', querySelector: s => elements[s], querySelectorAll: () => [], addEventListener: (name, fn) => { listeners[name] = fn; } };
  const nav = { style: { setProperty() {} } };
  const copied = [];
  let flushes = 0;
  let saves = 0;
  const loaded = load({
    document: { querySelector: s => s === '.view-tabs' ? nav : root, querySelectorAll: () => [] },
    navigator: { clipboard: { writeText: async text => { if (clipboardFails) throw new Error('Denied'); copied.push(text); } } },
  });
  loaded.api.mount({ enabled: true, getState: () => state, save: () => { saves++; }, flush: () => { flushes++; }, refreshIcons() {} });
  return { ...loaded, state, listeners, root, status, preview, field, copied, saves: () => saves, flushes: () => flushes };
}

test('note entry saves immediately, escapes HTML in the form, and refreshes the full-week preview', () => {
  const ui = mounted();
  const note = '<script>alert("test")</script>\nRustig & goed';
  const input = { matches: () => true, dataset: { rehabNote: 'ski' }, value: note, style: {}, scrollHeight: 80 };
  ui.listeners.input({ target: input });
  assert.equal(ui.saves(), 1);
  assert.equal(ui.api.getNote(ui.state, 'week-1', 'day-1', 'ski'), note);
  assert.ok(ui.field.value.includes(note));
  ui.api.render();
  assert.ok(!ui.root.innerHTML.includes('<script>'));
  assert.ok(ui.root.innerHTML.includes('&lt;script&gt;'));
  assert.equal(input.style.height, '80px');
});

for (const clipboardFails of [false, true]) {
  test(`week copy ${clipboardFails ? 'offers selected text when clipboard permission fails' : 'copies the full week and confirms success'}`, async () => {
    const ui = mounted({ clipboardFails });
    ui.listeners.click({ stopPropagation() {}, target: { closest: selector => selector === '[data-rehab-copy]' ? {} : null } });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(ui.flushes(), 1);
    const text = ui.api.weekText(ui.state, 'week-1');
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
});

test('rehab files are in the offline cache and only owner HTML elements opt into the view', () => {
  const html = read('index.html');
  for (const name of ['rehab-plan.js', 'rehab.js', 'rehab.css']) assert.ok(read('sw.js').includes(name));
  assert.match(html, /data-view="rehab" data-rehab-owner[^>]+hidden/);
  assert.match(html, /data-view-link="rehab" data-rehab-owner hidden/);
  assert.match(read('app.js'), /Rehab\?\.mount\(\{ enabled: !USER_PROFILE/);
});
