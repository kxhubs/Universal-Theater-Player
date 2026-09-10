const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "universal-theater-player_greasyfork.user.js"),
  "utf8",
);

function section(start, end) {
  const startIndex = source.indexOf(start);
  assert.notEqual(startIndex, -1, `missing section start: ${start}`);
  const endIndex = source.indexOf(end, startIndex);
  assert.notEqual(endIndex, -1, `missing section end: ${end}`);
  return source.slice(startIndex, endIndex);
}

for (const domain of ["javrate.com", "eugenemakedraw.com"]) {
  const escaped = domain.replaceAll(".", "\\.");
  assert.match(
    source,
    new RegExp(`^// @match \\*:\\/\\/${escaped}\\/\\*$`, "m"),
    `${domain} pages must load the userscript`,
  );
  assert.match(
    source,
    new RegExp(`^// @match \\*:\\/\\/\\*\\.${escaped}\\/\\*$`, "m"),
    `${domain} subdomains must load the userscript`,
  );
}

for (const domain of [
  "supjav.com",
  "supremejav.com",
  "turbovidhls.com",
  "fc2stream.tv",
  "streamtape.com",
  "eugenemakedraw.com",
  "javrate.com",
]) {
  assert.match(
    section("var MissPlayerMessageSecurity", "var MissPlayerVideoSurfaceClick"),
    new RegExp(domain.replaceAll(".", "\\\\.")),
    `${domain} must be accepted by the authenticated iframe bridge`,
  );
}

