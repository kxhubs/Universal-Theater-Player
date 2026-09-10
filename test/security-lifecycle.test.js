const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "universal-theater-player_greasyfork.user.js"),
  "utf8",
);

function section(start, end, from = 0) {
  const startIndex = source.indexOf(start, from);
  assert.notEqual(startIndex, -1, `missing section start: ${start}`);
  const endIndex = source.indexOf(end, startIndex);
  assert.notEqual(endIndex, -1, `missing section end: ${end}`);
  return source.slice(startIndex, endIndex);
}

assert.match(
  source,
  /^\/\/ @match \*:\/\/javday\.app\/\*$/m,
  "Javday pages must load the userscript",
);
assert.match(
  source,
  /^\/\/ @match \*:\/\/\*\.javday\.app\/\*$/m,
  "Javday subdomains must load the userscript",
);

const loginUtils = section("var I = function() {", "function i18n_typeof");
assert.match(
  loginUtils,
  /"userPassword" === r[\s\S]+localStorage\.removeItem\("autologin_"\.concat\(r\)\)/,
  "legacy plaintext passwords must be removed instead of returned or persisted",
);
assert.doesNotMatch(
  source,
  /I\.setValue\("userPassword"/,
  "login handling must never persist a password",
);

const messageSecurity = section(
  "var MissPlayerMessageSecurity = function() {",
  "var MissPlayerDebug = function()",
);
assert.match(
  messageSecurity,
  /event\.source === window\.parent/,
  "messages from a parent must be tied to the actual parent window",
);
assert.match(
  messageSecurity,
  /frame\.contentWindow === event\.source/,
  "messages from a child must be tied to an actual iframe window",
);
assert.match(
  messageSecurity,
  /isTrustedOrigin\(event\.origin\)/,
  "cross-frame messages must reject unknown origins",
);

function createMessageSecurity({ referrer = "", parent = null, frames = [] } = {}) {
  const windowMock = {};
  windowMock.parent = parent || windowMock;
  const documentMock = {
    referrer,
    querySelectorAll(selector) {
      assert.equal(selector, "iframe");
      return frames;
    },
  };
  return new Function(
    "window",
    "document",
    "URL",
    `${messageSecurity}; return MissPlayerMessageSecurity;`,
  )(windowMock, documentMock, URL);
}

const childWindow = {};
const topSecurity = createMessageSecurity({
  frames: [{ contentWindow: childWindow, src: "https://javplayer.cc/e/demo" }],
});
assert.equal(
  topSecurity.acceptEvent({ source: childWindow, origin: "https://javplayer.cc" }),
  true,
  "a message from the actual supported child frame must be accepted",
);
assert.equal(
  topSecurity.acceptEvent({ source: {}, origin: "https://javplayer.cc" }),
  false,
  "a supported origin without the actual iframe window must be rejected",
);
assert.equal(
  topSecurity.acceptEvent({ source: childWindow, origin: "https://attacker.example" }),
  false,
  "an unknown child origin must be rejected",
);

const parentWindow = {};
const childSecurity = createMessageSecurity({
  parent: parentWindow,
  referrer: "https://123av.com/cn/v/example",
});
assert.equal(
  childSecurity.acceptEvent({ source: parentWindow, origin: "https://123av.com" }),
  true,
  "a supported direct parent matching document.referrer must be accepted",
);
assert.equal(
  childSecurity.acceptEvent({ source: parentWindow, origin: "https://missav.ai" }),
  false,
  "a supported but unrelated parent origin must be rejected",
);

const messageListener = section(
  'window.addEventListener("message", (function(o) {',
  '"key": "setupMutationObserver"',
);
const messageProtocol = section(
  "var normalizeMessageDepth = function normalizeMessageDepth(value) {",
  '"key": "setupMutationObserver"',
);
assert.match(
  messageListener,
  /if \(!MissPlayerMessageSecurity\.acceptEvent\(o\)\) {[\s\S]+return;/,
  "the message listener must authenticate the sender before handling actions",
);
assert.match(
  messageListener,
  /l\.version !== MISS_PLAYER_MESSAGE_VERSION/,
  "cross-frame control messages must reject incompatible message versions",
);
assert.match(
  messageProtocol,
  /var safeDetail = \{\};[\s\S]+Object\.assign\(safeDetail, \{[\s\S]+"source": "MissPlayer",[\s\S]+"action": action,[\s\S]+"version": MISS_PLAYER_MESSAGE_VERSION/,
  "message details must not be able to override protocol identity fields",
);
assert.match(
  messageProtocol,
  /Math\.min\(4, Math\.max\(0, Math\.floor\(numericDepth\)\)\)/,
  "cross-frame forwarding depth must be normalized and capped",
);
assert.doesNotMatch(
  messageListener,
  /"diagnostics"/,
  "cross-frame control messages must not expose page diagnostics",
);
assert.doesNotMatch(
  source,
  /postMessage\([\s\S]{0,500}?,\s*"\*"\)/,
  "cross-frame messages must use a concrete target origin",
);

const iframePatcher = section(
  '"key": "blockIframeLoading",',
  '"key": "blockPopups",',
);
assert.match(
  iframePatcher,
  /srcDescriptor\.set\.call\(this, a\)/,
  "allowed iframe src assignments must call the browser's native setter",
);

const playerCore = section("var l = function() {", "function DOMUtils_typeof");
assert.match(
  playerCore,
  /this\.presentationNode = MissPlayerNativeControls\.findRoot\(this\.targetVideo\) \|\| this\.targetVideo/,
  "theater mode must keep the video inside its existing player root when one is available",
);
assert.match(
  playerCore,
  /this\.preservePresentationInPlace = this\.presentationNode !== this\.targetVideo/,
  "library-backed players must preserve their media subtree in place",
);
assert.match(
  playerCore,
  /this\.originalNextSibling = this\.presentationNode\.nextSibling/,
  "player restoration must remember the exact sibling position",
);
assert.match(
  playerCore,
  /this\.targetVideo\.controls = this\.videoState\.controls/,
  "closing theater mode must restore native controls",
);
assert.match(
  playerCore,
  /this\.targetVideo\.setAttribute\("style", this\.originalStyle\)/,
  "closing theater mode must restore the complete original inline style",
);
assert.match(
  playerCore,
  /MissPlayerStatefulDOM\.move\(this\.originalParent, this\.presentationNode, this\.originalNextSibling\)/,
  "closing theater mode must preserve media state while restoring the player root's DOM position",
);

const statefulDOMSource = section(
  "var MissPlayerStatefulDOM = function() {",
  "var MissPlayerVideoSurfaceClick = function()",
);
const statefulDOM = new Function(
  `${statefulDOMSource}; return MissPlayerStatefulDOM;`,
)();
const ownerDocument = {};
const referenceNode = {};
const connectedVideo = { isConnected: true, ownerDocument };
const connectedParent = {
  isConnected: true,
  ownerDocument,
  moveBeforeCalls: 0,
  moveBefore(node, before) {
    this.moveBeforeCalls += 1;
    assert.equal(node, connectedVideo);
    assert.equal(before, referenceNode);
  },
};
referenceNode.parentNode = connectedParent;
assert.equal(
  statefulDOM.move(connectedParent, connectedVideo, referenceNode),
  true,
  "connected media must use the state-preserving moveBefore API when available",
);
assert.equal(connectedParent.moveBeforeCalls, 1);

const uiManager = section("var k = function() {", "function ControlManager_typeof");
assert.match(
  uiManager,
  /"key": "cleanup"[\s\S]+removeEventListener\("orientationchange"[\s\S]+removeEventListener\("resize"[\s\S]+removeEventListener\("loadedmetadata"/,
  "UIManager must release global and video listeners when theater mode closes",
);
assert.doesNotMatch(
  uiManager,
  /removeChild\(this\.targetVideo\)/,
  "opening theater mode must not disconnect the video before moving it",
);
assert.match(
  uiManager,
  /document\.body\.appendChild\(this\.playerContainer\);[\s\S]+MissPlayerStatefulDOM\.move\(this\.videoWrapper, this\.presentationNode, null\)/,
  "the destination wrapper must be connected before the intact player root is moved statefully",
);
assert.match(
  uiManager,
  /if \(this\.preservePresentationInPlace\) {[\s\S]+this\.presentationNode\.style\.setProperty\("position", "fixed", "important"\)[\s\S]+this\.targetVideo\.style\.setProperty\("object-fit", "contain", "important"\)/,
  "library-backed players must use in-place theater styling without reparenting media",
);
assert.match(
  uiManager,
  /criticalControls\.style\.cssText[\s\S]+position:fixed !important[\s\S]+bottom:10px !important[\s\S]+progressBarContainer\.style\.cssText[\s\S]+height:12px !important/,
  "in-place theater mode must keep custom controls and progress inside the viewport even without the bundled stylesheet",
);

const progressManager = section("var S = function() {", "function EventManager_typeof");
assert.match(
  progressManager,
  /"key": "cleanup"[\s\S]+removeEventListener\("timeupdate"/,
  "ProgressManager must release its video listener when theater mode closes",
);

const eventManager = section("var M = function() {", "function SettingsManager_typeof");
assert.match(
  eventManager,
  /if \(this\.onClose\) {[\s\S]+this\.onClose\(\)/,
  "the close button must delegate to the full player lifecycle cleanup",
);

const customPlayerClose = section(
  '"key": "close",',
  "function FloatingButton_typeof",
  source.indexOf("var T = function()"),
);
assert.ok(
  customPlayerClose.indexOf("this.managers[r].cleanup()") <
    customPlayerClose.indexOf("this.playerCore.close("),
  "manager cleanup must happen before the original video style is restored",
);

const debugInit = section("function init() {", "return {", source.indexOf("var MissPlayerDebug"));
assert.match(
  debugInit,
  /if \(debugEnabled\) {[\s\S]+logVideoEvents/,
  "the full-page debug observer must only run when debugging is enabled",
);

console.log("security and lifecycle regression checks passed");
