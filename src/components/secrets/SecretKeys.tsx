"use client";

import { useEffect, useEffectEvent } from "react";
import { useExperience, type CheatId } from "../shell/ExperienceProvider";

const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];

// Typed anywhere on the page (outside form fields). HESOYAM, AEZAKMI and
// ROCKETMAN come from GTA San Andreas; IDDQD is Doom's god mode.
export const CHEAT_CODES: Record<string, CheatId> = {
  HESOYAM: "hesoyam",
  AEZAKMI: "aezakmi",
  ROCKETMAN: "rocketman",
  IDDQD: "iddqd",
};

export function SecretKeys() {
  const { mode, switchMode, terminalOpen, setTerminalOpen, game, projectId, runCheat } = useExperience();

  const onKey = useEffectEvent((e: KeyboardEvent, state: { konami: number; typed: string }) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key.toLowerCase();

    if (key === "escape") {
      // Esc is the way back out of the creative mode, unless a dialog is open
      // (the dialog handles its own Esc first).
      if (!terminalOpen && !game && !projectId && mode === "criativo") switchMode("serio");
      return;
    }

    const target = e.target;
    const typing = target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']");
    if (typing || terminalOpen || game) return;

    if (e.key === "/") {
      e.preventDefault();
      setTerminalOpen(true);
      return;
    }

    state.konami = key === KONAMI[state.konami] ? state.konami + 1 : key === KONAMI[0] ? 1 : 0;
    if (state.konami === KONAMI.length) {
      state.konami = 0;
      runCheat("konami");
      return;
    }

    if (/^[a-z]$/.test(key)) {
      state.typed = (state.typed + key.toUpperCase()).slice(-12);
      const code = Object.keys(CHEAT_CODES).find((c) => state.typed.endsWith(c));
      if (code) {
        state.typed = "";
        runCheat(CHEAT_CODES[code]);
      }
    }
  });

  useEffect(() => {
    const state = { konami: 0, typed: "" };
    const handler = (e: KeyboardEvent) => onKey(e, state);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return null;
}
