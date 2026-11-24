// IPX/SPX and X.25 artefacts: DOS NetWare client session, an original LAN arena game,
// an X.28 PAD dialogue, holographic topology diagrams, and real packet-header layouts.
import { C, clamp, smooth, rgba, hash2, roundRect } from '../core.js';
import { drawTerm } from './term.js';

export function drawDosNetware(ctx, Wc, Hc, t, t0) {
  const L = [
    [0.0, 'C:\\> LSL'], [0.15, 'C:\\> NE2000'], [0.3, 'C:\\> IPXODI'], [0.45, 'C:\\> NETX'],
    [0.7, 'Attached to server FS1'], [0.95, 'F:\\> LOGIN FS1/ALEX'], [1.35, 'Good morning, ALEX.'], [1.6, 'F:\\> '],
  ];
  const rows = L.filter(([dt]) => t >= t0 + dt).map(([, s]) => [{ t: s, c: '#cfd8d2' }]);
  drawTerm(ctx, Wc, Hc, rows, { cols: 30, rows: 11, t, color: '#cfd8d2', bg: '#05070a', glow: 4, cursor: rows.length ? { r: rows.length - 1, c: rows[rows.length - 1][0].t.length } : null });
}

// original top-down arena: two vector ships trade shots across a grid (seeded, deterministic)
export function drawLanGame(ctx, Wc, Hc, t, player = 1) {
  ctx.fillStyle = '#020604'; ctx.fillRect(0, 0, Wc, Hc);
  ctx.strokeStyle = 'rgba(61,255,139,0.18)'; ctx.lineWidth = 2;
  for (let x = 0; x < Wc; x += 40) { ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, Hc); ctx.stroke(); }
  for (let y = 60; y < Hc; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(Wc, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(61,255,139,0.7)'; ctx.lineWidth = 6;
  [[120, 180, 160, 30], [360, 300, 30, 140], [460, 140, 140, 30], [200, 380, 140, 30]].forEach(([x, y, w, h]) => ctx.strokeRect(x * Wc / 640, y * Hc / 480, w * Wc / 640, h * Hc / 480));
  const ship = (x, y, a, col) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.shadowColor = col; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-16, 15); ctx.lineTo(-8, 0); ctx.lineTo(-16, -15); ctx.closePath(); ctx.stroke(); ctx.restore();
  };
  const s = Wc / 640;
  const p1 = [130 + 80 * Math.sin(t * 0.9), 330 + 60 * Math.cos(t * 0.7)], p2 = [500 + 70 * Math.cos(t * 0.8), 250 + 90 * Math.sin(t * 0.6)];
  const a1 = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]), a2 = a1 + Math.PI;
  ship(p1[0] * s, p1[1] * s, a1, '#46e6ff'); ship(p2[0] * s, p2[1] * s, a2, '#ffb238');
  for (let k = 0; k < 3; k++) {
    const ph = (t * 1.4 + k / 3) % 1;
    const from = k % 2 ? p2 : p1, to = k % 2 ? p1 : p2;
    ctx.fillStyle = k % 2 ? '#ffb238' : '#46e6ff';
    ctx.beginPath(); ctx.arc((from[0] + (to[0] - from[0]) * ph) * s, (from[1] + (to[1] - from[1]) * ph) * s, 6 * s, 0, 7); ctx.fill();
  }
  ctx.fillStyle = '#d9ffe8'; ctx.font = `${30 * s}px VT323`; ctx.textBaseline = 'middle';
  ctx.fillText(`NET ARENA   P1 ${3 + Math.floor(t / 2.5) % 2}   P2 2   [IPX]`, 18 * s, 30 * s);
  ctx.fillText(player === 1 ? 'YOU: BLUE' : 'YOU: AMBER', Wc - 170 * s, 30 * s);
}

