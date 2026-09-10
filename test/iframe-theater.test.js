const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "universal-theater-player_greasyfork.user.js"),
  "utf8",
);
new Function(source);

function section(start, end) {
  const startIndex = source.indexOf(start);
  assert.notEqual(startIndex, -1, `missing section start: ${start}`);
  const endIndex = source.indexOf(end, startIndex);
  assert.notEqual(endIndex, -1, `missing section end: ${end}`);
  return source.slice(startIndex, endIndex);
}

assert.match(
  source,
  /^\/\/ @match \*:\/\/123av\.com\/\*$/m,
  "123av pages must remain supported",
);
assert.match(
  source,
  /^\/\/ @match \*:\/\/javplayer\.cc\/\*$/m,
  "123av's javplayer child frame must load the script so the floating time controls can open",
);
assert.match(
  source,
  /^\/\/ @match \*:\/\/\*\.javplayer\.cc\/\*$/m,
  "javplayer child frame subdomains must remain supported",
);

const floatingButtonClick = section(
  '"key": "handleButtonClick",',
  '"key": "remove",',
);
assert.match(
  floatingButtonClick,
  /MissPlayerDebug\.findBestPlayerFrame\(\)[\s\S]+new MissPlayerIframeTheater\(r, this\.button\)[\s\S]+\.open\(\)/,
  "an embedded 123av player must use iframe theater mode before the standalone player fallback",
);

const floatingButtonFactory = section(
  '"key": "createButton",',
  '"key": "updateButtonPosition",',
);
assert.match(
  floatingButtonFactory,
  /addEventListener\("pointerdown", preservePlayerFocus\)[\s\S]+addEventListener\("mousedown", preservePlayerFocus\)/,
  "the theater button must not steal focus and trigger an embedded player pause",
);
assert.match(
  floatingButtonFactory,
  /preservePlayerFocus[\s\S]+event\.preventDefault\(\)/,
  "focus preservation must cancel the button's default focus action",
);

const iframeOpen = section(
  "IframeTheater.prototype.open = function open()",
  "IframeTheater.prototype.prepareAncestors",
);
assert.doesNotMatch(
  iframeOpen,
  /requestFullscreen|webkitRequestFullscreen/,
  "iframe theater mode must stay inside the webpage and never enter browser fullscreen",
);
assert.match(
  iframeOpen,
  /this\.prepareAncestors\(\);[\s\S]+this\.overlay\.appendChild\(this\.container\);[\s\S]+position:absolute !important;inset:0 !important;width:100% !important;height:100% !important/,
  "iframe theater mode must fill its original player box without moving the browsing context",
);
assert.match(
  iframeOpen,
  /position:absolute !important;inset:0 !important;width:100% !important;height:100% !important/,
  "the iframe must fill its webpage-sized original player box",
);
assert.doesNotMatch(
  iframeOpen,
  /appendChild\(this\.frame\)|insertBefore\(this\.frame\)|removeChild\(this\.frame\)/,
  "opening theater mode must not use a browsing-context-destroying iframe move",
);
const iframeAncestors = section(
  "IframeTheater.prototype.prepareAncestors",
  "IframeTheater.prototype.restoreAncestors",
);
assert.match(
  iframeAncestors,
  /node === this\.originalParent[\s\S]+position", "fixed"[\s\S]+width", "100vw"[\s\S]+height", "100vh"/,
  "the original player box must become the webpage-sized clipping boundary",
);
assert.match(
  iframeAncestors,
  /getComputedStyle\(node\)\.position[\s\S]+position", "relative"/,
  "static outer ancestors must become effective high-z-index stacking contexts",
);

const iframeClose = section(
  "IframeTheater.prototype.close = function close()",
  "return IframeTheater",
);
const iframeChildOpen = section(
  "IframeTheater.prototype.requestChildPlayerOpen",
  "IframeTheater.prototype.close",
);
assert.match(
  iframeChildOpen,
  /send\(\);\s*\};\s*$/,
  "the child player must be opened immediately so theater entry has no smaller intermediate layout",
);
assert.doesNotMatch(
  iframeChildOpen,
  /setTimeout\(send, 150\)/,
  "theater entry must not retain the visible 150ms child-player delay",
);
assert.doesNotMatch(
  iframeClose,
  /exitFullscreen|fullscreenchange/,
  "closing webpage theater mode must not manage browser fullscreen state",
);
assert.doesNotMatch(
  iframeClose,
  /MissPlayerStatefulDOM\.move|insertBefore\(this\.frame|appendChild\(this\.frame/,
  "closing iframe theater mode must not move or reload the iframe",
);
assert.match(
  iframeClose,
  /this\.frame\.setAttribute\("style", this\.originalStyle\)/,
  "closing iframe theater mode must restore the iframe's exact original style",
);

console.log("iframe theater regression checks passed");
