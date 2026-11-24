// Subtitles: cues are built from Whisper word timings (max two lines), drawn crisp on top
// of the finished frame inside the YouTube Shorts safe area. The same cues produce the .srt.
import * as THREE from 'three';
import { makeCanvas, clamp, easeOut } from '../core.js';

export const SUB = { x: 70, w: 860, top: 1170, h: 430, size: 62, lh: 78 }; // band in frame pixels
const EMPH_CYAN = new Set(['gopher', 'archie', 'wais', 'finger', 'ipx', 'x.25', 'irc', 'nntp', 'usenet’s', "usenet's", 'netware', 'novell’s', 'ftp']);
const EMPH_GREEN = new Set(['graveyard', 'languages', 'menus', 'archaeology', 'survive', 'protocols']);
const UPPER = new Set(['gopher', 'archie', 'wais', 'finger', 'ipx', 'x.25', 'irc', 'nntp']);

const bare = (w) => w.toLowerCase().replace(/[.,:;?!]+$/, '');

export class Subtitles {
  constructor(timeline) {
    this.canvas = makeCanvas(SUB.w + 120, SUB.h);
    this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.NoColorSpace;
    this.tex.minFilter = THREE.LinearFilter; this.tex.generateMipmaps = false;
    this.cues = this.build(timeline);
  }

  styleWord(w) {
    const b = bare(w);
    let txt = w;
    if (UPPER.has(b)) txt = w.toUpperCase();
    const color = EMPH_CYAN.has(b) ? '#46e6ff' : EMPH_GREEN.has(b) ? '#5dff9d' : '#ffffff';
    return { txt, color };
  }

  layoutLines(words) {
    const ctx = this.ctx;
    ctx.font = `800 ${SUB.size}px Inter`;
    const space = ctx.measureText(' ').width;
    const widths = words.map((w) => ctx.measureText(this.styleWord(w.w).txt).width);
    const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
    if (total <= SUB.w) return [words.map((_, i) => i)];
    // best balanced 2-line split
    let best = null;
    for (let k = 1; k < words.length; k++) {
      const w1 = widths.slice(0, k).reduce((a, b) => a + b, 0) + space * (k - 1);
      const w2 = widths.slice(k).reduce((a, b) => a + b, 0) + space * (words.length - k - 1);
      if (w1 > SUB.w || w2 > SUB.w) continue;
      const score = Math.abs(w1 - w2) - (/[,:;]$/.test(words[k - 1].w) ? 120 : 0);
      if (!best || score < best.score) best = { k, score };
    }
    if (!best) return null;
    return [words.slice(0, best.k).map((_, i) => i), words.slice(best.k).map((_, i) => i + best.k)];
  }

  build(tl) {
    const cues = [];
    for (const line of tl.lines) {
      const words = line.words;
      let i = 0;
      while (i < words.length) {
        // grow the cue while it fits in two lines; prefer breaking after punctuation
        let j = i + 1, lastGood = i + 1, lastPunct = -1;
        while (j <= words.length && this.layoutLines(words.slice(i, j))) {
          lastGood = j;
          if (/[,:;.?!]$/.test(words[j - 1].w) && j - i >= 3) lastPunct = j;
          if (j - i >= 7) break;
          j++;
        }
        let end = lastGood;
        if (lastPunct > 0 && lastPunct < lastGood && lastGood - lastPunct <= 3 && lastGood < words.length) end = lastPunct;
        // avoid a 1-word orphan at the end of a line
        if (words.length - end === 1 && end - i > 2) end -= 1;
        const ws = words.slice(i, end);
        cues.push({ line: line.id, words: ws, start: ws[0].start - 0.06, end: ws[ws.length - 1].end, layout: this.layoutLines(ws) });
        i = end;
      }
    }
    // hold each cue until the next one (or up to 0.6 s of silence)
    for (let k = 0; k < cues.length; k++) {
      const nxt = cues[k + 1];
      const hold = cues[k].end + 0.6;
      cues[k].end = nxt ? Math.min(Math.max(hold, cues[k].end), nxt.start - 0.02) : hold;
      if (nxt && nxt.start - cues[k].end < 0.25) cues[k].end = nxt.start - 0.02;
    }
    return cues;
  }

  text(cue) {
    return cue.layout.map((ln) => ln.map((i) => this.styleWord(cue.words[i].w).txt).join(' ')).join('\n');
  }

  draw(t, opts = {}) {
    const ctx = this.ctx, cv = this.canvas;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const cue = this.cues.find((c) => t >= c.start && t < c.end);
    if (!cue || opts.hidden) return false;
    const pop = easeOut((t - cue.start) / 0.14);
    const out = 1 - clamp((t - (cue.end - 0.08)) / 0.08);
    ctx.font = `800 ${SUB.size}px Inter`;
    ctx.textBaseline = 'alphabetic';
    const space = ctx.measureText(' ').width;
    const n = cue.layout.length;
    const blockH = n * SUB.lh;
    const y0 = (cv.height - blockH) / 2 + SUB.lh * 0.72 + (1 - pop) * 14;
    ctx.globalAlpha = pop * out;
    cue.layout.forEach((ln, li) => {
      const parts = ln.map((i) => ({ ...this.styleWord(cue.words[i].w), w: cue.words[i] }));
      const widths = parts.map((p) => ctx.measureText(p.txt).width);
      const tw = widths.reduce((a, b) => a + b, 0) + space * (parts.length - 1);
      let x = (cv.width - tw) / 2;
      const y = y0 + li * SUB.lh;
      parts.forEach((p, k) => {
        const spoken = t >= p.w.start - 0.02;
        // dark outline + soft shadow for legibility on any background
        ctx.lineJoin = 'round'; ctx.miterLimit = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.88)'; ctx.lineWidth = 11;
        ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3;
        ctx.strokeText(p.txt, x, y);
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = pop * out * (spoken ? 1 : 0.5);
        ctx.fillText(p.txt, x, y);
        ctx.globalAlpha = pop * out;
        x += widths[k] + space;
      });
    });
    ctx.globalAlpha = 1;
    return true;
  }

  // uv rect of the band inside the frame (y measured from bottom for GL)
  rect(Wf, Hf) {
    const x = (Wf - this.canvas.width) / 2 - 20; // nudge left, away from the Shorts action buttons
    return [x / Wf, 1 - (SUB.top + SUB.h) / Hf, this.canvas.width / Wf, SUB.h / Hf];
  }
}
