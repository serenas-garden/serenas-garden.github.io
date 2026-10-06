"""Bake Natural Earth countries (world-atlas countries-50m, public domain) into
assets/globe-geo.js for Serena's globe.

- decodes the TopoJSON arcs
- simplifies each arc (Douglas-Peucker, endpoints fixed so neighbours still
  meet), drops tiny islands, densifies long straight edges (49th parallel)
- orients every ring for the renderer: exterior rings counter-clockwise seen
  from outside the sphere (land on the left), holes clockwise
- splits arcs into coastline (used once) and borders (shared by two countries)
- quantises to 0.01 degree and delta-encodes

  curl -LO https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json
  python3 tools/build_globe.py countries-50m.json assets/globe-geo.js
  python3 tools/verify_places.py assets/globe-geo.js assets/travels-data.js
"""
import json, math, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "countries-50m.json"
OUT = sys.argv[2] if len(sys.argv) > 2 else "globe-geo.js"
TOL = float(sys.argv[3]) if len(sys.argv) > 3 else 0.035      # degrees (cos-lat scaled)
MIN_KM2 = float(sys.argv[4]) if len(sys.argv) > 4 else 250.0  # smallest island kept
MAX_STEP = 1.0                                                # densify edges longer than this (deg)

topo = json.load(open(SRC))
sx, sy = topo["transform"]["scale"]
tx, ty = topo["transform"]["translate"]

# ---- decode arcs -----------------------------------------------------------
arcs = []
for arc in topo["arcs"]:
    x = y = 0
    pts = []
    for dx, dy in arc:
        x += dx; y += dy
        pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)

def arc_pts(i):
    return arcs[i] if i >= 0 else arcs[~i][::-1]

geoms = topo["objects"]["countries"]["geometries"]
by_name = {g["properties"]["name"]: g for g in geoms}

# ---- Western Sahara ----------------------------------------------------------
# Natural Earth 4.1 draws "Morocco" down to the Moroccan-administered line deep
# inside Western Sahara. The globe shows Western Sahara as its own territory
# (the UN depiction): Morocco is cut at the 27.66 N line that runs from the
# Algerian tripoint to the coast, and the southern piece joins "W. Sahara".
# Nothing on the globe tints Western Sahara.
mor, ws = by_name["Morocco"], by_name["W. Sahara"]
assert mor["type"] == "Polygon" and len(mor["arcs"]) == 1
m_algeria, m_line, m_coast = mor["arcs"][0]            # 859, 860, 861
A0 = arc_pts(m_algeria); L0 = arc_pts(m_line); C0 = arc_pts(m_coast)
tri = A0[-1]
assert A0[-1] == L0[0] and L0[-1] == C0[0] and C0[-1] == A0[0], "Morocco arcs changed"
CUT_LAT = tri[1]                                        # 27.657, the tripoint
k = next(i for i in range(len(C0) - 1) if C0[i][1] < CUT_LAT <= C0[i + 1][1])
(x0, y0), (x1, y1) = C0[k], C0[k + 1]
cutpt = (x0 + (x1 - x0) * (CUT_LAT - y0) / (y1 - y0), CUT_LAT)
coast_s = C0[:k + 1] + [cutpt]                         # Lagouira -> the cut
coast_n = [cutpt] + C0[k + 1:]                         # the cut -> Mediterranean
cut = [tri, cutpt]                                     # tripoint -> coast, along the parallel
i_cs, i_cn, i_cut = len(arcs), len(arcs) + 1, len(arcs) + 2
arcs += [coast_s, coast_n, cut]
mor["arcs"] = [[i_cut, i_cn, m_algeria]]
assert ws["type"] == "Polygon" and (~m_line) in ws["arcs"][0]
ws["type"] = "MultiPolygon"
ws["arcs"] = [ws["arcs"], [[m_line, i_cs, ~i_cut]]]

# ---- Antarctica ----------------------------------------------------------------
# world-atlas stores the mainland as a tiny ring round the South Pole with the
# coastline as its "hole" (d3's spherical trick). This renderer wants the plain
# version: one ring, the coastline, with the continent inside it.
ant = by_name["Antarctica"]
for i, poly in enumerate(ant["arcs"]):
    if len(poly) == 2 and all(p[1] < -89.9 for p in arc_pts(poly[0][0])):
        ant["arcs"][i] = [poly[1]]
        break
