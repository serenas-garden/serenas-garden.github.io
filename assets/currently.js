/* The den (currently.html): what Serena's watching, reading and listening to.
 *
 * The TV, the book and the radio are drawn in the page; everything they say
 * comes from currently-data.js. This fills in the words, hangs a card under
 * each thing on the shelf (a TV-guide clipping, a library card, a jukebox
 * strip), writes the "just finished" notepad, and makes the TV switch on, the
 * book open and the radio play. With reduced motion they all still work,
 * instantly, and the radio sends out no notes.
 */
(function () {
  "use strict";

  var data = window.CURRENTLY;
  var shelf = document.querySelector("[data-shelf]");
  if (!data || !shelf) return;

  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var live = document.querySelector("[data-den-live]");
  var KINDS = ["watching", "reading", "listening"];
  var PAST = { watching: "watched", reading: "read", listening: "listened to" };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  function say(text) { if (live) live.textContent = text; }
  // "by Joseph J. Ellis", "season 5 · New Blood", or both
  function line(item) {
    return [item.by ? "by " + item.by : "", item.detail || ""].filter(Boolean).join(" · ");
  }
  // dates are read in St. Petersburg's time zone (sky.js), like the rest of the site
  function fmt(iso, opts) {
    var d = new Date(iso + "T12:00:00");
    try {
      if (window.Sky && window.Sky.TZ) opts.timeZone = window.Sky.TZ;
      return new Intl.DateTimeFormat("en-US", opts).format(d).toLowerCase();
    } catch (e) { return ""; }
  }
  function fill(root, sel, text) {
    Array.prototype.forEach.call(root.querySelectorAll(sel), function (n) { n.textContent = text; });
  }

  /* --------------------------- what goes where --------------------------- */

  var byKind = {}, others = [];
  data.items.forEach(function (item) {
    if (KINDS.indexOf(item.kind) >= 0 && !byKind[item.kind]) byKind[item.kind] = item;
    else others.push(item);
  });

  var updated = document.querySelector("[data-updated]");
  if (updated && data.asOf) updated.textContent = "updated " + fmt(data.asOf, { month: "long", day: "numeric" });

  /* ------------------------------- the cards ------------------------------- */

  function note(item) {
    return item.note ? el("p", "card__note", item.note) : null;
  }

  var CARDS = {
    // a clipping from the TV guide
    watching: function (item) {
      var c = el("div", "card card--watching");
      var bar = el("p", "card__bar");
      bar.appendChild(el("span", "", "now watching"));
      bar.appendChild(el("span", "card__tv", "on tv"));
      c.appendChild(bar);
      c.appendChild(el("h2", "card__title", item.title));
      if (line(item)) c.appendChild(el("p", "card__line", line(item)));
      return c;
    },
    // the card from the pocket inside a library book
    reading: function (item) {
      var c = el("div", "card card--reading");
      var bar = el("p", "card__bar");
      bar.appendChild(el("span", "", "now reading"));
      bar.appendChild(el("span", "", "library card"));
      c.appendChild(bar);
      var fields = el("dl", "card__fields");
      [["title", item.title], ["author", item.by], ["", item.detail]].forEach(function (f) {
        if (!f[1]) return;
        var row = el("div", "card__field");
        row.appendChild(el("dt", "", f[0]));
        var dd = el("dd");
        dd.appendChild(el(f[0] === "title" ? "h2" : "span", f[0] === "title" ? "card__title" : "", f[1]));
        row.appendChild(dd);
        fields.appendChild(row);
      });
      c.appendChild(fields);
      var out = el("div", "card__out");
      var stamp = el("span", "card__stamp");
      stamp.appendChild(el("b", "", "on loan"));
      if (data.asOf) stamp.appendChild(el("span", "", fmt(data.asOf, { month: "short", day: "numeric", year: "numeric" })));
      out.appendChild(stamp);
      out.appendChild(el("span", "card__who", "Serena"));
      c.appendChild(out);
      return c;
    },
    // a title strip, like the ones in a jukebox
    listening: function (item) {
      var c = el("div", "card card--listening");
      c.appendChild(el("p", "card__bar", "now listening"));
      c.appendChild(el("h2", "card__title", item.title));
      if (item.by) c.appendChild(el("p", "card__band", item.by));
      if (item.detail) c.appendChild(el("p", "card__line", item.detail));
      return c;
    }
  };

  KINDS.forEach(function (kind) {
    var spot = shelf.querySelector('.spot[data-kind="' + kind + '"]');
    var item = byKind[kind];
    if (!spot) return;
    if (!item) { spot.hidden = true; return; }
    var card = CARDS[kind](item);
    var n = note(item);
    if (n) card.appendChild(n);
    spot.querySelector("[data-card]").appendChild(card);
  });

  // anything else she's into gets a pinned note
  var notes = document.querySelector("[data-notes]");
  if (notes && others.length) {
    others.forEach(function (item) {
      var li = el("li", "card card--note");
      li.appendChild(el("p", "card__bar", item.kind));
      li.appendChild(el("h2", "card__title", item.title));
      if (line(item)) li.appendChild(el("p", "card__line", line(item)));
      var n = note(item);
      if (n) li.appendChild(n);
      notes.appendChild(li);
    });
    notes.hidden = false;
  }

  /* --------------------------- the just-finished pad --------------------------- */

  var done = document.querySelector("[data-done]");
  if (done) {
    var finished = data.finished || [];
    if (finished.length) {
      var list = el("ul", "den-done__list");
      finished.forEach(function (item) {
        var li = el("li");
        li.appendChild(el("span", "den-done__tick", "✓"));
        li.appendChild(el("span", "den-done__kind", (PAST[item.kind] || item.kind) + " "));
        li.appendChild(el("b", "", item.title));
        if (line(item)) li.appendChild(el("span", "den-done__line", ", " + line(item)));
        if (item.note) li.appendChild(el("span", "den-done__note", " — " + item.note));
        list.appendChild(li);
      });
      done.appendChild(list);
    } else {
      done.appendChild(el("p", "den-done__empty", "Nothing crossed off yet! When I finish something, it moves over here."));
    }
  }

  /* ------------------------------- the TV ------------------------------- */
  /* Click and it switches on like an old set: a bright line that opens into
     the picture. The show's own scene plays on the screen (scene: "castle"),
     or a starry title card for any other show. */

  var tv = document.querySelector("[data-tv]");
  var show = byKind.watching;
  if (tv && show) {
    fill(tv, "[data-tv-title]", show.title);
    fill(tv, "[data-tv-sub]", line(show));
    if (show.title.length > 16) tv.classList.add("is-long");
    var scene = tv.querySelector('.tv__scene[data-scene="' + (show.scene || "") + '"]') ||
                tv.querySelector('.tv__scene[data-scene="stars"]');
    scene.classList.add("is-showing");
    tv.setAttribute("aria-label", "The TV, showing " + show.title);

    var offTimer = 0;
    tv.addEventListener("click", function () {
      var on = !tv.classList.contains("is-on");
      clearTimeout(offTimer);
      tv.classList.toggle("is-on", on);
      tv.classList.remove("is-off");
      tv.setAttribute("aria-pressed", on ? "true" : "false");
      if (!on && !reduce) {
        // the picture shrinks to a line, then a dot, then it's gone
        tv.classList.add("is-off");
        offTimer = setTimeout(function () { tv.classList.remove("is-off"); }, 460);
      }
      say(on ? "The TV is on: " + show.title + (line(show) ? ", " + line(show) : "") + "." : "The TV is off.");
    });
  }

  /* ------------------------------- the book ------------------------------- */
  /* It stands on the shelf; click and the cover swings open on the title page
     (Serena's bookplate inside the cover), and the candle beside it lights. */

  var book = document.querySelector("[data-book]");
  var reading = byKind.reading;
  if (book && reading) {
    var parts = reading.title.split(/:\s+/);
    fill(book, "[data-book-main]", parts[0]);
    fill(book, "[data-book-sub]", parts.slice(1).join(": "));
    fill(book, "[data-book-author]", reading.by || "");
    fill(book, "[data-book-by]", reading.by ? "by " + reading.by : "");
    if (reading.cover) book.style.setProperty("--cover", reading.cover);
    if (reading.title.length > 28) book.classList.add("is-long");
    book.setAttribute("aria-label", "The book: " + reading.title);

    var spot = book.closest(".spot");
    book.addEventListener("click", function () {
      var open = !book.classList.contains("is-open");
      book.classList.toggle("is-open", open);
      spot.classList.toggle("is-open", open);
      book.setAttribute("aria-pressed", open ? "true" : "false");
      say(open ? "The book is open at its title page." : "The book is closed.");
    });
  }

  /* ------------------------------- the radio ------------------------------- */
  /* Click and the dial lights up, the needle finds the station, the song
     scrolls along the dial, and little notes float out of the speaker. */

  var radio = document.querySelector("[data-radio]");
  var song = byKind.listening;
  if (radio && song) {
    var words = "♪ " + song.title + (song.by ? " · " + song.by : "");
    var ticker = radio.querySelector("[data-ticker]");
    ticker.appendChild(el("span", "", words));
    ticker.appendChild(el("span", "", words));      // a second copy, so the scroll loops
    radio.setAttribute("aria-label", "The radio, playing " + song.title);

    var COLOURS = ["var(--berry)", "var(--moss)", "var(--gold)", "var(--rose)", "var(--lilac)"];
    var noteTimer = 0;
    function floatNote() {
      if (document.hidden) return;
      var n = el("span", "radio__note", Math.random() < 0.5 ? "♪" : "♫");
      n.setAttribute("aria-hidden", "true");
      n.style.left = (30 + Math.random() * 40).toFixed(1) + "%";
      n.style.color = COLOURS[Math.floor(Math.random() * COLOURS.length)];
      n.style.setProperty("--dx", (Math.random() * 80 - 40).toFixed(0) + "px");
      n.style.setProperty("--rot", (Math.random() * 40 - 20).toFixed(0) + "deg");
      radio.appendChild(n);
      setTimeout(function () { n.remove(); }, 3000);
    }

    radio.addEventListener("click", function () {
      var on = !radio.classList.contains("is-on");
      radio.classList.toggle("is-on", on);
      radio.setAttribute("aria-pressed", on ? "true" : "false");
      clearInterval(noteTimer);
      if (on && !reduce) {
        floatNote();
        noteTimer = setInterval(floatNote, 700);
      }
      say(on ? "The radio is on: " + song.title + (song.by ? ", by " + song.by : "") + "." : "The radio is off.");
    });
  }
})();
