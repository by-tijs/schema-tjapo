import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// npm install --prefix /tmp/schema-icons-build --ignore-scripts lucide@1.69.0 esbuild@0.25.12
// node scripts/build-icons.mjs /tmp/schema-icons-build
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = resolve(process.argv[2] || '/tmp/schema-icons-build');
const require = createRequire(resolve(buildDir, 'package.json'));
const { build } = require('esbuild');
const names = new Set(['chevron-up', 'chevron-down', 'play', 'pause']);
for (const file of ['index.html', 'app.js', 'plan-editor.js', 'rehab.js']) {
  const source = readFileSync(resolve(root, file), 'utf8');
  for (const match of source.matchAll(/data-lucide="([a-z][a-z0-9-]*)"/g)) names.add(match[1]);
  for (const match of source.matchAll(/button\("[^"]+", "([a-z-]+)"/g)) names.add(match[1]);
}
const icons = [...names].sort().map(name => name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join(''));
await build({
  stdin: { contents: `import {createIcons,${icons.join(',')}} from 'lucide'; const icons={${icons.join(',')}}; window.lucide={icons,createIcons:(options={})=>createIcons({...options,icons})};`, resolveDir: buildDir },
  bundle: true, minify: true, format: 'iife', target: ['es2020'],
  outfile: resolve(root, 'vendor/lucide-schema-1.69.0.min.js'),
  banner: {js: '/*! Lucide v1.69.0 - ISC. Same original icons, bundled for Schema Tjapo. See lucide-LICENSE. */'},
});
console.log(`${icons.length} icons bundled`);