else:
    raise SystemExit("Antarctica's polar ring not found")

# Places drawn as one, so no border is inked between them (de facto splits in
# Natural Earth that most maps don't show).
SAME = {"Somaliland": "Somalia", "N. Cyprus": "Cyprus", "Siachen Glacier": "India"}

# ---- Douglas-Peucker on each arc -----------------------------------------
def dp(pts, tol):
    if len(pts) < 3:
        return pts[:]
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]; bx, by = pts[b]
        k = math.cos(math.radians((ay + by) / 2))
        best, bi = -1, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            # distance in a locally scaled plane (lon * cos lat, lat)
            x1, y1 = (ax) * k, ay
            x2, y2 = (bx) * k, by
            x0, y0 = px * k, py
            dx, dy = x2 - x1, y2 - y1
            L = dx * dx + dy * dy
            if L == 0:
                d = math.hypot(x0 - x1, y0 - y1)
            else:
                t = max(0, min(1, ((x0 - x1) * dx + (y0 - y1) * dy) / L))
                d = math.hypot(x0 - (x1 + t * dx), y0 - (y1 + t * dy))
            if d > best:
                best, bi = d, i
        if best > tol:
            keep[bi] = True
            stack.append((a, bi)); stack.append((bi, b))
    return [p for p, k in zip(pts, keep) if k]

simple = [dp(a, TOL) for a in arcs]

def ring_coords(refs, src):
    out = []
    for r in refs:
        p = src[r] if r >= 0 else src[~r][::-1]
        out.extend(p if not out else p[1:])
    return out

# ---- areas and orientation --------------------------------------------------
def to3(lon, lat):
    l, p = math.radians(lon), math.radians(lat)
    return (math.cos(p) * math.cos(l), math.cos(p) * math.sin(l), math.sin(p))

def norm(v):
    m = math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)
    return (v[0] / m, v[1] / m, v[2] / m)

def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])

def dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

def tangent_area(coords):
    """Signed area (km^2) in an azimuthal equal-area plane centred on the
    ring's mean direction, seen from outside: > 0 means counter-clockwise."""
    vs = [to3(*c) for c in coords]
    m = norm((sum(v[0] for v in vs), sum(v[1] for v in vs), sum(v[2] for v in vs)))
    up = (0, 0, 1) if abs(m[2]) < 0.9 else (1, 0, 0)
    e = norm(cross(up, m))       # east-ish
    n = cross(m, e)              # north-ish; e x n = m (toward the viewer)
    R = 6371.0
    pts = []
    for v in vs:
        c = max(-1, min(1, dot(v, m)))
        k = math.sqrt(2 / (1 + c)) if c > -0.999999 else 0
        pts.append((R * k * dot(v, e), R * k * dot(v, n)))
    a = 0
    for i in range(len(pts) - 1):
        a += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1]
    return a / 2

def reverse(refs):
    return [~r for r in reversed(refs)]

# ---- countries --------------------------------------------------------------
countries = []
dropped = 0
for g in geoms:
    if g["type"] == "Polygon":
        polys = [g["arcs"]]
    elif g["type"] == "MultiPolygon":
        polys = g["arcs"]
    else:
        continue
    kept = []
    for poly in polys:
        rings = []
        for ri, refs in enumerate(poly):
            coords = ring_coords(refs, simple)
            area = tangent_area(coords)
            if ri == 0 and (abs(area) < MIN_KM2 or len(coords) < 4):
                rings = None
                dropped += 1
                break
            if ri > 0 and (abs(area) < MIN_KM2 or len(coords) < 4):
                continue
            want_ccw = (ri == 0)
            if (area > 0) != want_ccw:
                refs = reverse(refs)
            rings.append(refs)
        if rings:
            kept.append(rings)
    if kept:
        countries.append({"name": g["properties"]["name"], "id": g.get("id"), "polys": kept})

