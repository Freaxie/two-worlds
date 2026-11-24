// Archie (telnet session) and WAIS (early-90s GUI client) — illustrative reconstructions.
// The WAIS document excerpt is quoted from RFC 1689 (1994), which describes WAIS ranking.
import { C, clamp, roundRect } from '../core.js';
import { drawTerm } from './term.js';

export function archieRows(t, t0) {
  const A = C.amber, D = '#b8873a';
  const L = (dt, spans) => ({ at: t0 + dt, spans });
  const script = [
    L(0.0, [{ t: '$ telnet archie.mcgill.ca', c: D }]),
    L(0.12, [{ t: 'login: archie', c: D }]),
    L(0.25, [{ t: 'archie> ', c: A }, { t: 'prog linux', c: '#ffe2a8', type: 0.9 }]),
    L(1.35, [{ t: '# Search type: sub.', c: D }]),
    L(1.5, [{ t: '# Your queue position: 2', c: D }]),
    L(1.65, [{ t: '# Estimated time for completion: 00:09', c: D }]),
    L(1.8, [{ t: 'working... ', c: A }, { t: '|', c: A, spin: true }]),
    L(2.6, [{ t: 'Host sunsite.unc.edu', c: '#ffe2a8' }]),
    L(2.72, [{ t: '  Location: /pub/Linux/kernel', c: D }]),
    L(2.84, [{ t: '    FILE  1032142  ', c: A }, { t: 'linux-0.99.tar.gz', c: '#ffffff', hi: true }]),
    L(2.96, [{ t: 'Host tsx-11.mit.edu', c: '#ffe2a8' }]),
    L(3.08, [{ t: '  Location: /pub/linux/sources/system', c: D }]),
    L(3.2, [{ t: '    FILE   997345  linux-0.99.tar.Z', c: A }]),
    L(3.32, [{ t: 'Host nic.funet.fi', c: '#ffe2a8' }]),
    L(3.44, [{ t: '  Location: /pub/OS/Linux', c: D }]),
    L(3.56, [{ t: '    DIRECTORY   512  linux', c: A }]),
  ];
  const rows = [];
  for (const s of script) {
    if (t < s.at) break;
    rows.push(s.spans.map((sp) => {
      if (sp.type) { const n = Math.floor((t - s.at) * 14); return { ...sp, t: sp.t.slice(0, Math.max(0, n)) }; }
      if (sp.spin) { if (t > t0 + 2.6) return { ...sp, t: 'done.' }; return { ...sp, t: '|/-\\'[Math.floor(t * 12) % 4] }; }
      return sp;
    }));
  }
  return rows;
}

export function drawArchie(ctx, Wc, Hc, t, t0) {
  const rows = archieRows(t, t0);
  const n = 16;
  const vis = rows.slice(Math.max(0, rows.length - n));
  const last = vis[vis.length - 1];
  const typing = last && last[0]?.t === 'archie> ' && t < t0 + 1.3;
  drawTerm(ctx, Wc, Hc, vis, { cols: 44, rows: n, t, color: C.amber, bg: '#0a0602', glow: 8, cursor: typing ? { r: vis.length - 1, c: 8 + (last[1]?.t.length ?? 0), color: C.amber } : null });
}

