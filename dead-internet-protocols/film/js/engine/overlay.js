// Typography drawn on the 1080x1920 overlay canvas (composited into the HDR frame so it
// picks up bloom). Titles, decode effects, "specimen" classification cards, quotes, stats.
import { C, clamp, smooth, easeOut, hash2, rgba, spacedText, measureSpaced, roundRect } from '../core.js';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$/\\<>[]{}=+*';

// text that "decodes" from random glyphs into the final string
export function decode(str, t, t0, dur = 0.6, seed = 1) {
  if (t < t0) return '';
  const p = clamp((t - t0) / dur);
  const n = str.length;
  let out = '';
  for (let i = 0; i < n; i++) {
    const ch = str[i];
    const settle = (i / n) * 0.7 + 0.3;
    if (ch === ' ' || p >= settle) out += ch;
    else if (p > (i / n) * 0.5) out += GLYPHS[Math.floor(hash2(i * 31 + seed, Math.floor(t * 30)) * GLYPHS.length)];
    else out += ' ';
  }
  return out;
}

// big title: lines of uppercase text, centred at x, top y. mode: 'decode' | 'fade' | 'type'
export function title(ctx, lines, x, y, t, t0, t1, o = {}) {
  if (t < t0 || t > t1 + 0.6) return;
  const size = o.size ?? 86, lh = o.lh ?? size * 1.08, sp = o.spacing ?? size * 0.02;
  const out = 1 - smooth(t1, t1 + 0.45, t);
  ctx.save();
  ctx.font = `${o.weight ?? 900} ${size}px Inter`;
  ctx.textBaseline = 'alphabetic';
  lines.forEach((ln, i) => {
    const li0 = t0 + i * (o.stagger ?? 0.18);
    let s = ln;
    let a = out;
    if (o.mode === 'type') s = ln.slice(0, clamp(Math.floor((t - li0) * (o.cps ?? 28)), 0, ln.length));
    else if (o.mode === 'fade') a *= easeOut((t - li0) / 0.5);
    else s = decode(ln, t, li0, o.dur ?? 0.55, i + 3);
    if (!s) return;
    const yy = y + i * lh + (o.mode === 'fade' ? (1 - easeOut((t - li0) / 0.6)) * 18 : 0);
    ctx.globalAlpha = a;
    const col = o.colors?.[i] ?? o.color ?? C.white;
    ctx.shadowColor = o.glow ?? rgba(C.green, 0.55); ctx.shadowBlur = o.blur ?? 14;
    ctx.fillStyle = col;
    spacedText(ctx, s, x, yy, sp, o.align ?? 'center');
    ctx.shadowBlur = 0;
    spacedText(ctx, s, x, yy, sp, o.align ?? 'center');
  });
  ctx.restore();
}

// small mono label (kicker) like "GOPHER — EARLY 1990s"
export function kicker(ctx, text, x, y, t, t0, t1, o = {}) {
  if (t < t0 || t > t1 + 0.5) return;
  const a = smooth(t0, t0 + 0.3, t) * (1 - smooth(t1, t1 + 0.4, t));
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `${o.weight ?? 600} ${o.size ?? 30}px 'Plex Mono'`;
  ctx.fillStyle = o.color ?? C.green;
  ctx.shadowColor = o.color ?? C.green; ctx.shadowBlur = 14;
  const s = decode(text, t, t0, 0.45, 17);
  spacedText(ctx, s, x, y, o.spacing ?? 5, o.align ?? 'center');
  ctx.restore();
}

const STATUS_COL = { OBSOLETE: C.amber, DEPRECATED: '#ff7a45', NICHE: C.cyan, ABANDONED: '#9aa7a2', ALIVE: C.cyan, LEGACY: C.amber };

