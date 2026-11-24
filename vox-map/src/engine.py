"""Timeline engine: camera keyframes + elements with explicit start/end frames.
Everything animates on twos: frame f is drawn at time f - f % 2."""
import json
import math

import cv2
import numpy as np

import geo
import ink
import paper
from mapview import INK, YELLOW, colourise

# ------------------------------------------------------------------ timing
class Cues:
    def __init__(self, words_json, offset_s, fps=geo.FPS):
        d = json.load(open(words_json))
        self.words = d["words"]
        self.offset, self.fps = offset_s, fps

    def __call__(self, sid, word, nth=0, at="start"):
        hits = [w for w in self.words if w["sentence"] == sid and
                w["word"].strip(".,:;!?").lower() == word.lower()]
        return int(round((hits[nth][at] + self.offset) * self.fps))


# ------------------------------------------------------------------ camera
class Camera:
    def __init__(self, lon, lat, zoom):
        self.keys = [(0, 0, lon, lat, zoom)]       # (start, end, lon, lat, zoom)

    def move(self, start, end, lon, lat, zoom):
        assert 16 <= end - start <= 26, "camera moves last 16-26 frames"
        self.keys.append((start, end, lon, lat, zoom))

    def at(self, f):
        f = f - f % 2
        _, _, lon, lat, z = self.keys[0]
        cx, cy = (float(v) for v in geo.to_px(lon, lat))
        for s, e, lo2, la2, z2 in self.keys[1:]:
            if f < s:
                break
            tx, ty = (float(v) for v in geo.to_px(lo2, la2))
            t = geo.smoothstep((f - s) / (e - s))
            cx, cy = cx + (tx - cx) * t, cy + (ty - cy) * t
            z = math.exp(math.log(z) + (math.log(z2) - math.log(z)) * t)
        lon = cx / geo.KX + geo.LON0
        lat = geo.LAT1 - cy / geo.S
        return geo.Cam(lon, lat, z)

    def moves(self):
        return [(s, e) for s, e, *_ in self.keys[1:]]


# ------------------------------------------------------------------ helpers
def slap_scale(f, start):
    k = f - start
    if k < 2:
        return 1.10
    if k < 4:
        return 0.98
    return 1.0