# ---- coastline vs borders -------------------------------------------------------
use = {}
owners = {}
for c in countries:
    for poly in c["polys"]:
        for refs in poly:
            for r in refs:
                i = r if r >= 0 else ~r
                use[i] = use.get(i, 0) + 1
                owners.setdefault(i, set()).add(SAME.get(c["name"], c["name"]))
coast = sorted(i for i, n in use.items() if n == 1)
border = sorted(i for i, n in use.items() if n >= 2 and len(owners[i]) >= 2)

# ---- densify + quantise used arcs, renumber ---------------------------------------
def densify(pts):
    out = [pts[0]]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        dx = x1 - x0
        if dx > 180:          # the edge crosses the 180th meridian: go the short way
            dx -= 360
        elif dx < -180:
            dx += 360
        steps = int(math.ceil(max(abs(dx), abs(y1 - y0)) / MAX_STEP))
        for s in range(1, steps):
            x = x0 + dx * s / steps
            x = x - 360 if x > 180 else x + 360 if x < -180 else x
            out.append((x, y0 + (y1 - y0) * s / steps))
        out.append((x1, y1))
    return out

# Strokes skip edges that run along the 180th meridian: those are where
# Natural Earth cut a country (Fiji, the Antarctic coast) to suit flat maps,
# not real coastline. Such arcs are split into extra stroke-only arcs.
def on_seam(a, b):
    return abs(a[0]) > 179.99 and abs(b[0]) > 179.99

def stroke_pieces(i):
    pts = simple[i]
    pieces, cur = [], [pts[0]]
    for a, b in zip(pts, pts[1:]):
        if on_seam(a, b):
            if len(cur) > 1:
                pieces.append(cur)
            cur = [b]
        else:
            cur.append(b)
    if len(cur) > 1:
        pieces.append(cur)
    return pieces

used = sorted(use)
renum = {old: new for new, old in enumerate(used)}
extra = []
def stroke_refs(ids):
    out = []
    for i in ids:
        pieces = stroke_pieces(i)
        if len(pieces) == 1 and len(pieces[0]) == len(simple[i]):
            out.append(renum[i])
        else:
            for pc in pieces:
                out.append(len(used) + len(extra))
                extra.append(pc)
    return out
coast_refs = stroke_refs(coast)
border_refs = stroke_refs(border)

enc_arcs = []
npts = 0
for pts in [simple[o] for o in used] + extra:
    pts = densify(pts)
    q = [(round(x * 100), round(y * 100)) for x, y in pts]
    flat = [q[0][0], q[0][1]]
    for (a, b), (c, d) in zip(q, q[1:]):
        flat += [c - a, d - b]
    enc_arcs.append(flat)
    npts += len(q)

def rn(r):
    return renum[r] if r >= 0 else ~renum[~r]

out_c = []
for c in countries:
    out_c.append({"n": c["name"], "id": c["id"],
                  "p": [[[rn(r) for r in refs] for refs in poly] for poly in c["polys"]]})

data = {
    "arcs": enc_arcs,
    "coast": coast_refs,
    "border": border_refs,
    "countries": out_c,
}
body = json.dumps(data, separators=(",", ":"))
with open(OUT, "w") as f:
    f.write("/* Baked geography for the travels globe. Generated, not hand-edited:\n"
            "   see CLAUDE.md (Travels) for how to rebuild it.\n"
            "   Source: Natural Earth 1:50m admin-0 countries (public domain), via the\n"
            "   world-atlas package (countries-50m.json, v2.0.2). Arcs are simplified,\n"
            "   small islands dropped, coordinates in hundredths of a degree, each arc\n"
            "   delta-encoded [lon0, lat0, dlon, dlat, ...]. Rings are lists of arc\n"
            "   indices (~i = arc i reversed); exterior rings run counter-clockwise seen\n"
            "   from space, holes clockwise. `coast` and `border` index the arcs used\n"
            "   by one country and by two. */\n")
    f.write("window.GLOBE_GEO = " + body + ";\n")

print("countries", len(countries), "dropped polys", dropped, "arcs", len(enc_arcs),
      "points", npts, "bytes", len(body))
