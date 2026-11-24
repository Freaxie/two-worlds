"""Original, generic collage figures drawn procedurally (no photographs, no
real-person likenesses). Each part is a filled shape given a rounded 'sculpted'
shading from its distance field, so the halftone reads like an old photo of a
paper/plaster figurine.

Coordinates are normalised (0..1) inside the figure box, y pointing down."""
import math

import cv2
import numpy as np

SHIFT = 4
SC = 1 << SHIFT
LIGHT = np.array([-0.55, -0.75, 0.62])
LIGHT = LIGHT / np.linalg.norm(LIGHT)


class Sculpt:
    def __init__(self, w, h, ss=3):
        self.w, self.h, self.ss = w, h, ss
        self.W, self.H = w * ss, h * ss
        self.tone = np.ones((self.H, self.W), np.float32)
        self.alpha = np.zeros((self.H, self.W), np.float32)

    def _p(self, pts):
        a = np.asarray(pts, np.float64)
        return np.round(np.stack([a[:, 0] * self.W, a[:, 1] * self.H], 1) * SC).astype(np.int32)

    def poly(self, pts):
        m = np.zeros((self.H, self.W), np.uint8)
        cv2.fillPoly(m, [self._p(pts)], 255, cv2.LINE_8, SHIFT)
        return m

    def ellipse(self, cx, cy, rx, ry, ang=0.0):
        m = np.zeros((self.H, self.W), np.uint8)
        cv2.ellipse(m, (int(cx * self.W * SC), int(cy * self.H * SC)),
                    (max(1, int(rx * self.W * SC)), max(1, int(ry * self.H * SC))),
                    ang, 0, 360, 255, -1, cv2.LINE_8, SHIFT)
        return m

    def limb(self, x0, y0, x1, y1, w0, w1):
        """Tapered limb with round ends; widths as a fraction of figure width."""
        d = np.array([x1 - x0, (y1 - y0) * self.H / self.W])
        n = np.array([-d[1], d[0]]) / (np.linalg.norm(d) + 1e-9)
        nx, ny = n[0], n[1] * self.W / self.H
        pts = [(x0 + nx * w0 / 2, y0 + ny * w0 / 2), (x1 + nx * w1 / 2, y1 + ny * w1 / 2),
               (x1 - nx * w1 / 2, y1 - ny * w1 / 2), (x0 - nx * w0 / 2, y0 - ny * w0 / 2)]
        m = self.poly(pts)
        m |= self.ellipse(x0, y0, w0 / 2, w0 / 2 * self.W / self.H)
        m |= self.ellipse(x1, y1, w1 / 2, w1 / 2 * self.W / self.H)
        return m

    def curve(self, pts, width):
        m = np.zeros((self.H, self.W), np.uint8)
        cv2.polylines(m, [self._p(pts)], False, 255, max(1, int(width * self.W)), cv2.LINE_8, SHIFT)
        return m

    def add(self, m, tone, shade=0.45, outline=0.0, dome=1.0):
        mf = (m > 0).astype(np.float32)
        if not mf.any():
            return
        t = np.full_like(mf, tone)
        if shade:
            d = cv2.distanceTransform((m > 0).astype(np.uint8), cv2.DIST_L2, 5)
            dn = d / (d.max() + 1e-6)
            hgt = np.sqrt(dn) * d.max() * 0.9 * dome
            gx = cv2.Sobel(hgt, cv2.CV_32F, 1, 0, ksize=5) / 16.0
            gy = cv2.Sobel(hgt, cv2.CV_32F, 0, 1, ksize=5) / 16.0
            nz = np.ones_like(gx)
            nrm = np.sqrt(gx ** 2 + gy ** 2 + nz ** 2)
            lam = np.clip((-gx * LIGHT[0] - gy * LIGHT[1] + nz * LIGHT[2]) / nrm, 0, 1)
            t = np.clip(tone + shade * (lam - 0.62), 0.02, 1.0)
        if outline:
            k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            edge = (cv2.morphologyEx((m > 0).astype(np.uint8), cv2.MORPH_GRADIENT, k) > 0)
            t = np.where(edge, np.minimum(t, outline), t)
        self.tone = self.tone * (1 - mf) + t * mf
        self.alpha = np.maximum(self.alpha, mf)

    def line(self, pts, width, tone):
        """Dark/bright detail line drawn only where the figure already exists."""
        m = self.curve(pts, width) > 0
        inside = m & (self.alpha > 0)
        self.tone[inside] = tone

    def finish(self):
        t = cv2.resize(self.tone, (self.w, self.h), interpolation=cv2.INTER_AREA)
        a = cv2.resize(self.alpha, (self.w, self.h), interpolation=cv2.INTER_AREA)
        return t, a


