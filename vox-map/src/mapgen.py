"""Engraved paper map: one ink-coverage raster + one paint mask, 4 mip levels.

Output (build/map/): ink_L{0..3}.npy (uint8 ink coverage) and paint_L{0..3}.npy
(uint8 yellow paint coverage for the featured region). The renderer colours
them: board #EFEBE3 -> ink #1D1C20, then multiplies the yellow paint.

usage: python mapgen.py SCENE_MAP.py OUT_DIR
"""
import importlib.util
import math
import os
import sys
import time

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

import geo
import geodata

FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "fonts")
SHIFT = 4
SC = 1 << SHIFT
EPS = 1e-6


def font(style, size):
    name = {"regular": "LibreCaslonText-Regular.ttf", "italic": "LibreCaslonText-Italic.ttf",
            "bold": "LibreCaslonText-Bold.ttf"}[style]
    return ImageFont.truetype(os.path.join(FONT_DIR, name), int(size))


# --------------------------------------------------------------------- geometry
def chaikin_open(p, passes=3):
    p = np.asarray(p, dtype=np.float64)
    for _ in range(passes):
        if len(p) < 3:
            return p
        q = p[:-1] * 0.75 + p[1:] * 0.25
        r = p[:-1] * 0.25 + p[1:] * 0.75
        mid = np.empty((2 * (len(p) - 1), 2))
        mid[0::2], mid[1::2] = q, r
        p = np.vstack([p[:1], mid, p[-1:]])
    return p


def chaikin_closed(p, passes=3):
    p = np.asarray(p, dtype=np.float64)
    if np.allclose(p[0], p[-1]):
        p = p[:-1]
    for _ in range(passes):
        n = np.roll(p, -1, axis=0)
        out = np.empty((2 * len(p), 2))
        out[0::2] = p * 0.75 + n * 0.25
        out[1::2] = p * 0.25 + n * 0.75
        p = out
    return p


def on_clip(pt):
    x0, y0, x1, y1 = geodata.CLIP_BOX
    return (abs(pt[0] - x0) < EPS or abs(pt[0] - x1) < EPS or
            abs(pt[1] - y0) < EPS or abs(pt[1] - y1) < EPS)


def split_ring(ring):
    """Split a clipped land ring into smoothed coast runs and untouched clip edges.
    Returns (closed polygon for filling, list of coast polylines to stroke)."""
    ring = [tuple(v) for v in ring]
    if ring[0] == ring[-1]:
        ring = ring[:-1]
    n = len(ring)
    clip_seg = [on_clip(ring[i]) and on_clip(ring[(i + 1) % n]) for i in range(n)]
    if not any(clip_seg):
        sm = chaikin_closed(ring)
        return sm, [np.vstack([sm, sm[:1]])]
    start = clip_seg.index(True)
    order = [(start + 1 + k) % n for k in range(n)]
    fill, coasts, run = [], [], []
    for i in order:
        if clip_seg[i]:
            if len(run) > 1:
                sm = chaikin_open(run)
                fill.extend(sm.tolist())
                coasts.append(sm)
            elif run:
                fill.extend(run)
            run = []
            fill.append(ring[i])
        else:
            if not run:
                run = [ring[i]]
            run.append(ring[(i + 1) % n])
    if len(run) > 1:
        sm = chaikin_open(run)
        fill.extend(sm.tolist())
        coasts.append(sm)
    return np.asarray(fill), coasts


def px_int(lonlat):
    p = geo.pts_px(lonlat)
    return np.round(p * SC).astype(np.int32)


def fill(canvas, rings_ll, value):
    polys = [px_int(r).reshape(-1, 1, 2) for r in rings_ll if len(r) > 2]
    if polys:
        cv2.fillPoly(canvas, polys, value, lineType=cv2.LINE_8, shift=SHIFT)


def stroke(canvas, line_ll, width, value=255):
    pts = px_int(line_ll).reshape(-1, 1, 2)
    cv2.polylines(canvas, [pts], False, value, thickness=max(1, int(round(width))),
                  lineType=cv2.LINE_AA, shift=SHIFT)


