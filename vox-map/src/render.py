"""Render stills, a contact sheet, or the full video (CPU workers -> FFmpeg).

usage:
  python render.py SCENE.py --stills 0,100,200
  python render.py SCENE.py --contact out.png [--frames ...]
  python render.py SCENE.py --video out.mp4 [--workers 4]
"""
import argparse
import importlib.util
import multiprocessing as mp
import os
import subprocess
import sys
import time

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import geo  # noqa: E402

_scene = None


def load_scene(path):
    spec = importlib.util.spec_from_file_location("scene", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.build()


def _init(path):
    global _scene
    _scene = load_scene(path)


def _segment(args):
    a, b, out = args
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{geo.SCREEN_W}x{geo.SCREEN_H}", "-r", str(geo.FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t = time.time()
    for f in range(a, b, 2):
        img = _scene.render(f).tobytes()
        p.stdin.write(img)
        if f + 1 < b:
            p.stdin.write(img)       # on twos
    p.stdin.close()
    p.wait()
    return out, b - a, time.time() - t


def video(scene_path, out, workers):
    sc = load_scene(scene_path)
    n = sc.n_frames
    k = workers * 3
    bounds = [int(round(i * n / k / 2)) * 2 for i in range(k + 1)]
    bounds[-1] = n
    tmp = os.path.splitext(out)[0] + "_segs"
    os.makedirs(tmp, exist_ok=True)
    jobs = [(bounds[i], bounds[i + 1], os.path.join(tmp, f"seg{i:03d}.mp4")) for i in range(k)]
    t = time.time()
    with mp.get_context("fork").Pool(workers, initializer=_init, initargs=(scene_path,)) as pool:
        for o, nf, dt in pool.imap(_segment, jobs):
            print(f"  {os.path.basename(o)}: {nf} frames in {dt:.1f}s", flush=True)
    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w") as fh:
        for _, _, o in jobs:
            fh.write(f"file '{os.path.abspath(o)}'\n")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                    "-c", "copy", out], check=True)
    print(f"video: {n} frames ({n / geo.FPS:.2f}s) in {time.time() - t:.1f}s -> {out}")


def contact(scene_path, out, frames=None, cols=4):
    sc = load_scene(scene_path)
    if frames is None:
        frames = np.linspace(0, sc.n_frames - 1, 12).astype(int).tolist()
    tw, th = 640, 360
    rows = (len(frames) + cols - 1) // cols
    sheet = np.full((rows * (th + 34) + 10, cols * (tw + 10) + 10, 3), 40, np.uint8)
    for i, f in enumerate(frames):
        img = sc.render(f)
        r, c = divmod(i, cols)
        x, y = 10 + c * (tw + 10), 10 + r * (th + 34)
        sheet[y:y + th, x:x + tw] = cv2.resize(img, (tw, th), interpolation=cv2.INTER_AREA)
        cv2.putText(sheet, f"f{f}  {f / geo.FPS:.2f}s", (x + 4, y + th + 24), cv2.FONT_HERSHEY_SIMPLEX,
                    0.7, (235, 235, 235), 1, cv2.LINE_AA)
    cv2.imwrite(out, cv2.cvtColor(sheet, cv2.COLOR_RGB2BGR))
    print("contact sheet ->", out, frames)


def stills(scene_path, frames, out_dir):
    sc = load_scene(scene_path)
    os.makedirs(out_dir, exist_ok=True)
    for f in frames:
        t = time.time()
        img = sc.render(f)
        p = os.path.join(out_dir, f"f{f:04d}.png")
        cv2.imwrite(p, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        print(p, f"{time.time() - t:.2f}s")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("scene")
    ap.add_argument("--stills")
    ap.add_argument("--contact")
    ap.add_argument("--frames")
    ap.add_argument("--video")
    ap.add_argument("--workers", type=int, default=os.cpu_count() or 4)
    ap.add_argument("--out", default=os.path.join(HERE, "..", "build", "stills"))
    a = ap.parse_args()
    fr = [int(x) for x in a.frames.split(",")] if a.frames else None
    if a.stills:
        stills(a.scene, [int(x) for x in a.stills.split(",")], a.out)
    if a.contact:
        contact(a.scene, a.contact, fr)
    if a.video:
        video(a.scene, a.video, a.workers)
