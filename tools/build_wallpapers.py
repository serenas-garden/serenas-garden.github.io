#!/usr/bin/env python3
"""Draw the cottage's wallpapers and write their CSS into assets/style.css.

    python3 tools/build_wallpapers.py

Each wallpaper is a small repeating tile (inline SVG, so there's no picture
to load) plus, for some, CSS stripes or checks. This writes one block of CSS
between the "wallpapers:start" and "wallpapers:end" markers in style.css:
for each wallpaper, a rule on [data-wp="<id>"] setting

    --wp-img     the background layers (every layer at position 0 0, so
                 the hanging animation can offset them all at once)
    --wp-ground  the paint underneath
    --wp-op      how strongly the pattern shows (lower at night)

<html data-wp="..."> (set by assets/wallpaper.js) picks the one on the walls;
the swatch cards in the picker set data-wp on themselves to show theirs.
Change a wallpaper here and rerun; don't edit the generated block by hand.
Add one here, in WALLPAPERS in assets/wallpaper.js, and that's all.
"""
import math
import os
import re
import urllib.parse

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "style.css")


def uri(svg, w, h):
    svg = "<svg xmlns='http://www.w3.org/2000/svg' width='%s' height='%s' viewBox='0 0 %s %s'>%s</svg>" % (w, h, w, h, svg)
    svg = re.sub(r"\s+", " ", svg).replace("> <", "><").replace('"', "'")
    return 'url("data:image/svg+xml,' + urllib.parse.quote(svg, safe=" '=:/;,()-.") + '")'


def f(n):
    return ("%.2f" % n).rstrip("0").rstrip(".")


# --------------------------------- motifs ---------------------------------

def blossom(cx, cy, r, petal, centre):
    out = ""
    for k in range(5):
        a = math.radians(-90 + k * 72)
        out += "<circle cx='%s' cy='%s' r='%s' fill='%s'/>" % (f(cx + math.cos(a) * r * .78), f(cy + math.sin(a) * r * .78), f(r * .6), petal)
    return out + "<circle cx='%s' cy='%s' r='%s' fill='%s'/>" % (f(cx), f(cy), f(r * .38), centre)


def forget_me_not(cx, cy):
    return blossom(cx, cy, 4.2, "#a9bfe4", "#f3d36f")


def daisy(cx, cy, s=1.0):
    out = ""
    for k in range(8):
        out += "<ellipse cx='%s' cy='%s' rx='%s' ry='%s' transform='rotate(%d %s %s)' fill='#fffdf6' stroke='#e2d6bd' stroke-width='.6'/>" % (
            f(cx), f(cy - 4.4 * s), f(1.8 * s), f(4 * s), k * 45, f(cx), f(cy))
    return out + "<circle cx='%s' cy='%s' r='%s' fill='#eec45c'/>" % (f(cx), f(cy), f(2.4 * s))


def bud(cx, cy, rot, colour="#ea9580"):
    return ("<g transform='translate(%s %s) rotate(%s)'>"
            "<path d='M0 12 q-1 -6 0 -10' fill='none' stroke='#9db586' stroke-width='1.3' stroke-linecap='round'/>"
            "<path d='M0 8 q-5 -1 -6 -6 q4 0 6 6' fill='#a6bd8e'/>"
            "<path d='M-4 -6 q0 6 4 6 q4 0 4 -6 l-2 2 l-2 -4 l-2 4 z' fill='%s'/></g>") % (f(cx), f(cy), rot, colour)


def leaves(cx, cy, rot, colour="#a6bd8e"):
    return ("<g transform='translate(%s %s) rotate(%s)'>"
            "<path d='M0 6 q0 -5 0 -9' fill='none' stroke='%s' stroke-width='1.1' stroke-linecap='round'/>"
            "<ellipse cx='-3.2' cy='-2' rx='3.4' ry='1.7' transform='rotate(-35 -3.2 -2)' fill='%s'/>"
            "<ellipse cx='3.2' cy='-4.5' rx='3.4' ry='1.7' transform='rotate(35 3.2 -4.5)' fill='%s'/></g>") % (f(cx), f(cy), rot, colour, colour, colour)


def dot(cx, cy, r, colour):
    return "<circle cx='%s' cy='%s' r='%s' fill='%s'/>" % (f(cx), f(cy), f(r), colour)


