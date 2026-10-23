/* The gallery (art.html). Everything it shows comes from art-data.js.
 *
 *  - the wall: every piece hangs whole, in its frame, on a picture rail.
 *    Rows are laid out to fit the screen (each row is one height, and the
 *    pieces in it fill the width, like a hung wall), so any number of
 *    pieces, of any shape, hang neatly. Each has a little label underneath.
 *  - full screen: tap a piece and it lifts off the wall to fill the screen,
 *    with its title, date, medium and Serena's note. Arrows, arrow keys or
 *    a swipe go to the next one; Esc, the close button, a tap on the dark or
 *    a swipe down puts it back. Where the browser allows it, a button fills
 *    the whole screen. art.html#<id> opens straight onto a piece, and Back
 *    closes it on phones.
 *  - empty frames: until the pictures arrive (`sample: true`), each frame
 *    holds a blank canvas with a pencil doodle, and it all says so.
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
  // a small steady number from a piece's id, so its tilt never changes
  function seed(str) {
    var h = 7;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 9973;
    return h;
  }

  var sample = !!DATA.sample;
  var pieces = (DATA.pieces || []).map(function (p, i) {
    var blank = !p.src;
    return {
      i: i,
      id: String(p.id || "piece-" + (i + 1)),
      title: p.title || (blank ? "Empty frame" : "Untitled"),
      year: p.year || "",
      medium: p.medium || "",
      size: p.size || "",
      note: p.note || "",
      alt: p.alt || "",
      src: p.src || "",
      full: p.full || p.src || "",
      ratio: (p.w > 0 && p.h > 0) ? p.w / p.h : 1,
      px: p.w > 0 ? p.w : 0,
      frame: FRAMES.indexOf(p.frame) > -1 ? p.frame : FRAMES[i % FRAMES.length],
      collection: p.collection || "",
      blank: blank,
      tilt: ((seed(String(p.id || i)) % 15) - 7) / 10
    };
  });

  /* ------------------------------ the words ------------------------------ */

  function metaLine(p) {
    if (p.blank) return "art coming soon";
    return [p.year, p.medium].filter(Boolean).join(" · ");
  }

  var plaque = $("[data-plaque]");
  if (plaque && sample) plaque.textContent = pieces.length + " frames, waiting for Serena's art";

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
  function pieceLabel(p) {
    if (p.blank) return "An empty frame, waiting for one of Serena's pieces. See it full screen.";
    return p.title + (p.year ? ", " + p.year : "") + ". See it full screen.";
  }

  hang.innerHTML = pieces.map(function (p) {
    return '<li class="piece" data-i="' + p.i + '" style="--tilt:' + p.tilt + 'deg">' +
      '<div class="piece__hang">' +
        '<svg class="piece__cord" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
          '<path d="M50 0 L14 100 M50 0 L86 100"/></svg>' +
        '<span class="piece__hook" aria-hidden="true"></span>' +
        '<button type="button" class="frame frame--' + p.frame + '" aria-label="' + esc(pieceLabel(p)) + '">' +
          '<span class="frame__mat">' +
            (p.blank ? blankHTML(p)
              : '<img src="' + esc(p.src) + '" alt="' + esc(p.alt) + '" loading="lazy" decoding="async">') +
          "</span></button>" +
      "</div>" +
      '<p class="piece__label" aria-hidden="true"><span class="piece__title">' + esc(p.title) + "</span>" +
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
      // a frame adds its moulding, its mat and their two outlines (1.5px + 1px) on each side
      pad: num(cs, "--pad-mould") + num(cs, "--pad-mat") + 2.5, gap: num(cs, "--gap"), target: num(cs, "--row-h"),
      rail: num(cs, "--rail"), cord: num(cs, "--cord"), label: num(cs, "--label"), rowGap: num(cs, "--row-gap")
    };
    var maxH = v.target * 1.6;
    function hFor(n, sum) { return (W - (n - 1) * v.gap - n * 2 * v.pad) / sum; }

    var list = pieces.filter(shown), rows = [], row = [], sum = 0;
    list.forEach(function (p) {
      row.push(p); sum += p.ratio;
      var h = hFor(row.length, sum);
      if (h > v.target) return;                         // still room in this row
      if (row.length > 1) {
        var hWithout = hFor(row.length - 1, sum - p.ratio);
        if (hWithout <= maxH && Math.abs(hWithout - v.target) < Math.abs(h - v.target)) {
          rows.push({ items: row.slice(0, -1), h: hWithout });
          row = [p]; sum = p.ratio;
          h = hFor(1, sum);
          if (h > v.target) return;
        }
      }
      rows.push({ items: row, h: h });
      row = []; sum = 0;
    });
    if (row.length) rows.push({ items: row, h: Math.min(v.target, hFor(row.length, sum)), last: true });

    // place them
    var rails = [], y = 0;
    rows.forEach(function (r) {
      var fh = r.h + 2 * v.pad;
      var widths = r.items.map(function (p) { return p.ratio * r.h + 2 * v.pad; });
      var total = widths.reduce(function (a, b) { return a + b; }, 0) + (r.items.length - 1) * v.gap;
      var x = Math.max(0, (W - total) / 2);
      r.items.forEach(function (p, k) {
        var el = els[p.i];
        el.hidden = false;
        el.style.left = x.toFixed(1) + "px";
        el.style.top = y.toFixed(1) + "px";
        el.style.width = widths[k].toFixed(1) + "px";
        el.style.setProperty("--fh", fh.toFixed(1) + "px");
        x += widths[k] + v.gap;
      });
      rails.push(y);
      y += v.rail + v.cord + fh + v.label + v.rowGap;
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
  var veil = $("[data-veil]", viewer), stage = $("[data-stage]", viewer), art = $("[data-art]", viewer);
  var caption = $("[data-caption]", viewer), live = $("[data-live]", viewer);
  var fsBtn = $("[data-fullscreen]", viewer);
  var list = [], at = -1, busy = false;

  function current() { return list[at]; }
  function frameOf(p) { return els[p.i] && els[p.i].querySelector(".frame__mat"); }

  // the biggest box of the piece's shape that fits the stage
  function fit(p) {
    var sw = stage.clientWidth, sh = stage.clientHeight;
    var w = sw, h = sw / p.ratio;
    if (h > sh) { h = sh; w = sh * p.ratio; }
    // a small picture isn't blown up past a little over its real size
    if (p.px >= 200 && w > p.px * 1.25) { w = p.px * 1.25; h = w / p.ratio; }
    art.style.width = Math.round(w) + "px";
    art.style.height = Math.round(h) + "px";
  }

  function fill(p) {
    if (p.blank) {
      art.innerHTML = blankHTML(p);
    } else {
      art.innerHTML = '<img src="' + esc(p.src) + '" alt="' + esc(p.alt) + '" decoding="async">';
      if (p.full && p.full !== p.src) {               // the sharp one, once it's here
        var big = new Image();
        big.onload = function () {
          var img = art.querySelector("img");
          if (img && current() === p) img.src = p.full;
        };
        big.src = p.full;
      }
    }
    $("[data-count]", viewer).textContent = (at + 1) + " of " + list.length;
    $("[data-title]", viewer).textContent = p.title;
    var meta = p.blank ? "Serena's art is on its way" : [p.year, p.medium, p.size].filter(Boolean).join(" · ");
    $("[data-meta]", viewer).textContent = meta;
    var note = $("[data-note]", viewer);
    note.textContent = p.note;
    note.hidden = !p.note;
    live.textContent = (at + 1) + " of " + list.length + ": " + p.title;
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

  // from a frame on the wall to the full-screen box (or back again)
  function flipFrom(p) {
    var mat = frameOf(p);
    if (!mat) return null;
    var a = mat.getBoundingClientRect(), b = art.getBoundingClientRect();
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
      art.style.transformOrigin = "0 0";
      anim(art, [{ transform: from }, { transform: "none" }], { duration: 460, easing: ease });
    } else {
      anim(art, [{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 300, easing: ease });
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
      art.style.transformOrigin = "0 0";
      outs.push(anim(art, [{ transform: "none" }, { transform: to }], { duration: 380, easing: ease, fill: "forwards" }));
    } else {
      outs.push(anim(art, [{ opacity: 1 }, { opacity: 0, transform: "scale(.96)" }], { duration: 240, fill: "forwards" }));
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
    anim(art, [{ opacity: 0, transform: "translateX(" + (d * 28) + "px)" }, { opacity: 1, transform: "none" }],
      { duration: 260, easing: "ease-out" });
    anim(caption, [{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
  }

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
  viewer.addEventListener("cancel", function (e) { e.preventDefault(); requestClose(); });
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
    if (e.pointerType === "mouse" || busy) return;
    touch = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });
  stage.addEventListener("pointermove", function (e) {
    if (!touch || e.pointerId !== touch.id || reduce) return;
    var dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    art.style.transform = Math.abs(dx) > Math.abs(dy)
      ? "translateX(" + dx * 0.6 + "px)"
      : "translateY(" + Math.max(0, dy) * 0.6 + "px)";
  });
  function endTouch(e) {
    if (!touch || e.pointerId !== touch.id) return;
    var dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    touch = null;
    art.style.transform = "";
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (dy > 90 && dy > Math.abs(dx)) requestClose();
  }
  stage.addEventListener("pointerup", endTouch);
  stage.addEventListener("pointercancel", function (e) {
    if (touch && e.pointerId === touch.id) { touch = null; art.style.transform = ""; }
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
