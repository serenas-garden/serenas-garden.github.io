/* Serena's art, for the gallery (art.html).
 *
 * Pieces hang in this order: left to right, row by row. Add a piece by
 * adding an entry; the wall rearranges itself.
 *
 *   id          a short name for links (art.html#moonlit-sea): lowercase
 *               letters, numbers and dashes. It's only a name for the link,
 *               not a title, so it can stay when she titles the piece
 *   title       its title; left empty, the label just gives the date and
 *               medium
 *   year        when she made it
 *   medium      what it's made with, e.g. "watercolor"
 *   size        optional: its real size, e.g. "9 × 12 in"
 *   note        optional: Serena's own words about it (shown full screen)
 *   alt         what's in it, for screen readers
 *   src, full   the picture on the wall and the full-screen one, made by
 *               tools/prepare_art.py (which also strips location data)
 *   w, h        the full picture's size in pixels (for laying out the wall
 *               before the pictures load)
 *   frame       its frame: one made for it (.frame--<name> in style.css),
 *               or a stock one: oak, walnut, gilt, cream, ink, sage, rose
 *   tone        the colour of the dark behind it when it's full screen
 *   fx          its little animation, played when you point at it on the
 *               wall and all the time full screen. Positions are fractions
 *               of the picture (0..1, from the top left); see art.js.
 *   collection  optional: a group, e.g. "sketchbook". Once two or more
 *               groups exist, the gallery gets buttons to show one group
 *
 * Adding a piece: python3 tools/prepare_art.py <image> <id>, then an entry
 * here with the size it prints.
 *
 * October 2026: Rex sent these 18 untitled. Serena will title them. The
 * years and mediums are Claude's guesses from the pictures, for her to
 * correct.
 */
