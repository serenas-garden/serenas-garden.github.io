/* The letter form on mailbox.html.
 *
 * Letters go to Web3Forms, which emails them to Serena. Her address is never
 * in this repo: Web3Forms holds it behind the access key in the form's hidden
 * `access_key` input. Web3Forms says that key is safe to publish, since it can
 * only deliver to her.
 *
 * Until the key is pasted in, the form is shown but closed, with a note
 * saying the mailbox opens soon. Nothing is ever sent anywhere until then.
 */
(function () {
  "use strict";

  var letter = document.querySelector(".letter");
  var form = letter && letter.querySelector("form");
  if (!form) return;

  var key = (form.elements.access_key.value || "").trim();
  var fields = form.querySelector("fieldset");
  var status = form.querySelector(".letter__status");
  var button = form.querySelector(".btn-send");

  if (!key) {
    fields.disabled = true;
    var closed = document.querySelector(".mailbox-closed");
    if (closed) closed.hidden = false;
    return;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.elements.botcheck && form.elements.botcheck.checked) return;

    button.disabled = true;
    status.textContent = "sealing the envelope…";

    fetch(form.action, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success) throw new Error(data.message || "not sent");
        form.reset();
        letter.classList.add("is-sent");
        var thanks = letter.querySelector(".letter__thanks");
        if (thanks) { thanks.setAttribute("tabindex", "-1"); thanks.focus(); }
      })
      .catch(function () {
        status.textContent = "hmm, that didn't send. check your connection and try again?";
        button.disabled = false;
      });
  });
})();
