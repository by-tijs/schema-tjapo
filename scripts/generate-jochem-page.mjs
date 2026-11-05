import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Profile metadata is present before JavaScript runs, including iPhone installation.
export function profilePage(html, id, name) {
  return html
    .replace('<title>Schema Tjapo</title>', `<title>Schema ${name}</title>`)
    .replace('name="apple-mobile-web-app-title" content="Schema Tjapo"', `name="apple-mobile-web-app-title" content="Schema ${name}"`)
    .replace('href="manifest.webmanifest?', `href="manifest-${id}.webmanifest?`)
    .replace('autocomplete="username" value="" readonly', `autocomplete="username" value="${id}" readonly`);
}
export const jochemPage = (html) => profilePage(html, 'jochem', 'Jochem');
export const joepPage = (html) => profilePage(html, 'joep', 'Joep');

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  writeFileSync(new URL('../jochem.html', import.meta.url), jochemPage(html));
  writeFileSync(new URL('../joep.html', import.meta.url), joepPage(html));
}
