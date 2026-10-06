"""Draw the postcard stamps for travels.html -> assets/travels-stamps.js.

Each stamp is a little scene in a 60 x 52 box. Classes:
  k  ink outline            fills: a sky, b sea, c cream, d rose, e sage,
  f moss, g gold, h red, i sand, j stone, l lilac, m terracotta, n night,
  o peach, p ink, q blush, r wood, s blue, t teal, u brick, v pine, w white,
  x honey, y lamp yellow

  python3 tools/build_stamps.py assets/travels-stamps.js
"""
import json, math, sys

def P(d, c=""):
    return '<path class="%s" d="%s"/>' % (c, d) if c else '<path d="%s"/>' % d

def R(x, y, w, h, c):
    return '<rect class="%s" x="%g" y="%g" width="%g" height="%g"/>' % (c, x, y, w, h)

def C(x, y, r, c):
    return '<circle class="%s" cx="%g" cy="%g" r="%g"/>' % (c, x, y, r)

def E(x, y, rx, ry, c):
    return '<ellipse class="%s" cx="%g" cy="%g" rx="%g" ry="%g"/>' % (c, x, y, rx, ry)

def f(v):
    return ("%.2f" % v).rstrip("0").rstrip(".")

def star(cx, cy, r1, r2, n=5, c="y", rot=-90):
    pts = []
    for i in range(2 * n):
        r = r1 if i % 2 == 0 else r2
        a = math.radians(rot + i * 180 / n)
        pts.append("%s %s" % (f(cx + r * math.cos(a)), f(cy + r * math.sin(a))))
    return P("M" + " L".join(pts) + "Z", c)

def thin(s):  # thinner ink
    return s.replace('class="k', 'style="stroke-width:.8" class="k', 1)

def arch_win(x, y, w, h, c="n"):
    r = w / 2
    return P("M%s %s V%s A%s %s 0 0 1 %s %s V%s Z" % (f(x), f(y + h), f(y + r), f(r), f(r), f(x + w), f(y + r), f(y + h)), c)

def leaf(x0, y0, x1, y1, bend, c="k v"):
    # a pointed leaf from (x0,y0) to (x1,y1), bulging by `bend`
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L * bend, dx / L * bend
    return P("M%s %s Q%s %s %s %s Q%s %s %s %s Z" % (
        f(x0), f(y0), f(mx + nx), f(my + ny), f(x1), f(y1), f(mx - nx * .35), f(my - ny * .35), f(x0), f(y0)), c)

def palm(x, y, s=1.0):
    out = []
    for (dx, dy, b) in [(-12, 3, 3), (-10, -5, -3), (-3, -10, -3), (8, -7, 3), (12, 2, -3), (5, 6, 2)]:
        out.append(leaf(x, y, x + dx * s, y + dy * s, b * s))
    return "".join(out)

def pine(x, base, h, c="k v"):
    w = h * .42
    return P("M%s %s L%s %s L%s %s Z" % (f(x - w), f(base), f(x), f(base - h), f(x + w), f(base)), c)

def wave(y, x0=0, x1=60, amp=1.6, step=6, c="k"):
    d = "M%s %s" % (f(x0), f(y))
    x = x0
    while x < x1 - 1e-6:
        d += " q%s %s %s 0" % (f(step / 2), f(-amp), f(step))
        x += step
    return P(d, c)

def flake(x, y, r):
    d = ""
    for a in (0, 60, 120):
        t = math.radians(a)
        d += "M%s %s L%s %s " % (f(x - r * math.cos(t)), f(y - r * math.sin(t)), f(x + r * math.cos(t)), f(y + r * math.sin(t)))
    return '<path class="k" style="stroke:#fff;stroke-width:1" d="%s"/>' % d.strip()

def ground(y, c="e", wavy=False):
    if wavy:
        return P("M0 %s Q15 %s 30 %s T60 %s V52 H0Z" % (f(y), f(y - 3), f(y), f(y - 1)), c) + \
               P("M0 %s Q15 %s 30 %s T60 %s" % (f(y), f(y - 3), f(y), f(y - 1)), "k")
    return R(0, y, 60, 52 - y, c) + P("M0 %s H60" % f(y), "k")

S = {}

# ---- the intro stamp: a toadstool ----
S["toadstool"] = (
    R(0, 0, 60, 52, "q") + ground(43, "e", True) +
    P("M25 45 C24 39 25 34 26.5 31 H33.5 C35 34 36 39 35 45 Z", "k c") +
    P("M13 31.5 C13 18.5 21 11 30 11 C39 11 47 18.5 47 31.5 C38 34 22 34 13 31.5 Z", "k h") +
    C(21, 21, 2.6, "w") + C(31, 16, 2.2, "w") + C(39.5, 23, 2.4, "w") + C(28, 26.5, 1.6, "w") +
    thin(P("M8 45 l1.6 -5 M11 45 l-.6 -4 M49 45 l1.6 -5 M52 45 l-.6 -4", "k")) +
    star(52, 10, 2.6, 1.1, 4, "w")
)