window.ART = {
  sample: false,
  pieces: [
    {
      id: "moonlit-sea", title: "", year: 2026, medium: "watercolor and gold paint",
      alt: "A full moon in metallic gold glowing through dark blue clouds, its golden reflection running down a calm night sea.",
      src: "assets/art/moonlit-sea.jpg", full: "assets/art/moonlit-sea-full.jpg", w: 1904, h: 1320,
      frame: "moonlit-sea", tone: "#17223a",
      fx: [{ type: "glow", x: .505, y: .255, r: .13, color: "#fff1c4" },
           { type: "glints", area: [.4, .61, .62, .99], n: 26, color: "#ffe7a6" }]
    },
    {
      id: "beach-umbrella", title: "", year: 2025, medium: "gouache",
      alt: "A beach in thick, bright paint: a lavender sky, rows of blue and green waves, two big rocks in the surf, and a red umbrella on the sand.",
      src: "assets/art/beach-umbrella.jpg", full: "assets/art/beach-umbrella-full.jpg", w: 1120, h: 1645,
      frame: "beach-umbrella", tone: "#2a2734",
      fx: [{ type: "glints", area: [0, .2, 1, .58], n: 22, color: "#ffffff" }]
    },
    {
      id: "rabbits-in-canoe", title: "", year: 2026, medium: "watercolor",
      alt: "Two rabbits in a red-brown canoe on a green river, one of them paddling, between tall banks of reeds under a pale blue sky.",
      src: "assets/art/rabbits-in-canoe.jpg", full: "assets/art/rabbits-in-canoe-full.jpg", w: 1772, h: 1260,
      frame: "rabbits-in-canoe", tone: "#172821",
      fx: [{ type: "ripples", points: [[.565, .895, .1], [.31, .86, .13], [.72, .855, .11]] },
           { type: "glints", area: [0, .87, 1, .99], n: 8, color: "#e8f4ee" },
           { type: "glints", area: [0, .74, .26, .86], n: 3, color: "#e8f4ee" },
           { type: "glints", area: [.77, .73, 1, .85], n: 3, color: "#e8f4ee" }]
    },
    {
      id: "mountain-skiers", title: "", year: 2026, medium: "watercolor",
      alt: "A snowy mountain painted in bold blues, with pine trees down the slopes and two small skiers heading downhill.",
      src: "assets/art/mountain-skiers.jpg", full: "assets/art/mountain-skiers-full.jpg", w: 1250, h: 1720,
      frame: "mountain-skiers", tone: "#0d2433",
      fx: [{ type: "snow", n: 42 }]
    },
    {
      id: "cherry-blossoms", title: "", year: 2026, medium: "watercolor and gouache",
      alt: "Branches of pale pink cherry blossom reaching across a soft blue sky.",
      src: "assets/art/cherry-blossoms.jpg", full: "assets/art/cherry-blossoms-full.jpg", w: 1440, h: 960,
      frame: "cherry-blossoms", tone: "#1a2535",
      fx: [{ type: "petals", n: 16 }]
    },
    {
      id: "undersea-life", title: "", year: 2025, medium: "watercolor and gouache",
      alt: "An underwater scene on a soft blue wash: yellow and blue striped fish, little orange fish, a purple seahorse, a red octopus and green seaweed.",
      src: "assets/art/undersea-life.jpg", full: "assets/art/undersea-life-full.jpg", w: 1820, h: 1280,
      frame: "undersea-life", tone: "#10302f",
      fx: [{ type: "bubbles", area: [.08, .12, .92, .84], n: 16 }]
    },
    {
      id: "child-on-moon", title: "", year: 2026, medium: "acrylic on canvas",
      alt: "A little fairy with wings and golden hair sitting on a pale yellow crescent moon and holding a star, in a deep blue night sky with small gold stars.",
      src: "assets/art/child-on-moon.jpg", full: "assets/art/child-on-moon-full.jpg", w: 1440, h: 1820,
      frame: "child-on-moon", tone: "#0e1c2c",
      fx: [{ type: "glow", x: .62, y: .49, r: .09, color: "#ffe98a" },
           { type: "twinkle", points: [[.84, .205, .04], [.62, .49, .085], [.74, .81, .05], [.105, .935, .045], [.62, .935, .045], [.41, .955, .04]], color: "#fff4bf" }]
    },
    {
      id: "green-meadow", title: "", year: 2025, medium: "watercolor",
      alt: "A meadow of rich greens and dark shrubs dotted with pink flowers, under a sky of blue and pink cloud shapes.",
      src: "assets/art/green-meadow.jpg", full: "assets/art/green-meadow-full.jpg", w: 1890, h: 1320,
      frame: "green-meadow", tone: "#1b2a19",
      fx: [{ type: "butterflies", area: [.05, .46, .95, .86], n: 3 }]
    },
    {
      id: "coastal-cliffs", title: "", year: 2025, medium: "watercolor",
      alt: "A sandy cliff topped with green grass beside a calm grey-blue sea, with a flock of birds in a pale sky.",
      src: "assets/art/coastal-cliffs.jpg", full: "assets/art/coastal-cliffs-full.jpg", w: 1807, h: 1332,
      frame: "coastal-cliffs", tone: "#22292d",
      fx: [{ type: "birds", area: [0, .06, 1, .44], n: 4 }]
    },
    {
      id: "brown-bear", title: "", year: 2025, medium: "shimmer watercolor",
      alt: "A sleepy brown bear lying on its side, made of two fluffy, sparkly shapes: a round head with dark dot eyes and a nose, and a round body with a curled-up leg.",
      src: "assets/art/brown-bear.jpg", full: "assets/art/brown-bear-full.jpg", w: 1110, h: 830,
      frame: "brown-bear", tone: "#2a2319",
      fx: [{ type: "glints", area: [.13, .2, .42, .66], n: 9, color: "#fff3c6", shape: "star" },
           { type: "glints", area: [.46, .17, .9, .6], n: 12, color: "#fff3c6", shape: "star" },
           { type: "blink", color: "#564e3b", eyes: [[.234, .35, .058, .068], [.234, .473, .056, .074]] }]
    },
    {
      id: "forest-lake", title: "", year: 2026, medium: "watercolor and ink",
      alt: "A tall dusk sky full of mauve, green and pink streaks of cloud, above black silhouettes of pine trees.",
      src: "assets/art/forest-lake.jpg", full: "assets/art/forest-lake-full.jpg", w: 1320, h: 1910,
      frame: "forest-lake", tone: "#251b2b",
      fx: [{ type: "fireflies", area: [0, .74, 1, .97], n: 12 }]
    },
    {
      id: "snowy-forest", title: "", year: 2026, medium: "watercolor",
      alt: "Deep snow drifting over a hillside, with snow-heavy evergreens and bare brown saplings.",
      src: "assets/art/snowy-forest.jpg", full: "assets/art/snowy-forest-full.jpg", w: 1880, h: 1320,
      frame: "snowy-forest", tone: "#1c2a2b",
      fx: [{ type: "snow", n: 44 }]
    },
    {
      id: "color-block-garden", title: "", year: 2025, medium: "watercolor",
      alt: "Six blocks of colour like a patchwork: a grey sky, a green field, a meadow of flowers, a yellow sun setting, a coral glow and an olive field with flowers.",
      src: "assets/art/color-block-garden.jpg", full: "assets/art/color-block-garden-full.jpg", w: 1770, h: 1280,
      frame: "color-block-garden", tone: "#29231f",
      fx: [{ type: "glow", x: .245, y: .7, r: .13, color: "#ffe77a" },
           { type: "butterflies", area: [.52, .16, .98, .5], n: 2 }]
    },
    {
      id: "underwater-manatee", title: "", year: 2026, medium: "acrylic on canvas",
      alt: "A round white sea creature floating on its back and holding a purple shell, among swirls of green seaweed, bubbles, pink sparkles, a little orange fish and a small white friend, on bright teal.",
      src: "assets/art/underwater-manatee.jpg", full: "assets/art/underwater-manatee-full.jpg", w: 1460, h: 1470,
      frame: "underwater-manatee", tone: "#0c2a26",
      fx: [{ type: "bubbles", area: [0, 0, 1, 1], n: 14 },
           { type: "twinkle", points: [[.403, .205, .08], [.285, .735, .06], [.617, .9, .06], [.235, .116, .07], [.95, .29, .06]], color: "#ffd6ec" }]
    },
    {
      id: "ocean-study", title: "", year: 2025, medium: "watercolor",
      alt: "A wide turquoise sea under a lavender-blue sky, with a dark strip of land on the horizon and long streaky waves.",
      src: "assets/art/ocean-study.jpg", full: "assets/art/ocean-study-full.jpg", w: 1750, h: 1220,
      frame: "ocean-study", tone: "#142b2e",
      fx: [{ type: "glints", area: [0, .44, 1, .98], n: 24, color: "#f4fbff" }]
    },
    {
      id: "winter-mountains", title: "", year: 2026, medium: "watercolor and gouache",
      alt: "A snowy mountain valley with grey crags, a dark path winding through it, purple bare trees on both sides and a yellow glow in the sky.",
      src: "assets/art/winter-mountains.jpg", full: "assets/art/winter-mountains-full.jpg", w: 1840, h: 1270,
      frame: "winter-mountains", tone: "#24202b",
      fx: [{ type: "snow", n: 38 }]
    },
    {
      id: "blue-mountain-study", title: "", year: 2025, medium: "watercolor",
      alt: "An abstract study: a band of vivid blue brushstrokes above a speckled grey and brown textured ground.",
      src: "assets/art/blue-mountain-study.jpg", full: "assets/art/blue-mountain-study-full.jpg", w: 1820, h: 1180,
      frame: "blue-mountain-study", tone: "#1e252e",
      fx: [{ type: "mist", area: [.11, .17, .9, .83], n: 3 }]
    },
    {
      id: "blue-horizon", title: "", year: 2025, medium: "watercolor",
      alt: "A loose seascape in blues: a wide sky, bands of rolling waves, and a few tiny figures far out on the water.",
      src: "assets/art/blue-horizon.jpg", full: "assets/art/blue-horizon-full.jpg", w: 1850, h: 1190,
      frame: "blue-horizon", tone: "#15283a",
      fx: [{ type: "glints", area: [.12, .48, .87, .7], n: 16, color: "#ffffff" }]
    }
  ]
};
