/* Travels: every place Serena has been, as she listed them (October 2026).
 *
 * The globe, the postcards and the passport on travels.html all read this
 * file; add a place here and it appears everywhere. Places are listed in
 * tour order (the "take the tour" button flies through them top to bottom),
 * roughly west to east.
 *
 *   name     what the postcard says
 *   where    the rest of the place's name, in Serena's own words
 *   country  a key in `countries` below
 *   lat/lon  decimal degrees. For a region (Scotland, the Cotswolds...) the
 *            pin sits near its middle. City level only, never anything finer.
 *   tz       IANA time zone, for "it's 9:14 pm there right now"
 *   stamp    which little drawing goes on the postcard's stamp (see STAMPS in
 *            travels.js)
 *   blurb    one line about the place. DRAFT, for Serena to rewrite.
 *   note     Serena's own words about her trip. Empty until she writes it;
 *            the postcard shows a "not written yet" line until then.
 *
 * countries:
 *   geo      the country's name in globe-geo.js (Natural Earth), so the
 *            globe can tint it. null when it's too small to draw (Monaco).
 *   tintBox  optional [west, south, east, north]: only tint the parts of the
 *            country inside it. France's Natural Earth outline includes its
 *            overseas regions (French Guiana, Réunion...), which she hasn't
 *            been to, so only mainland France and Corsica are tinted.
 *   favorite Serena's one favorite spot in that country. Empty until she
 *            picks; the passport hides the line until then.
 */
