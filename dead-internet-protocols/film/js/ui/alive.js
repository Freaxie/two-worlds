// Survivors: an IRC channel and a threaded Usenet newsreader (illustrative; nicks and
// subjects are invented, alt.folklore.computers is a real, long-running newsgroup).
import { C } from '../core.js';
import { drawTerm, pad } from './term.js';

export function drawIrc(ctx, Wc, Hc, t, t0) {
  const CY = '#46e6ff', G = C.green, D = '#2f8f6a', W = '#e6fff4';
  const msgs = [
    [0.0, [{ t: '21:14 ', c: D }, { t: '<oldtimer> ', c: CY }, { t: 'anyone still run gopher?', c: W }]],
    [0.35, [{ t: '21:14 ', c: D }, { t: '<mira> ', c: '#ffb238' }, { t: 'port 70, every day', c: W }]],
    [0.7, [{ t: '21:15 ', c: D }, { t: '<kb> ', c: '#ff7ad9' }, { t: 'usenet still flows too', c: W }]],
    [1.05, [{ t: '21:15 ', c: D }, { t: '* mira waves at the archive', c: G }]],
    [1.4, [{ t: '21:16 ', c: D }, { t: '<oldtimer> ', c: CY }, { t: 'old != dead', c: W }]],
  ];
  const rows = [[{ t: ' #archaeology ', inv: true, c: CY }, { t: ' topic: dig deeper', c: D }], [{ t: '-!- ', c: D }, { t: 'mira [~mira@lab] has joined', c: D }]];
  msgs.forEach(([dt, r]) => { if (t >= t0 + dt) rows.push(r); });
  while (rows.length < 11) rows.push('');
  rows.push([{ t: pad(' [21:16] [mira(+i)] [#archaeology(+nt)]', 40), inv: true, c: '#1f6f5a' }]);
  rows.push([{ t: '[#archaeology] ', c: CY }]);
  drawTerm(ctx, Wc, Hc, rows, { cols: 40, rows: 13, t, color: G, bg: '#02080a', glow: 6, cursor: { r: 12, c: 15, color: CY } });
}

export function drawUsenet(ctx, Wc, Hc, t, t0, sel = 0) {
  const G = C.green, D = '#2f8f6a', W = '#e6fff4', CY = '#46e6ff';
  const th = [
    ['+', 'What was your first gopher client?', 'mira'],
    [' ', '`->', 'kb'],
    [' ', '  `->', 'oldtimer'],
    ['+', 'Finger .plan files: a eulogy', 'ada'],
    ['+', 'Archie servers - any left?', 'kb'],
    [' ', '`->', 'mira'],
    ['+', 'NNTP still beats the algorithm', 'ref'],
  ];
  const rows = [[{ t: ' alt.folklore.computers ', inv: true, c: CY }, { t: '  NNTP', c: D }], ''];
  th.forEach(([m, s, a], i) => {
    if (t < t0 + i * 0.12) return;
    const isSel = i === sel;
    rows.push([{ t: `${String(i + 1).padStart(2)} ${m} `, c: D }, { t: pad(s, 28), c: isSel ? '#ffffff' : W, inv: isSel }, { t: ' ' + a, c: G }]);
  });
  while (rows.length < 11) rows.push('');
  rows.push([{ t: 'TAB=next unread  r=reply  /=search', c: D }]);
  drawTerm(ctx, Wc, Hc, rows, { cols: 42, rows: 12, t, color: G, bg: '#02080a', glow: 6 });
}
