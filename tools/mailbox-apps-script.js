/* Serena's mailbox: the Google Apps Script that turns a letter written on
 * mailbox.html into an email.
 *
 * It isn't loaded by any page. It runs in Google Apps Script, in the Google
 * account the letters are sent from, as a web app; mailbox.html posts each
 * letter to that web app's address. Setup is in CLAUDE.md ("The mailbox"):
 * paste this whole file into a new Apps Script project's Code.gs, put the
 * address letters go to in SEND_TO there, run sendTestLetter() once to allow
 * it to send email, then Deploy > New deployment > Web app (execute as me,
 * anyone can access), and paste the /exec address into mailbox.html.
 *
 * NEVER commit an address in SEND_TO. This file is public (the whole repo
 * is); the address lives only in the copy inside Apps Script.
 *
 * Every letter comes out the same way: an HTML email laid out like a letter
 * on cream writing paper, with the stamp the writer picked, a St. Petersburg
 * postmark, "Dear Serena," and their sign-off, then a button to write back.
 * renderLetter() builds it, and only uses plain JavaScript, so
 * tools/letter-preview.html can show it in a browser too.
 */

var SEND_TO = "";                       // the address letters go to: fill in inside Apps Script only
var TIME_ZONE = "America/New_York";     // St. Petersburg, like the rest of the garden
var PER_HOUR = 12;                      // at most this many letters an hour, so it can't be flooded
var SITE = "serenas-garden.github.io";

/* The stamps you can pick on the page. Emoji, so they show in every email
   app with no pictures to load. */
var STAMPS = {
  tulip:     { emoji: "🌷", name: "tulip",     paper: "#f8e1df", ink: "#a8463f" },
  toadstool: { emoji: "🍄", name: "toadstool", paper: "#e4ecd8", ink: "#4f6b40" },
  moon:      { emoji: "🌙", name: "moon",      paper: "#dfe6f3", ink: "#3f5f86" },
  gemma:     { emoji: "🐱", name: "gemma",     paper: "#f6e7a6", ink: "#8a6a1e" }
};

/* ------------------------------ the web app ------------------------------ */

function doGet() {
  return ContentService.createTextOutput("Serena's mailbox is open. Letters are written at " + SITE + "/mailbox.html");
}

function doPost(e) {
  // the page sends JSON as plain text; with scripts off it's an ordinary form
  var data = {};
  try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }
  var result;
  try {
    result = receive(data);
  } catch (err) {
    result = { ok: false, error: "trouble" };
  }
  if (data.via === "form") {
    return HtmlService.createHtmlOutput(
      '<body style="font:17px Georgia,serif;text-align:center;padding:60px 20px;color:#2f3a2c;background:#f4efe2">' +
      (result.ok ? "<h1 style='font-weight:normal;font-style:italic'>Your letter's on its way!</h1>"
                 : "<h1 style='font-weight:normal;font-style:italic'>Hmm, that didn't send.</h1>") +
      '<p><a href="https://' + SITE + '/mailbox.html" style="color:#a8463f">back to the garden</a></p></body>');
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function receive(d) {
  if (!SEND_TO) return { ok: false, error: "closed" };
  if (d.botcheck) return { ok: true };                    // a bot filled the hidden box: pretend, send nothing

  var name = clean(d.name, 80);
  var message = clean(d.message, 4000);
  var email = clean(d.email, 120);
  var stamp = Object.prototype.hasOwnProperty.call(STAMPS, d.stamp) ? d.stamp : "tulip";
  if (!name || !message) return { ok: false, error: "empty" };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "email" };

  var cache = CacheService.getScriptCache();
  var sent = Number(cache.get("sent-this-hour") || 0);
  if (sent >= PER_HOUR) return { ok: false, error: "busy" };
  cache.put("sent-this-hour", String(sent + 1), 3600);

  var now = new Date();
  var mail = renderLetter({
    name: name, message: message, email: email, stamp: stamp,
    when: Utilities.formatDate(now, TIME_ZONE, "EEEE d MMMM yyyy 'at' h:mm a"),
    day: Utilities.formatDate(now, TIME_ZONE, "d MMM").toUpperCase(),
    year: Utilities.formatDate(now, TIME_ZONE, "yyyy")
  });
  var out = { to: SEND_TO, subject: mail.subject, htmlBody: mail.html, body: mail.text, name: "Serena's Garden" };
  if (email) out.replyTo = email;                         // so "Reply" writes straight back to them
  MailApp.sendEmail(out);
  return { ok: true };
}