# ---- the Americas ----
S["cottage"] = (  # Carmel-by-the-Sea: a storybook cottage and a cypress
    R(0, 0, 60, 52, "a") + R(0, 36, 60, 10, "b") + wave(39, 0, 22, 1.2, 5) +
    P("M41 25 V18 H44.5 V28", "k j") +
    P("M26 46 V33.4 H47.4 V46Z", "k c") +
    P("M23 33 C27.5 30 31 22 35 12.5 C39 21.5 44 29.5 50.5 33 C46 34.2 41.5 32.4 36.8 33.6 C32 34.6 27.5 32.4 23 33Z", "k r") +
    P("M33.6 46 V40 a3 3 0 0 1 6 0 V46", "k h") +
    R(28.5, 37, 3.6, 4, "k y") + R(42, 37, 3.6, 4, "k y") +
    ground(46, "e") +
    P("M10 46 C10 41 9 37 8 33", "k") +
    P("M8 34 C1.5 34 1 28.5 6 27.5 C6 22 14.5 21 15.5 25.5 C21 25 21.5 30.5 16.5 31 C14.5 34 10.5 34.5 8 34Z", "k f")
)

S["palms"] = (  # Los Angeles
    R(0, 0, 60, 52, "o") + C(41, 19, 8, "g") +
    P("M0 38 Q12 30 24 35.5 T48 32 T60 33 V52 H0Z", "k l") +
    ground(44, "i") +
    P("M17 44 C18 34 19 24 21.2 15", "k") + P("M34 44 C34 38 35 32 37 26.5", "k") +
    palm(21.2, 15, 1.0) + palm(37, 26.5, .72)
)

def tuft(x, y, r=3.2):
    return star(x, y, r, r * .45, 7, "k f", -90)

S["joshua"] = (  # Joshua Tree
    R(0, 0, 60, 52, "q") + star(47, 10, 3, 1.3, 5, "k y") + C(10, 9, 1, "w") + C(28, 6, .8, "w") +
    P("M35 44 C34 37 40 34 45 36 C49 32.5 57 35 56 44Z", "k j") +
    ground(43, "i") +
    P("M20 43.5 V30 M20 34 C16 32.5 14.5 28.5 14.5 23.5 M20 31.5 C23.5 29.5 25.5 25.5 25.5 20.5 M14.8 26.5 C11.8 25.5 10.5 22.5 10.5 19.5", "k") +
    '<path class="k" style="stroke-width:2.8;stroke:#2f3a2c" d="M20 43.5 V30"/>' +
    tuft(14.5, 22.5) + tuft(25.5, 19.5) + tuft(10.5, 18.5, 2.8) + tuft(20, 29.5, 2.6)
)

S["ski"] = (  # Sun Valley: the world's first chairlifts
    R(0, 0, 60, 52, "a") + C(51, 9, 4, "k y") +
    P("M0 44 L17 19 L25 27 L36 12 L60 41 V52 H0Z", "k w") +
    P("M17 19 L13 25 L16 24 L18 27 L21 23 Z M36 12 L32 18 L35 17 L38 21 L41 18 Z", "j") +
    pine(7, 44, 7) + pine(12, 44.5, 5.5) + pine(49, 44, 6) + pine(54, 44.5, 7.5) +
    ground(44, "e") +
    thin(P("M2 8 L58 31", "k")) +
    P("M22.5 16.4 V25 M18.5 25 H26.5 M18.5 25 V28.5 H26.5", "k") + R(18.5, 25, 8, 3.5, "k h") +
    P("M41.5 24.2 V30 M38 30 H45", "k") + R(38, 30, 7, 3, "k h")
)

S["sloth"] = (  # Costa Rica
    R(0, 0, 60, 52, "e") +
    leaf(0, 50, 18, 40, 5, "k f") + leaf(60, 48, 44, 38, -5, "k v") + leaf(60, 30, 49, 22, 4, "k f") + leaf(0, 30, 10, 22, -4, "k v") +
    '<path class="k" style="stroke-width:3.4;stroke:#7a5c45" d="M0 13 C18 10 40 15 60 11"/>' +
    P("M23.5 22 Q22 16 24.5 12.6 M36.5 22 Q38 16 35.5 13.2", "k") +
    '<path style="fill:none;stroke:#a89a85;stroke-width:3;stroke-linecap:round" d="M23.5 22 Q22 16 24.5 12.6 M36.5 22 Q38 16 35.5 13.2"/>' +
    E(30, 26, 9.5, 7.5, "k j") +
    C(30, 35, 6.2, "k c") +
    P("M25.4 34.2 C26 32 28.6 32 29.2 34.6 M30.8 34.6 C31.4 32 34 32 34.6 34.2", "k p") +
    C(30, 37, .9, "p") + P("M28.2 39 Q30 40.3 31.8 39", "k") +
    leaf(14, 46, 22, 52, 3, "k f")
)