# ---------------------------------------------------------------- building blocks
def horse(S, ox, oy, sc, gallop=False, head_down=False, tone=0.5):
    """Side-view horse facing right inside a unit box at (ox, oy) scaled by sc."""
    def P(x, y):
        return ox + x * sc, oy + y * sc
    L = lambda a, b, c, d, w0, w1, t: S.add(S.limb(*P(a, b), *P(c, d), w0 * sc, w1 * sc), t, 0.35)
    far = tone - 0.16
    if gallop:
        L(0.68, 0.46, 0.84, 0.6, 0.07, 0.045, far); L(0.84, 0.6, 0.96, 0.58, 0.04, 0.032, far)
        L(0.3, 0.46, 0.16, 0.62, 0.08, 0.05, far); L(0.16, 0.62, 0.04, 0.74, 0.045, 0.032, far)
    else:
        L(0.66, 0.46, 0.67, 0.7, 0.065, 0.045, far); L(0.67, 0.7, 0.66, 0.9, 0.04, 0.034, far)
        L(0.3, 0.46, 0.33, 0.68, 0.08, 0.05, far); L(0.33, 0.68, 0.3, 0.9, 0.045, 0.034, far)
    S.add(S.curve([P(0.15, 0.33), P(0.08, 0.45), P(0.07, 0.62)], 0.045 * sc), tone - 0.3, 0.15)
    S.add(S.ellipse(*P(0.48, 0.4), 0.27 * sc, 0.12 * sc), tone, 0.5)
    S.add(S.ellipse(*P(0.25, 0.38), 0.12 * sc, 0.13 * sc), tone + 0.02, 0.5)
    S.add(S.ellipse(*P(0.7, 0.4), 0.1 * sc, 0.12 * sc), tone + 0.02, 0.5)
    if head_down:
        S.add(S.poly([P(0.66, 0.34), P(0.76, 0.3), P(0.88, 0.48), P(0.92, 0.62), P(0.84, 0.64), P(0.74, 0.5)]), tone + 0.04, 0.45)
        S.add(S.limb(*P(0.88, 0.58), *P(0.93, 0.74), 0.085 * sc, 0.05 * sc), tone + 0.06, 0.4)
    else:
        S.add(S.poly([P(0.64, 0.38), P(0.72, 0.26), P(0.79, 0.1), P(0.87, 0.07), P(0.88, 0.17), P(0.8, 0.36)]), tone + 0.04, 0.45)
        S.add(S.limb(*P(0.85, 0.1), *P(0.98, 0.22), 0.09 * sc, 0.05 * sc), tone + 0.06, 0.45)
        S.add(S.poly([P(0.82, 0.07), P(0.84, -0.02), P(0.87, 0.06)]), tone - 0.1, 0.2)
        S.line([P(0.8, 0.07), P(0.72, 0.22), P(0.66, 0.33)], 0.035 * sc, tone - 0.32)
    if gallop:
        L(0.72, 0.46, 0.9, 0.56, 0.075, 0.05, tone); L(0.9, 0.56, 1.0, 0.5, 0.045, 0.035, tone)
        L(0.26, 0.46, 0.18, 0.66, 0.09, 0.055, tone); L(0.18, 0.66, 0.02, 0.66, 0.05, 0.035, tone)
    else:
        L(0.71, 0.46, 0.73, 0.7, 0.07, 0.048, tone); L(0.73, 0.7, 0.74, 0.91, 0.042, 0.036, tone)
        L(0.25, 0.46, 0.22, 0.68, 0.09, 0.052, tone); L(0.22, 0.68, 0.25, 0.91, 0.048, 0.036, tone)


