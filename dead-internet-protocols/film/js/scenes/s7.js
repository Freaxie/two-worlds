// SCENE 7 — THE FINAL REVEAL: every interface floats as an artefact in its own era layer;
// the camera pulls back until they are fragments of the network; CRT power-off.
import * as THREE from 'three';
import { C, W, H, smooth, wordT, sceneRange, rgba, easeOut } from '../core.js';
import { Panel } from '../engine/monitor.js';
import { drawGopher, ROOT_MENU } from '../ui/gopher.js';
import { drawArchie, drawWais } from '../ui/search.js';
import { drawTerm } from '../ui/term.js';
import { drawOfficeNet, drawX25Net } from '../ui/oldnets.js';
import { drawIrc, drawUsenet } from '../ui/alive.js';
import { fingerRows } from './s4.js';
import { title, kicker } from '../engine/overlay.js';
import { layerY } from '../engine/network.js';
import { sampleCam, applyCam } from '../engine/cam.js';

export function build(world) {
  const group = new THREE.Group();
  const frags = [
    { name: 'gopher', layer: 5, x: -5.2, z: 14, draw: (c) => drawGopher(c, 1024, 768, { t: 0.3, menu: ROOT_MENU, sel: 2, appear: 1 }) },
    { name: 'archie', layer: 5, x: 5.8, z: 6, draw: (c) => drawArchie(c, 1024, 768, 99, 90) },
    { name: 'wais', layer: 5, x: 0.6, z: -6, draw: (c) => drawWais(c, 1024, 768, { t: 0.2, typed: 1, results: 1, doc: 1 }) },
    { name: 'irc', layer: 4, x: 5.0, z: 16, draw: (c) => drawIrc(c, 1024, 768, 5, 0) },
    { name: 'ipx', layer: 3, x: -5.6, z: 8, holo: true, draw: (c) => drawOfficeNet(c, 1024, 768, 1.3, 1) },
    { name: 'usenet', layer: 2, x: 4.6, z: 12, draw: (c) => drawUsenet(c, 1024, 768, 5, 0, 0) },
    { name: 'finger', layer: 1, x: -4.4, z: 15, draw: (c) => { const { rows } = fingerRows(9, 0, 1, 0); drawTerm(c, 1024, 768, rows, { cols: 44, rows: 15, t: 0.3, color: '#dff4ff', bg: '#03070a', glow: 6 }); } },
    { name: 'x25', layer: 0, x: 3.8, z: 10, holo: true, draw: (c) => drawX25Net(c, 1024, 768, 2.1, 1, 0) },
  ];
  frags.forEach((f, i) => {
    const p = new Panel({ w: 6.0, h: 4.5, texW: 1024, texH: 768, style: f.holo ? { additive: true, transparent: true, depthWrite: false, brightness: 0.7 } : { crt: 1, curvature: 0.05, scan: 0.3, scanRows: 220, flicker: 0.6, noise: 0.03, brightness: f.name === 'wais' ? 0.55 : 1.35 } });
    f.draw(p.ctx);
    p.tex.needsUpdate = true;
    p.mesh.position.set(f.x, layerY(f.layer) + 2.5, f.z);
    p.mesh.rotation.y = -f.x * 0.035; p.mesh.rotation.z = (i % 2 ? 1 : -1) * 0.04;
    group.add(p.mesh); f.panel = p;
  });

  const [s0, s1] = sceneRange(7);
  const tLang = wordT('L17', 'languages'), tWhen = wordT('L18', 'when'), tHistory = wordT('L18', 'history');
  const tArch = wordT('L19', 'archaeology'), tCard = 83.3, tOff = 86.0;
  const cam = [
    { t: s0, pos: [-4.9, layerY(5) + 2.6, 26.6], look: [-5.1, layerY(5) + 2.4, 14], fov: 50 },
    { t: tLang + 0.2, pos: [-1.5, layerY(5) + 3.2, 40], look: [0, layerY(5) + 0.5, 4], fov: 52, ease: 'io' },
    { t: tWhen, pos: [0, layerY(3) + 6, 62], look: [0, layerY(3), 0], fov: 54, ease: 'io' },
    { t: tArch, pos: [2, 10, 150], look: [0, 0, -20], fov: 56, ease: 'io' },
    { t: tOff, pos: [3, 24, 270], look: [0, 0, -40], fov: 58, ease: 'o' },
    { t: s1, pos: [3, 25, 275], look: [0, 0, -40], fov: 58, ease: 'l' },
  ];
  world.events.push({ t: s0 + 0.1, type: 'whoosh_back', dur: 3.0 }, { t: tWhen, type: 'reveal_swell', dur: 4.0 });
  world.events.push({ t: tCard, type: 'final_hit' }, { t: tOff, type: 'crt_off' });

  function render(t, w) {
    const { camera, network, ovCtx: ctx } = w;
    network.state.global = 1; network.state.highlightLayer = -1; network.state.dimDead = 1.25;
    network.state.revive = 1; network.state.reviveOrigin.set(0, 0, 30);
    w.scene.fog.density = 0.008 - 0.0045 * smooth(s0, tArch, t); network.setFog(w.scene.fog.density);
    applyCam(camera, sampleCam(cam, t), t, 0.3);
    frags.forEach((f, i) => { f.panel.mat.uniforms.time.value = t + i; f.panel.mat.uniforms.power.value = 1; });

    kicker(ctx, 'GOPHER · ARCHIE · WAIS · FINGER · IPX · X.25 · IRC · NNTP', W / 2, 250, t, s0 + 0.3, tHistory, { size: 22, spacing: 2 });
    // final card
    if (t > tCard - 0.1) {
      title(ctx, ['THE INTERNET', 'NEVER FORGETS.'], W / 2, 900, t, tCard, tOff - 0.25, { size: 104, stagger: 0.45, glow: rgba(C.green, 0.7) });
      const a = smooth(tCard + 1.0, tCard + 1.5, t) * (1 - smooth(tOff - 0.4, tOff - 0.1, t));
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = `500 22px 'Plex Mono'`; ctx.fillStyle = rgba(C.grey, 0.95);
      ctx.fillText('SOURCES: RFC 742 · 977 · 1234 · 1288 · 1436 · 1459 · 1625 · 1689 · 3977', W / 2, 1070);
      ctx.fillText('ITU-T REC. X.25 · FULL REFERENCES IN THE DESCRIPTION', W / 2, 1104);
      ctx.restore();
    }
    const off = smooth(tOff, tOff + 0.65, t);
    return { bloom: 1.15, threshold: 0.8, ca: 1.1, grain: 0.05, scan: 0.05, vignette: 0.6, powerOff: off, fade: t > tOff + 0.7 ? 1 : 0,
      exposure: 1 - 0.35 * smooth(tCard - 0.4, tCard + 0.3, t),
      dof: { amount: 0.5, focus: 30 + 130 * easeOut((t - s0) / (tArch - s0)), range: 40 } };
  }
  return { group, render };
}
