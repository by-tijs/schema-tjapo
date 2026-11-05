import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { jochemPage, joepPage } from '../scripts/generate-jochem-page.mjs';

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
  const routes = config.redirects.filter(route => route.has[0].value === "jochem");
  assert.deepEqual(routes.map(route => route.source), ['/index.html', '/']);
  for (const route of routes) {
    assert.deepEqual(route.has, [{ type: 'query', key: 'profiel', value: 'jochem' }]);
    assert.equal(route.destination, '/jochem.html');
    assert.equal(route.permanent, false);
  }
});

for (const [path, cacheKey] of [
  ['/jochem.html', './jochem.html'],
  ['/joep.html', './joep.html'],
  ['/?profiel=joep', './joep.html'],
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
      caches: { open: async () => ({match: async key => { matches.push(key); return 'cached profile'; }}) },
    });
    handlers.fetch({
      request: { method: 'GET', url: 'https://example.test' + path, mode: 'navigate' },
      respondWith(promise) { result = promise; },
      waitUntil() {},
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
    caches: { open: async () => ({match:async()=>null, put: async (key, value) => { writes.push([key, value]); } }) },
  });
  handlers.fetch({
    request: { method: 'GET', url: 'https://example.test/index.html?profiel=jochem', mode: 'navigate' },
    respondWith(promise) { result = promise; },
    waitUntil() {},
  });
  await result;
  await Promise.resolve();
  assert.deepEqual(writes, [['./jochem.html', 'jochem HTML']]);
});

test('cached startup is immediate even while the network is stalled', async () => {
  const handlers={},writes=[];let response,background,release;
  vm.runInNewContext(read('sw.js'),{
    self:{addEventListener:(event,fn)=>handlers[event]=fn},URL,
    fetch:()=>new Promise(resolve=>release=resolve),
    caches:{open:async()=>({match:async()=> 'cached shell',put:async(key,value)=>writes.push([key,value])})},
  });
  handlers.fetch({request:{method:'GET',url:'https://example.test/joep.html',mode:'navigate'},
    respondWith(p){response=p;},waitUntil(p){background=p;}});
  assert.equal(await response,'cached shell');
  assert.equal(writes.length,0);
  release({ok:true,clone:()=> 'new shell'});await background;
  assert.deepEqual(writes,[['./joep.html','new shell']]);
});

test('an explicit newer-version update fetches fresh HTML instead of returning the old shell', async () => {
  const handlers={};let response;
  vm.runInNewContext(read('sw.js'),{
    self:{addEventListener:(event,fn)=>handlers[event]=fn},URL,
    fetch:async()=>({ok:true,html:'fresh shell',clone:()=> 'fresh shell'}),
    caches:{open:async()=>({match:async()=> 'old shell',put:async()=>{}})},
  });
  handlers.fetch({request:{method:'GET',url:'https://example.test/joep.html?v=999',mode:'navigate'},
    respondWith(p){response=p;},waitUntil(){}});
  assert.equal((await response).html,'fresh shell');
});

test('Joep has an independent installation page and keeps its identity offline', () => {
  assert.equal(read('joep.html'), joepPage(read('index.html')));
  const manifest = JSON.parse(read('manifest-joep.webmanifest'));
  assert.equal(manifest.start_url, './joep.html');
  assert.equal(manifest.id, './joep.html');
  assert.match(read('joep.html'), /value="joep" readonly/);
});
