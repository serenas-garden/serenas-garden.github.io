/* A postage stamp, as an SVG string: perforated paper, one of the little
 * scenes from travels-stamps.js, a value in the corner and a caption.
 * Used by the travels postcards (travels.js) and the Where's Serena? game
 * (travel-game.js). Styled under ".stamp" in style.css.
 *
 *   stampSvg(key, caption, value)   key: a scene in TRAVEL_STAMPS
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // a stamp's perforated edge: a rectangle with half-round bites all the way round
  function perforated(w, h, r, pitch) {
    var d = "M0 0", nx = Math.round(w / pitch), ny = Math.round(h / pitch), sx = w / nx, sy = h / ny, i;
    for (i = 0; i < nx; i++) d += " L" + (i * sx + sx / 2 - r) + " 0 A" + r + " " + r + " 0 0 0 " + (i * sx + sx / 2 + r) + " 0";
    d += " L" + w + " 0";
    for (i = 0; i < ny; i++) d += " L" + w + " " + (i * sy + sy / 2 - r) + " A" + r + " " + r + " 0 0 0 " + w + " " + (i * sy + sy / 2 + r);
    d += " L" + w + " " + h;
    for (i = nx - 1; i >= 0; i--) d += " L" + (i * sx + sx / 2 + r) + " " + h + " A" + r + " " + r + " 0 0 0 " + (i * sx + sx / 2 - r) + " " + h;
    d += " L0 " + h;
    for (i = ny - 1; i >= 0; i--) d += " L0 " + (i * sy + sy / 2 + r) + " A" + r + " " + r + " 0 0 0 0 " + (i * sy + sy / 2 - r);
    return d + " Z";
  }
  var EDGE = perforated(72, 86, 2.3, 7.2);

  window.stampSvg = function (key, caption, value) {
    var STAMPS = window.TRAVEL_STAMPS || {};
    var art = STAMPS[key] || STAMPS.toadstool || "";
    return '<svg class="stamp" viewBox="-2 -2 76 90" aria-hidden="true" focusable="false">' +
      '<path class="stamp__paper" d="' + EDGE + '"/>' +
      '<svg x="6" y="6" width="60" height="52" viewBox="0 0 60 52" class="stamp__art">' + art + "</svg>" +
      '<rect x="6" y="6" width="60" height="52" class="pc-k stamp__frame"/>' +
      '<text class="stamp__value" x="10" y="16">' + esc(value) + "</text>" +
      '<text class="stamp__caption" x="36" y="71">' + esc(caption) + "</text>" +
      '<text class="stamp__post" x="36" y="79.5">garden post</text>' +
      "</svg>";
  };
})();
