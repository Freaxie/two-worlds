"""Kalmyk Exodus, 1771: timeline. Every element has explicit start/end frames,
cued from the narration's word timestamps (build/master/words.json)."""
import json
import math
import os

import numpy as np
import soundfile as sf

import engine as E
import figures as F
import geo
import geodata
import paper
from mapview import MapStore

OFFSET = 0.40          # narration starts 0.40 s into the video
HOLD = 1.3             # hold after the last spoken word
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

import importlib.util
_spec = importlib.util.spec_from_file_location("scene_map", os.path.join(HERE, "kalmyk_scene_map.py"))
M = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(M)

ROUTE = [(47.4, 47.7), (49.6, 48.0), (51.7, 48.15), (54.0, 47.75), (55.4, 47.55), (58.0, 48.3),
         (61.0, 49.2), (63.6, 49.6), (66.8, 48.9), (70.0, 47.9), (73.2, 47.35), (76.2, 47.15),
         (78.8, 46.6), (80.4, 45.3), (81.0, 44.3)]


def last_voice_s(wav):
    x, sr = sf.read(wav)
    w = int(0.01 * sr)
    n = len(x) // w
    r = np.sqrt((x[:n * w].reshape(n, w) ** 2).mean(1))
    db = 20 * np.log10(r / r.max() + 1e-9)
    return (np.nonzero(db > -40)[0][-1] + 1) * w / sr


def cutout(fig, seed, documents=False):
    t, a = fig
    return paper.cutout(t, a, seed=seed, documents=documents)


def mirror(spr):
    s = paper.Sprite.__new__(paper.Sprite)
    s.rgb, s.alpha = spr.rgb[:, ::-1].copy(), spr.alpha[:, ::-1].copy()
    s.shadow = None if spr.shadow is None else np.roll(spr.shadow[:, ::-1], 10, axis=1).copy()
    s.anchor = (spr.alpha.shape[1] - spr.anchor[0], spr.anchor[1])
    return s


