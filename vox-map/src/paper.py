"""Paper collage pieces: halftone cut-outs, tags, title cards, ransom letters,
sheets. Every piece is a Sprite (rgb, alpha, shadow alpha) at final screen size;
pieces keep a constant screen size whatever the camera zoom."""
import math
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from mapview import BEIGE, BOARD, INK, YELLOW

FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "fonts")
FONTS = {
    "caslon": "LibreCaslonText-Regular.ttf", "caslon_bold": "LibreCaslonText-Bold.ttf",
    "caslon_italic": "LibreCaslonText-Italic.ttf", "marker": "PermanentMarker-Regular.ttf",
    "elite": "SpecialElite-Regular.ttf", "anton": "Anton-Regular.ttf",
}
_font_cache = {}


def font(name, size):
    key = (name, int(size))
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(os.path.join(FONT_DIR, FONTS[name]), int(size))
    return _font_cache[key]


SHADOW_OFF = (5, 7)
SHADOW_BLUR = 6
SHADOW_OPACITY = 0.32
PAD = 26


class Sprite:
    """rgb float32 HxWx3, alpha float32 HxW, shadow float32 HxW, anchor (x, y) in px."""

    def __init__(self, rgb, alpha, anchor=None, shadow=True):
        h, w = alpha.shape
        P = PAD
        self.rgb = np.zeros((h + 2 * P, w + 2 * P, 3), np.float32)
        self.rgb[P:P + h, P:P + w] = rgb
        self.alpha = np.zeros((h + 2 * P, w + 2 * P), np.float32)
        self.alpha[P:P + h, P:P + w] = alpha
        if shadow:
            sh = np.zeros_like(self.alpha)
            dx, dy = SHADOW_OFF
            sh[P + dy:P + dy + h, P + dx:P + dx + w] = alpha
            self.shadow = cv2.GaussianBlur(sh, (0, 0), SHADOW_BLUR / 2.0) * SHADOW_OPACITY
        else:
            self.shadow = None
        ax, ay = anchor if anchor is not None else (w / 2, h / 2)
        self.anchor = (ax + P, ay + P)


def composite(frame, spr, x, y, scale=1.0, angle_deg=0.0):
    """Blend sprite onto frame (float32 HxWx3) with its anchor at screen (x, y)."""
    H, W = frame.shape[:2]
    ax, ay = spr.anchor
    a = math.radians(angle_deg)
    c, s = math.cos(a) * scale, math.sin(a) * scale
    M = np.array([[c, -s, x - (c * ax - s * ay)], [s, c, y - (s * ax + c * ay)]], np.float32)
    h, w = spr.alpha.shape
    corners = np.array([[0, 0, 1], [w, 0, 1], [0, h, 1], [w, h, 1]], np.float32) @ M.T
    x0, y0 = np.floor(corners.min(0)).astype(int)
    x1, y1 = np.ceil(corners.max(0)).astype(int)
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
    if x1 <= x0 or y1 <= y0:
        return
    M2 = M.copy()
    M2[0, 2] -= x0
    M2[1, 2] -= y0
    size = (x1 - x0, y1 - y0)
    flags = cv2.INTER_LINEAR
    al = cv2.warpAffine(spr.alpha, M2, size, flags=flags)[..., None]
    rgb = cv2.warpAffine(spr.rgb, M2, size, flags=flags)
    roi = frame[y0:y1, x0:x1]
    if spr.shadow is not None:
        sh = cv2.warpAffine(spr.shadow, M2, size, flags=flags)[..., None]
        roi[:] = roi * (1 - sh) + INK * sh
    roi[:] = roi * (1 - al) + rgb * al