def rider(S, ox, oy, sc, hat_tone=0.3, robe=0.62, bow=False, pole=False, slump=False):
    """Rider seated on a horse placed with the same (ox, oy, sc)."""
    def P(x, y):
        return ox + x * sc, oy + y * sc
    lean = 0.05 if slump else 0.0
    S.add(S.limb(*P(0.5, 0.28), *P(0.6, 0.4), 0.09 * sc, 0.06 * sc), robe - 0.18, 0.35)
    S.add(S.limb(*P(0.6, 0.4), *P(0.57, 0.53), 0.055 * sc, 0.04 * sc), robe - 0.22, 0.3)
    S.add(S.poly([P(0.43, 0.3), P(0.59, 0.3), P(0.56 + lean, 0.07 + lean), P(0.45 + lean, 0.07 + lean)]), robe, 0.5)
    hx, hy = P(0.51 + lean * 1.6, 0.01 + lean * 1.4)
    S.add(S.ellipse(hx, hy, 0.042 * sc, 0.045 * sc), 0.74, 0.5)
    S.add(S.poly([(hx - 0.055 * sc, hy - 0.015 * sc), (hx + 0.055 * sc, hy - 0.015 * sc),
                  (hx + 0.035 * sc, hy - 0.085 * sc), (hx - 0.035 * sc, hy - 0.085 * sc)]), hat_tone, 0.35)
    S.add(S.ellipse(hx, hy - 0.09 * sc, 0.014 * sc, 0.014 * sc), 0.12, 0.1)
    if bow:
        S.add(S.limb(*P(0.55, 0.12), *P(0.7, 0.14), 0.04 * sc, 0.032 * sc), robe - 0.1, 0.3)
        arc = [P(0.7 + 0.05 * math.cos(t), 0.14 + 0.14 * math.sin(t)) for t in np.linspace(-1.35, 1.35, 14)]
        S.add(S.curve(arc, 0.02 * sc), 0.15, 0.05)
        S.add(S.curve([P(0.62, 0.15), P(0.72, 0.15)], 0.01 * sc), 0.3, 0.0)
    elif pole:
        S.add(S.limb(*P(0.55, 0.12), *P(0.66, 0.2), 0.04 * sc, 0.032 * sc), robe - 0.1, 0.3)
        S.add(S.curve([P(0.92, -0.32), P(0.66, 0.18), P(0.56, 0.42)], 0.016 * sc), 0.25, 0.0)
    else:
        S.add(S.limb(*P(0.54, 0.12), *P(0.64, 0.24), 0.04 * sc, 0.032 * sc), robe - 0.1, 0.3)


def camel(S, ox, oy, sc, tone=0.62, load=True, head_low=False):
    """Bactrian camel facing right."""
    def P(x, y):
        return ox + x * sc, oy + y * sc
    L = lambda a, b, c, d, w0, w1, t: S.add(S.limb(*P(a, b), *P(c, d), w0 * sc, w1 * sc), t, 0.35)
    far = tone - 0.16
    L(0.36, 0.5, 0.38, 0.73, 0.07, 0.045, far); L(0.38, 0.73, 0.37, 0.96, 0.04, 0.035, far)
    L(0.66, 0.5, 0.66, 0.73, 0.06, 0.042, far); L(0.66, 0.73, 0.67, 0.96, 0.038, 0.034, far)
    S.add(S.curve([P(0.23, 0.4), P(0.2, 0.52)], 0.025 * sc), tone - 0.3, 0.1)
    S.add(S.ellipse(*P(0.5, 0.44), 0.27 * sc, 0.12 * sc), tone, 0.5)
    S.add(S.ellipse(*P(0.4, 0.31), 0.085 * sc, 0.1 * sc), tone + 0.03, 0.5)
    S.add(S.ellipse(*P(0.6, 0.31), 0.085 * sc, 0.1 * sc), tone + 0.03, 0.5)
    if head_low:
        S.add(S.poly([P(0.72, 0.38), P(0.84, 0.44), P(0.92, 0.58), P(0.86, 0.62), P(0.76, 0.52)]), tone, 0.4)
        S.add(S.ellipse(*P(0.92, 0.63), 0.055 * sc, 0.03 * sc, 30), tone + 0.05, 0.4)
    else:
        S.add(S.poly([P(0.7, 0.38), P(0.82, 0.48), P(0.88, 0.36), P(0.88, 0.16), P(0.94, 0.12),
                      P(0.95, 0.2), P(0.93, 0.36), P(0.88, 0.56), P(0.76, 0.54)]), tone, 0.4)
        S.add(S.ellipse(*P(0.95, 0.14), 0.055 * sc, 0.032 * sc, 8), tone + 0.05, 0.4)
    L(0.3, 0.5, 0.29, 0.73, 0.08, 0.05, tone); L(0.29, 0.73, 0.3, 0.97, 0.045, 0.038, tone)
    L(0.72, 0.5, 0.74, 0.73, 0.065, 0.045, tone); L(0.74, 0.73, 0.74, 0.97, 0.042, 0.036, tone)
    if load:
        S.add(S.ellipse(*P(0.5, 0.28), 0.14 * sc, 0.06 * sc), 0.8, 0.5)
        S.add(S.ellipse(*P(0.44, 0.38), 0.06 * sc, 0.08 * sc), 0.35, 0.45)
        S.add(S.ellipse(*P(0.58, 0.38), 0.06 * sc, 0.08 * sc), 0.86, 0.45)


