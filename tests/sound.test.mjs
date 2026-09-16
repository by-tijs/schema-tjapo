import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const ownerKey = 'herpakkingsseason.tracker.v1';
const jochemKey = ownerKey + ':user:4XLfELa1AoeC4tcqBdW3e4Bz29o1';

function app(search = '', storage = new Map(), options = {}) {
  const calls = { contexts: 0, plays: 0, loads: 0, starts: 0, stops: 0, closes: 0, resumes: 0, fetches: 0 };
  const pending = [];
  const timeouts = new Map();
  let timerId = 0;
  function media(src) {
    const attributes = new Map();
    return {
      dataset: { src }, paused: true, muted: true, loop: false, currentTime: 0,
      setAttribute: (key, value) => attributes.set(key, value),
      getAttribute: key => attributes.get(key) ?? null,
      hasAttribute: key => attributes.has(key), removeAttribute: key => attributes.delete(key),
      load() { calls.loads++; }, pause() { this.paused = true; },
      play() {
        calls.plays++;
        this.paused = false;
        return options.deferPlay ? new Promise(resolve => pending.push(resolve)) : Promise.resolve();
      },
    };
  }
  class AudioContext {
    constructor() { calls.contexts++; this.state = options.suspended ? 'suspended' : 'running'; this.destination = {}; }
    close() { calls.closes++; this.state = 'closed'; return Promise.resolve(); }
    resume() {
      calls.resumes++;
      const finish = () => { if (this.state !== 'closed') this.state = 'running'; };
      return options.deferResume ? new Promise(resolve => pending.push(() => { finish(); resolve(); })) : Promise.resolve(finish());
    }
    decodeAudioData() { return Promise.resolve({}); }
    createBuffer() { return {}; }
    createBufferSource() {
      return { connect() { return this; }, disconnect() {}, start() { calls.starts++; }, stop() { calls.stops++; } };
    }
    createGain() { return { gain: { setValueAtTime() {} }, connect() { return this; }, disconnect() {} }; }
  }
  const context = vm.createContext({
    URLSearchParams, Date, structuredClone,
    setTimeout: fn => { const id = ++timerId; timeouts.set(id, fn); return id; },
    clearTimeout: id => timeouts.delete(id), setInterval: () => ++timerId, clearInterval() {},
    requestAnimationFrame: fn => fn(), navigator: { vibrate() {} },
    location: { search, hash: '' }, document: { addEventListener() {} },
    window: { AudioContext: options.mediaOnly ? undefined : AudioContext },
    fetch: () => { calls.fetches++; return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) }); },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    media,
  });
  vm.runInContext(source + `
    syncViewFromHash = renderRestTimer = showToast = () => {};
    profileAccount = { authenticated: true, markEdited() {}, queueSave() {} };
    state = loadState(); ensureDefaults();
    els.restAlarmAudio = media('rest-alarm.mp3');
    els.sideAlarmAudio = media('side-alarm.mp3');
    els.restAlarm = { hidden: true, dataset: {}, classList: { add() {}, remove() {} }, querySelector() {} };
    els.restAlarmTitle = {}; els.restAlarmActionLabel = {};
    els.soundToggle = { setAttribute(name, value) { this[name] = value; } };
    els.soundToggleLabel = {};
    renderSoundSetting();
  `, context);
  return {
    calls, storage, run: code => vm.runInContext(code, context),
    async settle() {
      pending.splice(0).forEach(resolve => resolve());
      for (let i = 0; i < 20; i++) await Promise.resolve();
      for (const [id, fn] of [...timeouts]) { timeouts.delete(id); fn(); }
      for (let i = 0; i < 20; i++) await Promise.resolve();
    },
  };
}