# ------------------------------------------------------------------ halftone cut-outs
def halftone(tone, cell=5.0, angle=45.0, mix=0.34, contrast=1.25, grain=0.07, seed=0):
    """tone 0=black..1=white -> ink coverage 0..1 (45 deg 5 px dot screen)."""
    t = np.clip((tone - 0.5) * contrast + 0.5, 0, 1).astype(np.float32)
    h, w = t.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    a = math.radians(angle)
    u = xx * math.cos(a) + yy * math.sin(a)
    v = -xx * math.sin(a) + yy * math.cos(a)
    cu = (np.floor(u / cell) + 0.5) * cell
    cv_ = (np.floor(v / cell) + 0.5) * cell
    cx = cu * math.cos(a) - cv_ * math.sin(a)
    cy = cu * math.sin(a) + cv_ * math.cos(a)
    tb = cv2.GaussianBlur(t, (0, 0), cell * 0.42)
    samp = cv2.remap(tb, cx, cy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    r = cell * np.sqrt(np.clip(1 - samp, 0, 1) / math.pi) * 1.08
    dist = np.hypot(u - cu, v - cv_)
    dot = np.clip(r - dist + 0.5, 0, 1)
    ink = dot * (1 - mix) + (1 - t) * mix
    rng = np.random.default_rng(seed)
    ink += (rng.random((h, w), dtype=np.float32) - 0.5) * 2 * grain
    return np.clip(ink, 0, 1)


def value_noise(h, w, scale, seed):
    rng = np.random.default_rng(seed)
    g = rng.random((int(h / scale) + 3, int(w / scale) + 3), dtype=np.float32)
    return cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC)[:h, :w]


def cutout(tone, alpha, edge=7.0, seed=0, documents=False):
    """Figure (tone, alpha at 1x) -> Sprite with a wobbly 7 px paper scissor edge."""
    m = 18
    h, w = alpha.shape
    t = np.ones((h + 2 * m, w + 2 * m), np.float32)
    al = np.zeros_like(t)
    t[m:m + h, m:m + w] = tone * alpha + (1 - alpha)
    al[m:m + h, m:m + w] = alpha
    out = (al < 0.5).astype(np.uint8)
    d = cv2.distanceTransform(out, cv2.DIST_L2, 5)
    wob = (value_noise(*al.shape, 9.0, seed) - 0.5) * 3.2 + (value_noise(*al.shape, 3.0, seed + 1) - 0.5) * 1.0
    cut = np.clip(edge + wob - d + 0.5, 0, 1)
    cut = np.maximum(cut, al)
    if documents:
        ink = np.clip(1 - t, 0, 1)
    else:
        ink = halftone(t, seed=seed) * (al > 0.02)
        ink *= np.clip(al * 1.4, 0, 1)
    paper = BEIGE - (value_noise(*al.shape, 2.0, seed + 2)[..., None] - 0.5) * 6
    rgb = paper + (INK - paper) * ink[..., None]
    return Sprite(rgb, cut)


# ------------------------------------------------------------------ text pieces
def text_img(text, fname, size, tracking=0.0, fill=255):
    f = font(fname, size)
    widths = [f.getlength(ch) for ch in text]
    total = sum(widths) + tracking * size * max(0, len(text) - 1)
    asc, desc = f.getmetrics()
    img = Image.new("L", (int(total + size), int(asc + desc + size * 0.3)), 0)
    dr = ImageDraw.Draw(img)
    x = size * 0.5
    for ch, wd in zip(text, widths):
        dr.text((x, size * 0.15), ch, font=f, fill=fill)
        x += wd + tracking * size
    m = np.asarray(img, np.float32) / 255.0
    ys, xs = np.nonzero(m > 0.02)
    if len(xs) == 0:
        return np.zeros((2, 2), np.float32)
    return m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def torn_rect(w, h, jag=1.6, seed=0):
    """Paper strip alpha with slightly irregular scissor edges."""
    rng = np.random.default_rng(seed)
    pts = []
    n = max(4, int(w / 14))
    for i in range(n + 1):
        pts.append((i * w / n, rng.uniform(-jag, jag)))
    m = max(3, int(h / 14))
    for i in range(1, m + 1):
        pts.append((w + rng.uniform(-jag, jag), i * h / m))
    for i in range(n - 1, -1, -1):
        pts.append((i * w / n, h + rng.uniform(-jag, jag)))
    for i in range(m - 1, 0, -1):
        pts.append((rng.uniform(-jag, jag), i * h / m))
    P = np.array(pts, np.float64) + 4
    a = np.zeros((h + 8, w + 8), np.uint8)
    cv2.fillPoly(a, [np.round(P * 16).astype(np.int32)], 255, cv2.LINE_AA, 4)
    return a.astype(np.float32) / 255.0


def paper_rgb(shape, colour, seed):
    g = value_noise(shape[0], shape[1], 2.0, seed)[..., None]
    fib = value_noise(shape[0], shape[1], 18.0, seed + 5)[..., None]
    return colour - (g - 0.5) * 7 - (fib - 0.5) * 5


