"use client";

import { useSyncExternalStore } from "react";
import { readJSON, writeJSON } from "./storage";

// A boolean persisted in localStorage, readable during render without a
// hydration mismatch (the server always sees `serverValue`).
const flagListeners = new Set<() => void>();

export function useStoredFlag(key: string, serverValue = false) {
  const value = useSyncExternalStore(
    (l) => {
      flagListeners.add(l);
      return () => flagListeners.delete(l);
    },
    () => readJSON<boolean>(key, false),
    () => serverValue,
  );
  const set = (next: boolean) => {
    writeJSON(key, next);
    flagListeners.forEach((l) => l());
  };
  return [value, set] as const;
}

export type MotionPref = "on" | "off";
const prefListeners = new Set<() => void>();

/** The visitor's animation choice, persisted; animations are on by default. */
export function useMotionPref() {
  const value = useSyncExternalStore(
    (l) => {
      prefListeners.add(l);
      return () => prefListeners.delete(l);
    },
    () => (readJSON<string>("cv:motion", "on") === "off" ? "off" : "on") as MotionPref,
    () => "on" as MotionPref,
  );
  const set = (next: MotionPref) => {
    writeJSON("cv:motion", next);
    prefListeners.forEach((l) => l());
  };
  return [value, set] as const;
}

// Current time in Picos (America/Fortaleza), ticking every 15 seconds.
const clockFormat = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Fortaleza",
});

export function usePicosTime() {
  return useSyncExternalStore(
    (l) => {
      const id = window.setInterval(l, 15000);
      return () => window.clearInterval(id);
    },
    () => clockFormat.format(Date.now()),
    () => "--:--",
  );
}
