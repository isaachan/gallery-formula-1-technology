import { useSyncExternalStore } from "react";

type NetworkInformation = EventTarget & {
  saveData?: boolean;
};

function getConnection(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation })
    .connection;
}

function subscribe(onChange: () => void) {
  const connection = getConnection();
  if (!connection) {
    return () => {};
  }
  connection.addEventListener("change", onChange);
  return () => connection.removeEventListener("change", onChange);
}

function getSnapshot() {
  return Boolean(getConnection()?.saveData);
}

function getServerSnapshot() {
  return false;
}

/** True when the browser reports a data-saver preference (Network Information API's saveData). */
export function useSaveDataPreference() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
