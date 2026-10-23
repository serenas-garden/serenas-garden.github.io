/* The gallery (art.html). Everything it shows comes from art-data.js.
 *
 *  - the wall: every piece hangs whole, in its own frame, on a picture rail.
 *    Rows are laid out to fit the screen (each row is one height, and the
 *    pieces in it fill the width, like a hung wall), so any number of
 *    pieces, of any shape, hang neatly. Each has a little label underneath.
 *    Frames differ in width, so each piece's frame is measured as it's hung.
 *  - its little animation (fx): each piece can have one, drawn over the
 *    picture (moonlight glinting, snow falling, bubbles, a blink...). It
 *    plays when you point at the piece on the wall, and all the time full
 *    screen. None of it runs with reduced motion.
 *  - full screen: tap a piece and it lifts off the wall to fill the screen,
 *    on a dark that takes its colour from the piece (`tone`), with its
 *    title, date, medium and Serena's note. Arrows, arrow keys or a swipe go
 *    to the next one; Esc, the close button, a tap on the dark or a swipe
 *    down puts it back. Click the picture to look closer (it follows the
 *    mouse); phones pinch. Where the browser allows it, a button fills the
 *    whole screen. art.html#<id> opens straight onto a piece, and Back
 *    closes it on phones.
 *  - empty frames: with `sample: true`, frames without a picture hold a
 *    blank canvas with a pencil doodle, and it all says so.
 */