def build(root=ROOT):
    cue = E.Cues(os.path.join(root, "build/master/words.json"), OFFSET)
    n_frames = int(math.ceil((OFFSET + last_voice_s(os.path.join(root, "build/master/narration.wav")) + HOLD)
                             * geo.FPS))
    els = []
    add = els.append

    # ---------------- camera (frame, lon, lat, zoom), smoothstep, log zoom, on twos
    cam = E.Camera(46.8, 47.6, 0.72)
    m1 = cue("s2", "Volga") + 14          # right after the paint sweep
    m2 = cue("s5", "So") - 6
    m3 = cue("s7", "marched") - 1
    m4 = cue("s9", "The") - 6
    cam.move(m1, m1 + 24, 50.0, 51.9, 0.34)
    cam.move(m2, m2 + 24, 46.6, 47.4, 1.35)
    cam.move(m3, m3 + 24, 63.5, 46.6, 0.50)
    cam.move(m4, m4 + 24, 55.0, 51.0, 0.30)

    # ---------------- Beat 1: home
    add(E.RansomEl("1771", 40.5, 50.3, 0, 0, cue("s1", "1771"), m1, height=120, seed=1))
    add(E.SpriteEl(cutout(F.herder_rider(), 1), 47.9, 49.6, 0, 0, cue("s1", "nation"), m1, z=12))
    add(E.InkPathEl([(49.6, 48.95), (53.2, 49.45), (57.8, 49.3)], cue("s1", "walk"), 12, m1, arrow=True, z=6))
    add(E.SpriteEl(paper.tag("KALMYKS", 24, 3), 47.9, 49.6, 0, 128, cue("s2", "Kalmyks"), m1, z=25))
    add(E.SpriteEl(cutout(F.dharma_wheel(), 4, documents=True), 50.4, 50.2, 0, 0, cue("s2", "Buddhist"), m1, z=12))
    paint = E.PaintSweep(M.FEATURED, cue("s2", "Volga"))

    # ---------------- Beat 2: the other side
    a0 = m1 + 24
    add(E.InkPathEl([(48.03, 46.35), (36.0, 52.0), (30.31, 59.94)], a0, 14, m2, width=5.0, dash=(27, 19), z=6))
    km = round(geo.gc_km(46.35, 48.03, 59.94, 30.31))
    add(E.SpriteEl(paper.tag(f"{km:,} KM", 24, 5), 37.6, 53.4, 0, 0, a0 + 14, m2, angle=-8, z=25))
    cath = cue("s3", "Catherine")
    add(E.SpriteEl(cutout(F.empress(), 6), 30.31, 59.94, -128, 100, cath, m2, z=12))
    add(E.InkCircleEl(30.31, 59.94, -128, 104, 112, 128, cath + 8, 12, m2))

    # ---------------- Beat 3: causes (one arrow per clause, dated tags)
    c1, c2, c3 = cue("s4", "curbed"), cue("s4", "seized"), cue("s4", "drafted")
    add(E.InkPathEl([(33.5, 58.2), (41.5, 55.0), (46.0, 49.4)], c1, 12, m2, arrow=True, z=7))
    add(E.SpriteEl(paper.tag("1762", 24, 7), 41.2, 56.1, 0, 0, c1 + 12, m2, angle=-4, z=25))
    add(E.InkPathEl([(53.0, 55.2), (51.5, 52.8), (49.6, 50.5)], c2, 12, m2, arrow=True, z=7))
    add(E.SpriteEl(paper.tag("1760s", 24, 8), 53.9, 53.3, 0, 0, c2 + 12, m2, angle=3, z=25))
    add(E.InkPathEl([(45.2, 47.3), (43.4, 46.0), (41.2, 44.4)], c3, 12, m2, arrow=True, z=7))
    add(E.SpriteEl(paper.tag("1769", 24, 9), 46.2, 45.1, 0, 0, c3 + 12, m2, angle=-3, z=25))
    hm = cutout(F.horseman(), 10)
    add(E.MoverEl(hm, [(45.2, 47.3), (43.4, 46.0), (41.2, 44.4)], c3 + 4, c3 + 28, c3 + 2, m2,
                  scale=0.72, flip_sprite=mirror(hm), z=30))

    # ---------------- Beat 4: the exodus
    b4 = m2 + 24
    add(E.CardEl(["January 1771"], "FIG. 04", b4, m3, b4 + 2))
    add(E.SpriteEl(cutout(F.yurt(), 11), 48.0, 48.1, 0, 0, b4 + 8, m3, z=12))
    add(E.SpriteEl(cutout(F.camel_fig(), 12), 48.9, 47.35, 0, 0, b4 + 14, m3, z=13))
    add(E.SpriteEl(cutout(F.wagon_fig(), 13), 50.9, 47.2, 0, 0, b4 + 20, m3, z=13))
    add(E.SpriteEl(cutout(F.khan(), 14), 49.65, 48.35, 0, 0, max(b4 + 26, cue("s5", "Ubashi")), m3, z=14))
    n170 = cue("s5", "170,000")
    add(E.SplashEl(49.5, 45.5, -390, -26, 120, n170 + 2, m3, seed=1))
    add(E.SplashEl(49.5, 45.5, 384, 34, 96, n170 + 26, m3, seed=2))
    add(E.RansomEl("170,000", 49.5, 45.5, 0, 0, n170, m3, height=118, seed=20))
    add(E.InkPathEl([(51.3, 48.05), (52.6, 48.17), (53.5, 48.02)], cue("s5", "east"), 10, m3, arrow=True, z=7))

    # ---------------- Beat 5: the river never froze
    add(E.NoteEl("the river never froze", 44.6, 49.45, 0, 0, cue("s6", "never"), m3, size=64))
    add(E.SpriteEl(cutout(F.herder_standing(), 15), 44.2, 47.0, 0, 0, cue("s6", "stranding"), m3, z=12))
    add(E.InkCircleEl(44.2, 47.0, -8, 6, 150, 134, cue("s6", "west"), 12, m3))

    # ---------------- Beat 6: the march (caravan flies along the dashed trail)
    t0 = m3 + 4
    add(E.InkPathEl(ROUTE, t0, 60, n_frames, width=5.0, dash=(27, 19), z=5, sfx="trail"))
    china = cue("s8", "China")
    add(E.MoverEl(cutout(F.caravan(), 16), ROUTE, t0, t0 + 60, t0 - 2, china, dx=-90, dy=-60, scale=0.78))
    add(E.SpriteEl(paper.tag("JAN–JUL 1771", 24, 17), 56.0, 50.4, 0, 0, t0 + 6, m4, angle=-3, z=25))

    # ---------------- Beat 7: losses, chronological, PLACE YEAR tags
    x1, x2 = cue("s8", "Tens"), cue("s8", "thousands")
    add(E.XEl(55.4, 47.55, 0, 0, x1, n_frames, z=12))
    add(E.SpriteEl(paper.tag("EMBA 1771", 22, 18), 55.4, 47.55, 0, 54, x1 + 6, m4, z=25))
    add(E.XEl(75.6, 47.2, 0, 0, x2, n_frames, z=12))
    add(E.SpriteEl(paper.tag("BALKHASH 1771", 22, 19), 75.6, 47.2, 0, -54, x2 + 6, m4, z=25))
    add(E.SpriteEl(cutout(F.caravan(weary=True), 20), 81.0, 44.3, -90, -60, china, n_frames, scale=0.78, z=30))

    # ---------------- Beat 8: payoff
    st = cue("s9", "still")
    kal = geodata.KALMYKIA[0]["outer"][::6]          # simplified for clean dashes
    add(E.InkPathEl(kal, st, 16, n_frames, width=4.5, dash=(27, 19), z=8, closed=True))
    add(E.NoteEl("still there", 27.2, 47.0, 0, 0, st + 4, n_frames, size=60, angle=-4))
    add(E.InkPathEl([(38.9, 47.05), (40.3, 47.0), (41.4, 46.9)], st + 14, 8, n_frames, arrow=True, z=9))
    add(E.RansomEl("KALMYKIA", 44.6, 52.6, 0, 0, cue("s9", "Kalmykia") + 4, n_frames, height=92, seed=40))
    add(E.SheetEl("Europe's only Buddhist republic: Kalmykia.", "Kalmykia", cue("s9", "Europe's"),
                  cue("s9", "republic"), n_frames))

    store = MapStore(os.path.join(root, "build/map"))
    return E.Scene(cam, els, paint, n_frames, store)
