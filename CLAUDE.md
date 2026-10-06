# Serena's Garden

Personal site for Serena, built and maintained by her brother Rex with Claude.
Her own idea board is in `IDEAS.md`. Read it first; it's the brief.

**Status:** the cottage hub and **Travels** are built. The mailbox form is
built but closed until its access key is pasted in. Every other section is a
labelled "still decorating" stub.

## Decisions (settled with Rex, October 2026)

- **Hosting:** GitHub Pages, from a free GitHub organization `serenas-garden`
  owned by Rex's account, repo `serenas-garden.github.io`. Served at the
  **domain root**: `https://serenas-garden.github.io/`.
- **Link-only.** Not meant to be found by search. Every page carries
  `<meta name="robots" content="noindex, nofollow">` and `robots.txt`
  disallows everything. Keep both on every new page. Note that the repo itself
  is still public on GitHub, which free Pages requires.
- **First name only.** No surname anywhere on the site, in the repo, or in this
  file.
- **Who edits:** always Rex + Claude. Serena sends changes to Rex. There's no
  sign-in or backend, and none is planned, so don't add one.
- **Messages:** the "Send a Letter" form (`mailbox.html`) posts to Web3Forms,
  which emails letters to Serena only. Her address lives in Web3Forms behind
  an access key and must never appear in this repo. **Getting the key needs a
  Web3Forms sign-up with her email, so Serena (or Rex) does it, never Claude:**
  web3forms.com, then "Create your form" with her address. The key arrives in
  her inbox. To open the mailbox, paste the key into the `access_key` input in
  `mailbox.html` (marked `MAILBOX KEY`) and set `mailbox` to `status: "open"` in
  `sections.js`. Until then, `assets/mailbox.js` shows the form disabled with an
  "opens soon" note. The key is public-safe by Web3Forms' own design.
- **Look:** fairy forest / cottagecore, from her own notes. The sky follows the
  real sun and moon: a sunlit garden by day, fireflies and stars at night.
  **The room stays cottage.** In October 2026 Rex tried a bigger fairy-forest
  restyle of the room (vine garland, moss shelves, fern wallpaper, a magic
  window view) and scrapped it as too much. He kept two things from it: the
  **tree door** on the intro and **small fairies** flying round the room. Add
  fantasy touches sparingly, one at a time, and ask before restyling the room.
