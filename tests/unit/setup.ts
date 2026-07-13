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

// jsdom does not implement scroll APIs; stub them so scroll-driven
// components (e.g. the timeline) can be exercised and asserted on in tests.
if (typeof Element !== "undefined" && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo(
    this: Element,
    optionsOrX?: ScrollToOptions | number,
    y?: number,
  ) {
    if (typeof optionsOrX === "object" && optionsOrX !== null) {
      if (typeof optionsOrX.top === "number") {
        this.scrollTop = optionsOrX.top;
      }
      if (typeof optionsOrX.left === "number") {
        this.scrollLeft = optionsOrX.left;
      }
    } else {
      if (typeof optionsOrX === "number") {
        this.scrollLeft = optionsOrX;
      }
      if (typeof y === "number") {
        this.scrollTop = y;
      }
    }
  };
}

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// jsdom's requestAnimationFrame is real and timer-based, so any component
// that polls scroll position on rAF (e.g. the timeline's car position, see
// src/timeline/Timeline.tsx) can fire a state update asynchronously after a
// test's render() call already returned, triggering "not wrapped in act()"
// warnings in tests that never intended to exercise frame-by-frame
// behavior. Default to a no-op so only tests that explicitly stub rAF
// themselves (see tests/unit/timeline.test.tsx) exercise that polling.
if (typeof globalThis.requestAnimationFrame !== "undefined") {
  globalThis.requestAnimationFrame = (() => 0) as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = (() => {}) as typeof cancelAnimationFrame;
}

// jsdom does not implement IntersectionObserver; stub a no-op version so
// components that use it for offscreen pausing (e.g. the 3D model viewer)
// can mount under test. Tests that need to simulate visibility changes
// should stub this globally themselves.
if (typeof globalThis.IntersectionObserver === "undefined") {
  class NoopIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  globalThis.IntersectionObserver =
    NoopIntersectionObserver as unknown as typeof IntersectionObserver;
}
