// Generic modern interfaces (no real brands): a colourful webpage, a search box and a
// messenger window. Used as the "today" counterpoint to each historical protocol.
import { roundRect, clamp, easeOut, lerp } from '../core.js';

function blob(ctx, x, y, r, c1, c2) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

function chrome(ctx, Wc, Hc, url) {
  ctx.fillStyle = '#f4f5f8'; ctx.fillRect(0, 0, Wc, Hc);
  ctx.fillStyle = '#e3e6ee'; ctx.fillRect(0, 0, Wc, 74);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(30 + i * 26, 37, 9, 0, 7); ctx.fill(); });
  ctx.fillStyle = '#ffffff'; roundRect(ctx, 120, 17, Wc - 180, 40, 20); ctx.fill();
  ctx.fillStyle = '#6b7280'; ctx.font = `500 22px Inter`; ctx.textBaseline = 'middle';
  ctx.fillText(url, 150, 38);
}

// st: { t, scroll (px), hover (0..1) }
export function drawWebpage(ctx, Wc, Hc, st) {
  chrome(ctx, Wc, Hc, 'https://www.everything.example');
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 74, Wc, Hc - 74); ctx.clip();
  ctx.translate(0, -(st.scroll ?? 0));
  // nav
  ctx.fillStyle = '#111827'; ctx.font = `800 30px Inter`; ctx.textBaseline = 'alphabetic';
  ctx.fillText('everything', 40, 128);
  ctx.font = `600 22px Inter`; ctx.fillStyle = '#4b5563';
  ['Explore', 'Stories', 'Live', 'Shop'].forEach((s, i) => ctx.fillText(s, Wc - 470 + i * 110, 125));
  // hero
  const hy = 160;
  const g = ctx.createLinearGradient(0, hy, Wc, hy + 360);
  g.addColorStop(0, '#7c3aed'); g.addColorStop(0.5, '#ec4899'); g.addColorStop(1, '#f59e0b');
  ctx.fillStyle = g; roundRect(ctx, 30, hy, Wc - 60, 360, 28); ctx.fill();
  const tt = st.t;
  blob(ctx, Wc - 250 + Math.sin(tt * 1.2) * 20, hy + 150, 120, 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0)');
  blob(ctx, Wc - 420, hy + 260 + Math.cos(tt) * 14, 90, 'rgba(56,189,248,0.9)', 'rgba(56,189,248,0)');
  ctx.fillStyle = '#ffffff'; ctx.font = `900 66px Inter`;
  ctx.fillText('Discover everything.', 70, hy + 120);
  ctx.font = `500 28px Inter`; ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('Videos, photos, stories — all in one feed.', 72, hy + 172);
  const hv = st.hover ?? 0;
  ctx.fillStyle = `rgba(255,255,255,${0.92 + hv * 0.08})`; roundRect(ctx, 70, hy + 220, 250 + hv * 10, 70, 35); ctx.fill();
  ctx.fillStyle = '#7c3aed'; ctx.font = `800 26px Inter`; ctx.fillText('Get started  →', 100, hy + 265);
  // cards
  const cols = ['#22d3ee', '#a3e635', '#f472b6', '#fb923c', '#818cf8', '#34d399'];
  for (let i = 0; i < 6; i++) {
    const cx = 30 + (i % 3) * ((Wc - 60) / 3), cy = hy + 390 + Math.floor(i / 3) * 300;
    const cw = (Wc - 60) / 3 - 20;
    ctx.fillStyle = '#ffffff'; roundRect(ctx, cx, cy, cw, 280, 20); ctx.fill();
    const cg = ctx.createLinearGradient(cx, cy, cx + cw, cy + 170);
    cg.addColorStop(0, cols[i]); cg.addColorStop(1, cols[(i + 2) % 6]);
    ctx.fillStyle = cg; roundRect(ctx, cx + 12, cy + 12, cw - 24, 160, 14); ctx.fill();
    blob(ctx, cx + cw * 0.7, cy + 70, 46, 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0)');
    ctx.fillStyle = '#111827'; ctx.font = `800 24px Inter`; ctx.fillText(['Trending now', 'For you', 'Live', 'New drops', 'Nearby', 'Saved'][i], cx + 16, cy + 212);
    ctx.fillStyle = '#9ca3af'; ctx.font = `500 19px Inter`; ctx.fillText(`${(i * 37 + 12) % 90 + 4}k views · ${i + 2}h`, cx + 16, cy + 246);
  }
  ctx.restore();
  // cursor
  if (st.cursor) {
    const [mx, my] = st.cursor;
    ctx.fillStyle = '#111'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx, my + 42); ctx.lineTo(mx + 11, my + 31); ctx.lineTo(mx + 20, my + 50); ctx.lineTo(mx + 27, my + 46); ctx.lineTo(mx + 18, my + 28); ctx.lineTo(mx + 33, my + 28); ctx.closePath();
    ctx.stroke(); ctx.fill();
  }
}

