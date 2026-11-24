// Film orchestrator. Exposes window.__film = { setup, renderFrame, events, cues } for the
// Playwright renderer. Every frame is a pure function of its index (deterministic).
import * as THREE from 'three';
import { W, H, FPS, setTimeline, timeline, mulberry32 } from './core.js';
import { Post } from './engine/post.js';
import { StrataNetwork } from './engine/network.js';
import { Subtitles } from './engine/subs.js';
import { makePoints } from './engine/network.js';
import * as S1 from './scenes/s1.js';
import * as S2 from './scenes/s2.js';
import * as S3 from './scenes/s3.js';
import * as S4 from './scenes/s4.js';
import * as S5 from './scenes/s5.js';
import * as S6 from './scenes/s6.js';
import * as S7 from './scenes/s7.js';

const SCENES = [S1, S2, S3, S4, S5, S6, S7];
const world = { opts: {} };

async function setup() {
  const tl = await (await fetch('./data/timeline.json')).json();
  setTimeline(tl);
  await document.fonts.load(`40px VT323`);
  await document.fonts.load(`500 40px 'Plex Mono'`); await document.fonts.load(`600 40px 'Plex Mono'`); await document.fonts.load(`700 40px 'Plex Mono'`);
  await document.fonts.load(`400 40px 'Plex Mono'`);
  await document.fonts.load(`900 40px Inter`); await document.fonts.load(`800 40px Inter`); await document.fonts.load(`700 40px Inter`); await document.fonts.load(`500 40px Inter`);
  await document.fonts.ready;

  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, alpha: false });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0, 0, 0);
  scene.fog = new THREE.FogExp2(0x000000, 0.012);
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 700);

  scene.add(new THREE.AmbientLight(0x6f8a86, 0.35));
  const key = new THREE.DirectionalLight(0x9fc7d4, 1.1); key.position.set(-6, 8, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x3dff8b, 0.9); rim.position.set(8, 3, -6); scene.add(rim);

  const network = new StrataNetwork();
  scene.add(network.group);

  // floating dust for parallax
  const dust = makePoints(1400);
  const rnd = mulberry32(99);
  const dp = dust.geometry.attributes.position.array, dc = dust.geometry.attributes.color.array, ds = dust.geometry.attributes.size.array;
  for (let i = 0; i < 1400; i++) {
    dp[i * 3] = (rnd() * 2 - 1) * 120; dp[i * 3 + 1] = (rnd() * 2 - 1) * 90; dp[i * 3 + 2] = -250 + rnd() * 330;
    const b = 0.05 + rnd() * 0.12; dc[i * 3] = b * 0.6; dc[i * 3 + 1] = b; dc[i * 3 + 2] = b * 0.9; ds[i] = 1.2 + rnd() * 2.2;
  }
  scene.add(dust);

  // overlay canvas (typography), composited into the HDR buffer so it blooms
  const ov = document.createElement('canvas'); ov.width = W; ov.height = H;
  const ovCtx = ov.getContext('2d');
  const ovTex = new THREE.CanvasTexture(ov); ovTex.colorSpace = THREE.SRGBColorSpace; ovTex.minFilter = THREE.LinearFilter; ovTex.generateMipmaps = false;
  const subs = new Subtitles(tl);
  const post = new Post(renderer, W, H);

  Object.assign(world, { renderer, scene, camera, network, dust, ov, ovCtx, ovTex, subs, post, events: [], tl });
  world.scenes = SCENES.map((S, i) => {
    const sc = S.build(world);
    sc.index = i + 1;
    if (sc.group) scene.add(sc.group);
    return sc;
  });
  // global events: glitch cuts between scenes
  for (let i = 1; i < tl.cuts.length - 1; i++) world.events.push({ t: tl.cuts[i], type: 'cut', scene: i + 1 });
  world.events.sort((a, b) => a.t - b.t);
  return { duration: tl.duration, frames: Math.round(tl.duration * FPS), fps: FPS };
}

function sceneIndexAt(t) {
  const c = timeline().cuts;
  for (let i = 0; i < c.length - 1; i++) if (t < c[i + 1]) return i;
  return c.length - 2;
}

function renderFrame(frame) {
  const t = frame / FPS;
  const { scene, camera, network, ovCtx, ovTex, subs, post } = world;
  const si = sceneIndexAt(t);
  const sc = world.scenes[si];
  world.scenes.forEach((s, i) => { if (s.group) s.group.visible = i === si; });
  ovCtx.clearRect(0, 0, W, H);
  network.group.visible = true; world.dust.visible = true;
  const p = sc.render(t, world) || {};
  if (world.opts.clean) { ovCtx.clearRect(0, 0, W, H); p.glitch = 0; }
  if (network.group.visible) network.update(t, camera);
  // glitch around scene cuts
  const cuts = timeline().cuts;
  let g = p.glitch ?? 0, flash = p.flash ?? 0;
  for (let i = 1; i < cuts.length - 1; i++) {
    const d = (t - cuts[i]) / 0.075;
    g = Math.max(g, Math.exp(-d * d) * 0.95);
    if (t >= cuts[i] && t < cuts[i] + 1 / FPS * 2) flash = Math.max(flash, 0.35);
  }
  p.glitch = g; p.flash = flash;
  ovTex.needsUpdate = true;
  const hasSubs = subs.draw(t, { hidden: p.hideSubs || world.opts.clean });
  subs.tex.needsUpdate = true;
  post.render(scene, camera, ovTex, hasSubs ? subs.tex : null, subs.rect(W, H), p, t, frame);
}

function capture(quality = 0.95) {
  return world.renderer.domElement.toDataURL('image/jpeg', quality);
}

function cues() {
  return world.subs.cues.map((c) => ({ start: c.start, end: c.end, text: world.subs.text(c) }));
}

window.__film = { setup, renderFrame, capture, events: () => world.events, cues, world, setOpts: (o) => Object.assign(world.opts, o) };