export function drawPad(ctx, Wc, Hc, t, t0) {
  const A = C.amber, D = '#b8873a';
  const cmd = 'CALL 3110 2120 0045';
  const n = clamp(Math.floor((t - t0 - 0.2) * 20), 0, cmd.length);
  const rows = [[{ t: 'X.28 PAD  -  PUBLIC DATA NETWORK', c: D }], [{ t: '' }], [{ t: '*', c: A }, { t: cmd.slice(0, n), c: '#ffe2a8' }]];
  if (t > t0 + 1.4) rows.push([{ t: 'COM', c: '#ffffff' }]);
  if (t > t0 + 1.7) rows.push([{ t: 'CONNECTED VIA VIRTUAL CIRCUIT  LCN 7', c: A }]);
  if (t > t0 + 2.0) rows.push([{ t: 'HOST-B  UNIX SYSTEM V', c: D }]);
  if (t > t0 + 2.2) rows.push([{ t: 'login: ', c: A }]);
  const last = rows[rows.length - 1];
  drawTerm(ctx, Wc, Hc, rows, { cols: 36, rows: 12, t, color: A, bg: '#0a0602', glow: 8, cursor: { r: rows.length - 1, c: last.reduce((a, s) => a + s.t.length, 0), color: A } });
}

const node = (ctx, x, y, r, col, label, sub) => {
  ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.shadowColor = col; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = rgba(col, 0.18); ctx.fill();
  if (label) { ctx.fillStyle = col; ctx.font = `600 22px 'Plex Mono'`; ctx.textAlign = 'center'; ctx.fillText(label, x, y + r + 28); if (sub) { ctx.globalAlpha *= 0.7; ctx.font = `500 17px 'Plex Mono'`; ctx.fillText(sub, x, y + r + 52); ctx.globalAlpha /= 0.7; } ctx.textAlign = 'left'; }
};

// NetWare office LAN: file server in the middle, workstations around, IPX packets in flight
export function drawOfficeNet(ctx, Wc, Hc, t, appear = 1) {
  ctx.clearRect(0, 0, Wc, Hc);
  ctx.globalAlpha = appear;
  const A = '#ffb238', G = C.green;
  const cx = Wc / 2, cy = Hc * 0.42;
  ctx.font = `700 26px 'Plex Mono'`; ctx.fillStyle = A; ctx.textBaseline = 'middle';
  ctx.fillText('NETWARE LAN  ·  IPX/SPX', 30, 36);
  const ws = [];
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3 + 0.3; ws.push([cx + Math.cos(a) * 330, cy + Math.sin(a) * 210]); }
  ws.forEach(([x, y]) => { ctx.strokeStyle = rgba(A, 0.55); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); });
  node(ctx, cx, cy, 52, A, 'FILE SERVER', 'FS1');
  ws.forEach(([x, y], i) => node(ctx, x, y, 26, G, `WS${i + 1}`, `0000BEEF:${(0xa024c1f300 + i * 17).toString(16).toUpperCase().slice(-6)}`));
  for (let k = 0; k < 8; k++) {
    const i = k % 6, ph = (t * 0.9 + k * 0.37) % 1;
    const [x, y] = ws[i];
    const u = k % 2 ? ph : 1 - ph;
    const px = cx + (x - cx) * u, py = cy + (y - cy) * u;
    ctx.fillStyle = '#ffe2a8'; ctx.shadowColor = A; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(px, py, 7, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  }
  // header anatomy (30 bytes)
  const fields = [['CHECKSUM', 2], ['LENGTH', 2], ['HOPS', 1], ['TYPE', 1], ['DST NET', 4], ['DST NODE', 6], ['SOCK', 2], ['SRC NET', 4], ['SRC NODE', 6], ['SOCK', 2]];
  const y0 = Hc - 120, x0 = 30, wTot = Wc - 60;
  ctx.font = `600 20px 'Plex Mono'`; ctx.fillStyle = A; ctx.fillText('IPX HEADER  ·  30 BYTES', x0, y0 - 26);
  let x = x0;
  fields.forEach(([nm, b], i) => {
    const w = wTot * b / 30;
    const lit = smooth(i * 0.08, i * 0.08 + 0.3, (t % 6) / 2);
    ctx.strokeStyle = rgba(A, 0.8); ctx.lineWidth = 2; ctx.strokeRect(x + 2, y0, w - 4, 70);
    ctx.fillStyle = rgba(A, 0.12 + 0.25 * lit); ctx.fillRect(x + 2, y0, w - 4, 70);
    ctx.fillStyle = '#ffe2a8'; ctx.font = `600 ${w < 60 ? 13 : 16}px 'Plex Mono'`; ctx.textAlign = 'center';
    ctx.fillText(nm, x + w / 2, y0 + 24); ctx.fillStyle = rgba(A, 0.8); ctx.fillText(`${b}B`, x + w / 2, y0 + 50); ctx.textAlign = 'left';
    x += w;
  });
  ctx.globalAlpha = 1;
}