def boil(eid, f, amp=1.5, rot=0.4):
    rng = np.random.default_rng(eid * 9973 + f // ink.BOIL_PERIOD)
    return rng.uniform(-amp, amp), rng.uniform(-amp, amp), rng.uniform(-rot, rot)


_ids = [0]


def new_id():
    _ids[0] += 1
    return _ids[0]


class El:
    kind = "base"
    is_ink = False

    def __init__(self, start, end, z=0):
        self.start, self.end, self.z = int(start), int(end), z
        self.id = new_id()

    def active(self, f):
        return self.start <= f < self.end

    def events(self):
        return []


class Pinned(El):
    def __init__(self, lon, lat, dx, dy, start, end, z=0):
        super().__init__(start, end, z)
        self.lon, self.lat, self.dx, self.dy = lon, lat, dx, dy

    def pos(self, cam):
        x, y = cam.project(self.lon, self.lat)
        return float(x) + self.dx, float(y) + self.dy


# ------------------------------------------------------------------ paper
class SpriteEl(Pinned):
    kind = "paper"

    def __init__(self, sprite, lon, lat, dx, dy, start, end, angle=0.0, scale=1.0, z=10, sfx="slap"):
        super().__init__(lon, lat, dx, dy, start, end, z)
        self.sprite, self.angle, self.scale, self.sfx = sprite, angle, scale, sfx

    def draw(self, frame, f, cam):
        x, y = self.pos(cam)
        bx, by, br = boil(self.id, f)
        paper.composite(frame, self.sprite, x + bx, y + by, self.scale * slap_scale(f, self.start),
                        self.angle + br)

    def events(self):
        return [(self.start, self.sfx, {})]


class RansomEl(Pinned):
    kind = "paper"

    def __init__(self, text, lon, lat, dx, dy, start, end, height=110, interval=4, z=20, seed=0):
        super().__init__(lon, lat, dx, dy, start, end, z)
        rng = np.random.default_rng(seed)
        self.letters = []
        x = 0.0
        for i, ch in enumerate(text):
            if ch == " ":
                x += height * 0.35
                continue
            spr = paper.ransom_letter(ch, i, height, seed=seed + i)
            w = spr.alpha.shape[1] - 2 * paper.PAD
            self.letters.append([spr, x + w / 2, rng.uniform(-0.07, 0.07) * height,
                                 rng.uniform(-7, 7), start + len(self.letters) * interval])
            x += w * (1.04 if ch in ",." else 0.94) + height * (0.06 if ch in ",." else 0.02)
        for L in self.letters:
            L[1] -= x / 2

    def draw(self, frame, f, cam):
        x0, y0 = self.pos(cam)
        for k, (spr, ox, oy, ang, st) in enumerate(self.letters):
            if f >= st:
                bx, by, br = boil(self.id * 31 + k, f)
                paper.composite(frame, spr, x0 + ox + bx, y0 + oy + by, slap_scale(f, st), ang + br)

    def events(self):
        return [(L[4], "letter", {}) for L in self.letters]


class MoverEl(El):
    """Cut-out travelling along a lon/lat spline with smoothstep and +-4 deg wobble."""
    kind = "paper"

    def __init__(self, sprite, path, t0, t1, start, end, dx=0, dy=0, scale=1.0, z=30, flip_sprite=None):
        super().__init__(start, end, z)
        self.sprite, self.path, self.t0, self.t1 = sprite, path, t0, t1
        self.dx, self.dy, self.scale, self.flip = dx, dy, scale, flip_sprite

    def where(self, f, cam):
        pts = ink.catmull(cam.project_pts(self.path))
        p, s, L = ink.resample(pts, 2.0)
        u = geo.smoothstep((f - self.t0) / max(1, self.t1 - self.t0))
        i = min(len(p) - 1, int(u * (len(p) - 1)))
        d = p[min(len(p) - 1, i + 3)] - p[max(0, i - 3)]
        return p[i], d, u

    def draw(self, frame, f, cam):
        (x, y), d, u = self.where(f, cam)
        moving = 0 < u < 1
        wob = 4.0 * math.sin(f * 0.55) if moving else 0.0
        spr = self.flip if (self.flip is not None and d[0] < 0) else self.sprite
        bx, by, br = boil(self.id, f)
        sc = self.scale * (slap_scale(f, self.start) if f - self.start < 4 else 1.0)
        paper.composite(frame, spr, x + self.dx * u + bx, y + self.dy * u + by, sc, wob + br)

    def events(self):
        return [(self.start, "slap", {}), (self.t0, "flutter", {"dur": self.t1 - self.t0})]


class CardEl(El):
    """Title card, screen-fixed top-left, typewriter at 1 letter per frame."""
    kind = "paper"

    def __init__(self, lines, fig, start, end, type_start, x=70, y=58, z=50):
        super().__init__(start, end, z)
        self.lines, self.fig, self.type_start = lines, fig, type_start
        self.x, self.y = x, y
        self.cache = {}
        self.tag = paper.tag(fig, 22, seed=77)
        self.total = sum(len(l) for l in lines)

    def draw(self, frame, f, cam):
        n = max(0, min(self.total, f - self.type_start + 1)) if f >= self.type_start else 0
        if n not in self.cache:
            self.cache[n] = paper.card(self.lines, n_chars=n, seed=5)
        spr = self.cache[n]
        h, w = spr.alpha.shape
        bx, by, br = boil(self.id, f)
        sc = slap_scale(f, self.start)
        cx, cy = self.x + w / 2 - paper.PAD, self.y + h / 2 - paper.PAD
        paper.composite(frame, spr, cx + bx, cy + by, sc, -1.2 + br)
        paper.composite(frame, self.tag, self.x + 40 + bx, self.y - 2 + by, sc, -4 + br)

    def events(self):
        ev = [(self.start, "slap", {})]
        ev += [(self.type_start + i, "type", {}) for i in range(self.total)
               if "".join(self.lines)[i] != " "]
        return ev


class SheetEl(El):
    """Bottom-centre beige sheet with a bold sentence and a yellow highlighter swipe."""
    kind = "paper"

    def __init__(self, text, word, start, hl_start, end, y=985, size=46, z=60):
        super().__init__(start, end, z)
        self.sprite, self.hl = paper.sheet(text, size, word, seed=12)
        self.hl_start, self.y = hl_start, y

    def draw(self, frame, f, cam):
        h, w = self.sprite.alpha.shape
        bx, by, br = boil(self.id, f, 1.0, 0.25)
        cx, cy = geo.SCREEN_W / 2 + bx, self.y + by
        paper.composite(frame, self.sprite, cx, cy, slap_scale(f, self.start), br)
        if self.hl and f >= self.hl_start:
            p = min(1.0, (f - self.hl_start + 2) / 10.0)
            x0, x1, yy = self.hl
            ox, oy = cx - w / 2, cy - h / 2
            L = ink.Layer()
            ink.marker(L.cov, [(ox + x0 - 6, oy + yy + 3), (ox + x1 + 6, oy + yy - 1)], 30, p, seed=4,
                       taper=False, smooth=False)
            L.multiply(frame, YELLOW, 0.88)

    def events(self):
        return [(self.start, "slap", {}), (self.hl_start, "highlight", {"dur": 10})]


# ------------------------------------------------------------------ ink
class InkPathEl(El):
    kind = "ink"
    is_ink = True

    def __init__(self, ctrl, start, dur, end, width=5.5, dash=None, arrow=False, z=5, seed=None,
                 closed=False, sfx="scratch"):
        super().__init__(start, end, z)
        self.ctrl = np.asarray(ctrl, np.float64)
        self.dur, self.width, self.dash, self.arrow = dur, width, dash, arrow
        self.seed = seed if seed is not None else self.id * 13
        self.closed, self.sfx = closed, sfx

    def screen_ctrl(self, cam):
        p = cam.project_pts(self.ctrl)
        return np.vstack([p, p[:1]]) if self.closed else p

    def draw_cov(self, cov, f, cam):
        rev = geo.smoothstep((f - self.start + 2) / max(1, self.dur))
        ctrl = ink.jitter(self.screen_ctrl(cam), ink.boil_seed(f, self.seed), 1.0)
        ink.marker(cov, ctrl, self.width, rev, self.seed, self.dash, True, True, self.arrow)

    def events(self):
        return [(self.start, self.sfx, {"dur": self.dur})]


class InkCircleEl(Pinned):
    kind = "ink"
    is_ink = True

    def __init__(self, lon, lat, dx, dy, rx, ry, start, dur, end, z=40, width=5.5):
        super().__init__(lon, lat, dx, dy, start, end, z)
        self.rx, self.ry, self.dur, self.width = rx, ry, dur, width

    def draw_cov(self, cov, f, cam):
        x, y = self.pos(cam)
        rev = geo.smoothstep((f - self.start + 2) / self.dur)
        ctrl = ink.ellipse_ctrl(x, y, self.rx, self.ry, self.id, start=2.3)
        ctrl = ink.jitter(ctrl, ink.boil_seed(f, self.id), 0.8)
        ink.marker(cov, ctrl, self.width, rev, self.id * 5, smooth=False)

    def events(self):
        return [(self.start, "circle", {"dur": self.dur})]


class XEl(Pinned):
    kind = "ink"
    is_ink = True

    def draw_cov(self, cov, f, cam):
        x, y = self.pos(cam)
        p = min(1.0, (f - self.start + 2) / 6.0)
        ink.x_mark(cov, x, y, p, seed=ink.boil_seed(f, self.id))

    def events(self):
        return [(self.start, "cross", {})]


class SplashEl(Pinned):
    kind = "ink"
    is_ink = True

    def __init__(self, lon, lat, dx, dy, size, start, end, z=15, seed=0):
        super().__init__(lon, lat, dx, dy, start, end, z)
        self.mask = ink.splash_mask(size, seed)

    def draw_cov(self, cov, f, cam):
        x, y = self.pos(cam)
        sc = 0.75 if f - self.start < 2 else 1.0
        ink.paste_cov(cov, self.mask, x, y, sc)

    def events(self):
        return [(self.start, "splat", {})]


class NoteEl(Pinned):
    """Permanent Marker note written at 1.3 letters per frame (lowercase)."""
    kind = "ink"
    is_ink = True

    def __init__(self, text, lon, lat, dx, dy, start, end, size=64, angle=-3.0, rate=1.3, z=45):
        super().__init__(lon, lat, dx, dy, start, end, z)
        self.text, self.size, self.angle, self.rate = text.lower(), size, angle, rate
        self.cache = {}
        full = paper.text_img(self.text, "marker", size)
        self.full_shape = full.shape

    def mask(self, n):
        if n not in self.cache:
            h, w = self.full_shape
            m = np.zeros((h + 40, w + 40), np.float32)
            if n > 0:
                part = paper.text_img(self.text[:n], "marker", self.size)
                ph, pw = part.shape
                m[20 + h - ph:20 + h, 20:20 + pw] = part[:, :]
            M = cv2.getRotationMatrix2D((m.shape[1] / 2, m.shape[0] / 2), -self.angle, 1.0)
            m = cv2.warpAffine(m, M, (m.shape[1], m.shape[0]), flags=cv2.INTER_LINEAR)
            rng = np.random.default_rng(n)
            m *= 0.88 + 0.12 * rng.random(m.shape, dtype=np.float32)
            self.cache[n] = m
        return self.cache[n]

    def draw_cov(self, cov, f, cam):
        n = min(len(self.text), int((f - self.start + 1) * self.rate))
        x, y = self.pos(cam)
        bx, by, _ = boil(self.id, f, 1.0, 0)
        m = self.mask(n)
        # left-aligned at (x, y)
        ink.paste_cov(cov, m, x + bx + m.shape[1] / 2, y + by)

    def events(self):
        n = len(self.text)
        return [(self.start, "write", {"dur": int(math.ceil(n / self.rate))})]


# ------------------------------------------------------------------ scene
class Scene:
    def __init__(self, camera, elements, paint, n_frames, map_store):
        self.camera, self.elements, self.paint = camera, elements, paint
        self.n_frames, self.ms = n_frames, map_store
        self.order = sorted(elements, key=lambda e: e.z)

    def render(self, f):
        f = f - f % 2
        cam = self.camera.at(f)
        inkc = self.ms.sample(cam, "ink")
        pc = self.ms.sample(cam, "paint")
        pm = self.paint.mask(f, cam)
        pc = pc.astype(np.float32)
        if pm is not None:
            pc *= pm
        frame = colourise(inkc, pc)
        layer = None
        for el in self.order:
            if not el.active(f):
                continue
            if el.is_ink:
                if layer is None:
                    layer = ink.Layer()
                el.draw_cov(layer.cov, f, cam)
            else:
                if layer is not None:
                    layer.apply(frame)
                    layer = None
                el.draw(frame, f, cam)
        if layer is not None:
            layer.apply(frame)
        return np.clip(frame, 0, 255).astype(np.uint8)

    def events(self):
        ev = []
        for el in self.elements:
            ev += el.events()
        ev += [(s, "whoosh", {"dur": e - s}) for s, e in self.camera.moves()]
        ev += [(self.paint.start, "paint", {"dur": 16})]
        return sorted(ev, key=lambda e: e[0])


class PaintSweep:
    """Yellow paint revealed south-to-north over 16 frames, ragged leading edge."""

    def __init__(self, poly, start, frames=16):
        self.poly, self.start, self.frames = np.asarray(poly), start, frames
        rng = np.random.default_rng(3)
        x = np.arange(geo.SCREEN_W)
        self.rag = sum(np.sin(x / rng.uniform(20, 90) + rng.uniform(0, 6)) * rng.uniform(2, 6)
                       for _ in range(4)).astype(np.float32)

    def mask(self, f, cam):
        if f < self.start:
            return np.zeros((geo.SCREEN_H, geo.SCREEN_W), np.float32)
        p = (f - self.start + 2) / self.frames
        if p >= 1:
            return None
        ys = cam.project_pts(self.poly)[:, 1]
        top, bot = ys.min() - 20, ys.max() + 20
        yt = bot - geo.smoothstep(p) * (bot - top)
        yy = np.arange(geo.SCREEN_H, dtype=np.float32)[:, None]
        return np.clip((yy - yt - self.rag[None, :]) / 14.0 + 0.5, 0, 1)
