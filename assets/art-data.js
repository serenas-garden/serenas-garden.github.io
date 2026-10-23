/* Serena's art, for the gallery (art.html).
 *
 * Pieces hang in this order: left to right, row by row. Add a piece by
 * adding an entry; the wall rearranges itself.
 *
 *   id          a short name for links (art.html#moon-garden): lowercase
 *               letters, numbers and dashes
 *   title       its title
 *   year        when she made it
 *   medium      what it's made with, e.g. "watercolor on paper"
 *   size        optional: its real size, e.g. "9 × 12 in"
 *   note        optional: Serena's own words about it (shown full screen)
 *   alt         a short description of what's in it, for screen readers
 *   src         the picture on the wall (about 1200px on its long side)
 *   full        optional: a bigger one for full screen (about 2400px);
 *               the wall picture is used if this is left out
 *   w, h        the picture's size in pixels (so the wall can be laid out
 *               before the pictures load)
 *   frame       optional: oak, walnut, gilt, cream, ink, sage or rose;
 *               one is picked if it's left out. (Rex's plan: once the
 *               pictures are in, each gets its own frame made to suit it.)
 *   collection  optional: a group, e.g. "sketchbook". Once two or more
 *               groups exist, the gallery gets buttons to show one group
 *
 * Pictures go in assets/art/ with their location data stripped (see
 * CLAUDE.md). They're public files once pushed, like everything here.
 *
 * `sample: true` means these are empty placeholder frames, waiting for her
 * art; the gallery labels itself as a placeholder until it's set to false.
 */
window.ART = {
  sample: true,
  pieces: [
    { id: "frame-1",  w: 3, h: 4 },
    { id: "frame-2",  w: 4, h: 3 },
    { id: "frame-3",  w: 1, h: 1 },
    { id: "frame-4",  w: 4, h: 5 },
    { id: "frame-5",  w: 2, h: 3 },
    { id: "frame-6",  w: 3, h: 2 },
    { id: "frame-7",  w: 5, h: 7 },
    { id: "frame-8",  w: 5, h: 4 },
    { id: "frame-9",  w: 16, h: 9 },
    { id: "frame-10", w: 3, h: 4 },
    { id: "frame-11", w: 1, h: 1 },
    { id: "frame-12", w: 7, h: 5 },
    { id: "frame-13", w: 4, h: 5 },
    { id: "frame-14", w: 9, h: 16 },
    { id: "frame-15", w: 4, h: 3 },
    { id: "frame-16", w: 2, h: 3 },
    { id: "frame-17", w: 6, h: 5 },
    { id: "frame-18", w: 3, h: 4 }
  ]
};
