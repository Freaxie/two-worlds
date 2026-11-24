"""Felt-marker ink, drawn in screen space every frame from projected control
points, so strokes stay 5-6 px wide at any zoom.

Marker model: circles stamped every 1.6 px, +-15% width wobble, tapered ends,
a dry-crayon pass at 0.32 width with 35% dropouts, all merged with max().
Boil: 3 jitter seeds cycling every 8 frames."""
import math

import cv2
import numpy as np

from mapview import INK, YELLOW

STEP = 1.6
SS = 2                       # supersampling for stamps
SHIFT = 3
BOIL_PERIOD = 8
BOIL_SEEDS = 3


def boil_seed(frame, base=0):
    return base * 7 + (frame // BOIL_PERIOD) % BOIL_SEEDS


def catmull(pts, per=10):
    p = np.asarray(pts, np.float64)
    if len(p) < 3:
        return p
    P = np.vstack([p[0] * 2 - p[1], p, p[-1] * 2 - p[-2]])
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        n = max(2, int(np.hypot(*(p2 - p1)) / per))
        for t in np.linspace(0, 1, n, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
                              (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(p[-1])
    return np.array(out)


def resample(pts, step=STEP):
    p = np.asarray(pts, np.float64)
    seg = np.hypot(*np.diff(p, axis=0).T)
    s = np.concatenate([[0], np.cumsum(seg)])
    L = s[-1]
    if L < 1e-6:
        return p[:1], np.zeros(1), 0.0
    ts = np.arange(0, L + 1e-9, step)
    return np.stack([np.interp(ts, s, p[:, 0]), np.interp(ts, s, p[:, 1])], 1), ts, L


def jitter(pts, seed, amp=1.2):
    rng = np.random.default_rng(seed)
    return np.asarray(pts, np.float64) + rng.uniform(-amp, amp, (len(pts), 2))


def smooth_noise(n, seed, scale=40.0):
    rng = np.random.default_rng(seed + 991)
    x = np.arange(n) * STEP / scale
    v = np.zeros(n)
    for k in range(3):
        v += np.sin(x * (k + 1) * rng.uniform(0.7, 1.3) + rng.uniform(0, 6.3)) / (k + 1)
    return v / 1.8


class Layer:
    """Full-screen float coverage buffer for ink (max-merged)."""

    def __init__(self, w=1920, h=1080):
        self.cov = np.zeros((h, w), np.float32)

    def apply(self, frame, colour=INK, opacity=0.97):
        c = self.cov[..., None] * opacity
        frame[:] = frame * (1 - c) + colour * c

    def multiply(self, frame, colour=YELLOW, opacity=0.9):
        c = self.cov[..., None] * opacity
        frame[:] = frame * (1 - c * (1 - colour / 255.0))


def stamps(cov, pts, widths, keep=None, seed=0, dry=True, grain=True):
    """Stamp circles (diameter = widths) along pts into cov, max-merged."""
    if len(pts) == 0:
        return
    if keep is not None:
        pts, widths = pts[keep], widths[keep]
        if len(pts) == 0:
            return
    H, W = cov.shape
    r = widths.max() / 2 + 3
    x0 = int(max(0, np.floor(pts[:, 0].min() - r)))
    y0 = int(max(0, np.floor(pts[:, 1].min() - r)))
    x1 = int(min(W, np.ceil(pts[:, 0].max() + r)))
    y1 = int(min(H, np.ceil(pts[:, 1].max() + r)))
    if x1 <= x0 or y1 <= y0:
        return
    can = np.zeros(((y1 - y0) * SS, (x1 - x0) * SS), np.uint8)
    k = SS * (1 << SHIFT)
    for (x, y), w in zip(pts, widths):
        cv2.circle(can, (int((x - x0) * k), int((y - y0) * k)), max(1, int(w / 2 * k)), 255, -1,
                   cv2.LINE_8, SHIFT)
    if dry:
        rng = np.random.default_rng(seed + 17)
        n = len(pts)
        d = np.diff(pts, axis=0, prepend=pts[:1])
        nrm = np.stack([-d[:, 1], d[:, 0]], 1)
        nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-9
        off = (rng.random(n) - 0.5) * 0.9 * widths
        drop = rng.random(n) < 0.35
        for i in np.nonzero(~drop)[0]:
            x, y = pts[i] + nrm[i] * (widths[i] * 0.42 * np.sign(off[i]) + off[i] * 0.2)
            cv2.circle(can, (int((x - x0) * k), int((y - y0) * k)), max(1, int(widths[i] * 0.32 / 2 * k)),
                       255, -1, cv2.LINE_8, SHIFT)
    c = cv2.resize(can, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    if grain:
        rng = np.random.default_rng(seed + 3)
        g = rng.random(c.shape, dtype=np.float32)
        c *= 0.86 + 0.14 * g
    roi = cov[y0:y1, x0:x1]
    np.maximum(roi, c, out=roi)


def marker(cov, ctrl, width=5.5, reveal=1.0, seed=0, dash=None, taper=True, smooth=True,
           arrow=False, head=26.0, head_ang=0.48):
    """Draw a marker stroke through ctrl (screen px) revealed to fraction `reveal`."""
    if reveal <= 0:
        return
    path = catmull(ctrl) if smooth and len(ctrl) > 2 else np.asarray(ctrl, np.float64)
    pts, s, L = resample(path)
    if L < 1:
        return
    wob = 1 + 0.15 * smooth_noise(len(pts), seed)
    tw = np.ones(len(pts))
    if taper:
        e = np.minimum(s, L - s)
        tw = 0.35 + 0.65 * np.clip(e / 12.0, 0, 1) ** 0.7
    widths = width * wob * tw
    keep = s <= reveal * L
    if dash:
        on, off = dash
        keep &= np.mod(s, on + off) < on
    stamps(cov, pts, widths, keep, seed)
    if arrow and reveal >= 0.999:
        tip = pts[-1]
        back = pts[max(0, len(pts) - 9)]
        d = tip - back
        d /= np.linalg.norm(d) + 1e-9
        for sgn in (-1, 1):
            a = math.atan2(-d[1], -d[0]) + sgn * head_ang
            end = tip + np.array([math.cos(a), math.sin(a)]) * head
            marker(cov, [tip, (tip + end) / 2 + np.array([0.6, -0.6]) * sgn, end], width,
                   1.0, seed + 5 + sgn, None, True, False)


def ellipse_ctrl(cx, cy, rx, ry, seed, turns=1.1, start=None):
    rng = np.random.default_rng(seed)
    a0 = rng.uniform(0, 2 * math.pi) if start is None else start
    n = 64
    t = np.linspace(0, turns * 2 * math.pi, n)
    grow = 1 + 0.06 * t / (2 * math.pi)
    wob = 1 + 0.035 * np.sin(3 * t + rng.uniform(0, 6))
    return np.stack([cx + rx * grow * wob * np.cos(a0 - t), cy + ry * grow * wob * np.sin(a0 - t)], 1)


def x_mark(cov, cx, cy, progress, seed=0, arm=24.0, width=6.0):
    """Ink X: two strokes animated over 6 frames (progress 0..1)."""
    a = np.array([[cx - arm, cy - arm], [cx + arm * 0.95, cy + arm * 1.05]])
    b = np.array([[cx + arm, cy - arm * 0.95], [cx - arm * 1.02, cy + arm]])
    marker(cov, jitter(a, seed, 1.0), width, min(1, progress * 2), seed, smooth=False)
    if progress > 0.5:
        marker(cov, jitter(b, seed + 1, 1.0), width, min(1, (progress - 0.5) * 2), seed + 1, smooth=False)


def splash_mask(size, seed):
    """Ink splatter coverage (size x size)."""
    rng = np.random.default_rng(seed)
    S = size * 2
    can = np.zeros((S, S), np.uint8)
    c = S / 2
    n = 40
    ang = np.linspace(0, 2 * math.pi, n, endpoint=False)
    rad = S * 0.16 * (1 + 0.35 * rng.random(n))
    spikes = rng.random(n) < 0.25
    rad[spikes] *= rng.uniform(1.4, 2.0, spikes.sum())
    pts = np.stack([c + rad * np.cos(ang), c + rad * np.sin(ang)], 1)
    cv2.fillPoly(can, [np.round(pts * 8).astype(np.int32)], 255, cv2.LINE_AA, 3)
    for _ in range(14):
        a = rng.uniform(0, 2 * math.pi)
        d = S * rng.uniform(0.24, 0.47)
        r = S * rng.uniform(0.008, 0.035)
        cv2.circle(can, (int((c + d * math.cos(a)) * 8), int((c + d * math.sin(a)) * 8)), int(r * 8), 255, -1,
                   cv2.LINE_AA, 3)
    m = cv2.resize(can, (size, size), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    return m


def paste_cov(cov, m, cx, cy, scale=1.0):
    if scale != 1.0:
        m = cv2.resize(m, None, fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)
    h, w = m.shape
    x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
    H, W = cov.shape
    xa, ya, xb, yb = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
    if xb <= xa or yb <= ya:
        return
    roi = cov[ya:yb, xa:xb]
    np.maximum(roi, m[ya - y0:yb - y0, xa - x0:xb - x0], out=roi)
