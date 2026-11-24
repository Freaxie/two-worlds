#!/usr/bin/env node
// Deterministic frame renderer: serves the project, drives headless Chromium (WebGL via
// SwiftShader) and captures every frame as JPEG. Usage:
//   node render/render.mjs --preview 0,120,600      -> output/preview/fXXXXX.png
//   node render/render.mjs --all --workers 3        -> build/frames/XXXXXX.jpg
//   node render/render.mjs --range 600:900          -> subset of build/frames
//   node render/render.mjs --meta                   -> film/data/events.json + output/final_short.srt
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/')('playwright')); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const f = path.join(ROOT, u);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function openFilm(port) {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${port}/film/index.html`);
  await page.waitForFunction(() => window.__film, null, { timeout: 60000 });
  const info = await page.evaluate(() => window.__film.setup());
  if (has('--clean')) await page.evaluate(() => window.__film.setOpts({ clean: true }));
  if (errors.length) console.error('page errors:', errors.join('\n'));
  return { browser, page, info, errors };
}

async function renderFrames(port, frames, outDir, fmt = 'jpg', tag = '') {
  const { browser, page, errors } = await openFilm(port);
  let n = 0; const t0 = Date.now();
  for (const f of frames) {
    const data = await page.evaluate(([f, fmt]) => { window.__film.renderFrame(f); return window.__film.world.renderer.domElement.toDataURL(fmt === 'png' ? 'image/png' : 'image/jpeg', 0.95); }, [f, fmt]);
    const buf = Buffer.from(data.split(',')[1], 'base64');
    const name = fmt === 'png' ? `f${String(f).padStart(5, '0')}.png` : `${String(f).padStart(6, '0')}.jpg`;
    fs.writeFileSync(path.join(outDir, name), buf);
    n++;
    if (n % 60 === 0) { const el = (Date.now() - t0) / 1000; console.log(`${tag} ${n}/${frames.length} frames, ${(el / n).toFixed(3)} s/frame`); }
    if (errors.length) { console.error(errors.join('\n')); errors.length = 0; }
  }
  await browser.close();
}

const srv = await serve();
const port = srv.address().port;
try {
  if (has('--meta')) {
    const { browser, page } = await openFilm(port);
    const meta = await page.evaluate(() => ({ events: window.__film.events(), cues: window.__film.cues(), tl: window.__film.world.tl }));
    fs.writeFileSync(path.join(ROOT, 'film/data/events.json'), JSON.stringify({ duration: meta.tl.duration, cuts: meta.tl.cuts, events: meta.events }, null, 1));
    const ts = (s) => { const ms = Math.max(0, Math.round(s * 1000)); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
    const srt = meta.cues.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`).join('\n');
    fs.mkdirSync(path.join(ROOT, 'output'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'output/final_short.srt'), srt);
    console.log(`events: ${meta.events.length}, cues: ${meta.cues.length}`);
    await browser.close();
  } else if (opt('--preview')) {
    const frames = opt('--preview').split(',').map(Number);
    const out = path.join(ROOT, opt('--out', 'output/preview'));
    fs.mkdirSync(out, { recursive: true });
    await renderFrames(port, frames, out, 'png');
    console.log('preview written to', out);
  } else {
    const { browser, info } = await openFilm(port);
    await browser.close();
    const total = info.frames;
    let a = 0, b = total;
    if (opt('--range')) [a, b] = opt('--range').split(':').map(Number);
    const out = path.join(ROOT, opt('--out', 'build/frames'));
    fs.mkdirSync(out, { recursive: true });
    const all = [];
    for (let f = a; f < Math.min(b, total); f++) if (has('--force') || !fs.existsSync(path.join(out, `${String(f).padStart(6, '0')}.jpg`))) all.push(f);
    const workers = Number(opt('--workers', 3));
    console.log(`rendering ${all.length} frames (${a}..${b}) with ${workers} workers -> ${out}`);
    // interleave frames across workers so progress is even
    const chunks = Array.from({ length: workers }, (_, w) => all.filter((_, i) => i % workers === w));
    const t0 = Date.now();
    await Promise.all(chunks.map((c, w) => renderFrames(port, c, out, 'jpg', `[w${w}]`)));
    console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
} finally {
  srv.close();
}