def tag(text, size=24, seed=0):
    """Special Elite on a small yellow paper strip."""
    t = text_img(text, "elite", size, tracking=0.16)
    th, tw = t.shape
    px, py = int(size * 0.55), int(size * 0.42)
    w, h = tw + 2 * px, th + 2 * py
    al = torn_rect(w, h, seed=seed)
    rgb = paper_rgb(al.shape, YELLOW, seed)
    ink = np.zeros(al.shape, np.float32)
    ink[4 + py:4 + py + th, 4 + px:4 + px + tw] = t
    rgb = rgb + (INK - rgb) * (ink[..., None] * 0.95)
    return Sprite(rgb, al)


def ransom_letter(ch, idx, height=110, seed=0):
    """One cut-paper letter on an ink / beige / yellow square."""
    fonts = ["caslon_bold", "anton", "elite"]
    papers = [INK, BEIGE, YELLOW]
    rng = np.random.default_rng(seed)
    fname = fonts[idx % 3]
    paper = papers[(idx * 2 + 1) % 3]
    size = height * rng.uniform(0.92, 1.08)
    if ch in ",.":
        size *= 0.75
    t = text_img(ch, fname, size * (1.15 if fname == "anton" else 1.0))
    th, tw = t.shape
    pad = int(height * 0.14)
    w, h = tw + 2 * pad, max(th + 2 * pad, int(height * (0.55 if ch in ",." else 1.0)))
    al = torn_rect(w, h, jag=2.2, seed=seed)
    rgb = paper_rgb(al.shape, paper, seed)
    ink_col = BEIGE if paper is INK else INK
    ink = np.zeros(al.shape, np.float32)
    oy = 4 + (h - th) // 2
    ink[oy:oy + th, 4 + pad:4 + pad + tw] = t
    rgb = rgb + (ink_col - rgb) * ink[..., None]
    return Sprite(rgb, al)


def card(lines, width=560, size=68, fig="FIG. 04", seed=0, n_chars=None):
    """Title card: beige paper, Libre Caslon, yellow FIG tag. Height follows line count."""
    f = font("caslon", size)
    lh = int(size * 1.18)
    h = int(size * 0.62) * 2 + lh * len(lines)
    al = torn_rect(width, h, jag=1.2, seed=seed)
    rgb = paper_rgb(al.shape, BEIGE, seed)
    img = Image.new("L", (width, h), 0)
    dr = ImageDraw.Draw(img)
    remaining = sum(len(l) for l in lines) if n_chars is None else n_chars
    y = int(size * 0.5)
    for line in lines:
        part = line[:max(0, remaining)]
        remaining -= len(line)
        dr.text((int(size * 0.55), y), part, font=f, fill=255)
        y += lh
    ink = np.zeros(al.shape, np.float32)
    ink[4:4 + h, 4:4 + width] = np.asarray(img, np.float32) / 255.0
    rgb = rgb + (INK - rgb) * ink[..., None]
    base = Sprite(rgb, al)
    return base


def sheet(text, size=46, highlight_word=None, seed=0):
    """Bottom-centre beige sheet with a bold Caslon sentence.
    Returns (Sprite, highlight box (x0, x1, y) in sprite px or None)."""
    f = font("caslon_bold", size)
    tw = int(f.getlength(text))
    pad_x, pad_y = int(size * 0.9), int(size * 0.62)
    asc, desc = f.getmetrics()
    w, h = tw + 2 * pad_x, asc + desc + 2 * pad_y
    al = torn_rect(w, h, jag=1.4, seed=seed)
    rgb = paper_rgb(al.shape, BEIGE, seed)
    img = Image.new("L", (w, h), 0)
    dr = ImageDraw.Draw(img)
    dr.text((pad_x, pad_y), text, font=f, fill=255)
    ink = np.zeros(al.shape, np.float32)
    ink[4:4 + h, 4:4 + w] = np.asarray(img, np.float32) / 255.0
    rgb = rgb + (INK - rgb) * ink[..., None]
    hl = None
    if highlight_word and highlight_word in text:
        pre = text[:text.index(highlight_word)]
        x0 = pad_x + f.getlength(pre) + 4
        x1 = x0 + f.getlength(highlight_word)
        hl = (x0 + 26, x1 + 26, 4 + pad_y + asc * 0.62 + 26)   # + Sprite PAD
    return Sprite(rgb, al), hl
