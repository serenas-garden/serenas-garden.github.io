/* The birthday surprise, in the cottage (index.html).
 *
 * Only for a birthday visit (birthday.js decides; the words are in
 * birthday-data.js). Nothing here runs on an ordinary day.
 *
 *  - the door: wrapped like a present, a rose ribbon round it, a bow, and a
 *    gift tag. The first tap unties it: the bow springs loose, the ribbon
 *    slides off, a burst of fairy confetti, and the door swings open.
 *  - inside: a "happy birthday" ribbon hung under the sign, balloons
 *    drifting up the wall behind the furniture, the date circled on the
 *    calendar (style.css), and Gemma in a party hat (gemma-kit.js).
 *  - a cake on the rug with five lit candles: tap to blow them out and make
 *    a wish, then the card opens: a folded card from Rex, in his words.
 *    Tapping the cake again opens the card again.
 *
 * What's happened is remembered for the day (birthday.js), so coming back to
 * the cottage later doesn't wrap the door up again or relight the candles.
 * With reduced motion everything still happens, just without the movement.
 */
(function () {
  "use strict";

  var B = window.Birthday, D = window.BIRTHDAY;
  if (!B || !B.on || !D) return;

  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var tap = window.matchMedia && matchMedia("(hover: none)").matches ? "tap" : "click";
  var animated = !reduce && !!document.body.animate;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function play(el, frames, opts) {
    if (!animated || !el) return Promise.resolve();
    return el.animate(frames, opts).finished.catch(function () {});
  }
  function wait(ms) { return new Promise(function (done) { setTimeout(done, ms); }); }
  function guide(text) { if (window.Guide) window.Guide.say(text); }
  function guideRest() { if (window.Guide) window.Guide.rest(); }

  /* ------------------------------- confetti ------------------------------- */
  /* A burst of paper bits, petals, hearts and stars from a point on screen,
     thrown up and out and falling back under gravity. */

  var COLORS = ["#e48a9a", "#f2c94c", "#8fb86a", "#b9a8e0", "#9cc4e2", "#f4b183", "#fbf5e6", "#d9485b"];
  var BITS = ["strip", "petal", "dot", "strip", "heart", "petal", "star", "dot"];
  var sky = null;

  function burst(x, y, n, spread) {
    if (!animated) return;
    if (!sky) {
      sky = document.createElement("div");
      sky.className = "bday-confetti";
      sky.setAttribute("aria-hidden", "true");
      document.body.appendChild(sky);
    }
    for (var i = 0; i < n; i++) {
      var bit = document.createElement("i");
      var kind = BITS[i % BITS.length];
      bit.className = "bday-bit bday-bit--" + kind;
      bit.style.setProperty("--c", COLORS[(i * 5 + (i >> 2)) % COLORS.length]);
      if (kind === "heart") bit.textContent = "♥";
      if (kind === "star") bit.textContent = "✦";
      bit.style.left = x.toFixed(0) + "px";
      bit.style.top = y.toFixed(0) + "px";
      sky.appendChild(bit);

      var ang = (-90 + (Math.random() * 2 - 1) * (spread || 70)) * Math.PI / 180;
      var v = 260 + Math.random() * 360, vx = Math.cos(ang) * v, vy = Math.sin(ang) * v;
      var T = 1.5 + Math.random() * 1.1, spin = (Math.random() * 2 - 1) * 900, ph = Math.random() * 6;
      var frames = [];
      for (var k = 0; k <= 14; k++) {
        var t = T * k / 14;
        var dx = vx * t * (1 - t / (3 * T)) + Math.sin(t * 5 + ph) * 14;  // air slows them sideways
        var dy = vy * t + 520 * t * t;
        frames.push({
          transform: "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px) rotate(" + (spin * t / T).toFixed(0) + "deg)",
          opacity: k > 10 ? (14 - k) / 4 : 1
        });
      }
      bit.animate(frames, { duration: T * 1000, easing: "linear", fill: "forwards" })
        .finished.then(bit.remove.bind(bit), bit.remove.bind(bit));
    }
  }
  function burstFrom(el, n, spread) {
    var r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, n, spread);
  }

  /* ------------------------------ the wrapped door ------------------------------ */
  /* Drawn into the door's own SVG (door units, the door is x 38..162, y 50..280),
     so it scales with the door: the ribbon bands just over the door panel,
     under the ivy, and the bow and tag on top of everything. */

  var intro = document.querySelector(".door-intro");
  var door = intro && intro.querySelector(".door-btn");
  var art = door && door.querySelector("svg");

  var RIBBON = "#e48a9a", RIBBON_HI = "#f6c2ca", RIBBON_LO = "#c8677a", INK = "#3d2f27";

  function band(x, y, w, h, vertical) {
    var hi = vertical
      ? '<rect x="' + (x + 4) + '" y="' + y + '" width="3" height="' + h + '" fill="' + RIBBON_HI + '"/>'
      : '<rect x="' + x + '" y="' + (y + 4) + '" width="' + w + '" height="3" fill="' + RIBBON_HI + '"/>';
    var edges = vertical
      ? '<path d="M' + x + " " + y + " V" + (y + h) + " M" + (x + w) + " " + y + " V" + (y + h) + '"/>'
      : '<path d="M' + x + " " + y + " H" + (x + w) + " M" + x + " " + (y + h) + " H" + (x + w) + '"/>';
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + RIBBON + '"/>' + hi +
      '<g stroke="' + INK + '" stroke-width="1.3" opacity=".55">' + edges + "</g>";
  }

  var BANDS =
    '<g class="gift gift--bands" aria-hidden="true">' +
      '<clipPath id="gift-door"><path d="M38 280 V112 a62 62 0 0 1 124 0 V280 Z"/></clipPath>' +
      '<g clip-path="url(#gift-door)">' +
        '<g class="gift__band gift__band--v">' + band(90, 40, 20, 250, true) + "</g>" +
        '<g class="gift__band gift__band--l">' + band(30, 150, 70, 20, false) + "</g>" +
        '<g class="gift__band gift__band--r">' + band(100, 150, 70, 20, false) + "</g>" +
      "</g>" +
    "</g>";

  var BOW =
    '<g class="gift gift--bow" aria-hidden="true">' +
      '<g class="gift__bow" stroke="' + INK + '" stroke-width="1.4" stroke-linejoin="round">' +
        // the two tails, notched at the ends
        '<path d="M95 164 L79 204 L86.5 201 L90 208 L104 166 Z" fill="' + RIBBON + '"/>' +
        '<path d="M105 164 L121 204 L113.5 201 L110 208 L96 166 Z" fill="' + RIBBON + '"/>' +
        // the loops, with their insides in shade
        '<path d="M99 158 C86 141 63 140 63 155 C63 171 86 172 99 162 Z" fill="' + RIBBON + '"/>' +
        '<path d="M101 158 C114 141 137 140 137 155 C137 171 114 172 101 162 Z" fill="' + RIBBON + '"/>' +
        '<path d="M97 159 C89 151 76 149 72 156 C80 160 90 161 97 161 Z" fill="' + RIBBON_LO + '" stroke="none"/>' +
        '<path d="M103 159 C111 151 124 149 128 156 C120 160 110 161 103 161 Z" fill="' + RIBBON_LO + '" stroke="none"/>' +
        '<path d="M69 150 C74 145 82 145 89 149 M131 150 C126 145 118 145 111 149" fill="none" stroke="' + RIBBON_HI + '" stroke-width="2" stroke-linecap="round"/>' +
        '<rect x="93.5" y="151.5" width="13" height="17" rx="4.5" fill="' + RIBBON + '"/>' +
        '<path d="M97 155 v10" stroke="' + RIBBON_HI + '" stroke-width="2" stroke-linecap="round"/>' +
      "</g>" +
      '<g class="gift__tag">' +
        '<path d="M103 166 C107 180 114 189 122 189.7" fill="none" stroke="' + INK + '" stroke-width="1.1"/>' +
        '<g transform="translate(118 168) rotate(14) scale(1.3)">' +
          '<path d="M0 8 L8 0 H62 V31 H8 L0 23 Z" fill="#fbf5e6" stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round"/>' +
          '<circle cx="7" cy="15.5" r="2.4" fill="none" stroke="' + INK + '" stroke-width="1.1"/>' +
          '<text class="gift__to" x="36" y="14.5" text-anchor="middle"></text>' +
          '<text class="gift__from" x="36" y="26" text-anchor="middle"></text>' +
        "</g>" +
      "</g>" +
    "</g>";

  var wrapped = false, unwrapping = false;
  var hint = intro && intro.querySelector(".door-hint");
  var hintWas = hint ? hint.innerHTML : "";
  var doorLabel = door ? door.getAttribute("aria-label") : "";

  if (art && !intro.hidden && !B.state.unwrapped) {
    var panel = art.querySelector(".door-panel");
    panel.insertAdjacentHTML("afterend", BANDS);
    art.insertAdjacentHTML("beforeend", BOW);
    art.querySelector(".gift__to").textContent = D.tag && D.tag[0] || "for " + D.to;
    art.querySelector(".gift__from").textContent = D.tag && D.tag[1] || "love, " + D.from;
    if (hint) {
      hint.innerHTML = 'a present for you! <span class="door-hint--point">click</span>' +
        '<span class="door-hint--tap">tap</span> to unwrap it';
    }
    door.setAttribute("aria-label", "A present for you: unwrap it and come in");
    wrapped = true;

    // the first tap unwraps it; garden.js opens the door once it's off
    intro.addEventListener("click", function (e) {
      if (!wrapped || !e.target.closest(".door-btn")) return;
      e.stopPropagation();
      e.preventDefault();
      unwrap();
    }, true);
  }

  async function unwrap() {
    if (unwrapping) return;
    unwrapping = true;
    var bow = art.querySelector(".gift__bow"), tag = art.querySelector(".gift__tag");
    var ease = "cubic-bezier(.5,0,.85,.55)";
    if (animated) {
      play(bow, [
        { transform: "none", opacity: 1 },
        { transform: "scale(1.22)", opacity: 1, offset: 0.25 },
        { transform: "scale(.1) rotate(150deg)", opacity: 0 }
      ], { duration: 560, easing: "ease-in", fill: "forwards" });
      play(tag, [
        { transform: "none", opacity: 1 },
        { transform: "translate(10px, 110px) rotate(48deg)", opacity: 0 }
      ], { duration: 820, easing: ease, fill: "forwards" });
      play(art.querySelector(".gift__band--v"), [{ transform: "none" }, { transform: "translateY(260px)" }],
        { duration: 760, delay: 220, easing: ease, fill: "forwards" });
      play(art.querySelector(".gift__band--l"), [{ transform: "none" }, { transform: "translateX(-150px)" }],
        { duration: 680, delay: 200, easing: ease, fill: "forwards" });
      play(art.querySelector(".gift__band--r"), [{ transform: "none" }, { transform: "translateX(150px)" }],
        { duration: 680, delay: 200, easing: ease, fill: "forwards" });
      await wait(240);
      burstFrom(bow, 70, 75);
      await wait(1200);
    }
    Array.prototype.forEach.call(art.querySelectorAll(".gift"), function (g) { g.remove(); });
    if (hint) hint.innerHTML = hintWas;
    door.setAttribute("aria-label", doorLabel);
    wrapped = false;
    B.note("unwrapped", true);
    // and in you go (after this tap is done: a click made during one is ignored)
    setTimeout(function () { door.click(); }, 0);
  }

  /* ------------------------------- the room ------------------------------- */

  // a ribbon banner hung under the sign
  var sign = document.querySelector(".sign");
  if (sign) {
    sign.insertAdjacentHTML("beforeend",
      '<div class="bday-banner" aria-hidden="true"><span>happy birthday, ' + esc(D.to) + "!</span></div>");
  }

  // balloons drifting up the wall, behind the furniture
  var BALLOONS = ["#f2a7b8", "#f6d27a", "#a9c99a", "#b9a8e0", "#9cc4e2", "#f4b183", "#e48a9a", "#f6d27a", "#b9a8e0"];
  var air = document.createElement("div");
  air.className = "bday-balloons";
  air.setAttribute("aria-hidden", "true");
  air.innerHTML = BALLOONS.map(function (c, i) {
    var x = 3 + i * 11 + (i * 37 % 7);                 // spread across the wall, not quite evenly
    var size = 0.78 + (i * 29 % 10) / 20;
    return '<span class="bday-balloon" style="--x:' + x + "%;--y:" + (8 + (i * 41 % 60)) + "%;--s:" + size.toFixed(2) +
      ";--t:" + (22 + (i * 13 % 11)) + "s;--d:-" + (i * 3.7).toFixed(1) + "s;--sw:" + (3 + (i % 3) * 0.6).toFixed(1) + "s;--c:" + c + '">' +
      '<svg viewBox="0 0 50 124" focusable="false">' +
        '<path class="bday-balloon__string" d="M25 63 C19 76 31 88 24 100 C19 109 28 115 25 124"/>' +
        '<path d="M22 60 L25 66 L28 60 Z" fill="' + c + '" stroke="' + INK + '" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<path d="M25 2 C10 2 2 16 2 29 C2 45 14 58 25 61 C36 58 48 45 48 29 C48 16 40 2 25 2 Z" fill="' + c + '" stroke="' + INK + '" stroke-width="1.3"/>' +
        '<ellipse cx="15.5" cy="19" rx="4.5" ry="9" fill="#fff" opacity=".5" transform="rotate(24 15.5 19)"/>' +
      "</svg></span>";
  }).join("");
  document.body.appendChild(air);

  /* ------------------------------ the cake ------------------------------ */
  /* On a cake stand in the middle of the rug: two tiers, pink frosting
     dripping over the edges, strawberries, and five candles. */

  function drips(x0, x1, y, depths) {
    var w = (x1 - x0) / depths.length, d = "";
    for (var i = 0; i < depths.length; i++) {
      var xa = x1 - i * w, xb = xa - w;
      d += " Q" + (xa - w / 2).toFixed(1) + " " + (y + depths[i] * 2).toFixed(1) + " " + xb.toFixed(1) + " " + y;
    }
    return d;
  }
  function tier(x, y, w, h, depths) {
    var r = 7;
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="#fdf3e3" stroke="' + INK + '" stroke-width="1.5"/>' +
      '<path d="M' + x + " " + (y + r) + " Q" + x + " " + y + " " + (x + r) + " " + y + " H" + (x + w - r) + " Q" + (x + w) + " " + y + " " + (x + w) + " " + (y + r) +
        " V" + (y + 9) + drips(x, x + w, y + 9, depths) + ' Z" fill="#f2a7b8" stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round"/>';
  }
  var CANDLES = [48, 59, 70, 81, 92];
  var CAKE =
    '<svg class="bday-cake__art" viewBox="0 0 140 160" aria-hidden="true" focusable="false">' +
      '<ellipse cx="70" cy="153" rx="50" ry="5" fill="rgba(40,30,20,.16)"/>' +
      // the stand
      '<ellipse cx="70" cy="150" rx="21" ry="5" fill="#fbf7ee" stroke="' + INK + '" stroke-width="1.4"/>' +
      '<path d="M63 133 L65 148 H75 L77 133 Z" fill="#fbf7ee" stroke="' + INK + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<ellipse cx="70" cy="131" rx="58" ry="8" fill="#fbf7ee" stroke="' + INK + '" stroke-width="1.5"/>' +
      // the tiers
      tier(20, 92, 100, 38, [2, 4, 1.5, 5, 2, 3.5, 1.5, 4.5, 2.5]) +
      tier(36, 62, 68, 31, [3, 1.5, 4, 2, 3.5, 1.5]) +
      // sprinkles
      '<g stroke-width="2" stroke-linecap="round">' +
        '<path d="M30 116 l3 -1.5" stroke="#9cc4e2"/><path d="M48 121 l2.6 1.8" stroke="#f2c94c"/><path d="M66 114 l3 .8" stroke="#8fb86a"/>' +
        '<path d="M86 120 l2.4 -2" stroke="#b9a8e0"/><path d="M104 115 l3 1" stroke="#9cc4e2"/><path d="M44 84 l2.6 -1.4" stroke="#f2c94c"/>' +
        '<path d="M62 87 l2.8 1.2" stroke="#b9a8e0"/><path d="M80 83 l2.4 1.6" stroke="#8fb86a"/><path d="M95 87 l2.6 -1.2" stroke="#f4b183"/>' +
      "</g>" +
      // strawberries round the top tier
      '<g stroke="' + INK + '" stroke-width="1.1" stroke-linejoin="round">' +
        '<path d="M40 63 c-4 -3 -3 -8 1 -8 c2 0 3 1 3 2 c0 -1 1 -2 3 -2 c4 0 5 5 1 8 l-4 4 z" fill="#d9485b"/>' +
        '<path d="M96 63 c-4 -3 -3 -8 1 -8 c2 0 3 1 3 2 c0 -1 1 -2 3 -2 c4 0 5 5 1 8 l-4 4 z" fill="#d9485b"/>' +
      "</g>" +
      '<path d="M41 55 l3 2 l3 -2 M97 55 l3 2 l3 -2" fill="none" stroke="#5f8f45" stroke-width="1.6" stroke-linecap="round"/>' +
      // candles, their flames, and the smoke when they're blown out
      CANDLES.map(function (x, i) {
        var top = 44 + (i % 2) * 3;
        return '<g class="bday-candle" style="--i:' + i + '">' +
          '<rect x="' + (x - 2.5) + '" y="' + top + '" width="5" height="' + (63 - top) + '" rx="1.2" fill="#fbf7ee" stroke="' + INK + '" stroke-width="1"/>' +
          '<path d="M' + (x - 2.5) + " " + (top + 5) + " l5 -3 M" + (x - 2.5) + " " + (top + 11) + " l5 -3 M" + (x - 2.5) + " " + (top + 17) + ' l5 -3" stroke="#e48a9a" stroke-width="1.6"/>' +
          '<path d="M' + x + " " + top + ' v-3" stroke="' + INK + '" stroke-width="1"/>' +
          '<g class="bday-flame" style="transform-origin:' + x + "px " + (top - 3) + 'px">' +
            '<circle cx="' + x + '" cy="' + (top - 9) + '" r="8" class="bday-flame__glow"/>' +
            '<path d="M' + x + " " + (top - 17) + " C" + (x + 5) + " " + (top - 10) + " " + (x + 4) + " " + (top - 4) + " " + x + " " + (top - 3) +
              " C" + (x - 4) + " " + (top - 4) + " " + (x - 5) + " " + (top - 10) + " " + x + " " + (top - 17) + ' Z" fill="#f6c24a"/>' +
            '<path d="M' + x + " " + (top - 11) + " C" + (x + 2) + " " + (top - 8) + " " + (x + 2) + " " + (top - 5) + " " + x + " " + (top - 4.5) +
              " C" + (x - 2) + " " + (top - 5) + " " + (x - 2) + " " + (top - 8) + " " + x + " " + (top - 11) + ' Z" fill="#f08a3c"/>' +
          "</g>" +
          '<path class="bday-smoke" d="M' + x + " " + (top - 4) + " c-3 -5 3 -8 0 -13 c-3 -5 3 -8 0 -13" + '"/>' +
        "</g>";
      }).join("") +
    "</svg>";

  var stage = document.querySelector(".floor__stage");
  var cake = null;
  if (stage) {
    stage.insertAdjacentHTML("beforeend", '<button class="bday-cake" type="button">' + CAKE +
      '<span class="bday-cake__wish" aria-hidden="true"></span></button>');
    cake = stage.querySelector(".bday-cake");
    if (B.state.wished) cake.classList.add("is-out");
    labelCake();
  }
  function labelCake() {
    cake.setAttribute("aria-label", B.state.wished
      ? "Your birthday cake. Open your birthday card."
      : "Your birthday cake, with five candles lit. Blow them out and make a wish!");
  }

  // a little bubble over the cake, so it's right there on a phone too
  function wishSay(text) {
    var w = cake.querySelector(".bday-cake__wish");
    w.textContent = text;
    w.classList.toggle("is-on", !!text);
  }

  var blowing = false;
  async function blowOut() {
    blowing = true;
    guide("make a wish…");
    wishSay("make a wish…");
    if (animated) {
      await wait(900);
      var candles = cake.querySelectorAll(".bday-candle");
      for (var i = 0; i < candles.length; i++) {
        candles[i].classList.add("is-out");
        await wait(140);
      }
      await wait(260);
      var r = cake.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height * 0.3, 60, 80);
    }
    cake.classList.add("is-out");
    B.note("wished", true);
    labelCake();
    guide("yay!! i hope your wish comes true, serena ✨");
    wishSay("✨ yay! ✨");
    setHello();
    blowing = false;
    await wait(animated ? 1300 : 0);
    openCard();
    wishSay("");
  }

  /* ------------------------------ the card ------------------------------ */

  var COVER =
    '<svg viewBox="0 0 200 150" aria-hidden="true" focusable="false">' +
      '<g stroke="' + INK + '" stroke-width="1.4" stroke-linejoin="round">' +
        // a little bunch of balloons
        '<path d="M100 132 C96 112 70 98 62 72 M100 132 C100 108 100 92 100 64 M100 132 C104 112 130 98 138 72" fill="none" stroke-width="1"/>' +
        '<path d="M62 22 C48 22 42 34 42 44 C42 58 53 69 62 72 C71 69 82 58 82 44 C82 34 76 22 62 22 Z" fill="#f2a7b8"/>' +
        '<path d="M138 22 C124 22 118 34 118 44 C118 58 129 69 138 72 C147 69 158 58 158 44 C158 34 152 22 138 22 Z" fill="#9cc4e2"/>' +
        '<path d="M100 10 C85 10 78 23 78 34 C78 49 90 61 100 64 C110 61 122 49 122 34 C122 23 115 10 100 10 Z" fill="#f6d27a"/>' +
      "</g>" +
      '<g fill="#fff" opacity=".55"><ellipse cx="53" cy="36" rx="3.5" ry="7" transform="rotate(24 53 36)"/>' +
        '<ellipse cx="129" cy="36" rx="3.5" ry="7" transform="rotate(24 129 36)"/><ellipse cx="91" cy="24" rx="3.5" ry="7" transform="rotate(24 91 24)"/></g>' +
      '<path d="M92 128 l8 6 l8 -6 l-4 10 h-8 z" fill="#e48a9a" stroke="' + INK + '" stroke-width="1.2" stroke-linejoin="round"/>' +
    "</svg>";

  var card = document.createElement("dialog");
  card.className = "bday-card";
  card.setAttribute("aria-labelledby", "bday-card-title");
  var lines = (D.message || []).slice();
  var first = lines.shift() || "Happy birthday, " + D.to + "!";
  card.innerHTML =
    '<div class="bday-card__card">' +
      '<div class="bday-card__inside">' +
        '<h2 class="bday-card__hi" id="bday-card-title">' + esc(first) + "</h2>" +
        lines.map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") +
        '<p class="bday-card__from">' + esc(D.signoff || "love,") + " <b>" + esc(D.from) + "</b></p>" +
        '<button type="button" class="bday-card__close" data-close-card>close the card</button>' +
      "</div>" +
      '<div class="bday-card__cover" aria-hidden="true">' + COVER +
        '<p class="bday-card__title">' + esc(D.cover || "Happy Birthday") + "</p>" +
        '<p class="bday-card__for">for ' + esc(D.to) + "</p>" +
      "</div>" +
    "</div>";
  document.body.appendChild(card);

  function openCard() {
    if (card.open) return;
    if (card.showModal) card.showModal(); else card.setAttribute("open", "");
    var close = card.querySelector("[data-close-card]");
    if (close) close.focus({ preventScroll: true });
  }
  function closeCard() {
    if (card.close) card.close(); else card.removeAttribute("open");
  }
  card.addEventListener("click", function (e) {
    if (e.target === card || e.target.closest("[data-close-card]")) closeCard();
  });
  card.addEventListener("close", function () {
    if (cake) cake.focus({ preventScroll: true });
    guideRest();
  });

  if (cake) {
    cake.addEventListener("click", function () {
      if (blowing) return;
      if (!cake.classList.contains("is-out")) blowOut();
      else openCard();
    });
    cake.addEventListener("mouseenter", function () {
      if (!blowing) guide(cake.classList.contains("is-out") ? "your birthday card is right here" : "blow out the candles and make a wish!");
    });
    cake.addEventListener("mouseleave", function () { if (!blowing) guideRest(); });
  }

  /* ------------------------------ the guide ------------------------------ */

  function setHello() {
    if (!window.Guide || !window.Guide.hello) return;
    window.Guide.hello(B.state.wished
      ? "happy birthday, serena!! 🎉 " + tap + " the cake to read your card again"
      : "happy birthday, serena!! 🎂 there's a cake on the floor for you. " + tap + " it to make a wish");
  }
  setHello();
})();
