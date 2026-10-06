/* The travels globe (and flat map) on travels.html.
 *
 * A desk globe drawn on a <canvas> from the Natural Earth outlines baked into
 * globe-geo.js, with Serena's places standing on it as little toadstools on
 * an SVG layer. The same engine draws the flat map in the scroll
 * (projection: "flat"): one set of toadstools, labels, clusters, real night,
 * sun and moon, two ways of drawing the world. travels.js builds the page
 * around it (postcards, passport, tour, the scroll); this file is only the
 * map. No mapping library.
 *
 * How it works
 *  - Every point is a unit vector. A view is a centre (lon, lat) and a zoom k,
 *    and projecting is three dot products (orthographic, north always up).
 *  - The far side is clipped properly. A ring is cut exactly where it crosses
 *    the horizon (the great-circle crossing), and the pieces are rejoined
 *    along the globe's rim (Weiler-Atherton). globe-geo.js stores every ring
 *    with its land on the left, so walking the rim counter-clockwise from
 *    where a ring leaves always reaches the point where it comes back.
 *  - Zooming magnifies the sphere inside the same circle, like a lens, so the
 *    brass ring and stand drawn around it never move.
 *  - Night is the real one: the sun's position right now (Sky.overhead in
 *    sky.js) shades every pixel by the sun's altitude there, at low
 *    resolution and then smoothed, so twilight comes out soft. Toadstools
 *    where it's night glow like the mushrooms by the door.
 *  - The flat map is a Miller cylindrical projection (the classic wall map),
 *    cropped to 84 N .. 58 S, where everything but Antarctica lives. Its
 *    outlines are built once as Path2D in map units and drawn through one
 *    transform, so panning and zooming cost almost nothing. Rings that cross
 *    the 180th meridian are "unwrapped" into one continuous shape and drawn
 *    again shifted a full turn, so nothing streaks across the map, and rings
 *    that go round a pole are closed through the pole.
 *  - It only draws when something changes. The idle spin pauses when the
 *    globe is off screen or the tab is hidden, and never runs for reduced
 *    motion (nor do the fly-to animations: they jump instead).
 *
 * Usage: var globe = Globe(element, { geo, places, tint, onPick, onMove,
 *                                     projection: "globe" | "flat" });
 *   places  [{ id, name, lat, lon }]
 *   tint    [{ geo: "Japan", box: [w, s, e, n] | null }]   countries to tint
 *   onPick  called with a place id when its toadstool is clicked
 *   onMove  called whenever the visitor moves the globe themselves
 */
