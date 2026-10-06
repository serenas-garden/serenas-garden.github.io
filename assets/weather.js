/* Live weather over St. Petersburg, Florida (the same place sky.js uses).
 *
 * Current conditions come from Open-Meteo (open-meteo.com): free, no account
 * or key, and it allows requests straight from the browser. The result is
 * kept for 15 minutes in sessionStorage, so moving between pages doesn't
 * refetch, and it's refreshed every 15 minutes while the page is open.
 *
 * Sets data-weather on <html> to one of:
 *   clear · partly · overcast · fog · rain · storm · snow
 * and data-windy="true" at 15 mph and up. The stylesheet does the rest (clouds,
 * rain, lightning, fog in the garden outside and in the cottage window).
 * Exposes window.Weather = { kind, temp (°F), words, code, wind } and fires a
 * "weather" event on document whenever it changes.
 *
 * If the request fails, nothing is set and the site simply shows fair weather.
 */
(function () {
  "use strict";

  var URL = "https://api.open-meteo.com/v1/forecast?latitude=27.7676&longitude=-82.6403" +
    "&current=temperature_2m,weather_code,cloud_cover,wind_speed_10m" +
    "&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York";
  var KEY = "sg-weather";
  var FRESH = 15 * 60 * 1000;
  var root = document.documentElement;

  /* WMO weather codes, folded into the handful of looks the site can draw. */
  function kindOf(code, cloud) {
    if (code >= 95) return "storm";
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if (code === 45 || code === 48) return "fog";
    if (code === 3) return "overcast";
    if (code === 2 || (code === 1 && cloud > 40)) return "partly";
    return "clear";
  }

  var WORDS = {
    clear: "clear", partly: "partly cloudy", overcast: "cloudy", fog: "foggy",
    rain: "rainy", storm: "stormy", snow: "snowy"
  };

  function apply(w) {
    root.setAttribute("data-weather", w.kind);
    root.setAttribute("data-windy", w.wind >= 15 ? "true" : "false");
    window.Weather = w;
    try { document.dispatchEvent(new CustomEvent("weather", { detail: w })); } catch (e) {}
  }

  function fetchNow() {
    if (!window.fetch) return;
    fetch(URL)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var c = d && d.current;
        if (!c || typeof c.weather_code !== "number") return;
        var kind = kindOf(c.weather_code, c.cloud_cover);
        var w = {
          kind: kind,
          words: c.weather_code >= 51 && c.weather_code <= 57 ? "drizzly" : WORDS[kind],
          temp: Math.round(c.temperature_2m),
          wind: c.wind_speed_10m,
          code: c.weather_code,
          at: Date.now()
        };
        try { sessionStorage.setItem(KEY, JSON.stringify(w)); } catch (e) {}
        apply(w);
      })
      .catch(function () { /* fair weather it is */ });
  }

  // a recent reading paints straight away, before the first frame
  var cached = null;
  try { cached = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) {}
  if (cached && cached.kind && Date.now() - cached.at < FRESH) apply(cached);
  else fetchNow();

  setInterval(fetchNow, FRESH);
})();
