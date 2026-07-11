import "@testing-library/jest-dom/vitest";

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// jsdom does not implement media playback. Stub play()/pause() to dispatch the
// same "play"/"pause" events a real browser would, so components that derive
// their UI from those events behave the same way under test as in production.
if (typeof HTMLMediaElement !== "undefined") {
  HTMLMediaElement.prototype.play = function play() {
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  };
  HTMLMediaElement.prototype.pause = function pause() {
    this.dispatchEvent(new Event("pause"));
  };
}