// a clean, generic search interface; st: { t, query, typed (0..1) , results (0..1) }
export function drawSearch(ctx, Wc, Hc, st) {
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, Wc, Hc);
  const q = st.query.slice(0, Math.floor(st.query.length * clamp(st.typed ?? 1)));
  const y = lerp(Hc * 0.42, 120, easeOut(st.results ?? 0));
  ctx.textBaseline = 'middle';
  if ((st.results ?? 0) < 0.5) {
    ctx.font = `900 84px Inter`; ctx.textAlign = 'center';
    const g = ctx.createLinearGradient(Wc / 2 - 200, 0, Wc / 2 + 200, 0); g.addColorStop(0, '#2563eb'); g.addColorStop(1, '#14b8a6');
    ctx.fillStyle = g; ctx.globalAlpha = 1 - (st.results ?? 0) * 2;
    ctx.fillText('search', Wc / 2, y - 130); ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 6;
  roundRect(ctx, 70, y - 42, Wc - 140, 84, 42); ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.stroke();
  ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(120, y - 4, 15, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(131, y + 8); ctx.lineTo(142, y + 19); ctx.stroke();
  ctx.fillStyle = '#111827'; ctx.font = `500 34px Inter`; ctx.fillText(q, 168, y + 1);
  if (Math.floor(st.t * 2.4) % 2 === 0) { const qw = ctx.measureText(q).width; ctx.fillRect(170 + qw, y - 20, 3, 40); }
  const r = st.results ?? 0;
  if (r > 0) {
    for (let i = 0; i < 4; i++) {
      const a = clamp(r * 4 - i);
      if (a <= 0) continue;
      ctx.globalAlpha = a;
      const ry = 230 + i * 175;
      ctx.fillStyle = '#6b7280'; ctx.font = `500 22px Inter`; ctx.fillText(['archive.example › history', 'museum.example › networks', 'library.example › rfc', 'wiki.example › protocols'][i], 80, ry);
      ctx.fillStyle = '#1d4ed8'; ctx.font = `700 32px Inter`; ctx.fillText(['The forgotten protocols of the early internet', 'Before the web: menus, indexes and gophers', 'Request for Comments: a living archive', 'Protocols that time forgot'][i], 80, ry + 42);
      ctx.fillStyle = '#4b5563'; ctx.font = `500 22px Inter`; ctx.fillText('About 1,240,000 results — ranked by relevance in 0.31 seconds', 80, ry + 84);
      ctx.globalAlpha = 1;
    }
  }
}

// messenger profile/chat (presence = finger's modern echo). st: { t, typing }
export function drawChat(ctx, Wc, Hc, st) {
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, Wc, Hc);
  ctx.fillStyle = '#111c33'; ctx.fillRect(0, 0, Wc, 150);
  const g = ctx.createLinearGradient(60, 30, 150, 120); g.addColorStop(0, '#22d3ee'); g.addColorStop(1, '#a78bfa');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(105, 75, 46, 0, 7); ctx.fill();
  ctx.fillStyle = '#0f172a'; ctx.font = `800 40px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', 105, 77); ctx.textAlign = 'left';
  ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(140, 110, 13, 0, 7); ctx.fill();
  ctx.strokeStyle = '#111c33'; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = '#f8fafc'; ctx.font = `800 36px Inter`; ctx.fillText('Alex', 180, 58);
  ctx.fillStyle = '#4ade80'; ctx.font = `600 24px Inter`; ctx.fillText('● Active now', 180, 102);
  const msgs = [
    { me: false, txt: 'compiling the kernel again...', y: 230 },
    { me: true, txt: 'saw your status. how long?', y: 350 },
    { me: false, txt: 'last seen: yesterday, 21:14', y: 470, meta: true },
  ];
  msgs.forEach((m, i) => {
    const a = clamp((st.t - i * 0.25) * 3);
    if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.font = `600 30px Inter`;
    const tw = ctx.measureText(m.txt).width + 56;
    const x = m.me ? Wc - 50 - tw : 50;
    ctx.fillStyle = m.meta ? 'rgba(148,163,184,0.18)' : m.me ? '#2563eb' : '#1e293b';
    roundRect(ctx, x, m.y, tw, 76, 30); ctx.fill();
    ctx.fillStyle = m.meta ? '#94a3b8' : '#f8fafc';
    ctx.fillText(m.txt, x + 28, m.y + 39);
    ctx.globalAlpha = 1;
  });
  if (st.typing) {
    ctx.fillStyle = '#1e293b'; roundRect(ctx, 50, 600, 140, 66, 30); ctx.fill();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(226,232,240,${0.35 + 0.65 * (0.5 + 0.5 * Math.sin(st.t * 8 - i))})`; ctx.beginPath(); ctx.arc(92 + i * 28, 633, 9, 0, 7); ctx.fill(); }
  }
  ctx.fillStyle = '#94a3b8'; ctx.font = `500 22px Inter`; ctx.fillText('read receipts · online status · last seen', 50, Hc - 50);
}