S["sunset"] = (  # St. Petersburg, the Sunshine City
    R(0, 0, 60, 52, "o") + R(0, 0, 60, 14, "q") + C(30, 34, 11, "k g") +
    R(0, 34, 60, 18, "b") + P("M0 34 H60", "k") +
    '<path style="stroke:#f4dc7a;stroke-width:1.6;stroke-linecap:round" d="M22 38 H38 M25 42 H35 M27.5 46 H32.5"/>' +
    thin(P("M8 13 q2.5 -2.5 5 0 q2.5 -2.5 5 0 M44 9 q2 -2 4 0 q2 -2 4 0", "k")) +
    P("M52 52 C52 44 51 38 49 31", "k") + palm(49, 31, .6)
)

S["boardwalk"] = (  # Ocean City
    R(0, 0, 60, 52, "a") + R(0, 33, 60, 7, "b") + wave(35.5, 0, 60, 1, 5) + R(0, 40, 60, 4, "i") +
    "".join(P("M%s %s L%s %s" % (f(40 + 12.5 * math.cos(math.radians(a))), f(21 + 12.5 * math.sin(math.radians(a))),
                                    f(40 - 12.5 * math.cos(math.radians(a))), f(21 - 12.5 * math.sin(math.radians(a)))), "k")
            for a in (0, 45, 90, 135)) +
    C(40, 21, 12.5, "k") + C(40, 21, 2, "k g") +
    "".join(C(40 + 12.5 * math.cos(math.radians(a)), 21 + 12.5 * math.sin(math.radians(a)), 2.2, "k " + col)
            for a, col in zip(range(0, 360, 45), "hgdbhgdb")) +
    P("M33 44 L40 21 L47 44", "k") +
    R(0, 44, 60, 8, "r") + thin(P("M0 44 H60 M6 44 V52 M14 44 V52 M22 44 V52 M30 44 V52 M38 44 V52 M46 44 V52 M54 44 V52", "k")) +
    R(5, 34, 8, 6, "k c") + P("M4 34 L9 30 L14 34Z", "k h")
)

S["skyline"] = (  # New York City
    R(0, 0, 60, 52, "o") + C(49, 12, 5, "y") +
    R(3, 28, 8, 18, "k l") + R(11, 22, 7, 24, "k j") + R(40, 26, 8, 20, "k j") + R(48, 31, 9, 15, "k l") + R(34, 33, 7, 13, "k c") +
    P("M23 46 V24 H37 V46Z", "k x") + P("M25 24 V18 H35 V24", "k x") + P("M27.5 18 V12.5 H32.5 V18", "k x") +
    P("M29 12.5 V9 H31 V12.5", "k x") + P("M30 9 V2.5", "k") +
    "".join(R(x, y, 1.4, 1.8, "y") for x in (25.5, 28.5, 31.5, 34) for y in (27, 31, 35, 39)) +
    "".join(R(x, y, 1.3, 1.6, "y") for x in (13, 15.5) for y in (25, 29, 33, 37)) +
    R(0, 46, 60, 6, "b") + P("M0 46 H60", "k") + wave(49, 2, 58, .9, 5)
)

def gingerbread(x, w, base, wall, peak, body, roof):
    # a narrow Oak Bluffs cottage: steep gable, fretwork trim, porch, door
    mid = x + w / 2
    top = base - wall
    return (R(x, top, w, wall, "k " + body) +
            P("M%s %s L%s %s L%s %s Z" % (f(x - 1.6), f(top + 1), f(mid), f(top - peak), f(x + w + 1.6), f(top + 1)), "k " + roof) +
            P("M%s %s L%s %s L%s %s Z" % (f(x + 2.4), f(top), f(mid), f(top - peak + 4.2), f(x + w - 2.4), f(top)), "k w") +
            thin(P("M%s %s q1 1.6 2 0 q1 1.6 2 0 q1 1.6 2 0" % (f(mid - 3), f(top + 1.4)), "k")) +
            arch_win(mid - 1.5, top - peak + 6.2, 3, 4, "y") +
            thin(P("M%s %s H%s M%s %s V%s M%s %s V%s" % (f(x), f(base - 9), f(x + w), f(x + 2), f(base - 9), f(base - 6), f(x + w - 2), f(base - 9), f(base - 6)), "k")) +
            R(mid - 2, base - 7.5, 4, 7.5, "k r") +
            R(x + 1.6, top + 3.6, 2.6, 3.4, "k c") + R(x + w - 4.2, top + 3.6, 2.6, 3.4, "k c"))

S["gingerbread"] = (  # Martha's Vineyard: the gingerbread cottages of Oak Bluffs
    R(0, 0, 60, 52, "a") +
    gingerbread(4, 14, 45, 15, 13, "d", "s") +
    gingerbread(23, 15, 45, 19, 15, "y", "h") +
    gingerbread(42, 14, 45, 14, 12, "t", "l") +
    ground(45, "e") + thin(P("M2 48 h3 M10 49 h3 M30 48 h3 M47 49 h3", "k"))
)

