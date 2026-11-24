// The "strata" network: the internet drawn as geological layers of networks,
// oldest at the bottom. Cables are fat lines whose colours are recomputed every frame
// (alive / flickering / dead / revived); packets travel along living cables.
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { mulberry32, hash2, clamp, W, H } from '../core.js';

// era layers, bottom (oldest) to top. alive = share of cables still carrying traffic today.
export const STRATA = [
  { key: 'x25', label: 'X.25', era: '1976', col: [1.0, 0.55, 0.12], alive: 0.0, revive: false },
  { key: 'finger', label: 'FINGER', era: '1977', col: [0.3, 1.0, 0.55], alive: 0.02, revive: false },
  { key: 'nntp', label: 'USENET · NNTP', era: '1980–86', col: [0.3, 1.0, 0.55], alive: 0.06, revive: true },
  { key: 'ipx', label: 'IPX/SPX', era: '1980s', col: [1.0, 0.55, 0.12], alive: 0.0, revive: false },
  { key: 'irc', label: 'IRC', era: '1988', col: [0.3, 1.0, 0.55], alive: 0.06, revive: true },
  { key: 'gopher', label: 'ARCHIE · GOPHER · WAIS', era: '1990–91', col: [0.3, 1.0, 0.55], alive: 0.03, revive: true, reviveShare: 0.35 },
  { key: 'web', label: 'THE WEB', era: '1990s', col: [0.35, 0.85, 1.0], alive: 0.75, revive: false },
  { key: 'now', label: 'TODAY', era: '2020s', col: [0.8, 0.93, 1.0], alive: 1.0, revive: false },
];
export const LAYER_GAP = 16;
export const layerY = (i) => (i - (STRATA.length - 1) / 2) * LAYER_GAP;

const PACKET_VERT = /* glsl */`
attribute float size; attribute vec3 color; varying vec3 vColor; varying float vFog;
uniform float scale; uniform float fogDensity;
void main() {
  vColor = color;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float d = -mv.z;
  vFog = exp(-fogDensity * fogDensity * d * d);
  gl_PointSize = max(size * scale / d, 0.0);
  gl_Position = projectionMatrix * mv;
}`;
const PACKET_FRAG = /* glsl */`
varying vec3 vColor; varying float vFog;
void main() {
  vec2 c = gl_PointCoord - 0.5; float r = dot(c, c) * 4.0;
  float a = exp(-r * 4.0) + 0.6 * exp(-r * 22.0);
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * a * vFog, 1.0);
}`;