const messageProtocol = section(
  '"key": "setupMessageListener",',
  '"key": "setupMutationObserver",',
);
assert.match(
  messageProtocol,
  /postToParent\("child-player-ready"/,
  "a child frame must announce readiness after its message listener is attached",
);
assert.match(
  messageProtocol,
  /"child-player-ready" === l\.action[\s\S]+forwardToChildFrames/,
  "an intermediate Supjav frame must immediately retry forwarding when its redirected child becomes ready",
);

const messageSecurity = section(
  "var MissPlayerMessageSecurity = function() {",
  "var MissPlayerVideoSurfaceClick = function()",
);
assert.match(
  messageSecurity,
  /knownFrameOrigins/,
  "the bridge must remember the actual origin reported by a redirected child frame",
);
assert.match(
  messageSecurity,
  /knownFrameOrigins\.get\(frame\.contentWindow\)/,
  "subsequent messages must target the redirected child's learned origin",
);

const redirectedWindow = {};
const redirectedFrame = {
  contentWindow: redirectedWindow,
  src: "https://voe.sx/e/demo",
  getAttribute() {
    return this.src;
  },
};
const windowMock = {};
windowMock.parent = windowMock;
const security = new Function(
  "window",
  "document",
  "location",
  "URL",
  `${messageSecurity}; return MissPlayerMessageSecurity;`,
)(
  windowMock,
  {
    referrer: "",
    querySelectorAll(selector) {
      assert.equal(selector, "iframe");
      return [redirectedFrame];
    },
  },
  { ancestorOrigins: [] },
  URL,
);
assert.equal(
  security.getFrameTargetOrigin(redirectedFrame),
  "https://voe.sx",
  "before the handshake, the bridge should target the iframe's declared origin",
);
assert.equal(
  security.acceptEvent({
    source: redirectedWindow,
    origin: "https://eugenemakedraw.com",
  }),
  true,
  "a readiness message from the actual redirected VOE iframe must be accepted",
);
assert.equal(
  security.getFrameTargetOrigin(redirectedFrame),
  "https://eugenemakedraw.com",
  "after the handshake, the bridge must target the iframe's actual redirected origin",
);

const framedWindowMock = {};
framedWindowMock.parent = {};
const blankReferrerSecurity = new Function(
  "window",
  "document",
  "location",
  "URL",
  `${messageSecurity}; return MissPlayerMessageSecurity;`,
)(
  framedWindowMock,
  {
    referrer: "",
    querySelectorAll() {
      return [];
    },
  },
  { ancestorOrigins: ["https://lk1.supremejav.com"] },
  URL,
);
assert.equal(
  blankReferrerSecurity.getParentTargetOrigin(),
  "https://lk1.supremejav.com",
  "a redirected VOE child with an empty referrer must securely discover its direct parent origin",
);

const nativeControlsSource = section(
  "var MissPlayerNativeControls = function() {",
  "var MissPlayerVideoSurfaceClick = function()",
);
let nativeControlsObserverCallback = null;
let nativeControlsObserverDisconnected = false;
let nativeControlsObserverTarget = null;
let nativeControlsObserverOptions = null;
class FakeMutationObserver {
  constructor(callback) {
    nativeControlsObserverCallback = callback;
  }

  observe(target, options) {
    nativeControlsObserverTarget = target;
    nativeControlsObserverOptions = options;
  }

  disconnect() {
    nativeControlsObserverDisconnected = true;
  }
}
const nativeControls = new Function(
  "MutationObserver",
  `${nativeControlsSource}; return MissPlayerNativeControls;`,
)(FakeMutationObserver);

function styledNode(originalStyle = null) {
  let styleAttribute = originalStyle;
  return {
    style: {
      display: "",
      priority: "",
      setProperty(name, value, priority) {
        assert.equal(name, "display");
        this.display = value;
        this.priority = priority;
        styleAttribute = `display:${value}${priority ? ` !${priority}` : ""}`;
      },
      getPropertyValue(name) {
        assert.equal(name, "display");
        return this.display;
      },
      getPropertyPriority(name) {
        assert.equal(name, "display");
        return this.priority;
      },
    },
    getAttribute(name) {
      assert.equal(name, "style");
      return styleAttribute;
    },
    setAttribute(name, value) {
      assert.equal(name, "style");
      styleAttribute = value;
    },
    removeAttribute(name) {
      assert.equal(name, "style");
      styleAttribute = null;
      this.style.display = "";
      this.style.priority = "";
    },
  };
}

const plyrControls = styledNode("opacity:.8");
const delayedPlyrControls = styledNode();
const unrelatedControls = styledNode("color:red");
const playerControls = [plyrControls];
const playerRoot = {
  querySelectorAll(selector) {
    assert.match(selector, /\.plyr__controls/);
    return playerControls;
  },
};
let videoInPlayerRoot = true;
const video = {
  ownerDocument: {
    documentElement: {},
  },
  closest(selector) {
    assert.match(selector, /\.plyr/);
    return videoInPlayerRoot ? playerRoot : null;
  },
};
const hiddenControls = nativeControls.hide(video);
assert.equal(plyrControls.style.display, "none");
assert.equal(plyrControls.style.priority, "important");
assert.equal(
  unrelatedControls.style.display,
  "",
  "controls outside the target player's root must remain untouched",
);
assert.equal(
  typeof nativeControlsObserverCallback,
  "function",
  "native controls must keep watching for a player library that creates its controls after theater mode opens",
);
assert.equal(
  nativeControlsObserverTarget,
  playerRoot,
  "native control observation must stay attached to the original player root",
);
assert.deepEqual(
  nativeControlsObserverOptions.attributeFilter,
  ["class", "style"],
  "native control observation must catch player libraries restoring their control styles",
);
videoInPlayerRoot = false;
plyrControls.style.display = "flex";
plyrControls.style.priority = "";
playerControls.push(delayedPlyrControls);
nativeControlsObserverCallback([]);
assert.equal(
  plyrControls.style.display,
  "none",
  "the original Plyr controls must be hidden again after the site restores them",
);
assert.equal(
  delayedPlyrControls.style.display,
  "none",
  "a delayed Plyr control bar must also be hidden while theater mode remains open",
);
nativeControls.restore(hiddenControls);
assert.equal(
  plyrControls.getAttribute("style"),
  "opacity:.8",
  "closing theater mode must restore the site's exact inline control style",
);
assert.equal(
  delayedPlyrControls.getAttribute("style"),
  null,
  "closing theater mode must restore a delayed control bar's original style",
);
assert.equal(
  nativeControlsObserverDisconnected,
  true,
  "closing theater mode must stop watching the site's native controls",
);

const playerCore = section("var l = function() {", "function DOMUtils_typeof");
assert.match(
  playerCore,
  /this\.nativeControlsState = MissPlayerNativeControls\.hide\(this\.targetVideo\)/,
  "opening theater mode must hide the selected site's native control layer",
);
assert.match(
  playerCore,
  /MissPlayerNativeControls\.restore\(this\.nativeControlsState\)/,
  "closing theater mode must restore the selected site's native control layer",
);

console.log("site adapter regression checks passed");