S["abbey"] = (  # Mont-Saint-Michel: the abbey on its rock in the bay
    R(0, 0, 60, 52, "q") +
    R(0, 41, 60, 11, "b") + P("M0 41 H60", "k") +
    P("M0 47 Q14 44 26 47 T60 46 V52 H0Z", "i") + wave(44.4, 2, 14, .8, 5) + wave(44.4, 47, 59, .8, 5) +
    P("M4 42 C10 39.5 13 35 17 32 C20 28.5 23 24 26 21.5 H34 C37 24 40 28.5 43 32 C47 35 50 39.5 56 42Z", "k j") +
    P("M41 31.5 C44.5 33.5 47.5 36.5 50.5 39.5 C46.5 39 43.5 36.5 40.5 34.2Z M18.5 32.5 C16 35 13.5 37.5 10.5 39.5 C14 39.6 17 37.6 19.6 35Z", "f") +
    R(9.5, 38.6, 41, 3.8, "k c") +
    thin(P("M9.5 38.6 v-1.2 h2.6 v1.2 M15.5 38.6 v-1.2 h2.6 v1.2 M21.5 38.6 v-1.2 h2.6 v1.2 M27.5 38.6 v-1.2 h2.6 v1.2 M33.5 38.6 v-1.2 h2.6 v1.2 M39.5 38.6 v-1.2 h2.6 v1.2 M45.5 38.6 v-1.2 h2.6 v1.2", "k")) +
    R(8, 36.2, 3.4, 6.2, "k c") + R(48.6, 36.2, 3.4, 6.2, "k c") + arch_win(28.6, 39.4, 2.8, 3, "n") +
    R(15.6, 33.6, 3.6, 3.4, "k c") + P("M15.1 33.6 L17.4 31.6 L19.7 33.6Z", "k m") +
    R(19.6, 30.2, 3.6, 3.4, "k c") + P("M19.1 30.2 L21.4 28.2 L23.7 30.2Z", "k m") +
    R(23.4, 26.6, 3.4, 3.4, "k c") + P("M22.9 26.6 L25.1 24.7 L27.3 26.6Z", "k m") +
    R(33.6, 21.6, 6.4, 9.8, "k c") + "".join(R(x, 23.6, 1.1, 4.6, "n") for x in (35, 37.4)) +
    R(25.4, 14.4, 9.2, 7.4, "k c") + P("M24.6 14.8 L30 11 L35.4 14.8Z", "k j") +
    "".join(arch_win(x, 16.2, 1.5, 3.4, "n") for x in (27, 29.25, 31.5)) +
    P("M29.2 11.4 L30 3 L30.8 11.4Z", "k j") + C(30, 2.6, 1, "k g")
)

