import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { jochemPage } from '../scripts/generate-jochem-page.mjs';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('iPhone receives Jochem installation metadata before any JavaScript runs', () => {
  const html = read('jochem.html');
  assert.equal(html, jochemPage(read('index.html')));
  assert.match(html, /<title>Schema Jochem<\/title>/);
  assert.match(html, /rel="manifest" href="manifest-jochem\.webmanifest\?v=\d+"/);
  assert.match(html, /name="apple-mobile-web-app-title" content="Schema Jochem"/);
  assert.match(read('index.html'), /rel="manifest" href="manifest\.webmanifest/);
});

test('existing Jochem links redirect to his fixed entry page, owner links stay unchanged', () => {
  const config = JSON.parse(read('vercel.json'));
  assert.deepEqual(config.redirects.map(route => route.source), ['/index.html', '/']);
  for (const route of config.redirects) {
    assert.deepEqual(route.has, [{ type: 'query', key: 'profiel', value: 'jochem' }]);
    assert.equal(route.destination, '/jochem.html');
    assert.equal(route.permanent, false);
  }
});

for (const [path, cacheKey] of [
  ['/jochem.html', './jochem.html'],
  ['/index.html?profiel=jochem', './jochem.html'],
  ['/?profiel=jochem', './jochem.html'],
  ['/index.html', './index.html'],
  ['/', './index.html'],
]) {
  test(`offline launch ${path} uses the matching profile page`, async () => {
    const handlers = {};
    const matches = [];
    let result;
    vm.runInNewContext(read('sw.js'), {
      self: { addEventListener: (event, fn) => { handlers[event] = fn; } }, URL,
      fetch: async () => { throw new Error('offline'); },
      caches: { match: async key => { matches.push(key); return 'cached profile'; } },
    });
    handlers.fetch({
      request: { method: 'GET', url: 'https://example.test' + path, mode: 'navigate' },
      respondWith(promise) { result = promise; },
    });
    assert.equal(await result, 'cached profile');
    assert.deepEqual(matches, [cacheKey]);
  });
}

test('online Jochem navigation cannot overwrite the owner offline page', async () => {
  const handlers = {};
  const writes = [];
  let result;
  vm.runInNewContext(read('sw.js'), {
    self: { addEventListener: (event, fn) => { handlers[event] = fn; } }, URL,
    fetch: async () => ({ ok: true, clone: () => 'jochem HTML' }),
    caches: { open: async () => ({ put: async (key, value) => { writes.push([key, value]); } }) },
  });
  handlers.fetch({
    request: { method: 'GET', url: 'https://example.test/index.html?profiel=jochem', mode: 'navigate' },
    respondWith(promise) { result = promise; },
  });
  await result;
  await Promise.resolve();
  assert.deepEqual(writes, [['./jochem.html', 'jochem HTML']]);
});
