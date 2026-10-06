/* Gemma's kit: her drawing and her petting, shared by every page she's on.
 *
 * The cottage (gemma.js) and every room she follows you into
 * (gemma-follow.js) draw her from GemmaKit.art, so she looks the same
 * everywhere: change her here, once. Keep her accurate (see CLAUDE.md,
 * Gemma): white chest, legs and paws; seal-brown ears, mask, back and plumed
 * tail; a white inverted V down her face; blue eyes; a rose collar with a
 * gold heart tag.
 *
 * Poses (picked with data-pose on the button): walk (side view, also used
 * for jump and, with her head dipped, eat), sit (front view, with a yawn)
 * and sleep (curled up, with drifting z's).
 */
(function () {
  "use strict";

  var ART = [
    "<!-- walking and jumping: side view, facing right -->",
    "<g class=\"g-pose g-walk\">",
    "<ellipse class=\"g-shadow g-walk-shadow\" cx=\"60\" cy=\"78.6\" rx=\"38\" ry=\"2.6\"/>",
    "<g class=\"g-walk-core\">",
    "<path class=\"g-tail\" d=\"M28 44 C12 43 3 31 7 16 C9 8 17 5 20 11 C15 19 18 31 31 37 Z\" fill=\"#5b4334\" stroke=\"#3d2f27\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/>",
    "<path d=\"M10 22 C9 16 13 11 17 11\" fill=\"none\" stroke=\"#7b5d4a\" stroke-width=\"1.6\" stroke-linecap=\"round\"/>",
    "<rect class=\"g-leg g-leg-b g-back\" x=\"30\" y=\"52\" width=\"9\" height=\"25\" rx=\"4.5\" fill=\"#e8ded1\" stroke=\"#3d2f27\" stroke-width=\"1.2\"/>",
    "<rect class=\"g-leg g-leg-a g-front\" x=\"80\" y=\"52\" width=\"9\" height=\"25\" rx=\"4.5\" fill=\"#e8ded1\" stroke=\"#3d2f27\" stroke-width=\"1.2\"/>",
    "<path d=\"M24 45 C24 31 40 27 60 28 C79 29 93 33 95 47 C96 57 86 63 60 63 C38 63 24 59 24 45 Z\" fill=\"#fbf7f0\" stroke=\"#3d2f27\" stroke-width=\"1.4\"/>",
    "<path d=\"M25 42 C28 32 43 28 60 28.6 C77 29.2 89 32 92 41 C82 37 71 39 60 41 C48 43 36 45 25 42 Z\" fill=\"#5b4334\"/>",
    "<path d=\"M34 34 C44 31 56 30.5 66 31\" fill=\"none\" stroke=\"#7b5d4a\" stroke-width=\"1.4\" stroke-linecap=\"round\"/>",
    "<rect class=\"g-leg g-leg-a g-back\" x=\"40\" y=\"53\" width=\"10\" height=\"25\" rx=\"5\" fill=\"#fbf7f0\" stroke=\"#3d2f27\" stroke-width=\"1.3\"/>",
    "<rect class=\"g-leg g-leg-b g-front\" x=\"74\" y=\"53\" width=\"10\" height=\"25\" rx=\"5\" fill=\"#fbf7f0\" stroke=\"#3d2f27\" stroke-width=\"1.3\"/>",
    "<path d=\"M86 37 C98 40 100 52 94 58 C90 60 86 58 84 54 Z\" fill=\"#fbf7f0\"/>",
    "<g class=\"g-head\">",
    "<path d=\"M103 19 L109 5 L113 21 Z\" fill=\"#4a362a\" stroke=\"#3d2f27\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/>",
    "<circle cx=\"100\" cy=\"30\" r=\"14\" fill=\"#fbf7f0\" stroke=\"#3d2f27\" stroke-width=\"1.4\"/>",
    "<path d=\"M86.5 27 C88 17 98 14 106 17 C109.5 20 108.5 25 105.5 28.5 C102 31.5 98 33 94 33 C90 32 87 30 86.5 27 Z\" fill=\"#5b4334\"/>",
    "<path d=\"M89 23 L90.5 6 L101 17 Z\" fill=\"#5b4334\" stroke=\"#3d2f27\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/>",
    "<path d=\"M91.5 18 L92 10 L97.5 16 Z\" fill=\"#e8a3a6\"/>",
    "<ellipse cx=\"103\" cy=\"25.5\" rx=\"2.7\" ry=\"3.1\" fill=\"#5b9bd5\"/>",
    "<ellipse cx=\"103.6\" cy=\"25.6\" rx=\".9\" ry=\"2.2\" fill=\"#1f2a33\"/>",
    "<circle cx=\"104.2\" cy=\"24.4\" r=\".7\" fill=\"#fff\"/>",
    "<path d=\"M111.6 30.4 l2.6 -.4 l-.9 2.4 z\" fill=\"#e8a3a6\"/>",
    "<path d=\"M112.8 33 q-2 2 -4.2 1\" fill=\"none\" stroke=\"#3d2f27\" stroke-width=\".9\" stroke-linecap=\"round\"/>",
    "<path d=\"M107 32 l13 -3 M107 33.6 l13 1.2\" stroke=\"#c9c1b6\" stroke-width=\".7\"/>",
    "</g>",
    "<path d=\"M87 39.5 q7 5.5 14 2\" fill=\"none\" stroke=\"#d99a9e\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>",
    "<circle cx=\"94.5\" cy=\"44.6\" r=\"2.3\" fill=\"#d9a441\" stroke=\"#9c7124\" stroke-width=\".6\"/>",
    "</g>",
    "</g>",
    "<!-- sitting: facing you, tail wrapped round her paws -->",
    "<g class=\"g-pose g-sit\">",
    "<ellipse class=\"g-shadow\" cx=\"62\" cy=\"78.4\" rx=\"30\" ry=\"2.6\"/>",
    "<path d=\"M40 77.5 C32 76.5 30.5 65 37 60.5 C42.5 57 47 62 47 70 L47 77.5 Z\" fill=\"#5b4334\" stroke=\"#3d2f27\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/>",
    "<path d=\"M80 77.5 C88 76.5 89.5 65 83 60.5 C77.5 57 73 62 73 70 L73 77.5 Z\" fill=\"#5b4334\" stroke=\"#3d2f27\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/>",
    "<path d=\"M41 77 C37 62 41 46 50 39 L70 39 C79 46 83 62 79 77 Z\" fill=\"#fbf7f0\" stroke=\"#3d2f27\" stroke-width=\"1.4\"/>",
    "<path d=\"M41.6 76 C38 62 42 47 50 40 C47 52 47 65 49 76 Z\" fill=\"#5b4334\"/>",
    "<path d=\"M78.4 76 C82 62 78 47 70 40 C73 52 73 65 71 76 Z\" fill=\"#5b4334\"/>",
    "<rect x=\"50\" y=\"54\" width=\"8.6\" height=\"23\" rx=\"4.3\" fill=\"#fbf7f0\" stroke=\"#3d2f27\" stroke-width=\"1.2\"/>",
    "<rect x=\"61.4\" y=\"54\" width=\"8.6\" height=\"23\" rx=\"4.3\" fill=\"#fbf7f0\" stroke=\"#3d2f27\" stroke-width=\"1.2\"/>",
    "<path d=\"M53.2 74.5 v2.4 M55.6 74.5 v2.4 M64.6 74.5 v2.4 M67 74.5 v2.4\" stroke=\"#c9bfb2\" stroke-width=\".8\" stroke-linecap=\"round\"/>",
    "<path class=\"g-sit-tail\" d=\"M72 76.5 C90 77 99 67 93 58 C90 54 85 56 86.5 61 C88.5 68 82 72 68 72.5 Z\" fill=\"#5b4334\" stroke=\"#3d2f27\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/>",
    "<path d=\"M48.5 41 q2.6 4.4 5.4 1 q2.6 4.8 6.1 1.2 q3.5 4.6 6.1 -1.2 q2.8 3.4 5.4 -1 C72 47 68.5 54.5 60 55.5 C51.5 54.5 48 47 48.5 41 Z\" fill=\"#fbf7f0\"/>",
    "<path d=\"M55 47 q1.5 1.6 3 0 M62 47 q1.5 1.6 3 0 M58.5 51 q1.5 1.6 3 0\" fill=\"none\" stroke=\"#d8cdbf\" stroke-width=\".9\" stroke-linecap=\"round\"/>",
    "<path d=\"M47 19 L44 3 L57 12 Z\" fill=\"#5b4334\" stroke=\"#3d2f27\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/>",
    "<path d=\"M48.3 16 L46.6 8 L53.6 12.5 Z\" fill=\"#e8a3a6\"/>",
    "<path d=\"M73 19 L76 3 L63 12 Z\" fill=\"#5b4334\" stroke=\"#3d2f27\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/>",
    "<path d=\"M71.7 16 L73.4 8 L66.4 12.5 Z\" fill=\"#e8a3a6\"/>",
    "<path d=\"M43 28 C43 16 51 10.5 60 10.5 C69 10.5 77 16 77 28 C77 35 73 40 60 41 C47 40 43 35 43 28 Z\" fill=\"#fbf7f0\" stroke=\"#3d2f27\" stroke-width=\"1.4\"/>",
    "<path d=\"M60 10.6 C52 10.6 43.6 15.5 43.2 26 C43.5 31 47 35 52.5 38 L60 15 Z\" fill=\"#5b4334\"/>",
    "<path d=\"M60 10.6 C68 10.6 76.4 15.5 76.8 26 C76.5 31 73 35 67.5 38 L60 15 Z\" fill=\"#5b4334\"/>",
    "<g class=\"g-eyes\">",
    "<ellipse cx=\"52.6\" cy=\"25\" rx=\"3.4\" ry=\"3.8\" fill=\"#5b9bd5\"/>",
    "<ellipse cx=\"52.6\" cy=\"25.3\" rx=\"1.1\" ry=\"2.6\" fill=\"#1f2a33\"/>",
    "<circle cx=\"53.7\" cy=\"23.6\" r=\".9\" fill=\"#fff\"/>",
    "<ellipse cx=\"67.4\" cy=\"25\" rx=\"3.4\" ry=\"3.8\" fill=\"#5b9bd5\"/>",
    "<ellipse cx=\"67.4\" cy=\"25.3\" rx=\"1.1\" ry=\"2.6\" fill=\"#1f2a33\"/>",
    "<circle cx=\"68.5\" cy=\"23.6\" r=\".9\" fill=\"#fff\"/>",
    "</g>",
    "<path d=\"M58 30 h4 l-2 2.6 z\" fill=\"#e8a3a6\"/>",
    "<path d=\"M60 32.6 q-1.8 2 -3.6 1 M60 32.6 q1.8 2 3.6 1\" fill=\"none\" stroke=\"#3d2f27\" stroke-width=\".9\" stroke-linecap=\"round\"/>",
    "<ellipse class=\"g-yawn\" cx=\"60\" cy=\"34.6\" rx=\"2.5\" ry=\"2.4\" fill=\"#e8a3a6\" stroke=\"#3d2f27\" stroke-width=\".8\"/>",
    "<path d=\"M54 32 L40 29.5 M54 33.6 L40 34.2 M66 32 L80 29.5 M66 33.6 L80 34.2\" stroke=\"#c9c1b6\" stroke-width=\".7\"/>",
    "<path d=\"M50 40.6 Q60 45.6 70 40.6\" fill=\"none\" stroke=\"#d99a9e\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>",
    "<circle cx=\"60\" cy=\"44.8\" r=\"2.3\" fill=\"#d9a441\" stroke=\"#9c7124\" stroke-width=\".6\"/>",
    "</g>",
    "<!-- sleeping: curled up, tail round the front, nose on her paws -->",
    "<g class=\"g-pose g-sleep\">",
    "<ellipse class=\"g-shadow\" cx=\"58\" cy=\"79\" rx=\"42\" ry=\"2.4\"/>",
    "<g class=\"g-sleep-core\">",
    "<path d=\"M20 77 C14 63 26 50 50 48 C74 46 96 53 99 68 C100 75 97 77.5 90 77.5 Z\" fill=\"#fbf7f0\" stroke=\"#3d2f27\" stroke-width=\"1.4\"/>",
    "<path d=\"M21 75 C16 62 28 50.5 50 48.6 C72 46.8 92 52 96 63 C80 59 60 60 42 65 C33 68 26 71 21 75 Z\" fill=\"#5b4334\"/>",
    "<path d=\"M30 58 C40 53 52 51.5 62 51.5\" fill=\"none\" stroke=\"#7b5d4a\" stroke-width=\"1.4\" stroke-linecap=\"round\"/>",
    "<path d=\"M22 74 C34 82 64 82.5 82 77\" fill=\"none\" stroke=\"#3d2f27\" stroke-width=\"9.6\" stroke-linecap=\"round\"/>",
    "<path d=\"M22 74 C34 82 64 82.5 82 77\" fill=\"none\" stroke=\"#5b4334\" stroke-width=\"7.4\" stroke-linecap=\"round\"/>",
    "<ellipse cx=\"85\" cy=\"75.5\" rx=\"6\" ry=\"3.2\" fill=\"#fbf7f0\" stroke=\"#3d2f27\" stroke-width=\"1.1\"/>",
    "<path d=\"M76.5 57 L76 42.5 L86 50.5 Z\" fill=\"#5b4334\" stroke=\"#3d2f27\" stroke-width=\"1.1\" stroke-linejoin=\"round\"/>",
    "<path d=\"M90 50.5 L98 40 L99.6 54 Z\" fill=\"#5b4334\" stroke=\"#3d2f27\" stroke-width=\"1.1\" stroke-linejoin=\"round\"/>",
    "<circle cx=\"88\" cy=\"62\" r=\"12.5\" fill=\"#fbf7f0\" stroke=\"#3d2f27\" stroke-width=\"1.4\"/>",
    "<path d=\"M88 49.6 C81 49.6 75.7 54 75.5 61 C76 65 78.5 68 82 70 L88 53 Z\" fill=\"#5b4334\"/>",
    "<path d=\"M88 49.6 C95 49.6 100.3 54 100.5 61 C100 65 97.5 68 94 70 L88 53 Z\" fill=\"#5b4334\"/>",
    "<path d=\"M79.6 61 q2.6 2.2 5.2 0 M91.2 61 q2.6 2.2 5.2 0\" fill=\"none\" stroke=\"#efe3d3\" stroke-width=\"1.3\" stroke-linecap=\"round\"/>",
    "<path d=\"M86.6 65.2 h2.8 l-1.4 1.8 z\" fill=\"#e8a3a6\"/>",
    "</g>",
    "<text class=\"g-z\" x=\"100\" y=\"44\">z</text>",
    "<text class=\"g-z g-z2\" x=\"106\" y=\"36\">z</text>",
    "<text class=\"g-z g-z3\" x=\"112\" y=\"28\">z</text>",
    "</g>"
  ].join("");

  var SAYS = ["mrrp!", "prrrrr", "mew!", "\u2665 prrr \u2665", "mrrrow?"];
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  // the whole cat: a button holding her drawing and a speech bubble
  function button(label) {
    return '<button class="gemma" type="button" data-pose="sleep" aria-label="' +
      (label || "Gemma the cat. Give her a pet!") + '">' +
      '<svg class="gemma__body" viewBox="0 0 120 80" aria-hidden="true">' + ART + "</svg>" +
      '<span class="gemma__bubble" aria-hidden="true"></span></button>';
  }

  // click or tap: a "mrrp!" and floating hearts (asleep, she only stirs)
  function petting(cat, live) {
    var bubble = cat.querySelector(".gemma__bubble"), timer = 0;
    function reply(text) {
      bubble.textContent = text;
      bubble.classList.add("is-on");
      clearTimeout(timer);
      timer = setTimeout(function () { bubble.classList.remove("is-on"); }, 1700);
    }
    function hearts() {
      for (var i = 0; i < 3; i++) {
        var h = document.createElement("span");
        h.className = "gemma__heart";
        h.textContent = "\u2665";
        h.style.setProperty("--hx", (30 + i * 20 + (Math.random() * 12 - 6)).toFixed(0) + "%");
        h.style.setProperty("--hd", (Math.random() * 28 - 14).toFixed(0) + "px");
        h.style.animationDelay = (i * 0.12) + "s";
        cat.appendChild(h);
        setTimeout(h.remove.bind(h), 1800);
      }
    }
    cat.addEventListener("click", function () {
      if (cat.getAttribute("data-pose") === "sleep") {
        reply("mrrp\u2026 zzz");
        if (live) live.textContent = "Gemma stirs in her sleep.";
      } else {
        reply(SAYS[Math.floor(Math.random() * SAYS.length)]);
        if (live) live.textContent = "Gemma purrs.";
        if (!reduce) hearts();
      }
    });
  }

  window.GemmaKit = { art: ART, button: button, petting: petting };
})();