def toadstool(cx, cy, s, cap="#d36b60"):
    return ("<g transform='translate(%s %s) scale(%s)'>"
            "<path d='M-3.6 0 C-4 5 -4.4 9 -5 12 H5 C4.4 9 4 5 3.6 0 Z' fill='#f7f0e0' stroke='#bfae90' stroke-width='.9'/>"
            "<path d='M-12 1 C-12 -8 -6 -13 0 -13 C6 -13 12 -8 12 1 C6 3 -6 3 -12 1 Z' fill='%s'/>"
            "<g fill='#fff8ec'><circle cx='-5.5' cy='-6' r='1.9'/><circle cx='2' cy='-9' r='1.5'/><circle cx='6.5' cy='-3.5' r='1.7'/><circle cx='-1' cy='-2.5' r='1.1'/></g>"
            "<path d='M-9 12.5 q9 -2.5 18 0' fill='none' stroke='#a6bd8e' stroke-width='1.3' stroke-linecap='round'/></g>") % (f(cx), f(cy), f(s), cap)


def little_mushrooms(cx, cy):
    return ("<g transform='translate(%s %s)'>"
            "<path d='M-6 0 v-6 h3 v6 Z M3 0 v-4 h2.4 v4 Z' fill='#f4ead6'/>"
            "<path d='M-10 -5 q5.5 -9 11 0 Z' fill='#c9a079'/>"
            "<path d='M0 -3.6 q4.2 -6.5 8.4 0 Z' fill='#d8b48a'/>"
            "<path d='M-11 1 q11 -2.5 21 0' fill='none' stroke='#a6bd8e' stroke-width='1.2' stroke-linecap='round'/></g>") % (f(cx), f(cy))


def fern(cx, cy, rot, colour="#93b07f"):
    out = "<g transform='translate(%s %s) rotate(%s)'><path d='M0 18 C1 6 0 -6 -3 -18' fill='none' stroke='%s' stroke-width='1.3' stroke-linecap='round'/>" % (f(cx), f(cy), rot, colour)
    for k in range(7):
        t = k / 7
        y = 14 - t * 30
        x = 0.6 - t * 3.2
        size = 5.6 - t * 3.6
        out += "<ellipse cx='%s' cy='%s' rx='%s' ry='%s' transform='rotate(-40 %s %s)' fill='%s'/>" % (f(x - size * .8), f(y - 1), f(size), f(size * .36), f(x - size * .8), f(y - 1), colour)
        out += "<ellipse cx='%s' cy='%s' rx='%s' ry='%s' transform='rotate(40 %s %s)' fill='%s'/>" % (f(x + size * .8), f(y - 2.2), f(size), f(size * .36), f(x + size * .8), f(y - 2.2), colour)
    return out + "</g>"


def acorn(cx, cy, rot):
    return ("<g transform='translate(%s %s) rotate(%s)'>"
            "<path d='M-5 -1 C-5 6 -2 10 0 11 C2 10 5 6 5 -1 Z' fill='#cf9f66'/>"
            "<path d='M-6.5 -1 C-6.5 -6 6.5 -6 6.5 -1 C4 0.6 -4 0.6 -6.5 -1 Z' fill='#9a734e'/>"
            "<path d='M-4 -3.2 h8 M-3 -1.4 h6' stroke='#7d5a3a' stroke-width='.6'/>"
            "<path d='M0 -5.5 q.6 -2.6 2.4 -3.4' fill='none' stroke='#7d5a3a' stroke-width='1.2' stroke-linecap='round'/>"
            "<path d='M-2.5 3 q0 4 2 6' fill='none' stroke='#e7c393' stroke-width='1' stroke-linecap='round'/></g>") % (f(cx), f(cy), rot)


def snail(cx, cy):
    return ("<g transform='translate(%s %s)'>"
            "<path d='M-12 6 C-12 3 -4 2.5 4 3 C8 3 10 0 10 -3 L11 -6 M10 -3 L13 -5' fill='none' stroke='#c9bc9c' stroke-width='3' stroke-linecap='round'/>"
            "<path d='M10 -3 L11 -6.5 M10 -3 L13.4 -5.2' stroke='#b5a684' stroke-width='1' stroke-linecap='round'/>"
            "<circle cx='-2' cy='-2' r='7' fill='#e7b98d'/>"
            "<path d='M-2 -2 m-4.5 0 a4.5 4.5 0 1 1 4.5 4.5 a3 3 0 1 1 -3 -3 a1.5 1.5 0 1 1 1.5 1.5' fill='none' stroke='#b98a5e' stroke-width='1.1' stroke-linecap='round'/></g>") % (f(cx), f(cy))


def clover(cx, cy, rot, colour="#a9c094"):
    return ("<g transform='translate(%s %s) rotate(%s)'>"
            "<path d='M0 0 q1 5 3 8' fill='none' stroke='%s' stroke-width='1.1' stroke-linecap='round'/>"
            "<circle cx='0' cy='-3.2' r='2.8' fill='%s'/><circle cx='-3' cy='0.6' r='2.8' fill='%s'/><circle cx='3' cy='0.6' r='2.8' fill='%s'/></g>") % (f(cx), f(cy), rot, colour, colour, colour, colour)


