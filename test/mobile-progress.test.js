const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "universal-theater-player_greasyfork.user.js"),
  "utf8",
);
new Function(source);

function section(start, end, from = 0) {
  const startIndex = source.indexOf(start, from);
  assert.notEqual(startIndex, -1, `missing section start: ${start}`);
  const endIndex = source.indexOf(end, startIndex);
  assert.notEqual(endIndex, -1, `missing section end: ${end}`);
  return source.slice(startIndex, endIndex);
}

const customPlayerStart = source.indexOf("var T = function() {");
const customPlayerInit = section(
  '"key": "init",',
  '"key": "close",',
  customPlayerStart,
);
assert.match(
  customPlayerInit,
  /createMiniProgressBar\(\)/,
  "the active theater-player initialization must create the mini progress bar",
);

const raisedPlayerLayers = section(
  "function raisePlayerLayers()",
  "function hideTopBars()",
);
assert.match(
  raisedPlayerLayers,
  /"\.tm-mini-progress-bar-container", Z_INDEX \+ 4/,
  "the theater shield must raise the mini progress bar above the video layer",
);

const compactPortraitMode = section(
  '"key": "isCompactPortraitMode",',
  '"key": "updateMiniProgressVisibility",',
);
assert.match(
  source,
  /updateVideoAspectRatio\(\);\s+if \(r\.isCompactMobileViewport\(\)\) {\s+r\.handleOrientationChange\(\);/,
  "metadata refresh must handle entering and leaving portrait-video mode on compact mobile viewports",
);
assert.match(
  compactPortraitMode,
  /targetVideo && this\.targetVideo\.videoWidth/,
  "compact portrait mode must inspect the video width",
);
assert.match(
  compactPortraitMode,
  /targetVideo && this\.targetVideo\.videoHeight/,
  "compact portrait mode must inspect the video height",
);

const miniProgressFactory = section(
  '"key": "createMiniProgressBar",',
  '"key": "createControlButtonsContainer",',
);
assert.match(
  miniProgressFactory,
  /position:relative/,
  "the portrait-video mini progress bar must participate in layout below the video",
);
assert.doesNotMatch(
  miniProgressFactory,
  /bottom:calc\(10px/,
  "the portrait-video mini progress bar must not overlay the viewport bottom",
);

const containerSizing = section(
  '"key": "updateContainerMinHeight",',
  '"key": "assembleDOM",',
);
assert.match(
  containerSizing,
  /isCompactPortraitMode\(\)/,
  "portrait-video sizing must use the compact mobile layout",
);
assert.match(
  containerSizing,
  /window\.innerHeight[^;]+;[\s\S]+Math\.min\(a, l\)/,
  "portrait-video height must be capped so the mini progress bar stays inside the viewport",
);

const clickStart = source.indexOf('this.videoWrapper.addEventListener("click"');
assert.notEqual(clickStart, -1, "missing video click handler");
const videoClickHandler = source.slice(clickStart, clickStart + 1800);
assert.match(
  videoClickHandler,
  /isCompactPortraitMode\(\) && !r\.controlsVisible[\s\S]+showControls\(\)[\s\S]+autoHideControls\(\)[\s\S]+return;/,
  "the first tap with hidden portrait-video controls must reveal controls without pausing",
);

console.log("mobile progress regression checks passed");
