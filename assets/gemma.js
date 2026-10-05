/* Gemma: Serena's seal bicolor ragdoll, living on the cottage floor.
 *
 * Her day, on a loop:
 *   nap in her bed → wake, sit up, yawn → hop out and stroll to the cat tree
 *   (sometimes stopping halfway to sit and look around) → climb it one level
 *   at a time → sit on the top perch like she owns the place → come back
 *   down → pad back to bed → circle → curl up and sleep again.
 *
 * Click or tap her to pet her: hearts and a "mrrp!" (asleep, she only stirs).
 *
 * Poses are drawn in index.html (<g class="g-walk|g-sit|g-sleep">) and picked
 * with data-pose on the button. Movement uses the Web Animations API on the
 * button's transform. Positions are measured from the bed and tree elements
 * every time, so she follows the layout at any screen size.
 *
 * With prefers-reduced-motion she stays asleep in her bed, and petting still
 * shows her reply (no floating hearts).
 */
(function () {
  "use strict";

  var stage = document.querySelector(".floor__stage");
  var cat = document.querySelector(".gemma");
  if (!stage || !cat) return;

  var body = cat.querySelector(".gemma__body");
  var bubble = cat.querySelector(".gemma__bubble");
  var live = document.getElementById("gemma-says");
  var bed = stage.querySelector(".cat-bed--back");
  var tree = stage.querySelector(".cat-tree");
  var reduceMotion = window.matchMedia &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------ geometry ------------------------------ */
  /* Everything is in stage pixels: x from the stage's left edge, y up from
     the floor line her feet stand on. */

  // tree levels, in the cat tree's own viewBox (130 × 240, ground at y=238)
  var TREE = { w: 130, h: 240, ground: 238 };
  var LEVELS = {
    condo: { x: 39, y: 170 },
    shelf: { x: 104, y: 98 },
    perch: { x: 53, y: 36 }
  };

  function box(el) {
    var s = stage.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    return { left: r.left - s.left, width: r.width, height: r.height };
  }

  function spots() {
    var b = box(bed), t = box(tree);
    var w = cat.offsetWidth;
    function level(l) {
      return {
        x: t.left + (l.x / TREE.w) * t.width,
        y: ((TREE.ground - l.y) / TREE.h) * t.height
      };
    }
    return {
      bed: { x: b.left + b.width / 2, y: b.height * (10 / 60) },
      besideBed: { x: b.left + b.width + w * 0.2, y: 0 },
      treeFoot: { x: t.left - w * 0.18, y: 0 },
      condo: level(LEVELS.condo),
      shelf: level(LEVELS.shelf),
      perch: level(LEVELS.perch)
    };
  }

  /* ------------------------------ moving her ----------------------------- */

  var here = { x: 0, y: 0 };
  var parkedAt = "bed";       // which named spot she's resting at, if any

  function transform(p) {
    return "translate(" + (p.x - cat.offsetWidth / 2).toFixed(1) + "px," + (-p.y).toFixed(1) + "px)";
  }

  function place(p) {
    here = p;
    cat.style.transform = transform(p);
  }

  function pose(name) { cat.setAttribute("data-pose", name); }
  function face(dir) { body.classList.toggle("is-left", dir < 0); }
  function wait(ms) { return new Promise(function (done) { setTimeout(done, ms); }); }
  function between(a, b) { return a + Math.random() * (b - a); }

  function animateTo(to, ms, frames) {
    var anim = cat.animate(frames || [
      { transform: transform(here) },
      { transform: transform(to) }
    ], { duration: ms, fill: "forwards" });
    return anim.finished.then(function () {
      place(to);
      anim.cancel();
    });
  }

  function speed() {
    // a ragdoll's unhurried amble, a little slower on small screens
    return Math.max(42, Math.min(72, stage.clientWidth / 13));
  }

  function walkTo(x) {
    var to = { x: x, y: 0 };
    face(x < here.x ? -1 : 1);
    pose("walk");
    parkedAt = null;
    return animateTo(to, Math.abs(x - here.x) / speed() * 1000);
  }

  function jumpTo(to, lift) {
    var from = here;
    var apex = {
      x: (from.x + to.x) / 2,
      y: Math.max(from.y, to.y) + (lift || 34)
    };
    face(to.x < from.x ? -1 : 1);
    pose("jump");
    parkedAt = null;
    return animateTo(to, 560, [
      { transform: transform(from), easing: "cubic-bezier(.2,.7,.4,1)" },
      { transform: transform(apex), offset: 0.48, easing: "cubic-bezier(.6,0,.8,.4)" },
      { transform: transform(to) }
    ]);
  }

  function sit(spot) {
    pose("sit");
    if (spot) parkedAt = spot;
  }

  function yawn() {
    cat.classList.add("is-yawning");
    return wait(1100).then(function () { cat.classList.remove("is-yawning"); });
  }

  /* -------------------------------- her day ------------------------------- */

  async function day() {
    var s;
    for (;;) {
      // nap
      pose("sleep");
      parkedAt = "bed";
      await wait(between(9000, 15000));

      // wake up slowly
      sit("bed");
      await wait(900);
      await yawn();
      await wait(between(900, 1600));

      // out of bed and over to the tree
      s = spots();
      await jumpTo(s.besideBed, 14);
      if (Math.random() < 0.45 && s.treeFoot.x - here.x > 160) {
        await walkTo(here.x + (s.treeFoot.x - here.x) * between(0.4, 0.6));
        sit();
        await wait(between(1600, 2600));      // something caught her eye
      }
      await walkTo(spots().treeFoot.x);
      sit();
      await wait(between(500, 900));          // sizing up the jump

      // up, one level at a time
      s = spots();
      await jumpTo(s.condo);  sit("condo"); await wait(between(600, 1100));
      await jumpTo(s.shelf);  sit("shelf"); await wait(between(600, 1100));
      await jumpTo(s.perch);  sit("perch");
      await wait(between(8000, 12000));       // queen of the castle

      // down again
      s = spots();
      await jumpTo(s.condo, 18); sit("condo"); await wait(between(500, 900));
      await jumpTo({ x: s.condo.x - cat.offsetWidth * 0.55, y: 0 }, 22);

      // home to bed: walk, step in, circle, settle
      s = spots();
      await walkTo(s.besideBed.x);
      await jumpTo(s.bed, 14);
      sit("bed");
      face(1);  await wait(380);
      face(-1); await wait(380);
      face(1);  await wait(320);
    }
  }

  /* ------------------------------- petting ------------------------------- */

  var SAYS = ["mrrp!", "prrrrr", "mew!", "♡ prrr ♡", "mrrrow?"];
  var bubbleTimer;

  function reply(text) {
    bubble.textContent = text;
    bubble.classList.add("is-on");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.classList.remove("is-on"); }, 1700);
  }

  function hearts() {
    for (var i = 0; i < 3; i++) {
      var h = document.createElement("span");
      h.className = "gemma__heart";
      h.textContent = "♥";
      h.style.setProperty("--hx", (30 + i * 20 + between(-6, 6)).toFixed(0) + "%");
      h.style.setProperty("--hd", between(-14, 14).toFixed(0) + "px");
      h.style.animationDelay = (i * 0.12) + "s";
      cat.appendChild(h);
      setTimeout(h.remove.bind(h), 1800);
    }
  }

  cat.addEventListener("click", function () {
    var asleep = cat.getAttribute("data-pose") === "sleep";
    if (asleep) {
      reply("mrrp… zzz");
      if (live) live.textContent = "Gemma stirs in her sleep.";
    } else {
      reply(SAYS[Math.floor(Math.random() * SAYS.length)]);
      if (live) live.textContent = "Gemma purrs.";
      if (!reduceMotion) hearts();
    }
  });

  var GUIDE_LINE = "that's gemma! my seal bicolor ragdoll, and the real owner of this cottage. give her a pet";
  function introduce() { if (window.Guide) window.Guide.say(GUIDE_LINE); }
  function rest() { if (window.Guide) window.Guide.rest(); }
  cat.addEventListener("mouseenter", introduce);
  cat.addEventListener("focus", introduce);
  cat.addEventListener("mouseleave", rest);
  cat.addEventListener("blur", rest);

  /* -------------------------------- start -------------------------------- */

  // keep her on her spot when the layout changes size (rotating a phone, the
  // door closing and the scrollbar appearing, …)
  function settle() {
    if (parkedAt) place(spots()[parkedAt]);
  }
  if (window.ResizeObserver) new ResizeObserver(settle).observe(stage);
  else window.addEventListener("resize", settle);

  place(spots().bed);
  pose("sleep");

  if (!reduceMotion && cat.animate) {
    setTimeout(day, 1200);
  }
})();
