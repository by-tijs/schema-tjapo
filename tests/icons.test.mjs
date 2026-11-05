import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('the compact bundle preserves every original SVG used by the app', () => {
  const full = vm.createContext({});
  const small = vm.createContext({window:{}});
  const read = file => readFileSync(new URL('../'+file, import.meta.url),'utf8');
  vm.runInContext(read('vendor/lucide-1.69.0.min.js'), full);
  vm.runInContext(read('vendor/lucide-schema-1.69.0.min.js'), small);
  const names = new Set(['x','chevron-up','chevron-down','play','pause']);
  for (const file of ['index.html','app.js','plan-editor.js','rehab.js']) {
    for (const match of read(file).matchAll(/data-lucide="([a-z0-9-]+)"/g)) names.add(match[1]);
  }
  for (const name of names) {
    const key = name.split('-').map(part=>part[0].toUpperCase()+part.slice(1)).join('');
    assert.ok(small.window.lucide.icons[key], `Missing icon ${name}`);
  }
  for (const [key,icon] of Object.entries(small.window.lucide.icons)) {
    assert.equal(JSON.stringify(icon),JSON.stringify(full.lucide.icons[key]),key);
  }
  assert.ok(read('vendor/lucide-schema-1.69.0.min.js').length < 10000);
});
