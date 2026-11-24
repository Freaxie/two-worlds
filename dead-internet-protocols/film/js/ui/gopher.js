// Gopher client screen (curses-style, after the UMN client layout; menu semantics per RFC 1436:
// '/' suffix = directory (type 1), '<?>' = search (type 7), '<TEL>' = telnet (type 8)).
// Hostnames use the reserved .example domain: this is an illustrative reconstruction.
import { C } from '../core.js';
import { drawTerm, center } from './term.js';

export const ROOT_MENU = {
  title: 'Root gopher server: gopher.campus.example',
  items: ['About this Gopher.', 'Universities/', 'Research Papers/', 'Public Archives/', 'News/', 'Search Gopherspace (Veronica) <?>'],
};
export const RESEARCH_MENU = {
  title: 'Research Papers',
  items: ['Computer Science/', 'Physics Preprints/', 'Networking: RFCs/', 'Search Research Papers <?>', 'Reading Room <TEL>', 'Mirror at gopher.lab.example/'],
};
export const RFC_MENU = {
  title: 'Networking: RFCs',
  items: ['RFC 1436  The Internet Gopher Protocol', 'RFC 1288  The Finger User Info Protocol', 'RFC 977   Network News Transfer Protocol', 'RFC 1459  Internet Relay Chat Protocol'],
};

// state: { menu, sel, appear (0..1 lines revealed), status, t }
export function drawGopher(ctx, Wc, Hc, st) {
  const cols = 46, nrows = 18;
  const rows = [];
  rows.push([{ t: center('Internet Gopher Information Client v2.0', cols), c: C.green }]);
  rows.push('');
  rows.push([{ t: center(st.menu.title, cols), c: C.greenMid }]);
  rows.push('');
  const n = Math.floor(st.menu.items.length * (st.appear ?? 1) + 0.0001);
  st.menu.items.forEach((it, i) => {
    if (i >= n) { rows.push(''); return; }
    const num = `${i + 1}.`.padStart(3, ' ');
    const arrow = i === st.sel ? '-->' : '   ';
    const row = [{ t: ` ${arrow} `, c: C.white }, { t: `${num}  `, c: C.greenMid }];
    const isSel = i === st.sel;
    row.push({ t: it, c: isSel ? C.white : C.green, inv: isSel && st.invSel });
    rows.push(row);
  });
  while (rows.length < nrows - 2) rows.push('');
  rows.push(st.status ? [{ t: st.status, c: C.amber }] : '');
  rows.push([{ t: 'Press ? for Help, q to Quit, u to go up', c: C.greenDim }, { t: '  [1/1]', c: C.greenDim }]);
  drawTerm(ctx, Wc, Hc, rows, { cols, rows: nrows, t: st.t, glow: 7 });
}