def wagon(S, ox, oy, sc, tone=0.5):
    def P(x, y):
        return ox + x * sc, oy + y * sc
    S.add(S.limb(*P(0.82, 0.62), *P(1.0, 0.7), 0.025 * sc, 0.02 * sc), 0.25, 0.1)
    S.add(S.poly([P(0.08, 0.42), P(0.84, 0.42), P(0.82, 0.66), P(0.1, 0.66)]), tone - 0.1, 0.4)
    arc = [P(0.12 + 0.68 * (0.5 + 0.5 * math.cos(t)), 0.42 - 0.3 * math.sin(t)) for t in np.linspace(0, math.pi, 24)]
    S.add(S.poly(arc), 0.8, 0.55)
    for k in range(1, 5):
        x = 0.12 + 0.68 * k / 5
        S.line([P(x, 0.43), P(x, 0.42 - 0.3 * math.sin(math.acos(2 * (x - 0.12) / 0.68 - 1)) + 0.02)],
               0.01 * sc, 0.55)
    for cx in (0.26, 0.68):
        S.add(S.ellipse(*P(cx, 0.72), 0.14 * sc, 0.14 * sc), 0.2, 0.25)
        S.add(S.ellipse(*P(cx, 0.72), 0.105 * sc, 0.105 * sc), 0.7, 0.2)
        for k in range(8):
            a = k * math.pi / 4
            S.line([P(cx, 0.72), P(cx + 0.1 * math.cos(a), 0.72 + 0.1 * math.sin(a))], 0.014 * sc, 0.2)
        S.add(S.ellipse(*P(cx, 0.72), 0.025 * sc, 0.025 * sc), 0.15, 0.1)


# ---------------------------------------------------------------- the cast
def herder_rider(w=210, h=210):
    S = Sculpt(w, h)
    horse(S, 0.06, 0.26, 0.86)
    rider(S, 0.06, 0.26, 0.86, pole=True)
    return S.finish()


def horseman(w=200, h=190):
    S = Sculpt(w, h)
    horse(S, 0.0, 0.24, 0.9, gallop=True, tone=0.42)
    rider(S, 0.0, 0.24, 0.9, bow=True, robe=0.55, hat_tone=0.22)
    return S.finish()


