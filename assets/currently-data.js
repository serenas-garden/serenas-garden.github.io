/* The "currently" card on the front page.
 *
 * To update: change the text in quotes and move `asOf` to today's date
 * (YYYY-MM-DD). While `sample` is true, the card labels itself as a
 * placeholder. Set it to false once these are Serena's real picks.
 */
window.CURRENTLY = {
  sample: true,
  asOf: "2026-10-05",
  items: [
    { kind: "watching",  title: "Something cozy", detail: "a show, season 1" },
    { kind: "reading",   title: "A good book",    detail: "by its author" },
    { kind: "listening", title: "A favorite song", detail: "by its artist" }
  ]
};
