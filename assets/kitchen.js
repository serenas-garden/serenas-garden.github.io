/* The kitchen (kitchen.html). Everything it says comes from kitchen-data.js.
 *
 *  - the coffee machine brews into the glass (the first time), then her order
 *    prints out of the top on a little ticket; tap again to put it away
 *  - the oven door swings down to show a tray of cookies; tapping the cookies
 *    opens the recipe box (a <dialog>) with her favorite cookie recipes
 *  - Tabitha, the starter on the windowsill, shows her name on hover, focus
 *    or tap (the sourdough loaf does the same)
 *  - the fridge opens to her top drinks, and the fruit bowl shows her top
 *    fruits; both say "coming soon" until those lists have something in them
 *  - the range clock and the moon in the window are the real ones, read in
 *    St. Petersburg like the rest of the garden (sky.js)
 */
(function () {
  "use strict";

  var K = window.KITCHEN;
  if (!K) return;
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  function $(s, root) { return (root || document).querySelector(s); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function setText(sel, text) { var el = $(sel); if (el) el.textContent = text; }
  function list(items) {
    return "<ol>" + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>";
  }

  /* ------------------------------ the words ------------------------------ */

  setText("#k-starter-tag", K.starter.line);
  setText("#k-bread-tag", K.bread.line);

  var fruitTag = $("#k-fruit-tag");
  if (fruitTag) {
    fruitTag.innerHTML = K.fruits && K.fruits.length
      ? "<b>my top fruits</b>" + list(K.fruits)
      : "my top fruits are coming soon!";
  }
  var fridgeNote = $("#k-fridge-note");
  if (fridgeNote) {
    fridgeNote.innerHTML = K.drinks && K.drinks.length
      ? "<b>my top drinks</b>" + list(K.drinks)
      : "<b>my top drinks</b>coming soon!";
  }

  // a little cookie for each recipe in the box
  var COOKIE = {
    "chip": '<circle cx="15" cy="15" r="12" fill="#d29a56" stroke="#6b4a2a" stroke-width="1.4"/>' +
      '<g fill="#4a2f1f"><circle cx="10" cy="11" r="1.8"/><circle cx="18" cy="9" r="1.6"/><circle cx="20" cy="17" r="1.9"/><circle cx="12" cy="19" r="1.7"/><circle cx="15" cy="14" r="1.2"/></g>' +
      '<path d="M5 13 q2 -1 3 1 M22 22 q2 0 3 -2" stroke="#9c6a3a" stroke-width="1" fill="none"/>',
    "pumpkin": '<circle cx="15" cy="15" r="12" fill="#e0904a" stroke="#7a4a24" stroke-width="1.4"/>' +
      '<rect x="8" y="8" width="7" height="6" rx="2" fill="#fffaf0" stroke="#c9b48e" stroke-width=".8" transform="rotate(-12 11 11)"/>' +
      '<rect x="15" y="15" width="7" height="6" rx="2" fill="#fffaf0" stroke="#c9b48e" stroke-width=".8" transform="rotate(10 18 18)"/>' +
      '<g fill="#a85a2a"><circle cx="20" cy="10" r="1"/><circle cx="9" cy="19" r="1"/></g>',
    "brown-butter": '<circle cx="15" cy="15" r="12" fill="#c98a4a" stroke="#6b4a2a" stroke-width="1.4"/>' +
      '<g fill="#3e261a"><circle cx="11" cy="10" r="1.9"/><circle cx="19" cy="12" r="1.7"/><circle cx="13" cy="19" r="1.8"/><circle cx="20" cy="19" r="1.4"/></g>' +
      '<g fill="#fffaf0"><circle cx="16" cy="8" r=".8"/><circle cx="8" cy="15" r=".8"/><circle cx="22" cy="15" r=".7"/></g>',
    "maple": '<path d="M15 3 l2.6 5.4 l4.6 -1.6 l-1 5 l5.2 1.6 l-4.4 3.4 l1.6 4.4 l-5.2 -1.4 l-.6 6.2 h-2.2 l-.6 -6.2 l-5.2 1.4 l1.6 -4.4 l-4.4 -3.4 l5.2 -1.6 l-1 -5 l4.6 1.6 z" fill="#e3b04f" stroke="#8a5a1e" stroke-width="1.3" stroke-linejoin="round"/>' +
      '<path d="M15 8 v14" stroke="#b07a2e" stroke-width="1"/>'
  };
  var box = $("[data-cookies]");
  if (box) {
    var anyDetail = false;
    box.innerHTML = K.cookies.map(function (c) {
      var name = c.link
        ? '<a href="' + esc(c.link) + '" target="_blank" rel="noopener">' + esc(c.name) + "</a>"
        : esc(c.name);
      if (c.link || c.note) anyDetail = true;
      return "<li>" +
        '<svg viewBox="0 0 30 30" aria-hidden="true" focusable="false">' + (COOKIE[c.icon] || COOKIE.chip) + "</svg>" +
        '<span class="recipe-card__name">' + name +
        (c.note ? '<span class="recipe-card__note">' + esc(c.note) + "</span>" : "") +
        "</span></li>";
    }).join("");
    var soon = $("[data-cookies-soon]");
    if (soon) soon.hidden = anyDetail;
  }

  /* --------------------------- the coffee machine --------------------------- */

  var coffee = $(".k-coffee"), coffeeBtn = $(".k-coffee__btn"), ticket = $("#k-ticket");
  var brewed = false, brewTimer = 0;   // brewed: the glass is full

  function ticketHTML() {
    return '<p class="k-ticket__title">' + esc(K.coffee.title) + "</p>" +
      K.coffee.lines.map(function (l) { return '<p class="k-ticket__line">' + esc(l) + "</p>"; }).join("") +
      '<span class="k-ticket__heart" aria-hidden="true">♥ ♥ ♥</span>';
  }
  function showTicket() {
    ticket.innerHTML = ticketHTML();                // filled now, so it's announced now
    coffee.classList.add("is-ticket");
  }
  if (coffee && coffeeBtn && ticket) {
    coffeeBtn.addEventListener("click", function () {
      if (coffee.classList.contains("is-brewing")) return;      // it's pouring; the ticket's coming
      if (coffeeBtn.getAttribute("aria-expanded") === "true") {
        coffee.classList.remove("is-ticket");
        coffeeBtn.setAttribute("aria-expanded", "false");
        ticket.innerHTML = "";
        return;
      }
      coffeeBtn.setAttribute("aria-expanded", "true");
      if (brewed || reduce) {                                    // the cup's already full
        brewed = true;
        coffee.classList.add("is-ready");
        showTicket();
        return;
      }
      coffee.classList.add("is-brewing");
      coffeeBtn.setAttribute("aria-busy", "true");
      brewTimer = setTimeout(function () {
        coffee.classList.remove("is-brewing");
        coffee.classList.add("is-ready");
        coffeeBtn.removeAttribute("aria-busy");
        brewed = true;
        brewTimer = setTimeout(showTicket, 420);
      }, 2100);
    });
  }

  /* -------------------------------- the oven -------------------------------- */

  var range = $(".k-range"), ovenBtn = $(".k-oven__toggle"), tray = $(".k-oven__tray");
  var dialog = $("#k-recipes");

  function setOven(open) {
    range.classList.toggle("is-open", open);
    ovenBtn.setAttribute("aria-expanded", open ? "true" : "false");
    ovenBtn.querySelector(".visually-hidden").textContent = open ? "Close the oven" : "Open the oven";
    tray.tabIndex = open ? 0 : -1;
  }
  if (range && ovenBtn && tray) {
    ovenBtn.addEventListener("click", function () { setOven(!range.classList.contains("is-open")); });
    tray.addEventListener("click", function () {
      if (!dialog) return;
      if (dialog.showModal) {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    });
  }
  if (dialog) {
    // clicking the dim backdrop closes it too
    dialog.addEventListener("click", function (e) { if (e.target === dialog && dialog.close) dialog.close(); });
    dialog.addEventListener("close", function () { if (tray) tray.focus(); });
  }

  /* ------------------------------- the fridge ------------------------------- */

  var fridge = $(".k-fridge"), fridgeBtn = $(".k-fridge__btn");
  if (fridge && fridgeBtn) {
    fridgeBtn.addEventListener("click", function () {
      var open = !fridge.classList.contains("is-open");
      fridge.classList.toggle("is-open", open);
      fridgeBtn.setAttribute("aria-expanded", open ? "true" : "false");
      fridgeBtn.querySelector(".visually-hidden").textContent = open
        ? "Close the fridge" : "Open the fridge: my top drinks";
    });
  }

  /* ------------------ Tabitha, the bread, the fruit bowl ------------------ */
  // On a phone there's no hover, so a tap shows the tag (and a second tap,
  // or a tap anywhere else, hides it).

  var tappers = [$(".k-starter"), $(".k-bread"), $(".k-fruit")].filter(Boolean);
  tappers.forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.stopPropagation();
      var on = !el.classList.contains("is-on");
      tappers.forEach(function (o) { if (o !== el) setOn(o, false); });
      setOn(el, on);
    });
  });
  function setOn(el, on) {
    el.classList.toggle("is-on", on);
    if (el.hasAttribute("aria-expanded")) el.setAttribute("aria-expanded", on ? "true" : "false");
  }
  document.addEventListener("click", function () { tappers.forEach(function (o) { setOn(o, false); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") tappers.forEach(function (o) { setOn(o, false); });
  });

  /* ---------------------- the clock and the moon (real) ---------------------- */

  var hourHand = $(".k-clock__h"), minHand = $(".k-clock__m");
  function tick() {
    if (!hourHand || !minHand) return;
    var h = 0, m = 0;
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: (window.Sky && window.Sky.TZ) || undefined, hour: "numeric", minute: "numeric", hourCycle: "h23"
      }).formatToParts(new Date());
      parts.forEach(function (p) { if (p.type === "hour") h = +p.value; if (p.type === "minute") m = +p.value; });
    } catch (e) {
      var d = new Date(); h = d.getHours(); m = d.getMinutes();
    }
    hourHand.setAttribute("transform", "rotate(" + ((h % 12) * 30 + m * 0.5) + " 123 30)");
    minHand.setAttribute("transform", "rotate(" + m * 6 + " 123 30)");
  }
  tick();
  setInterval(tick, 20000);

  // the lit part of the moon, the same way the cottage window draws it
  function moonPath(cx, cy, r, illum, litRight) {
    var rx = Math.abs(2 * illum - 1) * r;
    var outer = litRight ? 1 : 0;
    var inner = (illum < 0.5) === litRight ? 0 : 1;
    return "M" + cx + " " + (cy - r) +
      " A" + r + " " + r + " 0 0 " + outer + " " + cx + " " + (cy + r) +
      " A" + rx.toFixed(2) + " " + r + " 0 0 " + inner + " " + cx + " " + (cy - r) + "Z";
  }
  function moon() {
    // compute() always has the real moon, even when the light switch has pinned the sky
    var el = $("#k-moon"), mo = null;
    try { mo = window.Sky && window.Sky.compute && window.Sky.compute().moon; } catch (e) {}
    if (!el || !mo || typeof mo.illum !== "number") return;
    el.setAttribute("d", moonPath(244, 62, 26, mo.illum, mo.waxing));
  }
  moon();
  setInterval(moon, 600000);
})();
