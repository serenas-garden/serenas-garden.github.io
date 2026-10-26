# Serena's Garden

Personal site for Serena, built and maintained by her brother Rex with Claude.
Her own idea board is in `IDEAS.md`. Read it first; it's the brief.

**Status:** the cottage hub, **Travels**, **the Kitchen**, **the Gallery** (Art) and **the mailbox**
(Send a Letter: a writing desk that emails letters to Serena) are built. Every other section is a
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
- **Messages:** the "Send a Letter" page (`mailbox.html`) posts each letter
  to a small Google Apps Script web app (`tools/mailbox-apps-script.js`),
  which emails it to Serena as a styled letter, the same format every time
  (Rex asked for consistent, stylized letters; October 2026). **The address
  letters go to lives only in the copy of the script inside Apps Script
  (`SEND_TO`) and must never appear in this repo** (it would also carry her
  surname). It runs in **Rex's** Google account and sends from his Gmail
  (Rex's call, October 2026: he didn't want to set it up himself, and he and
  Serena are fine with letters coming from his address and copies sitting in
  his Sent mail). Claude set it up in Rex's own signed-in Chrome; Claude
  never signs in to anything. See "The mailbox" below. (The first plan was
  Web3Forms, but its free plan can't style emails; custom HTML is its paid
  plan.)
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
  (Two exceptions so far: he asked for Travels, and for Gemma in the garden,
  to be built and pushed without a preview. That doesn't change the rule.)
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
  top there. **Gemma plays in the garden too** (see Gemma). **The garden is
  two SVGs** with her between them: `.door-scene` (sky, hills, trees, fence,
  pond, path, the farther wildflowers) and `.door-scene--front` (wildflowers
  nearer than scene y 880, the bunnies, butterflies, grass, the night veil
  and the lightning bugs), so bunnies and grass pass in front of her and the
  night dims her like the meadow. Stacking in `.door-intro`: back scene,
  Gemma (1), front scene (2), the door tree (3), her butterfly (4), weather
  (5). Put new garden things in the layer that matches their depth.
  Flowers are reusable `<g id="fl-…">` shapes placed with `<use>`.
  Keep them as groups, not `<symbol>`s with a viewBox: a `<use>` without a
  size stretches a symbol to fill the whole scene. Rex asked for this garden
  to be full and lively; keep it that way.
  It opens onto:
  a bunting-and-fairy-light **garland** (pennant/bulb positions along the sag
  are precomputed inline styles), a hanging wooden **sign** (the `<h1>`), a
  **light switch** (the sky toggle) with the **wallpaper sample fan** beside
  it (see "Wallpapers"), a tear-off **wall calendar** (real date
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
- `kitchen.html`: built. See **The Kitchen** below.
- `art.html`: the gallery, with Serena's first 18 pieces. See **The
  Gallery** below.
- `music.html`, `currently.html`, `moon.html`,
  `zoo.html`, `picks.html`: section stubs, all from one template.
  Each has a `.page-head` (back link, title, blurb, and that section's object
  drawn as `.page-art`), a `.stub-note`, and the rooms nav. When building one,
  replace the `.stub-note` with real content (keep the header and the rooms
  nav), then set its `status` to `"open"` in `sections.js`.
- `mailbox.html`: the letter desk (see "The mailbox" below). Behaviour is in
  `assets/mailbox.js`. It has a honeypot `botcheck` field for spam, and a
  no-JavaScript fallback: the form posts straight to the script, which shows
  its own little thank-you page with a link back.
- **Every page shares one `<head>` pattern**: charset/viewport, title,
  description, `robots noindex`, `theme-color` (sky.js retints it at night),
  Open Graph + Twitter card tags pointing at `assets/og.png`, favicon +
  `apple-touch-icon`, preconnect + Google Fonts `<link>`, `style.css`, then
  `sky.js` and `wallpaper.js`. Copy it from an existing page when adding one.
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
- `assets/gemma-kit.js`: Gemma's drawing and petting, shared by every page
  she's on. `assets/gemma-follow.js`: her following you into rooms.
  `assets/gemma-outside.js`: her playing in the garden on the door screen.
- `assets/weather.js`: **live weather for St. Petersburg** from Open-Meteo
  (free, no key, browser-friendly). It's cached 15 minutes in sessionStorage
  and refreshed every 15 minutes. It sets `data-weather` (clear, partly,
  overcast, fog, rain, storm, snow) and `data-windy`. The CSS turns that into
  grey skies, cloud decks and slate night clouds, rain, lightning, fog and
  snow (`.weather-fx` layers) in the garden and the cottage window. It also
  hides the sun and stars, dims the moon, and sends butterflies and lightning
  bugs home in rain. The calendar shows the temperature and condition. If the
  request fails, the site just shows fair weather. Loaded on `index.html` and
  `kitchen.html`.
- `assets/garden.js`: hub behaviour (door, labels, guide, currently card,
  drawing the real moon phase in the window, sky toggle). The cottage is
  `inert` while the door is up, so keyboard users can't tab behind it.
- `assets/rooms.js`: the "wander to another room" nav on every section page,
  built from `sections.js` (current page marked `aria-current`; sections with
  an `href` link out in a new tab).
- `assets/mailbox.js`: the letter desk's behaviour (sending, the envelope).
- `assets/wallpaper.js` (every page's head) and `assets/wallpaper-picker.js`
  (home page): the wallpapers. See "Wallpapers".
- `assets/og.png` (1200×630): the link-preview image shown when the site is
  texted or posted. `assets/apple-touch-icon.png` (180×180): the toadstool's
  face, for iPhone home screens. Both were rendered from small HTML cards with
  headless Chrome. To change them, rebuild a card and re-render; don't
  hand-edit the PNGs.
- `assets/style.css`: tokens, layout, and drawing classes.
- `assets/favicon.svg`: toadstool.
- `README.md`: a short public description, shown on the GitHub repo page.
- `tools/`: Python scripts (standard library only) that generate the travels
  map data, stamp drawings and wallpapers, plus the place checker and the
  art preparer; and the mailbox's Apps Script with its letter preview. Not
  loaded by any page.
- `CREDITS.md`: third-party material and its licence.
- `AGENTS.md`: a short pointer to this file for other coding agents (Codex
  reads that name). Keep it a pointer; never copy these notes into it, or the
  two will drift apart.

## Travels

`travels.html`: a desk globe you can spin (or a flat map on a parchment
scroll), a postcard for each place, and a passport of country stamps. Rex asked for an interactive map that is less
"technical" than the one on his site, so this is its own engine, not his.

- **The places** are in `assets/travels-data.js`, exactly as Serena listed them
  (32 places, 15 countries; Martha's Vineyard and Mont-Saint-Michel were added
  a day after the first 30), in tour order, roughly west to east. Each has a
  `blurb` (a factual one-liner, DRAFT for Serena to rewrite) and an empty
  `note` for her own words; the postcard says "my note from here is coming
  soon!" until it's filled. Each country has an empty `favorite` (her idea
  board's "favorite place in each country"); the passport shows it once set.
  `where` uses her own wording, so US places say "United States", not a state.
- **Pins are city level** (or the middle of a region, for Scotland, Morocco,
  Costa Rica, the Cotswolds and the Albanian Riviera). Never more precise.
- **Ocean City is Ocean City, New Jersey** (Rex confirmed; not Maryland). Sun
  Valley is Idaho (the ski resort, also on Rex's ski list).
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
- **The flat map** (Rex asked for it so all the places can be seen at once):
  a "globe | flat map" switch above the globe. It's the same engine
  (`Globe(el, { projection: "flat" })`), so toadstools, clusters, labels,
  real night, sun, moon and sea drawings all match. It's a Miller cylindrical
  projection cropped to 84 N .. 58 S, drawn from Path2D in map units through
  one transform (under a millisecond a frame). Shapes crossing the 180th
  meridian are unwrapped and drawn again a full turn east and west, and
  rings round a pole close through the pole, so nothing streaks across it. It
  never pans or zooms past the edge of the world. Home frames all her places
  (2:1 on desktop, 3:2 on phones, which shows exactly Carmel to Niseko). On
  the map every name that fits is shown, and picking a place only moves the
  map if it has to (to part it from a neighbour, or bring it into view). One
  finger sideways pans on phones; vertical swipes scroll the page.
- **The scroll animation** (travels.js, Web Animations API): to the map, the
  globe and postcard fade, a rolled-up scroll tied with a ribbon appears, the
  bow and band slip off, and the two rollers glide apart while the sheet's
  clip opens (the paper rolls start 1.6x fat and slim down as they unroll);
  back to the globe it rolls up, re-ties and the globe returns. `.is-closed`
  on `.scroll` is the rolled state; every animation is cancelled at the end so
  only the classes remain. Reduced motion swaps instantly. The open place
  carries across views. The view isn't remembered between visits.
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
  shared borders kept in step, islands under 250 km² dropped unless one of her
  places is on them (so Martha's Vineyard stays; pass `travels-data.js` as the
  last argument when rebuilding), rings oriented land-on-the-left, coastlines and
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

## Wallpapers

Rex asked (October 2026) for a way to change the wallpaper from the home
page, spreading to every room with the same wallpaper.

- **Six wallpapers**, all drawn in code (inline SVG tiles plus CSS stripes
  or checks): **garden stripe** (the original, and the default), **wildflower**
  (a ditsy floral: pink blossoms, forget-me-nots, daisies, buds), **woodland**
  (toadstools, ferns, acorns, a snail, clover, on soft sage), **picnic
  gingham** (a rose check; plum underneath at night), **wisteria** (a garden
  trellis dripping with wisteria) and **moonlit** (gold crescent moons and
  sparkles on pale periwinkle, deep navy at night, a nod to Moon Paparazzi).
  Each has a day and a night look.
- **Where they're drawn:** `tools/build_wallpapers.py` holds the drawings
  and writes the CSS between the `wallpapers:start` / `wallpapers:end`
  markers in style.css: for each, `[data-wp="<id>"]` sets `--wp-img` (the
  layers, every layer at position 0 0), `--wp-ground` (the paint under it)
  and `--wp-op` (how strongly it shows), with night values under
  `[data-dark="true"]`. `body` and `body::before` paint from those. Edit
  there and rerun; never edit the generated block by hand. A new wallpaper
  needs an entry there and in `WALLPAPERS` in `assets/wallpaper.js`.
- **Which is up:** `assets/wallpaper.js`, in every page's head right after
  sky.js, sets `<html data-wp>` before the page is drawn, from this
  browser's choice (localStorage `sg-wallpaper`; garden stripe by default).
  It's remembered across visits, and other open tabs of the site follow a
  change straight away. **The kitchen and the gallery keep their own
  wallpapers** (their more specific rules win); every other page (the
  cottage, Travels, the mailbox, the stubs, 404) shows the chosen one.
- **The picker** (`assets/wallpaper-picker.js`, home page only): a fan of
  narrow sample strips, one per wallpaper, pivoting on a brass rivet, beside
  the light switch (the one on the walls pulled out of the fan; it spreads
  when you point at it), labelled "wallpaper: <name>". It opens **the sample
  book**: a ring-bound card with a pinked-edge sample of each at real size,
  its name and a line about it, and an "on the walls" tag on the current
  one. Esc, the ×, or a click outside closes it. Each card shows a
  wallpaper by setting `data-wp` on itself, so the samples always match.
- **Hanging it:** pick one and it's hung strip by strip, left to right:
  each strip of the new paper unrolls down the wall from the ceiling,
  behind the furniture (a layer just in front of the old wallpaper), with
  a roll of paper travelling down its edge; each strip's pattern is offset
  by its own left edge so they line up into one wallpaper exactly where the
  real one goes. Then the real one is switched and the strips removed. The
  toadstool guide narrates ("ooh, woodland! hanging it now…", "all
  done!…"). Reduced motion: it just changes. On phones the fan sits beside
  the switch and the book opens from the left of the header.

## The mailbox

`mailbox.html` ("Send a Letter"): a writing desk. Not a room (no Gemma).

- **The page:** the garland and the hanging sign ("write to serena / Send a
  Letter") like the kitchen and gallery, then a wooden desk running edge to
  edge: the letter on lined cream paper with a pink margin rule ("Dear
  Serena," printed, then the letter, "with love," and their name in Caveat
  handwriting, and an optional email for a reply), a sheet of four stamps to
  pick from (tulip, toadstool, moon, Gemma), an inkwell and quill, pressed
  flowers. Sending: the paper folds away, an envelope wearing their stamp
  appears, wiggles and flies off, and "Your letter's on its way!" takes its
  place, with "write another letter". If it fails, the letter stays put with
  a friendly note. Reduced motion: it just swaps. Paper, stamps and the
  envelope keep fixed colours (dimmed a little at night).
- **The letter email** (`renderLetter()` in `tools/mailbox-apps-script.js`):
  subject "💌 A letter from <name>", from "Serena's Garden". A cream letter
  with airmail edging, a St. Pete postmark with the date, the stamp they
  picked (as an emoji, so it shows in every email app with no pictures to
  load), "Dear Serena,", their letter, "With love," and their name, then a
  "write back" button (and Reply goes to them) or a note that they left no
  address, and when it was posted. Plain-text version too. Email HTML is
  tables and inline styles only (that's what email apps support); keep it
  that way. `tools/letter-preview.html` shows it in a browser (from a local
  server), using the same function.
- **The script** checks each letter (name and letter required, lengths
  capped, email checked, the honeypot), sends at most 12 an hour
  (`PER_HOUR`), and answers the page in JSON. It sends with `MailApp`
  (permission to send email only, not to read any).
- **Where it lives:** the Apps Script project **"Serena's mailbox"** in
  Rex's Google account (script.google.com), deployed as a web app
  ("the garden mailbox": execute as Rex, anyone can access). Its `/exec`
  address is the form's `action` in `mailbox.html` (marked `MAILBOX
  ADDRESS`); it's safe to publish, since it can only send Serena a letter.
  `SEND_TO` in that copy is Serena's address; it is never in this repo.
  Letters come from Rex's Gmail under the name "Serena's Garden", and a
  copy of each stays in his Sent mail, so the page says "Your letter is
  emailed straight to me" (not "only to me"). Rex and Serena are fine with
  that.
- **Changing the letter's look:** edit `tools/mailbox-apps-script.js`, then
  in the Apps Script project paste it over `Code.gs` (keeping its `SEND_TO`
  line: never paste Serena's address back into the repo), save, and
  Deploy, Manage deployments, the pencil, Version: New version, Deploy. The
  `/exec` address stays the same, so the page needs no change. Pasting with
  `pbcopy` needs `LANG=en_US.UTF-8`, or the emoji turn to mojibake.
- **Closing it:** empty the form's `action`; the desk shows "opens soon".
- **Setting one up from scratch** (if it ever moves accounts): new project
  at script.google.com, paste the file, set `SEND_TO`, Run
  `sendTestLetter` once to grant "send email as you" (Google warns the app
  is unverified because it's your own: Advanced, then Go to), then Deploy,
  New deployment, Web app, execute as Me, access Anyone, and put the new
  `/exec` address in the form.
- **History (October 2026):** Claude first emailed Rex a rendered sample.
  Then it was deployed sending to Rex, a real letter written on the page
  arrived in his inbox, and only then was `SEND_TO` switched to Serena's
  address (version 2). No test letters were sent to Serena.

## The Gallery

`art.html`: Serena's art. Rex wanted it more like Travels than the Kitchen:
a page, not a room (so Gemma doesn't follow you in), because there are a lot
of pieces and more to come. But **it looks and feels like a room of the
cottage** (Rex found the first version, a plain panel on the page, "off" and
not fun enough; October 2026): like the kitchen it fills the screen
(`.gal-room`, sharing the kitchen's room rules), with the bunting-and-
fairy-light garland, the hanging wooden sign ("paintings by serena / The
Gallery", the page's `<h1>`) and a "back inside" pill beside it, and a taped
paper note saying how to wake the paintings up. The wall is the page's own
wallpaper (soft sage-cream paint with a fine double pinstripe and a scatter
of paint dabs; `--g-wall`), picture rails run wall to wall, and every piece
hangs from a brass hook on a cord, in its own frame and mat, with a little
paper label under it held on with washi tape (five tapes, each label a touch
crooked; both steady per piece). Below: a sage beadboard dado under a chair
rail, a skirting board, and a plank floor with a braided rug, the bench, a
painter's corner (an easel with a half-finished painting, a stool with her
palette, a jar of brushes) and plants; the room links sit on the floor. The
`gal-` prefix is the gallery's own; don't use `g-`, which is Gemma's.
**It's a room, so Gemma follows you in** (Rex, October 2026; see "Rooms,
and Gemma following you in"): she has a good long look at the easel's
half-finished painting (sitting beside it, tipping her head one way, then
the other), yawns, and curls up for a nap on the rug in front of the bench.
The floor stage is `.gal-floor__stage`. At night the wall goes dark and each piece sits in a
pool of warm light (`--lamp`).

- **Every piece is shown whole, straight away** (Rex's ask): nothing is
  cropped. `assets/art.js` lays the wall out in rows of one height that fill
  the width, like a hung wall, so any number of pieces of any shape hang
  neatly; the last row is centred, not stretched. The sizes it works from are
  plain pixel custom properties on `.hang` (`--pad-mould`, `--pad-mat`,
  `--gap`, `--row-h`, `--rail`, `--cord`, `--label`, `--row-gap`), smaller on
  phones. Each frame hangs a hair crooked (a steady tilt from its id) and
  lifts a little when you point at it.
- **Full screen:** tap a piece and it lifts off the wall into a dark viewer
  (the image flies from its frame), with its title, date, medium, size and
  Serena's `note`. Arrows, arrow keys or a swipe go to the next one (it wraps
  round); Esc, the close button, a tap on the dark or a swipe down put it
  back (into its frame). Where the browser allows it (not iPhones), a button
  fills the whole screen. `art.html#<id>` opens straight onto a piece, the
  address follows the piece you're looking at, and Back closes the viewer.
  The wall's picture shows at once and the sharper `full` one swaps in when
  it's loaded; the next and previous ones are fetched ahead.
- **The data** is `assets/art-data.js` (format at its top): `id`, `title`,
  `year`, `medium`, optional `size` and `note`, `alt` (what's in it, for
  screen readers), `src` (about 1200px long side) and optional `full` (about
  2400px), `w`/`h` (pixel size, so the wall lays out before pictures load),
  optional `frame` (oak, walnut, gilt, cream, ink, sage, rose; otherwise one
  is picked in turn) and optional `collection` (filter buttons appear under
  the plaque once there are two or more).
- **Every piece has a frame made for it (Rex's ask)**, picking up its
  colours: `.frame--<id>` in style.css. A frame is a moulding (`--mould`,
  `--mw` wide), a thin coloured slip (`--lip`, `--lw`) and a mat (`--mat`,
  `--matw`), widths as plain numbers times `--fs` (.55 on phones), which
  art.js reads to lay the wall out; optional `--inline` (a fine line or
  beading) and `--orn` (an ornament in each corner). So: the moonlit sea in
  midnight blue with a gold slip; the beach in driftwood with a red slip for
  the umbrella; the rabbits in walnut; the skiers in alpine blue with
  snowflakes; the cherry blossom in pale pink with blossoms and a wide mat;
  undersea in sea-glass aqua with starfish; the child on the moon in beaded
  gilt on a night-blue mat with gold stars; the meadow in leaf green; the
  cliffs in sandstone; the puppy in honey wood with paw prints; the dusk sky
  in plum; the snowy forest in frosted silver with snowflakes; the colour
  blocks with four sides in four of its colours; the sea creature in teal
  with a lilac slip; the ocean in whitewashed blue; the winter valley in
  pewter; the two studies in slim plain frames (their paper is their mat).
  Frames of different widths hang from one rail, so slimmer ones drop a
  little (`--drop`) to line a row up through its middles.
- **Each piece has its own little animation** (`fx` in the data, built by
  art.js, styled as `.fx-*`): moonlight glinting on the moonlit sea and its
  moon glowing, the sea sparkling (beach, ocean, horizon), ripples round the
  canoe, snow falling (skiers, snowy forest, winter valley), cherry petals
  drifting, bubbles rising (undersea, the sea creature), the child's stars
  twinkling and the one she holds glowing, butterflies over the meadow and
  the colour-block flowers, birds crossing the cliffs' sky, the puppy's
  shimmer sparkling and her eyes blinking, fireflies under the dusk trees,
  mist through the blue study. Positions are fractions of the picture, sizes in container-query
  units, so the same animation fits a small frame and full screen. On the
  wall it fades in and plays only while you point at the piece (nothing
  runs otherwise); full screen it always plays. None of it with reduced
  motion.
- **Full screen** also takes its dark from the piece (`tone`), and a click
  zooms 2.4x into the picture where you clicked, following the mouse (Esc
  or a click zooms out); phones pinch.
- **Pictures** go in `assets/art/` (`<id>.jpg`, 1000px, and `<id>-full.jpg`,
  up to 2000px) by `python3 tools/prepare_art.py <image> <id>`: it makes
  both JPEGs with macOS `sips` and strips all their metadata (it checks),
  keeping only the colour profile, then prints the sizes for the data. (That
  covers rule 2 for the gallery; `exiftool` isn't installed.) They're public
  files once pushed, full size included.
- **The first 18 (October 2026)** came untitled, as photos of the paintings
  (Rex formatted them; don't crop them). Serena will title them; until a
  piece has a title, its label (and its full-screen caption) shows just the
  date and medium, with no "Untitled" (Rex's call). The puppy (Rex's file
  said "bear") was photographed on her side; Rex had her turned upright, so
  `brown-puppy` is the original rotated 90° clockwise. The years (2025 or 2026) and mediums are Claude's
  guesses from the pictures, for her to correct. The hanging order is
  Claude's too (Rex: the file numbers meant nothing), mixing colours,
  subjects and shapes so neighbours differ, with the two paper studies
  ending the wall together. The ids are Rex's file names.
- **Placeholders:** with `sample: true`, entries without a picture show a
  blank canvas with a pencil doodle, labelled "Empty frame · art coming
  soon", and the plaque says the frames are waiting.

## Rooms, and Gemma following you in

Some pages are designed as **rooms** of the cottage (the Kitchen and the
Gallery so far); others are just pages (Travels). **Rex's rule (October 2026): on every page
designed as a room, Gemma follows you in. On pages that aren't rooms, she
doesn't.** So every new room page needs:

- `<body data-section="…" data-room>`: the `data-room` marker is what makes
  her come. Leave it off pages that aren't rooms.
- A floor strip for her: an element with `data-gemma-stage` (position
  relative, sitting in front of the furniture), with CSS `--gemma-feet` (how
  far below its top her feet touch the floor), `data-gemma-nap` (where she
  naps, a fraction across) and optionally `data-gemma-nap-night`.
- Optionally somewhere she goes first, on one element in the stage, with
  `data-gemma-at` (the fraction across it; over 1 is past its right edge):
  `data-gemma-spot="bowl"` and she snacks there (her head goes over that
  point; the kitchen), or `data-gemma-spot="look"` and she sits there and
  has a good long look, head tipped (the gallery's easel).
- `assets/gemma-kit.js` then `assets/gemma-follow.js` at the end of the page.

She walks in from the left edge of the screen (the way you came), visits her
spot (eats, or looks), sits and yawns, walks to her nap spot, turns round and curls up; then
dozes, with the odd stretch and look around. Petting works everywhere. With
reduced motion she's already asleep in her nap spot. **Her drawing and petting
live once, in `gemma-kit.js`** (`GemmaKit.art`, `.button()`, `.petting()`),
used by the cottage too, so she looks the same in every room; change her
there. Her poses are `walk`, `jump`, `sit`, `sleep` and `eat` (the walk pose
with her head, `.g-head`, dipped into a bowl).

## The Kitchen

`kitchen.html`: another room of the cottage. Built to Rex's brief;
everything it says is in `assets/kitchen-data.js`, and the behaviour is
`assets/kitchen.js`.

- **It fills the screen, like the cottage** (Rex found the first, boxed
  version too flat). The strawberry wallpaper is the page itself
  (`body[data-section="kitchen"]::before`), the cottage's bunting-and-lights
  garland hangs across the top, the hanging wooden sign is the heading (with
  a "back inside" link beside it), and `.kroom` is a full-height column like
  `.cottage`. The room links sit on the floor.
- **Depth:** the countertops show their top surface (objects stand on it),
  with a shadow under the counter lip, bevelled cabinet doors, a recessed toe
  kick and a baseboard; the appliances have a soft sheen and drop shadows;
  daylight glows on the wall around the window and the room's corners fall
  into a little shade. **The floor is a real plane in perspective**
  (`.k-floor__plane`, rotateX 90deg seen from eye height), with the window's
  light lying on it by day, a rug, and a warm glow in front of the oven when
  it's open (`:has()`). The 3D floor is kept in its own layer
  (`.k-floor__view`): without that, Chrome depth-sorts it in front of
  Gemma's bowls and the links. Things placed on the plane spread out by
  perspective, so the rug's position is worked out, not eyeballed.

- **The wall:** open shelves (flour, sugar and cocoa canisters, plates,
  cookbooks, mugs on hooks, a pothos), the window over the garden (real sky,
  sun by day, the real moon phase, stars and fireflies by night, the fairy
  tree far off) with gingham valance and café curtains, and a chalkboard of
  "kitchen notes" telling visitors what to tap. It's HTML so it stays
  readable on phones.
- **Tabitha**, Serena's sourdough starter, is the jar on the windowsill. Her
  tag ("meet Tabitha, my sourdough starter!") shows on hover, keyboard focus
  or tap, and the starter bubbles and rises a little.
- **The counter run** is two runs (`.k-run--a`: fridge and coffee corner;
  `.k-run--b`: crock, sourdough, fruit bowl, range). Each is one backdrop SVG
  (tiles, countertop, sage cabinets) plus objects placed in its own units with
  `--x/--y/--w/--h` over `--rw` x 392, so the whole run scales together and
  the counter heights always line up. On screens up to 860px the runs stack,
  with a strip of floor between them.
- **The coffee machine:** tap it and it brews into the glass mug (the first
  time), then her order prints out of the top on a ticket: "Double shot
  americano, with a splash of milk". Tap again to put the ticket away.
- **The oven** (on the vintage range): tap and the door really swings down
  (a CSS 3D door, front and back faces, viewed from slightly above), showing
  a tray of cookies with a "my cookie recipes!" tag. Tap the cookies for the
  recipe box (a `<dialog>`): her favorites, pan-banging chocolate chip,
  pumpkin marshmallow, brown butter chocolate chip, and maple. Each recipe
  can later get a `link` or a `note` in the data; until one does, the card
  says the full recipes are coming soon.
- **The sourdough** on the bread board has a tag too ("fresh sourdough, made
  with Tabitha").
- **For later (Rex's plan):** the fridge opens (a 3D door) to her **top
  drinks**, and the fruit bowl shows her **top fruits**. Both lists are empty
  in the data, so they say "coming soon"; filling `drinks` or `fruits` is the
  only edit needed.
- **The range clock** shows the real time in St. Petersburg (sky.js's time
  zone), like the rest of the garden.
- **The window follows the weather** (weather.js loads on this page too):
  it reuses the cottage window's cloud deck (`.win-clouds`) and rain, storm,
  fog and snow layers (`.weather-fx`); grey skies hide the sun, the stars and
  the sunbeam on the floor, and dim the moon.
- **Gemma follows you in** (it's a room): she has a snack at her bowls by the
  cabinets, then naps in the sunbeam in the middle of the floor, or by the
  warm oven after dark.
- Food, paper, the chalkboard and the starter keep fixed colours (dimmed a
  little at night); the room itself uses theme tokens (`--cab`, `--tile`,
  `--enamel`, `--chrome`, `--fridge`, `--copper`, `--k-wall`, `--k-floor-*`).
- Reduced motion: everything still works, instantly, with nothing moving.

## Gemma

Serena's cat: a **seal bicolor ragdoll, female**, and Serena adores her. She
is the heart of the home page, so treat her with care.

- **What she looks like (keep this accurate):** white chest, belly, legs and
  paws; seal-brown (dark brown) ears, mask, back and big plumed tail; a white
  inverted "V" running down her face between the eyes to the muzzle; blue eyes;
  pink nose and inner ears. She wears a rose collar with a gold heart tag. Her
  fur colours are fixed hex values (she's the same cat at night, just dimmed a
  touch), unlike the room, which uses theme tokens.
- **She follows you into rooms**: see "Rooms, and Gemma following you in".
- **She's outside on the door screen too** (Rex asked for her to be out in
  the garden doing something; `assets/gemma-outside.js`). She plays in the
  meadow at the foot of the tree, between the rose bush and the pond. By day
  an orange butterfly drifts in and lands on the nearest rose: she spots it
  (nose up), crouches, wiggles and leaps; it gets away; she sits, tilts her
  head to watch it go, washes a paw, and pads back to her spot. Sometimes she
  naps in the grass. After dark it's a firefly. In rain or snow nothing comes
  to play, so she washes and naps under the tree. **When you open the door she
  dashes in ahead of you** (she's brought to the front for the run and fades
  at the threshold). She's a `<button>` (petting works; she comes after the
  door when tabbing). Places are in door units (x from the middle of the
  door, y up from the ground line at scene y 882; one unit is `--ds` pixels),
  so she stays the right size beside the door; `HOME`, `ROSE`, `POUNCE` and
  `DOORWAY` at the top of the script. She lands just clear of the rose bush,
  because the bush is part of the door tree, which is drawn in front of her.
  Reduced motion: she just sits by the pond. She isn't created at all when the
  door is skipped (coming back from a room).
- **Where she lives:** `.floor__stage` in `index.html`: her bed (two SVG
  halves, `.cat-bed--back` and `.cat-bed--front`, so she sleeps *between*
  them; "gemma" is embroidered on the front), and her cat tree (`.cat-tree`:
  condo, middle shelf, top perch, pom-pom toy). She is a `<button class="gemma">`
  whose SVG is filled from `GemmaKit.art` (`assets/gemma-kit.js`), with poses
  `g-walk` (side view, also used for `stand`, `crouch`, `jump` and `eat`),
  `g-sit` (front view, with a yawn), and `g-sleep` (curled up, with drifting
  z's). `data-pose` picks which is shown. Classes add moods: `is-yawning`,
  `is-curious` (nose up, or a head tilt sitting), `is-grooming` (a paw raised
  to her chin; `.g-sit-head`, `.g-paw` and `.g-lick` in the art),
  `is-wiggling` (crouched, about to pounce) and `is-running`.
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
- **Wallpaper:** whichever one the visitor picked (see "Wallpapers"), on
  `body::before`; garden stripe (soft stripes and sparse sprigs) by default.
  The kitchen and gallery have their own.
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
2. **Strip location data from photos before committing.** (Gallery art: `tools/prepare_art.py` does it.) Phone photos carry
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

- Serena reviews and rewrites the draft copy in `sections.js`, and names the
  toadstool.
- Real "currently" entries. Then set `sample: false`.
- Travels: Serena's own `note` for each place and a `favorite` for each
  country (both empty), and her rewrite of the draft blurbs.
- Kitchen: her top drinks (the fridge) and top fruits (the fruit bowl), and
  any recipe links or notes for the cookies, all in `kitchen-data.js`.
- Gallery: Serena titles the 18 pieces and corrects the guessed years and
  mediums (all in `art-data.js`); any notes she'd like shown full screen.
- Pick the next section to build.
