/* "Other rooms": a little nav on every section page, so visitors can wander
 * room to room without going back through the cottage. Built from
 * sections.js, so a renamed or added section shows up everywhere at once.
 * Renders into any element with [data-rooms]; the current page is the one
 * named by <body data-section="...">.
 */
(function () {
  "use strict";

  var host = document.querySelector("[data-rooms]");
  if (!host || !window.SECTIONS) return;

  var here = document.body.getAttribute("data-section");
  var heading = document.createElement("p");
  heading.className = "eyebrow";
  heading.textContent = "wander to another room";

  var list = document.createElement("ul");
  window.SECTIONS.forEach(function (s) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = s.href || s.slug + ".html";
    a.textContent = s.title;
    if (s.href) {
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent += " \u2197";
    }
    if (s.slug === here) a.setAttribute("aria-current", "page");
    li.appendChild(a);
    list.appendChild(li);
  });

  host.appendChild(heading);
  host.appendChild(list);
  host.hidden = false;
})();
