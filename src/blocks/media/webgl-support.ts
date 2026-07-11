import { useSyncExternalStore } from "react";

function isWebglSupported() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

function subscribe() {
  return () => {};
}

function getServerSnapshot() {
  return false;
}

export function useWebglSupport() {
  return useSyncExternalStore(subscribe, isWebglSupported, getServerSnapshot);
}