def dashed(canvas, line_px, width, on=22.0, off=18.0, value=255):
    """Dashed stroke along a polyline given in map px."""
    p = np.asarray(line_px, dtype=np.float64)
    seg = np.diff(p, axis=0)
    L = np.hypot(seg[:, 0], seg[:, 1])
    s = np.concatenate([[0], np.cumsum(L)])
    period = on + off
    t = 0.0
    while t < s[-1]:
        a, b = t, min(t + on, s[-1])
        ts = np.linspace(a, b, max(2, int((b - a) / 4) + 2))
        xs = np.interp(ts, s, p[:, 0])
        ys = np.interp(ts, s, p[:, 1])
        pts = np.round(np.stack([xs, ys], 1) * SC).astype(np.int32).reshape(-1, 1, 2)
        cv2.polylines(canvas, [pts], False, value, thickness=int(width),
                      lineType=cv2.LINE_AA, shift=SHIFT)
        t += period


# --------------------------------------------------------------------- engraving
def engrave(land, water_d, featured, strip=512):
    """Sea lines, waves, land hatch and featured cross-hatch, computed per strip."""
    H, W = land.shape
    A = np.zeros((H, W), np.uint8)
    land_in = cv2.erode(land, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    feat_in = cv2.erode(featured & land, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    xs = np.arange(W, dtype=np.float32)
    for y0 in range(0, H, strip):
        y1 = min(H, y0 + strip)
        ys = np.arange(y0, y1, dtype=np.float32)[:, None]
        d = water_d[y0:y1]
        sea = np.zeros((y1 - y0, W), np.float32)
        for r in (8.0, 19.0, 32.0, 48.0):
            np.maximum(sea, np.clip(1.7 - np.abs(d - r), 0, 1), out=sea)
        # wavy horizontal lines every 22 px, only in open water past the coast bands
        wy = ys - 3.0 * np.sin(xs * (2 * math.pi / 118.0))
        dv = np.abs(np.mod(wy, 22.0) - 11.0)
        wave = np.clip(1.45 - (11.0 - dv), 0, 1)
        wave *= np.clip((d - 58.0) / 6.0, 0, 1)
        np.maximum(sea, wave, out=sea)
        sea *= (d > 0)
        # land: diagonal hatch every 22 px; featured region cross-hatched every 13 px
        u = (xs + ys) / math.sqrt(2)
        du = np.abs(np.mod(u, 22.0) - 11.0)
        hatch = np.clip(1.3 - (11.0 - du), 0, 1) * (land_in[y0:y1] > 0)
        f = feat_in[y0:y1] > 0
        if f.any():
            u1 = np.abs(np.mod(u, 13.0) - 6.5)
            v = (xs - ys) / math.sqrt(2)
            v1 = np.abs(np.mod(v, 13.0) - 6.5)
            cross = np.maximum(np.clip(1.2 - (6.5 - u1), 0, 1), np.clip(1.2 - (6.5 - v1), 0, 1))
            hatch = np.where(f, cross, hatch)
        A[y0:y1] = (np.maximum(sea, hatch * 0.92) * 255).astype(np.uint8)
    return A


def compass(A, lon, lat, R=150):
    cx, cy = (float(v) for v in geo.to_px(lon, lat))
    layer = np.zeros_like(A[int(cy - R - 90):int(cy + R + 40), int(cx - R - 40):int(cx + R + 40)])
    oy, ox = int(cy - R - 90), int(cx - R - 40)
    c = (int((cx - ox) * SC), int((cy - oy) * SC))
    knock = np.zeros_like(layer)
    cv2.circle(knock, c, int((R + 22) * SC), 255, -1, cv2.LINE_AA, SHIFT)
    for rr, t in ((R, 4), (R - 12, 2), (R * 0.42, 2)):
        cv2.circle(layer, c, int(rr * SC), 255, t, cv2.LINE_AA, SHIFT)
    for k in range(64):
        a = k * math.pi / 32
        r0 = R - 12 if k % 2 else R - 24
        p0 = (int((cx - ox + math.cos(a) * r0) * SC), int((cy - oy + math.sin(a) * r0) * SC))
        p1 = (int((cx - ox + math.cos(a) * (R - 2)) * SC), int((cy - oy + math.sin(a) * (R - 2)) * SC))
        cv2.line(layer, p0, p1, 255, 2, cv2.LINE_AA, SHIFT)
    for k in range(8):
        a = -math.pi / 2 + k * math.pi / 4
        L = R * (0.98 if k % 2 == 0 else 0.62)
        w = R * (0.16 if k % 2 == 0 else 0.12)
        tip = np.array([math.cos(a), math.sin(a)]) * L
        side = np.array([-math.sin(a), math.cos(a)]) * w
        base = np.array([cx - ox, cy - oy])
        for sgn, filled in ((1, True), (-1, False)):
            tri = np.array([base, base + tip, base + side * sgn])
            pts = np.round(tri * SC).astype(np.int32)
            if filled:
                cv2.fillPoly(layer, [pts], 255, cv2.LINE_AA, SHIFT)
            cv2.polylines(layer, [pts], True, 255, 2, cv2.LINE_AA, SHIFT)
    img = Image.new("L", (layer.shape[1], layer.shape[0]), 0)
    dr = ImageDraw.Draw(img)
    f = font("bold", 60)
    tw = dr.textlength("N", font=f)
    dr.text((cx - ox - tw / 2, cy - oy - R - 84), "N", font=f, fill=255)
    nmask = np.array(img)
    sub = A[oy:oy + layer.shape[0], ox:ox + layer.shape[1]]
    sub[:] = (sub.astype(np.float32) * (1 - knock / 255.0)).astype(np.uint8)
    np.maximum(sub, layer, out=sub)
    np.maximum(sub, nmask, out=sub)


def text_mask(text, size, style, spacing_em):
    f = font(style, size)
    track = spacing_em * size
    widths = [f.getlength(ch) for ch in text]
    total = int(sum(widths) + track * (len(text) - 1) + size)
    img = Image.new("L", (total + 20, int(size * 1.6)), 0)
    dr = ImageDraw.Draw(img)
    x = 10.0
    for ch, w in zip(text, widths):
        dr.text((x, size * 0.15), ch, font=f, fill=255)
        x += w + track
    m = np.array(img)
    ys, xs = np.nonzero(m)
    return m[max(0, ys.min() - 2):ys.max() + 3, max(0, xs.min() - 2):xs.max() + 3]


def place(A, mask, cx, cy, angle=0.0, halo=7):
    if angle:
        h, w = mask.shape
        M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
        cos, sin = abs(M[0, 0]), abs(M[0, 1])
        nw, nh = int(h * sin + w * cos) + 2, int(h * cos + w * sin) + 2
        M[0, 2] += nw / 2 - w / 2
        M[1, 2] += nh / 2 - h / 2
        mask = cv2.warpAffine(mask, M, (nw, nh), flags=cv2.INTER_CUBIC)
    h, w = mask.shape
    x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
    pad = halo + 2
    big = np.zeros((h + 2 * pad, w + 2 * pad), np.uint8)
    big[pad:pad + h, pad:pad + w] = mask
    hal = cv2.dilate(big, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * halo + 1, 2 * halo + 1)))
    hal = cv2.GaussianBlur(hal, (0, 0), 1.5)
    ys, xs = y0 - pad, x0 - pad
    sub = A[ys:ys + big.shape[0], xs:xs + big.shape[1]]
    sub[:] = (sub.astype(np.float32) * (1 - hal / 255.0)).astype(np.uint8)
    np.maximum(sub, big, out=sub)


