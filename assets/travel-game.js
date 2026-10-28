/* Where's Serena? (travel-game.html): a map game on the places Serena has
 * been, scored exactly the way MapTap scores (maptap.gg/faq, October 2026).
 *
 * A game is five of her places from travels-data.js. For each one the player
 * taps the globe where they think it is and locks it in. The score is the
 * distance straight across the Earth, run through MapTap's curve:
 *     100 x e^(-3.5 x km / 16,250), and 0 from 16,250 km on
 * so 100 within about 22 km, 90 at 500 km, 81 at 1,000, 42 at 4,000. The
 * five rounds count x1 x1 x2 x3 x3, so a perfect game is 1,000, and they
 * get harder as they go (each place has a `level`, 1 to 3).
 *
 * Today's trip is the same five places for everyone on the same day (by the
 * player's own calendar, like MapTap's daily), and like MapTap's daily it
 * has the country bonus: a tap inside the right country lifts the round to
 * at least 25 and the right continent to at least 10, never past 80 and
 * never lower than it was. Random trips are five fresh places scored on
 * distance alone, like MapTap's other modes. Today's trip is kept in this
 * browser (localStorage) round by round, so a reload carries on where it
 * was, and it's played once a day.
 *
 * globe.js draws the globe in its game mode: no borders, no toadstools.
 */
