// SCENE 4 — FINGER: WHEN THE INTERNET WAS PERSONAL
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { C, W, H, smooth, clamp, wordT, sceneRange, lerp } from '../core.js';
import { Monitor } from '../engine/monitor.js';
import { makePoints } from '../engine/network.js';
import { drawTerm } from '../ui/term.js';
import { drawChat } from '../ui/modern.js';
import { specimen, title, quote, pin } from '../engine/overlay.js';
import { sampleCam, applyCam, toScreen } from '../engine/cam.js';
import { makeStage, STAGE } from './stage.js';

const WHITE = '#dff4ff';

export function fingerRows(t, tType, tResp, hl) {
  const cmd = 'finger alex@lab.example.edu';
  const n = clamp(Math.floor((t - tType) * 26), 0, cmd.length);
  const rows = [[{ t: '% ', c: WHITE }, { t: cmd.slice(0, n), c: '#ffffff' }]];
  if (t < tResp) return { rows, cursor: { r: 0, c: 2 + n } };
  const resp = [
    ['[lab.example.edu]', 0],
    ['Login: alex                Name: Alex', 1],
    ['Directory: /home/alex      Shell: /bin/csh', 0],
    ['Last login Mon Nov 22 21:14 on ttyp2', 2],
    ['No unread mail.', 0],
    ['Project: compiling the kernel', 0],
    ['Plan:', 3],
    ['  back after the coffee machine is fixed.', 3],
    ['', 0],
  ];
  const shown = Math.floor((t - tResp) * 22);
  resp.slice(0, shown).forEach(([s, k]) => rows.push([{ t: s, c: k && hl === k ? '#ffffff' : WHITE, inv: k !== 0 && hl === k }]));
  if (shown >= resp.length) rows.push([{ t: '% ', c: WHITE }]);
  return { rows, cursor: shown >= resp.length ? { r: rows.length - 1, c: 2 } : null };
}