(function () {
  "use strict";

  var D2R = Math.PI / 180, R2D = 180 / Math.PI, TAU = Math.PI * 2;
  var SVGNS = "http://www.w3.org/2000/svg";
  var MAX_K = 16, MAX_KF = 40;
  var HOME = { lon: -32, lat: 26, k: 1 };

  // Miller cylindrical, in degree-sized units so that x (longitude) and y match
  function millerY(lat) { return 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * clamp(lat, -89.5, 89.5) * D2R)) * R2D; }
  function millerLat(y) { return (2.5 * Math.atan(Math.exp(0.8 * y * D2R)) - 0.625 * Math.PI) * R2D; }
  var MAP_N = 84, MAP_S = -58;
  var SPIN = 0.006;                // degrees per ms: one turn a minute
  var REDUCED = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function wrap(lon) { lon = (lon + 180) % 360; return (lon < 0 ? lon + 360 : lon) - 180; }
  function vec(lon, lat) {
    var l = lon * D2R, p = lat * D2R, c = Math.cos(p);
    return [c * Math.cos(l), c * Math.sin(l), Math.sin(p)];
  }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function between(a, b) { return Math.acos(clamp(dot(a, b), -1, 1)); }
  function lonLat(v) {
    return { lon: Math.atan2(v[1], v[0]) * R2D, lat: Math.asin(clamp(v[2], -1, 1)) * R2D };
  }
  function slerp(a, b, t) {
    var th = between(a, b), s = Math.sin(th);
    if (s < 1e-9) return a.slice();
    var p = Math.sin((1 - t) * th) / s, q = Math.sin(t * th) / s;
    return [a[0] * p + b[0] * q, a[1] * p + b[1] * q, a[2] * p + b[2] * q];
  }
  function svg(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ---------------------------- geometry prep ---------------------------- */

  // [lon0, lat0, dlon, dlat, ...] in hundredths of a degree -> unit vectors
  function decodeArc(a) {
    var n = a.length / 2, v = new Float64Array(n * 3), lon = 0, lat = 0;
    for (var i = 0; i < n; i++) {
      lon += a[2 * i]; lat += a[2 * i + 1];
      var l = lon / 100 * D2R, p = lat / 100 * D2R, c = Math.cos(p);
      v[3 * i] = c * Math.cos(l);
      v[3 * i + 1] = c * Math.sin(l);
      v[3 * i + 2] = Math.sin(p);
    }
    return v;
  }

  // the same arcs as plain [lon, lat, lon, lat, ...] in degrees, for the flat map
  function decodeLonLat(a) {
    var n = a.length / 2, v = new Float64Array(n * 2), lon = 0, lat = 0;
    for (var i = 0; i < n; i++) {
      lon += a[2 * i]; lat += a[2 * i + 1];
      v[2 * i] = lon / 100; v[2 * i + 1] = lat / 100;
    }
    return v;
  }

  /* Lay a run of lon/lat points out flat, with no jumps: wherever an edge
     crosses the 180th meridian the longitude carries on past 180 (or -180)
     instead of leaping across the map. Returns [x, y, x, y, ...] in map units. */
  function unwrap(ll) {
    var n = ll.length / 2, out = new Float64Array(n * 2), prev = ll[0], x = ll[0];
    for (var i = 0; i < n; i++) {
      var lon = ll[2 * i], d = lon - prev;
      if (d > 180) d -= 360; else if (d < -180) d += 360;
      if (i) x += d;
      prev = lon;
      out[2 * i] = x;
      out[2 * i + 1] = millerY(ll[2 * i + 1]);
    }
    return out;
  }
  function short(d) { return d > 180 ? d - 360 : d < -180 ? d + 360 : d; }

  // a ring of lon/lat from arc references, each point once (the flat map's joinRing)
  function joinRingLL(refs, arcs) {
    var n = 0, r, a, j, m, o = 0;
    for (r = 0; r < refs.length; r++) n += arcs[refs[r] >= 0 ? refs[r] : ~refs[r]].length / 2 - 1;
    var out = new Float64Array(n * 2);
    for (r = 0; r < refs.length; r++) {
      a = arcs[refs[r] >= 0 ? refs[r] : ~refs[r]];
      m = a.length / 2;
      for (j = 0; j < m - 1; j++) {
        var i = refs[r] >= 0 ? j : m - 1 - j;
        out[o++] = a[2 * i]; out[o++] = a[2 * i + 1];
      }
    }
    return out;
  }

  // the smallest-ish cap (centre + angular radius) holding every point
  function capOf(list) {
    var sx = 0, sy = 0, sz = 0, i, j, v;
    for (j = 0; j < list.length; j++) {
      v = list[j];
      for (i = 0; i < v.length; i += 3) { sx += v[i]; sy += v[i + 1]; sz += v[i + 2]; }
    }
    var m = Math.sqrt(sx * sx + sy * sy + sz * sz);
    if (m < 1e-9) return { x: 0, y: 0, z: 1, r: Math.PI };
    var c = { x: sx / m, y: sy / m, z: sz / m, r: 0 };
    for (j = 0; j < list.length; j++) {
      v = list[j];
      for (i = 0; i < v.length; i += 3) {
        var a = Math.acos(clamp(v[i] * c.x + v[i + 1] * c.y + v[i + 2] * c.z, -1, 1));
        if (a > c.r) c.r = a;
      }
    }
    return c;
  }

  // a ring from arc references (~i = arc i backwards), each point once, closed implicitly
  function joinRing(refs, arcs) {
    var n = 0, r, a, j, m, o = 0;
    for (r = 0; r < refs.length; r++) n += arcs[refs[r] >= 0 ? refs[r] : ~refs[r]].length / 3 - 1;
    var out = new Float64Array(n * 3);
    for (r = 0; r < refs.length; r++) {
      a = arcs[refs[r] >= 0 ? refs[r] : ~refs[r]];
      m = a.length / 3;
      for (j = 0; j < m - 1; j++) {
        var i = refs[r] >= 0 ? j : m - 1 - j;
        out[o++] = a[3 * i]; out[o++] = a[3 * i + 1]; out[o++] = a[3 * i + 2];
      }
    }
    return out;
  }

  function curve(fn, from, to, step) {
    var pts = [];
    for (var t = from; t <= to + 1e-9; t += step) pts.push(fn(t));
    var v = new Float64Array(pts.length * 3);
    pts.forEach(function (p, i) { var u = vec(p[0], p[1]); v[3 * i] = u[0]; v[3 * i + 1] = u[1]; v[3 * i + 2] = u[2]; });
    return { v: v, cap: capOf([v]) };
  }

  /* ------------------------------ the art ------------------------------ */

  // a toadstool, standing on (0, 0)
  var TOADSTOOL =
    '<ellipse class="pin__shadow" cx="0" cy="0.4" rx="6.2" ry="1.9"/>' +
    '<path class="pin__stem" d="M-2.6 0.6 C-3.1 -2.4 -2.9 -5 -2.3 -7.2 L2.3 -7.2 C2.9 -5 3.1 -2.4 2.6 0.6 Z"/>' +
    '<path class="pin__cap" d="M-8.6 -6.4 C-8.8 -12.6 -4.8 -16.6 0 -16.6 C4.8 -16.6 8.8 -12.6 8.6 -6.4 C4.4 -5.2 -4.4 -5.2 -8.6 -6.4 Z"/>' +
    '<circle class="pin__spot" cx="-4.2" cy="-11" r="1.5"/>' +
    '<circle class="pin__spot" cx="1.3" cy="-13.7" r="1.25"/>' +
    '<circle class="pin__spot" cx="4.7" cy="-9.7" r="1.15"/>' +
    '<circle class="pin__spot" cx="-0.6" cy="-8.6" r="0.85"/>';

  // little drawings printed on the sea, like an old globe
  var DECO = [
    { lon: -150, lat: 31, art:
      '<path class="ink f-deco" d="M-16 2 C-16 -8 -4 -11 6 -8 C12 -6 15 -2 15 2 C15 5 10 7 2 7 L-8 7 C-13 7 -16 5 -16 2Z"/>' +
      '<path class="ink f-deco" d="M14 1 C17 -1 18.5 -5 22 -7.5 C21 -4.5 21 -2.5 23.5 0 C20.5 0 18.5 2 16 4.5Z"/>' +
      '<path class="ink" d="M-13.5 4.3 C-6 6.3 4 6.3 10.5 4.2" style="stroke-width:.7"/>' +
      '<circle cx="-9.5" cy="-1" r=".95" class="f-ink"/>' +
      '<path class="ink" d="M-6 -10 C-6 -13 -8.5 -14.5 -10 -16.5 M-6 -10 C-6 -13 -3.5 -14.5 -2 -16.5 M-6 -10 V-17" style="stroke-width:.8"/>' },
    { lon: -46, lat: 29, art:
      '<path class="ink" d="M-16 9 q3 -2 6 0 t6 0 t6 0 t6 0 t6 0" style="stroke-width:.7"/>' +
      '<path class="ink f-wood" d="M-11 2 L11 2 L7.5 7 L-7.5 7Z"/>' +
      '<path class="ink" d="M0 2 V-17"/>' +
      '<path class="ink f-paper" d="M1.2 -15.5 L11 0 L1.2 0Z"/>' +
      '<path class="ink f-paper" d="M-1.2 -12 L-9 0 L-1.2 0Z"/>' +
      '<path class="ink f-rose" d="M0 -17 L5.5 -15.3 L0 -13.6Z" style="stroke-width:.7"/>' },
    { lon: 72, lat: -19, art:
      '<path class="ink f-moss" d="M-5.5 -5 L-12.5 -10.5 L-9.5 -3Z M5.5 -5 L12.5 -10.5 L9.5 -3Z M-5 6 L-9.5 10.5 L-7.8 4Z M5 6 L9.5 10.5 L7.8 4Z"/>' +
      '<ellipse cx="0" cy="-11.5" rx="2.9" ry="3.4" class="ink f-moss"/>' +
      '<ellipse cx="0" cy="0" rx="7.8" ry="9.6" class="ink f-gold"/>' +
      '<path class="ink" d="M0 -5.5 L3.8 -1.8 L2.8 3.8 L-2.8 3.8 L-3.8 -1.8Z M0 -5.5 V-9 M3.8 -1.8 L7.2 -3.4 M-3.8 -1.8 L-7.2 -3.4 M2.8 3.8 L4.8 7.4 M-2.8 3.8 L-4.8 7.4" style="stroke-width:.7"/>' },
    { lon: -24, lat: -34, art:
      '<circle r="11" class="ink" style="stroke-width:.7"/>' +
      '<path class="ink f-paper" d="M0 -16 L2.8 -2.8 L16 0 L2.8 2.8 L0 16 L-2.8 2.8 L-16 0 L-2.8 -2.8Z" style="stroke-width:.9"/>' +
      '<path class="f-berry" d="M0 -15 L2.4 -2.6 L0 0 L-2.4 -2.6Z"/>' +
      '<path class="ink" d="M-7 -7 L-2 -2 M7 -7 L2 -2 M7 7 L2 2 M-7 7 L-2 2" style="stroke-width:.7"/>' +
      '<text class="deco__n" x="0" y="-18.5">N</text>' }
  ];

  // a ribbon banner for the flat map, out in the South Pacific
  var CARTOUCHE = { lon: -138, lat: -40, art:
    '<path class="ink f-rose" d="M-50 -6 L-62 -6 L-56 1.5 L-62 9 L-50 9 Z M50 -6 L62 -6 L56 1.5 L62 9 L50 9 Z" style="stroke-width:1.1"/>' +
    '<path class="ink f-paper" d="M-52 -9 H52 V6 H-52 Z" style="stroke-width:1.1"/>' +
    '<text class="deco__title" x="0" y="1.6" textLength="90" lengthAdjust="spacingAndGlyphs">the world, so far</text>' };

  var SUN_ART =
    '<path class="ink sun-mark__rays" d="M0 -11 V-8 M0 8 V11 M-11 0 H-8 M8 0 H11 M-7.8 -7.8 L-5.7 -5.7 M5.7 5.7 L7.8 7.8 M-7.8 7.8 L-5.7 5.7 M5.7 -5.7 L7.8 -7.8"/>' +
    '<circle r="5.6" class="ink f-gold"/>';

  // the lit part of the moon (same construction as the cottage window's moon)
  function moonPath(r, illum, litRight) {
    var rx = Math.abs(2 * illum - 1) * r;
    var outer = litRight ? 1 : 0;
    var inner = (illum < 0.5) === litRight ? 0 : 1;
    return "M0 " + (-r) + " A" + r + " " + r + " 0 0 " + outer + " 0 " + r +
      " A" + rx.toFixed(2) + " " + r + " 0 0 " + inner + " 0 " + (-r) + "Z";
  }

  /* ------------------------------- Globe ------------------------------- */

  function Globe(host, opts) {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx || !opts.geo) return null;

    canvas.className = "globe__canvas";
    canvas.setAttribute("aria-hidden", "true");
    var marks = svg("svg", { "class": "globe__marks", "aria-hidden": "true", focusable: "false" });
    var labels = document.createElement("div");
    labels.className = "globe__labels";
    labels.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);
    host.appendChild(marks);
    host.appendChild(labels);

    var night = document.createElement("canvas");
    var nctx = night.getContext("2d");
    var nightImg = null;

    var FLAT = opts.projection === "flat";
    var maxK = FLAT ? MAX_KF : MAX_K;
    var Y_TOP = millerY(MAP_N), Y_BOT = millerY(MAP_S);

    /* geometry */
    var G = opts.geo;
    var tintBox = {};
    (opts.tint || []).forEach(function (t) { tintBox[t.geo] = t.box || null; });
    function tintable(name, lon, lat) {
      if (!(name in tintBox)) return false;
      var box = tintBox[name];
      return !box || (lon >= box[0] && lon <= box[2] && lat >= box[1] && lat <= box[3]);
    }
    var arcs, coast, border, land = [], tinted = [], grid = [], lines = [], flat = null;

    // the flat map: every outline as a Path2D in map units (x = longitude, y = Miller)
    function buildFlat() {
      var ll = G.arcs.map(decodeLonLat);
      var f = { land: new Path2D(), tint: new Path2D(), coast: new Path2D(), border: new Path2D(),
                grid: new Path2D(), lines: new Path2D() };
      function polyline(path, xy) {
        path.moveTo(xy[0], xy[1]);
        for (var i = 2; i < xy.length; i += 2) path.lineTo(xy[i], xy[i + 1]);
      }
      // a closed ring; one that goes right round a pole is closed through the pole
      function ring(path, r, xy, shift) {
        var n = xy.length / 2, i;
        path.moveTo(xy[0] + shift, xy[1]);
        for (i = 1; i < n; i++) path.lineTo(xy[2 * i] + shift, xy[2 * i + 1]);
        var drift = xy[2 * (n - 1)] + short(r[0] - r[2 * (n - 1)]) - xy[0];
        if (Math.abs(drift) > 180) {
          var lat = 0;
          for (i = 0; i < n; i++) lat += r[2 * i + 1];
          var pole = millerY(lat < 0 ? -89.5 : 89.5);
          path.lineTo(xy[0] + drift + shift, xy[1]);
          path.lineTo(xy[0] + drift + shift, pole);
          path.lineTo(xy[0] + shift, pole);
        }
        path.closePath();
      }
      function meanX(xy) { var t = 0; for (var i = 0; i < xy.length; i += 2) t += xy[i]; return t / (xy.length / 2); }
      G.countries.forEach(function (c) {
        c.p.forEach(function (poly) {
          var rings = poly.map(function (refs) { return joinRingLL(refs, ll); });
          var outer = unwrap(rings[0]), mx = meanX(outer), lat = 0;
          for (var i = 1; i < rings[0].length; i += 2) lat += rings[0][i];
          lat /= rings[0].length / 2;
          var paths = [f.land];
          if (tintable(c.n, short(((mx + 180) % 360 + 360) % 360 - 180), lat)) paths.push(f.tint);
          paths.forEach(function (path) {
            ring(path, rings[0], outer, 0);
            for (var h = 1; h < rings.length; h++) {           // holes sit beside their own outline
              var xy = unwrap(rings[h]);
              ring(path, rings[h], xy, 360 * Math.round((mx - meanX(xy)) / 360));
            }
          });
        });
      });
      G.coast.forEach(function (i) { polyline(f.coast, unwrap(ll[i])); });
      G.border.forEach(function (i) { polyline(f.border, unwrap(ll[i])); });
      for (var x = -180; x <= 180; x += 30) { f.grid.moveTo(x, Y_BOT); f.grid.lineTo(x, Y_TOP); }
      for (var la = -45; la <= 75; la += 15) if (la) { f.grid.moveTo(-180, millerY(la)); f.grid.lineTo(180, millerY(la)); }
      [0, 23.4362, -23.4362, 66.5638].forEach(function (l) { f.lines.moveTo(-180, millerY(l)); f.lines.lineTo(180, millerY(l)); });
      return f;
    }

    if (FLAT) flat = buildFlat();
    else {
    arcs = G.arcs.map(decodeArc);
    var strokes = function (ids) { return ids.map(function (i) { return { v: arcs[i], cap: capOf([arcs[i]]) }; }); };
    coast = strokes(G.coast); border = strokes(G.border);
    G.countries.forEach(function (c) {
      c.p.forEach(function (poly) {
        var rings = poly.map(function (refs) { return joinRing(refs, arcs); });
        var p = { rings: rings, cap: capOf(rings) };
        land.push(p);
        var at = lonLat([p.cap.x, p.cap.y, p.cap.z]);
        if (tintable(c.n, at.lon, at.lat)) tinted.push(p);
      });
    });

    var meridian = function (lo) { return curve(function (t) { return [lo, t]; }, -90, 90, 2); };
    var parallel = function (la) { return curve(function (t) { return [t, la]; }, -180, 180, 2); };
    for (var lo = -180; lo < 180; lo += 15) grid.push(meridian(lo));
    for (var la = -75; la <= 75; la += 15) if (la) grid.push(parallel(la));
    // the equator, the tropics and the polar circles, dashed like an old globe
    [0, 23.4362, -23.4362, 66.5638, -66.5638].forEach(function (l) { lines.push(parallel(l)); });
    }

    /* places */
    var places = opts.places.map(function (p, i) {
      return { id: p.id, name: p.name, lon: p.lon, lat: p.lat, v: vec(p.lon, p.lat), order: i,
               x: p.lon, y: millerY(p.lat),
               night: false, sx: 0, sy: 0, on: false, fade: 1, el: null, label: null, lw: 0, tf: "", shown: null };
    });
    var byId = {};
    places.forEach(function (p) {
      byId[p.id] = p;
      p.near = Math.PI;
      p.nearXY = 1e9;                      // the same, measured on the flat map
      places.forEach(function (q) {
        if (q === p) return;
        p.near = Math.min(p.near, between(p.v, q.v));
        p.nearXY = Math.min(p.nearXY, Math.hypot(p.x - q.x, p.y - q.y));
      });
    });

    var minX = Infinity, maxX = -Infinity;
    places.forEach(function (p) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); });
    var HOME_F = { x: places.length ? (minX + maxX) / 2 : 0, y: (Y_TOP + Y_BOT) / 2, k: 1 };

    /* marks layer */
    var gDeco = svg("g", { "class": "globe__deco" }, marks);
    var gSky = svg("g", { "class": "globe__sky" }, marks);
    var gPins = svg("g", { "class": "globe__pins" }, marks);
    var decos = DECO.concat(FLAT ? [CARTOUCHE] : []).map(function (d) {
      var g = svg("g", { "class": "deco" }, gDeco);
      g.innerHTML = d.art;
      return { v: vec(d.lon, d.lat), lon: d.lon, lat: d.lat, el: g, tf: "" };
    });
    var sunMark = svg("g", { "class": "sun-mark" }, gSky);
    sunMark.innerHTML = SUN_ART;
    var moonMark = svg("g", { "class": "moon-mark" }, gSky);
    svg("circle", { r: 5.4, "class": "moon-mark__dark" }, moonMark);
    var moonLit = svg("path", { "class": "moon-mark__lit" }, moonMark);
    svg("circle", { r: 5.4, "class": "ink moon-mark__rim" }, moonMark);

    places.forEach(function (p, i) {
      p.el = svg("g", { "class": "pin", "data-id": p.id }, gPins);
      var body = svg("g", { "class": "pin__body" }, p.el);
      body.style.setProperty("--d", (0.25 + i * 0.035).toFixed(3) + "s");
      svg("circle", { "class": "pin__halo", cx: 0, cy: -8, r: 13 }, body);
      body.insertAdjacentHTML("beforeend", TOADSTOOL);
      p.label = document.createElement("span");
      p.label.className = "globe__label";
      p.label.textContent = p.name;
      labels.appendChild(p.label);
    });
    var clusters = [];
    function clusterEl(i) {
      if (!clusters[i]) {
        var g = svg("g", { "class": "pin pin--cluster" }, gPins);
        var body = svg("g", { "class": "pin__body" }, g);
        body.insertAdjacentHTML("beforeend", TOADSTOOL);
        var badge = svg("g", { "class": "pin__badge" }, body);
        svg("circle", { cx: 8.6, cy: -15.4, r: 6.6 }, badge);
        var t = svg("text", { x: 8.6, y: -12.6 }, badge);
        var lab = document.createElement("span");
        lab.className = "globe__label globe__label--hint";
        labels.appendChild(lab);
        clusters[i] = { el: g, text: t, label: lab, count: 0, tf: "", lw: 0 };
      }
      return clusters[i];
    }
    var skyLabel = document.createElement("span");
    skyLabel.className = "globe__label globe__label--hint";
    labels.appendChild(skyLabel);

    /* size */
    var W = 0, HT = 0, R = 0, dpr = 1, PIN = 1;
    function measure() {
      var w = host.clientWidth, h = FLAT ? host.clientHeight : w;
      if (!w || !h) return false;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = w; HT = h; R = w / 2;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      marks.setAttribute("viewBox", "0 0 " + w + " " + h);
      if (FLAT) {
        if (!nightImg) { night.width = 320; night.height = 160; nightImg = nctx.createImageData(320, 160); nightDirty = true; }
      } else {
        var n = clamp(Math.round(w * dpr / 3), 72, 240);
        if (night.width !== n) { night.width = night.height = n; nightImg = nctx.createImageData(n, n); }
      }
      PIN = FLAT ? clamp(w / 760, 0.8, 1.1) : clamp(w / 440, 0.8, 1.15);
      measureLabels();
      return true;
    }
    function measureLabels() {
      places.forEach(function (p) { p.lw = p.label.offsetWidth; });
    }
    function clusterGap() { return 15 * PIN; }

    /* colours, from the CSS tokens so they follow day and night */
    var col = {};
    function readColors() {
      var cs = getComputedStyle(host);
      function v(n, d) { var s = cs.getPropertyValue(n).trim(); return s || d; }
      function rgb(n, d) { return v(n, d).split(/[\s,]+/).map(Number); }
      col.sea = v("--globe-sea", "#cfe2df");
      col.seaDeep = v("--globe-sea-deep", "#a9cad2");
      col.land = v("--globe-land", "#c9d6ad");
      col.visited = v("--globe-visited", "#ecb9bb");
      col.coast = v("--globe-coast", "#2f3a2c");
      col.border = v("--globe-border", "rgba(47,58,44,.35)");
      col.grid = v("--globe-grid", "rgba(47,58,44,.12)");
      col.lines = v("--globe-lines", "rgba(168,70,63,.4)");
      col.rim = v("--globe-rim", "rgba(30,40,30,.25)");
      col.shine = v("--globe-shine", "rgba(255,255,255,.28)");
      col.night = rgb("--globe-night", "22 28 58");
      col.dusk = rgb("--globe-dusk", "240 160 120");
      col.nightA = parseFloat(v("--globe-night-alpha", ".5")) || 0.5;
      nightDirty = true;
    }

    /* the view */
    var view = FLAT ? { x: HOME_F.x, y: HOME_F.y, k: 1 } : { lon: HOME.lon, lat: HOME.lat, k: HOME.k };
    var sc = 1;                                     // flat map: pixels per map unit
    var E = [0, 0, 0], N = [0, 0, 0], C = [0, 0, 0], S = 1, rho = Math.PI / 2;
    function cover() { return Math.max(W / 360, HT / (Y_TOP - Y_BOT)); }
    // keep the flat map filling its frame: never pan or zoom out past the edge of the world
    function clampFlat() {
      sc = cover() * view.k;
      var hw = W / (2 * sc), hh = HT / (2 * sc), mid = (Y_TOP + Y_BOT) / 2, half = (Y_TOP - Y_BOT) / 2;
      view.x = hw >= 180 ? 0 : clamp(view.x, -180 + hw, 180 - hw);
      view.y = hh >= half ? mid : clamp(view.y, Y_BOT + hh, Y_TOP - hh);
    }
    function fx(x) { return W / 2 + (x - view.x) * sc; }
    function fy(y) { return HT / 2 - (y - view.y) * sc; }
    function basis() {
      if (FLAT) { clampFlat(); return; }
      var l = view.lon * D2R, p = view.lat * D2R;
      var sl = Math.sin(l), cl = Math.cos(l), sp = Math.sin(p), cp = Math.cos(p);
      E[0] = -sl;      E[1] = cl;       E[2] = 0;
      N[0] = -sp * cl; N[1] = -sp * sl; N[2] = cp;
      C[0] = cp * cl;  C[1] = cp * sl;  C[2] = sp;
      S = R * view.k;
      rho = Math.asin(Math.min(1, 1 / view.k));    // how far from the centre the frame reaches
    }
    function capOn(c) {
      return Math.acos(clamp(c.x * C[0] + c.y * C[1] + c.z * C[2], -1, 1)) - c.r < rho + 0.03;
    }

    /* projection scratch */
    var PX = new Float64Array(4096), PY = new Float64Array(4096), PZ = new Float64Array(4096);
    function project(v) {
      var n = v.length / 3;
      if (PX.length < n) { PX = new Float64Array(n * 2); PY = new Float64Array(n * 2); PZ = new Float64Array(n * 2); }
      for (var i = 0, j = 0; i < n; i++, j += 3) {
        var x = v[j], y = v[j + 1], z = v[j + 2];
        PX[i] = x * E[0] + y * E[1];
        PY[i] = x * N[0] + y * N[1] + z * N[2];
        PZ[i] = x * C[0] + y * C[1] + z * C[2];
      }
      return n;
    }
    // where the edge from point i (in front) to point j (behind) meets the horizon
    function crossing(i, j) {
      var t = PZ[i] / (PZ[i] - PZ[j]);
      var x = PX[i] + t * (PX[j] - PX[i]), y = PY[i] + t * (PY[j] - PY[i]);
      var m = Math.sqrt(x * x + y * y) || 1;
      x /= m; y /= m;
      return [x, y, Math.atan2(y, x)];
    }

    function traceLine(v) {
      var n = project(v), pen = false, p;
      for (var i = 0; i < n; i++) {
        if (PZ[i] > 0) {
          if (!pen) {
            if (i > 0) { p = crossing(i, i - 1); ctx.moveTo(R + p[0] * S, R - p[1] * S); ctx.lineTo(R + PX[i] * S, R - PY[i] * S); }
            else ctx.moveTo(R + PX[i] * S, R - PY[i] * S);
            pen = true;
          } else ctx.lineTo(R + PX[i] * S, R - PY[i] * S);
        } else if (pen) {
          p = crossing(i - 1, i);
          ctx.lineTo(R + p[0] * S, R - p[1] * S);
          pen = false;
        }
      }
    }

    function rimArc(a, span) {
      var steps = Math.ceil(span / 0.05);
      for (var i = 1; i <= steps; i++) {
        var t = a + span * i / steps;
        ctx.lineTo(R + Math.cos(t) * S, R - Math.sin(t) * S);
      }
    }

    function tracePolygon(rings) {
      var runs = null, r, i, p, run;
      for (r = 0; r < rings.length; r++) {
        var n = project(rings[r]), h = -1;
        for (i = 0; i < n; i++) if (PZ[i] <= 0) { h = i; break; }
        if (h < 0) {                                   // all in front: draw as is
          ctx.moveTo(R + PX[0] * S, R - PY[0] * S);
          for (i = 1; i < n; i++) ctx.lineTo(R + PX[i] * S, R - PY[i] * S);
          ctx.closePath();
          continue;
        }
        run = null;
        for (var s = 1; s <= n; s++) {                 // walk every edge, starting behind
          var a = (h + s - 1) % n, b = (h + s) % n;
          if (PZ[b] > 0) {
            if (PZ[a] <= 0) { p = crossing(b, a); run = { pts: [p[0], p[1]], a0: p[2], a1: 0, used: false }; }
            run.pts.push(PX[b], PY[b]);
          } else if (PZ[a] > 0) {
            p = crossing(a, b);
            run.pts.push(p[0], p[1]);
            run.a1 = p[2];
            (runs || (runs = [])).push(run);
            run = null;
          }
        }
      }
      if (runs) rejoin(runs);
    }

    // stitch the visible pieces back together along the rim
    function rejoin(runs) {
      for (var s = 0; s < runs.length; s++) {
        var start = runs[s];
        if (start.used) continue;
        var cur = start;
        ctx.moveTo(R + cur.pts[0] * S, R - cur.pts[1] * S);
        for (var guard = 0; guard <= runs.length; guard++) {
          cur.used = true;
          for (var i = 2; i < cur.pts.length; i += 2) ctx.lineTo(R + cur.pts[i] * S, R - cur.pts[i + 1] * S);
          var next = null, gap = Infinity;
          for (var q = 0; q < runs.length; q++) {
            var d = runs[q].a0 - cur.a1;
            d -= TAU * Math.floor(d / TAU);            // counter-clockwise distance, [0, 2pi)
            if (d > TAU - 1e-9) d = 0;
            if (d < gap) { gap = d; next = runs[q]; }
          }
          rimArc(cur.a1, gap);
          if (next === start || next.used) { ctx.closePath(); break; }
          cur = next;
        }
      }
    }

    /* night: the sun's altitude at every pixel, from where it's overhead now */
    var sunV = null, moonV = null, moonInfo = null, sunLL = null, moonLL = null, nightDirty = true;
    function updateSky() {
      var o = null;
      try { o = window.Sky && window.Sky.overhead ? window.Sky.overhead(new Date()) : null; } catch (e) {}
      if (!o) { sunV = moonV = null; return; }
      sunV = vec(o.sun.lon, o.sun.lat);
      moonV = vec(o.moon.lon, o.moon.lat);
      sunLL = o.sun; moonLL = o.moon;
      nightDirty = true;
      moonInfo = o.moon;
      var dusk = Math.sin(-3 * D2R);
      places.forEach(function (p) {
        var was = p.night;
        p.night = dot(p.v, sunV) < dusk;
        if (was !== p.night) p.el.classList.toggle("is-night", p.night);
      });
      moonLit.setAttribute("d", moonPath(5.4, moonInfo.illum, moonInfo.waxing));
    }
    // the flat map's night, over the whole map at once; only redone when the sun moves
    function paintNightFlat() {
      if (!sunV || !nightImg) return false;
      if (!nightDirty) return true;
      nightDirty = false;
      var nx = night.width, ny = night.height, d = nightImg.data;
      var lo = Math.sin(0.8 * D2R), hi = Math.sin(-12 * D2R);
      var nc = col.night, dc = col.dusk, A = col.nightA * 255;
      for (var j = 0; j < ny; j++) {
        var lat = millerLat(Y_TOP - (j + 0.5) * (Y_TOP - Y_BOT) / ny) * D2R, sl = Math.sin(lat), cl = Math.cos(lat);
        for (var i = 0; i < nx; i++) {
          var lon = (-180 + (i + 0.5) * 360 / nx) * D2R, o = (j * nx + i) * 4;
          var f = (lo - (cl * Math.cos(lon) * sunV[0] + cl * Math.sin(lon) * sunV[1] + sl * sunV[2])) / (lo - hi);
          if (f <= 0) { d[o + 3] = 0; continue; }
          if (f > 1) f = 1;
          f = f * f * (3 - 2 * f);
          var w = f < 0.4 ? 1 - f / 0.4 : 0;
          d[o] = nc[0] + (dc[0] - nc[0]) * w;
          d[o + 1] = nc[1] + (dc[1] - nc[1]) * w;
          d[o + 2] = nc[2] + (dc[2] - nc[2]) * w;
          d[o + 3] = A * f;
        }
      }
      nctx.putImageData(nightImg, 0, 0);
      return true;
    }

    function paintNight() {
      if (!sunV || !nightImg) return false;
      var n = night.width, d = nightImg.data, k = view.k;
      var s0 = dot(sunV, E), s1 = dot(sunV, N), s2 = dot(sunV, C);
      var lo = Math.sin(0.8 * D2R), hi = Math.sin(-12 * D2R);
      var nc = col.night, dc = col.dusk, A = col.nightA * 255;
      for (var py = 0; py < n; py++) {
        var fy = 1 - (py + 0.5) * 2 / n;
        for (var px = 0; px < n; px++) {
          var fx = (px + 0.5) * 2 / n - 1, rr = fx * fx + fy * fy, x = fx, y = fy, o = (py * n + px) * 4;
          if (rr > 0.996) { var m = Math.sqrt(0.996 / rr); x *= m; y *= m; }   // edge pixels copy the rim
          x /= k; y /= k;
          var z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
          var f = (lo - (x * s0 + y * s1 + z * s2)) / (lo - hi);         // 0 by day, 1 deep in the night
          if (f <= 0) { d[o + 3] = 0; continue; }
          if (f > 1) f = 1;
          f = f * f * (3 - 2 * f);
          var w = f < 0.4 ? 1 - f / 0.4 : 0;                            // a warm band at dusk
          d[o] = nc[0] + (dc[0] - nc[0]) * w;
          d[o + 1] = nc[1] + (dc[1] - nc[1]) * w;
          d[o + 2] = nc[2] + (dc[2] - nc[2]) * w;
          d[o + 3] = A * f;
        }
      }
      nctx.putImageData(nightImg, 0, 0);
      return true;
    }

    /* ------------------------------ drawing ------------------------------ */

    function draw() {
      if (!W) return;
      if (FLAT) drawFlat(); else drawGlobe();
    }

    function drawFlat() {
      basis();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, HT);
      var L = fx(-180), Rt = fx(180), T = fy(Y_TOP), B = fy(Y_BOT);
      ctx.save();
      ctx.beginPath();
      ctx.rect(L, T, Rt - L, B - T);
      ctx.clip();
      var sea = ctx.createLinearGradient(0, T, 0, B);
      sea.addColorStop(0, col.seaDeep);
      sea.addColorStop(0.3, col.sea);
      sea.addColorStop(0.7, col.sea);
      sea.addColorStop(1, col.seaDeep);
      ctx.fillStyle = sea;
      ctx.fillRect(L, T, Rt - L, B - T);

      // from here on, draw in map units: x east, y north
      ctx.setTransform(dpr * sc, 0, 0, -dpr * sc, dpr * fx(0), dpr * fy(0));
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = col.grid;
      ctx.lineWidth = 0.7 / sc;
      ctx.stroke(flat.grid);
      ctx.setLineDash([3 / sc, 4 / sc]);
      ctx.strokeStyle = col.lines;
      ctx.lineWidth = 0.9 / sc;
      ctx.stroke(flat.lines);
      ctx.setLineDash([]);
      // everything again a full turn east and west, for the shapes that cross the 180th meridian
      function each(fn) { [-360, 0, 360].forEach(function (sh) { ctx.save(); ctx.translate(sh, 0); fn(); ctx.restore(); }); }
      ctx.fillStyle = col.land;
      each(function () { ctx.fill(flat.land, "evenodd"); });
      ctx.fillStyle = col.visited;
      each(function () { ctx.fill(flat.tint, "evenodd"); });
      ctx.strokeStyle = col.border;
      ctx.lineWidth = 0.7 / sc;
      each(function () { ctx.stroke(flat.border); });
      ctx.strokeStyle = col.coast;
      ctx.lineWidth = clamp(0.8 + view.k * 0.03, 0.8, 1.3) / sc;
      each(function () { ctx.stroke(flat.coast); });

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (paintNightFlat()) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(night, L, T, Rt - L, B - T);
      }
      ctx.restore();
      placeMarks();
    }

    function drawGlobe() {
      basis();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, W);
      ctx.save();
      ctx.beginPath();
      ctx.arc(R, R, R, 0, TAU);
      ctx.clip();

      var sea = ctx.createRadialGradient(R, R, S * 0.15, R, R, S);
      sea.addColorStop(0, col.sea);
      sea.addColorStop(1, col.seaDeep);
      ctx.fillStyle = sea;
      ctx.fillRect(0, 0, W, W);

      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      grid.forEach(function (g) { if (capOn(g.cap)) traceLine(g.v); });
      ctx.strokeStyle = col.grid;
      ctx.lineWidth = 0.7;
      ctx.stroke();

      ctx.beginPath();
      lines.forEach(function (g) { if (capOn(g.cap)) traceLine(g.v); });
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = col.lines;
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      land.forEach(function (p) { if (capOn(p.cap)) tracePolygon(p.rings); });
      ctx.fillStyle = col.land;
      ctx.fill();

      ctx.beginPath();
      tinted.forEach(function (p) { if (capOn(p.cap)) tracePolygon(p.rings); });
      ctx.fillStyle = col.visited;
      ctx.fill();

      ctx.beginPath();
      border.forEach(function (a) { if (capOn(a.cap)) traceLine(a.v); });
      ctx.strokeStyle = col.border;
      ctx.lineWidth = 0.7;
      ctx.stroke();

      ctx.beginPath();
      coast.forEach(function (a) { if (capOn(a.cap)) traceLine(a.v); });
      ctx.strokeStyle = col.coast;
      ctx.lineWidth = clamp(0.75 + view.k * 0.05, 0.75, 1.35);
      ctx.stroke();

      if (paintNight()) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(night, 0, 0, W, W);
      }

      // a lacquer shine and a darker rim, so it reads as a ball
      var hx = R - 0.36 * S, hy = R - 0.42 * S;
      var shine = ctx.createRadialGradient(hx, hy, 0, hx, hy, S * 0.75);
      shine.addColorStop(0, col.shine);
      shine.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = shine;
      ctx.fillRect(0, 0, W, W);
      var rim = ctx.createRadialGradient(R, R, S * 0.68, R, R, S);
      rim.addColorStop(0, "rgba(0,0,0,0)");
      rim.addColorStop(1, col.rim);
      ctx.fillStyle = rim;
      ctx.fillRect(0, 0, W, W);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(R, R, R - 0.8, 0, TAU);
      ctx.strokeStyle = col.coast;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      placeMarks();
    }

    /* ------------------------- toadstools and labels ------------------------- */

    var selected = null, hover = null, items = [];

    // where a thing ({ v, lon, lat }) sits on screen, and whether it's on show
    function screenOf(o) {
      if (FLAT) {
        var px = fx(o.lon), py = fy(millerY(o.lat));
        return { x: px, y: py, z: 1, on: px >= 0 && px <= W && py >= 0 && py <= HT };
      }
      var v = o.v;
      var x = dot(v, E), y = dot(v, N), z = dot(v, C);
      var sx = R + x * S, sy = R - y * S, dx = sx - R, dy = sy - R;
      return { x: sx, y: sy, z: z, on: z > 0.02 && dx * dx + dy * dy < (R - 3) * (R - 3) };
    }
    function setTf(o, tf) { if (o.tf !== tf) { o.tf = tf; o.el.setAttribute("transform", tf); } }
    function show(o, on) { if (o.shown !== on) { o.shown = on; o.el.style.visibility = on ? "" : "hidden"; } }

    function placeMarks() {
      items = [];
      var gap = clusterGap(), vis = [];

      decos.forEach(function (d) {
        var s = screenOf(d), k = PIN * Math.min(view.k, 1.8);
        var on = FLAT
          ? s.x > 60 * k && s.x < W - 60 * k && s.y > 20 * k && s.y < HT - 20 * k
          : s.on && s.z > 0.12 && (s.x - R) * (s.x - R) + (s.y - R) * (s.y - R) < (R - 18 * k) * (R - 18 * k);
        show(d, on);
        if (on) {
          setTf(d, "translate(" + s.x.toFixed(1) + " " + s.y.toFixed(1) + ") scale(" + k.toFixed(3) + ")");
          d.el.style.opacity = FLAT ? "" : clamp((s.z - 0.12) / 0.25, 0, 1).toFixed(2);
        }
      });

      [[sunMark, sunV, sunLL, "sun"], [moonMark, moonV, moonLL, "moon"]].forEach(function (m) {
        var el = m[0];
        if (!m[1]) { el.style.visibility = "hidden"; return; }
        var s = screenOf({ v: m[1], lon: m[2].lon, lat: m[2].lat });
        el.style.visibility = s.on && s.z > 0.08 ? "" : "hidden";
        if (s.on && s.z > 0.08) {
          el.setAttribute("transform", "translate(" + s.x.toFixed(1) + " " + s.y.toFixed(1) + ") scale(" + PIN.toFixed(3) + ")");
          items.push({ type: m[3], hx: s.x, hy: s.y, x: s.x, y: s.y });
        }
      });

      places.forEach(function (p) {
        var s = screenOf(p);
        p.sx = s.x; p.sy = s.y; p.on = s.on;
        p.fade = clamp(s.z / 0.2, 0.25, 1);
        if (p.on) vis.push(p);
      });

      // greedy clusters, the picked place first so it's never swallowed
      vis.sort(function (a, b) { return (b === selected) - (a === selected) || a.order - b.order; });
      var groups = [];
      vis.forEach(function (p) {
        for (var i = 0; i < groups.length; i++) {
          var g = groups[i], dx = p.sx - g.ax, dy = p.sy - g.ay;
          if (dx * dx + dy * dy < gap * gap) { g.members.push(p); return; }
        }
        groups.push({ ax: p.sx, ay: p.sy, members: [p] });
      });

      var singles = {}, ci = 0;
      groups.forEach(function (g) {
        if (g.members.length === 1) {
          var p = g.members[0];
          singles[p.id] = true;
          items.push({ type: "place", p: p, hx: p.sx, hy: p.sy - 8 * PIN, x: p.sx, y: p.sy });
          return;
        }
        var c = clusterEl(ci++), x = 0, y = 0, sel = false;
        g.members.forEach(function (p) { x += p.sx; y += p.sy; if (p === selected) sel = true; });
        x /= g.members.length; y /= g.members.length;
        if (sel) { x = selected.sx; y = selected.sy; }
        if (c.count !== g.members.length) {
          c.count = g.members.length;
          c.text.textContent = c.count;
          c.label.textContent = c.count + " places here · zoom in";
          c.lw = 0;
        }
        c.el.classList.toggle("is-selected", sel);
        c.el.classList.toggle("is-night", g.members.every(function (p) { return p.night; }));
        c.el.style.visibility = "";
        setTf(c, "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") scale(" + PIN.toFixed(3) + ")");
        items.push({ type: "cluster", c: c, members: g.members, hx: x, hy: y - 8 * PIN, x: x, y: y });
      });
      for (var j = ci; j < clusters.length; j++) clusters[j].el.style.visibility = "hidden";

      places.forEach(function (p) {
        var on = !!singles[p.id];
        show(p, on);
        if (on) {
          setTf(p, "translate(" + p.sx.toFixed(1) + " " + p.sy.toFixed(1) + ") scale(" + PIN.toFixed(3) + ")");
          p.el.style.opacity = p.fade < 1 ? p.fade.toFixed(2) : "";
        }
      });

      placeLabels();
    }

    function placeLabels() {
      var boxes = [], all = FLAT || view.k >= 2.2, H = 22;
      // every toadstool on show is an obstacle, so a label never hides one
      items.forEach(function (it) {
        if (it.type === "place" || it.type === "cluster") {
          boxes.push({ x: it.x - 9 * PIN, y: it.y - 18 * PIN, w: 18 * PIN, h: 19 * PIN, own: it.p || it.c });
        }
      });
      function fits(x, y, w, own) {
        if (FLAT ? (x < 3 || x + w > W - 3 || y < 3 || y + H > HT - 3) : (x < -40 || x + w > W + 40)) return false;
        for (var i = 0; i < boxes.length; i++) {
          var b = boxes[i];
          if (own && b.own === own) continue;
          if (x < b.x + b.w + 4 && x + w + 4 > b.x && y < b.y + (b.h || H) && y + H > b.y) return false;
        }
        return true;
      }
      function put(el, x, y, w, force, own) {
        var gx = (own && own === selected ? 14 : 11) * PIN;   // the picked toadstool stands bigger
        var tries = [[x + gx, y - 9 * PIN - H / 2], [x - gx - w, y - 9 * PIN - H / 2],
                     [x - w / 2, y - 26 * PIN - H], [x - w / 2, y + 5 * PIN]];
        var pick = null;
        for (var i = 0; i < tries.length && !pick; i++) if (fits(tries[i][0], tries[i][1], w, own)) pick = tries[i];
        if (!pick && force) {                     // the picked place always gets its name
          pick = tries[0];
          if (FLAT) pick = [clamp(pick[0], 3, W - w - 3), clamp(pick[1], 3, HT - H - 3)];
          if (FLAT && x + gx + w > W - 3) pick[0] = clamp(tries[1][0], 3, W - w - 3);
        }
        if (!pick) { el.classList.remove("is-on"); return false; }
        boxes.push({ x: pick[0], y: pick[1], w: w });
        el.style.transform = "translate(" + pick[0].toFixed(1) + "px," + pick[1].toFixed(1) + "px)";
        el.classList.add("is-on");
        return true;
      }
      var shown = {};
      places.forEach(function (p) { p.label.classList.toggle("is-selected", p === selected); });
      // the picked place, then whatever is under the pointer, then the rest
      if (selected && selected.shown) { put(selected.label, selected.sx, selected.sy, selected.lw, true, selected); shown[selected.id] = 1; }
      skyLabel.classList.remove("is-on");
      clusters.forEach(function (c) { c.label.classList.remove("is-on"); });
      if (hover) {
        var it = hover;
        if (it.type === "place" && it.p.shown && !shown[it.p.id]) { put(it.p.label, it.p.sx, it.p.sy, it.p.lw, true, it.p); shown[it.p.id] = 1; }
        else if (it.type === "cluster" && it.c.el.style.visibility !== "hidden") {
          if (!it.c.lw) it.c.lw = it.c.label.offsetWidth;
          put(it.c.label, it.x, it.y, it.c.lw, true, it.c);
        } else if (it.type === "sun" || it.type === "moon") {
          skyLabel.textContent = it.type === "sun" ? "the sun is straight overhead here" : "the moon is straight overhead here";
          put(skyLabel, it.x, it.y + 9 * PIN, skyLabel.offsetWidth, true);
        }
      }
      places.forEach(function (p) {
        if (shown[p.id]) return;
        if (all && p.shown) put(p.label, p.sx, p.sy, p.lw, false, p);
        else p.label.classList.remove("is-on");
      });
    }

    function hitAt(x, y, touch) {
      var best = null, bd = (touch ? 24 : 15) * Math.max(1, PIN);
      items.forEach(function (it) {
        var dx = x - it.hx, dy = y - it.hy, d = Math.sqrt(dx * dx + dy * dy);
        if (it.type === "sun" || it.type === "moon") d += 6;      // toadstools win ties
        if (d < bd) { bd = d; best = it; }
      });
      return best;
    }
    function setHover(it) {
      var same = hover && it && hover.type === it.type && hover.p === it.p && hover.c === it.c;
      if (same || (!hover && !it)) return;
      if (hover && hover.p) hover.p.el.classList.remove("is-hover");
      if (hover && hover.c) hover.c.el.classList.remove("is-hover");
      hover = it;
      if (it && it.p) it.p.el.classList.add("is-hover");
      if (it && it.c) it.c.el.classList.add("is-hover");
      host.classList.toggle("is-pointing", !!it && it.type !== "sun" && it.type !== "moon");
      placeLabels();
    }

    /* ----------------------------- animation ----------------------------- */

    var raf = 0, last = 0, lastSpinDraw = 0, fly = null, inertia = null, drag = null, pinch = null;
    var spinOn = !REDUCED && !FLAT, onScreen = true, idleUntil = 0, wake = 0;

    function invalidate() { if (!raf) raf = requestAnimationFrame(frame); }
    function spinning() {
      return spinOn && !selected && onScreen && !document.hidden && !drag && !pinch &&
        performance.now() >= idleUntil;
    }
    function frame() {
      var now = performance.now();               // the same clock fly.t0 uses
      raf = 0;
      var dt = last ? Math.min(50, now - last) : 16, more = false;
      last = now;
      if (fly) {
        var t = clamp((now - fly.t0) / fly.dur, 0, 1);
        var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        if (fly.flat) {
          view.x = fly.x0 + (fly.x1 - fly.x0) * e;
          view.y = fly.y0 + (fly.y1 - fly.y0) * e;
        } else {
          view.lon = wrap(fly.lon0 + fly.dlon * e);
          view.lat = fly.lat0 + (fly.lat1 - fly.lat0) * e;
        }
        view.k = clamp(Math.exp(fly.lk0 + (fly.lk1 - fly.lk0) * e - fly.dip * Math.sin(Math.PI * t)), 1, maxK);
        if (t >= 1) { var done = fly.done; fly = null; if (done) done(); }
        else more = true;
      } else if (inertia) {
        turn(inertia.vx * dt, inertia.vy * dt);
        var decay = Math.exp(-dt / 330);
        inertia.vx *= decay; inertia.vy *= decay;
        if (Math.abs(inertia.vx) + Math.abs(inertia.vy) < 0.01) inertia = null;
        else more = true;
      } else if (spinning()) {
        view.lon = wrap(view.lon - SPIN * dt / view.k);
        more = true;
        // the idle spin is slow, so 30 frames a second is plenty (and kinder to batteries)
        if (now - lastSpinDraw < 30) { invalidate(); return; }
        lastSpinDraw = now;
      }
      draw();
      if (more) invalidate();
      else last = 0;
    }

    // the visitor moved it: stop flights, hold the spin a moment
    function touched() {
      fly = null;
      idleUntil = performance.now() + 5000;
      clearTimeout(wake);
      wake = setTimeout(invalidate, 5100);
      if (opts.onMove) opts.onMove();
    }

    function turn(dx, dy) {
      if (FLAT) {                                   // the flat map slides
        clampFlat();
        view.x -= dx / sc;
        view.y += dy / sc;
        clampFlat();
        invalidate();
        return;
      }
      view.lon = wrap(view.lon - dx / S * R2D);
      view.lat = clamp(view.lat + dy / S * R2D, -80, 80);
      invalidate();
    }

    // the flat map's flight: glide across, easing out a little on long trips
    function flyFlat(x, y, k, done, instant) {
      inertia = null;
      var from = { x: view.x, y: view.y, k: view.k };
      view.k = clamp(k, 1, maxK); view.x = x; view.y = y;
      clampFlat();                                  // where it will really end up
      var to = { x: view.x, y: view.y, k: view.k };
      if (REDUCED || instant) { fly = null; invalidate(); if (done) done(); return; }
      view.x = from.x; view.y = from.y; view.k = from.k;
      clampFlat();
      var dist = Math.hypot(to.x - from.x, to.y - from.y) * sc / Math.max(W, 1);   // in screen widths
      var lk0 = Math.log(from.k), lk1 = Math.log(to.k);
      fly = {
        flat: true,
        t0: performance.now(),
        dur: clamp(420 + dist * 520 + Math.abs(lk1 - lk0) * 170, 420, 1800),
        x0: from.x, y0: from.y, x1: to.x, y1: to.y,
        lk0: lk0, lk1: lk1,
        dip: Math.min(1.4, dist * 0.7),
        done: done
      };
      invalidate();
    }

    function flyTo(lon, lat, k, done, instant) {
      inertia = null;
      k = clamp(k, 1, MAX_K);
      lat = clamp(lat, -80, 80);
      if (REDUCED || instant) {
        view.lon = wrap(lon); view.lat = lat; view.k = k;
        fly = null;
        invalidate();
        if (done) done();
        return;
      }
      var a = between(vec(view.lon, view.lat), vec(lon, lat));
      var lk0 = Math.log(view.k), lk1 = Math.log(k);
      fly = {
        t0: performance.now(),
        dur: clamp(480 + a * 640 + Math.abs(lk1 - lk0) * 170, 480, 2000),
        lon0: view.lon, dlon: wrap(lon - view.lon),
        lat0: view.lat, lat1: lat,
        lk0: lk0, lk1: lk1,
        dip: a * 0.85,
        done: done
      };
      invalidate();
    }

    function zoomAt(f, x, y) {
      if (FLAT) {                                   // keep the point under the pointer exactly still
        clampFlat();
        var s0 = sc, kf = clamp(view.k * f, 1, maxK);
        fly = null; inertia = null;
        if (kf === view.k) return;
        var px = x == null ? W / 2 : x, py = y == null ? HT / 2 : y;
        var mx = view.x + (px - W / 2) / s0, my = view.y - (py - HT / 2) / s0;
        view.k = kf;
        var s1 = cover() * kf;
        view.x = mx - (px - W / 2) / s1;
        view.y = my + (py - HT / 2) / s1;
        clampFlat();
        invalidate();
        return;
      }
      var k0 = view.k, k1 = clamp(k0 * f, 1, MAX_K);
      fly = null; inertia = null;
      if (k1 === k0) return;
      var target = x == null ? null : unproject(x, y);
      view.k = k1;
      if (target) {   // turn toward the point by the zoom's share, so it stays under the pointer
        var c = vec(view.lon, view.lat);
        var ll = lonLat(slerp(c, target, clamp(1 - k0 / k1, -1, 1)));
        view.lon = wrap(ll.lon);
        view.lat = clamp(ll.lat, -80, 80);
      }
      invalidate();
    }
    function unproject(x, y) {
      basis();
      var fx = (x - R) / S, fy = (R - y) / S, rr = fx * fx + fy * fy;
      if (rr > 1) return null;
      var fz = Math.sqrt(1 - rr);
      return [fx * E[0] + fy * N[0] + fz * C[0], fx * E[1] + fy * N[1] + fz * C[1], fy * N[2] + fz * C[2]];
    }

    function focusZoom(p) {
      return clamp(Math.max(2.4, clusterGap() * 1.8 / (p.near * R)), 1, MAX_K);
    }

    /* Picking a place on the flat map only moves the map if it has to: zoom in
       just enough to part it from its nearest neighbour, and glide over only
       if it isn't comfortably in view already. */
    function focusFlat(p, done, instant) {
      clampFlat();
      var need = clusterGap() * 1.8 / (p.nearXY * cover());
      var k = clamp(Math.max(view.k, need), 1, maxK);
      var px = fx(p.x), py = fy(p.y);
      var inView = px > W * 0.12 && px < W * 0.88 && py > HT * 0.18 && py < HT * 0.88;
      if (k <= view.k + 1e-6 && inView) { fly = null; invalidate(); if (done) done(); return; }
      flyFlat(p.x, p.y, k, done, instant);
    }
    function fitFlat(list, separate, done) {
      if (list.length === 1) { focusFlat(list[0], done); return; }
      var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, near = Infinity;
      list.forEach(function (p, i) {
        x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
        list.forEach(function (q, j) { if (j > i) near = Math.min(near, Math.hypot(p.x - q.x, p.y - q.y)); });
      });
      var c = cover();
      var fit = Math.min(W * 0.72 / Math.max((x1 - x0) * c, 1e-6), HT * 0.62 / Math.max((y1 - y0) * c, 1e-6));
      var k = fit;
      if (separate) k = Math.min(Math.max(clusterGap() * 1.9 / (near * c), view.k * 1.6), fit * 1.25);
      flyFlat((x0 + x1) / 2, (y0 + y1) / 2, clamp(k, 1, maxK), done);
    }

    function fitPlaces(list, separate, done) {
      if (FLAT) { fitFlat(list, separate, done); return; }
      if (list.length === 1) { flyTo(list[0].lon, list[0].lat, focusZoom(list[0]), done); return; }
      var c = [0, 0, 0];
      list.forEach(function (p) { c[0] += p.v[0]; c[1] += p.v[1]; c[2] += p.v[2]; });
      var m = Math.sqrt(dot(c, c)) || 1;
      c = [c[0] / m, c[1] / m, c[2] / m];
      var spread = 0, near = Math.PI;
      list.forEach(function (p, i) {
        spread = Math.max(spread, between(c, p.v));
        list.forEach(function (q, j) { if (j > i) near = Math.min(near, between(p.v, q.v)); });
      });
      var fit = 0.74 / Math.sin(clamp(spread, 0.001, Math.PI / 2));
      var k = fit;
      if (separate) k = Math.min(Math.max(clusterGap() * 1.9 / (near * R), view.k * 1.6), 0.92 / Math.sin(clamp(spread, 0.001, Math.PI / 2)));
      var ll = lonLat(c);
      flyTo(ll.lon, ll.lat, clamp(k, 1, MAX_K), done);
    }

    function select(p) {
      if (selected === p) return;
      if (selected) selected.el.classList.remove("is-selected");
      selected = p;
      if (p) {
        p.el.classList.add("is-selected");
        gPins.appendChild(p.el);                  // on top of its neighbours
      }
      invalidate();
    }

    /* ----------------------------- the visitor ----------------------------- */

    function local(e) {
      var r = host.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    var ptrs = {}, nPtr = 0;
    function twoPointers() {
      var ids = Object.keys(ptrs);
      var a = ptrs[ids[0]], b = ptrs[ids[1]];
      return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }

    host.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      try { host.setPointerCapture(e.pointerId); } catch (err) {}
      if (!ptrs[e.pointerId]) nPtr++;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      inertia = null;                           // a touch catches it; only moving it counts as moving it
      if (nPtr === 1) {
        drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: e.timeStamp,
                 vx: 0, vy: 0, moved: false, touch: e.pointerType !== "mouse" };
      } else if (nPtr === 2) {
        var t = twoPointers();
        pinch = { d: t.d, k: view.k, x: t.x, y: t.y };
        if (drag) drag.moved = true;
        touched();
      }
    });

    host.addEventListener("pointermove", function (e) {
      if (!ptrs[e.pointerId]) {
        if (e.pointerType === "mouse" && !drag) { var q = local(e); setHover(hitAt(q.x, q.y, false)); }
        return;
      }
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (pinch && nPtr >= 2) {
        var t = twoPointers();
        var r = host.getBoundingClientRect();
        zoomAt(pinch.k * t.d / pinch.d / view.k, t.x - r.left, t.y - r.top);
        turn(t.x - pinch.x, t.y - pinch.y);
        pinch.x = t.x; pinch.y = t.y;
        return;
      }
      if (!drag) return;
      if (!drag.moved) {
        if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) < 6) return;
        drag.moved = true;
        touched();
        setHover(null);
        host.classList.add("is-dragging");
      }
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y, dt = Math.max(8, e.timeStamp - drag.t);
      turn(dx, dy);
      drag.vx = 0.6 * dx / dt + 0.4 * drag.vx;
      drag.vy = 0.6 * dy / dt + 0.4 * drag.vy;
      drag.x = e.clientX; drag.y = e.clientY; drag.t = e.timeStamp;
    });

    function release(e) {
      if (!ptrs[e.pointerId]) return;
      delete ptrs[e.pointerId];
      nPtr--;
      if (nPtr === 1 && pinch) {            // one finger left: carry on turning with it
        pinch = null;
        var id = Object.keys(ptrs)[0];
        drag = { x: ptrs[id].x, y: ptrs[id].y, sx: 0, sy: 0, t: e.timeStamp, vx: 0, vy: 0, moved: true, touch: true };
        return;
      }
      if (nPtr > 0) return;
      pinch = null;
      host.classList.remove("is-dragging");
      if (drag && !drag.moved && e.type === "pointerup") {
        var q = local(e);
        tap(hitAt(q.x, q.y, drag.touch));
      } else if (drag && drag.moved && !REDUCED && e.timeStamp - drag.t < 90 &&
                 Math.abs(drag.vx) + Math.abs(drag.vy) > 0.05) {
        inertia = { vx: drag.vx, vy: drag.vy };
      }
      drag = null;
      invalidate();
    }
    host.addEventListener("pointerup", release);
    host.addEventListener("pointercancel", release);
    host.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") setHover(null); });

    function tap(it) {
      if (!it) return;
      if (it.type === "place") { if (opts.onPick) opts.onPick(it.p.id); }
      else if (it.type === "cluster") fitPlaces(it.members, true);
      else setHover(it);                        // the sun or moon: just say what it is
    }

    host.addEventListener("wheel", function (e) {
      if (!e.ctrlKey && !e.metaKey) return;     // plain scrolling still scrolls the page
      e.preventDefault();
      touched();
      var q = local(e), dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      zoomAt(Math.exp(-clamp(dy, -60, 60) * 0.01), q.x, q.y);
    }, { passive: false });

    host.addEventListener("dblclick", function (e) {
      var q = local(e);
      if (hitAt(q.x, q.y, false)) return;
      touched();
      zoomAt(2, q.x, q.y);
    });

    host.addEventListener("keydown", function (e) {
      if (FLAT) {
        clampFlat();
        var gx = W * 0.15 / sc, gy = HT * 0.15 / sc;
        switch (e.key) {
          case "ArrowLeft":  touched(); flyFlat(view.x - gx, view.y, view.k); break;
          case "ArrowRight": touched(); flyFlat(view.x + gx, view.y, view.k); break;
          case "ArrowUp":    touched(); flyFlat(view.x, view.y + gy, view.k); break;
          case "ArrowDown":  touched(); flyFlat(view.x, view.y - gy, view.k); break;
          case "+": case "=": touched(); flyFlat(view.x, view.y, view.k * 1.6); break;
          case "-": case "_": touched(); flyFlat(view.x, view.y, view.k / 1.6); break;
          case "0": case "Home": api.reset(); break;
          default: return;
        }
        e.preventDefault();
        return;
      }
      var step = 14 / view.k;
      switch (e.key) {
        case "ArrowLeft":  touched(); flyTo(view.lon - step, view.lat, view.k); break;
        case "ArrowRight": touched(); flyTo(view.lon + step, view.lat, view.k); break;
        case "ArrowUp":    touched(); flyTo(view.lon, view.lat + step, view.k); break;
        case "ArrowDown":  touched(); flyTo(view.lon, view.lat - step, view.k); break;
        case "+": case "=": touched(); flyTo(view.lon, view.lat, view.k * 1.6); break;
        case "-": case "_": touched(); flyTo(view.lon, view.lat, view.k / 1.6); break;
        case "0": case "Home": api.reset(); break;
        default: return;
      }
      e.preventDefault();
    });

    /* ------------------------------- upkeep ------------------------------- */

    readColors();
    updateSky();
    if (measure()) draw();

    if (window.ResizeObserver) {
      new ResizeObserver(function () { if (measure()) draw(); }).observe(host);
    } else {
      window.addEventListener("resize", function () { if (measure()) draw(); });
    }
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        onScreen = es[0].isIntersecting;
        if (onScreen) invalidate();
      }).observe(host);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) { updateSky(); invalidate(); } });
    new MutationObserver(function () { readColors(); invalidate(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["data-dark"] });
    setInterval(function () { updateSky(); invalidate(); }, 60000);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measureLabels(); clusters.forEach(function (c) { c.lw = 0; }); invalidate(); });
    }
    invalidate();

    var api = {
      focus: function (id, done, instant) {
        var p = byId[id];
        if (!p) return;
        select(p);
        if (FLAT) focusFlat(p, done, instant);
        else flyTo(p.lon, p.lat, focusZoom(p), done, instant);
      },
      fit: function (ids, done) {
        var list = ids.map(function (id) { return byId[id]; }).filter(Boolean);
        if (list.length) fitPlaces(list, false, done);
      },
      clear: function () { select(null); },
      reset: function (instant) {
        select(null); touched(); idleUntil = 0;
        if (FLAT) flyFlat(HOME_F.x, HOME_F.y, HOME_F.k, null, instant);
        else flyTo(HOME.lon, HOME.lat, HOME.k, null, instant);
      },
      zoomBy: function (f) {
        touched();
        if (FLAT) { clampFlat(); flyFlat(view.x, view.y, view.k * f); }
        else flyTo(view.lon, view.lat, view.k * f);
      },
      setSpin: function (on) {
        spinOn = !!on && !REDUCED;
        if (spinOn) idleUntil = 0;
        invalidate();
        return spinOn;
      },
      spins: function () { return spinOn; },
      canSpin: !REDUCED && !FLAT,
      zoomed: function () { return view.k > 1.01; },
      redraw: function () { if (measure()) { readColors(); updateSky(); draw(); } },
      jump: function (lon, lat, k) {
        fly = null; inertia = null;
        if (FLAT) { view.x = lon; view.y = millerY(lat); view.k = clamp(k || 1, 1, maxK); clampFlat(); }
        else { view.lon = wrap(lon); view.lat = clamp(lat, -80, 80); view.k = clamp(k || 1, 1, MAX_K); }
        invalidate();
      },
      nightAt: function (id) { var p = byId[id]; return p ? p.night : false; }
    };
    return api;
  }

  window.Globe = Globe;
})();