- **Sky and weather follow St. Petersburg, Florida** (Rex's call). See
  `sky.js` and `weather.js` below.
- **Rex previews big design changes before they go live.** Build on a branch,
  show him (local preview plus screenshots), and push only after he approves.
  (One exception so far: he asked for Travels to be built to completion and
  pushed without a preview. That doesn't change the rule.)
- **Features:** borrowed as *ideas* from a site she liked
  (luvbugdiaries.blogspot.com): the door intro, objects as navigation, a guide
  character with hover tips, and a "currently" status card. **Ideas only.**
  Never copy that site's art, code or wording.
- **Art:** drawn in code (inline SVG) for now. Licensed illustration packs may
  replace or join pieces later. Any third-party asset must allow commercial use,
  have its licence recorded in `CREDITS.md`, and be approved by Rex before it's
  added.

## Stack

Static HTML/CSS/JS on GitHub Pages: no build step, no framework, no bundler,
same as Rex's site (local path in `CLAUDE.local.md`). Every page links one shared
`assets/style.css`.

## Files

- `index.html`: the cottage, drawn as one illustrated room. A door intro
  (shown on every arrival: a link, bookmark, typed address or refresh;
  skipped only when coming back from a room or using Back/Forward after
  coming through it; see `arrivingFromOutside` in garden.js) shows a green fairy door set into a giant mossy
  tree: a leafy canopy with wisteria and fairy lights, lights on the carved
  arch, a lantern, a fern, a rose bush and glowing mushrooms among the roots.
  **The tree stands in a full garden** (`.door-scene`, one 1600×1000 SVG,
  scaled by `--s` and anchored bottom-centre; the door is stood at scene point
  (800, 882) by `.door-intro__inner`). The garden has rolling hills and a
  treeline, a meadow with grass texture and wildflower patches (smaller toward
  the horizon), flowering bushes, two framing trees (the left one has a rope
  swing), a picket fence with climbing roses and a cottage flower bed, a
  birdhouse with a bluebird, a pond with lily pads, a water lily, cattails and
  a frog, the path to the door, and three layers of swaying grass blades.
  Living things: four bunnies hop about at different depths (hop timelines are
  generated `@keyframes hop-a` … `hop-d`), butterflies by day, 44 lightning
  bugs by night, clouds and the sun by day, and stars and the real moon by
  night (the moon is reflected in the pond). `.door-sky` gives tall phone
  screens their own sun, clouds and moon, since the scene doesn't reach the
  top there. Flowers are reusable `<g id="fl-…">` shapes placed with `<use>`.
  Keep them as groups, not `<symbol>`s with a viewBox: a `<use>` without a
  size stretches a symbol to fill the whole scene. Rex asked for this garden
  to be full and lively; keep it that way.
  It opens onto:
  a bunting-and-fairy-light **garland** (pennant/bulb positions along the sag
  are precomputed inline styles), a hanging wooden **sign** (the `<h1>`), a
  **light switch** (the sky toggle), a tear-off **wall calendar** (real date
  and tonight's moon), the **window** with gingham curtains, ivy and a
  **flower box** (the window itself is not a link; a brass **telescope**
  standing outside in the meadow, aimed at the moon, is the Moon Paparazzi
  link), the **toadstool guide**, two wooden **shelves** of objects
  with paper **tags**, the **corkboard** of pinned "currently" notes, and a
  plank **floor** with a rug, fern, candle, and **Gemma** (see below).
  **Fairies** (`.fairies`): three tiny winged lights (two by day, three at
  night) wander over the room in front of everything. They never block
  clicks, and they're hidden for reduced motion. Each `.fairy` is a long
  flight path. Its inner `<i>` is the bobbing body, with fluttering wings on
  `::before` and `::after`. Petals drift by day and
  fireflies by night (`.ambient`). **Only the objects are links.** Every
  decorative piece is `aria-hidden`.
- **Each object has its own hover animation**, hooked by `o-*` classes in its
  SVG (`o-land` globe spin, `o-steam`, `o-notes`/`o-arm`, `o-screen`/`o-heart-tv`,
  `o-ears`, `o-sun`, `o-blooms`, `o-heart`, `o-flash` on the window, `o-sway`
  flowers, `o-scope`/`o-glint` on the telescope). Keep these classes when
  redrawing an object.
- **Moon Paparazzi is Serena's Instagram**
  (`https://www.instagram.com/moonpaparazzi/`). Its entry in `sections.js` has
  an `href`, so the telescope and the rooms nav link out (new tab, ↗ on the
  tag). **The telescope's "Moon Paparazzi" tag is hidden until hover or
  keyboard focus**, at Rex's request. Don't make it always visible. Hovering
  it also tips the scope up, glints the lens, and makes the moon glow. `moon.html` only redirects there, so an old `moon.html` link
  still works. A separate sunrise/sunset page could come later.
- `travels.html`: built. See **Travels** below.
- `kitchen.html`, `music.html`, `currently.html`, `moon.html`,
  `zoo.html`, `art.html`, `picks.html`: section stubs, all from one template.
  Each has a `.page-head` (back link, title, blurb, and that section's object
  drawn as `.page-art`), a `.stub-note`, and the rooms nav. When building one,
  replace the `.stub-note` with real content (keep the header and the rooms
  nav), then set its `status` to `"open"` in `sections.js`.
- `mailbox.html`: the letter form (see Messages above). Behaviour is in
  `assets/mailbox.js`. It has a honeypot `botcheck` field for spam, and a
  no-JavaScript fallback that posts normally and returns to `#sent`.
- **Every page shares one `<head>` pattern**: charset/viewport, title,
  description, `robots noindex`, `theme-color` (sky.js retints it at night),
  Open Graph + Twitter card tags pointing at `assets/og.png`, favicon +
  `apple-touch-icon`, preconnect + Google Fonts `<link>`, `style.css`, then
  `sky.js`. Copy it from an existing page when adding one.
- `404.html`: uses root-absolute `/assets/...` paths on purpose (Pages serves
  it at whatever URL was missed). That's safe because the site is at the
  domain root.
- `robots.txt`: disallows everything (link-only).
- `assets/sections.js`: **the single source of truth for sections**: slug,
  title, the guide's hover line, the blurb, `status` ("soon" / "open"), and an
  optional `href` for a section that lives elsewhere. Object tags, links and
  guide text on the hub read from it.
- `assets/currently-data.js`: the "currently" card. `sample: true` makes it
  label itself as a placeholder.
- `assets/sky.js`: the sun/moon engine from Rex's site. **At Rex's request
  (October 2026) it follows St. Petersburg, Florida** (27.7676 N, 82.6403 W,
  America/New_York), the same as his site. That covers time of day, sun, moon
  phase and the calendar date, for every visitor wherever they are. It's city
  level only; never add anything more precise. Sets `data-sky` and
  `data-dark` on `<html>`. The light switch / mushroom lamp pins the sky for
  **this visit only** (sessionStorage), so every new visit opens on the real
  sky. An older version kept the pin forever in localStorage and left
  browsers stuck on "always day"; sky.js clears that old key.
- `assets/weather.js`: **live weather for St. Petersburg** from Open-Meteo
  (free, no key, browser-friendly). It's cached 15 minutes in sessionStorage
  and refreshed every 15 minutes. It sets `data-weather` (clear, partly,
  overcast, fog, rain, storm, snow) and `data-windy`. The CSS turns that into
  grey skies, cloud decks and slate night clouds, rain, lightning, fog and
  snow (`.weather-fx` layers) in the garden and the cottage window. It also
  hides the sun and stars, dims the moon, and sends butterflies and lightning
  bugs home in rain. The calendar shows the temperature and condition. If the
  request fails, the site just shows fair weather. Loaded on `index.html` only.
- `assets/garden.js`: hub behaviour (door, labels, guide, currently card,
  drawing the real moon phase in the window, sky toggle). The cottage is
  `inert` while the door is up, so keyboard users can't tab behind it.
- `assets/rooms.js`: the "wander to another room" nav on every section page,
  built from `sections.js` (current page marked `aria-current`; sections with
  an `href` link out in a new tab).
- `assets/mailbox.js`: letter form behaviour.
- `assets/og.png` (1200×630): the link-preview image shown when the site is
  texted or posted. `assets/apple-touch-icon.png` (180×180): the toadstool's
  face, for iPhone home screens. Both were rendered from small HTML cards with
  headless Chrome. To change them, rebuild a card and re-render; don't
  hand-edit the PNGs.
- `assets/style.css`: tokens, layout, and drawing classes.
- `assets/favicon.svg`: toadstool.
- `README.md`: a short public description, shown on the GitHub repo page.
- `tools/`: Python scripts (standard library only) that generate the travels
  map data and stamp drawings, plus the place checker. Not loaded by any page.
- `CREDITS.md`: third-party material and its licence.

## Travels

`travels.html`: a desk globe you can spin, a postcard for each place, and a
passport of country stamps. Rex asked for an interactive map that is less
"technical" than the one on his site, so this is its own engine, not his.

- **The places** are in `assets/travels-data.js`, exactly as Serena listed them
  (30 places, 15 countries), in tour order, roughly west to east. Each has a
  `blurb` (a factual one-liner, DRAFT for Serena to rewrite) and an empty
  `note` for her own words; the postcard says "my note from here is coming
  soon!" until it's filled. Each country has an empty `favorite` (her idea
  board's "favorite place in each country"); the passport shows it once set.
  `where` uses her own wording, so US places say "United States", not a state.
- **Pins are city level** (or the middle of a region, for Scotland, Morocco,
  Costa Rica, the Cotswolds and the Albanian Riviera). Never more precise.
- **Ocean City is assumed to be Ocean City, Maryland.** She didn't say which.
  If it's New Jersey, change its lat/lon to 39.2776, -74.5746. Nothing else
  changes. Sun Valley is Idaho (the ski resort, also on Rex's ski list).
- **Checking places:** `python3 tools/verify_places.py assets/globe-geo.js
  assets/travels-data.js` confirms every pin lands in its own country (coastal
  cities may sit up to ~4 km off the simplified coast) and lists the closest
  pairs. Run it after adding a place.
- **The globe** (`assets/globe.js`, no library): an orthographic globe on a
  canvas, clipped properly at the horizon (rings are cut at the exact
  great-circle crossing and rejoined along the rim), so it can be turned to
  any angle, poles included. Drag to spin (with inertia), pinch, ctrl/cmd +
  scroll or the +/- buttons to zoom, double-click to zoom in; arrow keys and
  +/- when it has focus. Zooming magnifies inside the same circle, like a
  lens. It spins slowly on its own (a turn a minute, 30 fps) unless a place is
  picked, the visitor just touched it, it's off screen, or motion is reduced.
  On phones one finger turns it sideways and vertical swipes still scroll the
  page (`touch-action: pan-y`); two fingers pinch and tilt.
- **Real day and night:** `Sky.overhead()` in `sky.js` gives the point where
  the sun (and moon) is overhead right now; the globe shades every pixel by
  the sun's altitude there, with a soft twilight and a warm dusk band, and
  draws a little sun and moon at those points. The globe keeps its daytime
  colours in the site's night theme (dimmed a little), so its own day and
  night always read. Toadstools where it's night glow teal like the
  mushrooms by the door. The intro postcard says how many places have the sun
  up right now; each postcard gives the local time there (`tz`) and whether
  it's day, golden hour, twilight or night.
- **Toadstools are the pins.** Nearby ones cluster into one toadstool with a
  count; tapping a cluster zooms in until they split. Picking a place flies
  there at a zoom that separates it from its nearest neighbour (Corfu and the
  Albanian Riviera, 55 km apart, need the deepest zoom). Labels are paper
  tags that never cover a toadstool.
- **Tints:** visited countries are rose. France's Natural Earth outline
  includes its overseas regions, so `tintBox` limits the tint to mainland
  France and Corsica. Monaco is too small to draw at this scale; its pin shows
  it. **Western Sahara is drawn as its own territory** (the UN depiction):
  Natural Earth draws Morocco deep into it, so the map build cuts Morocco at
  the 27.66 N line and only Morocco proper is tinted. Somaliland, Northern
  Cyprus and the Siachen Glacier get no border line of their own.
- **The map data** (`assets/globe-geo.js`, ~200 KB, ~70 KB gzipped) is
  Natural Earth 1:50m countries, public domain (see `CREDITS.md`), baked by
  `tools/build_globe.py` (instructions at its top): arcs simplified with
  shared borders kept in step, islands under 250 km² dropped (Mallorca,
  Menorca and Corfu stay), rings oriented land-on-the-left, coastlines and
  borders split out, and edges crossing the 180th meridian handled. Don't
  hand-edit it; rebuild it.
- **Postcards:** paper with airmail edges, a perforated stamp and a postmark
  with today's date there. The stamp drawings (one little scene per place,
  keyed by `stamp`) are generated by `tools/build_stamps.py` into
  `assets/travels-stamps.js`; to change one, edit the script and rerun it.
  Postcard and passport colours are fixed, like the corkboard notes, and
  dimmed at night.
- **The passport** lists every country as an ink stamp with its places (tap a
  place to fly there, a country to frame all its places), then "the far
  corners": farthest north, east and west, and closest to the equator,
  worked out from the data.
- **Tour:** "take the tour" flies through every place once, starting after
  the open postcard. Any touch of the globe or its buttons stops it.
- **Links:** `travels.html#kyoto` opens on a place (the id from the data).
- Caveat is loaded on this page too, for the handwritten notes.

## Gemma

Serena's cat: a **seal bicolor ragdoll, female**, and Serena adores her. She
is the heart of the home page, so treat her with care.

- **What she looks like (keep this accurate):** white chest, belly, legs and
  paws; seal-brown (dark brown) ears, mask, back and big plumed tail; a white
  inverted "V" running down her face between the eyes to the muzzle; blue eyes;
  pink nose and inner ears. She wears a rose collar with a gold heart tag. Her
  fur colours are fixed hex values (she's the same cat at night, just dimmed a
  touch), unlike the room, which uses theme tokens.
- **Where she lives:** `.floor__stage` in `index.html`: her bed (two SVG
  halves, `.cat-bed--back` and `.cat-bed--front`, so she sleeps *between*
  them; "gemma" is embroidered on the front), and her cat tree (`.cat-tree`:
  condo, middle shelf, top perch, pom-pom toy). She is a `<button class="gemma">`
  containing one SVG with three poses: `g-walk` (side view, also used for
  `jump`), `g-sit` (front view, with a yawn), and `g-sleep` (curled up, with
  drifting z's). `data-pose` picks which is shown.
- **Her day** (`assets/gemma.js`): nap → wake, sit, yawn → hop out → stroll to
  the tree (sometimes stopping halfway to look around) → jump condo → shelf →
  top perch → sit there → down via the condo → walk home → step into bed →
  circle → sleep. One loop is roughly 45 to 60 seconds. Spots are measured from
  the bed and tree elements every time, so she follows any layout. Tree levels
  are in the tree's own viewBox coordinates (`LEVELS` in gemma.js). Redraw the
  tree, update those.
- **Petting:** click or tap her for a "mrrp!" bubble and floating hearts
  (asleep, she only stirs). A visually hidden live region announces it, and
  hovering makes the toadstool guide introduce her (via `window.Guide`, which
  garden.js exposes).
- **Reduced motion:** she stays asleep in her bed and never moves. Petting
  still shows her reply.

## Design system

- **Palette** (`:root`, redefined under `[data-dark="true"]`): linen bg, paper,
  wall, deep-forest ink (`--ink`, `--ink-soft`, `--ink-faint`), hairline.
  **Four accents:** `--moss`, `--rose`, `--gold`, `--berry` (toadstool red).
  The tree door and the fairies add `--lilac`, `--fae` and `--fae-glow` (off by
  day), plus `--bark`, `--bark-dark` and `--moss-deep`. Keep those to magical
  things.
  Room materials: `--wood`, `--wood-lite`, `--wood-dark`, `--floor`, `--cork`.
  Sky tokens (`--sky-top`, `--sky-bottom`, `--treeline`, `--meadow`) shift by
  sun phase. The corkboard notes use fixed `--note-*` paper colours with
  `--note-ink`, because paper stays paper at night.
- **`--lamp`** is 0 by day and 1 at night. Fairy-light glow, the candle and the
  door lantern scale their glow by it. Animate glows with `transform` only
  (the `breathe` keyframes): an opacity animation would override `--lamp` and
  light them up in daytime.
- **Wallpaper:** soft stripes plus a sparse sprig pattern on `body::before`
  (inline SVG data URI). It shows on every page.
- **Type:** Cormorant Garamond (display), Nunito (body), Pixelify Sans (the
  guide, tags, eyebrows: the "game UI" voice). Loaded via `<link>` tags in
  each page's `<head>` (not `@import`, which would delay them). The home page
  alone also loads **Caveat**, for the handwritten corkboard notes.
- **Drawing convention:** SVG objects use `class="ink"` for the outline plus a
  fill class (`f-paper`, `f-moss`, `f-rose`, `f-gold`, `f-berry`, `f-wood`,
  `f-ink`), e.g. `class="ink f-rose"`. Colours then follow day/night
  automatically. Never hard-code a fill that should change at night.
- **The guide** is a toadstool under the flower box. It's in the page flow,
  not fixed, so it never covers content. Its lines live in `sections.js`.
- **Checking the room visually:** headless Chrome can't go narrower than about
  500px, so check phone width in a real mobile emulator (375px), not a headless
  screenshot.
- **Copy voice:** Serena speaks in first person ("write me a note"). The
  pixel-font UI bits are lowercase and playful; headings and blurbs use normal
  case. All current copy is a DRAFT for Serena to rewrite.

## Rules carried over from Rex's site (each one learned the hard way)

1. **This repo is public, and so is everything in it, this file included.**
   GitHub Pages serves every file in the tree, so an unlinked file is still a
   public URL. Never commit anything private: no surname, home address,
   school, workplace, phone number, email address or birthday. Write this file
   assuming strangers will read it.
2. **Strip location data from photos before committing.** Phone photos carry
   GPS coordinates in their EXIF data. That matters most for the moon,
   travel and art photos. Run `exiftool -all= -overwrite_original <file>` on
   every image.
3. **Base URL is the domain root** (`https://serenas-garden.github.io/`). Use
   relative links between pages. Absolute URLs appear only in `og:url` tags
   and `404.html`.
4. **Content lives in data files, separate from layout**
   (`assets/<section>-data.js`), so a content update is a one-line edit.
5. **Be honest about state.** Placeholders are visibly labelled. Sample data is
   never passed off as Serena's real picks.
6. **All motion lives inside
   `@media (prefers-reduced-motion: no-preference)`**, transitions included.
   JS checks the same preference before timing anything (the door).
7. **Mobile breakpoint:** `max-width: 640px`. Test at 375px wide with no
   horizontal scroll.
8. **Commits are signed `Rex <rex@serenas-garden.invalid>`**, set in this
   repo's local git config. That keeps history from linking to an account name
   that carries a surname. Check `git config user.email` before committing from
   a fresh clone.

## Deploying

Pushing to `main` deploys to GitHub Pages in about 30 seconds (no build,
`.nojekyll` set). Pushes authenticate through the GitHub CLI (`gh`), which is
signed in as Rex.

## Reusable pieces from Rex's site, for later sections

Reuse the *engines*, never the look. Paths are relative to Rex's site, whose
location is in `CLAUDE.local.md` (not committed: it would tie this repo to a
surname).

| Section | Engine on Rex's site |
|---|---|
| Moon Paparazzi (sunrise/sunset times, moon detail) | `assets/sky.js` (already ported) |
| Serena's Zoo | `music.html`: drag-to-reorder ranked list with FLIP animation |
| Top Picks | `kit.html`, `assets/kit.js`, `assets/kit-data.js` |

## Open items

- Serena creates the Web3Forms access key (see Messages) and sends it to Rex.
- Serena reviews and rewrites the draft copy in `sections.js`, and names the
  toadstool.
- Real "currently" entries. Then set `sample: false`.
- Travels: Serena's own `note` for each place and a `favorite` for each
  country (both empty), her rewrite of the draft blurbs, and a yes/no on
  Ocean City being Maryland.
- Pick the next section to build.