def empress(w=170, h=200):
    S = Sculpt(w, h)
    S.add(S.poly([(0.06, 1.0), (0.94, 1.0), (0.86, 0.66), (0.62, 0.56), (0.38, 0.56), (0.14, 0.66)]), 0.42, 0.55)
    S.add(S.poly([(0.08, 0.98), (0.3, 0.6), (0.4, 0.64), (0.26, 1.0)]), 0.92, 0.3)      # ermine sash
    for (x, y) in [(0.2, 0.84), (0.27, 0.72), (0.15, 0.95), (0.33, 0.66)]:
        S.add(S.ellipse(x, y, 0.012, 0.016), 0.1, 0.0)
    S.add(S.poly([(0.38, 0.56), (0.62, 0.56), (0.56, 0.74), (0.5, 0.78), (0.44, 0.74)]), 0.85, 0.35)
    S.add(S.limb(0.5, 0.5, 0.5, 0.58, 0.12, 0.13), 0.74, 0.4)
    S.add(S.ellipse(0.5, 0.39, 0.13, 0.15), 0.76, 0.5)                                   # face
    S.add(S.poly([(0.33, 0.42), (0.34, 0.22), (0.5, 0.15), (0.66, 0.22), (0.67, 0.42),
                  (0.62, 0.3), (0.38, 0.3)]), 0.86, 0.45)                                 # powdered hair
    S.add(S.ellipse(0.63, 0.47, 0.05, 0.08), 0.84, 0.4)                                  # curl
    S.add(S.poly([(0.38, 0.17), (0.4, 0.04), (0.45, 0.1), (0.5, 0.0), (0.55, 0.1), (0.6, 0.04),
                  (0.62, 0.17)]), 0.3, 0.55)                                              # crown
    S.add(S.limb(0.37, 0.17, 0.63, 0.17, 0.035, 0.035), 0.55, 0.3)
    S.line([(0.45, 0.38), (0.47, 0.38)], 0.012, 0.25)
    S.line([(0.53, 0.38), (0.55, 0.38)], 0.012, 0.25)
    S.line([(0.47, 0.47), (0.53, 0.47)], 0.01, 0.35)
    return S.finish()


def yurt(w=180, h=150):
    S = Sculpt(w, h)
    S.add(S.poly([(0.08, 0.55), (0.92, 0.55), (0.9, 0.95), (0.1, 0.95)]), 0.72, 0.45)
    dome = [(0.5 + 0.44 * math.cos(t), 0.56 - 0.42 * math.sin(t)) for t in np.linspace(0, math.pi, 30)]
    S.add(S.poly(dome), 0.82, 0.55)
    for k in range(1, 9):
        x = 0.1 + 0.8 * k / 9
        S.line([(x, 0.57), (x - 0.03, 0.94)], 0.008, 0.45)
        S.line([(x - 0.03, 0.57), (x + 0.04, 0.94)], 0.006, 0.55)
    for k in range(7):
        t = 0.25 + k * (math.pi - 0.5) / 6
        S.line([(0.5, 0.16), (0.5 + 0.44 * math.cos(t), 0.56 - 0.4 * math.sin(t))], 0.008, 0.5)
    S.add(S.ellipse(0.5, 0.15, 0.07, 0.035), 0.25, 0.2)
    S.add(S.poly([(0.42, 0.95), (0.58, 0.95), (0.58, 0.66), (0.42, 0.66)]), 0.18, 0.2)
    S.line([(0.08, 0.56), (0.92, 0.56)], 0.02, 0.3)
    return S.finish()


def camel_fig(w=200, h=180):
    S = Sculpt(w, h)
    camel(S, 0.0, 0.02, 0.98)
    return S.finish()


def wagon_fig(w=200, h=160):
    S = Sculpt(w, h)
    wagon(S, 0.0, 0.02, 0.98)
    return S.finish()