// Archaeological "specimen" header (top safe zone). data:
// { no, name, era, rows:[[k,v],...], status, note, source, recon }
export function specimen(ctx, x, y, w, data, t, t0, t1) {
  if (t < t0 || t > t1 + 0.5) return;
  const a = smooth(t0, t0 + 0.2, t) * (1 - smooth(t1, t1 + 0.4, t));
  ctx.save();
  ctx.globalAlpha = a;
  ctx.textBaseline = 'alphabetic';
  // soft dark backing for legibility
  const h = 205 + data.rows.length * 44 + 70;
  const g = ctx.createLinearGradient(0, y - 40, 0, y + h + 30);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.15, 'rgba(1,6,4,0.55)'); g.addColorStop(0.85, 'rgba(1,6,4,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, y - 40, 1080, h + 70);
  // header rule
  const grow = easeOut((t - t0) / 0.4);
  ctx.strokeStyle = rgba(C.green, 0.7); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y + 12); ctx.lineTo(x + w * grow, y + 12); ctx.stroke();
  ctx.font = `500 24px 'Plex Mono'`; ctx.fillStyle = C.green;
  spacedText(ctx, decode(`SPECIMEN ${data.no}`, t, t0, 0.35, 5), x, y, 5);
  if (data.recon) { ctx.fillStyle = rgba(C.amber, 0.9); spacedText(ctx, decode('ILLUSTRATIVE RECONSTRUCTION', t, t0 + 0.1, 0.4, 6), x + w, y, 2, 'right'); }
  // name
  ctx.font = `900 ${data.nameSize ?? 124}px Inter`;
  ctx.fillStyle = C.white; ctx.shadowColor = rgba(C.green, 0.6); ctx.shadowBlur = 16;
  spacedText(ctx, decode(data.name, t, t0 + 0.08, 0.5, 9), x - 4, y + 132, 4);
  ctx.shadowBlur = 0;
  // era / tagline
  ctx.font = `600 29px 'Plex Mono'`; ctx.fillStyle = C.green; ctx.shadowColor = C.green; ctx.shadowBlur = 10;
  spacedText(ctx, decode(data.era, t, t0 + 0.25, 0.45, 11), x, y + 185, 4);
  ctx.shadowBlur = 0;
  data.rows.forEach(([k, v], i) => {
    const ry = y + 240 + i * 44;
    const rt = t0 + 0.4 + i * 0.12;
    if (t < rt) return;
    ctx.font = `500 23px 'Plex Mono'`; ctx.fillStyle = rgba(C.green, 0.7);
    spacedText(ctx, decode(k, t, rt, 0.3, 40 + i), x, ry, 3);
    ctx.font = `500 27px 'Plex Mono'`; ctx.fillStyle = '#dcefe8';
    ctx.fillText(decode(v, t, rt + 0.05, 0.45, 60 + i), x + 150, ry);
  });
  const sy = y + 240 + data.rows.length * 44 - 6;
  const st = t0 + 0.5 + data.rows.length * 0.12;
  if (t > st && data.status) {
    const col = STATUS_COL[data.status] ?? C.green;
    ctx.font = `500 23px 'Plex Mono'`; ctx.fillStyle = rgba(C.green, 0.7);
    spacedText(ctx, 'STATUS', x, sy + 28, 3);
    ctx.font = `700 26px 'Plex Mono'`;
    const lw = measureSpaced(ctx, data.status, 4) + 32;
    const blink = (t - st) < 0.45 ? (Math.floor((t - st) * 16) % 2) : 1;
    ctx.globalAlpha = a * (0.35 + 0.65 * blink);
    ctx.fillStyle = col; roundRect(ctx, x + 150, sy, lw, 40, 4); ctx.fill();
    ctx.fillStyle = '#021008'; spacedText(ctx, data.status, x + 150 + 16, sy + 29, 4);
    ctx.globalAlpha = a;
    if (data.note) { ctx.font = `500 25px 'Plex Mono'`; ctx.fillStyle = col; ctx.fillText(decode(data.note, t, st + 0.1, 0.4, 77), x + 150 + lw + 18, sy + 29); }
  }
  if (data.source && t > st + 0.2) {
    ctx.font = `400 20px 'Plex Mono'`; ctx.fillStyle = rgba(C.grey, 0.9);
    ctx.fillText(decode('SOURCE · ' + data.source, t, st + 0.2, 0.4, 88), x, sy + 82);
  }
  ctx.restore();
}