export function build(world) {
  const { group, inner } = makeStage();
  const crt = new Monitor({ sw: 4, style: { brightness: 1.35, scanRows: 270, glow: '#bfe6ff' } });
  inner.add(crt.group);
  // route to the remote host
  const route = [[0, 0.6, 0.8], [2.6, 1.6, -2.8], [5.2, 0.7, -6.6], [7.4, 1.4, -10.6], [9.2, 0.6, -14.2]].map((p) => new THREE.Vector3(...p));
  const segs = [];
  for (let i = 0; i < route.length - 1; i++) segs.push(...route[i].toArray(), ...route[i + 1].toArray());
  const lg = new LineSegmentsGeometry(); lg.setPositions(segs);
  const lcol = new Float32Array((route.length - 1) * 6); lg.setColors(lcol);
  const lm = new LineMaterial({ linewidth: 3.0, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, worldUnits: false });
  lm.resolution.set(W, H);
  const line = new LineSegments2(lg, lm); line.frustumCulled = false; inner.add(line);
  const pts = makePoints(route.length + 1);
  route.forEach((p, i) => { pts.geometry.attributes.position.setXYZ(i, p.x, p.y, p.z); pts.geometry.attributes.size.setX(i, i === 0 || i === route.length - 1 ? 0 : 0.9); pts.geometry.attributes.color.setXYZ(i, 0.3, 0.9, 0.6); });
  pts.material.uniforms.fogDensity.value = 0.01;
  inner.add(pts);
  // remote server cabinet
  const srv = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.6, 1.4), new THREE.MeshStandardMaterial({ color: 0x1b1f22, roughness: 0.5, metalness: 0.6 }));
  srv.add(body);
  const leds = [];
  for (let i = 0; i < 12; i++) {
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.02), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    led.position.set(-0.6 + (i % 4) * 0.4, 1.2 - Math.floor(i / 4) * 0.35, 0.71); srv.add(led); leds.push(led);
  }
  srv.position.copy(route[route.length - 1]).add(new THREE.Vector3(0.9, -0.6, -0.6));
  srv.rotation.y = -0.5;
  inner.add(srv);
  const srvLight = new THREE.PointLight(0x46e6ff, 0, 8, 2); srvLight.position.copy(srv.position).add(new THREE.Vector3(-1.2, 0.8, 1.5)); inner.add(srvLight);

  const [s0, s1] = sceneRange(4);
  const tFinger = wordT('L08', 'finger'), tAsk = wordT('L09', 'ask'), tUser = wordT('L09', 'user'), tSometimes = wordT('L09', 'sometimes');
  const tLogin = wordT('L09', 'login'), tStatus = wordT('L09', 'status'), tPersonal = wordT('L09', 'personal'), tMsgEnd = 40.93;
  const tType = s0 + 0.35, tSend = tAsk, tArrive = tSend + 1.15, tReply = tArrive + 0.25, tBack = tReply + 1.1, tResp = Math.max(tBack, tSometimes - 0.25);
  const tChat = tMsgEnd - 0.55;

  const B = STAGE;
  const cam = [
    { t: s0, pos: [0.8, 0.45, 9.3], look: [0.1, 0.1, 0], fov: 50 },
    { t: tAsk - 0.3, pos: [0.25, 0.15, 8.4], look: [0, 0.05, 0], fov: 50, ease: 'l' },
    { t: tAsk + 0.7, pos: [-3.8, 3.2, 9.8], look: [4.6, 0.3, -6.8], fov: 56, ease: 'io' },
    { t: tBack - 0.15, pos: [-2.6, 2.4, 8.2], look: [4.2, 0.2, -6.4], fov: 56, ease: 'l' },
    { t: tResp + 0.35, pos: [0.1, 0.05, 8.25], look: [0, 0.0, 0], fov: 50, ease: 'io' },
    { t: s1, pos: [0.0, 0.0, 7.7], look: [0, 0.0, 0], fov: 50, ease: 'l' },
  ].map((k) => ({ ...k, pos: [k.pos[0] + B.x, k.pos[1] + B.y, k.pos[2] + B.z], look: [k.look[0] + B.x, k.look[1] + B.y, k.look[2] + B.z] }));

  world.events.push({ t: tType, type: 'typing', dur: 1.05 }, { t: tType + 1.1, type: 'key_enter' });
  world.events.push({ t: tSend, type: 'packet_out', dur: tArrive - tSend }, { t: tArrive, type: 'server_blip' }, { t: tReply, type: 'packet_in', dur: tBack - tReply });
  world.events.push({ t: tResp, type: 'printout', dur: 0.45 });
  for (const tt of [tLogin, tStatus, tPersonal]) world.events.push({ t: tt, type: 'highlight' });
  world.events.push({ t: tChat, type: 'modern_chime' });

  const pathPoint = (u) => {
    const n = route.length - 1, f = clamp(u) * n, i = Math.min(Math.floor(f), n - 1);
    return route[i].clone().lerp(route[i + 1], f - i);
  };

  function render(t, w) {
    const { camera, network, ovCtx: ctx } = w;
    network.state.global = 0.35; network.state.highlightLayer = 1; network.state.revive = 0;
    w.scene.fog.density = 0.0034; network.setFog(0.0034);
    applyCam(camera, sampleCam(cam, t), t, 0.05);

    // screen: finger session, then a modern messenger takes over the tube
    const hl = t > tPersonal - 0.05 ? 3 : t > tStatus - 0.05 ? 2 : t > tLogin - 0.05 ? 1 : 0;
    const chatMix = smooth(tChat, tChat + 0.45, t);
    if (chatMix < 1) {
      const { rows, cursor } = fingerRows(t, tType, tResp, hl);
      drawTerm(crt.ctx, crt.canvas.width, crt.canvas.height, rows, { cols: 44, rows: 15, t, color: WHITE, bg: '#03070a', glow: 6, cursor });
    }
    if (chatMix > 0) {
      crt.ctx.save(); crt.ctx.globalAlpha = chatMix;
      drawChat(crt.ctx, crt.canvas.width, crt.canvas.height, { t: t - tChat, typing: true });
      crt.ctx.restore();
    }
    crt.mat.uniforms.crt.value = 1 - chatMix * 0.8;
    crt.mat.uniforms.brightness.value = lerp(1.35, 0.85, chatMix);
    crt.update(t, 1);

    // route: request out (green), response back (cyan)
    const out = clamp((t - tSend) / (tArrive - tSend)), back = clamp((t - tReply) / (tBack - tReply));
    const lit = smooth(tSend - 0.3, tSend, t) * (1 - smooth(tResp + 0.5, tResp + 1.2, t));
    for (let i = 0; i < route.length - 1; i++) {
      const v = 0.35 * lit + (out * (route.length - 1) > i ? 0.6 : 0) * lit;
      lcol.set([0.3 * v, 1.0 * v, 0.6 * v, 0.3 * v, 1.0 * v, 0.6 * v], i * 6);
    }
    lg.attributes.instanceColorStart.data.needsUpdate = true;
    const pk = pts.geometry.attributes;
    const sending = t > tSend && t < tArrive, replying = t > tReply && t < tBack;
    if (sending || replying) {
      const p = sending ? pathPoint(out) : pathPoint(1 - back);
      pk.position.setXYZ(route.length, p.x, p.y, p.z); pk.size.setX(route.length, 1.7);
      if (sending) pk.color.setXYZ(route.length, 0.6, 2.4, 1.1); else pk.color.setXYZ(route.length, 0.6, 1.9, 2.6);
    } else pk.size.setX(route.length, 0);
    pk.position.needsUpdate = true; pk.size.needsUpdate = true; pk.color.needsUpdate = true;
    const busy = t > tArrive - 0.1 && t < tReply + 0.5;
    leds.forEach((l, i) => l.material.color.setRGB(0.1, busy && Math.floor(t * 18 + i * 3) % 3 === 0 ? 3 : 0.5, busy ? 1.6 : 0.3));
    srvLight.intensity = busy ? 2.5 : 0.4;

    // typography
    specimen(ctx, 70, 205, 940, {
      no: '04', name: 'FINGER', era: 'WHO IS ONLINE? ASK THE MACHINE', recon: true,
      rows: [['ORIGIN', 'Stanford AI Lab (SAIL) · Les Earnest'], ['SPEC', 'RFC 742 (1977) → RFC 1288 (1991)'], ['WIRE', 'send a name to TCP port 79']],
      status: 'OBSOLETE', note: 'mostly switched off', source: 'RFC 742 · RFC 1288',
    }, t, s0 + 0.12, tAsk - 0.15);
    title(ctx, ['A DIFFERENT ERA', 'OF ONLINE IDENTITY'], W / 2, 330, t, tAsk + 0.05, tSometimes - 0.2, { size: 80, stagger: 0.22 });
    if (t > tSend - 0.2 && t < tBack + 0.3) {
      const a = smooth(tSend - 0.2, tSend + 0.1, t) * (1 - smooth(tBack, tBack + 0.3, t));
      const ps = toScreen(camera, B.x + 9.2, B.y + 2.2, B.z - 14.6, W, H);
      if (ps) pin(ctx, ps[0], ps[1], 'lab.example.edu : 79', 'remote host', a, { color: C.cyan, dx: -60, dy: -80, size: 28 });
      const pp = sending ? pathPoint(out) : replying ? pathPoint(1 - back) : null;
      if (pp) {
        const q = toScreen(camera, B.x + pp.x, B.y + pp.y, B.z + pp.z, W, H);
        if (q) pin(ctx, q[0], q[1], sending ? '→ "alex⏎"' : '← user info', sending ? 'query' : 'plain text reply', a, { color: sending ? C.green : C.cyan, dx: 50, dy: 70, size: 28 });
      }
    }
    quote(ctx, 'Warning!! Finger discloses information about users', 'RFC 1288 · SECTION 3.2 · 1991', 70, 240, 940, t, tLogin - 0.35, tChat - 0.05, { size: 40, color: '#ff5b6b', cps: 50 });
    if (chatMix > 0) {
      const p = toScreen(camera, B.x, B.y + 1.95, B.z, W, H);
      if (p) pin(ctx, p[0], p[1], 'TODAY: PRESENCE', 'online · status · last seen', chatMix, { color: C.cyan, dx: 0.01, dy: -110, size: 32 });
    }
    return { bloom: 1.0, threshold: 0.85, ca: 1.0, grain: 0.045, scan: 0.05, vignette: 0.55, dof: { amount: 0.5, focus: t > tAsk && t < tResp ? 12 : 8.3, range: 10 } };
  }
  return { group, render };
}
