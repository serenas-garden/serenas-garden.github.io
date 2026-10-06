/* Gemma follows you into the cottage's other rooms.
 *
 * Any page whose <body> has a `data-room` attribute is a room, and Gemma pads
 * in after you: in from the left edge of the screen (the way you came), over
 * to whatever the room has for her, and then she settles down for a nap.
 * Pages that aren't rooms (Travels, say) don't have `data-room`, so she stays
 * home in the cottage.
 *
 * A room tells her where things are with attributes on its floor:
 *   data-gemma-stage           the strip of floor she walks along. Its CSS
 *                              --gemma-feet is how far below its top her
 *                              feet touch the floor.
 *   data-gemma-nap="0.5"       where she naps, as a fraction of the way
 *                              across; data-gemma-nap-night for after dark
 *   [data-gemma-spot="bowl"]   optional: something to eat first. She stops
 *                              with her head over the point data-gemma-at
 *                              (a fraction across that element).
 *
 * Her look and her petting come from GemmaKit (gemma-kit.js). With reduced
 * motion she's simply already there, asleep in her nap spot.
 */
(function () {
  "use strict";

  if (!document.body.hasAttribute("data-room")) return;
  var stage = document.querySelector("[data-gemma-stage]");
  var kit = window.GemmaKit;
  if (!stage || !kit) return;

  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  stage.insertAdjacentHTML("beforeend", kit.button("Gemma the cat, who followed you in. Give her a pet!"));
  var cat = stage.querySelector(".gemma");
  var body = cat.querySelector(".gemma__body");
  var live = document.createElement("p");
  live.className = "visually-hidden";
  live.setAttribute("aria-live", "polite");
  stage.appendChild(live);
  kit.petting(cat, live);

  /* ------------------------------ where things are ------------------------------ */
  // x is in stage pixels from its left edge, to the middle of her

  function bowlX() {
    var bowl = stage.querySelector('[data-gemma-spot="bowl"]');
    if (!bowl) return null;
    var s = stage.getBoundingClientRect(), r = bowl.getBoundingClientRect();
    var at = parseFloat(bowl.getAttribute("data-gemma-at") || "0.5");
    // her head is about a third of her width ahead of her middle
    return r.left - s.left + r.width * at - cat.offsetWidth * 0.36;
  }
  function napX() {
    var night = document.documentElement.getAttribute("data-dark") === "true";
    var f = parseFloat((night && stage.getAttribute("data-gemma-nap-night")) ||
                       stage.getAttribute("data-gemma-nap") || "0.5");
    return stage.clientWidth * f;
  }
  function offscreenLeft() {
    // just past the left edge of the window, wherever the stage sits
    return -stage.getBoundingClientRect().left - cat.offsetWidth * 0.6;
  }

  /* --------------------------------- moving her --------------------------------- */

  var here = 0, parked = null;
  function tf(x) { return "translate(" + (x - cat.offsetWidth / 2).toFixed(1) + "px,0)"; }
  function place(x) { here = x; cat.style.transform = tf(x); }
  function pose(name) { cat.setAttribute("data-pose", name); }
  function face(dir) { body.classList.toggle("is-left", dir < 0); }
  function wait(ms) { return new Promise(function (done) { setTimeout(done, ms); }); }
  function between(a, b) { return a + Math.random() * (b - a); }
  function speed() { return Math.max(46, Math.min(78, stage.clientWidth / 12)); }

  function walkTo(x) {
    parked = null;
    face(x < here ? -1 : 1);
    pose("walk");
    var anim = cat.animate([{ transform: tf(here) }, { transform: tf(x) }],
                           { duration: Math.abs(x - here) / speed() * 1000, fill: "forwards" });
    return anim.finished.then(function () { place(x); anim.cancel(); });
  }
  function yawn() {
    cat.classList.add("is-yawning");
    return wait(1100).then(function () { cat.classList.remove("is-yawning"); });
  }
  async function settleDown() {
    pose("sit");
    face(1);  await wait(420);
    face(-1); await wait(420);
    face(1);  await wait(360);
    pose("sleep");
    parked = "nap";
  }

  /* ------------------------------ following you in ------------------------------ */

  async function visit() {
    place(offscreenLeft());
    pose("walk");
    face(1);
    await wait(700);                       // a moment behind you through the door

    var bx = bowlX();
    if (bx !== null) {
      await walkTo(bx);
      face(1);
      pose("eat");                         // a snack first, obviously
      parked = "bowl";
      await wait(between(4200, 5600));
      pose("sit");
      await wait(700);
      await yawn();
      await wait(between(900, 1500));
    } else {
      await walkTo(stage.clientWidth * 0.3);
      pose("sit");
      await wait(between(1800, 2600));
    }
    await walkTo(napX());
    await settleDown();

    // then a quiet life: long naps, the odd stretch and look around
    for (;;) {
      await wait(between(26000, 42000));
      pose("sit");
      parked = "nap";
      await wait(600);
      await yawn();
      face(-1); await wait(between(1400, 2400));
      face(1);  await wait(between(1000, 1800));
      pose("sleep");
    }
  }

  // keep her in her spot when the window changes size
  function keep() {
    if (parked === "nap") place(napX());
    else if (parked === "bowl" && bowlX() !== null) place(bowlX());
  }
  if (window.ResizeObserver) new ResizeObserver(keep).observe(stage);
  else window.addEventListener("resize", keep);

  if (reduce || !cat.animate) {
    place(napX());
    pose("sleep");
    parked = "nap";
  } else {
    visit();
  }
})();
