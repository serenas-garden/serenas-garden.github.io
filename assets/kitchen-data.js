/* The kitchen (kitchen.html): everything Serena has told us so far.
 *
 * kitchen.js reads this; to change what the kitchen says, edit this file
 * only. All copy is a DRAFT for Serena to rewrite in her own words.
 *
 *   coffee   her order, shown on the ticket that pops out of the coffee
 *            machine. `lines` are printed one per line.
 *   starter  her sourdough starter on the windowsill (shown on hover / tap).
 *   bread    the line on the sourdough loaf by the bread board.
 *   cookies  her favorite cookie recipes, in the oven. Each can later get a
 *            `link` (where the recipe lives) or a `note` (one line of her
 *            own); both are optional. `icon` picks the little cookie drawn
 *            beside it: chip, pumpkin, brown-butter or maple.
 *   drinks   her top beverages, best first. The fridge shows them when it's
 *            opened; while the list is empty it says they're coming soon.
 *   fruits   her top fruits, best first, shown by the fruit bowl. Same deal.
 *            Each entry is just a name, e.g. "Mango".
 */
window.KITCHEN = {
  coffee: {
    title: "Serena's order",
    lines: ["Double shot americano", "with a splash of milk"]
  },

  starter: {
    name: "Tabitha",
    line: "meet Tabitha, my sourdough starter!"
  },

  bread: {
    line: "fresh sourdough, made with Tabitha"
  },

  cookies: [
    { name: "Pan-banging chocolate chip cookies", icon: "chip", link: "", note: "" },
    { name: "Pumpkin marshmallow cookies", icon: "pumpkin", link: "", note: "" },
    { name: "Brown butter chocolate chip cookies", icon: "brown-butter", link: "", note: "" },
    { name: "Maple cookies", icon: "maple", link: "", note: "" }
  ],

  drinks: [],
  fruits: []
};
