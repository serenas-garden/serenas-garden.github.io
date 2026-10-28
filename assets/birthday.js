/* Is it a birthday visit?
 *
 * The birthday surprise (birthday-party.js) is for whoever opens the site
 * through the birthday link, .../#happy-birthday (or ?happy-birthday). That
 * visit is remembered in this browser (localStorage) until midnight, so the
 * decorations stay up all day as she wanders in and out of rooms, and are
 * gone the next morning. No date is kept in the repo: the day is simply the
 * day the link was opened. Opening the link again brings a fresh surprise
 * (the door wrapped again, the candles lit); #birthday-off puts it all away.
 *
 * Loaded in the <head> of the cottage and every room Gemma follows you into,
 * so <html data-birthday> is there before anything is drawn: that's what
 * puts the party hat on Gemma (gemma-kit.js) wherever she is.
 */
(function () {
  "use strict";

  var KEY = "sg-birthday";
  var root = document.documentElement;

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; }
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  var asked = (location.hash + "&" + location.search).toLowerCase();
  var state = load();

  if (/happy-birthday/.test(asked)) {
    state = { day: today(), unwrapped: false, wished: false };
    save(state);
  } else if (/birthday-off/.test(asked)) {
    state = null;
    try { localStorage.removeItem(KEY); } catch (e) {}
  }
  if (/happy-birthday|birthday-off/.test(asked) && history.replaceState) {
    // a tidy address, so a bookmark or a home-screen icon isn't a birthday forever
    try { history.replaceState(history.state, "", location.pathname); } catch (e) {}
  }

  var on = !!(state && state.day === today());
  if (on) root.setAttribute("data-birthday", "");

  window.Birthday = {
    on: on,
    state: on ? state : {},
    // remember what's happened today (the door unwrapped, a wish made)
    note: function (k, v) {
      if (!on) return;
      state[k] = v;
      save(state);
    }
  };
})();
