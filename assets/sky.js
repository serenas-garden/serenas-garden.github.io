/* The sky over St. Petersburg, Florida.
 *
 * Adapted from the sky engine on Rex's site (assets/sky.js there). Rex asked
 * for Serena's sky to follow St. Petersburg too, so the time of day, the sun
 * and the moon are worked out for 27.7676 N, 82.6403 W, and the date is read in
 * America/New_York, whoever is visiting and wherever they are. (Live weather
 * for the same place comes from weather.js.)
 *
 * Phases are cut on solar altitude, not clock time, so dawn and dusk track the
 * seasons for free:
 *
 *   altitude          phase (rising / falling)
 *   ----------------  ------------------------
 *   below -18 deg     night
 *   -18 .. -6         dawn / nightfall
 *   -6 .. -0.833      first-light / twilight
 *   -0.833 .. +6      sunrise / sunset
 *   above +6, low     morning / afternoon
 *   above +6, high    midday
 *
 * Sets data-sky (phase), data-dark and data-season on <html>, and exposes
 * window.Sky:
 * { state: { phase, dark, sun:{alt,az}, moon:{alt,az,illum,waxing}, localTime },
 *   season: "spring" | "summer" | "autumn" | "winter" (the garden's),
 *   overhead(date): where the sun and moon are straight overhead (the globe),
 *   sunAt(date), moonAt(date): where they are in St. Pete's sky (the almanac) }.
 */
