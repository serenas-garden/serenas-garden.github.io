/* The wallpaper sample fan on the home page, and hanging the new paper.
 *
 * Beside the light switch hangs a fan of sample cards, one per wallpaper (the
 * one on the walls in front). Click it and the sample book opens: a card for
 * each wallpaper, at its real size. Pick one and it's hung strip by strip
 * across the whole room, left to right: each strip of the new paper unrolls
 * down the wall from the ceiling, behind the furniture, with the roll of paper
 * travelling down its edge. Then it's on the walls of every room that shares
 * the cottage's wallpaper (wallpaper.js remembers it).
 *
 * With reduced motion the new wallpaper just appears.
 */
(function () {
  "use strict";

  var W = window.Wallpaper;
  var picker = document.querySelector("[data-wp-picker]");
  if (!W || !picker) return;

  var fan = picker.querySelector(".wp-fan");
  var fanCards = picker.querySelector("[data-wp-fan]");
  var label = picker.querySelector("[data-wp-label]");
  var book = picker.querySelector(".wp-book");
  var grid = picker.querySelector("[data-wp-grid]");
  var live = picker.querySelector("[data-wp-live]");
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var busy = false;

  function byId(id) {
    for (var i = 0; i < W.list.length; i++) if (W.list[i].id === id) return W.list[i];
    return W.list[0];
  }
  function guide(text) { if (window.Guide) window.Guide.say(text); }
  function guideRest() { if (window.Guide) window.Guide.rest(); }

  /* ------------------------------ the fan and the book ------------------------------ */

  var n = W.list.length;
  fanCards.innerHTML = W.list.map(function (w, i) {
    var a = (i - (n - 1) / 2) * (100 / (n - 1));         // spread over about 100 degrees
    return '<span class="wp-card" data-wp="' + w.id + '" style="--a:' + a.toFixed(1) + 'deg;--i:' + i + '"><i></i></span>';
  }).join("") + '<span class="wp-fan__rivet"></span>';

  grid.innerHTML = W.list.map(function (w) {
    return '<button type="button" class="wp-chip" data-pick="' + w.id + '" aria-pressed="false">' +
      '<span class="wp-chip__swatch" data-wp="' + w.id + '"><i></i></span>' +
      '<span class="wp-chip__name">' + w.name + '</span>' +
      '<span class="wp-chip__note">' + w.note + "</span>" +
      '<span class="wp-chip__on" aria-hidden="true">on the walls</span>' +
    "</button>";
  }).join("");

  function show(id) {
    var w = byId(id);
    label.textContent = "wallpaper: " + w.name;
    fan.setAttribute("aria-label", "Wallpaper: " + w.name + ". Open the sample book to pick another.");
    Array.prototype.forEach.call(fanCards.querySelectorAll(".wp-card"), function (c) {
      c.classList.toggle("is-up", c.getAttribute("data-wp") === id);
    });
    Array.prototype.forEach.call(grid.querySelectorAll(".wp-chip"), function (c) {
      c.setAttribute("aria-pressed", c.getAttribute("data-pick") === id ? "true" : "false");
    });
  }
  show(W.get());
  W.onchange = show;                       // e.g. changed in another tab
  picker.hidden = false;

  function open() {
    book.hidden = false;
    fan.setAttribute("aria-expanded", "true");
    var on = grid.querySelector('[aria-pressed="true"]') || grid.querySelector(".wp-chip");
    on.focus();
    document.addEventListener("pointerdown", outside, true);
  }
  function close(refocus) {
    if (book.hidden) return;
    book.hidden = true;
    fan.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", outside, true);
    if (refocus) fan.focus();
  }
  function outside(e) {
    if (!picker.contains(e.target)) close(false);
  }

  fan.addEventListener("click", function () {
    if (busy) return;
    if (book.hidden) open(); else close(true);
  });
  picker.querySelector("[data-wp-close]").addEventListener("click", function () { close(true); });
  picker.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !book.hidden) { e.preventDefault(); close(true); }
  });

  fan.addEventListener("mouseenter", function () {
    guide("the wallpaper samples! pick one and i'll hang it for you");
  });
  fan.addEventListener("mouseleave", guideRest);
  fan.addEventListener("focus", function () {
    guide("the wallpaper samples! pick one and i'll hang it for you");
  });
  fan.addEventListener("blur", guideRest);

  grid.addEventListener("click", function (e) {
    var chip = e.target.closest(".wp-chip");
    if (!chip || busy) return;
    var id = chip.getAttribute("data-pick");
    close(true);
    if (id === W.get()) return;
    hang(id);
  });

  /* ------------------------------ hanging it ------------------------------ */
  /* A layer just in front of the old wallpaper (and behind everything else),
     cut into vertical strips of the new one. Each strip's pattern is shifted
     by its own left edge, so the strips line up into one wallpaper, exactly
     where the real one will be. */

  function hang(id) {
    var w = byId(id);
    live.textContent = "Hanging the " + w.name + " wallpaper.";
    if (reduce || !document.body.animate) { done(); return; }

    busy = true;
    fan.classList.add("is-busy");
    guide("ooh, " + w.name + "! hanging it now…");

    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var count = Math.max(3, Math.round(vw / 150));
    var sw = vw / count;
    var layer = document.createElement("div");
    layer.className = "wp-hang";
    layer.setAttribute("data-wp", id);
    layer.setAttribute("aria-hidden", "true");
    var html = "";
    for (var k = 0; k < count; k++) {
      html += '<div class="wp-strip" style="left:' + (k * sw).toFixed(2) + "px;width:" + (sw + 0.6).toFixed(2) + 'px">' +
        '<div class="wp-strip__paper" style="--sx:' + (-k * sw).toFixed(2) + 'px"></div>' +
        '<div class="wp-strip__roll"></div></div>';
    }
    layer.innerHTML = html;
    document.body.appendChild(layer);

    var ease = "cubic-bezier(.45,.05,.35,1)";
    var each = Math.min(1500, 850 + vh * 0.5);            // a taller wall takes a little longer
    var stagger = Math.min(170, 1400 / count);
    var runs = [];
    Array.prototype.forEach.call(layer.children, function (strip, k) {
      var delay = k * stagger;
      var paper = strip.firstChild, roll = strip.lastChild;
      runs.push(paper.animate(
        [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)" }],
        { duration: each, delay: delay, easing: ease, fill: "both" }).finished);
      runs.push(roll.animate(
        [{ transform: "translateY(-11px)" }, { transform: "translateY(" + (vh - 11) + "px)" }],
        { duration: each, delay: delay, easing: ease, fill: "both" }).finished);
      runs.push(roll.animate(
        [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.9 }, { opacity: 0 }],
        { duration: each, delay: delay, fill: "both" }).finished);
    });

    Promise.all(runs).then(function () {
      done();
      // the real wallpaper is now the same as the strips: take them away
      requestAnimationFrame(function () {
        layer.remove();
        busy = false;
        fan.classList.remove("is-busy");
        guide("all done! fresh " + w.name + " wallpaper in every room");
        guideRest();
      });
    });

    function done() {
      W.set(id);
      live.textContent = "Now on the walls: " + w.name + ".";
    }
  }
})();
