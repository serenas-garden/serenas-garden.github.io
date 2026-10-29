/* Tonight's sky: the cottage calendar opens a page of the almanac.
 *
 * Everything is worked out here from sky.js's sun and moon (Sky.sunAt,
 * Sky.moonAt), for St. Petersburg, Florida, with times in St. Pete like the
 * rest of the site:
 *
 *  - the moon tonight: its phase, how much of it is lit, and when it rises,
 *    is highest and sets; with a line for the moon paparazzi on how the
 *    night looks for moon photos
 *  - the sun's evening and morning: golden hour, sunset, sunrise
 *  - the moon for the week ahead, night by night
 *  - the next full and new moons, the full one with its old name (the
 *    Harvest Moon is the full moon nearest the September equinox, and the
 *    Hunter's Moon the one after it; a second full moon in a month is blue)
 *
 * "Tonight" runs from noon to noon, so after midnight it's still the same
 * night. Times are found to the minute by scanning the day and narrowing in
 * on each crossing: a minute or two either way, which is plenty for
 * catching a moonrise.
 */
(function () {
  "use strict";

  var Sky = window.Sky;
  var cal = document.querySelector(".calendar");
  if (!Sky || !Sky.sunAt || !Sky.moonAt || !cal || !window.Intl) return;

  var MIN = 60000, HOUR = 3600000, DAY = 86400000, MONTH = 29.530589 * DAY;
  var SUN_SET = -0.267;      // the sun's top edge on the horizon (sunAt includes refraction)
  var GOLDEN = 6;            // golden hour: the sun lower than this
  var MOON_SET = 0.125;      // the moon's top edge on the horizon (moonAt is from the Earth's centre)

  function f(o) { o.timeZone = Sky.TZ; return new Intl.DateTimeFormat("en-US", o); }
  var F_TIME = f({ hour: "numeric", minute: "2-digit" });
  var F_DAY = f({ weekday: "short", month: "short", day: "numeric" });
  var F_WEEKDAY = f({ weekday: "narrow" });
  var F_DATE = f({ day: "numeric" });
  var F_MONTH = f({ month: "numeric", year: "numeric" });
  var F_HOUR = f({ hour: "numeric", minute: "numeric", hourCycle: "h23" });

  function time(d) { return F_TIME.format(d).toLowerCase().replace(" ", " "); }
  function day(d) { return F_DAY.format(d).toLowerCase(); }
  function monthOf(d) { return F_MONTH.format(d); }
  function localHours(d) {
    var h = 0, m = 0;
    F_HOUR.formatToParts(d).forEach(function (p) {
      if (p.type === "hour") h = +p.value % 24;
      if (p.type === "minute") m = +p.value;
    });
    return h + m / 60;
  }

  function sunAlt(t) { return Sky.sunAt(new Date(t)).alt; }
  function moonAlt(t) { return Sky.moonAt(new Date(t)).alt; }

  // every time alt() crosses h between t0 and t1, to the half minute
  function crossings(alt, h, t0, t1) {
    var out = [], step = 10 * MIN, tp = t0, ap = alt(t0) - h;
    for (var t = t0 + step; t <= t1 + 1; t += step) {
      var a = alt(t) - h;
      if ((ap < 0) !== (a < 0)) {
        var lo = tp, hi = t, alo = ap;
        while (hi - lo > MIN / 2) {
          var mid = (lo + hi) / 2, am = alt(mid) - h;
          if ((am < 0) === (alo < 0)) { lo = mid; alo = am; } else hi = mid;
        }
        out.push({ t: (lo + hi) / 2, up: ap < 0 });
      }
      tp = t; ap = a;
    }
    return out;
  }
  // the highest point of alt() between t0 and t1 (to the minute)
  function peak(alt, t0, t1) {
    var best = t0, bestA = -99, step = 10 * MIN;
    for (var t = t0; t <= t1; t += step) {
      var a = alt(t);
      if (a > bestA) { bestA = a; best = t; }
    }
    for (var s = step / 2; s >= MIN / 2; s /= 2) {
      var l = alt(best - s), r = alt(best + s);
      if (l > bestA && best - s >= t0) { best -= s; bestA = l; }
      else if (r > bestA && best + s <= t1) { best += s; bestA = r; }
    }
    return { t: best, alt: bestA };
  }
  /* The next full (or new) moon after t, from Meeus's series for the moon's
     phases (Astronomical Algorithms, ch. 49): to within a minute or two of
     the US Naval Observatory's times. */
  var D2R = Math.PI / 180;
  function phaseAt(k, full) {
    var T = k / 1236.85, s = Math.sin;
    var E = 1 - 0.002516 * T - 0.0000074 * T * T;
    var M = (2.5534 + 29.1053567 * k - 0.0000014 * T * T) * D2R;
    var Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T * T * T) * D2R;
    var F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T) * D2R;
    var O = (124.7746 - 1.56375588 * k + 0.0020672 * T * T) * D2R;
    var jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T * T * T;
    jde += full
      ? -0.40614 * s(Mp) + 0.17302 * E * s(M) + 0.01614 * s(2 * Mp) + 0.01043 * s(2 * F) +
        0.00734 * E * s(Mp - M) - 0.00515 * E * s(Mp + M) + 0.00209 * E * E * s(2 * M)
      : -0.40720 * s(Mp) + 0.17241 * E * s(M) + 0.01608 * s(2 * Mp) + 0.01039 * s(2 * F) +
        0.00739 * E * s(Mp - M) - 0.00514 * E * s(Mp + M) + 0.00208 * E * E * s(2 * M);
    jde += -0.00111 * s(Mp - 2 * F) - 0.00057 * s(Mp + 2 * F) + 0.00056 * E * s(2 * Mp + M) -
      0.00042 * s(3 * Mp) + 0.00042 * E * s(M + 2 * F) + 0.00038 * E * s(M - 2 * F) -
      0.00024 * E * s(2 * Mp - M) - 0.00017 * s(O) - 0.00007 * s(Mp + 2 * M);
    return (jde - 2440587.5) * DAY - 69000;          // to the clock (Terrestrial Time runs 69 s ahead)
  }
  function nextPhase(t, full) {
    var k = Math.floor((t - Date.UTC(2000, 0, 6)) / MONTH) - 1;
    for (var i = 0; i < 4; i++, k++) {
      var at = phaseAt(full ? k + 0.5 : k, full);
      if (at > t) return at;
    }
    return null;
  }

  var NAMES = ["wolf", "snow", "worm", "pink", "flower", "strawberry", "buck", "sturgeon",
               "corn", "hunter's", "beaver", "cold"];
  function fullMoonName(t) {
    var d = new Date(t);
    var year = +f({ year: "numeric" }).format(d);
    // the Harvest Moon: the full moon nearest the September equinox (the 23rd is near enough)
    var equinox = Date.UTC(year, 8, 23, 12);
    var harvest = nextPhase(equinox - 16 * DAY, true);
    if (equinox - harvest > MONTH / 2) harvest = nextPhase(harvest + DAY, true);
    var hunter = nextPhase(harvest + DAY, true);
    if (Math.abs(t - harvest) < DAY) return "the harvest moon";
    if (Math.abs(t - hunter) < DAY) return "the hunter's moon";
    var m = +f({ month: "numeric" }).format(d) - 1;
    var blue = monthOf(new Date(nextPhase(t - 31 * DAY, true))) === monthOf(d);
    return "the " + NAMES[m] + " moon" + (blue ? ", and a blue moon" : "");
  }

  function phaseName(il, waxing) {
    if (il < 0.03) return "new moon";
    if (il > 0.97) return "full moon";
    if (Math.abs(il - 0.5) < 0.04) return waxing ? "first quarter" : "last quarter";
    return (waxing ? "waxing " : "waning ") + (il < 0.5 ? "crescent" : "gibbous");
  }

  // the lit part of the moon, as the cottage window draws it (lit on the right while waxing)
  function moonPath(cx, cy, r, il, litRight) {
    var rx = Math.abs(2 * il - 1) * r;
    var outer = litRight ? 1 : 0;
    var inner = (il < 0.5) === litRight ? 0 : 1;
    return "M" + cx + " " + (cy - r) +
      " A" + r + " " + r + " 0 0 " + outer + " " + cx + " " + (cy + r) +
      " A" + rx.toFixed(2) + " " + r + " 0 0 " + inner + " " + cx + " " + (cy - r) + "Z";
  }
  function moonSvg(size, il, waxing, cls) {
    var dark = il < 0.03;
    return '<svg class="' + cls + '" viewBox="0 0 40 40" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false">' +
      '<circle cx="20" cy="20" r="17" class="almanac__moon-dark"/>' +
      (dark ? "" : '<path d="' + moonPath(20, 20, 17, il, waxing) + '" class="almanac__moon-lit"/>') +
      "</svg>";
  }

  /* ------------------------------ tonight ------------------------------ */

  function tonight(now) {
    var t = now.getTime();
    var h = localHours(now);
    // the night runs noon to noon: after midnight it's still last night, and
    // from five in the morning it's the night ahead
    var start = t - (h >= 12 ? h - 12 : h < 5 ? h + 12 : h - 12) * HOUR;
    var end = start + DAY;
    var m = Sky.moonAt(now);
    var events = [];

    crossings(sunAlt, GOLDEN, start, end).forEach(function (c) {
      if (!c.up) events.push({ t: c.t, kind: "golden", label: "golden hour" });
    });
    crossings(sunAlt, SUN_SET, start, end).forEach(function (c) {
      events.push({ t: c.t, kind: c.up ? "sunrise" : "sunset", label: c.up ? "sunrise" : "sunset" });
    });
    var moon = crossings(moonAlt, MOON_SET, start, end);
    moon.forEach(function (c) {
      events.push({ t: c.t, kind: c.up ? "moonrise" : "moonset", label: c.up ? "moonrise" : "moonset" });
    });
    var top = peak(moonAlt, start, end);
    if (top.alt > 5 && top.t > start + 30 * MIN && top.t < end - 30 * MIN) {
      events.push({ t: top.t, kind: "moontop", label: "moon highest", note: Math.round(top.alt) + "° up" });
    }
    events.sort(function (a, b) { return a.t - b.t; });

    var full = nextPhase(t, true), fresh = nextPhase(t, false);
    return {
      now: t, start: start, end: end, events: events,
      illum: m.illum, waxing: m.waxing, up: m.alt > MOON_SET,
      full: full, fullName: full ? fullMoonName(full) : "", fresh: fresh
    };
  }

  // a word for the moon paparazzi about tonight, from where things stand now
  function forPhotos(n) {
    function find(kind) { for (var i = 0; i < n.events.length; i++) if (n.events[i].kind === kind) return n.events[i]; return null; }
    function at(e) { return time(new Date(e.t)); }
    var rise = find("moonrise"), set = find("moonset"), sunset = find("sunset"), top = find("moontop");
    var lit = Math.round(n.illum * 100) + "% lit";
    var later = rise && rise.t > n.now, riseH = later ? localHours(new Date(rise.t)) : 0;
    if (n.illum > 0.985 || (n.full && n.full - n.now < 20 * HOUR)) return "it's full moon tonight!";
    if (n.illum < 0.04) return "no moon tonight: a good night for stars";
    if (n.up) {
      var setting = set && set.t > n.now ? set : null;
      if (top && top.t > n.now && (!setting || top.t < setting.t)) return "it's up now, " + lit + ", and highest at " + at(top);
      if (setting) return "it's up now, " + lit + ", until " + at(setting);
      return "it's up now, " + lit;
    }
    if (later && (riseH >= 12 || riseH < 6)) {               // this evening, or in the small hours
      if (sunset && Math.abs(rise.t - sunset.t) < 50 * MIN) return "it rises right around sunset: a golden-hour moon tonight";
      if (riseH < 6) return "a late moon tonight: it rises at " + at(rise) + ", " + lit;
      return "it rises at " + at(rise) + ", " + lit;
    }
    if (set && set.t <= n.now && sunset && set.t > sunset.t) return "it set at " + at(set) + ": look west after sunset tomorrow";
    if (later) return "a daytime moon: it rises at " + at(rise) + ", before the sun's down";
    return "the moon's in the daytime sky: look for it before sunset";
  }

  // the moon at nine each evening, for the next seven nights
  function week(now) {
    var out = [], h = localHours(now);
    var nine = now.getTime() + (21 - h - (h < 5 ? 24 : 0)) * HOUR;   // after midnight, tonight began yesterday
    for (var i = 0; i < 7; i++) {
      var d = new Date(nine + i * DAY), m = Sky.moonAt(d);
      out.push({ d: d, illum: m.illum, waxing: m.waxing });
    }
    return out;
  }

  /* ------------------------------ the page ------------------------------ */

  var ICONS = {
    golden: '<circle cx="12" cy="13" r="5"/><path d="M3 18 H21 M12 4 v2 M5.5 7.5 l1.4 1.4 M18.5 7.5 l-1.4 1.4"/>',
    sunset: '<path d="M6 16 a6 6 0 0 1 12 0 Z"/><path d="M3 18 H21 M12 6 v5 M9.5 8.5 L12 11 L14.5 8.5"/>',
    sunrise: '<path d="M6 16 a6 6 0 0 1 12 0 Z"/><path d="M3 18 H21 M12 11 v-5 M9.5 8.5 L12 6 L14.5 8.5"/>',
    moonrise: '<path d="M15 15 a6 6 0 1 1 -6 -9 a5 5 0 0 0 6 9 Z"/><path d="M3 19 H21 M19 10 v-6 M17 6 l2 -2 l2 2"/>',
    moonset: '<path d="M15 15 a6 6 0 1 1 -6 -9 a5 5 0 0 0 6 9 Z"/><path d="M3 19 H21 M19 4 v6 M17 8 l2 2 l2 -2"/>',
    moontop: '<path d="M15 15 a6 6 0 1 1 -6 -9 a5 5 0 0 0 6 9 Z"/><path d="M3 19 Q12 1 21 19" stroke-dasharray="2 2"/>'
  };

  var dialog = document.createElement("dialog");
  dialog.className = "almanac";
  dialog.setAttribute("aria-labelledby", "almanac-title");
  document.body.appendChild(dialog);

  var photos = (window.SECTIONS || []).filter(function (s) { return s.slug === "moon" && s.href; })[0];

  function render() {
    var now = new Date(), n = tonight(now);
    var pct = Math.round(n.illum * 100);
    var nights = week(now);
    var rows = n.events.map(function (e) {
      var past = e.t < n.now - 10 * MIN;
      return '<div class="almanac__row almanac__row--' + e.kind + (past ? " is-past" : "") + '">' +
        '<dt><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONS[e.kind] + "</svg>" + e.label + "</dt>" +
        "<dd>" + time(new Date(e.t)) + (e.note ? ' <span class="almanac__note">' + e.note + "</span>" : "") + "</dd></div>";
    }).join("");
    var strip = nights.map(function (x, i) {
      return '<li class="' + (i === 0 ? "is-tonight" : "") + '">' +
        '<span class="almanac__wd">' + (i === 0 ? "tonight" : F_WEEKDAY.format(x.d).toLowerCase()) + "</span>" +
        moonSvg(26, x.illum, x.waxing, "almanac__mini") +
        '<span class="almanac__pct">' + Math.round(x.illum * 100) + "%</span></li>";
    }).join("");

    dialog.innerHTML =
      '<div class="almanac__page">' +
        '<header class="almanac__sky">' +
          '<button type="button" class="almanac__x" data-close-almanac aria-label="close tonight’s sky"><span aria-hidden="true">×</span></button>' +
          '<p class="almanac__eyebrow">tonight’s sky over st. pete</p>' +
          '<div class="almanac__tonight">' +
            moonSvg(84, n.illum, n.waxing, "almanac__moon") +
            "<div>" +
              '<h2 class="almanac__title" id="almanac-title">' + phaseName(n.illum, n.waxing) + "</h2>" +
              '<p class="almanac__lit">' + pct + "% lit · " + (n.illum > 0.97 || n.illum < 0.03 ? (n.waxing ? "growing" : "shrinking") : (n.waxing ? "waxing" : "waning")) +
                (n.up ? " · up now" : "") + "</p>" +
            "</div>" +
          "</div>" +
          '<p class="almanac__paparazzi">' + forPhotos(n) + "</p>" +
        "</header>" +
        '<div class="almanac__body">' +
          '<dl class="almanac__times">' + rows + "</dl>" +
          '<h3 class="almanac__h">the week ahead</h3>' +
          '<ol class="almanac__week">' + strip + "</ol>" +
          '<dl class="almanac__next">' +
            (n.full ? '<div><dt>next full moon</dt><dd>' + day(new Date(n.full)) + ' <span class="almanac__name">' + n.fullName + "</span></dd></div>" : "") +
            (n.fresh ? '<div><dt>next new moon</dt><dd>' + day(new Date(n.fresh)) + "</dd></div>" : "") +
          "</dl>" +
          '<p class="almanac__foot">' +
            (photos ? '<a href="' + photos.href + '" target="_blank" rel="noopener">my moon photos ↗</a>' : "") +
            '<button type="button" class="almanac__close" data-close-almanac>close</button>' +
          "</p>" +
        "</div>" +
      "</div>";
  }

  function open() {
    render();
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
    var close = dialog.querySelector(".almanac__close");
    if (close) close.focus({ preventScroll: true });
  }
  function close() { if (dialog.close) dialog.close(); else dialog.removeAttribute("open"); }

  dialog.addEventListener("click", function (e) {
    if (e.target === dialog || e.target.closest("[data-close-almanac]")) close();
  });
  dialog.addEventListener("close", function () { cal.focus({ preventScroll: true }); });

  cal.addEventListener("click", open);
  function guide(on) {
    if (!window.Guide) return;
    if (on) window.Guide.say("tonight's sky over st. pete: when the moon rises, the sun sets, and the next full moon");
    else window.Guide.rest();
  }
  cal.addEventListener("mouseenter", function () { guide(true); });
  cal.addEventListener("focus", function () { guide(true); });
  cal.addEventListener("mouseleave", function () { guide(false); });
  cal.addEventListener("blur", function () { guide(false); });

  // for checking the sums from the console
  window.Almanac = { tonight: tonight, week: week, nextPhase: nextPhase, fullMoonName: fullMoonName, forPhotos: forPhotos,
    crossings: crossings, peak: peak, sunAlt: sunAlt, moonAlt: moonAlt, SUN_SET: SUN_SET, MOON_SET: MOON_SET };
})();
