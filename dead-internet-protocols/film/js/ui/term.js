// Character-grid terminal renderer (VT323). Rows are strings or arrays of styled spans:
//   { t: 'text', c: '#hex', inv: true (inverse video), dim: true, blink: true }
import { C, clamp } from '../core.js';

const metricsCache = new Map();
function fit(ctx, cols, w) {
  const key = cols + ':' + w;
  if (metricsCache.has(key)) return metricsCache.get(key);
  ctx.font = `100px VT323`;
  const adv = ctx.measureText('M').width / 100; // advance per px of font size
  const size = (w / cols) / adv;
  const out = { size, cw: w / cols };
  metricsCache.set(key, out);
  return out;
}

export function drawTerm(ctx, W, H, rows, opt = {}) {
  const cols = opt.cols ?? 48, nrows = opt.rows ?? 20;
  const padX = opt.padX ?? W * 0.06, padY = opt.padY ?? H * 0.07;
  const color = opt.color ?? C.green;
  const bg = opt.bg ?? '#020805';
  const t = opt.t ?? 0;
  if (!opt.noClear) {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  }
  const { size, cw } = fit(ctx, cols, W - padX * 2);
  const lh = (H - padY * 2) / nrows;
  ctx.font = `${size}px VT323`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const blinkOn = Math.floor(t * 2.2) % 2 === 0;
  for (let r = 0; r < Math.min(rows.length, nrows); r++) {
    let row = rows[r];
    if (row == null) continue;
    if (typeof row === 'string') row = [{ t: row }];
    let col = 0;
    const y = padY + lh * (r + 0.5);
    for (const sp of row) {
      const txt = sp.t ?? '';
      const c = sp.c ?? color;
      const x = padX + col * cw;
      if (sp.inv) {
        ctx.fillStyle = c;
        ctx.fillRect(x - cw * 0.1, y - lh * 0.46, txt.length * cw + cw * 0.2, lh * 0.92);
        ctx.fillStyle = bg;
        drawChars(ctx, txt, x, y, cw);
      } else if (!(sp.blink && !blinkOn)) {
        ctx.fillStyle = c;
        ctx.globalAlpha = sp.dim ? 0.55 : (sp.a ?? 1);
        ctx.shadowColor = c; ctx.shadowBlur = opt.glow ?? 6;
        drawChars(ctx, txt, x, y, cw);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
      col += txt.length;
    }
  }
  // cursor
  if (opt.cursor && (opt.cursor.solid || blinkOn)) {
    const { r, c } = opt.cursor;
    ctx.fillStyle = opt.cursor.color ?? color;
    ctx.fillRect(padX + c * cw, padY + lh * r + lh * 0.08, cw * 0.92, lh * 0.84);
  }
  return { cw, lh, padX, padY };
}

function drawChars(ctx, txt, x, y, cw) {
  // per-character placement keeps the grid exact regardless of kerning
  for (let i = 0; i < txt.length; i++) if (txt[i] !== ' ') ctx.fillText(txt[i], x + i * cw, y);
}

// Typewriter over a list of lines: returns the rows visible at time t.
// lines: [{ text|spans, at: startTime, cps }] — a line with cps=0 appears instantly at `at`.
export function typeRows(lines, t) {
  const out = [];
  for (const L of lines) {
    if (t < L.at) break;
    const cps = L.cps ?? 0;
    const spans = typeof L.text === 'string' ? [{ t: L.text, c: L.c }] : L.text;
    if (!cps) { out.push(spans); continue; }
    let n = Math.floor((t - L.at) * cps);
    const row = [];
    for (const sp of spans) {
      if (n <= 0) break;
      row.push({ ...sp, t: sp.t.slice(0, n) });
      n -= sp.t.length;
    }
    out.push(row);
  }
  return out;
}

export const rowLen = (row) => (typeof row === 'string' ? row.length : row.reduce((a, s) => a + (s.t?.length ?? 0), 0));
export const pad = (s, n) => (s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length));
export const center = (s, n) => { const l = Math.max(0, Math.floor((n - s.length) / 2)); return ' '.repeat(l) + s; };
export const progress = (t, a, b) => clamp((t - a) / (b - a));
