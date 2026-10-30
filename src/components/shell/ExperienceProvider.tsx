"use client";

import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SECRETS, type Content, type SecretId } from "@/content";
import { secretStore } from "@/lib/secret-store";
import { useMotionPref, type MotionPref } from "@/lib/external";

export type Mode = "serio" | "criativo";
export type GameId = "snake" | "pong" | "penalty" | "sobrecarga";
export type CheatId =
  | "konami"
  | "hesoyam"
  | "aezakmi"
  | "rocketman"
  | "iddqd"
  | "lxgiwyl"
  | "aiwprton"
  | "cpktnwt"
  | "turnuptheheat"
  | "ninjatown";
/** What a click does while a San Andreas cheat is armed. */
export type Armed = "guns" | "tank" | "ninja" | null;
export type ToastKind = "secret" | "cheat" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
  action?: { label: string; run: () => void };
}

export interface CheatFx {
  id: "hesoyam" | "aezakmi" | "cpktnwt";
  key: number;
}

export interface GtaState {
  /** The HUD stays up from the first San Andreas cheat until it is closed. */
  hud: boolean;
  armed: Armed;
  wanted: number;
  money: number;
}

type Cut = { to: Mode; phase: "cover" | "reveal" } | null;

interface ExperienceValue {
  content: Content;
  mode: Mode;
  cut: Cut;
  switchMode: (to?: Mode) => void;
  onCutCovered: () => void;
  onCutRevealed: () => void;
  reducedMotion: boolean;
  motionPref: MotionPref;
  setMotionPref: (pref: MotionPref) => void;

  found: readonly SecretId[];
  total: number;
  unlock: (id: SecretId) => void;

  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: number) => void;

  terminalOpen: boolean;
  setTerminalOpen: (open: boolean) => void;
  game: GameId | null;
  openGame: (id: GameId) => void;
  closeGame: () => void;
  projectId: string | null;
  openProject: (id: string) => void;
  closeProject: () => void;

  cheat: CheatFx | null;
  runCheat: (id: CheatId) => void;
  rocket: boolean;
  gta: GtaState;
  setArmed: (armed: Armed) => void;
  addWanted: (stars: number) => void;
  clearWanted: () => void;
  closeGta: () => void;
  manualOpen: boolean;
  setManualOpen: (open: boolean) => void;
  scoreGoal: () => void;
}

const ExperienceContext = createContext<ExperienceValue | null>(null);

export function useExperience() {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error("useExperience must be used inside <ExperienceProvider>");
  return ctx;
}

