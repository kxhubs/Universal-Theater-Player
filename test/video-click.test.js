const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "universal-theater-player_greasyfork.user.js"),
  "utf8",
);

const helperStart = source.indexOf("var MissPlayerVideoSurfaceClick = function() {");
assert.notEqual(helperStart, -1, "missing theater video click controller");
const helperEnd = source.indexOf("var MissPlayerDebug = function()", helperStart);
assert.notEqual(helperEnd, -1, "missing theater video click controller end");
const helperSource = source.slice(helperStart, helperEnd);
const clickController = new Function(
  `${helperSource}; return MissPlayerVideoSurfaceClick;`,
)();

function createFixture({ paused = false, controlsVisible = false } = {}) {
  const calls = {
    play: 0,
    pause: 0,
    showControls: 0,
    autoHideControls: 0,
    updateButton: 0,
    showPause: 0,
    stop: 0,
  };
  const video = {
    paused,
    play() {
      calls.play += 1;
      this.paused = false;
      return Promise.resolve();
    },
    pause() {
      calls.pause += 1;
      this.paused = true;
    },
  };
  const manager = {
    controlsVisible,
    isLandscape: true,
    playerCore: {
      targetVideo: video,
      controlManager: {
        updatePlayPauseButton() {
          calls.updateButton += 1;
        },
        showPauseIndicator() {
          calls.showPause += 1;
        },
      },
    },
    isCompactPortraitMode() {
      return false;
    },
    showControls() {
      calls.showControls += 1;
      this.controlsVisible = true;
    },
    autoHideControls() {
      calls.autoHideControls += 1;
    },
  };
  const event = {
    target: {
      closest() {
        return null;
      },
    },
    stopImmediatePropagation() {
      calls.stop += 1;
    },
  };
  return { calls, event, manager, video };
}

const hidden = createFixture({ paused: false, controlsVisible: false });
assert.equal(clickController.handle(hidden.manager, hidden.event, false), "revealed");
assert.equal(hidden.calls.showControls, 1, "a hidden panel click must reveal controls");
assert.equal(hidden.calls.autoHideControls, 1, "revealed controls must resume auto-hide");
assert.equal(hidden.calls.pause, 0, "the reveal click must not pause a playing video");
assert.equal(hidden.calls.play, 0, "the reveal click must not start a paused video");

assert.equal(clickController.handle(hidden.manager, hidden.event, false), "paused");
assert.equal(hidden.calls.pause, 1, "the next surface click must pause exactly once");
assert.equal(hidden.calls.stop, 2, "surface clicks must not reach the site's player handler");

const paused = createFixture({ paused: true, controlsVisible: true });
assert.equal(clickController.handle(paused.manager, paused.event, false), "played");
assert.equal(paused.calls.play, 1, "a visible-panel click must start a paused video once");

const interactive = createFixture({ paused: false, controlsVisible: true });
interactive.event.target.closest = (selector) => {
  assert.match(selector, /tm-progress-bar-container/);
  return {};
};
assert.equal(clickController.handle(interactive.manager, interactive.event, false), "ignored");
assert.equal(interactive.calls.pause, 0, "buttons and timelines must not toggle playback");
assert.equal(interactive.calls.stop, 0, "interactive controls must receive their own click");

const longPress = createFixture({ paused: false, controlsVisible: true });
assert.equal(clickController.handle(longPress.manager, longPress.event, true), "ignored");
assert.equal(longPress.calls.pause, 0, "finishing long-press speed mode must not toggle playback");

const wrapperFactoryStart = source.indexOf('"key": "createVideoWrapper"');
const wrapperFactoryEnd = source.indexOf('"key": "createResizeHandle"', wrapperFactoryStart);
const wrapperFactory = source.slice(wrapperFactoryStart, wrapperFactoryEnd);
assert.match(
  wrapperFactory,
  /this\.surfaceEventTarget = this\.preservePresentationInPlace \? this\.presentationNode : this\.videoWrapper[\s\S]+this\.surfaceEventTarget\.addEventListener\("click", this\.handleVideoClickBound, true\)/,
  "the click controller must run in capture phase before retained site-player handlers",
);
assert.match(
  source,
  /\.plyr__control--overlaid[\s\S]+\.vjs-big-play-button[\s\S]+\.jw-display-container/,
  "native center play and pause overlays must be hidden with the original controls",
);
assert.match(
  source,
  /var indicatorHost = this\.uiElements\.playerContainer \|\| this\.uiElements\.videoWrapper[\s\S]+indicatorHost\.appendChild\(this\.pauseIndicator\)/,
  "the custom pause indicator must render above retained site-player DOM",
);
assert.match(
  source,
  /this\.surfaceEventTarget\.removeEventListener\("click", this\.handleVideoClickBound, true\)/,
  "closing theater mode must remove the captured surface click handler",
);

console.log("video click regression checks passed");