(function () {
  "use strict";

  var LAT = 27.7676, LON = -82.6403;          // St. Petersburg, FL
  var TZ = "America/New_York";

  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  function sin(d) { return Math.sin(d * D2R); }
  function cos(d) { return Math.cos(d * D2R); }
  function norm(d) { return ((d % 360) + 360) % 360; }

  /* --------------------------- time and position --------------------------- */

  function julian(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  // Greenwich mean sidereal time, degrees
  function gmst(jd) {
    var T = (jd - 2451545) / 36525;
    return norm(280.46061837 + 360.98564736629 * (jd - 2451545) +
                T * T * 0.000387933 - T * T * T / 38710000);
  }

  // equatorial -> horizontal
  function horizontal(ra, dec, jd, lat, lon) {
    var ha = norm(gmst(jd) + lon - ra);
    var alt = Math.asin(sin(lat) * sin(dec) + cos(lat) * cos(dec) * cos(ha)) * R2D;
    var az = Math.atan2(-sin(ha), cos(lat) * Math.tan(dec * D2R) - sin(lat) * cos(ha)) * R2D;
    return { alt: alt, az: norm(az) };
  }

  /* NOAA's solar position. Accurate to well under a minute of arc for our
     purposes, and short enough to read. */
  function sunPosition(date) {
    var jd = julian(date);
    var T = (jd - 2451545) / 36525;

    var L0 = norm(280.46646 + T * (36000.76983 + T * 0.0003032));
    var M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    var e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);

    var C = sin(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
            sin(2 * M) * (0.019993 - 0.000101 * T) +
            sin(3 * M) * 0.000289;

    var trueLong = L0 + C;
    var omega = 125.04 - 1934.136 * T;
    var appLong = trueLong - 0.00569 - 0.00478 * sin(omega);

    var meanObliq = 23 + (26 + ((21.448 - T * (46.815 + T * (0.00059 - T * 0.001813)))) / 60) / 60;
    var obliq = meanObliq + 0.00256 * cos(omega);

    var dec = Math.asin(sin(obliq) * sin(appLong)) * R2D;
    var ra = norm(Math.atan2(cos(obliq) * sin(appLong), cos(appLong)) * R2D);

    var h = horizontal(ra, dec, jd, LAT, LON);
    h.dec = dec;
    h.ra = ra;
    h.eclLong = norm(appLong);
    // refraction lifts the disc near the horizon; ignore it above a few degrees
    if (h.alt < 5) {
      h.alt += 0.017 / Math.tan((h.alt + 10.3 / (h.alt + 5.11)) * D2R);
    }
    return h;
  }

  /* Lunar position: Meeus's series (Astronomical Algorithms, ch. 47), cut to
     its largest terms. Good to a few hundredths of a degree, so moonrise and
     moonset (almanac.js) come out within a minute or two of the US Naval
     Observatory's. With only the first term, as it once was, the moon ran
     up to two degrees off and rose ten minutes early. */
  function moonPosition(date, sun) {
    var jd = julian(date);
    var d = jd - 2451545;
    var T = d / 36525;

    var L = norm(218.316448 + 13.176396477 * d);   // mean longitude
    var M = norm(134.963396 + 13.064992950 * d);   // mean anomaly
    var F = norm(93.272095 + 13.229350244 * d);    // argument of latitude
    var D = norm(297.850192 + 12.190749117 * d);   // mean elongation from the sun
    var S = norm(357.529109 + 0.985600281 * d);    // the sun's mean anomaly

    var lon = L + 6.288774 * sin(M) + 1.274027 * sin(2 * D - M) + 0.658314 * sin(2 * D) +
      0.213618 * sin(2 * M) - 0.185116 * sin(S) - 0.114332 * sin(2 * F) +
      0.058793 * sin(2 * D - 2 * M) + 0.057066 * sin(2 * D - S - M) + 0.053322 * sin(2 * D + M) +
      0.045758 * sin(2 * D - S) - 0.040923 * sin(S - M) - 0.034720 * sin(D) -
      0.030383 * sin(S + M) + 0.015327 * sin(2 * D - 2 * F) - 0.012528 * sin(M + 2 * F) +
      0.010980 * sin(M - 2 * F);
    var lat = 5.128122 * sin(F) + 0.280602 * sin(M + F) + 0.277693 * sin(M - F) +
      0.173237 * sin(2 * D - F) + 0.055413 * sin(2 * D - M + F) + 0.046271 * sin(2 * D - M - F) +
      0.032573 * sin(2 * D + F) + 0.017198 * sin(2 * M + F);
    var dist = 385001 - 20905 * cos(M) - 3699 * cos(2 * D - M) - 2956 * cos(2 * D) - 570 * cos(2 * M);

    var obliq = 23.4397 - 0.0130042 * T;
    var ra = norm(Math.atan2(sin(lon) * cos(obliq) - Math.tan(lat * D2R) * sin(obliq),
                             cos(lon)) * R2D);
    var dec = Math.asin(sin(lat) * cos(obliq) + cos(lat) * sin(obliq) * sin(lon)) * R2D;

    var h = horizontal(ra, dec, jd, LAT, LON);
    h.ra = ra;
    h.dec = dec;

    /* Illuminated fraction, via the sun-moon elongation. cos() here takes
       degrees, so the right-ascension difference goes in as degrees too —
       converting it to radians first silently pins the phase near new for the
       whole month. */
    var elong = Math.acos(cos(sun.dec) * cos(dec) * cos(sun.ra - ra) +
                          sin(sun.dec) * sin(dec));                     // radians
    var SUN_KM = 149598000;
    var phaseAngle = Math.atan2(SUN_KM * Math.sin(elong),
                                dist - SUN_KM * Math.cos(elong));
    h.illum = (1 + Math.cos(phaseAngle)) / 2;

    // Waxing while the moon leads the sun in ecliptic longitude — both must be
    // ecliptic; the sun's right ascension is a different frame and won't do.
    h.waxing = norm(lon - sun.eclLong) < 180;
    return h;
  }

  /* Where on Earth the sun and the moon are straight overhead right now. The
     globe on the travels page draws day and night (and a little sun and moon)
     from this. The sun's position ignores refraction, which only matters
     within a degree of the horizon. */
  function overhead(date) {
    date = date || new Date();
    var g = gmst(julian(date));
    var sun = sunPosition(date);
    var moon = moonPosition(date, sun);
    function lon(ra) { var d = norm(ra - g); return d > 180 ? d - 360 : d; }
    return {
      sun:  { lat: sun.dec,  lon: lon(sun.ra) },
      moon: { lat: moon.dec, lon: lon(moon.ra), illum: moon.illum, waxing: moon.waxing }
    };
  }

  /* The day's maximum altitude, so "high" and "low" mean something in December
     as well as June. Solar noon is close enough to local noon for this. */
  function maxAltitude(date) {
    var decl = sunPosition(date).dec;
    return 90 - Math.abs(LAT - decl);
  }

  /* ------------------------------- the phase ------------------------------- */

  var PHASES = {
    night:       { dark: true  },
    dawn:        { dark: true  },
    "first-light": { dark: true },
    sunrise:     { dark: false },
    morning:     { dark: false },
    midday:      { dark: false },
    afternoon:   { dark: false },
    sunset:      { dark: false },
    twilight:    { dark: true  },
    nightfall:   { dark: true  }
  };

  function phaseFor(alt, rising, maxAlt) {
    if (alt < -18) return "night";
    if (alt < -6) return rising ? "dawn" : "nightfall";
    if (alt < -0.833) return rising ? "first-light" : "twilight";
    if (alt < 6) return rising ? "sunrise" : "sunset";
    return (alt / Math.max(1, maxAlt)) < 0.62
      ? (rising ? "morning" : "afternoon")
      : "midday";
  }

  function compute(date) {
    date = date || new Date();
    var sun = sunPosition(date);
    // rising or falling: compare with ten minutes ago
    var before = sunPosition(new Date(date.getTime() - 600000));
    var rising = sun.alt >= before.alt;
    var moon = moonPosition(date, sun);
    var maxAlt = maxAltitude(date);
    var phase = phaseFor(sun.alt, rising, maxAlt);

    return {
      phase: phase,
      dark: PHASES[phase].dark,
      rising: rising,
      sun: { alt: sun.alt, az: sun.az },
      moon: { alt: moon.alt, az: moon.az, illum: moon.illum, waxing: moon.waxing },
      maxAlt: maxAlt,
      localTime: localTime(date)
    };
  }

  function localTime(date) {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: TZ, hour: "numeric", minute: "2-digit"
      }).format(date);
    } catch (e) {
      return null;
    }
  }

  /* ------------------------------ the season ------------------------------- */
  /* The garden follows the seasons by the month in St. Pete: spring is March
     to May, summer June to August, autumn September to November, winter
     December to February. ?season=winter (or spring, summer, autumn) shows
     another season for the rest of the visit, to have a look; ?season=auto
     hands it back to the calendar. */

  var SEASONS = ["winter", "winter", "spring", "spring", "spring", "summer",
                 "summer", "summer", "autumn", "autumn", "autumn", "winter"];
  var SEASON_KEY = "sg-season";

  function seasonFor(date) {
    var m;
    try {
      m = +new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "numeric" }).format(date);
    } catch (e) {
      m = date.getMonth() + 1;
    }
    return SEASONS[m - 1];
  }

  (function () {
    var asked = /[?&#]season=([a-z]+)/i.exec(location.search + location.hash);
    if (!asked) return;
    try {
      if (SEASONS.indexOf(asked[1].toLowerCase()) > -1) sessionStorage.setItem(SEASON_KEY, asked[1].toLowerCase());
      else sessionStorage.removeItem(SEASON_KEY);
    } catch (e) {}
  })();

  function season() {
    var pinned;
    try { pinned = sessionStorage.getItem(SEASON_KEY); } catch (e) {}
    return SEASONS.indexOf(pinned) > -1 ? pinned : seasonFor(new Date());
  }

  /* ------------------------------- applying -------------------------------- */
  /* A visitor can pin a fixed sky with the light switch; "auto" hands it back
     to the clock. The pin lasts for this visit only (sessionStorage): every
     new visit opens on the real sky over St. Pete. Earlier versions kept the
     pin forever in localStorage, which left some browsers stuck on "always
     day", so that old key is cleared here. */

  var KEY = "sg-sky";
  var MODES = ["auto", "day", "night"];
  try { localStorage.removeItem(KEY); } catch (e) {}

  function stored() {
    try {
      var v = sessionStorage.getItem(KEY);
      return MODES.indexOf(v) > -1 ? v : "auto";
    } catch (e) { return "auto"; }
  }

  function apply(mode) {
    var root = document.documentElement;
    var state;

    if (mode === "day")        state = { phase: "midday", dark: false };
    else if (mode === "night") state = { phase: "night",  dark: true  };
    else                       state = compute();

    root.setAttribute("data-sky", state.phase);
    root.setAttribute("data-dark", state.dark ? "true" : "false");
    root.setAttribute("data-season", season());

    // phones tint their address bar to match
    var tint = document.querySelector('meta[name="theme-color"]');
    if (tint) tint.setAttribute("content", state.dark ? "#172019" : "#f4efe2");

    window.Sky = window.Sky || {};
    window.Sky.state = state;
    window.Sky.mode = mode;
    window.Sky.season = root.getAttribute("data-season");

    if (typeof window.Sky.onchange === "function") window.Sky.onchange(state, mode);
    return state;
  }

  function setMode(mode) {
    if (MODES.indexOf(mode) < 0) mode = "auto";
    try { sessionStorage.setItem(KEY, mode); } catch (e) {}
    return apply(mode);
  }

  window.Sky = {
    compute: compute,
    overhead: overhead,
    // the sun and the moon from St. Pete at any moment (almanac.js works out
    // rise and set times from these): sun {alt, az}, refraction included near
    // the horizon; moon {alt, az, illum, waxing}, from the Earth's centre
    sunAt: function (date) { return sunPosition(date); },
    moonAt: function (date) { return moonPosition(date, sunPosition(date)); },
    apply: apply,
    setMode: setMode,
    cycle: function () {
      return setMode(MODES[(MODES.indexOf(stored()) + 1) % MODES.length]);
    },
    mode: stored(),
    MODES: MODES,
    LAT: LAT, LON: LON, TZ: TZ
  };

  // before first paint, so nothing flashes the wrong sky
  apply(stored());

  // and keep it honest as the afternoon wears on
  setInterval(function () {
    if (window.Sky.mode === "auto") apply("auto");
  }, 60000);
})();
