/* Gemma, out in the garden on the door screen.
 *
 * She plays in the meadow at the foot of the tree, between the rose bush and
 * the pond. By day a butterfly drifts in and settles on the roses: she spots
 * it, crouches, wiggles and pounces. It gets away (it always does), so she
 * sits, tilts her head to watch it go, and washes a paw as if she meant to
 * miss, then pads back to her spot. Now and then she naps in the grass.
 * After dark it's a firefly instead. In rain or snow nothing comes to play,
 * so she washes and naps under the tree. When you open the door she dashes in
 * ahead of you.
 *
 * Places are in door units: x from the middle of the door, y up from the
 * ground line the tree stands on (scene y 882). One unit is --ds pixels, the
 * same as a scene unit beside the door, measured from the door each time, so
 * she keeps her place and size at any screen size.
 *
 * Her drawing and petting come from GemmaKit (gemma-kit.js). With reduced
 * motion she just sits by the roses, and petting still works.
 */
(function () {
  "use strict";

  var intro = document.querySelector(".door-intro");
  var kit = window.GemmaKit;
  if (!intro || intro.hidden || !kit) return;           // no door this visit
  var inner = intro.querySelector(".door-intro__inner");
  var door = intro.querySelector(".door-btn");
  var doorArt = door && door.querySelector("svg");
  if (!inner || !doorArt) return;

  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  var HOME = { x: 292, y: 4 };       // her spot, between the roses and the pond
  var ROSE = { x: 212, y: 50 };      // the nearest rose on the bush, where the butterfly lands
  var POUNCE = { x: 268, y: 4 };     // where she lands, just clear of the bush (it's in front of her)
  var DOORWAY = { x: 12, y: 6 };     // the threshold
  var FROM = { x: 500, y: 270 };     // the butterfly comes in over the pond
  var AWAY = { x: -90, y: 400 };     // and escapes up over the tree

  var BFLY = '<svg viewBox="-20 -17 40 30" aria-hidden="true" focusable="false">' +
    '<g class="bfly-wing bfly-wing--l"><path d="M0 -1 C-6 -14 -18 -14 -16 -3 C-17 4 -8 8 0 1 Z" fill="#f0a24a" stroke="#3d2f27" stroke-width=".8"/><circle cx="-9" cy="-5" r="2.2" fill="#fff6d6"/></g>' +
    '<g class="bfly-wing bfly-wing--r"><path d="M0 -1 C6 -14 18 -14 16 -3 C17 4 8 8 0 1 Z" fill="#f0a24a" stroke="#3d2f27" stroke-width=".8"/><circle cx="9" cy="-5" r="2.2" fill="#fff6d6"/></g>' +
    '<ellipse cx="0" cy="0" rx="1.4" ry="5.6" fill="#3d2f27"/>' +
    '<path d="M0 -5 q-2 -5 -4 -6 M0 -5 q2 -5 4 -6" fill="none" stroke="#3d2f27" stroke-width=".7"/></svg>';

  // her layer goes between the two garden layers (by z-index), but after the
  // door in the page, so the door comes first when tabbing
  var layer = document.createElement("div");
  layer.className = "dg";
  layer.innerHTML = kit.button("Gemma the cat, out playing in the garden. Give her a pet!") +
    '<p class="visually-hidden" aria-live="polite"></p>';
  var air = document.createElement("div");
  air.className = "dg-air";
  air.setAttribute("aria-hidden", "true");
  air.innerHTML = '<div class="dg-toy dg-bfly">' + BFLY + "</div>" +
    '<div class="dg-toy dg-bug"><i></i></div>';
  inner.parentNode.insertBefore(air, inner.nextSibling);
  inner.parentNode.insertBefore(layer, inner.nextSibling);

  var cat = layer.querySelector(".gemma");
  var body = cat.querySelector(".gemma__body");
  var toys = { bfly: air.querySelector(".dg-bfly"), bug: air.querySelector(".dg-bug") };
  kit.petting(cat, layer.querySelector("[aria-live]"));

  /* ------------------------------- placing ------------------------------- */

  function unit() { return doorArt.getBoundingClientRect().width / 460; }   // --ds, in pixels
  function catTf(p) {
    var u = unit();
    return "translate(" + (p.x * u - cat.offsetWidth / 2).toFixed(1) + "px," + (-p.y * u).toFixed(1) + "px)";
  }
  function toyTf(el, p) {
    var u = unit();
    return "translate(" + (p.x * u - el.offsetWidth / 2).toFixed(1) + "px," +
      (-p.y * u + el.offsetHeight / 2).toFixed(1) + "px)";
  }

  var here = { x: HOME.x, y: HOME.y };
  var toyAt = null;                      // { el, p } while a toy is sitting still
  function place(p) { here = { x: p.x, y: p.y }; cat.style.transform = catTf(p); }
  function placeToy(el, p) { toyAt = { el: el, p: p }; el.style.transform = toyTf(el, p); }
  function pose(name) { cat.setAttribute("data-pose", name); }
  function face(dir) { body.classList.toggle("is-left", dir < 0); }
  function mood(name, on) { cat.classList.toggle(name, on); }

  if (window.ResizeObserver) new ResizeObserver(keep).observe(intro);
  else window.addEventListener("resize", keep);
  function keep() {
    if (stopped) return;
    cat.style.transform = catTf(here);
    if (toyAt) toyAt.el.style.transform = toyTf(toyAt.el, toyAt.p);
  }

  place(HOME);
  pose("sit");
  if (reduce || !cat.animate) return;    // still: she just sits by the roses

  /* ------------------------------- moving ------------------------------- */
  /* Once the door opens everything stops: waits never finish and cancelled
     animations never resolve, so whatever she was doing just ends there. */

  var stopped = false, running = [];
  function never() { return new Promise(function () {}); }
  function wait(ms) {
    return new Promise(function (done) { setTimeout(function () { if (!stopped) done(); }, ms); });
  }
  function between(a, b) { return a + Math.random() * (b - a); }
  function track(anim) {
    running.push(anim);
    return anim.finished.then(function () {
      running.splice(running.indexOf(anim), 1);
      return stopped ? never() : anim;
    }, never);
  }

  // her, from where she is to p, in a straight line or a hop `arc` units high
  function moveTo(p, ms, arc) {
    var from = here, frames = [], n = arc ? 14 : 1;
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      frames.push({ transform: catTf({
        x: from.x + (p.x - from.x) * t,
        y: from.y + (p.y - from.y) * t + (arc ? arc * 4 * t * (1 - t) : 0)
      }) });
    }
    return track(cat.animate(frames, { duration: ms, fill: "forwards" }))
      .then(function (anim) { place(p); anim.cancel(); });
  }
  function walkTo(p) {
    face(p.x < here.x ? -1 : 1);
    pose("walk");
    return moveTo(p, Math.abs(p.x - here.x) / 52 * 1000);
  }

  // a toy's fluttery flight from a to b: it wanders, then (if `land`) settles
  function fly(el, a, b, ms, wobble, land) {
    toyAt = null;
    var frames = [], n = 30, ph = Math.random() * 6;
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var e = t * t * (3 - 2 * t);
      var w = wobble * (land ? 1 - t : 0.4 + t);
      frames.push({
        opacity: land ? Math.min(1, t * 8) : Math.min(1, (1 - t) * 4),
        transform: toyTf(el, {
          x: a.x + (b.x - a.x) * e + Math.sin(t * 9 + ph) * w,
          y: a.y + (b.y - a.y) * e + Math.sin(t * 17 + ph) * w * 0.55
        })
      });
    }
    el.classList.add("is-on");
    return track(el.animate(frames, { duration: ms, fill: "forwards" })).then(function (anim) {
      if (land) placeToy(el, b);
      else el.classList.remove("is-on");
      anim.cancel();
    });
  }

  async function groom(ms) {
    pose("sit");
    mood("is-grooming", true);
    await wait(ms);
    mood("is-grooming", false);
  }
  async function yawn() {
    mood("is-yawning", true);
    await wait(1100);
    mood("is-yawning", false);
  }
  async function nap() {
    face(1);
    pose("sleep");                      // curled up in the grass
    await wait(between(9000, 15000));
    pose("sit");
    await wait(500);
    await yawn();
    await wait(between(800, 1400));
  }

  // butterflies by day, a firefly after dark, nothing at all in rain or snow
  function toyNow() {
    var root = document.documentElement;
    var w = root.getAttribute("data-weather");
    if (w === "rain" || w === "storm" || w === "snow") return null;
    return root.getAttribute("data-dark") === "true" ? toys.bug : toys.bfly;
  }

  async function chase(toy) {
    var arrive = fly(toy, FROM, ROSE, 3400, 28, true);
    await wait(1700);
    face(-1);                           // she's seen it
    pose("stand");
    mood("is-curious", true);
    await arrive;
    toy.classList.add("is-resting");
    await wait(600);
    mood("is-curious", false);
    pose("crouch");
    await wait(900);
    mood("is-wiggling", true);          // ...wiggle wiggle...
    await wait(between(1000, 1700));
    mood("is-wiggling", false);
    pose("jump");                       // pounce!
    var leap = moveTo(POUNCE, 500, 24);
    await wait(90);
    toy.classList.remove("is-resting");
    var away = fly(toy, ROSE, AWAY, 2800, 34, false);
    await leap;
    pose("stand");
    await wait(180);
    pose("sit");
    await wait(220);
    mood("is-curious", true);           // watching it go
    await wait(1600);
    mood("is-curious", false);
    await away;
    await wait(400);
    await groom(between(2600, 3400));   // she meant to miss
    await wait(between(900, 1500));
    await walkTo(HOME);
    face(1);
    pose("sit");
  }

  async function life() {
    await wait(800);
    for (;;) {
      var toy = toyNow();
      if (toy) {
        await chase(toy);
      } else {
        await wait(between(2500, 4000));
        await groom(between(2600, 3400));
      }
      await wait(between(3500, 6000));
      if (!toy || Math.random() < 0.4) await nap();
      else await wait(between(1500, 3000));
    }
  }
  life();

  /* --------------------------- in through the door --------------------------- */

  door.addEventListener("click", function () {
    if (stopped) return;
    var now = new DOMMatrixReadOnly(getComputedStyle(cat).transform);
    stopped = true;
    layer.classList.add("is-dashing");    // out in front, for the run to the door
    running.slice().forEach(function (a) { if (a.effect && a.effect.target === cat) a.cancel(); });
    cat.style.transform = now.toString();
    ["is-curious", "is-grooming", "is-wiggling", "is-yawning"].forEach(function (c) { mood(c, false); });
    mood("is-running", true);
    var u = unit();
    var x = (now.m41 + cat.offsetWidth / 2) / u;
    var to = catTf(DOORWAY);
    face(DOORWAY.x < x ? -1 : 1);
    pose("walk");
    var dash = cat.animate([{ transform: now.toString() }, { transform: to }],
      { duration: Math.max(260, Math.abs(x - DOORWAY.x) / 480 * 1000), easing: "ease-in", fill: "forwards" });
    dash.finished.then(function () {
      cat.animate([{ transform: to, opacity: 1 }, { transform: to + " scale(.82)", opacity: 0 }],
        { duration: 240, fill: "forwards" });
    }, function () {});
  });
})();
