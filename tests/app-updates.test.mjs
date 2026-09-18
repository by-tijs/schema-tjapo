import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../app-updates.js', import.meta.url), 'utf8');

async function app(options = {}) {
  const events = {};
  const calls = [];
  const status = {};
  const banner = { hidden: true };
  const button = { addEventListener(type, fn) { this[type] = fn; } };
  const release = { version: '200', ...options.release };
  let now = 1000000;
  let offline = false;
  const context = vm.createContext({
    window: { addEventListener(type, fn) { events[type] = fn; } },
    document: {
      visibilityState: 'visible',
      getElementById: id => id === 'app-update-banner' ? banner : status,
      querySelectorAll: () => [button],
      addEventListener(type, fn) { events[type] = fn; },
    },
    location: {
      href: options.url || 'https://example.test/index.html?profiel=jochem&v=199#train',
      replace(url) { calls.push(['navigate', url]); },
      reload() { calls.push(['reload']); },
    },
    Date: { now: () => now }, URL, AbortController,
    setTimeout: () => 1, clearTimeout() {}, setInterval() {},
    fetch: async (url, init) => {
      calls.push(['fetch', String(url), init.cache]);
      if (offline) throw new Error('offline');
      return { ok: true, json: async () => release };
    },
    save() {
      calls.push(['save']);
      if (options.saveFails) throw new Error('quota exceeded');
    },
  });
  vm.runInContext(source, context);
  vm.runInContext(`window.AppUpdates.init({ version: '200', profile: 'Jochem', save });`, context);
  const settle = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
  await settle();
  return { events, calls, banner, status, button, release, settle,
    advance() { now += 61000; }, offline(value = true) { offline = value; } };
}

test('resumed home-screen app detects a release without navigating or saving during training', async () => {
  const a = await app();
  assert.equal(a.banner.hidden, true);
  a.release.version = '201';
  a.advance();
  a.events.visibilitychange();
  await a.settle();
  assert.equal(a.banner.hidden, false);
  assert.match(a.status.textContent, /Schema Jochem · versie 200 · update beschikbaar/);
  assert.ok(a.calls.every(c => c[0] === 'fetch'));
  assert.equal(a.calls.at(-1)[2], 'no-store');
});

test('update saves before navigating and preserves profile, path and current view', async () => {
  const a = await app({ release: { version: '201' } });
  await a.button.click();
  assert.deepEqual(a.calls.slice(-2), [
    ['save'], ['navigate', 'https://example.test/index.html?profiel=jochem&v=201#train'],
  ]);
});

test('owner update retains owner URL and statistics view', async () => {
  const a = await app({ url: 'https://example.test/index.html#stats' });
  await a.button.click();
  assert.equal(a.calls.at(-1)[1], 'https://example.test/index.html?v=200#stats');
});

test('updating an already current URL performs a real reload', async () => {
  const a = await app({ url: 'https://example.test/index.html?profiel=jochem&v=200#stats' });
  await a.button.click();
  assert.deepEqual(a.calls.slice(-2), [['save'], ['reload']]);
});

test('failed local save never reloads or loses the open workout', async () => {
  const a = await app({ saveFails: true });
  await a.button.click();
  assert.equal(a.calls.at(-1)[0], 'save');
  assert.match(a.status.textContent, /opslaan lukt niet/);
  assert.equal(a.button.disabled, false);
});

test('offline update leaves the app open and retries when connection returns', async () => {
  const a = await app();
  a.offline();
  await a.button.click();
  assert.ok(a.calls.every(c => c[0] === 'fetch'));
  assert.match(a.status.textContent, /bijwerken lukt nu niet/);
  assert.equal(a.button.disabled, false);
  a.offline(false);
  a.release.version = '201';
  a.events.online();
  await a.settle();
  assert.equal(a.banner.hidden, false);
});

test('version check bypasses service-worker caches', async () => {
  const handlers = {};
  const calls = [];
  let result;
  vm.runInNewContext(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), {
    self: { addEventListener: (type, fn) => { handlers[type] = fn; } }, URL,
    fetch(request, options) { calls.push([request.url, options.cache]); return Promise.resolve('fresh'); },
    caches: { match() { throw new Error('Must not read cached release'); } },
  });
  handlers.fetch({
    request: { method: 'GET', url: 'https://example.test/app-version.json?t=123' },
    respondWith(promise) { result = promise; },
  });
  assert.equal(await result, 'fresh');
  assert.deepEqual(calls, [['https://example.test/app-version.json?t=123', 'no-store']]);
});

test('published release metadata and HTML assets match the app version', () => {
  const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
  const version = read('app.js').match(/const APP_VERSION = "(\d+)"/)[1];
  assert.equal(JSON.parse(read('app-version.json')).version, version);
  for (const file of ['index.html', 'sw.js', 'manifest.webmanifest', 'manifest-jochem.webmanifest']) {
    for (const match of read(file).matchAll(/\?v=(\d+)/g)) assert.equal(match[1], version, file);
  }
  assert.ok(read('sw.js').includes(`app-updates.js?v=${version}`));
});