// X.25: DTE -> DCE -> packet switches -> DCE -> DTE, virtual circuit highlighted
export function drawX25Net(ctx, Wc, Hc, t, appear = 1, broken = 0) {
  ctx.clearRect(0, 0, Wc, Hc);
  ctx.globalAlpha = appear;
  const A = '#ff9a2e';
  ctx.font = `700 26px 'Plex Mono'`; ctx.fillStyle = A; ctx.textBaseline = 'middle';
  ctx.fillText('X.25 PUBLIC DATA NETWORK', 30, 36);
  const sw = [[300, 230], [520, 170], [720, 260], [420, 420], [640, 450], [820, 400]];
  const links = [[0, 1], [1, 2], [0, 3], [3, 4], [4, 5], [2, 5], [1, 4], [3, 1]];
  const vc = [[0, 1], [1, 4], [4, 5]];
  const dteA = [90, 330], dteB = [Wc - 90, 330];
  const brk = (i) => broken > 0 && hash2(i, 5) < broken;
  links.forEach(([a, b], i) => {
    if (brk(i)) return;
    ctx.strokeStyle = rgba(A, 0.35); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(...sw[a]); ctx.lineTo(...sw[b]); ctx.stroke();
  });
  ctx.strokeStyle = rgba(A, 0.6); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(...dteA); ctx.lineTo(...sw[0]); ctx.stroke(); ctx.beginPath(); ctx.moveTo(...dteB); ctx.lineTo(...sw[5]); ctx.stroke();
  // virtual circuit
  const path = [dteA, sw[0], sw[1], sw[4], sw[5], dteB];
  if (!broken) {
    ctx.strokeStyle = '#ffe2a8'; ctx.lineWidth = 6; ctx.shadowColor = A; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.moveTo(...path[0]); path.slice(1).forEach((p) => ctx.lineTo(...p)); ctx.stroke(); ctx.shadowBlur = 0;
    for (let k = 0; k < 4; k++) {
      const u = ((t * 0.5 + k / 4) % 1) * (path.length - 1);
      const i = Math.floor(u), f = u - i;
      const x = path[i][0] + (path[i + 1][0] - path[i][0]) * f, y = path[i][1] + (path[i + 1][1] - path[i][1]) * f;
      ctx.fillStyle = '#ffffff'; ctx.shadowColor = A; ctx.shadowBlur = 16; ctx.fillRect(x - 9, y - 9, 18, 18); ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffe2a8'; ctx.font = `600 16px 'Plex Mono'`; ctx.fillText('LCN 7', x + 14, y - 14);
    }
  }
  sw.forEach(([x, y], i) => node(ctx, x, y, 22, A, i === 0 || i === 5 ? 'DCE/PSE' : 'PSE', null));
  node(ctx, ...dteA, 34, '#ffe2a8', 'DTE', 'terminal');
  node(ctx, ...dteB, 34, '#ffe2a8', 'DTE', 'host');
  ctx.font = `500 20px 'Plex Mono'`; ctx.fillStyle = rgba(A, 0.85);
  ctx.fillText('virtual circuit · flow control at every hop', 30, Hc - 40);
  ctx.globalAlpha = 1;
}

// three packet headers = three "languages" (real field layouts)
export const LANGS = [
  { name: 'IPX/SPX', col: '#ffb238', bytes: 'FF FF 00 40 00 05 00 00 BE EF 00 A0 24 C1 F3 E2 40 05', legend: 'checksum · length · hops · type · network · node · socket' },
  { name: 'X.25', col: '#ff8a3d', bytes: '10 07 22 48 45 4C 4C 4F 20 48 4F 53 54 2D 42', legend: 'GFI · channel · P(R) M P(S) · user data' },
  { name: 'TCP/IP', col: '#46e6ff', bytes: '45 00 00 3C 1C 46 40 00 40 06 B1 E6 AC 10 0A 63', legend: 'version · length · id · TTL · protocol · checksum · address' },
];
