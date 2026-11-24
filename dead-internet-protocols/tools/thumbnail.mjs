// Renders output/thumbnail.png (1080x1920, Shorts) and output/thumbnail_landscape.png (1280x720)
// from tools/thumbnail.html over clean plates rendered by the film engine (render.mjs --clean).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/')('playwright')); }
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.woff2': 'font/woff2', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 2700 } });
await p.goto(`http://127.0.0.1:${srv.address().port}/tools/thumbnail.html`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
await (await p.$('#v')).screenshot({ path: path.join(ROOT, 'output/thumbnail.png') });
await (await p.$('#h')).screenshot({ path: path.join(ROOT, 'output/thumbnail_landscape.png') });
await b.close(); srv.close(); console.log('thumbnails written');
