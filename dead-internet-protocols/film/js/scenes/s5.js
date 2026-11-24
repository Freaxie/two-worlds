// SCENE 5 — THE PROTOCOLS THAT LOST (IPX/SPX, X.25)
import * as THREE from 'three';
import { C, W, H, smooth, clamp, wordT, sceneRange, rgba, spacedText } from '../core.js';
import { Monitor, Panel } from '../engine/monitor.js';
import { makePoints } from '../engine/network.js';
import { drawDosNetware, drawLanGame, drawPad, drawOfficeNet, drawX25Net, LANGS } from '../ui/oldnets.js';
import { specimen, title, decode } from '../engine/overlay.js';
import { sampleCam, applyCam } from '../engine/cam.js';
import { makeStage, STAGE } from './stage.js';

export function build(world) {
  const { group, inner } = makeStage({ floorY: -1.6 });
  const mk = (x, z, beige, glow, ry = 0) => {
    const m = new Monitor({ sw: 2.4, texW: 640, texH: 480, beige, style: { brightness: 1.45, scanRows: 200, glow } });
    m.group.position.set(x, 0, z); m.group.rotation.y = ry; inner.add(m.group); return m;
  };
  const office = mk(-6, 0, true, '#cfd8d2', 0.15);
  const gameA = mk(2.0, 0, true, '#46e6ff', 0.12);
  const gameB = mk(4.8, -3.6, true, '#ffb238', -0.12);
  const pad = mk(12, 0, false, '#ffb238', -0.05);
  const holoOpts = { additive: true, transparent: true, brightness: 0.72, depthWrite: false };
  const officeHolo = new Panel({ w: 5.6, h: 4.2, texW: 1024, texH: 768, style: holoOpts });
  officeHolo.mesh.position.set(-4.2, 4.3, -3); inner.add(officeHolo.mesh);
  const x25Holo = new Panel({ w: 5.6, h: 4.2, texW: 1024, texH: 768, style: holoOpts });
  x25Holo.mesh.position.set(12, 4.5, -3); inner.add(x25Holo.mesh);
  // LAN cable via hub between the two game PCs
  const hub = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.6), new THREE.MeshStandardMaterial({ color: 0x8c8470, roughness: 0.7 }));
  hub.position.set(3.4, -1.45, -1.6); inner.add(hub);
  const cableA = [new THREE.Vector3(2.0, -1.4, -0.6), new THREE.Vector3(3.4, -1.45, -1.6)], cableB = [new THREE.Vector3(3.4, -1.45, -1.6), new THREE.Vector3(4.8, -1.4, -4.1)];
  const cg = new THREE.BufferGeometry().setFromPoints([...cableA, ...cableB]);
  inner.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: new THREE.Color(0.5, 1.4, 1.6), transparent: true, blending: THREE.AdditiveBlending })));
  const pkts = makePoints(6); pkts.material.uniforms.fogDensity.value = 0.01; inner.add(pkts);

  const [s0, s1] = sceneRange(5);
  const tIPX = wordT('L11', 'ipx'), tOffice = wordT('L11', 'office'), tMulti = wordT('L11', 'multiplayer'), tX25 = wordT('L12', 'x.25');
  const tAcross = wordT('L12', 'across'), tDiff1 = wordT('L13', 'different', 'start', 0), tDiff2 = wordT('L13', 'different', 'start', 1), tDiff3 = wordT('L13', 'different', 'start', 2);
  const tDos = s0 + 0.1, tPad = tX25 + 0.05;

  const B = STAGE;
  const cam = [
    { t: s0, pos: [-8.3, 0.55, 5.6], look: [-6, 0.15, 0], fov: 50 },
    { t: tIPX - 0.2, pos: [-6.6, 0.9, 6.2], look: [-5.9, 0.4, 0], fov: 50, ease: 'l' },
    { t: tIPX + 0.7, pos: [-4.2, 3.6, 9.4], look: [-4.2, 4.85, -3], fov: 52, ease: 'io' },
    { t: tMulti - 0.45, pos: [-4.0, 3.5, 8.8], look: [-4.2, 4.75, -3], fov: 52, ease: 'l' },
    { t: tMulti + 0.25, pos: [1.6, 0.9, 6.9], look: [3.4, 0.0, -1.7], fov: 52, ease: 'io' },
    { t: tX25 - 0.3, pos: [1.9, 0.8, 6.4], look: [3.4, 0.0, -1.7], fov: 52, ease: 'l' },
    { t: tX25 + 0.35, pos: [12.0, 0.3, 6.1], look: [12, 0.1, 0], fov: 50, ease: 'io' },
    { t: tAcross - 0.4, pos: [12.0, 0.25, 5.6], look: [12, 0.1, 0], fov: 50, ease: 'l' },
    { t: tAcross + 0.4, pos: [12.0, 4.0, 9.4], look: [12, 4.9, -3], fov: 52, ease: 'io' },
    { t: tDiff1 - 0.1, pos: [12.0, 4.0, 8.9], look: [12, 4.85, -3], fov: 52, ease: 'l' },
    { t: tDiff1 + 1.1, pos: [3.0, 3.4, 25], look: [3.0, 1.6, -2], fov: 55, ease: 'io' },
    { t: s1, pos: [3.0, 3.8, 29], look: [3.0, 1.6, -2], fov: 55, ease: 'l' },
  ].map((k) => ({ ...k, pos: [k.pos[0] + B.x, k.pos[1] + B.y, k.pos[2] + B.z], look: [k.look[0] + B.x, k.look[1] + B.y, k.look[2] + B.z] }));

  world.events.push({ t: tDos, type: 'typing', dur: 1.2 }, { t: tDos + 0.2, type: 'disk_seek', dur: 0.9 });
  world.events.push({ t: tIPX + 0.1, type: 'whoosh', dur: 0.7 }, { t: tIPX + 0.6, type: 'holo_on' }, { t: tIPX + 0.8, type: 'lan_chatter', dur: 3.0 });
  world.events.push({ t: tMulti - 0.4, type: 'whoosh', dur: 0.6 }, { t: tMulti + 0.15, type: 'game_zaps', dur: tX25 - tMulti - 0.3 });
  world.events.push({ t: tX25 - 0.25, type: 'whoosh', dur: 0.6 }, { t: tPad + 0.2, type: 'typing', dur: 0.95 }, { t: tPad + 1.2, type: 'key_enter' }, { t: tPad + 1.3, type: 'x25_call', dur: 0.9 });
  world.events.push({ t: tAcross + 0.2, type: 'holo_on' }, { t: tAcross + 0.4, type: 'x25_data', dur: 2.0 });
  [tDiff1, tDiff2, tDiff3].forEach((tt, i) => world.events.push({ t: tt, type: 'slam', i }));
  world.events.push({ t: tDiff3 + 0.6, type: 'break_apart', dur: 1.4 });

  function render(t, w) {
    const { camera, network, ovCtx: ctx } = w;
    network.state.global = 0.35; network.state.highlightLayer = 3; network.state.revive = 0;
    w.scene.fog.density = 0.0034; network.setFog(0.0034);
    applyCam(camera, sampleCam(cam, t), t, 0.06);

    const broken = smooth(tDiff3 + 0.5, s1 - 0.2, t);
    drawDosNetware(office.ctx, 640, 480, t, tDos); office.update(t, 1);
    drawLanGame(gameA.ctx, 640, 480, t, 1); gameA.update(t, 1);
    drawLanGame(gameB.ctx, 640, 480, t + 0.04, 2); gameB.update(t, 1);
    drawPad(pad.ctx, 640, 480, t, tPad); pad.update(t, 1);
    drawOfficeNet(officeHolo.ctx, 1024, 768, t, smooth(tIPX + 0.3, tIPX + 0.9, t) * (1 - broken * 0.85));
    officeHolo.update(t, 1);
    drawX25Net(x25Holo.ctx, 1024, 768, t, smooth(tAcross, tAcross + 0.5, t) * (1 - broken * 0.6), broken);
    x25Holo.update(t, 1);
    // packets on the LAN cable
    const pa = pkts.geometry.attributes;
    for (let k = 0; k < 6; k++) {
      const u = (t * 0.8 + k / 6) % 1, seg = k % 2 ? cableA : cableB;
      const p = seg[0].clone().lerp(seg[1], k % 3 ? u : 1 - u);
      pa.position.setXYZ(k, p.x, p.y + 0.05, p.z); pa.size.setX(k, broken > 0.3 ? 0 : 0.6); pa.color.setXYZ(k, 0.6, 1.8, 2.2);
    }
    pa.position.needsUpdate = true; pa.size.needsUpdate = true; pa.color.needsUpdate = true;

    // typography
    title(ctx, ['THE PROTOCOLS', 'THAT LOST'], W / 2, 330, t, s0 + 0.15, tIPX - 0.15, { size: 88, stagger: 0.2 });
    specimen(ctx, 70, 205, 940, {
      no: '05', name: 'IPX/SPX', era: '1980s–90s · OFFICE LANS & LAN PARTIES', recon: true,
      rows: [['ORIGIN', 'Novell NetWare · from Xerox XNS'], ['WIRE', '30-byte header · network:node:socket'], ['FATE', 'IP took over · NetWare 5 went IP (1998)']],
      status: 'OBSOLETE', note: 'IETF: IPX-over-IP RFCs Historic', source: 'RFC 1234 · RFC 1552 · Novell AppNotes',
    }, t, tIPX + 0.05, tOffice - 0.15);
    specimen(ctx, 70, 205, 940, {
      no: '06', name: 'X.25', era: '1976 · THE PHONE COMPANIES’ DATA NETWORKS', recon: true,
      rows: [['ORIGIN', 'CCITT (now ITU-T) · 1976'], ['WIRE', 'virtual circuits between switches'], ['FATE', 'displaced by Frame Relay, then IP']],
      status: 'OBSOLETE', note: 'legacy pockets remain', source: 'ITU-T Rec. X.25 · RFC 877 · RFC 1356',
    }, t, tX25 + 0.05, tDiff1 - 0.15);
    // three languages
    if (t > tDiff1 - 0.05) {
      title(ctx, ['OLD NETWORKS.', 'OLD RULES.'], W / 2, 300, t, tDiff1 + 0.2, s1, { size: 84, stagger: 0.35 });
      const starts = [tDiff1, tDiff2, tDiff3];
      LANGS.forEach((L, i) => {
        const t0 = starts[i];
        if (t < t0) return;
        const a = smooth(t0, t0 + 0.2, t) * (1 - smooth(s1 - 0.25, s1, t));
        const y = 610 + i * 175;
        const slide = (1 - smooth(t0, t0 + 0.3, t)) * (i % 2 ? 140 : -140);
        ctx.save(); ctx.globalAlpha = a; ctx.translate(slide, 0);
        ctx.fillStyle = 'rgba(2,6,5,0.78)'; ctx.fillRect(60, y - 62, 960, 150);
        ctx.fillStyle = L.col; ctx.fillRect(60, y - 62, 8, 150);
        ctx.font = `900 46px Inter`; ctx.shadowColor = L.col; ctx.shadowBlur = 14; ctx.textBaseline = 'alphabetic';
        spacedText(ctx, L.name, 92, y - 8, 2);
        ctx.shadowBlur = 0; ctx.font = `500 30px 'Plex Mono'`;
        ctx.fillText(decode(L.bytes, t, t0 + 0.05, 0.5, 31 + i), 92, y + 38);
        ctx.font = `500 20px 'Plex Mono'`; ctx.fillStyle = rgba('#c8d6d0', 0.8);
        ctx.fillText(L.legend, 92, y + 74);
        ctx.restore();
      });
    }
    return { bloom: 1.05, threshold: 0.85, ca: 1.1, grain: 0.045, scan: 0.05, vignette: 0.55, exposure: 1 - 0.3 * smooth(tDiff1, tDiff1 + 0.6, t),
      glitch: broken > 0 ? broken * 0.25 * (Math.sin(t * 40) > 0.6 ? 1 : 0.2) : 0,
      dof: { amount: 0.5, focus: t > tDiff1 ? 26 : 8, range: t > tDiff1 ? 20 : 8 } };
  }
  return { group, render };
}
