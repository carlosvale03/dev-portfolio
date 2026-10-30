import type { MoveId } from "./moves";

// The opponents are bugs from a developer's life, each with its own body,
// colour and fighting habits. The tournament climbs from localhost to
// production, where the legacy code waits.

export type Kind = "bug" | "race" | "leak" | "deadlock" | "null" | "legacy";
export type Head = "round" | "antenna" | "square" | "ring" | "crt";

export interface Archetype {
  name: { pt: string; en: string };
  hp: number;
  scale: number;
  color: string;
  head: Head;
  walk: number;
  /** 0..1: how often it presses an attack when in range. */
  aggression: number;
  /** Delay before it reacts to the player, ms. */
  reaction: number;
  block: number;
  roll: number;
  /** Longest chain it strings together. */
  combo: number;
  moves: MoveId[];
  /** Heavy hits do not knock it down unless they are launchers. */
  heavy?: boolean;
  ranged?: boolean;
  points: number;
}

export const ROSTER: Record<Kind, Archetype> = {
  bug: {
    name: { pt: "Bug", en: "Bug" },
    hp: 70, scale: 1, color: "#9a9890", head: "antenna",
    walk: 170, aggression: 0.45, reaction: 420, block: 0.12, roll: 0.05, combo: 2,
    moves: ["jab", "cross", "frontKick", "grab"],
    points: 100,
  },
  race: {
    name: { pt: "Race Condition", en: "Race Condition" },
    hp: 70, scale: 0.94, color: "#e8613a", head: "round",
    walk: 300, aggression: 0.58, reaction: 300, block: 0.1, roll: 0.35, combo: 3,
    moves: ["jab", "cross", "hook", "frontKick", "roundhouse", "airKick", "sweep"],
    points: 160,
  },
  leak: {
    name: { pt: "Memory Leak", en: "Memory Leak" },
    hp: 170, scale: 1.24, color: "#d9a441", head: "round",
    walk: 120, aggression: 0.5, reaction: 520, block: 0.05, roll: 0, combo: 2,
    moves: ["haymaker", "cross", "grab", "stomp"],
    heavy: true,
    points: 240,
  },
  deadlock: {
    name: { pt: "Deadlock", en: "Deadlock" },
    hp: 110, scale: 1.04, color: "#7f9bb8", head: "square",
    walk: 160, aggression: 0.38, reaction: 220, block: 0.62, roll: 0.15, combo: 3,
    moves: ["jab", "cross", "roundhouse", "spinKick", "uppercut", "grab"],
    points: 220,
  },
  null: {
    name: { pt: "Null Pointer", en: "Null Pointer" },
    hp: 60, scale: 0.96, color: "#a77bd6", head: "ring",
    walk: 200, aggression: 0.55, reaction: 360, block: 0.08, roll: 0.3, combo: 1,
    moves: ["throwOrb", "frontKick", "jab"],
    ranged: true,
    points: 180,
  },
  legacy: {
    name: { pt: "Código Legado", en: "Legacy Code" },
    hp: 640, scale: 1.4, color: "#6fcf73", head: "crt",
    walk: 150, aggression: 0.62, reaction: 300, block: 0.25, roll: 0.05, combo: 3,
    moves: ["haymaker", "hook", "roundhouse", "spinKick", "stomp", "uppercut", "grab", "throwOrb"],
    heavy: true,
    points: 2000,
  },
};

export interface Stage {
  name: string;
  waves: Kind[][];
  /** How many enemies may attack at the same time. */
  attackers: number;
}

export const STAGES: Stage[] = [
  { name: "localhost", waves: [["bug"], ["bug", "bug"]], attackers: 1 },
  { name: "dev", waves: [["race"], ["bug", "race"], ["bug", "bug", "race"]], attackers: 1 },
  { name: "staging", waves: [["leak"], ["null", "bug"], ["race", "race", "null"]], attackers: 2 },
  { name: "homologação", waves: [["deadlock"], ["leak", "deadlock"], ["race", "null", "deadlock", "bug"]], attackers: 2 },
  { name: "produção", waves: [["legacy"]], attackers: 2 },
];

/** Endless waves after production: bigger and meaner each time. */
export function endlessWave(n: number): Kind[] {
  const pool: Kind[] = ["bug", "race", "leak", "deadlock", "null"];
  const count = Math.min(5, 2 + Math.floor(n / 2));
  const wave: Kind[] = [];
  for (let i = 0; i < count; i++) wave.push(pool[(n * 3 + i * 2) % pool.length]);
  if (n % 5 === 4) wave[0] = "legacy";
  return wave;
}
