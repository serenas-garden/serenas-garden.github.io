/* What Serena's into right now. The corkboard on the front page and the den
 * (currently.html) both read this file.
 *
 * To update: change the words in quotes and move `asOf` to today's date
 * (YYYY-MM-DD). When she finishes something, move it to the top of
 * `finished` and put what she's on now in its place.
 *
 * Each item:
 *   kind    "watching", "reading" or "listening". The den has a TV, a book
 *           and a radio for these; any other kind gets a pinned note.
 *   title   what it is
 *   by      optional: the author, or the artist
 *   detail  optional: a little more (a season, an album)
 *   note    optional: Serena's own words about it, handwritten on its card
 *   scene   optional, for shows: what's on the TV screen. "castle", or
 *           leave it out for a starry title card.
 *   cover   optional, for books: the colour of its cloth cover in the den
 *
 * While `sample` is true, the corkboard labels itself as a placeholder.
 */
window.CURRENTLY = {
  sample: false,
  asOf: "2026-10-27",
  items: [
    { kind: "watching",  title: "The Traitors", detail: "season 5 · New Blood", scene: "castle" },
    { kind: "reading",   title: "His Excellency: George Washington", by: "Joseph J. Ellis", cover: "#2a4466" },
    { kind: "listening", title: "Lies", by: "Zach Bryan & Lana Del Rey" }
  ],
  // what she just finished, newest first (same fields as above)
  finished: [
    { kind: "watching", title: "The Mindy Project" }
  ]
};
