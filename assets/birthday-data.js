/* The birthday surprise: every word it says. (The surprise itself is
 * assets/birthday-party.js; birthday.js decides when it's on.)
 *
 * It only appears for someone who opens the site through the birthday link,
 *   https://serenas-garden.github.io/#happy-birthday
 * and then stays up on that phone or computer until midnight. No date is
 * written anywhere, so the repo never says when her birthday is.
 *
 *   to, from   the names on the gift tag and the card
 *   tag        the gift tag tied to the door's bow (two short lines)
 *   cover      the front of the card
 *   message    the inside of the card, one paragraph per line. DRAFT:
 *              Rex, this is yours to rewrite in your own words.
 *   signoff    the last line before the name
 */
window.BIRTHDAY = {
  to: "Serena",
  from: "Rex",
  tag: ["for Serena", "love, Rex"],
  cover: "Happy Birthday",
  message: [
    "Happy birthday, Serena!",
    "I built you a little cottage at the edge of the forest: your travels on a globe, your paintings on the walls, your cookies in the oven, the real moon in the window, and Gemma, keeping an eye on all of it.",
    "It's yours to fill up. I hope it feels like you."
  ],
  signoff: "love,"
};
