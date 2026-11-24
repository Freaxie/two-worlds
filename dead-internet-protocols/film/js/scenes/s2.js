// SCENE 2 — GOPHER: THE INTERNET BEFORE THE WEB
import * as THREE from 'three';
import { C, W, H, smooth, wordT, sceneRange, rgba } from '../core.js';
import { Monitor, Panel } from '../engine/monitor.js';
import { drawGopher, ROOT_MENU, RESEARCH_MENU } from '../ui/gopher.js';
import { drawWebpage } from '../ui/modern.js';
import { specimen, title, kicker, pin } from '../engine/overlay.js';
import { sampleCam, applyCam, toScreen } from '../engine/cam.js';
import { makeStage, STAGE } from './stage.js';

export function build(world) {
  const { group, inner } = makeStage();
  const crt = new Monitor({ sw: 4, style: { brightness: 1.55, scanRows: 270 } });
  inner.add(crt.group);
  // modern flat panel
  const lcd = new Panel({ w: 4.8, h: 3.0, texW: 1280, texH: 800, style: { brightness: 0.6, sheen: 0.4 } });
  const lcdG = new THREE.Group();
  lcdG.add(lcd.mesh);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(4.95, 3.15, 0.12), new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.4, metalness: 0.5 }));
  frame.position.z = -0.07; lcdG.add(frame);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.15), new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.35, metalness: 0.7 }));
  stand.position.set(0, -2.05, -0.2); lcdG.add(stand);
  lcdG.position.set(7.4, 0.25, -1.4); lcdG.rotation.y = -0.38;
  inner.add(lcdG);
  const lcdLight = new THREE.PointLight(0xd06cff, 1.6, 9, 2); lcdLight.position.set(7, 0.3, 1.5); inner.add(lcdLight);

  const [s0, s1] = sceneRange(2);
  const tInstead = wordT('L04', 'instead'), tClick = wordT('L04', 'clicking'), tYou = wordT('L04', 'you'), tNav = wordT('L04', 'navigated');
  const tMenus = wordT('L04', 'menus');
  const k1 = tNav + 0.15, k2 = tNav + 0.5, enter1 = tNav + 0.95, menu2 = enter1 + 0.6, k3 = menu2 + 0.45, k4 = menu2 + 0.8, enter2 = Math.min(s1 - 0.5, menu2 + 1.3);

  const B = STAGE;
  const cam = [
    { t: s0, pos: [0.9, 0.55, 9.6], look: [0.1, 0.15, 0], fov: 50 },
    { t: tClick - 0.1, pos: [0.3, 0.3, 8.7], look: [0, 0.1, 0], fov: 50, ease: 'l' },
    { t: tClick + 0.65, pos: [6.0, 0.5, 9.2], look: [7.2, 0.25, -1.3], fov: 50, ease: 'io' },
    { t: tYou - 0.2, pos: [6.3, 0.45, 8.9], look: [7.3, 0.25, -1.3], fov: 50, ease: 'l' },
    { t: tNav + 0.35, pos: [0.1, 0.1, 8.3], look: [0, 0.05, 0], fov: 50, ease: 'io' },
    { t: s1 - 0.6, pos: [0.0, 0.0, 7.4], look: [0, 0.0, 0], fov: 50, ease: 'l' },
    { t: s1, pos: [0.0, 0.6, 9.5], look: [0, 0.0, 0], fov: 52, ease: 'i' },
  ].map((k) => ({ ...k, pos: [k.pos[0] + B.x, k.pos[1] + B.y, k.pos[2] + B.z], look: [k.look[0] + B.x, k.look[1] + B.y, k.look[2] + B.z] }));

  world.events.push({ t: s0 + 0.05, type: 'crt_on', gain: 0.5 }, { t: s0 + 0.15, type: 'menu_draw', dur: 0.7 });
  world.events.push({ t: tClick - 0.1, type: 'whoosh', dur: 0.7 }, { t: tClick + 0.55, type: 'modern_chime' });
  world.events.push({ t: tYou - 0.2, type: 'whoosh', dur: 0.6 });
  for (const k of [k1, k2, k3, k4]) world.events.push({ t: k, type: 'key' });
  world.events.push({ t: enter1, type: 'key_enter' }, { t: enter1 + 0.05, type: 'connect', dur: 0.55 }, { t: menu2, type: 'menu_draw', dur: 0.35 });
  world.events.push({ t: enter2, type: 'key_enter' }, { t: enter2 + 0.05, type: 'connect', dur: 0.4 });

  function render(t, w) {
    const { camera, network, ovCtx: ctx } = w;
    network.state.global = 0.55; network.state.highlightLayer = 5; network.state.revive = 0;
    w.scene.fog.density = 0.0034; network.setFog(0.0034);
    applyCam(camera, sampleCam(cam, t), t, 0.06);

    // gopher screen state
    const st = { t, menu: ROOT_MENU, sel: 0, appear: smooth(s0 + 0.1, s0 + 0.75, t), status: '' };
    if (t > k1) st.sel = 1;
    if (t > k2) st.sel = 2;
    if (t > enter1 && t < menu2) st.status = 'Connecting to gopher.lab.example ...';
    if (t > menu2) { st.menu = RESEARCH_MENU; st.sel = 0; st.appear = smooth(menu2, menu2 + 0.35, t); }
    if (t > k3) st.sel = 1;
    if (t > k4) st.sel = 2;
    if (t > enter2) st.status = 'Connecting to gopher.lab.example ...';
    drawGopher(crt.ctx, crt.canvas.width, crt.canvas.height, st);
    crt.update(t, 1);
    // modern page
    const pageOn = smooth(tClick - 0.5, tClick, t);
    drawWebpage(lcd.ctx, lcd.canvas.width, lcd.canvas.height, { t, scroll: 140 * smooth(tClick + 0.6, tYou, t), hover: smooth(tClick + 0.9, tClick + 1.2, t), cursor: [300 + 120 * smooth(tClick + 0.4, tClick + 1.0, t), 520 - 160 * smooth(tClick + 0.4, tClick + 1.0, t)] });
    lcd.update(t, pageOn);

    // typography
    specimen(ctx, 70, 205, 940, {
      no: '01', name: 'GOPHER', era: 'EARLY 1990s · MENUS, NOT PAGES', recon: true,
      rows: [['ORIGIN', 'Univ. of Minnesota · 1991'], ['SPEC', 'RFC 1436 (1993) · TCP port 70'], ['SCALE', '2,200+ servers by Nov 1993']],
      status: 'NICHE', note: 'hobbyist servers still online', source: 'RFC 1436 · RFC 1689',
    }, t, s0 + 0.15, tClick - 0.15);
    // then vs now labels pinned above the screens
    const aLbl = smooth(tClick + 0.3, tClick + 0.6, t) * (1 - smooth(tYou, tYou + 0.3, t));
    if (aLbl > 0) {
      const pc = toScreen(camera, B.x, B.y + 2.6, B.z, W, H), pl = toScreen(camera, B.x + 7.4, B.y + 2.15, B.z - 1.4, W, H);
      if (pl) pin(ctx, pl[0], pl[1], 'TODAY: PAGES', 'colour · images · video', aLbl, { color: C.cyan, dx: -60, dy: -70, size: 32 });
      if (pc) pin(ctx, pc[0], pc[1], '1991: MENUS', 'text · numbers · arrow keys', aLbl, { color: C.green, dx: 60, dy: -70, size: 32 });
    }
    kicker(ctx, 'GOPHER · RFC 1436', W / 2, 250, t, tNav, s1 + 0.2, { size: 27 });
    title(ctx, ['THE INTERNET', 'AS A DIRECTORY'], W / 2, 360, t, tNav + 0.1, s1 + 0.1, { size: 86, stagger: 0.25 });

    return { bloom: 1.0, threshold: 0.85, ca: 1.0, grain: 0.045, scan: 0.05, vignette: 0.55, dof: { amount: 0.6, focus: 9, range: 14 } };
  }
  return { group, render };
}
