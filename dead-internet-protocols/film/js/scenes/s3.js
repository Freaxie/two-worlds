// SCENE 3 — ARCHIE (and WAIS): SEARCH BEFORE GOOGLE
import * as THREE from 'three';
import { C, W, H, smooth, wordT, sceneRange } from '../core.js';
import { Monitor, Panel } from '../engine/monitor.js';
import { Archive } from '../engine/archive.js';
import { drawArchie, drawWais } from '../ui/search.js';
import { drawSearch } from '../ui/modern.js';
import { specimen, title, stat, pin } from '../engine/overlay.js';
import { sampleCam, applyCam, toScreen } from '../engine/cam.js';
import { makeStage, STAGE } from './stage.js';

export function build(world) {
  const { group, inner } = makeStage();
  const crt = new Monitor({ sw: 4, style: { brightness: 1.5, scanRows: 270, glow: '#ffb238' } });
  inner.add(crt.group);
  const arc = new Archive();
  inner.add(arc.group);
  const wais = new Panel({ w: 4.6, h: 3.45, texW: 1024, texH: 768, style: { brightness: 0.62, sheen: 0.3 } });
  wais.mesh.position.set(0, 3.3, -100); inner.add(wais.mesh);
  const modern = new Panel({ w: 4.6, h: 3.45, texW: 1024, texH: 768, style: { brightness: 0.6, sheen: 0.3 } });
  modern.mesh.position.set(0, 3.3, -99.9); inner.add(modern.mesh);
  const glowL = new THREE.PointLight(0x46e6ff, 0, 12, 2); glowL.position.copy(arc.hiPos).add(new THREE.Vector3(-1.5, 0, 0)); inner.add(glowL);

  const [s0, s1] = sceneRange(3);
  const tArchie = wordT('L05', 'there'), tIdx = wordT('L06', 'indexed'), tServers = wordT('L06', 'servers'), tYears = wordT('L06', 'years');
  const tWais = wordT('L07', 'wais'), tSearching = wordT('L07', 'searching'), tDocs = wordT('L07', 'documents'), tEnd7 = 31.1;
  const tA0 = s0 + 0.1; // archie session start
  const tFound = tYears + 0.1;
  const tModern = tDocs + 0.75;

  const B = STAGE, h = arc.hiPos;
  const cam = [
    { t: s0, pos: [0.7, 0.35, 9.0], look: [0.1, 0.1, 0], fov: 50 },
    { t: tIdx, pos: [0.2, 0.15, 8.1], look: [0, 0.05, 0], fov: 50, ease: 'l' },
    { t: tIdx + 0.6, pos: [0.0, 2.9, 10.2], look: [0, 2.0, -12], fov: 54, ease: 'io' },
    { t: tIdx + 1.5, pos: [0.0, 3.8, 0.5], look: [0, 3.3, -20], fov: 56, ease: 'l' },
    { t: tFound - 0.2, pos: [-0.4, 3.4, h.z + 9], look: [h.x * 0.6, h.y, h.z - 4], fov: 54, ease: 'l' },
    { t: tWais - 0.25, pos: [0.4, h.y, h.z + 3.0], look: [h.x, h.y, h.z], fov: 50, ease: 'o' },
    { t: tWais + 0.6, pos: [0, 2.75, -90.6], look: [0, 2.75, -100], fov: 50, ease: 'io' },
    { t: s1, pos: [0, 2.75, -91.3], look: [0, 2.75, -100], fov: 50, ease: 'l' },
  ].map((k) => ({ ...k, pos: [k.pos[0] + B.x, k.pos[1] + B.y, k.pos[2] + B.z], look: [k.look[0] + B.x, k.look[1] + B.y, k.look[2] + B.z] }));

  world.events.push({ t: tA0, type: 'typing', dur: 0.5 }, { t: tA0 + 0.25, type: 'typing', dur: 0.75 }, { t: tA0 + 1.05, type: 'key_enter' });
  world.events.push({ t: tA0 + 1.8, type: 'disk_seek', dur: 0.8 }, { t: tA0 + 2.6, type: 'data_burst', dur: 1.0 });
  world.events.push({ t: tIdx + 0.1, type: 'whoosh', dur: 1.3 }, { t: tIdx + 1.2, type: 'scan_sweep', dur: tFound - tIdx - 1.2 });
  world.events.push({ t: tFound, type: 'found_ping' });
  world.events.push({ t: tWais - 0.3, type: 'glitch_small' }, { t: tWais + 0.1, type: 'typing', dur: 0.8 }, { t: tWais + 0.95, type: 'results_tick', dur: 0.5 });
  world.events.push({ t: tModern - 0.05, type: 'glitch_small' }, { t: tModern + 0.1, type: 'modern_type', dur: 0.5 }, { t: tModern + 0.7, type: 'modern_chime' });

  function render(t, w) {
    const { camera, network, ovCtx: ctx } = w;
    network.state.global = 0.4; network.state.highlightLayer = 5; network.state.revive = 0;
    w.scene.fog.density = 0.0034; network.setFog(0.0034);
    applyCam(camera, sampleCam(cam, t), t, 0.05);

    drawArchie(crt.ctx, crt.canvas.width, crt.canvas.height, t, tA0);
    crt.update(t, 1);
    const scan = t > tIdx + 1.0 && t < tFound ? (t - tIdx - 1.0) / (tFound - tIdx - 1.0) : -1;
    const found = smooth(tFound, tFound + 0.35, t);
    arc.update(t, { scan, found, fog: 0.028 });
    glowL.intensity = found * 3;
    // WAIS -> modern search
    const wOn = smooth(tWais - 0.35, tWais - 0.05, t) * (1 - smooth(tModern, tModern + 0.08, t));
    wais.mesh.visible = wOn > 0;
    if (wOn > 0) {
      drawWais(wais.ctx, 1024, 768, { t, typed: smooth(tWais + 0.1, tWais + 0.9, t), results: smooth(tWais + 0.95, tWais + 1.45, t), doc: smooth(tSearching - 0.1, tDocs + 0.3, t) });
      wais.update(t, wOn);
    }
    const mOn = smooth(tModern, tModern + 0.1, t);
    modern.mesh.visible = mOn > 0;
    if (mOn > 0) { drawSearch(modern.ctx, 1024, 768, { t, query: 'forgotten internet protocols', typed: smooth(tModern + 0.1, tModern + 0.6, t), results: smooth(tModern + 0.65, s1, t) }); modern.update(t, mOn); }

    // typography
    specimen(ctx, 70, 205, 940, {
      no: '02', name: 'ARCHIE', era: '1990 · SEARCH BEFORE THE WEB', recon: true,
      rows: [['ORIGIN', 'McGill University · 1990'], ['INDEX', 'file names on anonymous FTP sites'], ['SCALE', '2.1M files · 1,200 sites (1993)']],
      status: 'ABANDONED', note: 'one legacy server kept for history', source: 'RFC 1689 (1994)',
    }, t, s0 + 0.12, tIdx - 0.1);
    title(ctx, ['SEARCHING THE INTERNET', 'BEFORE GOOGLE'], W / 2, 300, t, tIdx + 0.05, tServers + 0.2, { size: 72, stagger: 0.2 });
    stat(ctx, '2,100,000', 'FILE NAMES · 1,200 FTP SITES', 'NOV 1993 · SOURCE: RFC 1689', W / 2, 330, t, tServers + 0.35, tWais - 0.4, { size: 120 });
    if (found > 0 && t < tWais - 0.2) {
      const p = toScreen(camera, B.x + h.x - 0.65, B.y + h.y + 0.25, B.z + h.z, W, H);
      if (p) pin(ctx, p[0], p[1], 'linux-0.99.tar.gz', 'FOUND · sunsite.unc.edu /pub/Linux', found, { color: C.cyan, dx: -70, dy: -120, size: 30 });
    }
    specimen(ctx, 70, 205, 940, {
      no: '03', name: 'WAIS', era: 'EARLY 1990s · FULL-TEXT SEARCH', recon: true,
      rows: [['ORIGIN', 'Thinking Machines + Apple, Dow Jones, KPMG'], ['SPEC', 'built on Z39.50 · RFC 1625 (1994)'], ['SCALE', '~500 registered databases (1993)']],
      status: 'ABANDONED', note: 'WAIS Inc. sold to AOL, 1995', source: 'RFC 1625 · RFC 1689',
    }, t, tWais - 0.2, tWais + 1.45);
    if (mOn > 0) {
      const p = toScreen(camera, B.x, B.y + 3.3 + 1.85, B.z - 99.9, W, H);
      if (p) pin(ctx, p[0], p[1], 'TODAY: WEB SEARCH', 'crawled, ranked, instant', mOn, { color: C.cyan, dx: 0.01, dy: -150, size: 32 });
    }
    return { bloom: 1.0, threshold: 0.85, ca: 1.0, grain: 0.045, scan: 0.05, vignette: 0.55, glitch: Math.exp(-(((t - (tWais - 0.25)) / 0.06) ** 2)) * 0.6 + Math.exp(-(((t - tModern) / 0.05) ** 2)) * 0.5,
      dof: t > tIdx + 0.8 && t < tWais ? { amount: 0.75, focus: t > tFound - 0.5 ? 3.5 : 14, range: t > tFound - 0.5 ? 4 : 18 } : { amount: 0.5, focus: 8.5, range: 10 } };
  }
  return { group, render };
}