(function () {
  "use strict";

  var T = window.TRAVELS, GEO = window.GLOBE_GEO;
  var host = document.querySelector("[data-globe]");
  var card = document.querySelector("[data-card]");
  if (!T || !GEO || !host || !card || !window.Globe) return;

  var places = T.places, countries = T.countries;
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  // phones and tablets just pinch; a mouse wheel zooms too
  var ZOOM = window.matchMedia && matchMedia("(hover: none)").matches ? "pinch" : "pinch or scroll";
  var byId = {};
  places.forEach(function (p) { byId[p.id] = p; });

  /* ------------------------------ MapTap's scoring ------------------------------ */

  var MAX_KM = 16250, DECAY = 3.5, WEIGHTS = [1, 1, 2, 3, 3];
  var COUNTRY_FLOOR = 25, CONTINENT_FLOOR = 10, BONUS_CAP = 80;

  function kmBetween(a, b) {
    var r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function distanceScore(km) { return km >= MAX_KM ? 0 : 100 * Math.exp(-(km / MAX_KM) * DECAY); }
  function withFloor(raw, floor) {
    var boosted = floor + (raw / 100) * (100 - floor);
    return Math.max(raw, Math.min(boosted, BONUS_CAP));
  }

  // every country on the globe, by continent (Natural Earth's grouping)
  var CONTINENT = {};
  [["Africa", "Zimbabwe|Zambia|Uganda|Tunisia|Togo|Tanzania|eSwatini|S. Sudan|Sudan|South Africa|Somalia|Somaliland|" +
      "Sierra Leone|Senegal|São Tomé and Principe|Rwanda|Nigeria|Niger|Namibia|Mozambique|Morocco|W. Sahara|Mauritius|" +
      "Mauritania|Mali|Malawi|Madagascar|Libya|Liberia|Lesotho|Kenya|Guinea-Bissau|Guinea|Ghana|Gambia|Gabon|Ethiopia|" +
      "Eritrea|Eq. Guinea|Egypt|Djibouti|Côte d'Ivoire|Dem. Rep. Congo|Congo|Comoros|Chad|Central African Rep.|" +
      "Cabo Verde|Cameroon|Burundi|Burkina Faso|Botswana|Benin|Angola|Algeria"],
   ["Asia", "Yemen|Vietnam|Uzbekistan|United Arab Emirates|Turkmenistan|Turkey|Timor-Leste|Thailand|Tajikistan|Taiwan|" +
      "Syria|Sri Lanka|South Korea|Singapore|Saudi Arabia|Qatar|Philippines|Pakistan|Oman|North Korea|Nepal|Mongolia|" +
      "Malaysia|Lebanon|Laos|Kyrgyzstan|Kuwait|Kazakhstan|Jordan|Japan|Israel|Palestine|Iraq|Iran|Indonesia|India|" +
      "Georgia|N. Cyprus|Cyprus|China|Hong Kong|Cambodia|Myanmar|Brunei|Bhutan|Bangladesh|Bahrain|Azerbaijan|Armenia|" +
      "Afghanistan|Siachen Glacier"],
   ["Europe", "Isle of Man|United Kingdom|Ukraine|Switzerland|Sweden|Spain|Slovakia|Slovenia|Serbia|Russia|Romania|" +
      "Portugal|Poland|Norway|Netherlands|Montenegro|Moldova|Macedonia|Luxembourg|Lithuania|Latvia|Kosovo|Italy|Ireland|" +
      "Iceland|Hungary|Greece|Germany|France|Åland|Finland|Estonia|Faeroe Is.|Denmark|Czechia|Croatia|Bulgaria|" +
      "Bosnia and Herz.|Belgium|Belarus|Austria|Andorra|Albania"],
   ["North America", "Puerto Rico|United States of America|Trinidad and Tobago|Saint Lucia|Panama|Nicaragua|Mexico|" +
      "Jamaica|Honduras|Haiti|Guatemala|Grenada|Greenland|El Salvador|Dominican Rep.|Dominica|Cuba|Costa Rica|Canada|" +
      "Belize|Barbados|Bahamas|Curaçao"],
   ["South America", "Venezuela|Uruguay|Falkland Is.|Suriname|Peru|Paraguay|Guyana|Ecuador|Colombia|Chile|Brazil|" +
      "Bolivia|Argentina"],
   ["Oceania", "Vanuatu|Micronesia|Guam|Solomon Is.|Samoa|Papua New Guinea|Palau|New Zealand|Kiribati|Fr. Polynesia|" +
      "New Caledonia|Fiji|Australia"],
   ["Antarctica", "Antarctica|Fr. S. Antarctic Lands|Heard I. and McDonald Is.|S. Geo. and the Is."]
  ].forEach(function (c) { c[1].split("|").forEach(function (n) { CONTINENT[n] = c[0]; }); });

  // the globe's short names, said properly ("your pin landed in the Netherlands")
  var SAY = {
    "United States of America": "the United States", "United Kingdom": "the United Kingdom",
    "Netherlands": "the Netherlands", "Philippines": "the Philippines", "Bahamas": "the Bahamas",
    "United Arab Emirates": "the United Arab Emirates", "Dominican Rep.": "the Dominican Republic",
    "Dem. Rep. Congo": "the Democratic Republic of the Congo", "Congo": "the Republic of the Congo",
    "Central African Rep.": "the Central African Republic", "Czechia": "the Czech Republic",
    "Gambia": "the Gambia", "Isle of Man": "the Isle of Man", "Falkland Is.": "the Falkland Islands",
    "Solomon Is.": "the Solomon Islands", "Faeroe Is.": "the Faroe Islands", "S. Sudan": "South Sudan",
    "W. Sahara": "Western Sahara", "Eq. Guinea": "Equatorial Guinea", "Bosnia and Herz.": "Bosnia and Herzegovina",
    "N. Cyprus": "northern Cyprus", "Fr. Polynesia": "French Polynesia", "Macedonia": "North Macedonia",
    "eSwatini": "Eswatini", "S. Geo. and the Is.": "South Georgia", "Fr. S. Antarctic Lands": "the French Southern Lands",
    "Heard I. and McDonald Is.": "Heard Island", "Siachen Glacier": "the Siachen Glacier", "Åland": "the Åland Islands"
  };

  // score one round: where the pin is, how far, and what it's worth
  function scoreRound(p, guess, daily, round) {
    var km = kmBetween(guess, p), raw = distanceScore(km);
    var where = Globe.countryAt(GEO, guess.lon, guess.lat);
    var c = countries[p.country], final = raw, bonus = null;
    if (daily && where) {
      if (c.geo && where === c.geo) { final = withFloor(raw, COUNTRY_FLOOR); bonus = "country"; }
      else if (CONTINENT[where] === c.continent) { final = withFloor(raw, CONTINENT_FLOOR); bonus = "continent"; }
    }
    var score = Math.round(final);
    if (score <= Math.round(raw)) bonus = null;      // it only counts if it lifted the score
    return { id: p.id, guess: guess, km: km, raw: Math.round(raw), score: score, bonus: bonus,
             where: where, pts: score * WEIGHTS[round] };
  }

  /* ------------------------------ picking the five ------------------------------ */
  /* Round by round from a pool of difficulty levels, never the same place twice
     and, while there's a choice, never the same country twice. */

  var POOLS = [[1], [1, 2], [2], [2, 3], [3]];
  function pickFive(rand) {
    var chosen = [];
    POOLS.forEach(function (levels) {
      function from(anyCountry) {
        return places.filter(function (p) {
          return chosen.indexOf(p) < 0 && levels.indexOf(p.level || 2) >= 0 &&
            (anyCountry || !chosen.some(function (q) { return q.country === p.country; }));
        });
      }
      var c = from(false);
      if (!c.length) c = from(true);
      if (!c.length) c = places.filter(function (p) { return chosen.indexOf(p) < 0; });
      chosen.push(c[Math.floor(rand() * c.length)]);
    });
    return chosen.map(function (p) { return p.id; });
  }
  // the same numbers for everyone on the same day
  function seeded(text) {
    var a = 2166136261;
    for (var i = 0; i < text.length; i++) { a ^= text.charCodeAt(i); a = Math.imul(a, 16777619); }
    return function () {                          // mulberry32
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------ days and keeping score ------------------------------ */

  var FIRST_DAY = "2026-10-26";                   // trip No. 1
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dayKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function dayNumber(key) {
    return Math.round((Date.parse(key + "T12:00:00Z") - Date.parse(FIRST_DAY + "T12:00:00Z")) / 864e5) + 1;
  }
  var TODAY = dayKey(new Date());

  var KEY = "sg-wheres-serena";
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); return s && s.days ? s : { days: {} }; }
    catch (e) { return { days: {} }; }
  }
  function save() {
    var keys = Object.keys(store.days).sort();     // the last couple of months is plenty
    while (keys.length > 60) delete store.days[keys.shift()];
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
  }
  var store = load();

  // a stored day back into rounds (the scores are worked out again from the pins)
  function replay(day) {
    return (day.rounds || []).map(function (g, i) {
      return scoreRound(byId[day.ids[i]], { lon: g[0], lat: g[1] }, true, i);
    });
  }
  function stats() {
    var done = Object.keys(store.days).filter(function (k) { return store.days[k].done; }).sort();
    var best = 0, streak = 0;
    done.forEach(function (k) { best = Math.max(best, store.days[k].total || 0); });
    // a streak counts back from today (or from yesterday, before today's is played)
    var d = new Date();
    if (!store.days[TODAY] || !store.days[TODAY].done) d.setDate(d.getDate() - 1);
    while (store.days[dayKey(d)] && store.days[dayKey(d)].done) { streak++; d.setDate(d.getDate() - 1); }
    return { played: done.length, best: best, streak: streak };
  }

  /* ------------------------------ the page ------------------------------ */

  var pass = {
    round: document.querySelector("[data-round]"),
    place: document.querySelector("[data-place]"),
    where: document.querySelector("[data-where]"),
    track: document.querySelector("[data-track]")
  };
  var main = document.querySelector("[data-main]");
  var board = document.querySelector(".tg-board");
  var stage = document.querySelector(".tg-stage");
  var live = document.querySelector("[data-live]");
  var help = document.querySelector("[data-help]");

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function num(n) { return Math.round(n).toLocaleString("en-US"); }
  function say(text) { if (live) live.textContent = text; }
  function kmWords(km) {
    if (km < 1) return "less than 1 km";
    var mi = km * 0.621371;
    return num(km) + " km (" + num(mi) + (Math.round(mi) === 1 ? " mile" : " miles") + ")";
  }
  function named(where) { return SAY[where] || where; }
  // where the pin is, in words: in a country, just off its coast, or out at sea
  function landed(r) {
    if (r.where) return "in " + named(r.where);
    var near = coastNear(r.guess);
    return near ? "just off the coast of " + named(near) : "out at sea";
  }
  // the country within about 12 km of a point at sea (the coasts are simplified)
  function coastNear(at) {
    var dLat = 12 / 111, dLon = dLat / Math.max(0.2, Math.cos(at.lat * Math.PI / 180));
    for (var a = 0; a < 16; a++) {
      var t = a * Math.PI / 8;
      var hit = Globe.countryAt(GEO, at.lon + dLon * Math.cos(t), at.lat + dLat * Math.sin(t));
      if (hit) return hit;
    }
    return null;
  }
  var TIMES = ["", "", "double", "triple", "triple"];
  // the pixel font's 5 looks like an S, so the rounds are spelled out
  var NTH = ["one", "two", "three", "four", "five"];
  function roundOf(i) { return "round " + NTH[i] + " of five"; }

  /* ------------------------------ the globe ------------------------------ */

  var globe = window.Globe(host, { geo: GEO, places: [], tint: [], game: true, onTap: onTap });
  if (!globe) {
    card.innerHTML = '<p class="postcard__blurb">Sorry, this browser can&#x27;t draw the globe, so the game can&#x27;t start.</p>';
    return;
  }
  document.querySelectorAll(".tg-tools [data-act]").forEach(function (b) {
    b.addEventListener("click", function () {
      var a = b.getAttribute("data-act");
      if (a === "in") globe.zoomBy(1.6);
      else if (a === "out") globe.zoomBy(1 / 1.6);
      else globe.zoomOut();
    });
  });

  /* ------------------------------ a game ------------------------------ */

  var state = "intro", game = null, pin = null;

  function newGame(mode) {
    var day = mode === "daily" ? store.days[TODAY] : null;
    var ids = day ? day.ids : pickFive(mode === "daily" ? seeded("where's serena " + TODAY) : Math.random);
    game = { mode: mode, ids: ids, rounds: day ? replay(day) : [], i: day ? (day.rounds || []).length : 0 };
    if (mode === "daily" && !day) { store.days[TODAY] = { ids: ids, rounds: [], done: false }; save(); }
    globe.setSpin(false);
    if (game.i >= 5) { finish(); return; }
    startRound();
    var top = stage.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.3) {
      stage.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }

  function startRound() {
    var p = byId[game.ids[game.i]];
    state = "guess";
    pin = null;
    globe.clearGame();
    globe.zoomOut();
    renderPass();
    renderGuessCard();
    main.hidden = false;
    main.textContent = "lock it in";
    main.disabled = true;
    help.textContent = "drag to spin · " + ZOOM + " to zoom · tap to drop your pin";
    say("Round " + (game.i + 1) + " of 5" + (TIMES[game.i] ? ", worth " + TIMES[game.i] : "") +
        ": where is " + p.name + ", " + p.where + "? Tap the globe to drop your pin.");
  }

  function onTap(at) {
    if (state !== "guess") return;
    var first = !pin;
    pin = at;
    globe.mark("pin", "guess", at);
    main.disabled = false;
    if (first) {
      help.textContent = "happy with it? lock it in · or tap again to move your pin";
      say("Pin dropped. Lock it in, or tap somewhere else to move it.");
    }
  }

  function lock() {
    if (state !== "guess" || !pin) return;
    var i = game.i, p = byId[game.ids[i]];
    var r = scoreRound(p, pin, game.mode === "daily", i);
    game.rounds[i] = r;
    if (game.mode === "daily") {
      var day = store.days[TODAY];
      day.rounds[i] = [+pin.lon.toFixed(3), +pin.lat.toFixed(3)];
      save();
    }
    state = "reveal";
    main.textContent = i < 4 ? "next place →" : "see my score";
    main.disabled = true;
    help.textContent = "here's where it really is";
    renderTrack();
    globe.unmark("pin");
    globe.mark("g" + i, "guess", pin);
    globe.frame([pin, p]);
    // the line runs from the pin to the real place, and a toadstool pops up there
    globe.line("l" + i, pin, p, 1200, function () {
      globe.mark("a" + i, "answer", p, p.name + " \u00B7 " + r.score);
      pass.where.textContent = (r.km < 22 ? "bullseye! " : "") + r.score + " / 100 \u00B7 " + num(r.km) + " km away";
      renderResultCard(r, p);
      main.disabled = false;
      main.focus({ preventScroll: true });
      say(p.name + " was " + kmWords(r.km) + " from your pin: " + r.score + " points" +
          (WEIGHTS[i] > 1 ? ", times " + WEIGHTS[i] + " makes " + r.pts : "") + "." +
          (r.bonus ? " The " + r.bonus + " bonus lifted it from " + r.raw + "." : ""));
    });
  }

  function next(byKey) {
    if (state !== "reveal") return;
    game.i++;
    if (game.i >= 5) { finish(); return; }
    startRound();
    if (byKey) host.focus({ preventScroll: true });   // keyboard players carry on on the globe
  }

  function finish() {
    state = "done";
    main.hidden = true;
    var total = game.rounds.reduce(function (t, r) { return t + r.pts; }, 0);
    game.total = total;
    if (game.mode === "daily") {
      var day = store.days[TODAY];
      day.done = true;
      day.total = total;
      save();
    }
    // every guess and every answer on the globe at once
    globe.clearGame();
    var all = [];
    game.rounds.forEach(function (r, i) {
      var p = byId[r.id];
      globe.mark("g" + i, "guess", r.guess);
      globe.line("l" + i, r.guess, p, 0);
      globe.mark("a" + i, "answer", p, p.name);
      all.push(r.guess, p);
    });
    globe.frame(all);
    help.textContent = "drag to spin · every pin and where it really was";
    renderPass();
    renderSummaryCard();
    say("That's the trip! " + num(total) + " points out of 1,000.");
  }

  main.addEventListener("click", function (e) {
    if (state === "guess") lock();
    else if (state === "reveal") next(e.detail === 0);
  });

  /* ------------------------------ the boarding pass ------------------------------ */

  function renderTrack() {
    var html = "";
    for (var i = 0; i < 5; i++) {
      var r = game && game.rounds[i];
      var now = game && state !== "done" && i === game.i;
      html += '<li class="tg-track__r' + (r ? " is-done" : "") + (now ? " is-now" : "") + '"' +
        (r ? ' title="' + esc(byId[r.id].name) + ': ' + r.pts + ' points"' : "") + ">" +
        '<span class="tg-track__w">×' + WEIGHTS[i] + "</span>" +
        '<b class="tg-track__n">' + (r ? r.pts : "") + "</b>" +
        '<span class="visually-hidden">' + (r ? ": " + r.pts + " points" : now ? ": now" : ": to come") + "</span>" +
        "</li>";
    }
    pass.track.innerHTML = html;
  }

  function renderPass() {
    if (board) board.setAttribute("data-state", state);
    if (state === "intro" || !game) {
      pass.round.textContent = "boarding pass";
      pass.place.textContent = "Where’s Serena?";
      pass.where.textContent = "five places · 1,000 points";
    } else if (state === "done") {
      pass.round.innerHTML = game.mode === "daily"
        ? 'trip No. <span class="tg-num">' + dayNumber(TODAY) + "</span> · landed" : "random trip · landed";
      pass.place.textContent = num(game.total) + " points";
      pass.where.textContent = "out of 1,000";
    } else {
      var p = byId[game.ids[game.i]];
      pass.round.textContent = roundOf(game.i) + (WEIGHTS[game.i] > 1 ? " · counts ×" + WEIGHTS[game.i] : "");
      pass.place.textContent = p.name;
      pass.where.textContent = p.where;
    }
    renderTrack();
  }

  /* ------------------------------ the postcard ------------------------------ */

  function statsLine() {
    var s = stats();
    if (!s.played) return "";
    return '<p class="tg-stats">' + s.played + (s.played === 1 ? " trip" : " trips") + " played · best " + num(s.best) +
      (s.streak > 1 ? " · " + s.streak + "-day streak" : "") + "</p>";
  }

  function renderIntro() {
    state = "intro";
    game = null;
    main.hidden = true;
    globe.clearGame();
    globe.setSpin(true);
    help.textContent = "drag to spin · " + ZOOM + " to zoom";
    renderPass();
    var day = store.days[TODAY];
    var dailyBtn = !day
      ? '<button type="button" class="postcard__go" data-start="daily">start today’s trip</button>'
      : day.done
        ? '<button type="button" class="postcard__go" data-start="daily">see today’s trip (' + num(day.total) + ")</button>"
        : '<button type="button" class="postcard__go" data-start="daily">carry on with today’s trip</button>';
    card.className = "postcard tg-card tg-card--intro";
    card.innerHTML =
      window.stampSvg("toadstool", "the world", String(places.length)) +
      '<p class="postcard__eyebrow">how to play</p>' +
      '<h2 class="postcard__name">Find my postcards</h2>' +
      '<p class="postcard__blurb">I’ve sent postcards from ' + places.length + " places. Each round names one of them: " +
      "tap the globe where you think it is, then lock it in. There are no borders and no labels, just the world.</p>" +
      '<ul class="tg-rules">' +
      "<li><b>The closer, the better.</b> 100 points if you’re within 22 km, 90 at 500 km, 81 at 1,000 km, " +
      "and nothing past 16,250 km.</li>" +
      "<li><b>Five places, getting harder,</b> and the later ones count more: ×1 ×1 ×2 ×3 ×3, " +
      "for 1,000 points in all.</li>" +
      "<li><b>Today’s trip</b> is the same five for everyone, once a day. Land in the right country and the round " +
      "is worth at least 25 (the right continent, at least 10). Random trips are as many as you like, on distance alone.</li>" +
      "</ul>" +
      '<p class="postcard__actions tg-actions">' + dailyBtn +
      ' <button type="button" class="tg-alt" data-start="random">a random trip</button></p>' +
      statsLine() +
      '<p class="tg-credit">Scored the same way as <a href="https://maptap.gg/" target="_blank" rel="noopener">MapTap</a>.</p>';
    pop();
  }

  function renderGuessCard() {
    var p = byId[game.ids[game.i]];
    card.className = "postcard tg-card tg-card--guess";
    card.innerHTML =
      '<p class="postcard__eyebrow">' + (game.mode === "daily" ? "today’s trip · " : "random trip · ") +
      roundOf(game.i) + "</p>" +
      '<h2 class="postcard__name">Where’s ' + esc(p.name) + "?</h2>" +
      '<p class="postcard__where">' + esc(p.where) + "</p>" +
      '<p class="postcard__blurb">Spin the globe, find it, and tap to drop your pin. Tap again to move it, ' +
      "then lock it in." + (WEIGHTS[game.i] > 1 ? " This one counts " + TIMES[game.i] + "." : "") + "</p>" +
      '<p class="tg-keys">On a keyboard: arrows turn the globe, + and − zoom, Enter drops your pin in the middle.</p>' +
      '<p class="tg-quit"><button type="button" class="tg-link" data-quit>' +
      (game.mode === "daily" ? "save it for later" : "stop this trip") + "</button></p>";
    pop();
  }

  function renderResultCard(r, p) {
    var c = countries[p.country], w = WEIGHTS[game.i];
    card.className = "postcard tg-card tg-card--result";
    card.innerHTML =
      window.stampSvg(p.stamp, c.name, String(r.score)) +
      '<p class="postcard__eyebrow">' + roundOf(game.i) + (w > 1 ? " · counts ×" + w : "") + "</p>" +
      '<p class="tg-score' + (r.score === 100 ? " is-perfect" : "") + '"><b data-count>' + (reduce ? r.score : 0) + "</b><span>/ 100</span></p>" +
      (w > 1 ? '<p class="tg-pts">×' + w + " = <b>" + r.pts + "</b> points</p>" : "") +
      '<p class="tg-dist">' + (r.km < 22 ? "Bullseye! " : "") + "Your pin landed " + kmWords(r.km) + " away, " +
      landed(r) + ".</p>" +
      (r.bonus ? '<p class="tg-bonus"><span>' + r.bonus + " bonus</span> You landed in the right " + r.bonus +
        ", so your " + r.raw + " went up to " + r.score + ".</p>" : "") +
      '<div class="tg-greet">' +
      '<p class="postcard__eyebrow">greetings from</p>' +
      '<h2 class="postcard__name">' + esc(p.name) + "</h2>" +
      '<p class="postcard__where">' + esc(p.where) + "</p>" +
      '<p class="postcard__blurb">' + esc(p.blurb) + "</p>" +
      '<p class="tg-more"><a href="travels.html#' + encodeURIComponent(p.id) + '">see it on my travels map</a></p>' +
      "</div>";
    pop();
    countUp(card.querySelector("[data-count]"), r.score);
  }

  var VERDICTS = [
    [1000, "Perfect! Were you hiding in my suitcase?"],
    [900, "You could be my travel buddy."],
    [750, "A seasoned globetrotter."],
    [600, "Your passport’s getting full."],
    [400, "Not bad for a day trip!"],
    [200, "A little lost, but having fun."],
    [0, "Maybe read my postcards first!"]
  ];
  function verdict(total) {
    for (var i = 0; i < VERDICTS.length; i++) if (total >= VERDICTS[i][0]) return VERDICTS[i][1];
    return "";
  }

  function renderSummaryCard() {
    var total = game.total, daily = game.mode === "daily";
    card.className = "postcard tg-card tg-card--done";
    card.innerHTML =
      '<p class="postcard__eyebrow">' + (daily ? 'today’s trip · No. <span class="tg-num">' + dayNumber(TODAY) + "</span>" : "a random trip") + "</p>" +
      '<h2 class="tg-total" tabindex="-1"><b data-count>' + (reduce ? num(total) : 0) + "</b><span>/ 1,000</span></h2>" +
      '<p class="tg-verdict">' + verdict(total) + "</p>" +
      '<ol class="tg-rows">' + game.rounds.map(function (r, i) {
        var p = byId[r.id];
        return '<li><span class="tg-rows__w">×' + WEIGHTS[i] + "</span>" +
          '<a class="tg-rows__name" href="travels.html#' + encodeURIComponent(p.id) + '">' + esc(p.name) + "</a>" +
          '<span class="tg-rows__km">' + num(r.km) + " km" + (r.bonus ? " · " + r.bonus + " bonus" : "") + "</span>" +
          '<span class="tg-rows__pts">' + r.pts + "</span></li>";
      }).join("") + "</ol>" +
      '<p class="postcard__actions tg-actions">' +
      '<button type="button" class="postcard__go" data-share>share my score</button> ' +
      '<button type="button" class="tg-alt" data-start="random">' + (daily ? "a random trip" : "another random trip") + "</button></p>" +
      (daily ? '<p class="tg-tomorrow">A new trip tomorrow!</p>' : "") +
      statsLine() +
      '<p class="tg-quit"><button type="button" class="tg-link" data-home>how to play</button></p>';
    pop();
    countUp(card.querySelector("[data-count]"), total, true);
    var h = card.querySelector(".tg-total");
    if (h) h.focus({ preventScroll: true });
  }

  function countUp(el, to, commas) {
    if (!el || reduce) return;
    var t0 = performance.now(), ms = 900;
    (function step(now) {
      var t = Math.min(1, (now - t0) / ms), v = to * (1 - Math.pow(1 - t, 3));
      el.textContent = commas ? num(v) : Math.round(v);
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }

  function pop() {
    if (reduce) return;
    card.classList.remove("is-new");
    void card.offsetWidth;                       // restart the little flip
    card.classList.add("is-new");
  }

  /* ------------------------------ sharing ------------------------------ */

  function blossom(s) { return s >= 95 ? "🍄" : s >= 80 ? "🌸" : s >= 60 ? "🌼" : s >= 40 ? "🌿" : s >= 20 ? "🍂" : "🪨"; }
  function shareText() {
    var head = game.mode === "daily" ? "Where’s Serena? No. " + dayNumber(TODAY) : "Where’s Serena? (a random trip)";
    return head + "\n" +
      game.rounds.map(function (r) { return blossom(r.score) + " " + r.score; }).join("  ") + "\n" +
      num(game.total) + " / 1,000\n" +
      location.href.split("#")[0];
  }
  function share(btn) {
    var text = shareText();
    function done(ok) {
      btn.textContent = ok ? "copied! paste it to a friend" : "couldn’t copy, sorry";
      setTimeout(function () { btn.textContent = "share my score"; }, 2600);
    }
    var phone = window.matchMedia && matchMedia("(pointer: coarse)").matches;
    if (phone && navigator.share) {
      navigator.share({ text: text }).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(oldCopy(text)); });
    } else done(oldCopy(text));
  }
  function oldCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    ta.remove();
    return ok;
  }

  card.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.hasAttribute("data-start")) newGame(b.getAttribute("data-start"));
    else if (b.hasAttribute("data-share")) share(b);
    else if (b.hasAttribute("data-quit") || b.hasAttribute("data-home")) renderIntro();
  });

  renderIntro();
})();
