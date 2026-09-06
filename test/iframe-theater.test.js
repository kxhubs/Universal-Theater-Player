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

const floatingButtonClick = section(
  '"key": "handleButtonClick",',
  '"key": "remove",',
);
assert.match(
  floatingButtonClick,
  /MissPlayerDebug\.findBestPlayerFrame\(\)[\s\S]+new MissPlayerIframeTheater\(r, this\.button\)[\s\S]+\.open\(\)/,
  "an embedded 123av player must use iframe theater mode before the standalone player fallback",
);

const iframeOpen = section(
  "IframeTheater.prototype.open = function open()",
  "IframeTheater.prototype.prepareAncestors",
);
assert.match(
  iframeOpen,
  /this\.prepareAncestors\(\);[\s\S]+this\.overlay\.appendChild\(this\.container\);[\s\S]+this\.container\.appendChild\(this\.frame\);/,
  "iframe theater mode must move the iframe into its full-screen container instead of only resizing it in place",
);
assert.match(
  iframeOpen,
  /position:relative !important;inset:auto !important;width:100% !important;height:100% !important/,
  "the moved iframe must fill the theater container without relying on its original layout",
);

const iframeClose = section(
  "IframeTheater.prototype.close = function close()",
  "return IframeTheater",
);
assert.match(
  iframeClose,
  /this\.frame\.parentNode !== this\.originalParent/,
  "closing iframe theater mode must detect the moved iframe",
);
assert.match(
  iframeClose,
  /this\.originalParent\.insertBefore\(this\.frame, this\.originalNextSibling\)/,
  "closing iframe theater mode must restore the iframe to its original position",
);

console.log("iframe theater regression checks passed");