S["door"] = (  # Dublin: a Georgian door
    R(0, 0, 60, 52, "u") +
    thin(P("".join("M0 %s H60 " % y for y in range(4, 52, 6)) +
           "".join("M%s %s V%s " % (x + (6 if (y // 6) % 2 else 0), y, y + 6) for y in range(4, 46, 6) for x in range(0, 60, 12)), "k")) +
    R(16, 10, 28, 42, "k c") +
    P("M20 24 A10 10 0 0 1 40 24 Z", "k y") +
    thin(P("M30 24 V14 M30 24 L23.5 16.5 M30 24 L36.5 16.5 M30 24 L21 21 M30 24 L39 21", "k")) +
    R(20, 25, 20, 27, "k s") +
    thin(P("M30 25 V52 M22.5 28 H27.5 V36 H22.5Z M32.5 28 H37.5 V36 H32.5Z M22.5 39 H27.5 V49 H22.5Z M32.5 39 H37.5 V49 H32.5Z", "k")) +
    C(30, 37.5, 1.6, "k g") + C(26.5, 43, .9, "g") +
    R(13, 49, 34, 3, "k j")
)

S["castle"] = (  # Scotland
    R(0, 0, 60, 52, "a") +
    P("M0 36 Q12 24 26 30 T60 27 V52 H0Z", "k f") +
    R(19, 20, 22, 12, "k j") +
    P("M15 32 V15 H17 V13 H19 V15 H21 V13 H23 V15 H25 V32Z", "k j") +
    P("M35 32 V15 H37 V13 H39 V15 H41 V13 H43 V15 H45 V32Z", "k j") +
    arch_win(27.5, 25, 5, 7) + arch_win(18.6, 19, 2.8, 4) + arch_win(38.6, 19, 2.8, 4) +
    P("M40 13 V6", "k") + P("M40 6 L46 7.6 L40 9.2Z", "k h") +
    R(0, 42, 60, 10, "b") + P("M0 42 H60", "k") + wave(46, 4, 56, 1, 6) +
    '<path style="fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round;opacity:.75" d="M3 36 H22 M38 39 H57"/>'
)

S["bigben"] = (  # London
    R(0, 0, 60, 52, "a") +
    P("M18 16 L24 3.5 L30 16Z", "k v") +
    R(19, 16, 10, 5, "k x") + R(18, 21, 12, 10, "k x") + C(24, 26, 3.7, "k w") +
    thin(P("M24 26 V23.6 M24 26 H26", "k")) +
    R(19, 31, 10, 21, "k x") + thin(P("M22 33 V50 M26 33 V50", "k")) +
    R(36, 34, 20, 12, "k h") + P("M36 40 H56", "k") +
    "".join(R(x, 35.6, 3.2, 3, "k w") for x in (38, 42.4, 46.8, 51.2)) +
    "".join(R(x, 41.6, 3.2, 2.6, "k w") for x in (42.4, 46.8, 51.2)) +
    C(40.5, 46.4, 2.1, "k p") + C(52, 46.4, 2.1, "k p") +
    ground(48, "j")
)

S["cotswold"] = (  # the Cotswolds: honey stone cottage and a sheep
    R(0, 0, 60, 52, "a") +
    P("M0 36 Q20 26 40 32 T60 28 V52 H0Z", "k e") +
    P("M25.5 23 V16.5 H29 V26", "k x") +
    P("M5 30 L19.5 17.5 L34 30Z", "k j") + R(8, 30, 23, 15, "k x") +
    P("M41 25 L47 20 L53 25Z", "k j") + R(42.5, 25, 9, 7, "k x") +
    P("M16.6 45 V38 a2.9 2.9 0 0 1 5.8 0 V45", "k r") +
    R(10.5, 33.5, 4.6, 4, "k c") + R(24, 33.5, 4.6, 4, "k c") + thin(P("M12.8 33.5 V37.5 M26.3 33.5 V37.5", "k")) +
    ground(45, "e") +
    P("M36 47 q-2.6 -3.8 1.6 -5 q1.6 -3 5 -1.6 q4 -1.2 4.2 2.8 q2.8 2.2 -.4 3.8Z", "k w") +
    E(48.4, 43, 1.9, 1.5, "k p") + thin(P("M39 47 V50 M44 47 V50", "k"))
)

S["stones"] = (  # Stonehenge at sunrise
    R(0, 0, 60, 52, "q") + C(30, 11, 5.5, "g") +
    thin(P("M30 2.5 V4 M21.5 11 H23 M37 11 H38.5 M24 5 L25 6 M36 5 L35 6", "k")) +
    R(5, 24, 6, 18, "k j") + R(14, 24, 6, 18, "k j") + R(4, 19.5, 17, 4.5, "k j") +
    R(25, 22, 4, 20, "k j") + R(31, 22, 4, 20, "k j") + R(24, 17.5, 12, 4.5, "k j") +
    R(40, 25, 6, 17, "k j") + R(49, 27, 6, 15, "k j") + R(39, 21, 17, 4, "k j") +
    P("M18 42 L20 36 L24 37 L23 42Z", "k j") +
    ground(42, "e") + thin(P("M8 47 l1 -2 M30 48 l1 -2 M50 46 l1 -2", "k"))
)

# ---- Europe ----
S["eiffel"] = (  # Paris
    R(0, 0, 60, 52, "q") +
    P("M9 14 q2 -4 6 -2 q3 -3 6 0 q3 0 3 2Z", "w") + P("M40 9 q2 -3 5 -1.6 q3 -2.4 5 0 q2.6 0 2.6 1.6Z", "w") +
    P("M17 48 C23 38 26.5 26 28.4 9 H31.6 C33.5 26 37 38 43 48 H37 Q30 38 23 48Z", "k r") +
    P("M23.5 33 H36.5 M26.4 22 H33.6", "k") +
    thin(P("M24.5 36 L35.5 44 M35.5 36 L24.5 44 M27 25 L33 31 M33 25 L27 31 M28.6 13 L31.4 19 M31.4 13 L28.6 19", "k")) +
    P("M30 9 V3", "k") + ground(48, "e")
)

S["peaks"] = (  # Chamonix and Mont Blanc
    R(0, 0, 60, 52, "a") +
    P("M0 40 L9 27 L13 31 L21 12 L25 20 L31 5 L36 19 L41 14 L49 28 L53 25 L60 34 V52 H0Z", "k w") +
    P("M21 12 L18 19 L21 18 L22 21 Z M31 5 L28 13 L31 11.5 L32.5 15 Z M41 14 L39 19 L42 18Z", "j") +
    pine(6, 46, 8) + pine(12, 46, 6) + pine(50, 46, 7) + pine(56, 46, 9) +
    ground(46, "e") +
    P("M24 46 V40 H36 V46", "k c") + P("M22 40.5 L30 34.5 L38 40.5Z", "k r") + R(28.2, 41.6, 3.6, 4.4, "k y")
)

S["yacht"] = (  # Monaco
    R(0, 0, 60, 52, "a") +
    P("M0 30 Q14 20 30 26 T60 22 V36 H0Z", "k e") +
    "".join(R(x, y, 4, 4, "k " + c) for x, y, c in ((6, 26, "c"), (12, 24, "x"), (19, 26, "c"), (36, 24, "x"), (42, 22, "c"), (49, 23, "d"))) +
    R(0, 36, 60, 16, "b") + P("M0 36 H60", "k") +
    P("M12 44 L48 44 L43.5 49 L17 49Z", "k w") + P("M20 44 V39.5 H36 L40.5 44", "k c") +
    "".join(R(x, 40.8, 2.4, 1.8, "s") for x in (23, 27, 31)) +
    P("M29 39.5 V33", "k") + P("M29 33 L34 34.5 L29 36Z", "k h") + wave(50.5, 6, 54, .8, 6)
)

S["dome"] = (  # Florence: Brunelleschi's dome
    R(0, 0, 60, 52, "o") +
    P("M6 46 C5 38 6 30 8 24 C10 30 11 38 10 46Z", "k v") + P("M52 46 C51 37 52 29 54 22 C56 29 57 37 56 46Z", "k v") +
    R(12, 38, 36, 10, "k c") + "".join(C(x, 43, 1.8, "k n") for x in (18, 30, 42)) +
    P("M15 38 C15 25 22 15.5 30 15.5 C38 15.5 45 25 45 38Z", "k m") +
    thin(P("M30 15.5 V38 M23.5 18.2 C20.6 24.5 19.6 31 19.6 38 M36.5 18.2 C39.4 24.5 40.4 31 40.4 38", "w")) +
    R(28, 10, 4, 5.5, "k w") + P("M27.4 10 L30 5 L32.6 10Z", "k j") + P("M30 5 V2.4", "k") +
    ground(48, "j")
)

S["colosseum"] = (  # Rome
    R(0, 0, 60, 52, "a") +
    P("M4 46 V22 Q24 13 43 15.5 L46 21 L50 19.5 L56 25 V46Z", "k x") +
    "".join(arch_win(x, 37.5, 4.4, 8.5) for x in (7, 13.5, 20, 26.5, 33, 39.5, 46)) +
    "".join(arch_win(x, 28, 4.4, 7) for x in (7, 13.5, 20, 26.5, 33, 39.5, 46)) +
    "".join(arch_win(x, 20.5, 4.4, 5.6) for x in (7, 13.5, 20, 26.5, 33)) +
    P("M4 36.2 H56 M4 27 H56", "k") +
    ground(46, "j") + C(48, 9, 4, "y")
)

S["island"] = (  # Corfu: little Mouse Island, a chapel and cypresses
    R(0, 0, 60, 52, "a") +
    P("M0 33 Q10 27 20 30.5 T40 29 T60 31 V34 H0Z", "k l") +
    R(0, 34, 60, 18, "b") + P("M0 34 H60", "k") +
    P("M12 42 Q30 30 48 42Z", "k e") +
    P("M35 39 C33 32 34 24 35.5 18 C37 24 38 32 36 39Z", "k v") + P("M40 40 C38.6 34.5 39.4 29 40.5 25 C41.6 29 42.4 34.5 41 40Z", "k v") +
    R(22, 34, 8, 6.5, "k w") + P("M21 34.2 L26 30 L31 34.2Z", "k m") +
    R(28.6, 29.5, 3, 4.6, "k w") + P("M28.2 29.6 L30.1 26.4 L32 29.6Z", "k m") +
    arch_win(24.8, 36.2, 2.4, 4.3) + wave(47, 4, 56, .9, 6)
)

S["cove"] = (  # the Albanian Riviera: a turquoise cove
    R(0, 0, 60, 52, "a") + C(46, 9, 4, "y") +
    R(0, 24, 60, 28, "t") + P("M0 24 H60", "k") +
    P("M0 16 C8 16 14 20 17 30 C19 38 16 46 18 52 H0Z", "k j") + P("M0 16 C8 16 13 19 15.5 25 C10 23 5 23 0 24Z", "k f") +
    P("M60 20 C52 20 46 25 44 33 C42 41 45 47 43 52 H60Z", "k j") + P("M60 20 C52 20 47 23.5 45.2 28.5 C50 27 55 27 60 28Z", "k f") +
    R(4, 18, 3, 3, "k w") + R(8.5, 19.5, 3, 3, "k w") + R(52, 22, 3, 3, "k w") +
    P("M18 52 Q30 43 43 52Z", "k i") +
    P("M30 47 V38", "k") + P("M23.5 39 Q30 32 36.5 39Z", "k d") + thin(P("M30 34.6 V39 M26.6 37 Q27.6 38 27 39 M33.4 37 Q32.4 38 33 39", "k")) +
    P("M26 30 L34 30 L32.4 32.2 L27.6 32.2Z", "k w") + P("M30 30 V25.5 L33 29.4Z", "k c")
)

S["lighthouse"] = (  # Menorca
    R(0, 0, 60, 52, "a") +
    '<path style="stroke:#f4dc7a;stroke-width:2;stroke-linecap:round;opacity:.9" d="M36 10 L56 5 M36 12.5 L56 18"/>' +
    R(0, 38, 60, 14, "b") + P("M0 38 H60", "k") + wave(45, 2, 26, .9, 5) +
    P("M14 52 Q18 38 30 39.5 Q42 36 50 52Z", "k j") +
    P("M25.6 41 L27.6 16 H32.4 L34.4 41Z", "k w") +
    P("M26.3 32 H33.7 M26.9 24 H33.1", "k") + R(25.5, 13, 9, 3, "k p") +
    R(27.5, 7.5, 5, 5.5, "k y") + P("M26.6 7.6 L30 3.6 L33.4 7.6Z", "k h") + arch_win(28.8, 34.5, 2.4, 4.5)
)

S["sailboat"] = (  # Mallorca: the Tramuntana and a sail
    R(0, 0, 60, 52, "a") + C(12, 10, 4, "y") +
    P("M0 31 L9 20 L16 26 L25 11 L34 23 L42 15 L52 24 L60 21 V36 H0Z", "k l") +
    R(0, 36, 60, 16, "t") + P("M0 36 H60", "k") +
    P("M31.4 12 V43", "k") + P("M32.6 13.5 L45 41.5 H32.6Z", "k c") + P("M30.2 17 L20 41.5 H30.2Z", "k d") +
    P("M19 43 L44 43 L40.4 47.5 L22.6 47.5Z", "k w") + wave(50, 8, 52, .8, 6)
)

S["spires"] = (  # Barcelona: the Sagrada Familia
    R(0, 0, 60, 52, "o") +
    "".join(P("M%s 46 V%s C%s %s %s %s %s %s C%s %s %s %s %s %s V46Z" % (
        f(x), f(top + 14), f(x), f(top + 7), f(x + 1.6), f(top + 3), f(x + w / 2), f(top),
        f(x + w - 1.6), f(top + 3), f(x + w), f(top + 7), f(x + w), f(top + 14)), "k x")
        for x, w, top in ((12, 7, 12), (20.5, 7, 5), (32.5, 7, 5), (41, 7, 12))) +
    "".join(C(x + 3.5, top - 1.4, 1.6, "k " + c) for x, top, c in ((12, 12, "h"), (20.5, 5, "g"), (32.5, 5, "d"), (41, 12, "g"))) +
    "".join(C(x + 3.5, y, .8, "p") for x, top in ((12, 12), (20.5, 5), (32.5, 5), (41, 12)) for y in (top + 9, top + 14, top + 19)) +
    R(9, 33, 42, 13, "k x") + arch_win(25.5, 35, 9, 11) + arch_win(14.5, 37, 5, 9) + arch_win(40.5, 37, 5, 9) +
    ground(46, "j")
)

S["arch"] = (  # Morocco: a horseshoe arch onto the desert
    R(0, 0, 60, 52, "t") +
    "".join(star(x, y, 2.4, 1, 8, "y" if (i % 2) else "w", -90) for i, (x, y) in enumerate(
        ((6, 7), (54, 7), (6, 20), (54, 20), (6, 33), (54, 33), (6, 46), (54, 46), (18, 4.5), (42, 4.5)))) +
    P("M19 52 V31 C12 23 17 10 30 10 C43 10 48 23 41 31 V52Z", "k o") +
    P("M19 44 Q26 37 33 42 T41 39 V52 H19Z", "k i") + P("M19 48 Q28 43 41 47 V52 H19Z", "k g") +
    P("M35.5 44 C35.5 40 35.8 37 36.6 34", "k") + palm(36.6, 34, .42) +
    thin(P("M30 10 V16", "k")) + P("M28 16 H32 L33 18.5 L31.6 23 H28.4 L27 18.5Z", "k y") + P("M28.6 23 L30 25 L31.4 23", "k g") +
    P("M19 52 V31 C12 23 17 10 30 10 C43 10 48 23 41 31 V52", "k") +
    '<path style="fill:none;stroke:#fbf3d9;stroke-width:2.2" d="M16.6 52 V31.6 C9 22.5 14.6 7.6 30 7.6 C45.4 7.6 51 22.5 43.4 31.6 V52"/>' +
    P("M16.6 52 V31.6 C9 22.5 14.6 7.6 30 7.6 C45.4 7.6 51 22.5 43.4 31.6 V52", "k")
)

S["harbor"] = (  # Copenhagen: Nyhavn
    R(0, 0, 60, 52, "a") +
    "".join(P("M%s 40 V%s L%s %s L%s %s V40Z" % (f(x), f(top + 6), f(x + w / 2), f(top), f(x + w), f(top + 6)), "k " + c) +
            "".join(R(x + 1.6 + i * (w - 4.6) / 2, wy, 1.4, 2.2, "c") for i in range(3) for wy in (top + 9, top + 15) if wy < 37)
            for x, w, top, c in ((2, 11, 12, "g"), (13, 10, 16, "h"), (23, 12, 10, "s"), (35, 10, 14, "o"), (45, 13, 11, "d"))) +
    R(0, 40, 60, 12, "b") + P("M0 40 H60", "k") +
    P("M14 46 L34 46 L31 50 L17 50Z", "k r") + P("M24 46 V35", "k") + P("M24.8 36 L30 44.6 H24.8Z", "k w") + wave(50.6, 36, 58, .8, 5)
)

S["aurora"] = (  # Tromsø: northern lights
    R(0, 0, 60, 52, "n") +
    "".join(C(x, y, r, "w") for x, y, r in ((6, 6, .7), (15, 12, .5), (48, 5, .8), (55, 14, .5), (27, 4, .5), (38, 10, .6))) +
    '<path style="fill:none;stroke:#7fcdbd;stroke-width:5;stroke-linecap:round;opacity:.75" d="M2 24 C12 12 22 27 33 17 S52 9 58 15"/>' +
    '<path style="fill:none;stroke:#b9a6dc;stroke-width:2.6;stroke-linecap:round;opacity:.7" d="M4 30 C14 20 24 32 35 24 S52 17 58 22"/>' +
    P("M0 42 L11 30 L18 36 L29 23 L41 37 L48 31 L60 40 V52 H0Z", "k w") +
    R(39, 41, 9, 6, "k r") + P("M38 41.4 L43.5 37 L49 41.4Z", "k j") + R(42, 43, 2.6, 2.6, "y") +
    ground(47, "w")
)

S["pho"] = (  # Hanoi: a bowl of pho
    R(0, 0, 60, 52, "q") +
    '<path style="fill:none;stroke:#2f3a2c;stroke-width:1;stroke-linecap:round;opacity:.65" d="M22 18 q-3 -4 0 -7 q3 -3 0 -7 M30 17 q-3 -4 0 -7 q3 -3 0 -7 M38 18 q-3 -4 0 -7 q3 -3 0 -7"/>' +
    P("M40 4 L27 27 M46 5 L31 27.4", "k") +
    '<path style="fill:none;stroke:#a07850;stroke-width:1.6;stroke-linecap:round" d="M40 4 L27 27 M46 5 L31 27.4"/>' +
    P("M9 28 H51 C51 40 42.5 47.5 30 47.5 C17.5 47.5 9 40 9 28Z", "k w") +
    E(30, 28, 21, 4.4, "k g") +
    thin(P("M14 28 q3 -2 6 0 t6 0 t6 0 t6 0 t6 0", "k")) +
    leaf(18, 27, 23, 25, 1.4, "k f") + leaf(38, 26, 43, 28, 1.4, "k f") + C(33, 27, 1.2, "k h") + C(26, 29, 1, "k h") +
    '<path style="fill:none;stroke:#3f5f86;stroke-width:1.2" d="M11 33.5 H49 M14 39 H46"/>' +
    R(22, 47.5, 16, 2.6, "k w")
)

S["torii"] = (  # Kyoto: torii gates
    R(0, 0, 60, 52, "q") +
    R(24, 22, 2.4, 22, "k h") + R(33.6, 22, 2.4, 22, "k h") + P("M21 19 Q30 21 39 19 L38.2 21.6 Q30 23 21.8 21.6Z", "k h") +
    P("M5 11 Q30 16 55 11 L53.4 16.4 Q30 20 6.6 16.4Z", "k h") + P("M5 11 Q30 16 55 11 L54.6 12.6 Q30 17.6 5.4 12.6Z", "p") +
    R(12, 23, 36, 3.6, "k h") + R(28.4, 17.6, 3.2, 5.4, "k h") +
    R(14.6, 17, 4.4, 33, "k h") + R(41, 17, 4.4, 33, "k h") + R(14, 46, 5.6, 4, "p") + R(40.4, 46, 5.6, 4, "p") +
    ground(50, "j") +
    "".join(P("M%s %s q1.2 -1.6 2.4 0 q-1.2 1.6 -2.4 0Z" % (f(x), f(y)), "d") for x, y in ((6, 30), (52, 26), (9, 40), (49, 38), (30, 34)))
)

S["fuji"] = (  # Tokyo: Tokyo Tower and Mount Fuji
    R(0, 0, 60, 52, "a") + C(11, 10, 5, "h") +
    P("M0 46 L20 22 Q27 18 34 22 L56 46Z", "k l") + P("M20 22 Q27 18 34 22 L30.5 26 L27.5 23.8 L24.5 26.6 L22.5 24.4Z", "k w") +
    P("M38 48 L43 20 H45 L50 48Z", "k h") + thin(P("M39.6 40 L48.4 40 M41 33 L47 33 M42.2 27 L45.8 27", "w")) +
    R(40.5, 30.6, 7, 2.6, "k w") + R(41.8, 24, 4.4, 2.2, "k w") + P("M44 20 V9", "k") +
    ground(48, "j")
)

S["snow"] = (  # Niseko: Mount Yotei in deep powder
    R(0, 0, 60, 52, "a") +
    P("M2 44 L24 15 Q30 12 36 15 L58 44Z", "k w") +
    '<path style="fill:#c6d9e6" d="M36 15 L58 44 H40 C37 34 36 24 33 14Z"/>' +
    P("M2 44 L24 15 Q30 12 36 15 L58 44", "k") +
    pine(8, 47, 7) + pine(14, 47, 9) + pine(20, 47, 6) + pine(46, 47, 8) + pine(52, 47, 6.5) +
    ground(47, "w") +
    flake(8, 9, 2.2) + flake(18, 5, 1.6) + flake(46, 6, 2) + flake(54, 13, 1.6) + flake(42, 24, 1.4) + flake(12, 22, 1.4)
)

out = "/* Postage-stamp drawings for the travels postcards. Generated by a script\n" \
      " * (see CLAUDE.md, Travels): each is a little scene in a 60 x 52 box, keyed\n" \
      " * by the `stamp` name in travels-data.js. Colour classes are in style.css\n" \
      " * under \".stamp\". */\nwindow.TRAVEL_STAMPS = " + json.dumps(S, indent=1, ensure_ascii=False) + ";\n"
open(sys.argv[1], "w").write(out)
print(len(S), "stamps", len(out), "bytes")