export function makePoints(n) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(n), 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: PACKET_VERT, fragmentShader: PACKET_FRAG,
    uniforms: { scale: { value: H * 0.5 }, fogDensity: { value: 0.01 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

export class StrataNetwork {
  constructor({ nodesPerLayer = 130, xr = 95, z0 = -230, z1 = 45, seed = 7 } = {}) {
    this.group = new THREE.Group();
    const rnd = mulberry32(seed);
    this.nodes = []; // {p:Vector3, layer, deg}
    this.edges = []; // {a,b,layer,alive,die,phase,len,cross}
    STRATA.forEach((L, li) => {
      const y0 = layerY(li);
      const start = this.nodes.length;
      for (let i = 0; i < nodesPerLayer; i++) {
        const x = (rnd() * 2 - 1) * xr * (0.65 + 0.35 * rnd());
        const z = z0 + (z1 - z0) * Math.pow(rnd(), 0.85);
        const y = y0 + (rnd() * 2 - 1) * 2.6;
        this.nodes.push({ p: new THREE.Vector3(x, y, z), layer: li, deg: 0 });
      }
      // connect to 2-3 nearest neighbours in the layer
      for (let i = start; i < this.nodes.length; i++) {
        const a = this.nodes[i];
        const ds = [];
        for (let j = start; j < this.nodes.length; j++) if (j !== i) ds.push([a.p.distanceToSquared(this.nodes[j].p), j]);
        ds.sort((u, v) => u[0] - v[0]);
        const k = 2 + (rnd() < 0.45 ? 1 : 0);
        for (let m = 0; m < k; m++) {
          const j = ds[m][1];
          if (this.edges.some((e) => (e.a === j && e.b === i))) continue;
          this.addEdge(i, j, li, rnd, L);
        }
      }
    });
    // vertical "gateway" cables between neighbouring eras
    for (let li = 0; li < STRATA.length - 1; li++) {
      for (let k = 0; k < 7; k++) {
        const a = Math.floor(rnd() * nodesPerLayer) + li * nodesPerLayer;
        // nearest node in next layer
        let best = -1, bd = 1e9;
        for (let j = (li + 1) * nodesPerLayer; j < (li + 2) * nodesPerLayer; j++) {
          const d = this.nodes[a].p.distanceToSquared(this.nodes[j].p);
          if (d < bd) { bd = d; best = j; }
        }
        this.addEdge(a, best, li, rnd, STRATA[li], true);
      }
    }
    for (const e of this.edges) { this.nodes[e.a].deg++; this.nodes[e.b].deg++; }

    // geometry for cables
    const pos = new Float32Array(this.edges.length * 6);
    this.edges.forEach((e, i) => {
      const A = this.nodes[e.a].p, B = this.nodes[e.b].p;
      pos.set([A.x, A.y, A.z, B.x, B.y, B.z], i * 6);
    });
    this.lineGeo = new LineSegmentsGeometry();
    this.lineGeo.setPositions(pos);
    this.colors = new Float32Array(this.edges.length * 6);
    this.lineGeo.setColors(this.colors);
    this.colorBuf = this.lineGeo.attributes.instanceColorStart.data;
    this.lineMat = new LineMaterial({ linewidth: 2.2, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, worldUnits: false, fog: true });
    this.lineMat.resolution.set(W, H);
    this.lines = new LineSegments2(this.lineGeo, this.lineMat);
    this.lines.frustumCulled = false;
    this.group.add(this.lines);

    // node glows
    this.nodePts = makePoints(this.nodes.length);
    this.nodes.forEach((n, i) => this.nodePts.geometry.attributes.position.setXYZ(i, n.p.x, n.p.y, n.p.z));
    this.group.add(this.nodePts);
    // packets
    this.maxPackets = 520;
    this.packets = makePoints(this.maxPackets);
    this.group.add(this.packets);
    this.packetSlots = [];
    const aliveEdges = this.edges.map((e, i) => i);
    for (let k = 0; k < this.maxPackets; k++) this.packetSlots.push({ edge: aliveEdges[Math.floor(rnd() * aliveEdges.length)], phase: rnd(), speed: 0.25 + rnd() * 0.6, dir: rnd() < 0.5 });

    // faint stratum planes (grid lines) to read the layers
    const gridPos = [];
    STRATA.forEach((L, li) => {
      const y = layerY(li) - 3.2;
      for (let z = z0; z <= z1; z += 25) gridPos.push(-xr, y, z, xr, y, z);
      for (let x = -xr; x <= xr; x += 25) gridPos.push(x, y, z0, x, y, z1);
    });
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute(gridPos, 3));
    this.gridMat = new THREE.LineBasicMaterial({ color: new THREE.Color(0.035, 0.11, 0.075), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: true });
    this.grid = new THREE.LineSegments(gg, this.gridMat);
    this.group.add(this.grid);
    // a faint glowing sheet under every stratum so the layers read as layers
    const sheetTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const g = c.getContext('2d'); const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256); const tx = new THREE.CanvasTexture(c); return tx;
    })();
    this.sheets = STRATA.map((L, li) => {
      const m = new THREE.MeshBasicMaterial({ map: sheetTex, color: new THREE.Color(L.col[0], L.col[1], L.col[2]).multiplyScalar(0.05), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: true, side: THREE.DoubleSide });
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(xr * 2.4, (z1 - z0) * 1.15), m);
      sh.rotation.x = -Math.PI / 2; sh.position.set(0, layerY(li) - 3.0, (z0 + z1) / 2);
      this.group.add(sh); return sh;
    });

    this.state = { revive: 0, reviveOrigin: new THREE.Vector3(0, 0, 0), kill: [], global: 1, dimDead: 1, highlightLayer: -1, aliveBoost: 1 };
  }

  addEdge(a, b, li, rnd, L, cross = false) {
    const alive = rnd() < L.alive;
    const reviveOK = L.revive && (rnd() < (L.reviveShare ?? 0.75));
    this.edges.push({ a, b, layer: li, alive, reviveOK, phase: rnd() * 100, cross, flick: rnd() });
  }

  // schedule cables to flicker and die around time t (S1)
  scheduleDeaths(list) { this.state.kill = list; } // [{edge, t}]

  // pick edges whose midpoint is near a point (used to aim deaths at camera path)
  edgesNear(p, r, filter = () => true) {
    const out = [];
    this.edges.forEach((e, i) => {
      const m = this.nodes[e.a].p.clone().add(this.nodes[e.b].p).multiplyScalar(0.5);
      if (m.distanceTo(p) < r && filter(e)) out.push(i);
    });
    return out;
  }

  edgeIntensity(i, e, t) {
    const S = this.state;
    const L = STRATA[e.layer];
    let alive = e.alive ? 1 : 0;
    // scheduled deaths
    const k = S.killMap?.get(i);
    if (k !== undefined) {
      if (t > k - 1.2 && t < k) {
        const flick = hash2(i, Math.floor(t * 22)) > 0.45 ? 1 : 0.15;
        return { v: flick * 1.25, col: L.col };
      }
      if (t >= k) {
        const spark = Math.exp(-(t - k) * 10) * 1.6;
        return { v: 0.06 + spark, col: spark > 0.05 ? [1, 0.45, 0.3] : L.col, spark };
      }
      alive = 1;
    }
    // revival (S6): dead cables in surviving layers light up as a wave from the origin
    if (!alive && e.reviveOK && S.revive > 0) {
      const m = this.nodes[e.a].p;
      const d = m.distanceTo(S.reviveOrigin);
      const front = S.revive * 260;
      const lit = clamp((front - d) / 25);
      if (lit > 0) return { v: 0.04 + lit * (0.8 + 0.2 * Math.sin(t * 3 + e.phase)), col: [0.3, 0.92, 1.0], revived: lit };
    }
    if (alive) {
      const breathe = 0.75 + 0.25 * Math.sin(t * 1.3 + e.phase);
      return { v: breathe * S.aliveBoost, col: L.col };
    }
    // dead: faint ember, occasional dying flicker
    const ember = 0.06 + 0.025 * Math.sin(t * 0.7 + e.phase);
    const blip = hash2(i, Math.floor(t * 9)) > 0.996 ? 0.45 : 0;
    return { v: (ember + blip) * S.dimDead, col: L.col };
  }

  update(t, camera) {
    const S = this.state;
    if (S.kill && !S.killMap) S.killMap = new Map(S.kill.map((k) => [k.edge, k.t]));
    const cb = this.colorBuf.array;
    const nodeCol = this.nodePts.geometry.attributes.color.array;
    const nodeSize = this.nodePts.geometry.attributes.size.array;
    nodeCol.fill(0);
    const live = [];
    for (let i = 0; i < this.edges.length; i++) {
      const e = this.edges[i];
      const { v, col, revived, spark } = this.edgeIntensity(i, e, t);
      const hl = S.highlightLayer === e.layer ? 1.8 : 1;
      const g = v * S.global * hl * (e.cross ? 0.55 : 1);
      const r = col[0] * g, gg = col[1] * g, b = col[2] * g;
      cb[i * 6] = r; cb[i * 6 + 1] = gg; cb[i * 6 + 2] = b; cb[i * 6 + 3] = r; cb[i * 6 + 4] = gg; cb[i * 6 + 5] = b;
      if (v > 0.3) live.push([i, col, g, revived]);
      // node brightness = max of its edges
      const nm = spark ? 0.5 : 1.6;
      for (const ni of [e.a, e.b]) {
        nodeCol[ni * 3] = Math.max(nodeCol[ni * 3], r * nm); nodeCol[ni * 3 + 1] = Math.max(nodeCol[ni * 3 + 1], gg * nm); nodeCol[ni * 3 + 2] = Math.max(nodeCol[ni * 3 + 2], b * nm);
      }
    }
    for (let i = 0; i < this.nodes.length; i++) nodeSize[i] = 2.2 + Math.min(this.nodes[i].deg, 5) * 0.35;
    this.colorBuf.needsUpdate = true;
    this.nodePts.geometry.attributes.color.needsUpdate = true;
    this.nodePts.geometry.attributes.size.needsUpdate = true;

    // packets ride on live cables
    const pp = this.packets.geometry.attributes.position.array, pc = this.packets.geometry.attributes.color.array, ps = this.packets.geometry.attributes.size.array;
    for (let k = 0; k < this.maxPackets; k++) {
      const slot = this.packetSlots[k];
      if (!live.length || k >= live.length * 2.2) { ps[k] = 0; continue; }
      const [ei, col, g] = live[(slot.edge + k * 7) % live.length];
      const e = this.edges[ei];
      let u = (t * slot.speed * 0.35 + slot.phase) % 1;
      if (slot.dir) u = 1 - u;
      const A = this.nodes[e.a].p, B = this.nodes[e.b].p;
      pp[k * 3] = A.x + (B.x - A.x) * u; pp[k * 3 + 1] = A.y + (B.y - A.y) * u; pp[k * 3 + 2] = A.z + (B.z - A.z) * u;
      const br = Math.min(g, 1.2) * 2.2;
      pc[k * 3] = col[0] * br; pc[k * 3 + 1] = col[1] * br; pc[k * 3 + 2] = col[2] * br;
      ps[k] = 3.2;
    }
    this.packets.geometry.attributes.position.needsUpdate = true;
    this.packets.geometry.attributes.color.needsUpdate = true;
    this.packets.geometry.attributes.size.needsUpdate = true;
  }

  setFog(density) {
    this.nodePts.material.uniforms.fogDensity.value = density;
    this.packets.material.uniforms.fogDensity.value = density;
  }
}
