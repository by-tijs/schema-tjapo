import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Installation metadata must identify Jochem in the initial HTML, before JS runs.
export function jochemPage(html) {
  return html
    .replace('<title>Schema Tjapo</title>', '<title>Schema Jochem</title>')
    .replace('name="apple-mobile-web-app-title" content="Schema Tjapo"', 'name="apple-mobile-web-app-title" content="Schema Jochem"')
    .replace('href="manifest.webmanifest?', 'href="manifest-jochem.webmanifest?');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL('../jochem.html', import.meta.url),
    jochemPage(readFileSync(new URL('../index.html', import.meta.url), 'utf8')));
}
