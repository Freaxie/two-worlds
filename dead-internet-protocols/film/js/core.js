// Core helpers shared by every module: math, easing, deterministic randomness,
// timeline lookups and palette. Everything in the film is a pure function of time.

export const W = 1080, H = 1920, FPS = 60;

export const C = {
  bg: '#030608',
  green: '#3dff8b', greenMid: '#22c96c', greenDim: '#0e5c33', greenDeep: '#06251a',
  amber: '#ffb238', amberDim: '#7a4c0c',
  cyan: '#46e6ff', cyanDim: '#0f5a6b',
  red: '#ff3b4e', white: '#eef7f3', grey: '#8aa39a', greyDim: '#3b4a45',
};

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invlerp = (a, b, x) => clamp((x - a) / (b - a));
export const smooth = (a, b, x) => { const t = invlerp(a, b, x); return t * t * (3 - 2 * t); };
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t) => clamp(t) ** 3;
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutSine = (t) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
// window: 0 before a, rises to 1 over fade, holds, falls back to 0 at b
export const win = (t, a, b, fi = 0.25, fo = 0.25) => Math.min(smooth(a, a + fi, t), 1 - smooth(b - fo, b, t));

// deterministic PRNG
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash1(n) { // [0,1)
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
export const hash2 = (a, b) => hash1(Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663));
// smooth 1D value noise in [-1,1]
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash2(i, seed) * 2 - 1, hash2(i + 1, seed) * 2 - 1, u);
}
export const fbm1 = (x, seed = 0) => noise1(x, seed) * 0.6 + noise1(x * 2.1, seed + 7) * 0.3 + noise1(x * 4.3, seed + 13) * 0.1;

// ---------------------------------------------------------------- timeline
let TL = null;
export function setTimeline(tl) {
  TL = tl;
  TL.byId = Object.fromEntries(tl.lines.map((l) => [l.id, l]));
  // scene cut points: shortly before each scene's first line
  const firsts = {};
  for (const l of tl.lines) if (!(l.scene in firsts)) firsts[l.scene] = l.start;
  TL.cuts = [0];
  for (let s = 2; s <= 7; s++) TL.cuts.push(firsts[s] - 0.45);
  TL.cuts.push(tl.duration);
}
export const timeline = () => TL;
export const line = (id) => TL.byId[id];
// time of the first word in line `id` that starts with `prefix` (case-insensitive)
export function wordT(id, prefix, which = 'start', nth = 0) {
  const l = TL.byId[id];
  const p = prefix.toLowerCase();
  let k = 0;
  for (const w of l.words) {
    const ww = w.w.toLowerCase().replace(/[^a-z0-9.']/g, '');
    if (ww.startsWith(p)) { if (k === nth) return w[which]; k++; }
  }
  throw new Error(`word "${prefix}" not found in ${id}`);
}
export const sceneRange = (n) => [TL.cuts[n - 1], TL.cuts[n]];

// ---------------------------------------------------------------- canvas helpers
export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
export function font(size, family = 'mono', weight = 500) {
  const fam = family === 'mono' ? "'Plex Mono'" : family === 'crt' ? 'VT323' : 'Inter';
  return `${weight} ${size}px ${fam}`;
}
// draw text with manual letter spacing (Canvas letterSpacing is not reliable everywhere)
export function spacedText(ctx, str, x, y, spacing, align = 'left') {
  let width = 0;
  const ws = [...str].map((ch) => { const m = ctx.measureText(ch).width; width += m + spacing; return m; });
  width -= spacing;
  let cx = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  const savedAlign = ctx.textAlign; ctx.textAlign = 'left';
  [...str].forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += ws[i] + spacing; });
  ctx.textAlign = savedAlign;
  return width;
}
export function measureSpaced(ctx, str, spacing) {
  let w = 0; for (const ch of str) w += ctx.measureText(ch).width + spacing; return w - spacing;
}
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
// typewriter: number of characters visible at time t for text starting at t0 with cps chars/sec
export const typed = (str, t, t0, cps = 40) => str.slice(0, clamp(Math.floor((t - t0) * cps), 0, str.length));
export function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