(function () {
  "use strict";

  var DATA = window.ART;
  var hang = document.querySelector("[data-hang]");
  if (!DATA || !hang) return;

  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var FRAMES = ["oak", "gilt", "cream", "walnut", "sage", "ink", "rose"];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // a small steady number from a piece's id (its tilt never changes)
  function seed(str) {
    var h = 7;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 9973;
    return h;
  }
  // a seeded random number generator, so a piece's animation is laid out
  // the same way on the wall and full screen
  function rng(n) {
    var a = n * 2654435761 >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var sample = !!DATA.sample;
  var pieces = (DATA.pieces || []).map(function (p, i) {
    var blank = !p.src;
    var id = String(p.id || "piece-" + (i + 1));
    return {
      i: i,
      id: id,
      // no title yet: the labels just give the date and medium (Rex, Oct 2026)
      title: p.title || (blank ? "Empty frame" : ""),
      year: p.year || "",
      medium: p.medium || "",
      size: p.size || "",
      note: p.note || "",
      alt: p.alt || "",
      src: p.src || "",
      full: p.full || p.src || "",
      ratio: (p.w > 0 && p.h > 0) ? p.w / p.h : 1,
      px: p.w > 0 ? p.w : 0,
      frame: /^[a-z0-9-]+$/.test(p.frame || "") ? p.frame : FRAMES[i % FRAMES.length],
      tone: /^#[0-9a-f]{3,8}$/i.test(p.tone || "") ? p.tone : "",
      fx: Array.isArray(p.fx) ? p.fx : [],
      collection: p.collection || "",
      blank: blank,
      tilt: ((seed(id) % 15) - 7) / 10
    };
  });

  /* ------------------------------ the words ------------------------------ */

  function metaLine(p) {
    if (p.blank) return "art coming soon";
    return [p.year, p.medium].filter(Boolean).join(" · ");
  }

  var plaque = $("[data-plaque]");
  if (plaque && sample) plaque.textContent = pieces.length + " frames, waiting for Serena's art";

  /* ------------------------------ the animations ------------------------------ */
  /* Each kind is a handful of little elements with their own timings in CSS
     custom properties; style.css (.fx-*) moves them. Sizes are in cqw, a
     hundredth of the picture's width, so they look the same in a small frame
     and full screen. Areas are [left, top, right, bottom], 0..1. */

  function pct(v) { return (v * 100).toFixed(2) + "%"; }
  function areaOpen(a) {
    return '<span class="fx-area" style="left:' + pct(a[0]) + ";top:" + pct(a[1]) +
      ";width:" + pct(a[2] - a[0]) + ";height:" + pct(a[3] - a[1]) + '">';
  }
  function vars(o) {
    return Object.keys(o).map(function (k) { return "--" + k + ":" + o[k]; }).join(";");
  }
  var BUTTERFLY = ["#c4b3ec", "#f2c94c", "#fbf7ee", "#f0a6b4"];

  function fxHTML(p) {
    if (!p.fx.length) return "";
    var r = rng(seed(p.id) + 1), out = "";
    function rand(a, b) { return a + r() * (b - a); }
    function f(v) { return v.toFixed(2); }

    p.fx.forEach(function (fx) {
      var a = fx.area || [0, 0, 1, 1], aw = a[2] - a[0], k, n = fx.n || 10;
      var c = fx.color || "#ffffff";
      switch (fx.type) {
        case "snow":
        case "petals":
          for (k = 0; k < n; k++) {
            var petal = fx.type === "petals";
            out += '<i class="fx-' + (petal ? "petal" : "flake") + '" style="' + vars({
              x: f(rand(petal ? 5 : -5, petal ? 125 : 105)) + "%",
              s: f(petal ? rand(1.5, 2.6) : rand(.45, 1.3)),
              t: f(petal ? rand(9, 15) : rand(7, 13)) + "s",
              d: "-" + f(rand(0, 14)) + "s",
              dx: f(petal ? rand(-34, -14) : rand(-5, 5)),
              rot: f(rand(160, 560)) + "deg"
            }) + '"></i>';
          }
          break;
        case "bubbles":
          out += areaOpen(a);
          for (k = 0; k < n; k++) {
            out += '<i class="fx-bubble" style="left:' + f(rand(4, 96)) + "%;" + vars({
              s: f(rand(.8, 2.2) / aw), t: f(rand(6, 11)) + "s", d: "-" + f(rand(0, 11)) + "s", w: f(rand(1, 3.5) / aw)
            }) + '"></i>';
          }
          out += "</span>";
          break;
        case "glints":
          out += areaOpen(a);
          for (k = 0; k < n; k++) {
            out += '<i class="fx-glint' + (fx.shape === "star" ? " fx-glint--star" : "") + '" style="left:' +
              f(rand(2, 98)) + "%;top:" + f(rand(4, 96)) + "%;" + vars({
                s: f((fx.shape === "star" ? rand(1.6, 3) : rand(2.4, 5.2)) / aw), t: f(rand(2.2, 4.6)) + "s",
                d: "-" + f(rand(0, 4.6)) + "s", c: c
              }) + '"></i>';
          }
          out += "</span>";
          break;
        case "twinkle":
          (fx.points || []).forEach(function (pt, j) {
            out += '<i class="fx-star" style="left:' + pct(pt[0]) + ";top:" + pct(pt[1]) + ";" + vars({
              s: f(pt[2] * 100), t: f(rand(2.4, 3.8)) + "s", d: "-" + f(j * .7 + rand(0, .6)) + "s", c: c
            }) + '"></i>';
          });
          break;
        case "glow":
          out += '<i class="fx-glow" style="left:' + pct(fx.x) + ";top:" + pct(fx.y) + ";" + vars({
            s: f(fx.r * 200), c: c
          }) + '"></i>';
          break;
        case "birds":
          out += areaOpen(a);
          for (k = 0; k < n; k++) {
            out += '<i class="fx-bird" style="top:' + f(rand(8, 80)) + "%;" + vars({
              s: f(rand(2.2, 3.4) / aw), t: f(rand(16, 26)) + "s", d: "-" + f(k * 6 + rand(0, 4)) + "s",
              f: f(rand(.32, .5)) + "s", bob: f(rand(4, 12))
            }) + '"><svg viewBox="0 0 20 8" focusable="false"><path d="M1 6.5 Q5.5 0 10 5.2 Q14.5 0 19 6.5"/></svg></i>';
          }
          out += "</span>";
          break;
        case "fireflies":
          out += areaOpen(a);
          for (k = 0; k < n; k++) {
            out += '<i class="fx-ff" style="left:' + f(rand(3, 97)) + "%;top:" + f(rand(8, 92)) + "%;" + vars({
              s: f(rand(1.2, 2.2) / aw), t: f(rand(6, 11)) + "s", d: "-" + f(rand(0, 10)) + "s",
              b: f(rand(1.8, 3.6)) + "s", dx: f(rand(-6, 6) / aw), dy: f(rand(-12, 8))
            }) + '"></i>';
          }
          out += "</span>";
          break;
        case "butterflies":
          out += areaOpen(a);
          for (k = 0; k < n; k++) {
            var pts = {};
            for (var q = 0; q < 5; q++) { pts["x" + q] = f(rand(5, 90)); pts["y" + q] = f(rand(5, 85)); }
            pts.s = f(rand(3.6, 4.8) / aw);
            pts.t = f(rand(14, 20)) + "s";
            pts.d = "-" + f(k * 5 + rand(0, 3)) + "s";
            pts.c = BUTTERFLY[(k + seed(p.id)) % BUTTERFLY.length];
            out += '<i class="fx-bfly" style="' + vars(pts) + '"><svg viewBox="-20 -17 40 30" focusable="false">' +
              '<g class="bfly-wing bfly-wing--l"><path d="M0 -1 C-6 -14 -18 -14 -16 -3 C-17 4 -8 8 0 1 Z"/></g>' +
              '<g class="bfly-wing bfly-wing--r"><path d="M0 -1 C6 -14 18 -14 16 -3 C17 4 8 8 0 1 Z"/></g>' +
              '<ellipse cx="0" cy="0" rx="1.6" ry="6" class="fx-bfly__body"/></svg></i>';
          }
          out += "</span>";
          break;
        case "ripples":
          (fx.points || []).forEach(function (pt, j) {
            for (var m = 0; m < 2; m++) {
              out += '<i class="fx-ripple" style="left:' + pct(pt[0]) + ";top:" + pct(pt[1]) + ";" + vars({
                s: f(pt[2] * 100), d: "-" + f(j * 1.1 + m * 1.8) + "s"
              }) + '"></i>';
            }
          });
          break;
        case "mist":
          out += areaOpen(a);
          for (k = 0; k < n; k++) {
            out += '<i class="fx-mist" style="top:' + f(rand(10, 75)) + "%;" + vars({
              t: f(rand(22, 34)) + "s", d: "-" + f(k * 9 + rand(0, 6)) + "s"
            }) + '"></i>';
          }
          out += "</span>";
          break;
        case "blink":
          // eyelids, the colour of the fur round the eyes, closing from the top
          (fx.eyes || []).forEach(function (e) {
            out += '<i class="fx-lid" style="left:' + pct(e[0] - e[2] / 2) + ";top:" + pct(e[1] - e[3] / 2) +
              ";width:" + pct(e[2]) + ";height:" + pct(e[3]) + ";" + vars({ c: fx.color || "#5f5642" }) + '"></i>';
          });
          break;
      }
    });
    return out ? '<span class="fx" aria-hidden="true">' + out + "</span>" : "";
  }

  /* ------------------------------ the frames ------------------------------ */

  // pencil doodles for the empty canvases (100 x 100, drawn to fit)
  var DOODLES = [
    '<path d="M18 70 q16 -18 30 -6 q14 -14 34 -2"/><circle cx="66" cy="34" r="9"/><path d="M66 18 v-6 M80 34 h6 M76 24 l4 -4 M56 24 l-4 -4"/>',
    '<path d="M50 80 V46"/><path d="M50 60 q-12 -2 -16 -12 q12 0 16 12 M50 66 q12 -2 16 -12 q-12 0 -16 12"/><circle cx="50" cy="36" r="5"/><path d="M50 26 q6 -6 0 -12 q-6 6 0 12 M60 36 q6 6 12 0 q-6 -6 -12 0 M40 36 q-6 6 -12 0 q6 -6 12 0 M50 46 q6 6 0 12"/>',
    '<path d="M60 22 a24 24 0 1 0 14 40 a20 20 0 1 1 -14 -40 z"/><path d="M28 30 l2 5 l5 1 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -1 z M74 70 l1.5 3.5 l3.5 1 l-3.5 1.5 l-1.5 3.5 l-1.5 -3.5 l-3.5 -1.5 l3.5 -1 z"/>',
    '<path d="M24 56 q26 -36 52 0 z"/><path d="M42 56 v20 h16 v-20"/><circle cx="38" cy="46" r="3"/><circle cx="58" cy="42" r="4"/><circle cx="52" cy="52" r="2"/>',
    '<path d="M50 74 c-20 -14 -30 -24 -30 -36 a12 12 0 0 1 30 -6 a12 12 0 0 1 30 6 c0 12 -10 22 -30 36 z"/>',
    '<path d="M30 74 q-4 -30 20 -48 q24 18 20 48 z"/><path d="M50 26 v48 M50 44 l-10 -8 M50 56 l10 -8 M50 64 l-12 -8"/>'
  ];
  function blankHTML(p) {
    return '<span class="blank"><svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      DOODLES[p.i % DOODLES.length] + "</svg></span>";
  }
  // the picture and its animation, in one box (on the wall and full screen)
  function artHTML(p, onWall) {
    if (p.blank) return '<span class="art">' + blankHTML(p) + "</span>";
    return '<span class="art"><img src="' + esc(p.src) + '" alt="' + esc(p.alt) + '"' +
      (onWall ? ' loading="lazy"' : "") + ' decoding="async">' + (reduce ? "" : fxHTML(p)) + "</span>";
  }
  function pieceLabel(p) {
    if (p.blank) return "An empty frame, waiting for one of Serena's pieces. See it full screen.";
    return [p.title, p.year, p.medium].filter(Boolean).join(", ") + ". " + p.alt + " See it full screen.";
  }

  hang.innerHTML = pieces.map(function (p) {
    return '<li class="piece" data-i="' + p.i + '" style="--tilt:' + p.tilt + 'deg">' +
      '<div class="piece__hang">' +
        '<svg class="piece__cord" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
          '<path d="M50 0 L14 100 M50 0 L86 100"/></svg>' +
        '<span class="piece__hook" aria-hidden="true"></span>' +
        '<button type="button" class="frame frame--' + p.frame + '" aria-label="' + esc(pieceLabel(p)) + '">' +
          '<span class="frame__mat">' + artHTML(p, true) + "</span></button>" +
      "</div>" +
      '<p class="piece__label tape-' + (seed(p.id + "t") % 5) + '" aria-hidden="true" style="--lt:' +
        ((seed(p.id + "l") % 9 - 4) * .5) + "deg;--tt:" + (seed(p.id + "w") % 11 - 5) + 'deg">' +
        (p.title ? '<span class="piece__title">' + esc(p.title) + "</span>" : "") +
        '<span class="piece__meta">' + esc(metaLine(p)) + "</span></p>" +
    "</li>";
  }).join("");

  var els = Array.prototype.slice.call(hang.querySelectorAll(".piece"));

  /* ------------------------------ hanging them ------------------------------ */
  /* Rows of one height that fill the wall's width, like a hung wall. Pieces
     are added to a row until it would come out shorter than the target
     height; then it's closed with or without the last piece, whichever is
     nearer the target. The last row isn't stretched; it's centred. */

  var shownFilter = "";
  function shown(p) { return !shownFilter || p.collection === shownFilter; }

  function num(cs, name) { return parseFloat(cs.getPropertyValue(name)) || 0; }

  var lastW = 0;
  function layout() {
    var W = hang.clientWidth;
    if (!W) return;
    lastW = W;
    var cs = getComputedStyle(hang);
    var v = {
      gap: num(cs, "--gap"), target: num(cs, "--row-h"), fs: num(cs, "--fs") || 1,
      rail: num(cs, "--rail"), cord: num(cs, "--cord"), label: num(cs, "--label"), rowGap: num(cs, "--row-gap")
    };
    // each frame's own width on each side: moulding, lip and mat (plain
    // numbers in style.css, scaled by --fs), plus its 1.5px outline
    pieces.forEach(function (p) {
      var fcs = getComputedStyle(els[p.i].querySelector(".frame"));
      p.pad = 1.5 + (num(fcs, "--mw") + num(fcs, "--lw") + num(fcs, "--matw")) * v.fs;
    });
    var maxH = v.target * 1.6;
    function hFor(row) {
      var sum = 0, pads = 0;
      row.forEach(function (p) { sum += p.ratio; pads += 2 * p.pad; });
      return (W - (row.length - 1) * v.gap - pads) / sum;
    }

    var list = pieces.filter(shown), rows = [], row = [];
    list.forEach(function (p) {
      row.push(p);
      var h = hFor(row);
      if (h > v.target) return;                         // still room in this row
      if (row.length > 1) {
        var without = row.slice(0, -1), hWithout = hFor(without);
        if (hWithout <= maxH && Math.abs(hWithout - v.target) < Math.abs(h - v.target)) {
          rows.push({ items: without, h: hWithout });
          row = [p];
          h = hFor(row);
          if (h > v.target) return;
        }
      }
      rows.push({ items: row, h: h });
      row = [];
    });
    if (row.length) rows.push({ items: row, h: Math.min(v.target, hFor(row)), last: true });

    // place them; a row's height is the tallest frame in it
    var rails = [], y = 0;
    rows.forEach(function (r) {
      var widths = r.items.map(function (p) { return p.ratio * r.h + 2 * p.pad; });
      var total = widths.reduce(function (a, b) { return a + b; }, 0) + (r.items.length - 1) * v.gap;
      var x = Math.max(0, (W - total) / 2), tallest = 0;
      r.items.forEach(function (p, k) {
        var el = els[p.i], fh = r.h + 2 * p.pad;
        tallest = Math.max(tallest, fh);
        el.hidden = false;
        el.style.left = x.toFixed(1) + "px";
        el.style.top = y.toFixed(1) + "px";
        el.style.width = widths[k].toFixed(1) + "px";
        el.style.setProperty("--fh", fh.toFixed(1) + "px");
        x += widths[k] + v.gap;
      });
      // frames of different widths hang from one rail, so the slimmer ones
      // hang a little lower, centred on the row
      r.items.forEach(function (p) {
        els[p.i].style.setProperty("--drop", ((tallest - (r.h + 2 * p.pad)) / 2).toFixed(1) + "px");
      });
      rails.push(y);
      y += v.rail + v.cord + tallest + v.label + v.rowGap;
    });
    pieces.forEach(function (p) { if (!shown(p)) els[p.i].hidden = true; });
    hang.style.height = Math.max(0, y - v.rowGap).toFixed(1) + "px";

    // a picture rail along the top of each row
    Array.prototype.forEach.call(hang.querySelectorAll(".rail"), function (r) { r.remove(); });
    rails.forEach(function (top) {
      var rail = document.createElement("li");
      rail.className = "rail";
      rail.setAttribute("aria-hidden", "true");
      rail.style.top = top.toFixed(1) + "px";
      hang.insertBefore(rail, hang.firstChild);
    });
  }

  layout();
  if (window.ResizeObserver) {
    new ResizeObserver(function () { if (hang.clientWidth !== lastW) layout(); }).observe(hang);
  } else {
    window.addEventListener("resize", layout);
  }
  // fonts can change the wall's width a touch on first load
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  /* ------------------------------ by collection ------------------------------ */

  var filters = $("[data-filters]");
  var groups = [];
  pieces.forEach(function (p) { if (p.collection && groups.indexOf(p.collection) < 0) groups.push(p.collection); });
  if (filters && groups.length > 1) {
    filters.innerHTML = [""].concat(groups).map(function (g) {
      return '<button type="button" data-group="' + esc(g) + '" aria-pressed="' + (g ? "false" : "true") + '">' +
        esc(g || "everything") + "</button>";
    }).join("");
    filters.hidden = false;
    filters.addEventListener("click", function (e) {
      var b = e.target.closest("[data-group]");
      if (!b) return;
      shownFilter = b.getAttribute("data-group");
      Array.prototype.forEach.call(filters.children, function (c) {
        c.setAttribute("aria-pressed", c === b ? "true" : "false");
      });
      layout();
    });
  }

  /* ------------------------------ full screen ------------------------------ */

  var viewer = $("[data-viewer]");
  if (!viewer || !viewer.showModal) return;
  var veil = $("[data-veil]", viewer), stage = $("[data-stage]", viewer), box = $("[data-art]", viewer);
  var caption = $("[data-caption]", viewer), live = $("[data-live]", viewer);
  var fsBtn = $("[data-fullscreen]", viewer);
  var list = [], at = -1, busy = false;

  function current() { return list[at]; }
  function wallArt(p) { return els[p.i] && els[p.i].querySelector(".art"); }

  // the biggest box of the piece's shape that fits the stage
  function fit(p) {
    var sw = stage.clientWidth, sh = stage.clientHeight;
    var w = sw, h = sw / p.ratio;
    if (h > sh) { h = sh; w = sh * p.ratio; }
    // a small picture isn't blown up past a little over its real size
    if (p.px >= 200 && w > p.px * 1.25) { w = p.px * 1.25; h = w / p.ratio; }
    box.style.width = Math.round(w) + "px";
    box.style.height = Math.round(h) + "px";
  }

  function fill(p) {
    unzoom();
    box.innerHTML = artHTML(p, false);
    box.classList.toggle("is-picture", !p.blank);
    if (!p.blank && p.full && p.full !== p.src) {     // the sharp one, once it's here
      var big = new Image();
      big.onload = function () {
        var img = box.querySelector("img");
        if (img && current() === p) img.src = p.full;
      };
      big.src = p.full;
    }
    if (p.tone) viewer.style.setProperty("--tone", p.tone);
    else viewer.style.removeProperty("--tone");
    $("[data-count]", viewer).textContent = (at + 1) + " of " + list.length;
    var title = $("[data-title]", viewer);
    title.textContent = p.title;
    title.hidden = !p.title;
    var meta = p.blank ? "Serena's art is on its way" : [p.year, p.medium, p.size].filter(Boolean).join(" · ");
    $("[data-meta]", viewer).textContent = meta;
    // the viewer is named by the title, or by the date and medium without one
    viewer.setAttribute("aria-labelledby", p.title ? "viewer-title" : "viewer-meta");
    var note = $("[data-note]", viewer);
    note.textContent = p.note;
    note.hidden = !p.note;
    var hint = $("[data-hint]", viewer);
    if (hint) hint.hidden = p.blank;
    live.textContent = (at + 1) + " of " + list.length + ": " + (p.title || meta) + (p.alt ? ". " + p.alt : "");
    fit(p);
    // have the neighbours ready
    [-1, 1].forEach(function (d) {
      var n = list[(at + d + list.length) % list.length];
      if (n && n.full && !n.blank) { var im = new Image(); im.src = n.full; }
    });
  }

  function anim(el, frames, opts) {
    if (reduce || !el.animate) return Promise.resolve();
    var a = el.animate(frames, opts);
    return a.finished.then(function () { a.cancel(); }, function () {});
  }

  // from a picture on the wall to the full-screen box (or back again)
  function flipFrom(p) {
    var from = wallArt(p);
    if (!from) return null;
    var a = from.getBoundingClientRect(), b = box.getBoundingClientRect();
    if (!a.width || !b.width || a.bottom < 0 || a.top > innerHeight) return null;
    return "translate(" + (a.left - b.left).toFixed(1) + "px," + (a.top - b.top).toFixed(1) + "px) scale(" +
      (a.width / b.width).toFixed(4) + ")";
  }

  function open(p, fromLink) {
    list = pieces.filter(shown);
    if (list.indexOf(p) < 0) list = pieces.slice();
    at = list.indexOf(p);
    viewer.classList.toggle("is-single", list.length < 2);
    document.documentElement.style.overflow = "hidden";
    viewer.showModal();
    fill(p);
    if (history.pushState) {
      if (fromLink) history.replaceState(null, "", "#" + p.id);
      else history.pushState({ viewer: true }, "", "#" + p.id);
    }
    var from = fromLink ? null : flipFrom(p);
    var ease = "cubic-bezier(.2,.7,.2,1)";
    anim(veil, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: "ease-out" });
    anim(caption, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }],
      { duration: 360, delay: 140, easing: "ease-out", fill: "backwards" });
    if (from) {
      box.style.transformOrigin = "0 0";
      anim(box, [{ transform: from }, { transform: "none" }], { duration: 460, easing: ease });
    } else {
      anim(box, [{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 300, easing: ease });
    }
    var close = $("[data-close]", viewer);
    if (close) close.focus();
  }

  // close by any route: if opening it added a history entry, go back (that
  // closes it, via popstate), so Back and the close button agree
  function requestClose() {
    if (history.state && history.state.viewer) history.back();
    else finishClose();
  }
  function finishClose() {
    if (!viewer.open || busy) return;
    busy = true;
    unzoom();
    var p = current();
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    var to = p && flipFrom(p);
    var ease = "cubic-bezier(.4,0,.2,1)";
    var outs = [
      anim(veil, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: "ease-in", fill: "forwards" }),
      anim(caption, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" })
    ];
    if (to) {
      box.style.transformOrigin = "0 0";
      outs.push(anim(box, [{ transform: "none" }, { transform: to }], { duration: 380, easing: ease, fill: "forwards" }));
    } else {
      outs.push(anim(box, [{ opacity: 1 }, { opacity: 0, transform: "scale(.96)" }], { duration: 240, fill: "forwards" }));
    }
    Promise.all(outs).then(function () {
      viewer.close();
      document.documentElement.style.overflow = "";
      busy = false;
      var btn = p && els[p.i] && els[p.i].querySelector(".frame");
      if (btn) btn.focus({ preventScroll: true });
    });
  }

  function go(d) {
    if (list.length < 2 || busy) return;
    at = (at + d + list.length) % list.length;
    var p = current();
    if (history.replaceState) history.replaceState(history.state, "", "#" + p.id);
    fill(p);
    anim(box, [{ opacity: 0, transform: "translateX(" + (d * 28) + "px)" }, { opacity: 1, transform: "none" }],
      { duration: 260, easing: "ease-out" });
    anim(caption, [{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
  }

  // looking closer: a click zooms into the picture where you clicked, and
  // the view follows the mouse; another click (or the next piece) zooms out
  var zoomed = false, lastPointer = "mouse";
  function zoomAt(e) {
    var r = box.getBoundingClientRect();
    var x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    var y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    var inner = box.querySelector(".art");
    if (inner) inner.style.transformOrigin = (x * 100).toFixed(1) + "% " + (y * 100).toFixed(1) + "%";
  }
  function unzoom() {
    zoomed = false;
    box.classList.remove("is-zoomed");
  }
  box.addEventListener("pointerdown", function (e) { lastPointer = e.pointerType; });
  box.addEventListener("click", function (e) {
    if (lastPointer !== "mouse" || !box.classList.contains("is-picture") || busy) return;
    e.stopPropagation();
    zoomed = !zoomed;
    if (zoomed) zoomAt(e);
    box.classList.toggle("is-zoomed", zoomed);
  });
  box.addEventListener("mousemove", function (e) { if (zoomed) zoomAt(e); });

  hang.addEventListener("click", function (e) {
    var f = e.target.closest(".frame");
    if (!f) return;
    var li = f.closest(".piece");
    open(pieces[+li.getAttribute("data-i")], false);
  });

  viewer.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b && b.hasAttribute("data-go")) go(+b.getAttribute("data-go"));
    else if (b && b.hasAttribute("data-close")) requestClose();
    else if (b && b.hasAttribute("data-fullscreen")) toggleFullscreen();
    else if (!b && (e.target === veil || e.target === stage || e.target === viewer)) requestClose();
  });
  viewer.addEventListener("cancel", function (e) {
    e.preventDefault();
    if (zoomed) unzoom();
    else requestClose();
  });
  // if the browser closes it on its own (a second quick Esc can), tidy up
  viewer.addEventListener("close", function () {
    document.documentElement.style.overflow = "";
    if (history.state && history.state.viewer) history.back();
  });
  viewer.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  });
  window.addEventListener("popstate", function () {
    var id = location.hash.slice(1);
    var p = pieces.filter(function (q) { return q.id === id; })[0];
    if (viewer.open && !p) finishClose();
    else if (!viewer.open && p) open(p, true);
  });
  window.addEventListener("resize", function () { if (viewer.open && current()) fit(current()); });

  // swipe: sideways for the next one, down to put it back
  var touch = null;
  stage.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" || busy || !e.isPrimary) { touch = null; return; }
    touch = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });
  stage.addEventListener("pointermove", function (e) {
    if (!touch || e.pointerId !== touch.id || reduce) return;
    var dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    box.style.transform = Math.abs(dx) > Math.abs(dy)
      ? "translateX(" + dx * 0.6 + "px)"
      : "translateY(" + Math.max(0, dy) * 0.6 + "px)";
  });
  function endTouch(e) {
    if (!touch || e.pointerId !== touch.id) return;
    var dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    touch = null;
    box.style.transform = "";
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (dy > 90 && dy > Math.abs(dx)) requestClose();
  }
  stage.addEventListener("pointerup", endTouch);
  stage.addEventListener("pointercancel", function (e) {
    if (touch && e.pointerId === touch.id) { touch = null; box.style.transform = ""; }
  });

  // filling the whole screen, where the browser allows it (not on iPhone)
  if (fsBtn && document.fullscreenEnabled && viewer.requestFullscreen) {
    fsBtn.hidden = false;
    document.addEventListener("fullscreenchange", function () {
      fsBtn.setAttribute("aria-pressed", document.fullscreenElement ? "true" : "false");
      fsBtn.setAttribute("aria-label", document.fullscreenElement ? "Leave full screen" : "Fill the whole screen");
      if (viewer.open && current()) setTimeout(function () { fit(current()); }, 60);
    });
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    else viewer.requestFullscreen().catch(function () {});
  }

  // art.html#<id> opens straight onto that piece
  var start = location.hash.slice(1);
  if (start) {
    var p0 = pieces.filter(function (q) { return q.id === start; })[0];
    if (p0) open(p0, true);
  }
})();
