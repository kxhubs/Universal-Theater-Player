const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "universal-theater-player_greasyfork.user.js"),
  "utf8",
);
new Function(source);

const metadataVersion = source.match(/^\/\/ @version (.+)$/m);
const runtimeVersion = source.match(/var VERSION = "([^"]+)";/);
assert.equal(metadataVersion && metadataVersion[1], "5.1.10.11");
assert.equal(runtimeVersion && runtimeVersion[1], "5.1.10.11");
assert.match(source, /^\/\/ @author kxhubs$/m, "userscript author must use the owner's GitHub username");

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
  /miniProgressBarContainer = v\.createMiniProgressBar\(\)/,
  "the active theater-player initialization must retain the mini progress bar so it can be mounted",
);

const styleBootstrap = section(
  "function initCSSVariables()",
  "function _typeof",
);
assert.match(
  styleBootstrap,
  /document\.querySelectorAll\("style"\)[\s\S]+\.tm-player-container/,
  "style startup must verify that the critical theater rules were actually inserted",
);
assert.match(
  styleBootstrap,
  /__webpack_require__\(703\)[\s\S]+Array\.isArray\(cssList\)[\s\S]+entry\[1\][\s\S]+style\.id = "tm-player-styles"[\s\S]+document\.head \|\| document\.documentElement/,
  "style startup must fall back to the bundled CSS when the frame loader misses its target",
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
const miniProgressVisibility = section(
  '"key": "updateMiniProgressVisibility",',
  '"key": "hideControls",',
);
assert.match(
  miniProgressVisibility,
  /dataset\.enabled !== "false"[\s\S]+document\.body\.classList\.contains\("controls-hidden"\)/,
  "the floating timeline must remain visible whenever theater controls are hidden",
);
assert.doesNotMatch(
  miniProgressVisibility,
  /dataset\.enabled !== "false"[^;]+isCompactPortraitMode\(\)/,
  "desktop and landscape theater mode must not be excluded from the floating timeline",
);
assert.match(
  miniProgressVisibility,
  /isCompactPortraitMode\(\)[\s\S]+position = "relative"[\s\S]+else if \(o\)[\s\S]+position = "fixed"[\s\S]+left = "50%"[\s\S]+bottom = "max\(10px, env\(safe-area-inset-bottom, 0px\)\)"/,
  "the floating timeline must stay in mobile layout flow but sit centered at the viewport bottom on desktop",
);
const mobileViewport = section(
  '"key": "isMobileViewport",',
  '"key": "isCompactMobileViewport",',
);
assert.match(
  mobileViewport,
  /ontouchstart|maxTouchPoints|hover: none/,
  "compact portrait layout must remain limited to touch-style devices",
);
assert.match(
  mobileViewport,
  /userAgentData|navigator\.userAgent/,
  "compact portrait layout must require a mobile platform signal so touch PCs stay in desktop mode",
);
assert.match(
  mobileViewport,
  /Math\.min\(window\.innerWidth, window\.innerHeight\) <= 600/,
  "compact portrait layout must remain limited to mobile-sized viewports",
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
const preservedPlayerLayout = section(
  '"key": "assembleDOM",',
  "function ControlManager_typeof",
);
assert.match(
  preservedPlayerLayout,
  /inset", "0", "important"[\s\S]+width", "100vw", "important"[\s\S]+height", "100vh", "important"/,
  "retained site players must immediately use the entire webpage viewport",
);
assert.doesNotMatch(
  preservedPlayerLayout,
  /44px|min\(80vh, 80vw\)|calc\(100vh - 190px\)/,
  "retained site players must not apply a smaller intermediate theater size",
);
assert.match(
  preservedPlayerLayout,
  /targetVideo\.style\.setProperty\("width", "100%", "important"\)[\s\S]+targetVideo\.style\.setProperty\("object-fit", "contain", "important"\)/,
  "retained video boxes must fill the theater area while their content preserves its intrinsic ratio",
);
assert.match(
  preservedPlayerLayout,
  /\.plyr__poster, \.vjs-poster, \.jw-preview, \.art-poster[\s\S]+background-size", "contain"/,
  "site-player poster layers must preserve the video ratio instead of cropping with cover",
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

const videoClickHandler = section(
  "var MissPlayerVideoSurfaceClick = function() {",
  "var MissPlayerDebug = function()",
);
assert.match(
  videoClickHandler,
  /if \(!uiManager\.controlsVisible\) {[\s\S]+showControls\(\)[\s\S]+autoHideControls\(\)[\s\S]+return "revealed";/,
  "the first tap with hidden floating controls must reveal them without pausing on mobile and desktop",
);

console.log("mobile progress regression checks passed");