window.TRAVELS = {
  countries: {
    us: { name: "United States", geo: "United States of America", continent: "North America", favorite: "" },
    cr: { name: "Costa Rica",    geo: "Costa Rica",     continent: "North America", favorite: "" },
    ie: { name: "Ireland",       geo: "Ireland",        continent: "Europe", favorite: "" },
    gb: { name: "United Kingdom", geo: "United Kingdom", continent: "Europe", favorite: "" },
    fr: { name: "France",        geo: "France",         continent: "Europe", favorite: "",
          tintBox: [-10, 40, 12, 52] },
    mc: { name: "Monaco",        geo: null,             continent: "Europe", favorite: "" },
    it: { name: "Italy",         geo: "Italy",          continent: "Europe", favorite: "" },
    gr: { name: "Greece",        geo: "Greece",         continent: "Europe", favorite: "" },
    al: { name: "Albania",       geo: "Albania",        continent: "Europe", favorite: "" },
    es: { name: "Spain",         geo: "Spain",          continent: "Europe", favorite: "" },
    ma: { name: "Morocco",       geo: "Morocco",        continent: "Africa", favorite: "" },
    dk: { name: "Denmark",       geo: "Denmark",        continent: "Europe", favorite: "" },
    no: { name: "Norway",        geo: "Norway",         continent: "Europe", favorite: "" },
    vn: { name: "Vietnam",       geo: "Vietnam",        continent: "Asia", favorite: "" },
    jp: { name: "Japan",         geo: "Japan",          continent: "Asia", favorite: "" }
  },

  places: [
    { id: "carmel", name: "Carmel-by-the-Sea", where: "United States", country: "us",
      lat: 36.5552, lon: -121.9233, tz: "America/Los_Angeles", stamp: "cottage",
      blurb: "A storybook village on California's Monterey Peninsula, full of fairytale cottages and cypress trees above a white-sand beach.",
      note: "" },
    { id: "los-angeles", name: "Los Angeles", where: "United States", country: "us",
      lat: 34.0522, lon: -118.2437, tz: "America/Los_Angeles", stamp: "palms",
      blurb: "Palm-lined streets, Pacific beaches and the Hollywood sign up in the hills.",
      note: "" },
    { id: "joshua-tree", name: "Joshua Tree", where: "United States", country: "us",
      lat: 33.8734, lon: -115.9010, tz: "America/Los_Angeles", stamp: "joshua",
      blurb: "A desert park named for its spiky Joshua trees, where the Mojave meets the Colorado Desert.",
      note: "" },
    { id: "sun-valley", name: "Sun Valley", where: "United States", country: "us",
      lat: 43.6971, lon: -114.3517, tz: "America/Boise", stamp: "ski",
      blurb: "An Idaho mountain resort that opened in 1936 and built the world's first chairlifts.",
      note: "" },
    { id: "costa-rica", name: "Costa Rica", where: "Central America", country: "cr",
      lat: 9.7489, lon: -83.7534, tz: "America/Costa_Rica", stamp: "sloth",
      blurb: "Cloud forests, volcanoes and sloths, between the Pacific and the Caribbean.",
      note: "" },
    { id: "st-petersburg", name: "St. Petersburg", where: "United States", country: "us",
      lat: 27.7676, lon: -82.6403, tz: "America/New_York", stamp: "sunset",
      blurb: "Florida's Sunshine City on Tampa Bay. The garden's sun, moon and weather all follow its sky.",
      note: "" },
    /* Ocean City: assumed Ocean City, Maryland. If she means Ocean City, New
       Jersey, change lat/lon to 39.2776, -74.5746 (nothing else changes). */
    { id: "ocean-city", name: "Ocean City", where: "United States", country: "us",
      lat: 38.3365, lon: -75.0849, tz: "America/New_York", stamp: "boardwalk",
      blurb: "A classic Atlantic beach town with a long boardwalk, saltwater taffy and sunrise over the ocean.",
      note: "" },
    { id: "new-york", name: "New York City", where: "United States", country: "us",
      lat: 40.7128, lon: -74.0060, tz: "America/New_York", stamp: "skyline",
      blurb: "Central Park, yellow cabs, bagels and the skyline from the Brooklyn Bridge.",
      note: "" },
    { id: "dublin", name: "Dublin", where: "Ireland", country: "ie",
      lat: 53.3498, lon: -6.2603, tz: "Europe/Dublin", stamp: "door",
      blurb: "Ireland's capital on the River Liffey, with bright Georgian doors and cozy pubs.",
      note: "" },
    { id: "scotland", name: "Scotland", where: "United Kingdom", country: "gb",
      lat: 56.4907, lon: -4.2026, tz: "Europe/London", stamp: "castle",
      blurb: "Lochs, castles and misty Highland glens.",
      note: "" },
    { id: "london", name: "London", where: "England, United Kingdom", country: "gb",
      lat: 51.5074, lon: -0.1278, tz: "Europe/London", stamp: "bigben",
      blurb: "Red buses, the Thames, and Big Ben keeping time over Westminster.",
      note: "" },
    { id: "cotswolds", name: "The Cotswolds", where: "England, United Kingdom", country: "gb",
      lat: 51.8306, lon: -1.8384, tz: "Europe/London", stamp: "cotswold",
      blurb: "Rolling hills and villages of honey-colored stone cottages in the English countryside.",
      note: "" },
    { id: "stonehenge", name: "Stonehenge", where: "England, United Kingdom", country: "gb",
      lat: 51.1789, lon: -1.8262, tz: "Europe/London", stamp: "stones",
      blurb: "A ring of giant standing stones on Salisbury Plain, begun about 5,000 years ago.",
      note: "" },
    { id: "paris", name: "Paris", where: "France", country: "fr",
      lat: 48.8566, lon: 2.3522, tz: "Europe/Paris", stamp: "eiffel",
      blurb: "The Eiffel Tower, the Seine and a café on every corner.",
      note: "" },
    { id: "chamonix", name: "Chamonix", where: "France", country: "fr",
      lat: 45.9237, lon: 6.8694, tz: "Europe/Paris", stamp: "peaks",
      blurb: "An Alpine town beneath Mont Blanc, the highest peak in the Alps, and home of the first Winter Olympics in 1924.",
      note: "" },
    { id: "monaco", name: "Monaco", where: "Monaco", country: "mc",
      lat: 43.7384, lon: 7.4246, tz: "Europe/Monaco", stamp: "yacht",
      blurb: "A tiny principality on the French Riviera, and the second-smallest country in the world.",
      note: "" },
    { id: "florence", name: "Florence", where: "Italy", country: "it",
      lat: 43.7696, lon: 11.2558, tz: "Europe/Rome", stamp: "dome",
      blurb: "Birthplace of the Renaissance, under Brunelleschi's great red-tiled dome.",
      note: "" },
    { id: "rome", name: "Rome", where: "Italy", country: "it",
      lat: 41.9028, lon: 12.4964, tz: "Europe/Rome", stamp: "colosseum",
      blurb: "The Eternal City: the Colosseum, the Trevi Fountain and gelato on every piazza.",
      note: "" },
    { id: "corfu", name: "Corfu", where: "Greece", country: "gr",
      lat: 39.6243, lon: 19.9217, tz: "Europe/Athens", stamp: "island",
      blurb: "A green Ionian island whose Venetian-era old town is a UNESCO World Heritage site.",
      note: "" },
    { id: "albanian-riviera", name: "Albanian Riviera", where: "Albania", country: "al",
      lat: 40.1017, lon: 19.7447, tz: "Europe/Tirane", stamp: "cove",
      blurb: "Albania's Ionian coast of turquoise coves and hillside villages, just across the water from Corfu.",
      note: "" },
    { id: "menorca", name: "Menorca", where: "Spain", country: "es",
      lat: 39.9496, lon: 4.1104, tz: "Europe/Madrid", stamp: "lighthouse",
      blurb: "The quieter Balearic island, ringed by white-sand coves and a UNESCO Biosphere Reserve since 1993.",
      note: "" },
    { id: "mallorca", name: "Mallorca", where: "Spain", country: "es",
      lat: 39.6953, lon: 3.0176, tz: "Europe/Madrid", stamp: "sailboat",
      blurb: "The biggest of Spain's Balearic Islands, with turquoise coves and the Tramuntana mountains.",
      note: "" },
    { id: "barcelona", name: "Barcelona", where: "Spain", country: "es",
      lat: 41.3874, lon: 2.1686, tz: "Europe/Madrid", stamp: "spires",
      blurb: "Catalonia's seaside capital, home of Gaudí's Sagrada Família and Park Güell.",
      note: "" },
    { id: "morocco", name: "Morocco", where: "North Africa", country: "ma",
      lat: 31.7917, lon: -7.0926, tz: "Africa/Casablanca", stamp: "arch",
      blurb: "Spice-scented souks, tiled riads, the Atlas Mountains and the edge of the Sahara.",
      note: "" },
    { id: "copenhagen", name: "Copenhagen", where: "Denmark", country: "dk",
      lat: 55.6761, lon: 12.5683, tz: "Europe/Copenhagen", stamp: "harbor",
      blurb: "Denmark's capital: the colorful harbor houses of Nyhavn, bikes everywhere, and the Little Mermaid.",
      note: "" },
    { id: "tromso", name: "Tromsø", where: "Norway", country: "no",
      lat: 69.6492, lon: 18.9553, tz: "Europe/Oslo", stamp: "aurora",
      blurb: "Far above the Arctic Circle, with northern lights all winter and the midnight sun in summer.",
      note: "" },
    { id: "hanoi", name: "Hanoi", where: "Vietnam", country: "vn",
      lat: 21.0285, lon: 105.8542, tz: "Asia/Ho_Chi_Minh", stamp: "pho",
      blurb: "Vietnam's capital of lakes, motorbikes and the Old Quarter, and steaming bowls of pho.",
      note: "" },
    { id: "kyoto", name: "Kyoto", where: "Japan", country: "jp",
      lat: 35.0116, lon: 135.7681, tz: "Asia/Tokyo", stamp: "torii",
      blurb: "Japan's imperial capital for more than a thousand years: temples, gardens and the torii gates of Fushimi Inari.",
      note: "" },
    { id: "tokyo", name: "Tokyo", where: "Japan", country: "jp",
      lat: 35.6762, lon: 139.6503, tz: "Asia/Tokyo", stamp: "fuji",
      blurb: "Neon crossings, tiny alleyway restaurants and quiet shrine gardens in Japan's capital.",
      note: "" },
    { id: "niseko", name: "Niseko", where: "Japan", country: "jp",
      lat: 42.8048, lon: 140.6874, tz: "Asia/Tokyo", stamp: "snow",
      blurb: "A Hokkaido ski town famous for deep, light powder snow, beneath the cone of Mount Yōtei.",
      note: "" }
  ]
};
