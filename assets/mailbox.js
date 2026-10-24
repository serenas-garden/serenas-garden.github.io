/* The letter desk on mailbox.html.
 *
 * Letters go to a Google Apps Script web app (tools/mailbox-apps-script.js),
 * whose address is the form's `action`. It emails each one to Serena in one
 * styled letter format: her address lives only in the script, never in this
 * repo. Until the address is pasted in, the desk is shown but closed, with a
 * note saying the mailbox opens soon, and nothing is sent anywhere.
 *
 * Sending: the letter is checked, posted as JSON (plain text, so the browser
 * doesn't need to ask the script first), and once the script says it's sent,
 * the paper folds away, an envelope with the stamp they picked appears and
 * flies off, and a thank-you takes its place. With reduced motion it just
 * swaps. If it doesn't send, the letter stays put so nothing is lost.
 */
(function () {
  "use strict";

  var form = document.querySelector("[data-mailbox]");
  if (!form) return;
  var desk = form.parentNode;
  var paper = form.querySelector(".mail-paper");
  var status = form.querySelector(".mail-status");
  var button = form.querySelector(".mail-send");
  var sent = document.querySelector(".mail-sent");
  var flight = desk.querySelector(".mail-flight");
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  var url = (form.getAttribute("action") || "").trim();
  var open = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url);

  if (!open) {
    Array.prototype.forEach.call(form.querySelectorAll("fieldset"), function (f) { f.disabled = true; });
    var closed = form.querySelector(".mail-closed");
    if (closed) closed.hidden = false;
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    return;
  }

  // the envelope shows whichever stamp is picked
  function stampNow() {
    var picked = form.querySelector('input[name="stamp"]:checked');
    return picked ? picked.value : "tulip";
  }
  var envelope = sent.querySelector(".envelope");
  function showStamp() { envelope.setAttribute("data-stamp", stampNow()); }
  form.addEventListener("change", showStamp);
  showStamp();

  var SAYS = {
    busy: "the mailbox is a little full right now. try again in a while?",
    email: "that email address doesn't look quite right. could you check it?",
    empty: "a letter needs a few words and your name!",
    closed: "the mailbox isn't open yet. come back soon!"
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.elements.botcheck.checked) return;
    if (!form.reportValidity()) return;

    var letter = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim(),
      stamp: stampNow(),
      botcheck: ""
    };
    if (!letter.name || !letter.message) { status.textContent = SAYS.empty; return; }

    button.disabled = true;
    status.textContent = "sealing the envelope…";
    form.classList.add("is-sending");

    fetch(url, { method: "POST", body: JSON.stringify(letter) })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || !data.ok) throw new Error((data && data.error) || "trouble");
        return flyAway();
      })
      .then(function () {
        form.reset();                      // the envelope keeps their stamp till they write again
        status.textContent = "";
      })
      .catch(function (err) {
        status.textContent = SAYS[err && err.message] ||
          "hmm, that didn't send. check your connection and try again? your letter is still here.";
      })
      .then(function () {
        button.disabled = false;
        form.classList.remove("is-sending");
      });
  });

  /* ------------------------------ off it goes ------------------------------ */

  function play(el, frames, opts) {
    var a = el.animate(frames, opts);
    return a.finished.then(function () { return a; });
  }

  function flyAway() {
    if (reduce || !paper.animate) { swap(); return Promise.resolve(); }

    // a copy of the envelope, laid over the paper, does the flying
    var r = paper.getBoundingClientRect(), d = desk.getBoundingClientRect();
    var w = Math.min(300, r.width * 0.7);
    flight.innerHTML = envelope.outerHTML;
    var env = flight.firstChild;
    flight.style.left = (r.left - d.left + (r.width - w) / 2) + "px";
    flight.style.top = (r.top - d.top + r.height * 0.3) + "px";
    flight.style.width = w + "px";
    flight.hidden = false;

    var ease = "cubic-bezier(.3,.7,.2,1)";
    return play(paper, [
      { transform: "none", opacity: 1 },
      { transform: "scaleY(.34)", opacity: 1, offset: .55 },
      { transform: "translateY(40px) scale(.34, .12)", opacity: 0 }
    ], { duration: 720, easing: ease, fill: "forwards" })
      .then(function (a) {
        return play(env, [
          { transform: "scale(.5) rotate(-6deg)", opacity: 0 },
          { transform: "scale(1.06) rotate(2deg)", opacity: 1, offset: .7 },
          { transform: "scale(1) rotate(0deg)", opacity: 1 }
        ], { duration: 460, easing: "ease-out", fill: "forwards" }).then(function () { return a; });
      })
      .then(function (a) {
        return play(env, [
          { transform: "none" },
          { transform: "rotate(-4deg)", offset: .25 },
          { transform: "rotate(3deg)", offset: .5 },
          { transform: "none" }
        ], { duration: 520, fill: "forwards" }).then(function () { return a; });
      })
      .then(function (a) {
        return play(env, [
          { transform: "none", opacity: 1 },
          { transform: "translate(40px, -30px) rotate(-8deg) scale(.9)", opacity: 1, offset: .3 },
          { transform: "translate(" + Math.round(innerWidth * 0.55) + "px, -" + Math.round(innerHeight * 0.7) + "px) rotate(-24deg) scale(.4)", opacity: 0 }
        ], { duration: 1100, easing: "cubic-bezier(.5,0,.75,.4)", fill: "forwards" }).then(function () { return a; });
      })
      .then(function (a) {
        flight.hidden = true;
        flight.innerHTML = "";
        swap();
        a.cancel();
        sent.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
          { duration: 420, easing: "ease-out" });
      });
  }

  function swap() {
    form.hidden = true;
    sent.hidden = false;
    sent.focus({ preventScroll: true });
  }

  sent.querySelector(".mail-again").addEventListener("click", function () {
    sent.hidden = true;
    form.hidden = false;
    paper.getAnimations().forEach(function (a) { a.cancel(); });
    showStamp();
    form.elements.message.focus();
  });
})();