def crescent(cx, cy, r, rot, colour):
    return ("<path transform='translate(%s %s) rotate(%s)' d='M0 %s A%s %s 0 1 0 0 %s A%s %s 0 1 1 0 %s Z' fill='%s'/>") % (
        f(cx), f(cy), rot, f(-r), f(r), f(r), f(r), f(r * .58), f(r), f(-r), colour)


def sparkle(cx, cy, s, colour):
    return ("<path transform='translate(%s %s)' d='M0 %s Q0 0 %s 0 Q0 0 0 %s Q0 0 %s 0 Q0 0 0 %s Z' fill='%s'/>") % (
        f(cx), f(cy), f(-s), f(s * .78), f(s), f(-s * .78), f(-s), colour)


def raceme(cx, cy):
    """a hanging cluster of wisteria, from (cx, cy) down"""
    rows = [(0, 4, [(-4.6, 3.4), (0, 4.2), (4.6, 3.4)]),
            (7, 3.6, [(-2.6, 3.4), (2.6, 3.4)]),
            (13, 3.2, [(-3.4, 2.9), (0.8, 3.1), (4, 2.4)]),
            (19, 2.8, [(-1.6, 2.8), (2.6, 2.5)]),
            (25, 2.4, [(0, 2.6), (-3.2, 1.9)]),
            (30, 2, [(1, 2.1)]),
            (34.5, 1.6, [(-.4, 1.7)]),
            (38, 1.2, [(.4, 1.2)])]
    shades = ["#a58fd6", "#b49fe0", "#c2b0e8", "#cbbcec", "#d6c9f1", "#ddd3f4", "#e4dcf6", "#ebe5f8"]
    out = ""
    for k, (dy, _, blooms) in enumerate(rows):
        for dx, r in blooms:
            out += dot(cx + dx, cy + 4 + dy, r, shades[k])
    out += ("<ellipse cx='%s' cy='%s' rx='5.6' ry='2.4' transform='rotate(-28 %s %s)' fill='#9fb88a'/>"
            "<ellipse cx='%s' cy='%s' rx='5.6' ry='2.4' transform='rotate(28 %s %s)' fill='#a8c094'/>") % (
        f(cx - 7), f(cy + 1), f(cx - 7), f(cy + 1), f(cx + 7), f(cy + 0.5), f(cx + 7), f(cy + 0.5))
    return out


# ------------------------------- wallpapers -------------------------------

GARDEN = ("<g fill='none' stroke='#8aa679' stroke-width='1.2' stroke-linecap='round'><path d='M66 34q-1.5 9 0 17'/><path d='M66 42q-5-1.5-7-7'/>"
          "<path d='M66 46q5-1.5 7-7'/></g><circle cx='66' cy='32' r='2.4' fill='#e2aeb0'/><g fill='none' stroke='#8aa679' stroke-width='1.2' "
          "stroke-linecap='round'><path d='M22 96q-1.5 9 0 17'/><path d='M22 104q-5-1.5-7-7'/><path d='M22 108q5-1.5 7-7'/></g>"
          "<circle cx='22' cy='94' r='2.2' fill='#e8cb7c'/>")

WILDFLOWER = (
    blossom(22, 24, 7, "#eda9b0", "#f7d98a") + forget_me_not(72, 17) + leaves(104, 36, 20) +
    daisy(55, 62) + leaves(15, 62, -32) + bud(112, 84, 10) +
    blossom(28, 102, 5.4, "#c9b7e8", "#f3d36f") + leaves(68, 98, 58) + forget_me_not(86, 120) +
    blossom(118, 122, 3.8, "#f2b9a6", "#f7d98a") +
    dot(44, 38, 1.2, "#e7c56a") + dot(118, 10, 1.1, "#e7c56a") + dot(8, 124, 1.2, "#eda9b0") +
    dot(96, 54, 1.1, "#a9bfe4") + dot(40, 128, 1, "#e7c56a") + dot(124, 58, 1.2, "#eda9b0")
)

