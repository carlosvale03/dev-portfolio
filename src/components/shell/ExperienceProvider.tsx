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
export type GameId = "snake" | "pong" | "penalty";
export type CheatId = "konami" | "hesoyam" | "aezakmi" | "rocketman" | "iddqd";
export type ToastKind = "secret" | "cheat" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
  action?: { label: string; run: () => void };
}

export interface CheatFx {
  id: "hesoyam" | "aezakmi";
  key: number;
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

  const runCheat = (id: CheatId) => {
    const root = document.documentElement;
    if (id === "konami") {
      unlock("konami");
      setGame("penalty");
      return;
    }
    const isNew = secretStore.add(id);
    const suffix = isNew ? ` · ${ui.secrets.unlocked.toLowerCase()} ${counter()}` : "";
    if (id === "rocketman") {
      const next = !rocket;
      setRocket(next);
      root.dataset.rocket = String(next);
      pushToast({
        kind: "cheat",
        title: ui.secrets.cheatActivated,
        body: next ? `${ui.secrets.messages.rocketman}${suffix}` : "ROCKETMAN off",
      });
      return;
    }
    if (id === "hesoyam" || id === "aezakmi") setCheat({ id, key: Date.now() });
    if (id === "hesoyam") {
      root.dataset.shake = "true";
      window.setTimeout(() => delete root.dataset.shake, 500);
    }
    if (id === "iddqd") {
      root.dataset.god = "true";
      window.setTimeout(() => delete root.dataset.god, 10000);
    }
    pushToast({ kind: "cheat", title: ui.secrets.cheatActivated, body: `${ui.secrets.messages[id]}${suffix}` });
  };

  const scoreGoal = () => {
    goals.current += 1;
    if (goals.current === 3) unlock("hattrick");
  };

  const openGame = (id: GameId) => {
    setTerminalOpen(false);
    setGame(id);
    if (id === "snake" || id === "pong") unlock(id);
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
    scoreGoal,
  };

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}
