/* Every section of the site, in one place.
 *
 * The cottage on index.html has one clickable object per section, and the
 * guide character reads its hover line from here. To rename a section, change
 * its words, or mark it built, edit this file only.
 *
 * Copy is DRAFT, written as a starting point for Serena to rewrite in her own
 * voice. `status` is "soon" until a page has real content, then "open".
 *
 * A section with `href` lives somewhere else (e.g. Instagram): every link to it
 * goes there instead of <slug>.html, opening in a new tab so the cottage stays
 * open behind it.
 */
window.SECTIONS = [
  {
    slug: "travels",
    title: "Travels",
    object: "globe",
    guide: "the globe! every country i've been to, and my favorite spot in each one",
    blurb: "Every country I've been to, and the one place in each I'd send you first.",
    status: "soon"
  },
  {
    slug: "kitchen",
    title: "The Kitchen",
    object: "pie",
    guide: "what's cooling on the windowsill: things i've baked and cooked",
    blurb: "Things I've baked and cooked, the recipes, and how they actually turned out.",
    status: "soon"
  },
  {
    slug: "music",
    title: "Music",
    object: "record player",
    guide: "the record player has what i've had on repeat",
    blurb: "What I've had on repeat, and the songs I'd put on a mixtape for you.",
    status: "soon"
  },
  {
    slug: "currently",
    title: "Currently",
    object: "tv and books",
    guide: "what i'm watching, reading and listening to right now",
    blurb: "What I'm watching, reading and listening to right now, plus what I just finished.",
    status: "soon"
  },
  {
    slug: "moon",
    title: "Moon Paparazzi",
    object: "telescope",
    href: "https://www.instagram.com/moonpaparazzi/",
    guide: "the telescope! it's aimed at tonight's real moon. click for my moon paparazzi shots on instagram",
    blurb: "My moon photos, plus sunrises, sunsets, and whatever the sky is doing tonight.",
    status: "open"
  },
  {
    slug: "zoo",
    title: "Serena's Zoo",
    object: "bunny",
    guide: "serena's zoo: every animal, ranked (correctly)",
    blurb: "Every animal, ranked. The rankings are final. (They are not final.)",
    status: "soon"
  },
  {
    slug: "art",
    title: "Art",
    object: "easel",
    guide: "the easel: things i've made",
    blurb: "Things I've drawn, painted and made.",
    status: "soon"
  },
  {
    slug: "picks",
    title: "Top Picks",
    object: "basket",
    guide: "the basket holds my favorite things, the ones i'd actually tell you to buy",
    blurb: "The things I actually use and love, and would tell a friend to buy.",
    status: "soon"
  },
  {
    slug: "mailbox",
    title: "Send a Letter",
    object: "envelope",
    guide: "write me a letter! it goes straight to me",
    blurb: "Write me a note. It goes straight to my inbox.",
    status: "soon"
  }
];