WOODLAND = (
    toadstool(40, 52, 1.15) + fern(150, 38, 24) + clover(100, 24, -12) + acorn(98, 92, -18) +
    toadstool(150, 132, .78, "#e08a6e") + fern(30, 150, -14, "#a3bd8f") + little_mushrooms(92, 176) +
    snail(66, 124) + clover(178, 86, 30, "#b6c9a2") + acorn(180, 182, 24) + clover(14, 96, -40, "#b6c9a2") +
    dot(72, 52, 1.5, "#bccba7") + dot(77, 58, 1, "#bccba7") + dot(128, 66, 1.3, "#d9a79c") +
    dot(14, 18, 1.2, "#bccba7") + dot(186, 12, 1.4, "#d9a79c") + dot(124, 186, 1.2, "#bccba7") +
    dot(52, 92, 1.1, "#d9a79c") + dot(176, 160, 1.1, "#bccba7")
)

WISTERIA_LATTICE = ("<g stroke-linecap='round'><path d='M0 0 L104 104 M104 0 L0 104' stroke='#cdb995' stroke-width='2.2'/>"
                    "<path d='M0 0 L104 104 M104 0 L0 104' stroke='#efe2c4' stroke-width='.7' transform='translate(-.7 -.7)'/></g>")
WISTERIA = (WISTERIA_LATTICE + raceme(52, 50) +
            leaves(22, 26, 135, "#a8c094") + leaves(82, 26, -135, "#a8c094"))

MOONLIT = (
    crescent(38, 42, 12, -24, "#e8c46c") + crescent(112, 108, 8, 32, "#e8c46c") +
    sparkle(104, 30, 6, "#e9c874") + sparkle(30, 112, 5, "#e9c874") + sparkle(74, 78, 3.4, "#c9c2ea") +
    sparkle(138, 64, 3, "#c9c2ea") + sparkle(66, 138, 3.2, "#e9c874") + crescent(132, 26, 4.6, 70, "#e8c46c") +
    dot(64, 20, 1.3, "#c9c2ea") + dot(12, 76, 1.2, "#c9c2ea") + dot(92, 142, 1.1, "#e9c874") +
    dot(124, 10, 1.2, "#e9c874") + dot(140, 132, 1.3, "#c9c2ea") + dot(48, 96, 1, "#e9c874") + dot(100, 64, 1, "#c9c2ea")
)

GINGHAM = ("repeating-linear-gradient(0deg, rgba(222, 146, 156, .34) 0 13px, transparent 13px 26px) 0 0 / auto, "
           "repeating-linear-gradient(90deg, rgba(222, 146, 156, .34) 0 13px, transparent 13px 26px) 0 0 / auto")

# id: (layers, ground by day, opacity by day, ground at night, opacity at night)
WALLPAPERS = [
    ("garden", uri(GARDEN, 88, 124) + " 0 0 / 88px 124px, repeating-linear-gradient(90deg, var(--wall) 0 44px, transparent 44px 88px) 0 0 / auto",
     "var(--bg)", ".62", "var(--bg)", ".3"),
    ("wildflower", uri(WILDFLOWER, 132, 132) + " 0 0 / 132px 132px", "var(--bg)", ".78", "var(--bg)", ".22"),
    ("woodland", uri(WOODLAND, 200, 200) + " 0 0 / 200px 200px", "#eef0e2", ".8", "#152018", ".24"),
    ("gingham", GINGHAM, "var(--bg)", ".62", "#211a1d", ".36"),
    ("wisteria", uri(WISTERIA, 104, 104) + " 0 0 / 104px 104px", "#f6f1e6", ".78", "var(--bg)", ".24"),
    ("moonlit", uri(MOONLIT, 150, 150) + " 0 0 / 150px 150px", "#eceaf5", ".85", "#131826", ".6"),
]


def main():
    lines = ["/* wallpapers:start (generated by tools/build_wallpapers.py; don't edit by hand) */"]
    for i, (wid, img, ground, op, nground, nop) in enumerate(WALLPAPERS):
        sel = '[data-wp="%s"]' % wid
        if i == 0:
            sel = ":root:not([data-wp]), " + sel     # garden stripe until wallpaper.js says otherwise
        lines.append("%s {\n  --wp-ground: %s;\n  --wp-op: %s;\n  --wp-img: %s;\n}" % (sel, ground, op, img))
        lines.append('[data-dark="true"][data-wp="%s"], [data-dark="true"] [data-wp="%s"] { --wp-ground: %s; --wp-op: %s; }' % (wid, wid, nground, nop))
    lines.append("/* wallpapers:end */")
    block = "\n".join(lines)

    css = open(OUT).read()
    start, end = "/* wallpapers:start", "/* wallpapers:end */"
    if start not in css:
        raise SystemExit("no wallpapers:start marker in style.css")
    a = css.index(start)
    b = css.index(end) + len(end)
    open(OUT, "w").write(css[:a] + block + css[b:])
    print("wrote %d wallpapers (%d bytes)" % (len(WALLPAPERS), len(block)))


if __name__ == "__main__":
    main()