/* Run this once from the editor (select it, press Run): it asks for
   permission to send email, then sends a sample letter to SEND_TO. */
function sendTestLetter() {
  var now = new Date();
  var mail = renderLetter({
    name: "The Garden", email: "",
    stamp: "toadstool",
    message: "This is a test letter from the mailbox.\n\nIf it landed in your inbox looking like a letter, the mailbox works. Real letters will look just like this one.",
    when: Utilities.formatDate(now, TIME_ZONE, "EEEE d MMMM yyyy 'at' h:mm a"),
    day: Utilities.formatDate(now, TIME_ZONE, "d MMM").toUpperCase(),
    year: Utilities.formatDate(now, TIME_ZONE, "yyyy")
  });
  MailApp.sendEmail({ to: SEND_TO, subject: mail.subject, htmlBody: mail.html, body: mail.text, name: "Serena's Garden" });
}

/* ------------------------------ the letter ------------------------------ */

function clean(v, max) {
  return String(v == null ? "" : v).replace(/\r\n?/g, "\n").replace(/[^\S\n]+$/gm, "").trim().slice(0, max);
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

/* letter: { name, message, email, stamp, when, day, year }
   returns { subject, html, text } */
function renderLetter(letter) {
  var name = letter.name, email = letter.email || "";
  var s = Object.prototype.hasOwnProperty.call(STAMPS, letter.stamp) ? STAMPS[letter.stamp] : STAMPS.tulip;
  var serif = "Georgia,'Times New Roman',serif";
  var hand = "'Bradley Hand','Segoe Print','Snell Roundhand',Georgia,cursive";
  var type = "'Courier New',Courier,monospace";

  // the letter itself, paragraph by paragraph, line breaks kept
  var body = letter.message.replace(/\n{3,}/g, "\n\n").split("\n\n").map(function (para) {
    return '<p style="margin:0 0 16px;font-family:' + serif + ';font-size:17px;line-height:1.7;color:#2f3a2c">' +
      esc(para).replace(/\n/g, "<br>") + "</p>";
  }).join("");

  // a strip of airmail edging: little alternating blocks of rose, cream and blue
  var edge = "";
  for (var i = 0; i < 20; i++) {
    edge += '<td style="height:7px;font-size:0;line-height:0;background:' +
      ["#d98a8f", "#fbf8ef", "#8fa9c8", "#fbf8ef"][i % 4] + '">&nbsp;</td>';
  }
  edge = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr>' + edge + "</tr></table>";

  var stamp =
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right" style="border-collapse:separate">' +
      '<tr><td align="center" style="background:' + s.paper + ';border:5px dotted #fbf8ef;outline:1px solid ' + s.paper + ';padding:8px 10px 7px;width:64px">' +
        '<div style="font-size:34px;line-height:1.15">' + s.emoji + "</div>" +
        '<div style="margin-top:4px;font-family:' + type + ';font-size:8px;letter-spacing:1px;color:' + s.ink + ';text-transform:uppercase">serena&#39;s garden</div>' +
        '<div style="font-family:' + type + ';font-size:9px;font-weight:bold;color:' + s.ink + '">1 HUG</div>' +
      "</td></tr></table>";

  var postmark =
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate"><tr>' +
      '<td align="center" valign="middle" style="width:78px;height:78px;border:2px solid #9aabc2;border-radius:50%;font-family:' + type + ';color:#7d90aa">' +
        '<div style="font-size:8px;letter-spacing:1px">ST. PETE FL</div>' +
        '<div style="font-size:13px;font-weight:bold;letter-spacing:1px;margin:2px 0">' + esc(letter.day) + "</div>" +
        '<div style="font-size:9px;letter-spacing:1px">' + esc(letter.year) + "</div>" +
      "</td>" +
      '<td valign="middle" style="padding-left:4px;font-family:' + type + ';font-size:22px;line-height:13px;color:#9aabc2;letter-spacing:-3px">' +
        "~~~~~~<br>~~~~~~<br>~~~~~~</td>" +
    "</tr></table>";

  var reply = email
    ? '<a href="mailto:' + esc(email) + "?subject=" + encodeURIComponent("Re: your letter") + '" ' +
        'style="display:inline-block;padding:11px 22px;border-radius:999px;background:#5f7d4f;color:#fbf8ef;' +
        "font-family:" + serif + ';font-size:16px;font-style:italic;text-decoration:none">&#9993;&nbsp; write back to ' + esc(name) + "</a>" +
      '<div style="margin-top:8px;font-family:' + serif + ';font-size:13px;color:#7c8873">or just press reply &middot; ' + esc(email) + "</div>"
    : '<div style="font-family:' + serif + ';font-size:14px;font-style:italic;color:#7c8873">' + esc(name) +
        " didn&#39;t leave an address, so this one can&#39;t be answered.</div>";

  var html =
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light"><title>A letter</title></head>' +
    '<body style="margin:0;padding:0;background:#efe6d2">' +
    '<div style="display:none;max-height:0;overflow:hidden">' + esc(letter.message.slice(0, 90)) + "</div>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#efe6d2"><tr>' +
    '<td align="center" style="padding:28px 12px 32px">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">' +
        '<tr><td align="center" style="padding:0 0 14px;font-family:' + type + ';font-size:12px;letter-spacing:2px;color:#5f7d4f">' +
          "&#10047;&nbsp; THE MAILBOX AT SERENA&#39;S GARDEN &nbsp;&#10047;</td></tr>" +
        '<tr><td style="background:#fbf8ef;border:1px solid #e2d6b8;border-radius:4px">' + edge +
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:24px 30px 30px">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
              '<td valign="top">' + postmark + "</td>" +
              '<td valign="top" align="right">' + stamp + "</td>" +
            "</tr></table>" +
            '<p style="margin:22px 0 16px;font-family:' + serif + ';font-size:30px;font-style:italic;color:#2f3a2c">Dear Serena,</p>' +
            '<div style="border-left:2px solid #f0c4c4;padding-left:18px">' + body + "</div>" +
            '<p style="margin:14px 0 0;font-family:' + serif + ';font-size:17px;font-style:italic;color:#5d6a55">With love,</p>' +
            '<p style="margin:2px 0 0;font-family:' + hand + ';font-size:28px;line-height:1.2;color:#a8463f">' + esc(name) + "</p>" +
          "</td></tr></table>" + edge +
        "</td></tr>" +
        '<tr><td align="center" style="padding:22px 10px 6px">' + reply + "</td></tr>" +
        '<tr><td align="center" style="padding:14px 10px 0;font-family:' + serif + ';font-size:12px;line-height:1.5;color:#97a08c">' +
          "posted in the garden mailbox on " + esc(letter.when) + '<br><a href="https://' + SITE + '/" style="color:#97a08c">' + SITE + "</a></td></tr>" +
      "</table>" +
    "</td></tr></table></body></html>";

  var text =
    "Dear Serena,\n\n" + letter.message + "\n\nWith love,\n" + name + "\n\n" +
    "------------------------------\n" +
    (email ? "Write back: " + email + " (or just press reply)\n" : name + " didn't leave an address, so this one can't be answered.\n") +
    "Stamp: " + s.name + "\n" +
    "Posted in the garden mailbox on " + letter.when + "\n" + "https://" + SITE + "/\n";

  return { subject: "💌 A letter from " + name, html: html, text: text };
}
