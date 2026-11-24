"""Equirectangular map projection and camera maths shared by every module."""
import math

import numpy as np

# Map extent (degrees). Every camera shot keeps >= 25 deg of map beyond its edges.
LON0, LON1 = -5.0, 115.0
LAT0, LAT1 = 14.0, 88.0
MID_LAT = 0.5 * (LAT0 + LAT1)
S = 150.0                                   # map px per degree of latitude (mip 0)
KX = S * math.cos(math.radians(MID_LAT))    # map px per degree of longitude
W = int(math.ceil((LON1 - LON0) * KX))
H = int(math.ceil((LAT1 - LAT0) * S))
N_MIPS = 4

SCREEN_W, SCREEN_H = 1920, 1080
FPS = 30


def to_px(lon, lat):
    """lon/lat (scalars or arrays) -> mip-0 map pixels."""
    lon = np.asarray(lon, dtype=np.float64)
    lat = np.asarray(lat, dtype=np.float64)
    return (lon - LON0) * KX, (LAT1 - lat) * S


def pts_px(pts):
    a = np.asarray(pts, dtype=np.float64)
    x, y = to_px(a[:, 0], a[:, 1])
    return np.stack([x, y], axis=1)


def mip_level(zoom):
    return int(min(N_MIPS - 1, max(0, math.floor(math.log2(1.0 / zoom) + 0.15))))


class Cam:
    """Camera state: centre lon/lat and zoom (screen px per mip-0 map px)."""

    def __init__(self, lon, lat, zoom):
        self.lon, self.lat, self.zoom = lon, lat, zoom
        self.cx, self.cy = (float(v) for v in to_px(lon, lat))

    def project(self, lon, lat):
        x, y = to_px(lon, lat)
        return ((x - self.cx) * self.zoom + SCREEN_W / 2,
                (y - self.cy) * self.zoom + SCREEN_H / 2)

    def project_pts(self, pts):
        p = pts_px(pts)
        p[:, 0] = (p[:, 0] - self.cx) * self.zoom + SCREEN_W / 2
        p[:, 1] = (p[:, 1] - self.cy) * self.zoom + SCREEN_H / 2
        return p

    def view_bounds(self):
        """(lon_min, lon_max, lat_min, lat_max) visible on screen."""
        hw = SCREEN_W / 2 / self.zoom / KX
        hh = SCREEN_H / 2 / self.zoom / S
        return self.lon - hw, self.lon + hw, self.lat - hh, self.lat + hh


def smoothstep(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def gc_km(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    h = (math.sin((p2 - p1) / 2) ** 2 +
         math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2)
    return 2 * 6371.0 * math.asin(math.sqrt(h))