def khan(w=150, h=210):
    S = Sculpt(w, h)
    S.add(S.curve([(0.86, 0.0), (0.86, 1.0)], 0.035), 0.25, 0.0)                      # standard pole
    S.add(S.poly([(0.86, 0.04), (0.98, 0.08), (0.86, 0.2)]), 0.88, 0.3)                 # pennant
    S.add(S.ellipse(0.86, 0.02, 0.03, 0.02), 0.2, 0.1)
    S.add(S.poly([(0.3, 0.33), (0.7, 0.33), (0.82, 0.98), (0.18, 0.98)]), 0.4, 0.55)    # robe
    S.add(S.poly([(0.46, 0.33), (0.6, 0.33), (0.62, 0.98), (0.5, 0.98)]), 0.7, 0.3)     # robe front
    S.add(S.limb(0.32, 0.56, 0.68, 0.56, 0.07, 0.07), 0.82, 0.3)                        # sash
    S.add(S.limb(0.68, 0.38, 0.84, 0.5, 0.11, 0.08), 0.38, 0.4)                         # arm
    S.add(S.ellipse(0.85, 0.5, 0.05, 0.035), 0.72, 0.3)
    S.add(S.ellipse(0.5, 0.25, 0.11, 0.08), 0.74, 0.5)                                  # face
    S.add(S.poly([(0.36, 0.21), (0.64, 0.21), (0.6, 0.06), (0.4, 0.06)]), 0.3, 0.45)    # tall hat
    S.add(S.limb(0.34, 0.2, 0.66, 0.2, 0.05, 0.05), 0.85, 0.3)                          # fur brim
    S.add(S.ellipse(0.5, 0.05, 0.025, 0.018), 0.12, 0.1)
    return S.finish()


def herder_standing(w=170, h=190):
    S = Sculpt(w, h)
    S.add(S.ellipse(0.75, 0.8, 0.22, 0.12), 0.9, 0.55)                                  # sheep
    S.add(S.ellipse(0.95, 0.74, 0.06, 0.05), 0.35, 0.3)
    for x in (0.62, 0.7, 0.82, 0.88):
        S.add(S.limb(x, 0.86, x, 0.98, 0.025, 0.02), 0.3, 0.1)
    S.add(S.curve([(0.1, 0.12), (0.12, 0.06), (0.17, 0.05), (0.2, 0.1), (0.2, 1.0)], 0.022), 0.3, 0.0)
    S.add(S.poly([(0.3, 0.3), (0.52, 0.3), (0.6, 0.98), (0.24, 0.98)]), 0.5, 0.55)
    S.add(S.limb(0.32, 0.36, 0.2, 0.5, 0.09, 0.07), 0.45, 0.4)
    S.add(S.ellipse(0.41, 0.22, 0.08, 0.07), 0.72, 0.5)
    S.add(S.poly([(0.3, 0.2), (0.52, 0.2), (0.48, 0.1), (0.34, 0.1)]), 0.25, 0.35)
    return S.finish()


def caravan(w=300, h=200, weary=False):
    S = Sculpt(w, h)
    if not weary:
        wagon(S, 0.0, 0.38, 0.4)
        camel(S, 0.3, 0.1, 0.5, load=True)
        horse(S, 0.66, 0.34, 0.33, tone=0.45)
        rider(S, 0.66, 0.34, 0.33)
    else:
        horse(S, 0.2, 0.3, 0.62, head_down=True, tone=0.48)
        rider(S, 0.2, 0.3, 0.62, robe=0.58, slump=True)
    return S.finish()


def dharma_wheel(size=120):
    """Generic eight-spoked wheel, a common Buddhist symbol, as engraved line art."""
    S = Sculpt(size, size)
    c = 0.5
    S.add(S.ellipse(c, c, 0.46, 0.46), 0.96, 0.0)
    S.line([(c + 0.42 * math.cos(t), c + 0.42 * math.sin(t)) for t in np.linspace(0, 2 * math.pi, 80)], 0.06, 0.1)
    S.line([(c + 0.33 * math.cos(t), c + 0.33 * math.sin(t)) for t in np.linspace(0, 2 * math.pi, 80)], 0.025, 0.15)
    for k in range(8):
        a = k * math.pi / 4
        S.line([(c + 0.1 * math.cos(a), c + 0.1 * math.sin(a)), (c + 0.4 * math.cos(a), c + 0.4 * math.sin(a))], 0.035, 0.1)
        S.line([(c + 0.43 * math.cos(a), c + 0.43 * math.sin(a)), (c + 0.47 * math.cos(a), c + 0.47 * math.sin(a))], 0.07, 0.1)
    S.add(S.ellipse(c, c, 0.11, 0.11), 0.2, 0.0)
    S.line([(c + 0.06 * math.cos(t), c + 0.06 * math.sin(t)) for t in np.linspace(0, 2 * math.pi, 30)], 0.02, 0.95)
    return S.finish()
