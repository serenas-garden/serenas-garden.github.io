/* The travels page (travels.html): the tally, the globe and the flat map on
 * its scroll (both globe.js), the
 * postcard for whichever place is picked, the passport of countries, the far
 * corners, and the tour. Everything is built from travels-data.js, so adding
 * a place there is the only edit a new trip needs.
 *
 * A place can be linked to directly: travels.html#kyoto opens on Kyoto.
 */
(function () {
  "use strict";

  var T = window.TRAVELS;
  if (!T) return;

  var places = T.places, countries = T.countries;
  var STAMPS = window.TRAVEL_STAMPS || {};
  var reduceMotion = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var D2R = Math.PI / 180;

  var byId = {};
  places.forEach(function (p, i) { p.index = i; byId[p.id] = p; });

  // countries in the order she first reaches them on the tour, and their continents
  var order = [], continents = [];
  places.forEach(function (p) {
    if (order.indexOf(p.country) < 0) order.push(p.country);
    var c = countries[p.country].continent;
    if (continents.indexOf(c) < 0) continents.push(c);
  });

  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen",
    "nineteen", "twenty"];
  function say(n) {
    if (n < 21) return WORDS[n];
    var tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
    return n < 100 ? tens[Math.floor(n / 10)] + (n % 10 ? "-" + WORDS[n % 10] : "") : String(n);
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ------------------------------ time and sky ------------------------------ */

  function fmt(p, o) {
    try {
      o.timeZone = p.tz;
      return new Intl.DateTimeFormat("en-US", o).format(new Date());
    } catch (e) { return ""; }
  }
  function timeThere(p) { return fmt(p, { hour: "numeric", minute: "2-digit" }).toLowerCase(); }
  function dateThere(p) { return fmt(p, { month: "short", day: "numeric" }).toUpperCase(); }

  // the sun's altitude over a place right now, in degrees (null without sky.js)
  function sunAlt(p) {
    var o = null;
    try { o = window.Sky && window.Sky.overhead && window.Sky.overhead(new Date()); } catch (e) {}
    if (!o) return null;
    var a = p.lat * D2R, b = o.sun.lat * D2R, dl = (p.lon - o.sun.lon) * D2R;
    return Math.asin(Math.sin(a) * Math.sin(b) + Math.cos(a) * Math.cos(b) * Math.cos(dl)) / D2R;
  }
  function skyWords(alt) {
    if (alt === null) return "";
    if (alt > 6) return "the sun's up";
    if (alt > -0.833) return "golden hour";
    if (alt > -6) return "twilight";
    return "night";
  }
  function coords(p) {
    return Math.abs(p.lat).toFixed(2) + "° " + (p.lat >= 0 ? "N" : "S") + ", " +
      Math.abs(p.lon).toFixed(2) + "° " + (p.lon >= 0 ? "E" : "W");
  }

  var SUN_ICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.5v2.5M10 16v2.5M1.5 10H4M16 10h2.5M4 4l1.8 1.8M14.2 14.2L16 16M4 16l1.8-1.8M14.2 5.8L16 4" class="pc-k"/><circle cx="10" cy="10" r="4" class="pc-k pc-gold"/></svg>';
  var MOON_ICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13.5 3.2A7 7 0 1 0 16.8 13 5.6 5.6 0 0 1 13.5 3.2Z" class="pc-k pc-cream"/></svg>';

  /* --------------------------------- stamps --------------------------------- */

  // a stamp's perforated edge: a rectangle with half-round bites all the way round
  function perforated(w, h, r, pitch) {
    var d = "M0 0", nx = Math.round(w / pitch), ny = Math.round(h / pitch), sx = w / nx, sy = h / ny, i;
    for (i = 0; i < nx; i++) d += " L" + (i * sx + sx / 2 - r) + " 0 A" + r + " " + r + " 0 0 0 " + (i * sx + sx / 2 + r) + " 0";
    d += " L" + w + " 0";
    for (i = 0; i < ny; i++) d += " L" + w + " " + (i * sy + sy / 2 - r) + " A" + r + " " + r + " 0 0 0 " + w + " " + (i * sy + sy / 2 + r);
    d += " L" + w + " " + h;
    for (i = nx - 1; i >= 0; i--) d += " L" + (i * sx + sx / 2 + r) + " " + h + " A" + r + " " + r + " 0 0 0 " + (i * sx + sx / 2 - r) + " " + h;
    d += " L0 " + h;
    for (i = ny - 1; i >= 0; i--) d += " L0 " + (i * sy + sy / 2 + r) + " A" + r + " " + r + " 0 0 0 0 " + (i * sy + sy / 2 - r);
    return d + " Z";
  }
  var EDGE = perforated(72, 86, 2.3, 7.2);

  function stampSvg(key, caption, value) {
    var art = STAMPS[key] || STAMPS.toadstool || "";
    return '<svg class="stamp" viewBox="-2 -2 76 90" aria-hidden="true" focusable="false">' +
      '<path class="stamp__paper" d="' + EDGE + '"/>' +
      '<svg x="6" y="6" width="60" height="52" viewBox="0 0 60 52" class="stamp__art">' + art + "</svg>" +
      '<rect x="6" y="6" width="60" height="52" class="pc-k stamp__frame"/>' +
      '<text class="stamp__value" x="10" y="16">' + esc(value) + "</text>" +
      '<text class="stamp__caption" x="36" y="71">' + esc(caption) + "</text>" +
      '<text class="stamp__post" x="36" y="79.5">garden post</text>' +
      "</svg>";
  }

  // a round postmark: a ring of words with the date there in the middle
  function postmark(middle) {
    return '<svg class="postmark" viewBox="0 0 132 72" aria-hidden="true" focusable="false">' +
      '<defs><path id="pm-ring" d="M16.5 36 a19.5 19.5 0 1 1 39 0 a19.5 19.5 0 1 1 -39 0"/></defs>' +
      '<circle cx="36" cy="36" r="26" class="postmark__ink"/>' +
      '<circle cx="36" cy="36" r="16.5" class="postmark__ink postmark__thin"/>' +
      '<text class="postmark__ring"><textPath href="#pm-ring">\u00b7 serena\u2019s garden \u00b7 air mail</textPath></text>' +
      '<text class="postmark__mid" x="36" y="39.4">' + esc(middle) + "</text>" +
      '<path class="postmark__ink" d="M66 24 q8 -5 16 0 t16 0 t16 0 t14 0 M66 36 q8 -5 16 0 t16 0 t16 0 t14 0 M66 48 q8 -5 16 0 t16 0 t16 0 t14 0"/>' +
      "</svg>";
  }

  /* ------------------------------ globe and map ------------------------------ */
  /* Two views of the same places: the globe, and the flat map on its scroll
     (made the first time it's opened). atlas() is whichever is showing. */

  function makeView(el, projection) {
    if (!el || !window.Globe || !window.GLOBE_GEO) return null;
    return window.Globe(el, {
      geo: window.GLOBE_GEO,
      places: places,
      projection: projection,
      tint: order.map(function (k) { return countries[k]; })
        .filter(function (c) { return c.geo; })
        .map(function (c) { return { geo: c.geo, box: c.tintBox || null }; }),
      onPick: function (id) { stopTour(); show(id); },
      onMove: function () { stopTour(); }
    });
  }
  var globe = makeView(document.querySelector("[data-globe]"), "globe");
  var flatmap = null, mode = "globe";
  function atlas() { return mode === "map" ? flatmap : globe; }
  if (!globe) {
    var stage = document.querySelector(".desk-globe");
    if (stage) stage.classList.add("is-broken");
  }

  /* ---------------------------------- tally ---------------------------------- */

  var tally = document.querySelector("[data-tally]");
  if (tally) {
    [plural(places.length, "place", "places"), plural(order.length, "country", "countries"),
     plural(continents.length, "continent", "continents")].forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = t;
      tally.appendChild(li);
    });
  }

  /* -------------------------------- postcard -------------------------------- */

  var card = document.querySelector("[data-postcard]");
  var current = null, ticker = 0;

  function sunUpCount() {
    var up = 0, known = false;
    places.forEach(function (p) {
      var a = sunAlt(p);
      if (a !== null) { known = true; if (a > -0.833) up++; }
    });
    return known ? up : null;
  }

  function liveLine() {
    var up = sunUpCount();
    if (up === null) return "";
    if (up === places.length) return "Right now the sun is up over all " + say(up) + " of them.";
    if (up === 0) return "Right now it's night in every one of them, so all the toadstools are glowing.";
    return "Right now the sun is up over " + say(up) + " of them, and it's night for the rest. " +
      "The glowing toadstools are the ones in the dark.";
  }

  function renderIntro() {
    if (!card) return;
    var line = liveLine();
    var live = line ? '<p class="postcard__live">' + SUN_ICON + "<span>" + line + "</span></p>" : "";
    card.className = "postcard postcard--intro";
    card.innerHTML =
      stampSvg("toadstool", "the world", String(places.length)) +
      '<div class="postcard__body">' +
      '<p class="postcard__eyebrow">a postcard from</p>' +
      '<h2 class="postcard__name">Everywhere, so far</h2>' +
      '<p class="postcard__blurb">' + say(places.length).replace(/^./, function (c) { return c.toUpperCase(); }) +
      " places in " + say(order.length) + " countries, across " + say(continents.length) +
      " continents. Spin the globe or unroll the map, and tap a toadstool for a postcard from each one, or take the tour.</p>" +
      live +
      '<p class="postcard__actions"><button type="button" class="postcard__go" data-act="tour">take the tour</button></p>' +
      "</div>";
    pop();
  }

  function renderPlace(p) {
    if (!card) return;
    var c = countries[p.country], alt = sunAlt(p), words = skyWords(alt);
    var time = timeThere(p);
    var night = alt !== null && alt <= -0.833;
    var prev = places[(p.index - 1 + places.length) % places.length];
    var next = places[(p.index + 1) % places.length];
    card.className = "postcard postcard--place";
    card.innerHTML =
      stampSvg(p.stamp, c.name, String(p.index + 1)) +
      postmark(dateThere(p) || "\u2022") +
      '<div class="postcard__body">' +
      '<p class="postcard__eyebrow">greetings from</p>' +
      '<h2 class="postcard__name">' + esc(p.name) + "</h2>" +
      '<p class="postcard__where">' + esc(p.where) + "</p>" +
      '<p class="postcard__blurb">' + esc(p.blurb) + "</p>" +
      (p.note
        ? '<p class="postcard__note">' + esc(p.note) + "</p>"
        : '<p class="postcard__note postcard__note--soon">my note from here is coming soon!</p>') +
      '<dl class="postcard__facts">' +
      (time ? '<div><dt>there right now</dt><dd>' + (night ? MOON_ICON : SUN_ICON) +
        "<span>" + esc(time) + (words ? " · " + esc(words) : "") + "</span></dd></div>" : "") +
      '<div><dt>pinned at</dt><dd><span>' + coords(p) + "</span></dd></div>" +
      "</dl>" +
      '<nav class="postcard__nav" aria-label="More postcards">' +
      '<button type="button" data-go="' + prev.id + '" aria-label="Previous postcard: ' + esc(prev.name) + '">&larr;</button>' +
      '<span class="postcard__count">' + (p.index + 1) + " of " + places.length + "</span>" +
      '<button type="button" data-go="' + next.id + '" aria-label="Next postcard: ' + esc(next.name) + '">&rarr;</button>' +
      '<button type="button" class="postcard__close" data-act="home">back to the whole world</button>' +
      "</nav>" +
      "</div>";
    pop();
  }

  function pop() {
    if (reduceMotion || !card) return;
    card.classList.remove("is-new");
    void card.offsetWidth;                       // restart the little flip
    card.classList.add("is-new");
  }

  // keep "there right now" honest while a card is open
  function tick() {
    clearInterval(ticker);
    ticker = setInterval(function () {
      if (document.hidden || !card) return;
      var dd = card.querySelector(".postcard__facts dd span");
      if (current && dd) {
        var a = sunAlt(current), w = skyWords(a), t = timeThere(current);
        dd.textContent = t + (w ? " · " + w : "");
      }
    }, 30000);
  }

  if (card) {
    card.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-go")) { stopTour(); show(b.getAttribute("data-go")); }
      else if (b.getAttribute("data-act") === "home") { stopTour(); home(); }
      else if (b.getAttribute("data-act") === "tour") toggleTour();
    });
  }

  /* --------------------------------- choosing --------------------------------- */

  function show(id, then) {
    var p = byId[id];
    if (!p) return;
    current = p;
    renderPlace(p);
    tick();
    if (atlas()) atlas().focus(id, then);
    else if (then) then();
    setHash(id);
    markPassport(id);
  }

  // a country with several places: one card listing them, the globe framing them all
  function showCountry(key) {
    var c = countries[key];
    var here = places.filter(function (p) { return p.country === key; });
    current = null;
    clearInterval(ticker);
    if (card) {
      card.className = "postcard postcard--country";
      card.innerHTML =
        stampSvg(here[0].stamp, c.name, String(here.length)) +
        '<div class="postcard__body">' +
        '<p class="postcard__eyebrow">greetings from</p>' +
        '<h2 class="postcard__name">' + esc(c.name) + "</h2>" +
        '<p class="postcard__where">' + esc(c.continent) + "</p>" +
        '<p class="postcard__blurb">' + say(here.length).replace(/^./, function (x) { return x.toUpperCase(); }) +
        " places here so far. Tap one for its postcard.</p>" +
        '<ul class="postcard__list">' + here.map(function (p) {
          return '<li><button type="button" data-go="' + p.id + '">' + esc(p.name) + "</button></li>";
        }).join("") + "</ul>" +
        (c.favorite ? '<p class="postcard__note"><span class="postcard__fav">favorite spot</span> ' + esc(c.favorite) + "</p>" : "") +
        '<nav class="postcard__nav" aria-label="More postcards">' +
        '<button type="button" class="postcard__close" data-act="home">back to the whole world</button>' +
        "</nav></div>";
      pop();
    }
    if (atlas()) { atlas().clear(); atlas().fit(here.map(function (p) { return p.id; })); }
    setHash("");
    markPassport(null);
  }

  function home() {
    current = null;
    renderIntro();
    clearInterval(ticker);
    if (atlas()) atlas().reset();
    setHash("");
    markPassport(null);
  }

  function setHash(id) {
    try { history.replaceState(null, "", id ? "#" + id : location.pathname + location.search); } catch (e) {}
  }

  /* ---------------------------------- tour ---------------------------------- */

  var touring = false, tourTimer = 0;
  var DWELL = 5200;

  function tourButtons() {
    document.querySelectorAll('[data-act="tour"]').forEach(function (b) {
      b.textContent = touring ? "stop the tour" : "take the tour";
      b.setAttribute("aria-pressed", touring ? "true" : "false");
    });
  }
  function toggleTour() { if (touring) stopTour(); else startTour(); }
  // one full lap, west to east, starting just after the open postcard (or at the start)
  function startTour() {
    touring = true;
    tourButtons();
    step(current ? (current.index + 1) % places.length : 0, places.length);
  }
  function step(i, left) {
    if (!touring) return;
    show(places[i].id, function () {
      if (!touring) return;
      clearTimeout(tourTimer);
      tourTimer = setTimeout(function () {
        if (left > 1) step((i + 1) % places.length, left - 1);
        else stopTour();
      }, DWELL);
    });
  }
  function stopTour() {
    if (!touring) return;
    touring = false;
    clearTimeout(tourTimer);
    tourButtons();
  }

  /* ------------------------------ globe buttons ------------------------------ */

  var tools = document.querySelector(".globe-tools");
  var spinBtn = tools && tools.querySelector('[data-act="spin"]');
  if (tools) {
    tools.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || !atlas()) return;
      var act = b.getAttribute("data-act");
      if (act === "in") { stopTour(); atlas().zoomBy(1.8); }
      else if (act === "out") { stopTour(); atlas().zoomBy(1 / 1.8); }
      else if (act === "home") { stopTour(); home(); }
      else if (act === "tour") toggleTour();
      else if (act === "spin") {
        var on = globe.setSpin(!globe.spins());
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.textContent = on ? "spinning" : "spin";
      }
    });
  }

  /* ------------------------- the scroll: globe <-> map -------------------------
     To the map: the globe and postcard fade, a rolled-up scroll tied with a
     ribbon appears, the ribbon slips off, and the two rollers glide apart to
     unroll the map. Back to the globe: it rolls up, the ribbon ties itself
     again, and the globe comes back. Every animation is the Web Animations
     API with fill "both", cancelled at the end once the classes describe the
     same final state, so nothing is left fighting the stylesheet. */

  var voyage = document.querySelector(".voyage");
  var scrollEl = document.querySelector("[data-scroll]");
  var deskGlobe = document.querySelector(".desk-globe");
  var helpEl = document.querySelector("[data-help]");
  var switcher = document.querySelector(".view-switch");
  var switching = false;
  var HELP = {
    globe: "drag to spin \u00b7 pinch or ctrl\u00a0+\u00a0scroll to zoom \u00b7 tap a toadstool",
    map: "drag to look around \u00b7 pinch or ctrl\u00a0+\u00a0scroll to zoom \u00b7 tap a toadstool"
  };
  var animated = !reduceMotion && !!(document.body.animate);
  var running = [];

  function anim(el, frames, ms, easing, delay) {
    if (!animated || !el) return Promise.resolve();
    var a = el.animate(frames, { duration: ms, easing: easing || "ease", delay: delay || 0, fill: "both" });
    running.push(a);
    return a.finished.catch(function () {});
  }
  function settle() {                            // the classes now say it all
    running.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    running = [];
  }
  function part(sel) { return scrollEl ? scrollEl.querySelector(sel) : null; }
  /* How far each roller travels to meet the other in the middle. Rolled up,
     the paper rolls are FAT times as wide, and they should just touch at the
     centre of the sheet. Measured with offsets, which ignore transforms. */
  var FAT = 1.6;
  function setClosedDistance() {
    var sheet = part(".scroll__sheet"), roll = part(".scroll__roll--l"), paper = part(".scroll__paper");
    if (!sheet || !roll || !paper) return 0;
    var centre = sheet.offsetLeft + sheet.offsetWidth / 2;
    var rollCentre = roll.offsetLeft + roll.offsetWidth / 2;
    var d = Math.max(0, centre - rollCentre - paper.offsetWidth / 2 * FAT);
    scrollEl.style.setProperty("--close", d.toFixed(1) + "px");
    return d;
  }
  function markView(next) {
    if (!switcher) return;
    switcher.querySelectorAll("[data-view]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-view") === next ? "true" : "false");
    });
  }
  function syncTools() {
    if (helpEl) helpEl.textContent = HELP[mode];
    if (spinBtn) spinBtn.hidden = mode === "map" || !globe || !globe.canSpin;
  }
  // the newly shown view picks up where the other left off, without a flight
  function syncView(v) {
    if (!v) return;
    v.redraw();
    if (current) v.focus(current.id, null, true);
    else v.reset(true);
  }

  function unroll() {
    var body = part(".scroll__body"), d = setClosedDistance();
    var ease = "cubic-bezier(.6, .04, .22, 1)", ms = 1250;
    return anim(body, [{ opacity: 0, transform: "translateY(-14px) scale(.96)" }, { opacity: 1, transform: "none" }], 340, "cubic-bezier(.2, .8, .3, 1)")
      .then(function () {
        return Promise.all([
          anim(part(".scroll__bow"), [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-8px) scale(.5) rotate(-24deg)" }], 300, "ease-in"),
          anim(part(".scroll__band"), [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(22px) scaleX(.9)" }], 380, "ease-in", 90)
        ]);
      })
      .then(function () {
        scrollEl.classList.remove("is-closed");
        return Promise.all([
          anim(part(".scroll__sheet"), [{ clipPath: "inset(0 50% 0 50%)" }, { clipPath: "inset(0 0% 0 0%)" }], ms, ease),
          anim(part(".scroll__roll--l"), [{ transform: "translateX(" + d + "px)" }, { transform: "translateX(0)" }], ms, ease),
          anim(part(".scroll__roll--r"), [{ transform: "translateX(" + -d + "px)" }, { transform: "translateX(0)" }], ms, ease),
          // the paper rolls turn and slim down as the paper pays out
          anim(part(".scroll__roll--l .scroll__paper"), [{ transform: "scaleX(" + FAT + ")", backgroundPosition: "0 0, 0 0, 0 0" },
                                                          { transform: "scaleX(1)", backgroundPosition: "0 0, 66px 0, 0 0" }], ms, ease),
          anim(part(".scroll__roll--r .scroll__paper"), [{ transform: "scaleX(" + FAT + ")", backgroundPosition: "0 0, 0 0, 0 0" },
                                                          { transform: "scaleX(1)", backgroundPosition: "0 0, -66px 0, 0 0" }], ms, ease)
        ]);
      });
  }

  function rollUp() {
    var d = setClosedDistance();
    var ease = "cubic-bezier(.55, 0, .3, 1)", ms = 1000;
    return Promise.all([
      anim(part(".scroll__sheet"), [{ clipPath: "inset(0 0% 0 0%)" }, { clipPath: "inset(0 50% 0 50%)" }], ms, ease),
      anim(part(".scroll__roll--l"), [{ transform: "translateX(0)" }, { transform: "translateX(" + d + "px)" }], ms, ease),
      anim(part(".scroll__roll--r"), [{ transform: "translateX(0)" }, { transform: "translateX(" + -d + "px)" }], ms, ease),
      anim(part(".scroll__roll--l .scroll__paper"), [{ transform: "scaleX(1)", backgroundPosition: "0 0, 66px 0, 0 0" },
                                                      { transform: "scaleX(" + FAT + ")", backgroundPosition: "0 0, 0 0, 0 0" }], ms, ease),
      anim(part(".scroll__roll--r .scroll__paper"), [{ transform: "scaleX(1)", backgroundPosition: "0 0, -66px 0, 0 0" },
                                                      { transform: "scaleX(" + FAT + ")", backgroundPosition: "0 0, 0 0, 0 0" }], ms, ease)
    ]).then(function () {
      scrollEl.classList.add("is-closed");
      return Promise.all([
        anim(part(".scroll__band"), [{ opacity: 0, transform: "translateY(22px) scaleX(.9)" }, { opacity: 1, transform: "none" }], 300, "ease-out"),
        anim(part(".scroll__bow"), [{ opacity: 0, transform: "translateY(-8px) scale(.5) rotate(-24deg)" }, { opacity: 1, transform: "none" }], 320, "cubic-bezier(.3, 1.5, .5, 1)", 160)
      ]);
    }).then(function () {
      return anim(part(".scroll__body"), [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-14px) scale(.96)" }], 300, "ease-in", 120);
    });
  }

  function toMap() {
    return Promise.all([
      anim(deskGlobe, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.92) rotate(-6deg)" }], 340, "ease-in"),
      anim(card, [{ opacity: 1 }, { opacity: 0 }], 240, "ease-in")
    ]).then(function () {
      scrollEl.classList.add("is-closed");
      voyage.classList.add("is-map");
      mode = "map";
      if (!flatmap) flatmap = makeView(document.querySelector("[data-flatmap]"), "flat");
      syncView(flatmap);
      syncTools();
      if (!animated) { scrollEl.classList.remove("is-closed"); return; }
      return unroll().then(function () {
        return anim(card, [{ opacity: 0 }, { opacity: 1 }], 320, "ease-out");
      });
    });
  }

  function toGlobe() {
    return anim(card, [{ opacity: 1 }, { opacity: 0 }], 220, "ease-in")
      .then(function () { return animated ? rollUp() : null; })
      .then(function () {
        settle();
        voyage.classList.remove("is-map");
        scrollEl.classList.add("is-closed");
        mode = "globe";
        syncView(globe);
        syncTools();
        return Promise.all([
          anim(deskGlobe, [{ opacity: 0, transform: "scale(.92) rotate(6deg)" }, { opacity: 1, transform: "none" }], 420, "cubic-bezier(.2, .8, .3, 1)"),
          anim(card, [{ opacity: 0 }, { opacity: 1 }], 320, "ease-out", 120)
        ]);
      });
  }

  function setView(next) {
    if (next === mode || switching || !scrollEl || !voyage) return;
    if (next === "map" && !window.Path2D) return;
    stopTour();
    switching = true;
    voyage.classList.add("is-switching");
    markView(next);
    (next === "map" ? toMap() : toGlobe()).then(function () {
      settle();
      switching = false;
      voyage.classList.remove("is-switching");
    });
  }

  if (switcher && globe && window.Path2D) {
    switcher.hidden = false;
    switcher.addEventListener("click", function (e) {
      var b = e.target.closest("[data-view]");
      if (b) setView(b.getAttribute("data-view"));
    });
  }
  syncTools();

  /* -------------------------------- passport -------------------------------- */

  var INKS = ["#a8463f", "#3f5f86", "#4f6b40", "#6b5a9a", "#8a5a1e", "#a14a5f"];
  var SHAPES = ["visa--oval", "visa--rect", "visa--round", "visa--ticket", "visa--rect", "visa--oval"];
  var TILTS = [-3, 2.5, -1.5, 3.5, -2.5, 1.5, -4, 2];

  var stamps = document.querySelector("[data-stamps]");
  if (stamps) {
    order.forEach(function (key, i) {
      var c = countries[key];
      var here = places.filter(function (p) { return p.country === key; });
      var li = document.createElement("li");
      li.className = "visa " + SHAPES[i % SHAPES.length];
      li.style.setProperty("--stamp", INKS[i % INKS.length]);
      li.style.setProperty("--tilt", TILTS[i % TILTS.length] + "deg");
      li.innerHTML =
        '<h3 class="visa__country"><button type="button" data-fit="' + key + '">' + esc(c.name) + "</button></h3>" +
        '<p class="visa__meta">' + plural(here.length, "place", "places") + " · " + esc(c.continent) + "</p>" +
        '<ul class="visa__places">' + here.map(function (p) {
          return '<li><button type="button" data-place="' + p.id + '">' + esc(p.name) + "</button></li>";
        }).join("") + "</ul>" +
        (c.favorite ? '<p class="visa__fav"><span>favorite spot</span> ' + esc(c.favorite) + "</p>" : "");
      stamps.appendChild(li);
    });
    stamps.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      stopTour();
      if (b.hasAttribute("data-place")) {
        show(b.getAttribute("data-place"));
        bringGlobeIntoView();
      } else if (b.hasAttribute("data-fit")) {
        var key = b.getAttribute("data-fit");
        var ids = places.filter(function (p) { return p.country === key; }).map(function (p) { return p.id; });
        if (ids.length === 1) show(ids[0]);
        else showCountry(key);
        bringGlobeIntoView();
      }
    });
  }

  function markPassport(id) {
    if (!stamps) return;
    stamps.querySelectorAll("[data-place]").forEach(function (b) {
      if (b.getAttribute("data-place") === id) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
  }

  function bringGlobeIntoView() {
    var v = document.querySelector(".voyage");
    if (!v) return;
    var r = v.getBoundingClientRect();
    if (r.top < -40 || r.top > window.innerHeight * 0.4) {
      v.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }

  /* ------------------------------- far corners ------------------------------- */

  var corners = document.querySelector("[data-corners]");
  if (corners) {
    var most = function (cmp) { return places.reduce(function (a, b) { return cmp(b, a) ? b : a; }); };
    var north = most(function (a, b) { return a.lat > b.lat; });
    var south = most(function (a, b) { return a.lat < b.lat; });
    var east = most(function (a, b) { return a.lon > b.lon; });
    var west = most(function (a, b) { return a.lon < b.lon; });
    [["farthest north", north, Math.abs(north.lat).toFixed(1) + "° " + (north.lat >= 0 ? "N" : "S") +
        (north.lat > 66.5638 ? ", above the Arctic Circle" : "")],
     [south.lat > 0 ? "closest to the equator" : "farthest south", south,
        Math.abs(south.lat).toFixed(1) + "° " + (south.lat >= 0 ? "N" : "S")],
     ["farthest east", east, Math.abs(east.lon).toFixed(1) + "° " + (east.lon >= 0 ? "E" : "W")],
     ["farthest west", west, Math.abs(west.lon).toFixed(1) + "° " + (west.lon >= 0 ? "E" : "W")]
    ].forEach(function (r) {
      var div = document.createElement("div");
      div.innerHTML = "<dt>" + r[0] + "</dt><dd><button type=\"button\" data-place=\"" + r[1].id + "\">" +
        esc(r[1].name) + "</button> <span>" + r[2] + "</span></dd>";
      corners.appendChild(div);
    });
    corners.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-place]");
      if (!b) return;
      stopTour();
      show(b.getAttribute("data-place"));
      bringGlobeIntoView();
    });
  }

  /* ---------------------------------- start ---------------------------------- */

  function fromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (byId[id]) { show(id); return true; }
    return false;
  }
  window.addEventListener("hashchange", function () { stopTour(); fromHash(); });
  if (!fromHash()) renderIntro();
  // the intro's "sun is up over..." line ages too
  setInterval(function () {
    var el = card && !current && card.querySelector(".postcard__live span");
    if (el && !document.hidden) el.textContent = liveLine();
  }, 60000);
})();
