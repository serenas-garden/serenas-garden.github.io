/* The cottage (index.html): the door, the object tags, the guide, the wall
 * calendar, the corkboard, the light switch, and the real moon in the window.
 * Everything reads from sections.js and currently-data.js, so content changes
 * never need to touch this file.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  var noHover = window.matchMedia && matchMedia("(hover: none)").matches;

  var bySlug = {};
  (window.SECTIONS || []).forEach(function (s) { bySlug[s.slug] = s; });

  /* ------------------------------- the door ------------------------------- */
  /* Hidden in the HTML so the site still works with scripts off. Shown once per
     browser session, then remembered. While it's up, the cottage behind it is
     inert, so keyboard users can't tab into a room they can't see. */

  var DOOR_KEY = "sg-entered";
  var intro = document.querySelector(".door-intro");
  var cottage = document.getElementById("cottage");

  if (intro) {
    var entered = false;
    try { entered = sessionStorage.getItem(DOOR_KEY) === "1"; } catch (e) {}

    if (!entered) {
      intro.hidden = false;
      document.documentElement.style.overflow = "hidden";
      if (cottage) cottage.inert = true;
      var door = intro.querySelector(".door-btn");

      door.addEventListener("click", function () {
        try { sessionStorage.setItem(DOOR_KEY, "1"); } catch (e) {}
        door.classList.add("is-open");
        setTimeout(function () { intro.classList.add("is-gone"); }, reduceMotion ? 0 : 650);
        setTimeout(function () {
          intro.hidden = true;
          document.documentElement.style.overflow = "";
          if (cottage) {
            cottage.inert = false;
            cottage.focus({ preventScroll: true });
          }
        }, reduceMotion ? 80 : 1350);
      });
    }
  }

  /* ------------------------------ the objects ----------------------------- */
  /* Each object's paper tag, link and accessible name come from sections.js,
     so renaming a section renames its object. A section with `href` lives
     elsewhere (Instagram) and opens in a new tab. */

  var things = document.querySelectorAll("[data-section]");
  Array.prototype.forEach.call(things, function (el) {
    var s = bySlug[el.getAttribute("data-section")];
    if (!s) return;

    if (s.href) {
      el.href = s.href;
      el.target = "_blank";
      el.rel = "noopener";
    }

    var tag = el.querySelector(".tag");
    if (tag) {
      tag.textContent = s.title + (s.href ? " ↗" : "");
      if (s.status === "soon") {
        var soon = document.createElement("span");
        soon.className = "tag__soon";
        soon.textContent = "coming soon";
        tag.appendChild(soon);
      }
    }

    el.setAttribute("aria-label", s.title +
      (s.status === "soon" ? " (coming soon)" : "") +
      (s.href ? " (opens in a new tab)" : ""));
  });

  /* ------------------------------- the guide ------------------------------ */

  var bubble = document.querySelector(".guide__bubble");
  var hello = noHover
    ? "welcome in! tap anything to go look around"
    : "welcome in! point at anything and i'll tell you what it is";
  var resetTimer;

  function say(text) {
    if (!bubble || bubble.textContent === text) return;
    bubble.textContent = text;
    bubble.classList.remove("is-new");
    void bubble.offsetWidth;            // restart the pop
    bubble.classList.add("is-new");
  }

  // gemma.js borrows the guide to introduce her
  window.Guide = {
    say: function (text) { clearTimeout(resetTimer); say(text); },
    rest: function () { resetTimer = setTimeout(function () { say(hello); }, 1800); }
  };

  if (bubble) {
    say(hello);
    Array.prototype.forEach.call(things, function (el) {
      var s = bySlug[el.getAttribute("data-section")];
      if (!s) return;
      var line = s.guide + (s.status === "soon" ? " (still decorating this one!)" : "");
      function on() { clearTimeout(resetTimer); say(line); }
      function off() { resetTimer = setTimeout(function () { say(hello); }, 1800); }
      el.addEventListener("mouseenter", on);
      el.addEventListener("focus", on);
      el.addEventListener("mouseleave", off);
      el.addEventListener("blur", off);
    });
  }

  /* ------------------------------ the corkboard ---------------------------- */
  /* One pinned note per thing she's into, with a little drawing for each kind. */

  var ICONS = {
    watching:
      '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 10 l-6 -6 M20 10 l6 -6" class="ink" style="stroke-width:2"/>' +
      '<rect x="6" y="10" width="28" height="22" rx="4" class="ink" style="fill:#a07850;stroke-width:2"/>' +
      '<rect x="9" y="13" width="18" height="16" rx="3" class="ink" style="fill:#9cc4e2;stroke-width:2"/>' +
      '<circle cx="30.5" cy="17" r="1.6" fill="#fbf8ef"/><circle cx="30.5" cy="24" r="1.6" fill="#fbf8ef"/></svg>',
    reading:
      '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 12 q-7 -4 -15 -2 v20 q8 -2 15 2 q7 -4 15 -2 v-20 q-8 -2 -15 2z" class="ink" style="fill:#fbf8ef;stroke-width:2"/>' +
      '<path d="M20 12 v20" class="ink" style="stroke-width:2"/><path d="M27 10 v10 l2 -2 l2 2 v-10" style="fill:#a8463f"/></svg>',
    listening:
      '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 24 v-4 a12 12 0 0 1 24 0 v4" class="ink" style="stroke-width:2.4"/>' +
      '<rect x="5" y="22" width="7" height="11" rx="3" class="ink" style="fill:#d99a9e;stroke-width:2"/>' +
      '<rect x="28" y="22" width="7" height="11" rx="3" class="ink" style="fill:#d99a9e;stroke-width:2"/></svg>'
  };
  var NOTE_LOOKS = [
    { n: "var(--note-cream)", pin: "#a8463f", r: "-3deg" },
    { n: "var(--note-rose)",  pin: "#5f7d4f", r: "2deg" },
    { n: "var(--note-sage)",  pin: "#d9a441", r: "-1.5deg" }
  ];

  var notes = document.querySelector(".notes");
  var data = window.CURRENTLY;
  if (notes && data) {
    notes.innerHTML = "";
    data.items.forEach(function (item, i) {
      var look = NOTE_LOOKS[i % NOTE_LOOKS.length];
      var li = document.createElement("li");
      li.className = "note";
      li.style.setProperty("--n", look.n);
      li.style.setProperty("--pin", look.pin);
      li.style.setProperty("--r", look.r);
      li.innerHTML = ICONS[item.kind] || "";
      [["note__kind", item.kind], ["note__title", item.title], ["note__detail", item.detail]]
        .forEach(function (pair) {
          var span = document.createElement("span");
          span.className = pair[0];
          span.textContent = pair[1];
          li.appendChild(span);
        });
      notes.appendChild(li);
    });
    var sample = document.querySelector(".board__sample");
    if (sample) {
      sample.textContent = data.sample
        ? "placeholders! serena's real picks soon"
        : "updated " + shortDate(new Date(data.asOf + "T12:00:00"));
    }
  }

  /* ------------------------ the moon, window + calendar ------------------------ */
  /* From the northern hemisphere the lit side is on the right while waxing and
     on the left while waning; from the southern it's mirrored, so the visitor
     sees the moon the way it looks out their own window. The terminator is an
     ellipse whose width shrinks to zero at first/last quarter, which is how the
     real shadow line looks. */

  function moonPath(cx, cy, r, illum, litRight) {
    var rx = Math.abs(2 * illum - 1) * r;
    var outer = litRight ? 1 : 0;
    var inner = (illum < 0.5) === litRight ? 0 : 1;
    return "M" + cx + " " + (cy - r) +
      " A" + r + " " + r + " 0 0 " + outer + " " + cx + " " + (cy + r) +
      " A" + rx.toFixed(2) + " " + r + " 0 0 " + inner + " " + cx + " " + (cy - r) + "Z";
  }

  function phaseName(illum, waxing) {
    if (illum < 0.03) return "new moon";
    if (illum > 0.97) return "full moon";
    if (Math.abs(illum - 0.5) < 0.04) return waxing ? "first quarter" : "last quarter";
    return (waxing ? "waxing " : "waning ") + (illum < 0.5 ? "crescent" : "gibbous");
  }

  function fmt(d, opts) {
    try { return new Intl.DateTimeFormat("en-US", opts).format(d).toLowerCase(); }
    catch (e) { return ""; }
  }
  function shortDate(d) { return fmt(d, { month: "long", day: "numeric" }); }

  var TOGGLE_LABELS = {
    auto: "sky: real time",
    day: "sky: always day",
    night: "sky: always night"
  };

  var windowMoon = document.getElementById("moon-lit");
  var calMoon = document.getElementById("cal-moon");
  var cal = document.querySelector(".calendar");
  var toggle = document.querySelector(".switch");

  function render() {
    var state = window.Sky && window.Sky.state;
    var moon = state && state.moon;
    if (!moon && window.Sky && window.Sky.compute) {
      moon = window.Sky.compute().moon;   // a pinned day/night mode has no position data
    }

    if (moon) {
      var litRight = window.Sky.LAT < 0 ? !moon.waxing : moon.waxing;
      var dark = moon.illum < 0.03;
      if (windowMoon) windowMoon.setAttribute("d", dark ? "" : moonPath(300, 92, 38, moon.illum, litRight));
      if (calMoon) calMoon.setAttribute("d", dark ? "" : moonPath(20, 20, 15, moon.illum, litRight));
    }

    if (cal) {
      var now = new Date();
      var phase = moon ? phaseName(moon.illum, moon.waxing) : "";
      cal.querySelector(".calendar__month").textContent = fmt(now, { month: "short" });
      cal.querySelector(".calendar__day").textContent = now.getDate();
      cal.querySelector(".calendar__weekday").textContent = fmt(now, { weekday: "long" });
      if (phase) cal.querySelector(".calendar__phase").textContent = phase;
      cal.setAttribute("aria-label", "Today is " + fmt(now, { weekday: "long", month: "long", day: "numeric" }) +
        (phase ? ". Tonight's moon: " + phase + "." : ""));
    }

    if (toggle && window.Sky) {
      var mode = window.Sky.mode || "auto";
      toggle.setAttribute("data-mode", mode);
      toggle.querySelector(".switch__label").textContent = TOGGLE_LABELS[mode];
      toggle.setAttribute("aria-label", TOGGLE_LABELS[mode] + ". Flip the switch to change the sky.");
    }
  }

  if (window.Sky) {
    window.Sky.onchange = render;
    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener("click", function () { window.Sky.cycle(); });
    }
  }
  render();
})();
