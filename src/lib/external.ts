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

// The "animations off" choice lasts for the current visit only (sessionStorage),
// so every new visit starts animated. Older builds kept it in localStorage
// forever; that copy is dropped the first time it is read.
const MOTION_KEY = "cv:motion";

function readMotion(): MotionPref {
  try {
    window.localStorage.removeItem(MOTION_KEY);
    return window.sessionStorage.getItem(MOTION_KEY) === "off" ? "off" : "on";
  } catch {
    return "on";
  }
}

/** The visitor's animation choice for this visit; animations are on by default. */
export function useMotionPref() {
  const value = useSyncExternalStore(
    (l) => {
      prefListeners.add(l);
      return () => prefListeners.delete(l);
    },
    readMotion,
    () => "on" as MotionPref,
  );
  const set = (next: MotionPref) => {
    try {
      window.sessionStorage.setItem(MOTION_KEY, next);
    } catch {
      /* persistence is optional */
    }
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
