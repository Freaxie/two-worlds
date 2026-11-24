"""Hand-written geography for the Kalmyk 1771 map (lon, lat in degrees).

These are illustrative approximations, drawn from the sources in
kalmyk_1771_plan.md, not surveyed boundaries.
"""

# Approximate Kalmyk pastures c. 1770: Saratov to the Caspian, Manych/Kuma to
# the Yaik (Ural). The polygon deliberately runs out into the Caspian; it is
# clipped to land when painted, so the sea edge follows the real coastline.
FEATURED = [
    (45.9, 51.65), (47.6, 51.45), (49.6, 51.35), (51.2, 51.3), (51.5, 50.6),
    (51.65, 49.8), (51.9, 48.9), (51.95, 48.0), (52.0, 47.1), (51.5, 46.4),
    (49.5, 45.0), (47.8, 43.9), (47.0, 43.55), (46.0, 43.75), (45.0, 44.15),
    (44.0, 44.55), (43.0, 45.1), (42.0, 45.75), (41.3, 46.4), (41.6, 47.1),
    (42.6, 47.7), (43.6, 48.3), (44.2, 48.9), (44.8, 49.7), (45.3, 50.5),
    (45.6, 51.1),
]

# Rivers missing from the Natural Earth centre-line set.
EXTRA_RIVERS = {
    "Emba": [(58.7, 49.05), (58.3, 48.85), (57.9, 48.8), (57.5, 48.55), (57.1, 48.5),
             (56.7, 48.25), (56.3, 48.2), (55.9, 47.95), (55.5, 47.85), (55.1, 47.6),
             (54.7, 47.5), (54.3, 47.2), (53.9, 47.1), (53.5, 46.8), (53.25, 46.65)],
}
# Only the rivers the story needs, plus a few for orientation.
DRAW_RIVERS = {"Volga", "Kama", "Don", "Ural", "Emba", "Ile", "Syr Darya", "Amu Darya", "Dnipro",
               "Dnepre"}
MAJOR_RIVERS = {"Volga", "Ural", "Don", "Ile", "Syr Darya", "Amu Darya", "Ertis", "Irtysh",
                "Dnipro", "Dnepre", "Emba", "Ob", "Kama"}

COMPASS = (31.2, 43.0)          # open water in the Black Sea

# (text, lon, lat, size px @mip0, style, letter-spacing em, angle deg)
LABELS = [
    ("RUSSIAN EMPIRE", 58.0, 58.6, 118, "regular", 0.34, 0),
    ("KAZAKH STEPPE", 69.6, 43.35, 96, "regular", 0.32, 0),
    ("QING", 80.0, 41.75, 66, "regular", 0.36, 0),
    ("EMPIRE", 80.0, 41.05, 66, "regular", 0.36, 0),
    ("CASPIAN", 49.35, 44.55, 58, "italic", 0.22, 0),
    ("SEA", 49.35, 43.95, 58, "italic", 0.22, 0),
    ("BLACK SEA", 36.4, 43.55, 62, "italic", 0.22, 0),
    ("ARAL", 59.85, 45.45, 48, "italic", 0.2, 0),
    ("SEA", 59.85, 44.9, 48, "italic", 0.2, 0),
    ("Lake Balkhash", 77.4, 45.25, 46, "italic", 0.12, -14),
    ("Volga", 46.05, 47.75, 50, "italic", 0.18, -44),
    ("Ural", 52.55, 49.2, 42, "italic", 0.16, -80),
    ("Don", 41.55, 49.55, 42, "italic", 0.16, 0),
    ("Emba", 56.1, 48.55, 38, "italic", 0.16, -24),
    ("Ili", 79.6, 44.25, 40, "italic", 0.16, 0),
]

# Cities: (name, lon, lat, label dx, label dy in map px, size)
CITIES = [
    ("St Petersburg", 30.31, 59.94, 30, -22, 72),
    ("Astrakhan", 48.03, 46.35, 26, 24, 50),
    ("Kulja", 81.32, 43.91, 24, 26, 50),
]
