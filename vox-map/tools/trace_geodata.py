"""Trace simplified lon/lat vertex lists from Natural Earth (public domain)
into src/geodata.py, so the renderer has no GIS dependency.

usage: python -I tools/trace_geodata.py NE_DIR OUT_PY
"""
import json
import sys

from shapely.geometry import box, shape, mapping
from shapely.ops import unary_union

NE, OUT = sys.argv[1], sys.argv[2]
CLIP = box(-12, 8, 122, 89.5)       # beyond the map extent (-5..115, 14..88)
TOL = 0.03                          # degrees
RIVERS = {"Volga", "Kama", "Oka", "Don", "Donets", "Ural", "Ile", "Syr  Darya", "Amu  Darya",
          "Ertis", "Irtysh", "Dnipro", "Dnepre", "Kuban", "Daugava", "Dniester", "Neva",
          "Ob", "Tobol", "Esil", "Khopr", "Sura", "Belaya"}
LAKES = {"Lake Ladoga", "Lake Onega", "Lake Balkhash", "Issyk-Kul", "Lake Zaysan", "Alakol"}


def rings(geom):
    out = []
    polys = [geom] if geom.geom_type == "Polygon" else list(getattr(geom, "geoms", []))
    for p in polys:
        if p.geom_type != "Polygon" or p.area < 0.02:
            continue
        out.append({"outer": [(round(x, 3), round(y, 3)) for x, y in p.exterior.coords],
                    "holes": [[(round(x, 3), round(y, 3)) for x, y in h.coords]
                              for h in p.interiors if len(h.coords) > 3]})
    return out


def lines(geom):
    gs = [geom] if geom.geom_type == "LineString" else list(getattr(geom, "geoms", []))
    return [[(round(x, 3), round(y, 3)) for x, y in g.coords] for g in gs
            if g.geom_type == "LineString" and len(g.coords) > 1]


land = json.load(open(f"{NE}/ne_10m_land.geojson"))
geoms = [shape(f["geometry"]).buffer(0) for f in land["features"]]
landg = unary_union([g for g in geoms if g.intersects(CLIP)]).intersection(CLIP)
landg = landg.simplify(TOL, preserve_topology=True)

lakes = []
for f in json.load(open(f"{NE}/ne_10m_lakes.geojson"))["features"]:
    if f["properties"].get("name") in LAKES:
        lakes.append((f["properties"]["name"], shape(f["geometry"]).buffer(0).simplify(TOL / 2)))
for f in json.load(open(f"{NE}/ne_10m_lakes_historic.geojson"))["features"]:
    if f["properties"].get("name") == "Aral Sea":       # full shoreline, as in 1771
        lakes.append(("Aral Sea (historic)", shape(f["geometry"]).buffer(0).simplify(TOL / 2)))

rivers = {}
for f in json.load(open(f"{NE}/ne_10m_rivers_lake_centerlines.geojson"))["features"]:
    n = f["properties"].get("name")
    if n in RIVERS and f["geometry"]:
        g = shape(f["geometry"]).intersection(CLIP).simplify(TOL / 2)
        if not g.is_empty:
            rivers.setdefault(n.replace("  ", " "), []).extend(lines(g))

kalmykia = None
for f in json.load(open(f"{NE}/ne_10m_admin_1_states_provinces.geojson"))["features"]:
    if f["properties"].get("name") == "Kalmyk":
        kalmykia = rings(shape(f["geometry"]).buffer(0).simplify(TOL / 2))

nverts = sum(len(r["outer"]) + sum(map(len, r["holes"])) for r in rings(landg))
with open(OUT, "w") as fh:
    fh.write('"""Simplified lon/lat vertex lists (degrees), traced from Natural Earth 1:10m\n'
             '(public domain) by tools/trace_geodata.py. Illustrative, not navigational.\n'
             'Land is clipped to lon -12..122, lat 8..89.5, outside the map, so clip edges\n'
             'never appear as coastline."""\n\n')
    fh.write(f"CLIP_BOX = (-12, 8, 122, 89.5)\n\n")
    fh.write("LAND = " + repr(rings(landg)) + "\n\n")
    fh.write("LAKES = " + repr({n: rings(g) for n, g in lakes}) + "\n\n")
    fh.write("RIVERS = " + repr(rivers) + "\n\n")
    fh.write("KALMYKIA = " + repr(kalmykia) + "\n")
print("land rings", len(rings(landg)), "vertices", nverts, "lakes", [n for n, _ in lakes],
      "rivers", sorted(rivers), "kalmykia", kalmykia and len(kalmykia[0]["outer"]))