// quoted document fragment, e.g. an RFC warning
export function quote(ctx, text, source, x, y, w, t, t0, t1, o = {}) {
  if (t < t0 || t > t1 + 0.5) return;
  const a = smooth(t0, t0 + 0.3, t) * (1 - smooth(t1, t1 + 0.4, t));
  ctx.save(); ctx.globalAlpha = a;
  const size = o.size ?? 38;
  ctx.font = `500 ${size}px 'Plex Mono'`;
  // wrap
  const words = text.split(' '); const lines = []; let cur = '';
  for (const wd of words) { const tryS = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tryS).width > w - 60 && cur) { lines.push(cur); cur = wd; } else cur = tryS; }
  lines.push(cur);
  const h = lines.length * size * 1.3 + 90;
  ctx.fillStyle = 'rgba(14,4,4,0.78)'; roundRect(ctx, x, y, w, h, 6); ctx.fill();
  ctx.fillStyle = o.color ?? C.red; ctx.fillRect(x, y, 8, h);
  ctx.fillStyle = o.color ?? C.red; ctx.shadowColor = o.color ?? C.red; ctx.shadowBlur = 12;
  const nch = Math.floor((t - t0) * (o.cps ?? 45));
  let used = 0;
  lines.forEach((ln, i) => {
    const vis = ln.slice(0, clamp(nch - used, 0, ln.length)); used += ln.length + 1;
    ctx.fillText(vis, x + 34, y + 30 + size + i * size * 1.3);
  });
  ctx.shadowBlur = 0;
  ctx.font = `500 22px 'Plex Mono'`; ctx.fillStyle = rgba(C.grey, 0.9);
  if (nch > text.length) spacedText(ctx, source, x + 34, y + h - 22, 2);
  ctx.restore();
}

// big statistic
export function stat(ctx, big, small, src, x, y, t, t0, t1, o = {}) {
  if (t < t0 || t > t1 + 0.5) return;
  const a = smooth(t0, t0 + 0.3, t) * (1 - smooth(t1, t1 + 0.4, t));
  ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'alphabetic';
  ctx.font = `900 ${o.size ?? 96}px Inter`;
  ctx.fillStyle = o.color ?? C.green; ctx.shadowColor = o.color ?? C.green; ctx.shadowBlur = 26;
  spacedText(ctx, decode(big, t, t0, 0.5, 23), x, y, 2, o.align ?? 'center');
  ctx.shadowBlur = 0;
  ctx.font = `600 28px 'Plex Mono'`; ctx.fillStyle = C.white;
  spacedText(ctx, decode(small, t, t0 + 0.15, 0.5, 29), x, y + 50, 3, o.align ?? 'center');
  if (src) { ctx.font = `400 21px 'Plex Mono'`; ctx.fillStyle = rgba(C.grey, 0.9); spacedText(ctx, src, x, y + 88, 2, o.align ?? 'center'); }
  ctx.restore();
}

// label pinned to a projected 3D point: dot + leader line + text
export function pin(ctx, sx, sy, text, sub, a, o = {}) {
  if (a <= 0.01) return;
  const col = o.color ?? C.green;
  ctx.save(); ctx.globalAlpha = a;
  const dx = o.dx ?? 46, dy = o.dy ?? -46;
  ctx.strokeStyle = rgba(col, 0.8); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + dx * 0.6, sy + dy); ctx.lineTo(sx + dx, sy + dy); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
  ctx.font = `600 ${o.size ?? 26}px 'Plex Mono'`;
  ctx.shadowColor = col; ctx.shadowBlur = 10;
  const tx = sx + dx + (dx > 0 ? 10 : -10);
  spacedText(ctx, text, tx, sy + dy + 9, 3, dx > 0 ? 'left' : 'right');
  if (sub) { ctx.shadowBlur = 0; ctx.font = `500 ${(o.size ?? 26) * 0.78}px 'Plex Mono'`; ctx.fillStyle = rgba(col, 0.7); spacedText(ctx, sub, tx, sy + dy + 38, 2, dx > 0 ? 'left' : 'right'); }
  ctx.restore();
}