# --------------------------------------------------------------------- build
def build(scene, out_dir):
    t0 = time.time()
    H, W = geo.H, geo.W
    print(f"map {W}x{H}")
    land = np.zeros((H, W), np.uint8)
    coasts = []
    for poly in geodata.LAND:
        outer, cs = split_ring(poly["outer"])
        fill(land, [outer], 1)
        coasts += cs
        for hole in poly["holes"]:
            hr, hc = split_ring(hole)
            fill(land, [hr], 0)
            coasts += hc
    lakes = []
    for name, polys in geodata.LAKES.items():
        for poly in polys:
            r = chaikin_closed(poly["outer"])
            lakes.append(r)
            fill(land, [r], 0)
            coasts.append(np.vstack([r, r[:1]]))
    print(f"  land/lakes {time.time() - t0:.1f}s")

    featured = np.zeros((H, W), np.uint8)
    fpoly = chaikin_closed(scene.FEATURED)
    fill(featured, [fpoly], 1)

    water = (1 - land).astype(np.uint8)
    water_d = cv2.distanceTransform(water, cv2.DIST_L2, 5)
    print(f"  distance {time.time() - t0:.1f}s")
    A = engrave(land, water_d, featured)
    del water_d
    print(f"  engraving {time.time() - t0:.1f}s")

    strokes = np.zeros((H, W), np.uint8)
    # graticule, dotted every 10 degrees
    for lon in range(0, 111, 10):
        x = float(geo.to_px(lon, 0)[0])
        for y in np.arange(4, H, 15.0):
            cv2.circle(strokes, (int(x * SC), int(y * SC)), int(1.9 * SC), 200, -1, cv2.LINE_AA, SHIFT)
    for lat in range(20, 81, 10):
        y = float(geo.to_px(0, lat)[1])
        for x in np.arange(4, W, 15.0):
            cv2.circle(strokes, (int(x * SC), int(y * SC)), int(1.9 * SC), 200, -1, cv2.LINE_AA, SHIFT)
    # rivers (major 3.5 px, minor 2.4 px), clipped to land
    rivers = dict(geodata.RIVERS)
    for k, v in scene.EXTRA_RIVERS.items():
        rivers.setdefault(k, []).append(v)
    riv = np.zeros((H, W), np.uint8)
    for name, lines in rivers.items():
        if name not in getattr(scene, "DRAW_RIVERS", rivers):
            continue
        wdt = 3.6 if name in scene.MAJOR_RIVERS else 2.4
        for ln in lines:
            if len(ln) > 1:
                stroke(riv, chaikin_open(ln, 2), wdt)
    riv = (riv.astype(np.float32) * land).astype(np.uint8)
    np.maximum(strokes, riv, out=strokes)
    del riv
    # featured region dashed border (4 px, 22 on / 18 off), inland only
    bord = np.zeros((H, W), np.uint8)
    dashed(bord, geo.pts_px(np.vstack([fpoly, fpoly[:1]])), 4)
    land_in = cv2.erode(land, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    bord = (bord.astype(np.float32) * land_in).astype(np.uint8)
    np.maximum(strokes, bord, out=strokes)
    del bord, land_in
    # coastlines 6 px (lakes 5 px)
    for c in coasts:
        stroke(strokes, c, 6)
    np.maximum(A, strokes, out=A)
    del strokes
    print(f"  strokes {time.time() - t0:.1f}s")

    compass(A, *scene.COMPASS)
    for text, lon, lat, size, style, sp, ang in scene.LABELS:
        m = text_mask(text, size, style, sp)
        cx, cy = (float(v) for v in geo.to_px(lon, lat))
        place(A, m, cx, cy, ang)
    for name, lon, lat, dx, dy, size in scene.CITIES:
        cx, cy = (float(v) for v in geo.to_px(lon, lat))
        dot = np.zeros((40, 40), np.uint8)
        cv2.circle(dot, (20 * SC, 20 * SC), 9 * SC, 255, -1, cv2.LINE_AA, SHIFT)
        place(A, dot, cx, cy, 0, halo=5)
        m = text_mask(name, size, "regular", 0.06)
        place(A, m, cx + dx + m.shape[1] / 2, cy + dy, 0, halo=6)
    print(f"  labels {time.time() - t0:.1f}s")

    # paper grain: faint ink speckle
    rng = np.random.default_rng(7)
    g = rng.random((H // 4 + 1, W // 4 + 1), dtype=np.float32)
    g = cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)
    np.maximum(A, (np.clip(g - 0.55, 0, 1) * 22).astype(np.uint8), out=A)

    # yellow paint mask: featured region on land, ragged brush edge + texture
    paint = (featured & land).astype(np.float32)
    paint = cv2.GaussianBlur(paint, (0, 0), 3.0)
    n1 = cv2.resize(rng.random((H // 32 + 1, W // 32 + 1), dtype=np.float32), (W, H))
    paint = np.clip((paint - 0.5 + (n1 - 0.5) * 0.35) * 6 + 0.5, 0, 1)
    tex = cv2.resize(rng.random((H // 6 + 1, W // 6 + 1), dtype=np.float32), (W, H))
    paint *= 0.9 + 0.1 * tex
    P = (paint * 255).astype(np.uint8)
    del paint, tex, n1, g

    os.makedirs(out_dir, exist_ok=True)
    ink, pnt = A, P
    for L in range(geo.N_MIPS):
        np.save(os.path.join(out_dir, f"ink_L{L}.npy"), ink)
        np.save(os.path.join(out_dir, f"paint_L{L}.npy"), pnt)
        if L + 1 < geo.N_MIPS:
            ink = cv2.resize(ink, (ink.shape[1] // 2, ink.shape[0] // 2), interpolation=cv2.INTER_AREA)
            pnt = cv2.resize(pnt, (pnt.shape[1] // 2, pnt.shape[0] // 2), interpolation=cv2.INTER_AREA)
    print(f"  saved {time.time() - t0:.1f}s")


def load_scene(path):
    spec = importlib.util.spec_from_file_location("scene_map", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


if __name__ == "__main__":
    build(load_scene(sys.argv[1]), sys.argv[2])
