/* The cottage (index.html): the door, the guide, the "currently" card, and the
 * real moon in the window. Everything reads from sections.js and
 * currently-data.js, so content changes never need to touch this file.
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
     browser session, then remembered. */

  var DOOR_KEY = "sg-entered";
  var intro = document.querySelector(".door-intro");

  if (intro) {
    var entered = false;
    try { entered = sessionStorage.getItem(DOOR_KEY) === "1"; } catch (e) {}

    if (!entered) {
      intro.hidden = false;
      document.documentElement.style.overflow = "hidden";
      var door = intro.querySelector(".door-btn");

      door.addEventListener("click", function () {
        try { sessionStorage.setItem(DOOR_KEY, "1"); } catch (e) {}
        door.classList.add("is-open");
        setTimeout(function () { intro.classList.add("is-gone"); }, reduceMotion ? 0 : 650);
        setTimeout(function () {
          intro.hidden = true;
          document.documentElement.style.overflow = "";
          var main = document.getElementById("cottage");
          if (main) main.focus({ preventScroll: true });
        }, reduceMotion ? 80 : 1350);
      });
    }
  }

  /* ------------------------------ the objects ----------------------------- */
  /* Labels come from sections.js, so renaming a section renames its object. */

  var things = document.querySelectorAll("[data-section]");
  Array.prototype.forEach.call(things, function (el) {
    var s = bySlug[el.getAttribute("data-section")];
    if (!s) return;
    var label = el.querySelector(".label");
    if (label) {
      label.textContent = s.title;
      if (s.status === "soon") {
        var dot = document.createElement("span");
        dot.className = "soon-dot";
        dot.title = "coming soon";
        label.appendChild(dot);
      }
    }
    el.setAttribute("aria-label", s.title + (s.status === "soon" ? " (coming soon)" : ""));
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

  /* ---------------------------- currently card ---------------------------- */

  var card = document.querySelector(".currently ul");
  var data = window.CURRENTLY;
  if (card && data) {
    card.innerHTML = "";
    data.items.forEach(function (item) {
      var li = document.createElement("li");
      var kind = document.createElement("span");
      kind.className = "kind";
      kind.textContent = item.kind;
      var what = document.createElement("span");
      var title = document.createElement("span");
      title.className = "title";
      title.textContent = item.title;
      var detail = document.createElement("div");
      detail.className = "detail";
      detail.textContent = item.detail;
      what.appendChild(title);
      what.appendChild(detail);
      li.appendChild(kind);
      li.appendChild(what);
      card.appendChild(li);
    });
    var note = document.querySelector(".currently .note");
    if (note) {
      note.textContent = data.sample
        ? "placeholder: serena's real picks coming soon"
        : "updated " + prettyDate(new Date(data.asOf + "T12:00:00"));
    }
  }

  /* ------------------------- the moon in the window ------------------------ */
  /* Lit side on the right while waxing, left while waning (as seen from the
     northern hemisphere). The terminator is an ellipse whose width shrinks to
     zero at first/last quarter, which is how the real shadow line looks. */

  function moonPath(cx, cy, r, illum, waxing) {
    var rx = Math.abs(2 * illum - 1) * r;
    var outer = waxing ? 1 : 0;
    var inner = (illum < 0.5) === waxing ? 0 : 1;
    return "M" + cx + " " + (cy - r) +
      " A" + r + " " + r + " 0 0 " + outer + " " + cx + " " + (cy + r) +
      " A" + rx.toFixed(2) + " " + r + " 0 0 " + inner + " " + cx + " " + (cy - r) + "Z";
  }

  function phaseName(illum, waxing) {
    if (illum < 0.03) return "new moon";
    if (illum > 0.97) return "full moon";
    if (Math.abs(illum - 0.5) < 0.04) return waxing ? "first quarter moon" : "last quarter moon";
    return (waxing ? "waxing " : "waning ") + (illum < 0.5 ? "crescent" : "gibbous");
  }

  function prettyDate(d) {
    try {
      return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" })
        .format(d).toLowerCase();
    } catch (e) { return d.toDateString().toLowerCase(); }
  }

  var lit = document.getElementById("moon-lit");
  var today = document.querySelector(".today");
  var toggle = document.querySelector(".sky-toggle");

  function render() {
    var state = window.Sky && window.Sky.state;
    var moon = state && state.moon;
    if (!moon) {
      // a pinned day/night mode has no position data; compute it anyway
      moon = window.Sky && window.Sky.compute ? window.Sky.compute().moon : null;
    }
    if (lit && moon) {
      lit.setAttribute("d", moon.illum < 0.03 ? "" : moonPath(300, 92, 38, moon.illum, moon.waxing));
    }
    if (today) {
      var bits = [prettyDate(new Date())];
      if (moon) bits.push(phaseName(moon.illum, moon.waxing) + " tonight");
      today.textContent = bits.join(" · ");
    }
    if (toggle && window.Sky) {
      toggle.textContent = "sky: " + window.Sky.mode;
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