// WAIS client window. st: { t, typed (0..1), results (0..1), doc (0..1) }
export function drawWais(ctx, Wc, Hc, st) {
  ctx.fillStyle = '#0b1210'; ctx.fillRect(0, 0, Wc, Hc);
  const win = (x, y, w, h, title) => {
    ctx.fillStyle = '#b9c0bd'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#2b4f6e'; ctx.fillRect(x + 4, y + 4, w - 8, 40);
    ctx.fillStyle = '#eef3f7'; ctx.font = `700 24px 'Plex Mono'`; ctx.textBaseline = 'middle'; ctx.fillText(title, x + 18, y + 25);
    ctx.strokeStyle = '#6b726f'; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  };
  const field = (x, y, w, label, val, cursor) => {
    ctx.fillStyle = '#1d2422'; ctx.font = `600 23px 'Plex Mono'`; ctx.fillText(label, x, y + 22);
    ctx.fillStyle = '#f4f7f5'; ctx.fillRect(x + 210, y, w - 210, 44);
    ctx.strokeStyle = '#59605d'; ctx.lineWidth = 2; ctx.strokeRect(x + 210, y, w - 210, 44);
    ctx.fillStyle = '#101614'; ctx.font = `500 24px 'Plex Mono'`; ctx.fillText(val, x + 222, y + 23);
    if (cursor && Math.floor(st.t * 2.4) % 2 === 0) ctx.fillRect(x + 224 + ctx.measureText(val).width, y + 8, 3, 28);
  };
  win(24, 24, Wc - 48, Hc - 48, 'WAIS — Question');
  const q = 'documents ranked by relevance';
  const qn = Math.floor(q.length * clamp(st.typed ?? 1));
  field(52, 92, Wc - 104, 'Tell me about:', q.slice(0, qn), (st.typed ?? 1) < 1);
  field(52, 150, Wc - 104, 'In sources:', 'rfc-archive.src  cs-papers.src', false);
  ctx.fillStyle = '#1d2422'; ctx.font = `700 23px 'Plex Mono'`; ctx.fillText('Resulting documents:', 52, 236);
  ctx.fillStyle = '#f4f7f5'; ctx.fillRect(52, 256, Wc - 104, 236);
  ctx.font = `600 21px 'Plex Mono'`; ctx.fillStyle = '#4b5250'; ctx.fillText('Score   Size   Headline', 66, 280);
  const res = [['1000', '48K', 'rfc1689.txt  Status report on NIR'], ['873', '12K', 'gopher-protocol notes'], ['611', '30K', 'Network News Transfer Protocol'], ['402', '9K', 'Internet Relay Chat: history']];
  res.forEach((r, i) => {
    const a = clamp((st.results ?? 0) * 4 - i);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    const y = 318 + i * 42;
    if (i === 0) { ctx.fillStyle = '#2b4f6e'; ctx.fillRect(56, y - 19, Wc - 112, 38); }
    ctx.fillStyle = i === 0 ? '#ffffff' : '#101614'; ctx.font = `500 22px 'Plex Mono'`;
    ctx.fillText(r[0].padStart(5, ' ') + '   ' + r[1].padStart(4, ' ') + '   ' + r[2], 66, y);
    ctx.globalAlpha = 1;
  });
  // document view with query terms highlighted (full-text search)
  const d = st.doc ?? 0;
  if (d > 0) {
    const y0 = 510;
    ctx.globalAlpha = clamp(d * 3);
    ctx.fillStyle = '#fbfbf7'; ctx.fillRect(52, y0, Wc - 104, Hc - y0 - 52);
    ctx.strokeStyle = '#59605d'; ctx.strokeRect(52, y0, Wc - 104, Hc - y0 - 52);
    // verbatim from RFC 1689, section 5 (WAIS)
    const text = 'Matching documents are rank-ordered according to a simple statistical weighting scheme which attempts to indicate likely relevance. The user may choose to view selected documents, or further refine the search. The results of one search may be used to successively refine future searches ("relevance feedback").';
    ctx.font = `500 22px 'Plex Mono'`;
    const words = text.split(' ');
    let x = 70, y = y0 + 36;
    const hiWords = new Set(['documents', 'relevance.', 'documents,', 'rank-ordered', '("relevance']);
    const shown = Math.floor(words.length * clamp(d * 1.6));
    words.slice(0, shown).forEach((wd) => {
      const ww = ctx.measureText(wd + ' ').width;
      if (x + ww > Wc - 70) { x = 70; y += 32; }
      if (hiWords.has(wd.toLowerCase())) { ctx.fillStyle = 'rgba(255,214,0,0.85)'; ctx.fillRect(x - 3, y - 15, ctx.measureText(wd).width + 6, 30); }
      ctx.fillStyle = '#161b19'; ctx.fillText(wd, x, y);
      x += ww;
    });
    ctx.fillStyle = '#7a807d'; ctx.font = `500 18px 'Plex Mono'`; ctx.fillText('excerpt, verbatim: RFC 1689 (1994) describing WAIS', 70, Hc - 72);
    ctx.globalAlpha = 1;
  }
}
