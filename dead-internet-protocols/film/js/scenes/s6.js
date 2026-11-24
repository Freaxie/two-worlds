// SCENE 6 — NOT EVERYTHING DIED (IRC, Usenet/NNTP, Gopher survive)
import * as THREE from 'three';
import { C, W, H, smooth, wordT, sceneRange, rgba } from '../core.js';
import { Panel } from '../engine/monitor.js';
import { drawIrc, drawUsenet } from '../ui/alive.js';
import { title, kicker, pin } from '../engine/overlay.js';
import { STRATA, layerY } from '../engine/network.js';
import { sampleCam, applyCam, toScreen } from '../engine/cam.js';

const ALIVE = new Set(['irc', 'nntp', 'gopher', 'web', 'now']);

export function build(world) {
  const group = new THREE.Group();
  const screen = (y) => {
    const p = new Panel({ w: 4.4, h: 3.3, texW: 1024, texH: 768, style: { crt: 1, curvature: 0.05, scan: 0.3, scanRows: 230, flicker: 0.5, noise: 0.03, brightness: 1.5, glow: '#46e6ff' } });
    p.mesh.position.set(0, y, 30); group.add(p.mesh); p.frame = null;
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(4.75, 3.65), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 0.9, 1.1), transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
    frame.position.set(0, y, 29.97); group.add(frame); p.frame = frame;
    return p;
  };
  const yIrc = layerY(4) + 3.2, yNews = layerY(2) + 3.2;
  const irc = screen(yIrc), news = screen(yNews);

  const [s0, s1] = sceneRange(6);
  const tNot = wordT('L14', 'not'), tIRC = wordT('L15', 'irc'), tUsenet = wordT('L15', 'usenet'), tSurvive = wordT('L15', 'survive');
  const tGopher = wordT('L15', 'gopher'), tServers = wordT('L15', 'servers'), tSome = wordT('L16', 'some'), tBehind = wordT('L16', 'behind');

  const cam = [
    { t: s0, pos: [6, 1.5, 70], look: [0, 0, 20], fov: 52 },
    { t: tNot, pos: [3, 3, 52], look: [0, 3, 10], fov: 52, ease: 'l' },
    { t: tIRC - 0.15, pos: [0.5, yIrc + 0.4, 40.5], look: [0, yIrc, 30], fov: 50, ease: 'io' },
    { t: tUsenet - 0.3, pos: [0.0, yIrc, 39.0], look: [0, yIrc, 30], fov: 50, ease: 'l' },
    { t: tUsenet + 0.55, pos: [0.0, yNews, 39.6], look: [0, yNews, 30], fov: 50, ease: 'io' },
    { t: tGopher - 0.35, pos: [0.0, yNews, 38.8], look: [0, yNews, 30], fov: 50, ease: 'l' },
    { t: tGopher + 1.3, pos: [2, 22, 170], look: [0, 4, -40], fov: 54, ease: 'io' },
    { t: s1, pos: [4, 34, 205], look: [0, 0, -45], fov: 55, ease: 'l' },
  ];

  world.events.push({ t: tNot, type: 'revive_swell', dur: 2.2 }, { t: tIRC - 0.2, type: 'whoosh', dur: 0.5 }, { t: tIRC, type: 'irc_ping', dur: 1.4 });
  world.events.push({ t: tUsenet - 0.25, type: 'whoosh_down', dur: 0.8 }, { t: tUsenet + 0.5, type: 'menu_draw', dur: 0.8 });
  world.events.push({ t: tGopher - 0.3, type: 'whoosh_back', dur: 1.6 }, { t: tGopher + 0.6, type: 'sparkle', dur: 2.5 });
  world.events.push({ t: tSome + 0.4, type: 'reveal_swell', dur: 3.5 });

  function render(t, w) {
    const { camera, network, ovCtx: ctx } = w;
    network.state.global = 1; network.state.highlightLayer = -1; network.state.dimDead = 1.25;
    network.state.revive = smooth(tNot - 0.2, tServers, t);
    network.state.reviveOrigin.set(0, 0, 30);
    w.scene.fog.density = 0.0085 - 0.004 * smooth(tGopher, tGopher + 1.5, t); network.setFog(w.scene.fog.density);
    applyCam(camera, sampleCam(cam, t), t, 0.25);

    const on1 = smooth(tIRC - 0.6, tIRC - 0.2, t), on2 = smooth(tUsenet - 0.2, tUsenet + 0.3, t);
    drawIrc(irc.ctx, 1024, 768, t, tIRC + 0.1); irc.update(t, on1);
    irc.mesh.visible = irc.frame.visible = on1 > 0; news.mesh.visible = news.frame.visible = on2 > 0;
    irc.frame.material.opacity = 0.18 * on1; news.frame.material.opacity = 0.18 * on2;
    drawUsenet(news.ctx, 1024, 768, t, tUsenet + 0.35, t > tSurvive ? 1 : 0); news.update(t, on2);

    // labels
    if (t > tIRC - 0.1 && t < tGopher) {
      kicker(ctx, 'IRC · 1988 → TODAY', W / 2, 360, t, tIRC - 0.1, tUsenet - 0.1, { size: 34, color: C.cyan });
      kicker(ctx, 'STILL ONLINE · e.g. Libera.Chat, 2021–', W / 2, 410, t, tIRC + 0.2, tUsenet - 0.1, { size: 24, color: rgba(C.cyan, 0.85) });
      kicker(ctx, 'USENET · NNTP (RFC 977 → RFC 3977)', W / 2, 360, t, tUsenet + 0.25, tGopher - 0.2, { size: 30, color: C.cyan });
      kicker(ctx, 'STILL CARRYING NEWSGROUPS', W / 2, 410, t, tUsenet + 0.45, tGopher - 0.2, { size: 24, color: rgba(C.cyan, 0.85) });
    }
    // wide: strata legend with status
    if (t > tGopher + 0.6) {
      STRATA.forEach((L, i) => {
        const p = toScreen(camera, -30, layerY(i), 25, W, H);
        if (!p) return;
        const a = smooth(tGopher + 0.6 + i * 0.1, tGopher + 1.0 + i * 0.1, t);
        const alive = ALIVE.has(L.key);
        const col = alive ? C.cyan : '#7d8c86';
        ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'middle';
        ctx.strokeStyle = rgba(col, 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(380, p[1]); ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, 7); ctx.fill();
        ctx.font = `700 29px 'Plex Mono'`; if (alive) { ctx.shadowColor = col; ctx.shadowBlur = 12; }
        ctx.fillText(L.label, 70, p[1] - 16);
        ctx.shadowBlur = 0; ctx.font = `500 21px 'Plex Mono'`; ctx.fillStyle = rgba(col, 0.85);
        const note = L.key === 'gopher' ? 'Gopher: a few hundred servers' : L.key === 'irc' || L.key === 'nntp' ? 'still in use' : alive ? 'alive' : 'mostly silent';
        ctx.fillText(`${L.era} · ${note}`, 70, p[1] + 16);
        ctx.restore();
      });
      const g = toScreen(camera, 20, layerY(5), 10, W, H);
      if (g) pin(ctx, g[0], g[1], '~300–400 GOPHER SERVERS', 'crawler counts, 2023–24', smooth(tGopher + 1.2, tGopher + 1.6, t) * (1 - smooth(tSome + 1.2, tSome + 1.6, t)), { color: C.cyan, dx: 40, dy: -90, size: 27 });
    }
    title(ctx, ['OLD DOESN’T ALWAYS', 'MEAN DEAD.'], W / 2, 300, t, tSome + 0.2, s1 - 0.1, { size: 82, stagger: 0.3, glow: rgba(C.cyan, 0.6) });

    return { bloom: 1.15, threshold: 0.8, ca: 1.1, grain: 0.05, scan: 0.05, vignette: 0.55,
      dof: t > tIRC - 0.6 && t < tGopher + 0.4 ? { amount: 0.55, focus: 10, range: 8 } : { amount: 0.45, focus: 150, range: 90 } };
  }
  return { group, render };
}
