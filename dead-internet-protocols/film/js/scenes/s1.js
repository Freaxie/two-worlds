// SCENE 1 — THE INTERNET GRAVEYARD
// Darkness -> CRT powers on -> protocol probe fails (CONNECTION LOST / PROTOCOL NOT FOUND)
// -> camera pulls back through flickering, dying cables -> reveal of the protocol strata.
import * as THREE from 'three';
import { C, W, H, clamp, smooth, wordT, sceneRange, rgba, mulberry32 } from '../core.js';
import { Monitor } from '../engine/monitor.js';
import { drawTerm, typeRows } from '../ui/term.js';
import { title, kicker } from '../engine/overlay.js';
import { STRATA, layerY } from '../engine/network.js';
import { sampleCam, applyCam, toScreen } from '../engine/cam.js';

export function build(world) {
  const group = new THREE.Group();
  const mon = new Monitor({ sw: 4, style: { brightness: 1.55, scanRows: 250, glow: '#3dff8b' } });
  group.add(mon.group);
  const [, s1End] = sceneRange(1);
  const tL01 = wordT('L01', 'the'), tHas = wordT('L01', 'has');

  // terminal script
  const tA = 0.75, tLost = 1.75, tProbe2 = 1.95, tNotFound = 2.55, tFast = 2.85;
  const R = C.red, A = C.amber;
  const lines = [
    { at: tA, text: [{ t: 'ARCHIVE-NET 4.3', c: C.green }, { t: '         DEEP TRACE', c: C.greenMid }] },
    { at: tA + 0.05, text: [{ t: '─'.repeat(38), c: C.greenDim }] },
    { at: 1.0, cps: 38, text: [{ t: '> probe gopher  :70  ' }, { t: '.........', c: C.greenMid }] },
    { at: tLost, text: [{ t: '  CONNECTION LOST', c: R, blink: false }] },
    { at: tProbe2, cps: 40, text: [{ t: '> probe finger  :79  ' }, { t: '.........', c: C.greenMid }] },
    { at: tNotFound, text: [{ t: ' ' }, { t: ' PROTOCOL NOT FOUND ', c: A, inv: true }] },
    { at: tFast, cps: 90, text: [{ t: '> probe wais      ........ NO ROUTE' }] },
    { at: tFast + 0.3, cps: 90, text: [{ t: '> probe archie    ........ NO ROUTE' }] },
    { at: tFast + 0.6, cps: 90, text: [{ t: '> probe ipx/spx   ........ NO STACK' }] },
    { at: tFast + 0.9, cps: 90, text: [{ t: '> probe x.25      ........ NO CARRIER' }] },
    { at: tFast + 1.2, text: [{ t: '> ' }] },
  ];

  // cables near the flight path flicker and die between 3.1 s and 7.8 s
  const rnd = mulberry32(5);
  const cand = world.network.edgesNear(new THREE.Vector3(0, 0, 25), 75, (e) => e.layer >= 2 && e.layer <= 5);
  const kills = [];
  cand.forEach((ei) => { if (rnd() < 0.55) kills.push({ edge: ei, t: 3.1 + rnd() * 4.7 }); });
  world.network.scheduleDeaths(kills);

  const cam = [
    { t: 0.0, pos: [0, 0.05, 8.4], look: [0, 0.05, 0], fov: 50 },
    { t: 2.9, pos: [0, 0.05, 7.7], look: [0, 0.05, 0], fov: 50, ease: 'l' },
    { t: 5.3, pos: [1.5, 3.0, 62], look: [0, 0.5, -10], fov: 52, ease: 'io' },
    { t: s1End, pos: [3, 30, 185], look: [0, -2, -40], fov: 54, ease: 'o' },
  ];

  // audio cues
  world.events.push({ t: 0.22, type: 'crt_on' }, { t: 0.35, type: 'hum_start' });
  world.events.push({ t: 1.0, type: 'typing', dur: 0.75 }, { t: tProbe2, type: 'typing', dur: 0.55 });
  world.events.push({ t: tLost, type: 'error_beep' }, { t: tNotFound, type: 'glitch_hit' });
  world.events.push({ t: tFast, type: 'data_burst', dur: 1.2 });
  world.events.push({ t: 2.95, type: 'whoosh_back', dur: 2.4 });
  kills.filter((k, i) => i % 6 === 0).forEach((k) => world.events.push({ t: k.t, type: 'spark', gain: 0.5 }));
  world.events.push({ t: 5.3, type: 'reveal_swell', dur: 3.2 });

  function render(t, w) {
    const { camera, network, ovCtx: ctx } = w;
    // network emerges from darkness after the probe fails
    network.state.global = smooth(2.3, 4.4, t);
    network.state.highlightLayer = -1; network.state.revive = 0; network.state.dimDead = 1;
    w.scene.fog.density = 0.02 - 0.0125 * smooth(3.0, 8.0, t);
    network.setFog(w.scene.fog.density);
    applyCam(camera, sampleCam(cam, t), t, t > 3 ? 0.4 : 0.05);

    // terminal
    const rows = typeRows(lines, t);
    const nRows = 14;
    const visible = rows.slice(Math.max(0, rows.length - nRows));
    drawTerm(mon.ctx, mon.canvas.width, mon.canvas.height, visible, { cols: 38, rows: nRows, t, cursor: rows.length >= 2 ? { r: visible.length - 1, c: Math.min(37, (visible[visible.length - 1] || []).reduce((a, s) => a + s.t.length, 0)) } : null });
    mon.update(t, 1);

    // typography: hook title
    const tEnd = 5.4;
    kicker(ctx, 'AN INTERNET ARCHAEOLOGY', W / 2, 250, t, 0.8, tEnd, { size: 28, color: C.green });
    title(ctx, ['THE INTERNET'], W / 2, 372, t, tL01, tEnd, { size: 92 });
    title(ctx, ['HAS A GRAVEYARD.'], W / 2, 474, t, tHas, tEnd, { size: 80, colors: [C.white] });

    // strata legend: era labels pinned to each layer
    if (t > 5.4) {
      STRATA.forEach((L, i) => {
        const p = toScreen(camera, -38, layerY(i), 20, W, H);
        if (!p) return;
        const a = smooth(5.5 + (i * 0.18), 5.9 + i * 0.18, t);
        if (a <= 0) return;
        const dead = L.alive < 0.1;
        const col = L.key === 'web' || L.key === 'now' ? C.cyan : dead ? (L.col[0] > 0.9 ? C.amber : C.green) : C.green;
        ctx.save(); ctx.globalAlpha = a * (dead ? 0.85 : 1);
        ctx.strokeStyle = rgba(col, 0.5); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(70 + 300, p[1]); ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, 7); ctx.fill();
        ctx.font = `700 30px 'Plex Mono'`; ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.textBaseline = 'middle';
        ctx.fillText(L.label, 70, p[1] - 17);
        ctx.shadowBlur = 0; ctx.font = `500 22px 'Plex Mono'`; ctx.fillStyle = rgba(col, 0.75);
        ctx.fillText(L.era, 70, p[1] + 17);
        ctx.restore();
      });
    }

    const powerOn = clamp((t - 0.22) / 0.55);
    const gl = Math.exp(-(((t - tLost) / 0.05) ** 2)) * 0.55 + Math.exp(-(((t - tNotFound) / 0.06) ** 2)) * 0.75;
    return {
      powerOn: t < 0.22 ? 0 : powerOn, bloom: 1.1, threshold: 0.82, ca: 1.2, grain: 0.05, scan: 0.06, vignette: 0.55,
      glitch: gl, hideSubs: t < tHas + 1.2,
      dof: t > 3.0 ? { amount: 0.55 * smooth(3.0, 4.0, t), focus: 40 + 120 * smooth(4.5, 8.5, t), range: 60 } : null,
    };
  }
  return { group, render };
}