export function ExperienceProvider({ content, children }: { content: Content; children: ReactNode }) {
  const { ui } = content;
  // Animations are on by default; visitors can turn them off in the footer.
  const [motionPref, setMotionPref] = useMotionPref();
  const reducedMotion = motionPref === "off";
  const [mode, setMode] = useState<Mode>("serio");
  const [cut, setCut] = useState<Cut>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [game, setGame] = useState<GameId | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [cheat, setCheat] = useState<CheatFx | null>(null);
  const [rocket, setRocket] = useState(false);
  const [gta, setGta] = useState<GtaState>({ hud: false, armed: null, wanted: 0, money: 0 });
  const [manualOpen, setManualOpen] = useState(false);
  const goals = useRef(0);
  const toastId = useRef(0);
  const found = useSyncExternalStore(secretStore.subscribe, secretStore.get, secretStore.getServer);

  const pushToast = (toast: Omit<ToastItem, "id">) => {
    const id = ++toastId.current;
    setToasts((list) => [...list.slice(-2), { ...toast, id }]);
  };
  const dismissToast = (id: number) => setToasts((list) => list.filter((t) => t.id !== id));

  const counter = () => `${secretStore.get().length}/${SECRETS.length}`;

  const unlock = (id: SecretId) => {
    if (!secretStore.add(id)) return;
    const message = ui.secrets.messages[id];
    pushToast({
      kind: "secret",
      title: `${ui.secrets.unlocked} · ${counter()}`,
      body: message ? `${ui.secrets.names[id]}. ${message}` : ui.secrets.names[id],
    });
  };

  const applyMode = (next: Mode) => {
    setMode(next);
    window.scrollTo({ top: 0, behavior: "instant" });
    const url = new URL(window.location.href);
    if (next === "criativo") url.searchParams.set("modo", "criativo");
    else url.searchParams.delete("modo");
    window.history.replaceState(null, "", url);
    // Move focus to the new content so screen readers follow the swap.
    requestAnimationFrame(() => document.getElementById("conteudo")?.focus({ preventScroll: true }));
  };

  const switchMode = (to?: Mode) => {
    const next = to ?? (mode === "serio" ? "criativo" : "serio");
    if (next === mode || cut) return;
    if (reducedMotion) applyMode(next);
    else setCut({ to: next, phase: "cover" });
  };

  const onCutCovered = () => {
    if (!cut || cut.phase !== "cover") return;
    applyMode(cut.to);
    setCut({ to: cut.to, phase: "reveal" });
  };
  const onCutRevealed = () => setCut(null);

  const addWanted = (stars: number) => setGta((g) => ({ ...g, hud: true, wanted: Math.min(6, g.wanted + stars) }));
  const clearWanted = () => setGta((g) => ({ ...g, wanted: 0 }));
  const setArmed = (armed: Armed) => setGta((g) => ({ ...g, hud: g.hud || !!armed, armed }));
  const closeGta = () => setGta((g) => ({ ...g, hud: false, armed: null, wanted: 0 }));

  const runCheat = (id: CheatId) => {
    const root = document.documentElement;
    if (id === "konami") {
      unlock("konami");
      setGame("penalty");
      return;
    }
    const isNew = secretStore.add(id);
    const suffix = isNew ? ` · ${ui.secrets.unlocked.toLowerCase()} ${counter()}` : "";
    const toast = (body: string, on = true) =>
      pushToast({ kind: "cheat", title: on ? ui.secrets.cheatActivated : ui.secrets.cheatOff, body: on ? `${body}${suffix}` : body });

    if (id === "rocketman") {
      const next = !rocket;
      setRocket(next);
      root.dataset.rocket = String(next);
      toast(next ? ui.secrets.messages.rocketman! : "ROCKETMAN", next);
      return;
    }
    // San Andreas cheats that take over the click: typing one again turns it off.
    const armedBy = { lxgiwyl: "guns", aiwprton: "tank", ninjatown: "ninja" } as const;
    if (id === "lxgiwyl" || id === "aiwprton" || id === "ninjatown") {
      const next = gta.armed === armedBy[id] ? null : armedBy[id];
      setArmed(next);
      toast(next ? ui.secrets.messages[id]! : id.toUpperCase(), !!next);
      return;
    }
    if (id === "hesoyam" || id === "aezakmi" || id === "cpktnwt") setCheat({ id, key: Date.now() });
    if (id === "hesoyam") setGta((g) => ({ ...g, hud: true, money: g.money + 250000 }));
    if (id === "aezakmi") clearWanted();
    // Blowing everything up draws the police, like in the game.
    if (id === "cpktnwt") addWanted(1);
    if (id === "turnuptheheat") addWanted(2);
    if (id === "iddqd") {
      root.dataset.god = "true";
      window.setTimeout(() => delete root.dataset.god, 10000);
    }
    toast(ui.secrets.messages[id] ?? id.toUpperCase());
  };

  const scoreGoal = () => {
    goals.current += 1;
    if (goals.current === 3) unlock("hattrick");
  };

  const openGame = (id: GameId) => {
    setTerminalOpen(false);
    setGame(id);
    if (id === "snake" || id === "pong" || id === "sobrecarga") unlock(id);
  };

  // Deep link: /pt?modo=criativo opens straight into the creative mode, with the
  // cut-in transition acting as an intro.
  const openFromDeepLink = useEffectEvent(() => {
    if (new URLSearchParams(window.location.search).get("modo") === "criativo") switchMode("criativo");
  });
  useEffect(() => {
    // After the first paint, so the transition plays as an intro.
    const id = requestAnimationFrame(() => openFromDeepLink());
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";
  }, [reducedMotion]);

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", mode === "criativo" ? "#0e0e0e" : "#f4f2ec");
  }, [mode]);

  const value: ExperienceValue = {
    content,
    mode,
    cut,
    switchMode,
    onCutCovered,
    onCutRevealed,
    reducedMotion,
    motionPref,
    setMotionPref,
    found,
    total: SECRETS.length,
    unlock,
    toasts,
    pushToast,
    dismissToast,
    terminalOpen,
    setTerminalOpen: (open) => {
      setTerminalOpen(open);
      if (open) unlock("terminal");
    },
    game,
    openGame,
    closeGame: () => setGame(null),
    projectId,
    openProject: setProjectId,
    closeProject: () => setProjectId(null),
    cheat,
    runCheat,
    rocket,
    gta,
    setArmed,
    addWanted,
    clearWanted,
    closeGta,
    manualOpen,
    setManualOpen: (open) => {
      setManualOpen(open);
      if (open) setTerminalOpen(false);
    },
    scoreGoal,
  };

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}