for (const [name, search, key] of [['Tijs', '', ownerKey], ['Jochem', '?profiel=jochem', jochemKey]]) {
  test(`${name}: existing account defaults to off, with silent gestures, timers and recovery`, () => {
    const original = { history: [{ id: 'kept', date: '2026-09-10' }], bodyweight: '81' };
    const a = app(search, new Map([[key, JSON.stringify(original)]]));
    assert.equal(a.run('state.soundEnabled'), false);
    assert.equal(a.run('els.soundToggle["aria-checked"]'), 'false');
    a.run('unlockRestTimerAudio(); recoverRestTimerAudio(); startRestTimer(30, "side"); finishRestTimer();');
    assert.equal(a.run('els.restAlarm.hidden'), false);
    assert.equal(a.run('els.restAlarmTitle.textContent'), 'Andere kant.');
    a.run('stopRestTimer(); startRestTimer(180, "set"); finishRestTimer(); recoverRestTimerAudio();');
    assert.equal(a.run('els.restAlarmTitle.textContent'), 'Volgende set.');
    a.run('playRestTimerMediaAlarm(); startRestTimerBufferAlarm({}); startRestTimerFallbackAlarm(); playRestTimerFallbackSound();');
    assert.equal(a.calls.contexts + a.calls.plays + a.calls.loads + a.calls.starts + a.calls.resumes + a.calls.fetches, 0);
    assert.equal(a.run('state.history[0].id'), 'kept');
    assert.equal(a.run('state.bodyweight'), '81');
  });

  test(`${name}: explicit choice is saved separately and restored after reopening`, () => {
    const storage = new Map();
    const a = app(search, storage);
    a.run('toggleSound()');
    assert.equal(JSON.parse(storage.get(key)).soundEnabled, true);
    assert.equal(app(search, storage).run('isSoundEnabled()'), true);
    assert.equal(app(search ? '' : '?profiel=jochem', storage).run('isSoundEnabled()'), false);
    a.run('toggleSound()');
    assert.equal(app(search, storage).run('isSoundEnabled()'), false);
    assert.equal(a.run('els.soundToggleLabel.textContent'), 'Uit');
  });
}

test('Turning sound off stops an active alarm and closes audio without hiding its visual reminder', async () => {
  const a = app();
  a.run('state.soundEnabled = true; prepareRestTimerAudio();');
  await a.settle();
  a.run('startRestTimer(30); finishRestTimer();');
  assert.equal(a.run('els.restAlarm.dataset.playback'), 'webaudio');
  assert.ok(a.calls.starts > 0);
  a.run('toggleSound()');
  assert.equal(a.calls.stops, 1);
  assert.equal(a.calls.closes, 1);
  assert.equal(a.run('restTimer.audioContext'), null);
  assert.equal(a.run('els.restAlarm.hidden'), false);
  assert.equal(a.run('restTimer.status'), 'done');
  assert.equal(a.run('els.restAlarmAudio.getAttribute("src")'), null);
});

test('Muted timers keep counting; applying an older cloud state also shuts down sound', () => {
  const a = app();
  a.run('toggleSound(); startRestTimer(180); toggleSound();');
  assert.equal(a.run('restTimer.status'), 'running');
  assert.equal(a.run('restTimer.remainingSeconds'), 180);
  a.run('toggleSound(); delete state.soundEnabled; ensureDefaults();');
  assert.equal(a.run('isSoundEnabled()'), false);
  assert.equal(a.run('restTimer.audioContext'), null);
});

test('Delayed media priming cannot restore audio sources after muting', async () => {
  const a = app('', new Map(), { deferPlay: true });
  a.run('toggleSound(); toggleSound();');
  const loads = a.calls.loads;
  await a.settle();
  assert.equal(a.calls.loads, loads);
  assert.equal(a.run('els.restAlarmAudio.getAttribute("src")'), null);
  assert.equal(a.run('els.restAlarmAudio.muted'), true);
});

test('A delayed context resume cannot start an alarm or fallback after muting', async () => {
  const a = app('', new Map(), { suspended: true, deferResume: true });
  a.run('state.soundEnabled = true; startRestTimer(30); finishRestTimer(); startRestTimerFallbackAlarm(); toggleSound();');
  await a.settle();
  assert.equal(a.calls.starts + a.calls.plays, 0);
  assert.equal(a.run('restTimer.alarmPlaybackPending'), false);
  assert.equal(a.run('restTimer.alarmFallbackActive'), false);
});

test('HTML audio fallback still plays when enabled and stops when muted', async () => {
  const a = app('', new Map(), { mediaOnly: true, deferPlay: true });
  a.run('state.soundEnabled = true; startRestTimer(30, "side"); finishRestTimer();');
  assert.equal(a.calls.plays, 1);
  a.run('toggleSound()');
  await a.settle();
  assert.equal(a.run('els.sideAlarmAudio.paused'), true);
  assert.equal(a.run('els.sideAlarmAudio.muted'), true);
  assert.equal(a.run('restTimer.alarmFallbackActive'), false);
});
