"""Sample the engraved map for a camera: warp the right mip level to screen."""
import os

import cv2
import numpy as np

import geo

BOARD = np.array([239, 235, 227], np.float32)   # #EFEBE3
INK = np.array([29, 28, 32], np.float32)        # #1D1C20
YELLOW = np.array([237, 189, 46], np.float32)   # #EDBD2E
BEIGE = np.array([241, 237, 228], np.float32)   # #F1EDE4


class MapStore:
    def __init__(self, d):
        self.ink = [np.load(os.path.join(d, f"ink_L{L}.npy"), mmap_mode="r") for L in range(geo.N_MIPS)]
        self.paint = [np.load(os.path.join(d, f"paint_L{L}.npy"), mmap_mode="r") for L in range(geo.N_MIPS)]

    def sample(self, cam, layer="ink"):
        L = geo.mip_level(cam.zoom)
        src = (self.ink if layer == "ink" else self.paint)[L]
        s = cam.zoom * (2 ** L)
        cx, cy = cam.cx / 2 ** L, cam.cy / 2 ** L
        # crop the needed window first (mmap-friendly), then warp
        hw, hh = geo.SCREEN_W / 2 / s + 4, geo.SCREEN_H / 2 / s + 4
        x0, y0 = max(0, int(cx - hw)), max(0, int(cy - hh))
        x1, y1 = min(src.shape[1], int(cx + hw) + 2), min(src.shape[0], int(cy + hh) + 2)
        win = np.ascontiguousarray(src[y0:y1, x0:x1])
        M = np.array([[s, 0, geo.SCREEN_W / 2 - (cx - x0) * s],
                      [0, s, geo.SCREEN_H / 2 - (cy - y0) * s]], np.float32)
        interp = cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR
        if s < 1:
            # INTER_AREA is not supported by warpAffine; pre-shrink then warp
            nw, nh = max(1, int(win.shape[1] * s)), max(1, int(win.shape[0] * s))
            small = cv2.resize(win, (nw, nh), interpolation=cv2.INTER_AREA)
            fx, fy = nw / win.shape[1], nh / win.shape[0]
            M = np.array([[s / fx, 0, geo.SCREEN_W / 2 - (cx - x0) * s],
                          [0, s / fy, geo.SCREEN_H / 2 - (cy - y0) * s]], np.float32)
            win = small
            interp = cv2.INTER_LINEAR
        return cv2.warpAffine(win, M, (geo.SCREEN_W, geo.SCREEN_H), flags=interp,
                              borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def colourise(ink_cov, paint_cov=None):
    a = ink_cov.astype(np.float32)[..., None] / 255.0
    rgb = BOARD + (INK - BOARD) * a
    if paint_cov is not None:
        p = 0.9 * paint_cov.astype(np.float32)[..., None] / 255.0
        rgb *= 1.0 - p * (1.0 - YELLOW / 255.0)
    return rgb
