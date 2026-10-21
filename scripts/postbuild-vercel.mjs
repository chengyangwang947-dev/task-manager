#!/usr/bin/env node
/**
 * Post-build step for standalone (Vercel / static host) deployment.
 *
 * The app was scaffolded with a platform-specific preset that injects
 * `{{...}}` template placeholders into the built index.html (window.appId,
 * userId, basename, etc.). Those are only meaningful on the platform that
 * hosts the app; for a standalone static deploy we replace them with safe
 * defaults so the SPA renders and routes correctly on its own.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'dist', 'client', 'index.html');

if (!fs.existsSync(INDEX)) {
  console.error(`[postbuild-vercel] index.html not found: ${INDEX}`);
  process.exit(1);
}

let html = fs.readFileSync(INDEX, 'utf8');
const before = html;

// Map each platform-injected token to its safe default. These replace the
// FULL `"{{token}}"` (including the surrounding quotes) so the resulting
// JS stays valid.
const tokenDefaults = {
  appId: '""',
  appName: '""',
  appAvatar: '""',
  appDescription: '""',
  userId: '""',
  tenantId: '""',
  csrfToken: '""',
  userName: '""',
  environment: '"production"',
  basename: '"/"',
};

// 1) Replace the triple-brace and double-brace forms with surrounding quotes.
for (const [token, value] of Object.entries(tokenDefaults)) {
  html = html.split(`"{{{${token}}}}"`).join(value);
  html = html.split(`"{{${token}}}"`).join(value);
}

// 2) Any leftover bare `{{...}}`/`{{{...}}}` token (no surrounding quotes, e.g.
//    in `<title>`) → collapse to an empty string so nothing leaks literally.
html = html.replace(/\{\{+\s*\w+\s*\}\}+/g, '');

if (html === before) {
  console.log('[postbuild-vercel] no placeholders found, index.html unchanged');
} else {
  fs.writeFileSync(INDEX, html, 'utf8');
  const left = (html.match(/\{\{+\s*\w+\s*\}\}+/g) || []).length;
  console.log(`[postbuild-vercel] neutralized platform placeholders. Remaining tokens: ${left}`);
}
